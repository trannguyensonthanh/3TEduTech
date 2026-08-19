#!/usr/bin/env bash
# =============================================================================
# 02-chay-migration.sh — Áp dụng migration lên RDS SQL Server
# =============================================================================
# [THÊM 18/08/2026]
#
# ★ VÌ SAO CẦN SCRIPT NÀY — ĐÂY LÀ LỖ HỔNG LỚN NHẤT CỦA BẢN TRIỂN KHAI CŨ
#
# `docker-compose.cpu-ec2.yml` KHÔNG có service `database-init`, và
# `.github/workflows/deploy.yml` cũng không có bước nào chạy Flyway. Nghĩa là
# lược đồ cơ sở dữ liệu trên production KHÔNG BAO GIỜ được cập nhật: bạn thêm
# một migration mới, deploy thành công, container xanh hết — rồi backend đổ ở
# runtime với "Invalid object name". Chính xác kiểu lỗi đã gặp với bảng FAQs.
#
# -----------------------------------------------------------------------------
# ★ RDS SQL SERVER KHÔNG CHẠY ĐƯỢC V1__init.sql NGUYÊN BẢN
#
# V1 được kết xuất từ SQL Server cài trên máy cá nhân, nên nó chứa hàng loạt
# lệnh cấu hình cấp INSTANCE mà RDS cố tình chặn — tài khoản chủ của RDS không
# phải `sysadmin`:
#
#   • EXEC sp_fulltext_database              → cần sysadmin
#   • ALTER DATABASE ... SET RECOVERY FULL   → RDS tự quản lý mô hình phục hồi
#   • ALTER DATABASE ... SET TRUSTWORTHY     → bị chặn (rủi ro leo thang quyền)
#   • ALTER DATABASE ... SET FILESTREAM      → RDS không hỗ trợ
#   • ALTER DATABASE ... SET DISABLE_BROKER  → bị chặn
#   • ALTER DATABASE ... SET TARGET_RECOVERY_TIME / ACCELERATED_DATABASE_RECOVERY
#   • ALTER DATABASE ... SET MULTI_USER / READ_WRITE
#
# Không một lệnh nào trong số đó ảnh hưởng tới ứng dụng — chúng chỉ là phần
# "kết xuất đầy đủ" mà SSMS luôn sinh ra. Vì vậy script này TỰ ĐỘNG LỌC BỎ
# chúng vào một bản sao tạm, và KHÔNG đụng tới db-init/V1__init.sql gốc (bản
# gốc vẫn cần nguyên vẹn cho SQL Server chạy trong Docker ở máy dev).
#
# ⚠️ Vì bản dùng cho RDS đã bị lọc, checksum của nó KHÁC bản dev. Không sao:
#    mỗi cơ sở dữ liệu có bảng `flyway_schema_history` riêng, hai bên không
#    nhìn thấy nhau.
#
# -----------------------------------------------------------------------------
# CÁCH DÙNG
#
#     sudo bash 02-chay-migration.sh
#
# Script đọc thông tin kết nối từ 3t-edu-tech-backend/.env.production, nên
# KHÔNG có mật khẩu nào nằm trong tệp này.
#
# An toàn khi chạy lại: Flyway bỏ qua các migration đã áp dụng.
# =============================================================================

set -euo pipefail

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
buoc()     { echo -e "\n${GREEN}==> $*${NC}"; }
canh_bao() { echo -e "${YELLOW}[!] $*${NC}"; }
loi()      { echo -e "${RED}[LỖI] $*${NC}" >&2; }

THU_MUC_APP="${THU_MUC_APP:-/opt/3t-edu-tech}"
TEP_ENV="${THU_MUC_APP}/3t-edu-tech-backend/.env.production"
THU_MUC_SQL="${THU_MUC_APP}/db-init"
THU_MUC_TAM="/tmp/flyway-sql-rds"

# Ghim phiên bản Flyway. Dùng `:latest` nghĩa là một ngày nào đó Flyway lên bản
# mới, đổi hành vi mặc định, và migration hỏng mà không ai đổi gì cả.
ANH_FLYWAY="flyway/flyway:10-alpine"
ANH_SQLCMD="mcr.microsoft.com/mssql-tools18:latest"

# ---------------------------------------------------------------------------
buoc "1/5 — Đọc cấu hình kết nối"
# ---------------------------------------------------------------------------
if [[ ! -f "${TEP_ENV}" ]]; then
  loi "Không tìm thấy ${TEP_ENV}"
  loi "Hãy tạo tệp đó trước (xem Phần 4 của HUONG_DAN_TRIEN_KHAI_AWS.md)."
  exit 1
fi

# Đọc từng khóa một thay vì `source` cả tệp.
#
# ★ `source .env.production` là cái bẫy: tệp env chứa mật khẩu có ký tự đặc
# biệt ($ ` " \), và `source` sẽ DIỄN GIẢI chúng như mã shell. Một mật khẩu
# chứa `$(` là đủ để thực thi lệnh tùy ý. Ngoài ra nó còn nạp ~60 biến vào môi
# trường, trong đó có mọi khóa thanh toán — thứ không cần cho việc migration.
doc_env() {
  local khoa="$1"
  # `cut -d= -f2-` giữ nguyên mọi dấu `=` phía sau (mật khẩu hay có).
  grep -m1 "^${khoa}=" "${TEP_ENV}" 2>/dev/null | cut -d= -f2- | tr -d '\r' || true
}

DB_HOST="$(doc_env DB_HOST)"
DB_PORT="$(doc_env DB_PORT)"; DB_PORT="${DB_PORT:-1433}"
DB_USER="$(doc_env DB_USER)"
DB_PASSWORD="$(doc_env DB_PASSWORD)"
DB_NAME="$(doc_env DB_NAME)"; DB_NAME="${DB_NAME:-ThreeTEduTechLMS}"

for bien in DB_HOST DB_USER DB_PASSWORD; do
  if [[ -z "${!bien}" ]]; then
    loi "Thiếu ${bien} trong ${TEP_ENV}"
    exit 1
  fi
done

echo "  Máy chủ : ${DB_HOST}:${DB_PORT}"
echo "  CSDL    : ${DB_NAME}"
echo "  Tài khoản: ${DB_USER}"

# ---------------------------------------------------------------------------
buoc "2/5 — Kiểm tra kết nối tới RDS"
# ---------------------------------------------------------------------------
# `-C` = tin chứng chỉ máy chủ. Bắt buộc với mssql-tools18: từ bản 18, sqlcmd
# BẬT mã hóa mặc định và sẽ từ chối chứng chỉ tự ký của RDS nếu thiếu cờ này.
# Đây là nguyên nhân số một của lỗi "SSL Provider: certificate verify failed"
# khi nâng từ mssql-tools (17) lên 18.
if ! docker run --rm "${ANH_SQLCMD}" \
      /opt/mssql-tools18/bin/sqlcmd \
      -S "${DB_HOST},${DB_PORT}" -U "${DB_USER}" -P "${DB_PASSWORD}" -C \
      -l 15 -Q "SELECT @@VERSION" 2>&1 | tail -5; then
  loi "Không kết nối được tới RDS."
  cat <<'CHAN_DOAN'

Kiểm tra theo thứ tự:

  1. Security Group của RDS có cho phép cổng 1433 TỪ security group của EC2 không?
     Phải là "nguồn = sg-xxxx của EC2", KHÔNG phải 0.0.0.0/0.

  2. RDS và EC2 có cùng VPC không?  (khác VPC thì phải peering)

  3. DB_HOST có đúng là endpoint của RDS không? Dạng:
       ten-instance.xxxxxxxx.ap-northeast-1.rds.amazonaws.com
     KHÔNG phải địa chỉ IP, và KHÔNG kèm cổng ở cuối.

  4. Mật khẩu có ký tự đặc biệt bị shell nuốt mất không? Thử đặt trong nháy đơn.

CHAN_DOAN
  exit 1
fi
echo "  ✅ Kết nối được."

# ---------------------------------------------------------------------------
buoc "3/5 — Tạo cơ sở dữ liệu nếu chưa có"
# ---------------------------------------------------------------------------
# ★ VÌ SAO TẠO Ở ĐÂY MÀ KHÔNG ĐỂ V1 TẠO
#
# Nếu để Flyway kết nối vào `master` rồi chạy `CREATE DATABASE` trong V1, thì
# bảng lịch sử `flyway_schema_history` sẽ nằm trong `master` — nơi RDS hạn chế
# việc tạo đối tượng. Tạo CSDL trước rồi cho Flyway kết nối THẲNG vào nó khiến
# bảng lịch sử nằm đúng chỗ, cùng nơi với dữ liệu mà nó mô tả.
docker run --rm "${ANH_SQLCMD}" \
  /opt/mssql-tools18/bin/sqlcmd \
  -S "${DB_HOST},${DB_PORT}" -U "${DB_USER}" -P "${DB_PASSWORD}" -C \
  -Q "IF DB_ID('${DB_NAME}') IS NULL BEGIN CREATE DATABASE [${DB_NAME}]; PRINT 'Da tao CSDL'; END ELSE PRINT 'CSDL da ton tai';"

# ---------------------------------------------------------------------------
buoc "4/5 — Chuẩn bị bản SQL tương thích RDS"
# ---------------------------------------------------------------------------
rm -rf "${THU_MUC_TAM}"
mkdir -p "${THU_MUC_TAM}"
cp "${THU_MUC_SQL}"/*.sql "${THU_MUC_TAM}/"

python3 - "${THU_MUC_TAM}/V1__init.sql" "${DB_NAME}" <<'PYTHON'
"""Lọc bỏ khỏi V1 những lệnh mà RDS SQL Server không cho phép.

Cách làm: bỏ theo TỪNG DÒNG. Kết xuất của SSMS đặt mỗi lệnh cấu hình trên đúng
một dòng, theo sau là `GO` trên dòng riêng. Bỏ dòng lệnh và giữ lại `GO` chỉ
tạo ra một lô rỗng — SQL Server chấp nhận, không sinh lỗi.

KHÔNG dùng biểu thức chính quy nhiều dòng: tệp nặng ~440KB và có hàng nghìn
lệnh INSERT chứa đủ loại ký tự; một regex trải rộng rất dễ ăn nhầm dữ liệu thật.
"""
import re
import sys

duong_dan, ten_csdl = sys.argv[1], sys.argv[2]

# Các tùy chọn ALTER DATABASE bị RDS chặn hoặc vô nghĩa trên RDS.
# Giữ lại những tùy chọn CÓ ảnh hưởng tới ứng dụng và RDS cho phép, ví dụ
# COMPATIBILITY_LEVEL, QUERY_STORE, READ_COMMITTED_SNAPSHOT, và các cờ ANSI_*.
TUY_CHON_BI_CHAN = [
    "RECOVERY",
    "TRUSTWORTHY",
    "FILESTREAM",
    "DISABLE_BROKER",
    "ENABLE_BROKER",
    "HONOR_BROKER_PRIORITY",
    "TARGET_RECOVERY_TIME",
    "ACCELERATED_DATABASE_RECOVERY",
    "MULTI_USER",
    "SINGLE_USER",
    "READ_WRITE",
    "READ_ONLY",
    "DB_CHAINING",
]

re_alter = re.compile(
    r"^\s*ALTER\s+DATABASE\s+\[?" + re.escape(ten_csdl) + r"\]?\s+SET\s+(\w+)",
    re.IGNORECASE,
)
re_use_master = re.compile(r"^\s*USE\s+\[?master\]?\s*$", re.IGNORECASE)
re_create_db = re.compile(r"^\s*CREATE\s+DATABASE\s+", re.IGNORECASE)
re_fulltext = re.compile(r"FULLTEXTSERVICEPROPERTY|sp_fulltext_database", re.IGNORECASE)

ket_qua = []
da_bo = []
bo_qua_khoi_fulltext = 0

with open(duong_dan, encoding="utf-8-sig") as f:
    for dong in f:
        # Khối full-text trải trên 3 dòng: IF (...) / begin EXEC ... / end
        if bo_qua_khoi_fulltext > 0:
            bo_qua_khoi_fulltext -= 1
            continue
        if re_fulltext.search(dong):
            da_bo.append(dong.strip()[:70])
            # Bỏ thêm 2 dòng tiếp theo (`begin EXEC ...` và `end`)
            bo_qua_khoi_fulltext = 2
            continue

        if re_use_master.match(dong):
            da_bo.append("USE [master]")
            continue

        if re_create_db.match(dong):
            da_bo.append(dong.strip()[:70])
            continue

        m = re_alter.match(dong)
        if m and m.group(1).upper() in TUY_CHON_BI_CHAN:
            da_bo.append(dong.strip()[:70])
            continue

        ket_qua.append(dong)

with open(duong_dan, "w", encoding="utf-8") as f:
    f.writelines(ket_qua)

print(f"  Đã lọc bỏ {len(da_bo)} lệnh không chạy được trên RDS:")
for d in da_bo:
    print(f"    - {d}")
PYTHON

# ---------------------------------------------------------------------------
buoc "5/5 — Chạy Flyway"
# ---------------------------------------------------------------------------
# ⚠️ KHÔNG có `repair` ở đây, KHÁC hẳn docker-compose.dev.yml.
#
# `repair` âm thầm chấp nhận một migration đã bị sửa sau khi chạy — đúng thứ mà
# Flyway sinh ra để ngăn chặn. Ở dev thì tiện; ở production thì đó là cách đánh
# mất khả năng biết chắc lược đồ đang ở trạng thái nào.
#
# Nếu Flyway dừng vì "Detected failed migration", hãy ĐỌC lỗi rồi xử lý tay —
# đừng thêm `repair` vào đây.
#
# Các cờ:
#   -mixed=true            V1 trộn DDL và DML trong cùng migration
#   -placeholderReplacement=false   SQL có chuỗi `${...}`, đừng để Flyway thay
#   -connectRetries=10     RDS vừa khởi động lại có thể chưa nhận kết nối ngay
#   -outOfOrder=false      (mặc định) chặn áp dụng migration cũ hơn bản đã chạy
docker run --rm \
  -v "${THU_MUC_TAM}:/flyway/sql:ro" \
  "${ANH_FLYWAY}" \
  -url="jdbc:sqlserver://${DB_HOST}:${DB_PORT};databaseName=${DB_NAME};encrypt=true;trustServerCertificate=true" \
  -user="${DB_USER}" \
  -password="${DB_PASSWORD}" \
  -mixed=true \
  -placeholderReplacement=false \
  -connectRetries=10 \
  migrate

buoc "Xong. Kiểm tra nhanh:"
docker run --rm "${ANH_SQLCMD}" \
  /opt/mssql-tools18/bin/sqlcmd \
  -S "${DB_HOST},${DB_PORT}" -U "${DB_USER}" -P "${DB_PASSWORD}" -C \
  -d "${DB_NAME}" \
  -Q "SELECT COUNT(*) AS SoBang FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE';
      SELECT TOP 5 version, description, success FROM dbo.flyway_schema_history ORDER BY installed_rank DESC;"

# Dọn bản SQL tạm — nó chứa dữ liệu thật của ứng dụng, không nên nằm lại /tmp.
rm -rf "${THU_MUC_TAM}"
