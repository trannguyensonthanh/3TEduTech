#!/usr/bin/env bash
# =============================================================================
# aws-bat.sh — Bật đúng những máy cần cho việc sắp làm
# =============================================================================
# ★ Bật theo TẦNG, không bật hết. Theo src/core/llm_provider.py, mặc định
#   Gemini trả lời trước — nghĩa là toàn bộ hệ thống chạy đầy đủ khi GPU #1
#   (vLLM, đắt nhất) vẫn đang tắt. Chỉ bật nó khi thật sự đang thử vLLM.
#
#     bash scripts/aws-bat.sh web     RDS + CPU EC2                ~$1.5/ngày
#     bash scripts/aws-bat.sh ai      + GPU #2 (AI Service)        ~$14/ngày
#     bash scripts/aws-bat.sh tat-ca  + GPU #1 (vLLM)              ~$38/ngày
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

TANG="${1:-}"
case "${TANG}" in
  web)    MAY=("${CPU_EC2}") ;;
  ai)     MAY=("${CPU_EC2}" "${GPU2_AI}") ;;
  tat-ca) MAY=("${CPU_EC2}" "${GPU2_AI}" "${GPU1_VLLM}") ;;
  *)
    echo "Dùng: bash scripts/aws-bat.sh {web|ai|tat-ca}"
    echo
    echo "  web     RDS + CPU EC2                — backend, frontend, migration"
    echo "  ai      + GPU #2 AI Service          — chatbot, RAG, Whisper (Gemini)"
    echo "  tat-ca  + GPU #1 vLLM                — chỉ khi đang thử Qwen local"
    exit 1
    ;;
esac

echo -e "${GREEN}==> Bật RDS${NC}"
"${AWS[@]}" rds start-db-instance --db-instance-identifier "${RDS_ID}" \
  --query 'DBInstance.DBInstanceStatus' --output text 2>/dev/null \
  || echo "  (đã chạy sẵn hoặc đang chuyển trạng thái)"

echo -e "${GREEN}==> Bật EC2${NC}"
"${AWS[@]}" ec2 start-instances --instance-ids "${MAY[@]}" \
  --query 'StartingInstances[].{Id:InstanceId,Tu:PreviousState.Name,Sang:CurrentState.Name}' \
  --output table

echo -e "${GREEN}==> Chờ EC2 chạy...${NC}"
"${AWS[@]}" ec2 wait instance-running --instance-ids "${MAY[@]}"

echo -e "\n${GREEN}==> Địa chỉ${NC}"
"${AWS[@]}" ec2 describe-instances --instance-ids "${MAY[@]}" \
  --query 'Reservations[].Instances[].{Ten:Tags[?Key==`Name`]|[0].Value,IP_Private:PrivateIpAddress,IP_Public:PublicIpAddress,TrangThai:State.Name}' \
  --output table

cat <<'LUU_Y'

  ⚠️ IP PUBLIC của hai máy GPU ĐỔI sau mỗi lần start (chúng không có Elastic IP).
     IP PRIVATE thì giữ nguyên — và đó mới là thứ ba máy dùng để gọi nhau, nên
     VLLM_BASE_URL và AI_SERVICE_URL trong .env.production KHÔNG phải sửa.
     Chỉ lệnh SSH của bạn là phải dùng IP mới.

     Tránh hẳn chuyện này bằng SSM, không cần biết IP:
         aws ssm start-session --target <instance-id>

LUU_Y

echo -e "${GREEN}==> Chờ RDS available (5-10 phút nếu vừa bật)${NC}"
"${AWS[@]}" rds wait db-instance-available --db-instance-identifier "${RDS_ID}" 2>/dev/null || true
"${AWS[@]}" rds describe-db-instances --db-instance-identifier "${RDS_ID}" \
  --query 'DBInstances[0].{Endpoint:Endpoint.Address,TrangThai:DBInstanceStatus,Loai:DBInstanceClass}' \
  --output table

echo -e "${YELLOW}[!] Xong việc thì: bash scripts/aws-tat.sh${NC}"
