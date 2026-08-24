#!/usr/bin/env bash
# =============================================================================
# 12-lich-tu-dong-tat.sh — Lịch tự tắt EC2 + RDS mỗi đêm
# =============================================================================
# [THÊM 23/08/2026]
#
# ★ VÌ SAO CẦN LỊCH CHỨ KHÔNG CHỈ CẦN `aws-tat.sh`
#
# `aws-tat.sh` chỉ chạy khi bạn nhớ chạy nó. Ba tình huống nó không cứu được:
#
#   1. Ngủ quên / máy hết pin / mất mạng giữa buổi làm.
#   2. RDS TỰ BẬT LẠI SAU 7 NGÀY DỪNG. AWS không cho dừng vô hạn, và lần tự bật
#      đó không báo cho ai cả. Nếu bạn nghỉ hai tuần, RDS sẽ chạy suốt tuần thứ hai.
#   3. Một lệnh `start` chạy dở rồi bạn đóng terminal.
#
# Lịch này là lưới an toàn: dù có chuyện gì, 01:00 giờ Việt Nam mọi thứ tắt.
# Bạn vẫn bật lại bình thường vào hôm sau bằng `aws-bat.sh`.
#
# ★ KHÔNG DÙNG LAMBDA
#
# EventBridge Scheduler gọi thẳng được API của AWS qua "universal target" —
# không cần viết hàm Lambda, không cần đóng gói mã, không có runtime nào để
# nâng cấp về sau. Chỉ cần một IAM role cho phép đúng hai hành động.
#
# ★ CHI PHÍ: 14.000.000 lời gọi đầu mỗi tháng miễn phí. Bốn lịch chạy mỗi ngày
#   là 120 lời gọi/tháng.
#
# CÁCH DÙNG
#     bash scripts/12-lich-tu-dong-tat.sh                 # tạo lịch, 01:00 ICT
#     GIO_TAT=23 bash scripts/12-lich-tu-dong-tat.sh      # đổi sang 23:00 ICT
#     bash scripts/12-lich-tu-dong-tat.sh xoa             # xóa hết lịch
# =============================================================================

set -uo pipefail

PROFILE="${AWS_PROFILE:-edutech-devops}"
REGION="${AWS_REGION:-ap-northeast-1}"
ACCOUNT="$(aws --profile "${PROFILE}" sts get-caller-identity --query Account --output text)"

GIO_TAT="${GIO_TAT:-1}"          # giờ theo Asia/Ho_Chi_Minh
MUI_GIO="Asia/Ho_Chi_Minh"

CPU_EC2="i-01f5c3c164c11042e"
GPU1_VLLM="i-0f8ac78807132b82d"
GPU2_AI="i-0f6bcd18bd2c0f4eb"
RDS_ID="edutech-db-instance"

ROLE="3t-edutech-scheduler-role"
ROLE_ARN="arn:aws:iam::${ACCOUNT}:role/${ROLE}"
NHOM="3t-edutech-tu-dong-tat"

AWS=(aws --profile "${PROFILE}" --region "${REGION}")

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
buoc()     { echo -e "\n${GREEN}==> $*${NC}"; }
canh_bao() { echo -e "${YELLOW}[!] $*${NC}"; }

# ---------------------------------------------------------------------------
if [[ "${1:-}" == "xoa" ]]; then
  buoc "Xóa lịch"
  for ten in tat-ec2 tat-rds; do
    "${AWS[@]}" scheduler delete-schedule --name "${ten}" --group-name "${NHOM}" 2>/dev/null \
      && echo "  đã xóa ${ten}" || echo "  ${ten} không tồn tại"
  done
  "${AWS[@]}" scheduler delete-schedule-group --name "${NHOM}" 2>/dev/null \
    && echo "  đã xóa nhóm ${NHOM}" || true
  echo
  canh_bao "Role ${ROLE} vẫn còn. Xóa tay nếu không dùng nữa:"
  echo "  aws iam delete-role-policy --role-name ${ROLE} --policy-name tat-may"
  echo "  aws iam delete-role --role-name ${ROLE}"
  exit 0
fi

# ---------------------------------------------------------------------------
buoc "1/3 — IAM role cho scheduler"
# ---------------------------------------------------------------------------
TIN_CAY=$(cat <<'JSON'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Service": "scheduler.amazonaws.com"},
    "Action": "sts:AssumeRole"
  }]
}
JSON
)

# Quyền hẹp nhất có thể: đúng ba instance và đúng một RDS, đúng hai hành động
# "stop". Không có start, không có terminate, không có wildcard. Kể cả khi lịch
# bị sửa sai, thứ tệ nhất nó làm được là tắt máy của bạn.
QUYEN=$(cat <<JSON
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "TatEC2",
      "Effect": "Allow",
      "Action": "ec2:StopInstances",
      "Resource": [
        "arn:aws:ec2:${REGION}:${ACCOUNT}:instance/${CPU_EC2}",
        "arn:aws:ec2:${REGION}:${ACCOUNT}:instance/${GPU1_VLLM}",
        "arn:aws:ec2:${REGION}:${ACCOUNT}:instance/${GPU2_AI}"
      ]
    },
    {
      "Sid": "TatRDS",
      "Effect": "Allow",
      "Action": "rds:StopDBInstance",
      "Resource": "arn:aws:rds:${REGION}:${ACCOUNT}:db:${RDS_ID}"
    }
  ]
}
JSON
)

if aws --profile "${PROFILE}" iam get-role --role-name "${ROLE}" >/dev/null 2>&1; then
  echo "  role đã có, cập nhật quyền"
else
  aws --profile "${PROFILE}" iam create-role --role-name "${ROLE}" \
    --assume-role-policy-document "${TIN_CAY}" \
    --description "Cho phep EventBridge Scheduler tat EC2/RDS cua 3T EduTech" >/dev/null
  echo "  đã tạo role ${ROLE}"
  # IAM lan truyền chậm; role vừa tạo có thể chưa dùng được ngay.
  echo "  chờ IAM lan truyền (10s)..."
  sleep 10
fi

aws --profile "${PROFILE}" iam put-role-policy --role-name "${ROLE}" \
  --policy-name tat-may --policy-document "${QUYEN}"
echo "  ✅ quyền đã gắn (chỉ stop, chỉ 4 tài nguyên này)"

# ---------------------------------------------------------------------------
buoc "2/3 — Nhóm lịch"
# ---------------------------------------------------------------------------
"${AWS[@]}" scheduler create-schedule-group --name "${NHOM}" >/dev/null 2>&1 \
  && echo "  đã tạo nhóm ${NHOM}" || echo "  nhóm ${NHOM} đã có"

# ---------------------------------------------------------------------------
buoc "3/3 — Hai lịch tắt, ${GIO_TAT}:00 giờ Việt Nam mỗi ngày"
# ---------------------------------------------------------------------------
# `--schedule-expression-timezone` nhận tên IANA, nên KHÔNG phải tự quy đổi sang
# UTC — và cũng không bị lệch khi có thay đổi múi giờ. Cron ở đây là 6 trường
# kiểu EventBridge: phút giờ ngày tháng thứ năm.
BIEU_THUC="cron(0 ${GIO_TAT} * * ? *)"

tao_lich() {
  local ten="$1" arn="$2" input="$3"
  "${AWS[@]}" scheduler create-schedule \
    --name "${ten}" \
    --group-name "${NHOM}" \
    --schedule-expression "${BIEU_THUC}" \
    --schedule-expression-timezone "${MUI_GIO}" \
    --flexible-time-window '{"Mode":"OFF"}' \
    --target "{\"Arn\":\"${arn}\",\"RoleArn\":\"${ROLE_ARN}\",\"Input\":\"${input}\"}" \
    >/dev/null 2>&1 \
  || "${AWS[@]}" scheduler update-schedule \
    --name "${ten}" \
    --group-name "${NHOM}" \
    --schedule-expression "${BIEU_THUC}" \
    --schedule-expression-timezone "${MUI_GIO}" \
    --flexible-time-window '{"Mode":"OFF"}' \
    --target "{\"Arn\":\"${arn}\",\"RoleArn\":\"${ROLE_ARN}\",\"Input\":\"${input}\"}" \
    >/dev/null
  echo "  ✅ ${ten}"
}

tao_lich "tat-ec2" "arn:aws:scheduler:::aws-sdk:ec2:stopInstances" \
  "{\\\"InstanceIds\\\":[\\\"${CPU_EC2}\\\",\\\"${GPU1_VLLM}\\\",\\\"${GPU2_AI}\\\"]}"

tao_lich "tat-rds" "arn:aws:scheduler:::aws-sdk:rds:stopDBInstance" \
  "{\\\"DBInstanceIdentifier\\\":\\\"${RDS_ID}\\\"}"

# ---------------------------------------------------------------------------
buoc "Kết quả"
"${AWS[@]}" scheduler list-schedules --group-name "${NHOM}" \
  --query 'Schedules[].{Ten:Name,TrangThai:State,Nhom:GroupName}' --output table

cat <<HUONG_DAN

  Mỗi ngày ${GIO_TAT}:00 (giờ Việt Nam), cả ba EC2 và RDS sẽ được tắt.

  ★ THỬ NGAY MỘT LẦN cho chắc, đừng đợi tới đêm mới biết nó hỏng.
    Đặt lịch chạy sau 5 phút, xem có tắt thật không, rồi trả lại giờ cũ:

      GIO_TAT=\$(TZ=Asia/Ho_Chi_Minh date -d '+5 min' +%H) \\
        bash scripts/12-lich-tu-dong-tat.sh
      # (lịch chạy theo giờ tròn nên cách này chỉ đúng nếu 5 phút nữa sang giờ mới —
      #  cách chắc chắn hơn: sửa BIEU_THUC thành cron(<phút+2> <giờ hiện tại> * * ? *))

  ★ Xem lần chạy gần nhất có lỗi không:

      aws logs tail /aws/events/3t-edutech --since 1d --profile ${PROFILE} --region ${REGION}

    Nếu chưa cấu hình log, kiểm gián tiếp bằng cách sáng hôm sau chạy
    \`bash scripts/aws-tat.sh\` và xem trạng thái đã là 'stopped' chưa.

  ★ Lịch này CHỈ TẮT, không bao giờ bật. Bật vẫn là việc của bạn:
      bash scripts/aws-bat.sh web

  Xóa lịch: bash scripts/12-lich-tu-dong-tat.sh xoa

HUONG_DAN
