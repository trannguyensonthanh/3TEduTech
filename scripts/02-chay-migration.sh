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
# ★ [SỬA 24/08/2026] BỎ HẲN BƯỚC LỌC SQL — GIỜ NÓ ĐÃ THỪA
#
# Bản trước có một khối Python lọc bỏ các lệnh RDS chặn (sp_fulltext_database,
# ALTER DATABASE SET RECOVERY, USE [master]...) ra một bản sao tạm trong /tmp.
#
# Việc lọc đó nay đã chuyển sang `scripts/13-chuan-hoa-baseline.py`, chạy MỘT
# LẦN lúc sinh `db-init/V1__baseline.sql`. Có ba cái lợi so với lọc lúc deploy:
#
#   1. Tệp nằm trong git là tệp SẼ CHẠY. Trước đây tệp trong git khác tệp thật
#      sự chạy trên máy chủ, nên đọc git không biết chắc chuyện gì xảy ra.
#   2. Checksum ổn định. Flyway lưu checksum của mỗi migration đã áp dụng; lọc
#      lúc chạy nghĩa là checksum phụ thuộc phiên bản Python trên máy chủ.
#   3. Lọc theo LÔ `GO` chứ không theo dòng. Khối full-text trải ba dòng và
#      CREATE DATABASE trải bảy dòng — lọc theo dòng để lại mảnh vỡ. Với bản
#      xuất mới 435KB có kèm 745 lệnh INSERT thì lọc theo dòng còn nguy hiểm
#      hơn: một dòng dữ liệu chứa chữ "ALTER DATABASE" trong nội dung văn bản
#      cũng bị cắt mất.
#
# Script này giờ chỉ còn: kiểm kết nối → tạo CSDL nếu chưa có → chạy Flyway.
#
# -----------------------------------------------------------------------------
# ★ THƯ MỤC db-init SAU KHI DỌN
#
#     db-init/
#       V1__baseline.sql        ← Flyway CHỈ thấy tệp này
#       _nguon/                 ← bản xuất thô từ SSMS, không phải migration
#       _lich_su/               ← V1..V10 cũ, giữ để tra cứu, Flyway không đọc
#
# Flyway không đệ quy vào thư mục con, nên `_nguon/` và `_lich_su/` nằm đó
# hoàn toàn vô hại.
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

# Ghim phiên bản Flyway. Dùng `:latest` nghĩa là một ngày nào đó Flyway lên bản
# mới, đổi hành vi mặc định, và migration hỏng mà không ai đổi gì cả.
ANH_FLYWAY="flyway/flyway:10-alpine"

# [SỬA 23/08/2026] ★ KHÔNG ghim cứng một ảnh sqlcmd nữa.
#
# Bản cũ ghim `mcr.microsoft.com/mssql-tools18:<tag>` và chết ở bước 2 với
# "manifest unknown: manifest tagged by ... is not found". Đó KHÔNG phải lỗi
# mạng, lỗi Security Group hay lỗi mật khẩu — Microsoft đơn giản là không xuất
# bản kho ảnh tên `mssql-tools18` với tag đó. Ảnh chính thức lâu đời là
# `mcr.microsoft.com/mssql-tools` (sqlcmd 17, nhị phân ở /opt/mssql-tools/bin);
# sqlcmd 18 được đóng gói kèm trong ảnh máy chủ `mcr.microsoft.com/mssql/server`
# (nhị phân ở /opt/mssql-tools18/bin).
#
# Đường dẫn nhị phân KHÁC nhau giữa hai bản, và cờ `-C` chỉ tồn tại từ bản 18,
# nên script dò lần lượt và ghi nhớ cả ba thứ: tên ảnh, đường dẫn, cờ bổ sung.
UNG_VIEN_SQLCMD=(
  "mcr.microsoft.com/mssql-tools:latest|/opt/mssql-tools/bin/sqlcmd|"
  "mcr.microsoft.com/mssql/server:2022-latest|/opt/mssql-tools18/bin/sqlcmd|-C"
)
ANH_SQLCMD=""; DUONG_DAN_SQLCMD=""; CO_SQLCMD=""

# Gọi sqlcmd sau khi đã dò xong. Dùng ở cả bước 2, 3 và bước kiểm tra cuối.
chay_sqlcmd() {
  docker run --rm "${ANH_SQLCMD}" "${DUONG_DAN_SQLCMD}" \
    -S "${DB_HOST},${DB_PORT}" -U "${DB_USER}" -P "${DB_PASSWORD}" ${CO_SQLCMD} "$@"
}

# ---------------------------------------------------------------------------
buoc "1/4 — Đọc cấu hình kết nối"
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
buoc "2/4 — Kiểm tra kết nối tới RDS"
# ---------------------------------------------------------------------------
#
# ★ BA PHÉP THỬ TÁCH RỜI, THEO ĐÚNG THỨ TỰ NHÂN QUẢ
#
# Bản cũ gộp tất cả vào một lệnh `docker run sqlcmd`, nên MỌI thất bại — kể cả
# "không kéo được ảnh Docker" — đều in ra bài chẩn đoán về Security Group. Đó
# là cách nhanh nhất để mất một buổi tối đi sửa tường lửa vốn đã đúng.
#
#   2a. DNS   — tên endpoint có phân giải được không? (không cần Docker)
#   2b. TCP   — cổng 1433 có mở không?               (không cần Docker)
#   2c. Đăng nhập — tài khoản/mật khẩu có đúng không? (mới cần Docker)
#
# 2a và 2b dùng bash thuần, không phụ thuộc bất cứ ảnh nào. Nếu 2b MỞ thì mạng
# và Security Group đã đúng — bất kể bước sau hỏng thế nào.

echo "  2a. Phân giải DNS..."
if ! getent hosts "${DB_HOST}" > /dev/null 2>&1; then
  loi "Không phân giải được '${DB_HOST}'."
  echo "     → DB_HOST sai, hoặc bạn đang ghi kèm cổng ở cuối (phải bỏ ':1433')."
  echo "     → Dạng đúng: ten-instance.xxxxxxxx.ap-northeast-1.rds.amazonaws.com"
  exit 1
fi
echo "      ✅ $(getent hosts "${DB_HOST}" | head -1)"

echo "  2b. Mở cổng TCP ${DB_PORT}..."
if ! timeout 8 bash -c "</dev/tcp/${DB_HOST}/${DB_PORT}" 2>/dev/null; then
  loi "Cổng ${DB_PORT} tới RDS ĐÓNG. Đây là vấn đề mạng, chưa liên quan tài khoản."
  cat <<'CHAN_DOAN'

Kiểm tra theo thứ tự:

  1. Security Group của RDS có luật vào cổng 1433 với NGUỒN là security group
     của EC2 không? Phải là "sg-xxxx", KHÔNG phải 0.0.0.0/0, và cũng KHÔNG
     phải IP private của EC2 (IP đổi khi thay ENI, SG thì không).

  2. RDS và EC2 có cùng VPC không? Khác VPC thì phải peering hoặc TGW.

  3. RDS có nằm trong subnet mà EC2 định tuyến tới được không?
     `aws rds describe-db-subnet-groups` để xem.

  4. RDS đang ở trạng thái "available" chứ không phải "stopped"?
     RDS tự khởi động lại sau 7 ngày dừng, nhưng trong 7 ngày đó thì tắt.

Lệnh xem nhanh cả bốn thứ trên: bash scripts/00-kiem-ke-he-thong-aws.sh

CHAN_DOAN
  exit 1
fi
echo "      ✅ Cổng mở — Security Group và VPC đã đúng."

echo "  2c. Dò ảnh Docker có chứa sqlcmd..."
for ung_vien in "${UNG_VIEN_SQLCMD[@]}"; do
  IFS='|' read -r anh duong_dan co <<< "${ung_vien}"
  echo -n "      thử ${anh} ... "
  if docker image inspect "${anh}" >/dev/null 2>&1 || docker pull -q "${anh}" >/dev/null 2>&1; then
    ANH_SQLCMD="${anh}"; DUONG_DAN_SQLCMD="${duong_dan}"; CO_SQLCMD="${co}"
    echo "được"
    break
  fi
  echo "không có"
done

if [[ -z "${ANH_SQLCMD}" ]]; then
  loi "Không kéo được ảnh nào chứa sqlcmd."
  cat <<'CHAN_DOAN'

Cổng tới RDS đã MỞ, nên mạng nội bộ ổn. Vấn đề nằm ở đường ra Internet của EC2
hoặc ở tên ảnh:

  1. EC2 có ra được Internet không? Máy trong private subnet cần NAT Gateway.
     Thử: timeout 5 bash -c '</dev/tcp/mcr.microsoft.com/443' && echo MO || echo DONG

  2. Nếu vẫn không kéo được ảnh: BỎ QUA sqlcmd hoàn toàn. Flyway đã mang sẵn
     driver JDBC SQL Server, không cần sqlcmd để chạy migration. Chỉ cần TỰ TAY
     tạo cơ sở dữ liệu một lần qua SSMS/Azure Data Studio từ máy bạn, rồi chạy
     lại script với:  BO_QUA_SQLCMD=1 sudo -E bash scripts/02-chay-migration.sh

CHAN_DOAN
  [[ "${BO_QUA_SQLCMD:-0}" == "1" ]] || exit 1
  canh_bao "BO_QUA_SQLCMD=1 — bỏ qua mọi bước dùng sqlcmd, đi thẳng tới Flyway."
fi

if [[ -n "${ANH_SQLCMD}" ]]; then
  echo "  2d. Đăng nhập SQL Server..."
  # `-C` (tin chứng chỉ máy chủ) chỉ có từ sqlcmd 18 và đã nằm trong CO_SQLCMD.
  # Từ bản 18 sqlcmd BẬT mã hóa mặc định và từ chối chứng chỉ của RDS nếu thiếu
  # cờ này — nguyên nhân số một của "SSL Provider: certificate verify failed".
  if ! chay_sqlcmd -l 15 -Q "SELECT @@VERSION" 2>&1 | tail -5; then
    loi "Cổng mở nhưng ĐĂNG NHẬP thất bại → sai tài khoản hoặc mật khẩu."
    echo "     → Mật khẩu trong .env.production có ký tự đặc biệt bị nuốt không?"
    echo "     → Kiểm bằng: grep -c '^DB_PASSWORD=' ${TEP_ENV}   (phải trả về 1)"
    echo "     → Đổi lại mật khẩu master của RDS nếu không chắc:"
    echo "        aws rds modify-db-instance --db-instance-identifier <id> \\"
    echo "          --master-user-password '<mat-khau-moi>' --apply-immediately"
    exit 1
  fi
  echo "  ✅ Kết nối và đăng nhập được."
fi

# ---------------------------------------------------------------------------
buoc "3/4 — Tạo cơ sở dữ liệu nếu chưa có"
# ---------------------------------------------------------------------------
# ★ VÌ SAO TẠO Ở ĐÂY MÀ KHÔNG ĐỂ V1 TẠO
#
# Nếu để Flyway kết nối vào `master` rồi chạy `CREATE DATABASE` trong V1, thì
# bảng lịch sử `flyway_schema_history` sẽ nằm trong `master` — nơi RDS hạn chế
# việc tạo đối tượng. Tạo CSDL trước rồi cho Flyway kết nối THẲNG vào nó khiến
# bảng lịch sử nằm đúng chỗ, cùng nơi với dữ liệu mà nó mô tả.
if [[ -n "${ANH_SQLCMD}" ]]; then
  chay_sqlcmd -Q "IF DB_ID('${DB_NAME}') IS NULL BEGIN CREATE DATABASE [${DB_NAME}]; PRINT 'Da tao CSDL'; END ELSE PRINT 'CSDL da ton tai';"
else
  canh_bao "Bỏ qua — bạn phải tự tạo CSDL [${DB_NAME}] trước khi chạy tiếp."
fi

# ---------------------------------------------------------------------------
buoc "4/4 — Chạy Flyway"
# ---------------------------------------------------------------------------
# KHÔNG còn bước "chuẩn bị bản SQL tương thích RDS": Flyway nay gắn thẳng
# db-init/ vào container và đọc tệp gốc trong git, không qua bản sao tạm nào.
#
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
#   -mixed=true            V1__baseline.sql trộn DDL (CREATE TABLE) và DML
#                          (745 lệnh INSERT) trong cùng một migration
#   -placeholderReplacement=false   SQL có chuỗi `${...}`, đừng để Flyway thay
#   -connectRetries=10     RDS vừa khởi động lại có thể chưa nhận kết nối ngay
#   -outOfOrder=false      (mặc định) chặn áp dụng migration cũ hơn bản đã chạy
docker run --rm \
  -v "${THU_MUC_SQL}:/flyway/sql:ro" \
  "${ANH_FLYWAY}" \
  -url="jdbc:sqlserver://${DB_HOST}:${DB_PORT};databaseName=${DB_NAME};encrypt=true;trustServerCertificate=true" \
  -user="${DB_USER}" \
  -password="${DB_PASSWORD}" \
  -mixed=true \
  -placeholderReplacement=false \
  -connectRetries=10 \
  migrate

buoc "Xong. Kiểm tra nhanh:"
if [[ -n "${ANH_SQLCMD}" ]]; then
  chay_sqlcmd -d "${DB_NAME}" \
    -Q "SELECT COUNT(*) AS SoBang FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE';
        SELECT TOP 5 version, description, success FROM dbo.flyway_schema_history ORDER BY installed_rank DESC;"
else
  canh_bao "Bỏ qua kiểm tra bằng sqlcmd. Dùng thay thế:"
  echo "  docker run --rm ${ANH_FLYWAY} \\"
  echo "    -url=\"jdbc:sqlserver://${DB_HOST}:${DB_PORT};databaseName=${DB_NAME};encrypt=true;trustServerCertificate=true\" \\"
  echo "    -user=\"${DB_USER}\" -password='<mat-khau>' info"
fi

# Dọn bản SQL tạm — nó chứa dữ liệu thật của ứng dụng, không nên nằm lại /tmp.
