#!/usr/bin/env bash
# =============================================================================
# 00-kiem-ke-he-thong-aws.sh — Chụp ảnh toàn bộ hạ tầng AWS đang có
# =============================================================================
# CHỈ ĐỌC. Script này không tạo, không sửa, không xóa bất cứ tài nguyên nào.
# Mọi lệnh đều là describe/list/get.
#
# CÁCH DÙNG
#     bash 00-kiem-ke-he-thong-aws.sh
#     AWS_PROFILE=edutech-devops AWS_REGION=ap-northeast-1 bash 00-kiem-ke-he-thong-aws.sh
#
# KẾT QUẢ
#     ./kiem-ke-aws-<ngày>/            JSON đầy đủ từng mục
#     ./kiem-ke-aws-<ngày>/TONG_HOP.md ← gửi tệp này đi, nó đủ để đọc hiểu hệ thống
#     ./kiem-ke-aws-<ngày>.tar.gz      nén cả thư mục
#
# ⚠️ ĐỌC TONG_HOP.md TRƯỚC KHI GỬI CHO AI. Nó chứa endpoint RDS, IP public,
#    tên tài khoản DB — không chứa mật khẩu, nhưng vẫn là thông tin hạ tầng.
# =============================================================================

set -uo pipefail   # cố ý KHÔNG có -e: một mục lỗi không được làm chết cả bản kiểm kê

PROFILE="${AWS_PROFILE:-edutech-devops}"
REGION="${AWS_REGION:-ap-northeast-1}"
NGAY="$(date +%Y%m%d-%H%M)"
OUT="./kiem-ke-aws-${NGAY}"
MD="${OUT}/TONG_HOP.md"

mkdir -p "${OUT}"

AWS=(aws --profile "${PROFILE}" --region "${REGION}" --output json)

xanh()  { printf '\033[0;32m%s\033[0m\n' "$*"; }
vang()  { printf '\033[1;33m%s\033[0m\n' "$*"; }

# Chạy một lệnh aws, ghi JSON ra tệp, im lặng nếu lỗi (ghi lý do vào tệp).
luu() {
  local ten="$1"; shift
  local tep="${OUT}/${ten}.json"
  if "$@" > "${tep}" 2> "${OUT}/${ten}.err"; then
    rm -f "${OUT}/${ten}.err"
    xanh "  ok    ${ten}"
  else
    vang "  bỏ qua ${ten} (xem ${ten}.err — thường là thiếu quyền IAM)"
    echo "null" > "${tep}"
  fi
}

# Chạy lệnh aws ở chế độ bảng, append thẳng vào TONG_HOP.md
bang() {
  local tieu_de="$1"; shift
  {
    echo ""
    echo "### ${tieu_de}"
    echo ""
    echo '```'
    "$@" --output table 2>&1 || echo "(không lấy được — thiếu quyền hoặc không có tài nguyên)"
    echo '```'
  } >> "${MD}"
}

echo "Profile : ${PROFILE}"
echo "Region  : ${REGION}"
echo "Thư mục : ${OUT}"
echo ""

# ---------------------------------------------------------------------------
cat > "${MD}" <<EOF
# Kiểm kê hạ tầng AWS — 3T EduTech

- Thời điểm: $(date -u '+%Y-%m-%d %H:%M UTC')
- Profile: \`${PROFILE}\`
- Region: \`${REGION}\`

> Bản này do \`scripts/00-kiem-ke-he-thong-aws.sh\` sinh ra. Toàn bộ là lệnh chỉ đọc.
EOF

# ---------------------------------------------------------------------------
echo "== 1. Danh tính và region =="
luu "00-caller-identity"   "${AWS[@]}" sts get-caller-identity
luu "00-regions"           "${AWS[@]}" ec2 describe-availability-zones --query 'AvailabilityZones[].ZoneName'

bang "Đang chạy bằng danh tính nào" \
  aws --profile "${PROFILE}" --region "${REGION}" sts get-caller-identity

# ---------------------------------------------------------------------------
echo "== 2. EC2 =="
luu "10-ec2-instances"     "${AWS[@]}" ec2 describe-instances
luu "11-ec2-volumes"       "${AWS[@]}" ec2 describe-volumes
luu "12-ec2-eip"           "${AWS[@]}" ec2 describe-addresses
luu "13-ec2-keypairs"      "${AWS[@]}" ec2 describe-key-pairs
luu "14-ec2-snapshots"     "${AWS[@]}" ec2 describe-snapshots --owner-ids self

bang "Máy chủ EC2" \
  aws --profile "${PROFILE}" --region "${REGION}" ec2 describe-instances \
  --query 'Reservations[].Instances[].{
      Ten:Tags[?Key==`Name`]|[0].Value,
      Id:InstanceId,
      Loai:InstanceType,
      TrangThai:State.Name,
      IP_Private:PrivateIpAddress,
      IP_Public:PublicIpAddress,
      AZ:Placement.AvailabilityZone,
      Subnet:SubnetId,
      VPC:VpcId,
      SG:SecurityGroups[0].GroupId,
      Key:KeyName,
      IAM:IamInstanceProfile.Arn
  }'

bang "Ổ đĩa EBS (dung lượng và gắn vào máy nào)" \
  aws --profile "${PROFILE}" --region "${REGION}" ec2 describe-volumes \
  --query 'Volumes[].{
      Id:VolumeId, GB:Size, Loai:VolumeType, TrangThai:State,
      GanVao:Attachments[0].InstanceId, ThietBi:Attachments[0].Device
  }'

bang "Elastic IP" \
  aws --profile "${PROFILE}" --region "${REGION}" ec2 describe-addresses \
  --query 'Addresses[].{IP:PublicIp, GanVao:InstanceId, ENI:NetworkInterfaceId, AllocId:AllocationId}'

# ---------------------------------------------------------------------------
echo "== 3. Mạng: VPC, subnet, route, gateway =="
luu "20-vpcs"              "${AWS[@]}" ec2 describe-vpcs
luu "21-subnets"           "${AWS[@]}" ec2 describe-subnets
luu "22-route-tables"      "${AWS[@]}" ec2 describe-route-tables
luu "23-igw"               "${AWS[@]}" ec2 describe-internet-gateways
luu "24-nat"               "${AWS[@]}" ec2 describe-nat-gateways
luu "25-nacl"              "${AWS[@]}" ec2 describe-network-acls
luu "26-vpc-endpoints"     "${AWS[@]}" ec2 describe-vpc-endpoints
luu "27-peering"           "${AWS[@]}" ec2 describe-vpc-peering-connections

bang "VPC" \
  aws --profile "${PROFILE}" --region "${REGION}" ec2 describe-vpcs \
  --query 'Vpcs[].{Id:VpcId, CIDR:CidrBlock, MacDinh:IsDefault, Ten:Tags[?Key==`Name`]|[0].Value}'

bang "Subnet" \
  aws --profile "${PROFILE}" --region "${REGION}" ec2 describe-subnets \
  --query 'Subnets[].{Id:SubnetId, VPC:VpcId, CIDR:CidrBlock, AZ:AvailabilityZone,
      TuDongGanIP:MapPublicIpOnLaunch, Ten:Tags[?Key==`Name`]|[0].Value}'

bang "Bảng định tuyến — có đường ra Internet không" \
  aws --profile "${PROFILE}" --region "${REGION}" ec2 describe-route-tables \
  --query 'RouteTables[].{Id:RouteTableId, VPC:VpcId,
      Subnet:Associations[0].SubnetId,
      DichDen:Routes[?DestinationCidrBlock==`0.0.0.0/0`]|[0].DestinationCidrBlock,
      QuaCong:Routes[?DestinationCidrBlock==`0.0.0.0/0`]|[0].GatewayId,
      QuaNAT:Routes[?DestinationCidrBlock==`0.0.0.0/0`]|[0].NatGatewayId}'

# ---------------------------------------------------------------------------
echo "== 4. Security Group — phần hay sai nhất =="
luu "30-security-groups"   "${AWS[@]}" ec2 describe-security-groups

bang "Security Group — danh sách" \
  aws --profile "${PROFILE}" --region "${REGION}" ec2 describe-security-groups \
  --query 'SecurityGroups[].{Id:GroupId, Ten:GroupName, VPC:VpcId, MoTa:Description}'

# Bảng luật ingress trải phẳng — đây là thứ cần nhìn để biết máy nào gọi được máy nào
{
  echo ""
  echo "### Luật INGRESS trải phẳng (nguồn nào được vào cổng nào)"
  echo ""
  echo '```'
  # [SỬA 23/08/2026] Trước đây dùng `--output text` + awk. Khi một luật KHÔNG có
  # IpRanges (luật tham chiếu security group), trường đó rỗng, `--output text`
  # bỏ luôn cột — và awk đọc lệch một cột, in ID của security group vào chỗ
  # "cidr=". Bản kiểm kê ngày 23/08 đã hiển thị sai đúng kiểu đó.
  # Đọc từ JSON đã lưu thì không có chuyện lệch cột.
  python3 - "${OUT}/30-security-groups.json" <<'PY'
import json, sys

with open(sys.argv[1], encoding="utf-8") as f:
    data = json.load(f) or {}

CANH_BAO_CONG = {22: "SSH", 3389: "RDP", 1433: "SQL Server", 8000: "vLLM", 2111: "AI Service"}

for sg in data.get("SecurityGroups", []):
    print(f"\n[{sg['GroupId']}  {sg['GroupName']}]")
    if not sg.get("IpPermissions"):
        print("  (không có luật vào)")
    for luat in sg.get("IpPermissions", []):
        giao_thuc = luat.get("IpProtocol", "?")
        tu = luat.get("FromPort", "mọi")
        den = luat.get("ToPort", "mọi")
        cong = f"{tu}" if tu == den else f"{tu}-{den}"

        nguon = [r["CidrIp"] for r in luat.get("IpRanges", [])]
        nguon += [r["CidrIpv6"] for r in luat.get("Ipv6Ranges", [])]
        nhom = [g["GroupId"] for g in luat.get("UserIdGroupPairs", [])]

        for n in nguon:
            canh = ""
            if n in ("0.0.0.0/0", "::/0"):
                ten = CANH_BAO_CONG.get(tu, "")
                canh = f"   ⚠️  MỞ RA TOÀN INTERNET{' — ' + ten if ten else ''}"
            print(f"  {giao_thuc:<5} {cong:<10} cidr  {n:<20}{canh}")
        for g in nhom:
            print(f"  {giao_thuc:<5} {cong:<10} sg    {g}")
PY
  echo '```'
} >> "${MD}"

# ---------------------------------------------------------------------------
echo "== 5. RDS =="
luu "40-rds-instances"     "${AWS[@]}" rds describe-db-instances
luu "41-rds-subnet-groups" "${AWS[@]}" rds describe-db-subnet-groups
luu "42-rds-param-groups"  "${AWS[@]}" rds describe-db-parameter-groups
luu "43-rds-snapshots"     "${AWS[@]}" rds describe-db-snapshots --snapshot-type manual

bang "RDS" \
  aws --profile "${PROFILE}" --region "${REGION}" rds describe-db-instances \
  --query 'DBInstances[].{
      Id:DBInstanceIdentifier,
      Engine:Engine,
      Ban:EngineVersion,
      Loai:DBInstanceClass,
      TrangThai:DBInstanceStatus,
      Endpoint:Endpoint.Address,
      Cong:Endpoint.Port,
      CongKhai:PubliclyAccessible,
      VPC:DBSubnetGroup.VpcId,
      SG:join(`,`,VpcSecurityGroups[].VpcSecurityGroupId),
      TaiKhoan:MasterUsername,
      AZ:AvailabilityZone,
      MaHoa:StorageEncrypted
  }'

bang "Subnet group của RDS (RDS nằm ở subnet nào)" \
  aws --profile "${PROFILE}" --region "${REGION}" rds describe-db-subnet-groups \
  --query 'DBSubnetGroups[].{Ten:DBSubnetGroupName, VPC:VpcId,
      Subnets:join(`,`,Subnets[].SubnetIdentifier)}'

# ---------------------------------------------------------------------------
echo "== 6. Load balancer, DNS, chứng chỉ =="
luu "50-elbv2"             "${AWS[@]}" elbv2 describe-load-balancers
luu "51-target-groups"     "${AWS[@]}" elbv2 describe-target-groups
luu "52-acm"               "${AWS[@]}" acm list-certificates
luu "53-route53-zones"     aws --profile "${PROFILE}" --output json route53 list-hosted-zones

bang "Load balancer" \
  aws --profile "${PROFILE}" --region "${REGION}" elbv2 describe-load-balancers \
  --query 'LoadBalancers[].{Ten:LoadBalancerName, Loai:Type, DNS:DNSName, TrangThai:State.Code, VPC:VpcId}'

bang "Chứng chỉ ACM" \
  aws --profile "${PROFILE}" --region "${REGION}" acm list-certificates \
  --query 'CertificateSummaryList[].{TenMien:DomainName, Arn:CertificateArn}'

bang "Hosted zone Route53" \
  aws --profile "${PROFILE}" route53 list-hosted-zones \
  --query 'HostedZones[].{Ten:Name, Id:Id, SoBanGhi:ResourceRecordSetCount}'

# ---------------------------------------------------------------------------
echo "== 7. S3, IAM, ECR =="
luu "60-s3-buckets"        aws --profile "${PROFILE}" --output json s3api list-buckets
luu "61-iam-roles"         aws --profile "${PROFILE}" --output json iam list-roles
luu "62-instance-profiles" aws --profile "${PROFILE}" --output json iam list-instance-profiles
luu "63-ecr-repos"         "${AWS[@]}" ecr describe-repositories

bang "S3 bucket" \
  aws --profile "${PROFILE}" s3api list-buckets \
  --query 'Buckets[].{Ten:Name, Tao:CreationDate}'

# ---------------------------------------------------------------------------
echo "== 8. Giám sát và hạn mức =="
luu "70-cw-alarms"         "${AWS[@]}" cloudwatch describe-alarms
luu "71-cw-log-groups"     "${AWS[@]}" logs describe-log-groups
luu "72-quota-g-instances" "${AWS[@]}" service-quotas get-service-quota \
                             --service-code ec2 --quota-code L-DB2E81BA

bang "Hạn mức vCPU cho instance dòng G (quyết định có bật được g6e không)" \
  aws --profile "${PROFILE}" --region "${REGION}" service-quotas get-service-quota \
  --service-code ec2 --quota-code L-DB2E81BA \
  --query 'Quota.{Ten:QuotaName, GiaTri:Value, DonVi:Unit}'

# ---------------------------------------------------------------------------
echo "== 9. Chi phí =="
# Cost Explorer chỉ có ở us-east-1, và cần quyền ce:GetCostAndUsage.
TU="$(date -u -d '14 days ago' +%Y-%m-%d 2>/dev/null || date -u -v-14d +%Y-%m-%d)"
DEN="$(date -u +%Y-%m-%d)"

luu "80-chi-phi-14-ngay" \
  aws --profile "${PROFILE}" --region us-east-1 --output json ce get-cost-and-usage \
    --time-period "Start=${TU},End=${DEN}" \
    --granularity DAILY --metrics UnblendedCost \
    --group-by Type=DIMENSION,Key=SERVICE

{
  echo ""
  echo "### Chi phí 14 ngày gần nhất, gộp theo dịch vụ"
  echo ""
  echo '```'
  # [SỬA 23/08/2026] Bản cũ dùng `--output text` + awk cắt theo khoảng trắng.
  # Tên dịch vụ AWS có dấu cách ("Amazon Elastic Compute Cloud - Compute") nên
  # awk vỡ tên thành nhiều cột và in ra "Amazon 0.00 Compute". Đọc JSON thay vì
  # cắt chuỗi.
  python3 - "${OUT}/80-chi-phi-14-ngay.json" <<'PY'
import json, sys
from collections import defaultdict

with open(sys.argv[1], encoding="utf-8") as f:
    data = json.load(f) or {}

tong = defaultdict(float)
don_vi = "USD"
for khoang in data.get("ResultsByTime", []):
    for nhom in khoang.get("Groups", []):
        chi_phi = nhom["Metrics"]["UnblendedCost"]
        tong[nhom["Keys"][0]] += float(chi_phi["Amount"])
        don_vi = chi_phi.get("Unit", don_vi)

if not tong:
    print("  (không có dữ liệu — thiếu quyền ce:GetCostAndUsage, hoặc chưa phát sinh chi phí)")
else:
    for ten, tien in sorted(tong.items(), key=lambda kv: -kv[1])[:20]:
        if tien < 0.005:
            continue
        print(f"  {ten:<52} {tien:>9.2f} {don_vi}")
    print(f"  {'—' * 52} {sum(tong.values()):>9.2f} {don_vi}  (tổng 14 ngày)")
PY
  echo '```'
} >> "${MD}"

# ---------------------------------------------------------------------------
echo "== 10. Kiểm tra thông mạng từ chính máy này =="
{
  echo ""
  echo "## Kiểm tra thông mạng (chạy từ máy đang thực thi script)"
  echo ""
  echo '```'
  RDS_EP="$(aws --profile "${PROFILE}" --region "${REGION}" --output text \
      rds describe-db-instances --query 'DBInstances[0].Endpoint.Address' 2>/dev/null)"
  RDS_PORT="$(aws --profile "${PROFILE}" --region "${REGION}" --output text \
      rds describe-db-instances --query 'DBInstances[0].Endpoint.Port' 2>/dev/null)"

  # [SỬA 23/08/2026] Bản cũ kết luận thẳng "Security Group hoặc VPC sai" khi cổng
  # đóng. Sai. Có ít nhất ba lý do khác làm cổng đóng dù cấu hình hoàn toàn đúng:
  # RDS đang stopped, RDS không public mà script chạy từ ngoài VPC, hoặc RDS đang
  # ở giữa một lần khởi động lại. Phải loại trừ chúng TRƯỚC khi đổ lỗi cho mạng.
  RDS_STATE="$(aws --profile "${PROFILE}" --region "${REGION}" --output text \
      rds describe-db-instances --query 'DBInstances[0].DBInstanceStatus' 2>/dev/null)"
  RDS_PUBLIC="$(aws --profile "${PROFILE}" --region "${REGION}" --output text \
      rds describe-db-instances --query 'DBInstances[0].PubliclyAccessible' 2>/dev/null)"
  # Máy này có nằm trong VPC không? Chỉ EC2 mới có endpoint metadata này.
  if timeout 2 bash -c '</dev/tcp/169.254.169.254/80' 2>/dev/null; then
    TRONG_VPC="có (đang chạy trên EC2)"
  else
    TRONG_VPC="KHÔNG (đang chạy ngoài AWS)"
  fi

  if [[ -n "${RDS_EP}" && "${RDS_EP}" != "None" ]]; then
    echo "RDS endpoint : ${RDS_EP}:${RDS_PORT}"
    echo "RDS trạng thái: ${RDS_STATE}"
    echo "RDS public    : ${RDS_PUBLIC}"
    echo "Máy này trong VPC: ${TRONG_VPC}"
    echo -n "  DNS phân giải : "
    getent hosts "${RDS_EP}" 2>/dev/null || echo "KHÔNG phân giải được"
    echo -n "  TCP mở cổng   : "
    if timeout 5 bash -c "</dev/tcp/${RDS_EP}/${RDS_PORT}" 2>/dev/null; then
      echo "MỞ ✅  (mạng đúng — lỗi nếu có là ở tài khoản/mật khẩu)"
    else
      echo "ĐÓNG"
      if [[ "${RDS_STATE}" != "available" ]]; then
        echo "     → Lý do: RDS đang '${RDS_STATE}', chưa nhận kết nối."
        echo "       Đây KHÔNG phải lỗi Security Group. Bật lên rồi thử lại:"
        echo "       aws rds start-db-instance --db-instance-identifier <id>"
      elif [[ "${RDS_PUBLIC}" == "False" && "${TRONG_VPC}" == KHÔNG* ]]; then
        echo "     → Lý do: RDS không public và bạn đang chạy NGOÀI VPC."
        echo "       Đây KHÔNG phải lỗi Security Group. Chạy lại script này TỪ EC2."
      else
        echo "     → RDS đang 'available' và bạn ở trong VPC → giờ mới nên nghi"
        echo "       Security Group / route table. Xem mục 'Luật INGRESS' ở trên."
      fi
    fi
  else
    echo "Không đọc được endpoint RDS."
  fi

  echo ""
  echo "Máy này ra Internet được không (cần cho docker pull):"
  echo -n "  registry-1.docker.io:443 : "
  timeout 5 bash -c '</dev/tcp/registry-1.docker.io/443' 2>/dev/null && echo "MỞ ✅" || echo "ĐÓNG ❌"
  echo -n "  mcr.microsoft.com:443    : "
  timeout 5 bash -c '</dev/tcp/mcr.microsoft.com/443' 2>/dev/null && echo "MỞ ✅" || echo "ĐÓNG ❌"
  echo '```'
} >> "${MD}"

# ---------------------------------------------------------------------------
tar -czf "${OUT}.tar.gz" "${OUT}" 2>/dev/null

echo ""
xanh "Xong."
echo ""
echo "  Bản tóm tắt để đọc/gửi đi : ${MD}"
echo "  JSON đầy đủ               : ${OUT}/"
echo "  Bản nén                   : ${OUT}.tar.gz"
echo ""
vang "Đọc lướt ${MD} trước khi gửi cho ai — nó có endpoint RDS và IP public."
