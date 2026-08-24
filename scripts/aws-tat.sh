#!/usr/bin/env bash
# =============================================================================
# aws-tat.sh — Tắt mọi thứ tính tiền theo giờ
# =============================================================================
# Chạy mỗi khi ngừng làm việc. Tắt máy thì chỉ còn trả tiền ổ đĩa EBS
# (~$25/tháng cho 260GB) và Elastic IP chưa gắn, không trả tiền CPU/GPU/RDS.
#
#     bash scripts/aws-tat.sh          tắt hết
#     bash scripts/aws-tat.sh gpu      chỉ tắt hai máy GPU
# =============================================================================

set -uo pipefail

PROFILE="${AWS_PROFILE:-edutech-devops}"
REGION="${AWS_REGION:-ap-northeast-1}"
AWS=(aws --profile "${PROFILE}" --region "${REGION}")

CPU_EC2="i-01f5c3c164c11042e"
GPU1_VLLM="i-0f8ac78807132b82d"
GPU2_AI="i-0f6bcd18bd2c0f4eb"
RDS_ID="edutech-db-instance"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

case "${1:-tat-ca}" in
  gpu)
    MAY=("${GPU1_VLLM}" "${GPU2_AI}")
    TAT_RDS=0
    ;;
  *)
    MAY=("${CPU_EC2}" "${GPU1_VLLM}" "${GPU2_AI}")
    TAT_RDS=1
    ;;
esac

echo -e "${GREEN}==> Tắt EC2${NC}"
"${AWS[@]}" ec2 stop-instances --instance-ids "${MAY[@]}" \
  --query 'StoppingInstances[].{Id:InstanceId,Tu:PreviousState.Name,Sang:CurrentState.Name}' \
  --output table

if [[ "${TAT_RDS}" == "1" ]]; then
  echo -e "${GREEN}==> Tắt RDS${NC}"
  # RDS đang stopped thì lệnh này báo lỗi InvalidDBInstanceState — không sao.
  if "${AWS[@]}" rds stop-db-instance --db-instance-identifier "${RDS_ID}" \
       --query 'DBInstance.DBInstanceStatus' --output text 2>/dev/null; then
    echo "  đang dừng..."
  else
    echo "  (đã dừng sẵn hoặc đang chuyển trạng thái)"
  fi
  echo -e "${YELLOW}[!] RDS TỰ BẬT LẠI SAU 7 NGÀY. AWS không cho dừng vô hạn.${NC}"
fi

echo -e "\n${GREEN}==> Trạng thái sau khi tắt${NC}"
"${AWS[@]}" ec2 describe-instances \
  --query 'Reservations[].Instances[].{Ten:Tags[?Key==`Name`]|[0].Value,Loai:InstanceType,TrangThai:State.Name}' \
  --output table
"${AWS[@]}" rds describe-db-instances \
  --query 'DBInstances[].{Id:DBInstanceIdentifier,Loai:DBInstanceClass,TrangThai:DBInstanceStatus}' \
  --output table

echo "Việc chuyển sang 'stopped' mất vài phút. Chạy lại script để xem trạng thái mới."
