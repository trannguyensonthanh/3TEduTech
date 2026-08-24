#!/usr/bin/env bash
# =============================================================================
# 10-tao-lai-rds.sh — Tạo lại RDS: bật mã hóa, nâng lên db.t3.small, dời về AZ 1a
# =============================================================================
# [THÊM 23/08/2026]
#
# ★ VÌ SAO PHẢI XÓA RỒI TẠO LẠI, KHÔNG SỬA TẠI CHỖ
#
# `StorageEncrypted` là thuộc tính CHỈ ĐẶT ĐƯỢC LÚC TẠO. AWS không có lệnh nào
# bật mã hóa cho một instance đã tồn tại. Quy trình chính thức là
# snapshot → copy-snapshot có mã hóa → restore thành instance MỚI — tức là dù
# đi đường nào thì cũng ra một instance mới với endpoint mới.
#
# Khi cơ sở dữ liệu còn RỖNG, xóa-và-tạo-lại nhanh hơn hẳn đường snapshot
# (khoảng 15 phút so với 40 phút) và không để lại snapshot phải dọn.
#
# Nhân thể làm luôn hai việc cùng cần một lần tạo mới:
#   • db.t3.micro (1GB RAM) → db.t3.small (2GB). SQL Server cần gần 1GB chỉ để
#     khởi động; trên t3.micro thì buffer pool gần như bằng không và mọi truy vấn
#     đều phải đọc đĩa.
#   • AZ 1c → 1a, trùng AZ với ba máy EC2. Lưu lượng cross-AZ bị tính tiền cả
#     hai chiều và cộng thêm khoảng 1ms mỗi lượt.
#
# GIỮ NGUYÊN bản Express (`sqlserver-ex`) — giấy phép miễn phí. Đổi lại là chấp
# nhận trần 10GB mỗi cơ sở dữ liệu, xem docs/KE_HOACH_TRIEN_KHAI_PRODUCTION.md.
#
# ⚠️ SCRIPT NÀY XÓA DỮ LIỆU. Chỉ chạy khi migration CHƯA từng thành công.
#    Nếu không chắc: đặt KIEM_TRA_TRUOC=1 để script bật RDS lên và đếm bảng
#    trước khi hỏi.
#
# CÁCH DÙNG
#     bash scripts/10-tao-lai-rds.sh
#     KIEM_TRA_TRUOC=1 bash scripts/10-tao-lai-rds.sh
# =============================================================================

set -uo pipefail

PROFILE="${AWS_PROFILE:-edutech-devops}"
REGION="${AWS_REGION:-ap-northeast-1}"

DB_ID="edutech-db-instance"
DB_LOAI_MOI="db.t3.small"
DB_AZ_MOI="ap-northeast-1a"
DB_SUBNET_GROUP="edutech-db-subnet-group"
DB_SG="sg-0c72aa22c2170af63"
DB_DUNG_LUONG=20          # GiB — mức tối thiểu RDS cho phép
DB_GIU_BACKUP=1           # ngày. 0 = tắt hẳn backup tự động, mất luôn PITR.

AWS=(aws --profile "${PROFILE}" --region "${REGION}")

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
buoc()     { echo -e "\n${GREEN}==> $*${NC}"; }
canh_bao() { echo -e "${YELLOW}[!] $*${NC}"; }
loi()      { echo -e "${RED}[LỖI] $*${NC}" >&2; }

# ---------------------------------------------------------------------------
buoc "1/6 — Hiện trạng"
# ---------------------------------------------------------------------------
if ! "${AWS[@]}" rds describe-db-instances --db-instance-identifier "${DB_ID}" \
     --query 'DBInstances[0].{Loai:DBInstanceClass,AZ:AvailabilityZone,MaHoa:StorageEncrypted,TrangThai:DBInstanceStatus,Engine:EngineVersion,TaiKhoan:MasterUsername,DungLuong:AllocatedStorage}' \
     --output table; then
  loi "Không đọc được instance '${DB_ID}'."
  exit 1
fi

ENGINE_VERSION="$("${AWS[@]}" rds describe-db-instances --db-instance-identifier "${DB_ID}" \
  --query 'DBInstances[0].EngineVersion' --output text)"
DB_USER="$("${AWS[@]}" rds describe-db-instances --db-instance-identifier "${DB_ID}" \
  --query 'DBInstances[0].MasterUsername' --output text)"
DA_MA_HOA="$("${AWS[@]}" rds describe-db-instances --db-instance-identifier "${DB_ID}" \
  --query 'DBInstances[0].StorageEncrypted' --output text)"

if [[ "${DA_MA_HOA}" == "True" ]]; then
  canh_bao "Instance này ĐÃ mã hóa. Nếu chỉ muốn đổi sang ${DB_LOAI_MOI} thì không"
  canh_bao "cần script này — sửa tại chỗ là đủ, không mất dữ liệu:"
  echo
  echo "  aws rds modify-db-instance --profile ${PROFILE} --region ${REGION} \\"
  echo "    --db-instance-identifier ${DB_ID} \\"
  echo "    --db-instance-class ${DB_LOAI_MOI} --apply-immediately"
  echo
  exit 0
fi

# ---------------------------------------------------------------------------
if [[ "${KIEM_TRA_TRUOC:-0}" == "1" ]]; then
buoc "1b/6 — Bật RDS lên để đếm bảng trước khi quyết"
  "${AWS[@]}" rds start-db-instance --db-instance-identifier "${DB_ID}" >/dev/null 2>&1 || true
  echo "  Đang chờ RDS available (5-10 phút)..."
  "${AWS[@]}" rds wait db-instance-available --db-instance-identifier "${DB_ID}"
  echo
  canh_bao "RDS đã chạy. Từ CPU EC2, chạy lệnh này để đếm bảng:"
  echo
  echo "  docker run --rm mcr.microsoft.com/mssql-tools:latest /opt/mssql-tools/bin/sqlcmd \\"
  echo "    -S <endpoint>,1433 -U ${DB_USER} -P '<mat-khau>' -d 3t_edutech_db \\"
  echo "    -Q \"SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE'\""
  echo
  echo "  Trả về 0 (hoặc báo không có CSDL) → an toàn, chạy lại script không có KIEM_TRA_TRUOC."
  echo "  Trả về > 0 → CÓ dữ liệu, ĐỪNG chạy tiếp. Dùng đường snapshot thay thế."
  exit 0
fi

# ---------------------------------------------------------------------------
buoc "2/6 — Xác nhận"
# ---------------------------------------------------------------------------
cat <<XAC_NHAN

  Sắp XÓA instance '${DB_ID}' và tạo lại với:

      Loại       : ${DB_LOAI_MOI}      (hiện tại: db.t3.micro)
      AZ         : ${DB_AZ_MOI}        (hiện tại: ap-northeast-1c)
      Mã hóa     : BẬT                 (hiện tại: TẮT)
      Engine     : sqlserver-ex ${ENGINE_VERSION}   (giữ nguyên — giấy phép miễn phí)
      Dung lượng : ${DB_DUNG_LUONG} GiB
      Tài khoản  : ${DB_USER}

  MỌI DỮ LIỆU TRONG INSTANCE HIỆN TẠI SẼ MẤT. Không có snapshot cuối.

  Endpoint MỚI sẽ khác endpoint cũ. Phải sửa DB_HOST trong:
      3t-edu-tech-backend/.env.production

XAC_NHAN

read -rp "  Gõ đúng chuỗi XOA-VA-TAO-LAI để tiếp tục: " tra_loi
if [[ "${tra_loi}" != "XOA-VA-TAO-LAI" ]]; then
  echo "  Đã hủy, không có gì thay đổi."
  exit 0
fi

read -rsp "  Mật khẩu master cho instance MỚI (>= 8 ký tự): " DB_PASS; echo
read -rsp "  Nhập lại: " DB_PASS2; echo
if [[ "${DB_PASS}" != "${DB_PASS2}" ]]; then
  loi "Hai lần nhập không khớp."
  exit 1
fi
if [[ ${#DB_PASS} -lt 8 ]]; then
  loi "Mật khẩu quá ngắn."
  exit 1
fi
# SQL Server từ chối một số ký tự trong mật khẩu master của RDS.
if [[ "${DB_PASS}" =~ [/@\"\'] ]]; then
  loi "Mật khẩu chứa ký tự RDS không nhận: / @ \" '"
  exit 1
fi

# ---------------------------------------------------------------------------
buoc "3/6 — Xóa instance cũ"
# ---------------------------------------------------------------------------
# Deletion protection có thể đang bật; tắt trước cho chắc.
"${AWS[@]}" rds modify-db-instance --db-instance-identifier "${DB_ID}" \
  --no-deletion-protection --apply-immediately >/dev/null 2>&1 || true

"${AWS[@]}" rds delete-db-instance --db-instance-identifier "${DB_ID}" \
  --skip-final-snapshot --delete-automated-backups >/dev/null

echo "  Đang chờ xóa xong (5-10 phút)..."
"${AWS[@]}" rds wait db-instance-deleted --db-instance-identifier "${DB_ID}"
echo "  ✅ Đã xóa."

# ---------------------------------------------------------------------------
buoc "4/6 — Tạo instance mới"
# ---------------------------------------------------------------------------
"${AWS[@]}" rds create-db-instance \
  --db-instance-identifier "${DB_ID}" \
  --db-instance-class "${DB_LOAI_MOI}" \
  --engine sqlserver-ex \
  --engine-version "${ENGINE_VERSION}" \
  --license-model license-included \
  --master-username "${DB_USER}" \
  --master-user-password "${DB_PASS}" \
  --allocated-storage "${DB_DUNG_LUONG}" \
  --storage-type gp3 \
  --storage-encrypted \
  --availability-zone "${DB_AZ_MOI}" \
  --db-subnet-group-name "${DB_SUBNET_GROUP}" \
  --vpc-security-group-ids "${DB_SG}" \
  --no-publicly-accessible \
  --no-multi-az \
  --backup-retention-period "${DB_GIU_BACKUP}" \
  --copy-tags-to-snapshot \
  --tags Key=Name,Value=3T-EduTech-RDS Key=Project,Value=3t-edutech \
  --query 'DBInstance.{Id:DBInstanceIdentifier,TrangThai:DBInstanceStatus}' --output table

# --storage-encrypted không kèm --kms-key-id → dùng khóa mặc định `aws/rds`.
# Khóa mặc định KHÔNG tính phí; khóa KMS tự tạo thì $1/tháng. Với dự án này
# khóa mặc định là đủ, và nó cũng bớt một thứ phải quản.

echo "  Đang chờ instance mới sẵn sàng (10-15 phút)..."
"${AWS[@]}" rds wait db-instance-available --db-instance-identifier "${DB_ID}"

# ---------------------------------------------------------------------------
buoc "5/6 — Kết quả"
# ---------------------------------------------------------------------------
ENDPOINT="$("${AWS[@]}" rds describe-db-instances --db-instance-identifier "${DB_ID}" \
  --query 'DBInstances[0].Endpoint.Address' --output text)"

"${AWS[@]}" rds describe-db-instances --db-instance-identifier "${DB_ID}" \
  --query 'DBInstances[0].{Endpoint:Endpoint.Address,Cong:Endpoint.Port,Loai:DBInstanceClass,AZ:AvailabilityZone,MaHoa:StorageEncrypted,TrangThai:DBInstanceStatus}' \
  --output table

# ---------------------------------------------------------------------------
buoc "6/6 — Việc phải làm tay ngay sau đây"
# ---------------------------------------------------------------------------
cat <<HUONG_DAN

  1. Sửa 3t-edu-tech-backend/.env.production trên CPU EC2:

         DB_HOST=${ENDPOINT}
         DB_PASSWORD=<mật khẩu vừa đặt>

  2. Chạy migration:

         sudo bash scripts/02-chay-migration.sh

  3. TẮT RDS khi không dùng:

         bash scripts/aws-tat.sh

  ⚠️ RDS TỰ BẬT LẠI SAU 7 NGÀY DỪNG. AWS không cho dừng vô hạn. Sau mỗi lần
     nó tự bật, bạn phải tắt lại — nếu quên thì tiền vẫn chạy.
     scripts/12-lich-tu-dong-tat.sh dựng một lịch tự tắt hằng đêm để chống việc này.

HUONG_DAN
