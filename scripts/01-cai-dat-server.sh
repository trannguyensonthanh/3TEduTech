#!/usr/bin/env bash
# =============================================================================
# 01-cai-dat-server.sh — Chuẩn bị EC2 Ubuntu để chạy 3T EduTech
# =============================================================================
# Chạy MỘT LẦN trên EC2 CPU, ngay sau khi SSH vào lần đầu:
#
#     curl -fsSL -o 01-cai-dat-server.sh <duong-dan-raw-github>
#     sudo bash 01-cai-dat-server.sh
#
# Hoặc chép tệp này lên rồi:  sudo bash 01-cai-dat-server.sh
#
# Script làm gì:
#   1. Cài Docker Engine + Docker Compose plugin (kho chính thức của Docker,
#      KHÔNG dùng `apt install docker.io` — bản đó cũ và thiếu `docker compose`)
#   2. Cho user hiện tại chạy docker không cần sudo
#   3. Tạo /opt/3t-edu-tech và các thư mục con
#   4. Bật swap 2GB — quan trọng trên t3.medium 4GB
#   5. Giới hạn log của Docker để không ăn hết ổ EBS
#   6. Cài certbot (chuẩn bị cho HTTPS)
#
# An toàn khi chạy lại nhiều lần (idempotent).
# =============================================================================

set -euo pipefail

# `set -e` KHÔNG bắt được lỗi ở giữa một pipeline (`a | b`) nếu chỉ `a` hỏng.
# `set -o pipefail` mới bắt. Thiếu nó, `curl ... | sh` mà curl hỏng thì script
# vẫn đi tiếp và báo thành công.

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
buoc() { echo -e "\n${GREEN}==> $*${NC}"; }
canh_bao() { echo -e "${YELLOW}[!] $*${NC}"; }
loi() { echo -e "${RED}[LỖI] $*${NC}" >&2; }

if [[ $EUID -ne 0 ]]; then
  loi "Cần chạy bằng quyền root:  sudo bash $0"
  exit 1
fi

# Người dùng thật đang chạy sudo. Cần biết để thêm vào nhóm docker và đặt quyền
# sở hữu thư mục — nếu dùng $USER thì khi chạy qua sudo nó ra "root", và mọi tệp
# sẽ thuộc về root khiến deploy bằng SSH sau này không ghi được.
NGUOI_DUNG="${SUDO_USER:-ubuntu}"
THU_MUC_APP="/opt/3t-edu-tech"

# ---------------------------------------------------------------------------
buoc "1/6 — Cập nhật hệ thống"
# ---------------------------------------------------------------------------
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y

# ---------------------------------------------------------------------------
buoc "2/6 — Cài Docker Engine + Compose plugin"
# ---------------------------------------------------------------------------
if command -v docker &>/dev/null && docker compose version &>/dev/null; then
  echo "Docker đã có sẵn: $(docker --version)"
else
  apt-get install -y ca-certificates curl gnupg

  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    | gpg --dearmor -o /etc/apt/keyrings/docker.gpg --yes
  chmod a+r /etc/apt/keyrings/docker.gpg

  # `. /etc/os-release` lấy VERSION_CODENAME (noble cho 24.04, jammy cho 22.04)
  # thay vì ghi cứng — cùng script chạy được trên cả hai bản Ubuntu.
  . /etc/os-release
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" \
    > /etc/apt/sources.list.d/docker.list

  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io \
                     docker-buildx-plugin docker-compose-plugin
fi

systemctl enable --now docker

# ---------------------------------------------------------------------------
buoc "3/6 — Cho '${NGUOI_DUNG}' chạy docker không cần sudo"
# ---------------------------------------------------------------------------
usermod -aG docker "${NGUOI_DUNG}"
canh_bao "Phải THOÁT SSH VÀ ĐĂNG NHẬP LẠI thì quyền nhóm mới có hiệu lực."
canh_bao "Đây cũng là lý do bước deploy qua SSH của CI/CD phải chạy SAU khi bạn đã đăng nhập lại ít nhất một lần."

# ---------------------------------------------------------------------------
buoc "4/6 — Tạo thư mục ứng dụng"
# ---------------------------------------------------------------------------
mkdir -p "${THU_MUC_APP}"/{nginx/conf.d,certbot-www,scripts,db-init,backup}
# Quyền sở hữu thuộc về người dùng SSH: CI/CD dùng scp ghi vào đây, mà scp
# không có sudo.
chown -R "${NGUOI_DUNG}:${NGUOI_DUNG}" "${THU_MUC_APP}"
echo "Đã tạo ${THU_MUC_APP}"

# ---------------------------------------------------------------------------
buoc "5/6 — Bật swap 2GB"
# ---------------------------------------------------------------------------
# ★ VÌ SAO CẦN SWAP TRÊN MÁY 4GB
#
# Bốn container cộng lại có trần 2816MB, nhưng lúc `docker compose up` cả bốn
# cùng khởi động và cùng đạt đỉnh bộ nhớ trong vài giây đầu. Không có swap thì
# OOM-killer của nhân Linux ra tay — và nó chọn nạn nhân theo điểm số riêng,
# KHÔNG nhất thiết giết đúng tiến trình đang ngốn RAM. Triệu chứng thường thấy
# là "container tự nhiên chết lúc deploy", rất khó lần ra.
#
# Swap chậm hơn RAM nhiều, nên đây là lưới an toàn chứ không phải giải pháp
# tăng dung lượng. Nếu phải dùng swap thường xuyên thì đã đến lúc nâng máy.
if swapon --show | grep -q '/swapfile'; then
  echo "Swap đã bật sẵn."
else
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab

  # vm.swappiness=10: chỉ dùng swap khi thật sự sắp hết RAM, thay vì mặc định 60
  # (đẩy trang ra swap khá sớm, làm mọi thứ chậm đi không cần thiết).
  sysctl -w vm.swappiness=10
  grep -q 'vm.swappiness' /etc/sysctl.conf || echo 'vm.swappiness=10' >> /etc/sysctl.conf
  echo "Đã bật swap 2GB."
fi

# ---------------------------------------------------------------------------
buoc "6/6 — Giới hạn log Docker + cài certbot"
# ---------------------------------------------------------------------------
# Mặc định Docker ghi log json-file KHÔNG GIỚI HẠN. Trên ổ EBS 20–30GB, một
# container nói nhiều có thể ăn hết ổ trong vài tuần — và ổ đầy thì Docker không
# ghi được gì nữa, Redis không lưu được RDB, hỏng lan ra toàn hệ thống.
#
# Các service trong docker-compose.cpu-ec2.yml đã tự khai báo giới hạn, nhưng
# đặt thêm ở mức daemon để container chạy tay (ví dụ flyway lúc migration) cũng
# được bảo vệ.
if [[ ! -f /etc/docker/daemon.json ]]; then
  mkdir -p /etc/docker
  cat > /etc/docker/daemon.json <<'JSON'
{
  "log-driver": "json-file",
  "log-opts": { "max-size": "10m", "max-file": "3" }
}
JSON
  systemctl restart docker
  echo "Đã đặt giới hạn log cho Docker daemon."
else
  canh_bao "/etc/docker/daemon.json đã tồn tại — KHÔNG ghi đè. Hãy tự thêm log-opts nếu chưa có."
fi

# certbot qua snap là cách cài chính thức được Let's Encrypt khuyến nghị; bản
# trong apt của Ubuntu thường cũ hơn vài phiên bản.
if command -v certbot &>/dev/null; then
  echo "certbot đã có: $(certbot --version 2>&1)"
else
  apt-get install -y snapd
  snap install core && snap refresh core
  snap install --classic certbot
  ln -sf /snap/bin/certbot /usr/bin/certbot
  echo "Đã cài certbot."
fi

# ---------------------------------------------------------------------------
echo
buoc "HOÀN TẤT"
cat <<HUONG_DAN

Việc tiếp theo, theo đúng thứ tự:

  1. THOÁT SSH VÀ ĐĂNG NHẬP LẠI  (để quyền nhóm docker có hiệu lực)
       exit
       ssh -i <khoa.pem> ${NGUOI_DUNG}@<ip-cua-ban>

  2. Kiểm tra:
       docker run --rm hello-world
       docker compose version

  3. Tạo hai tệp biến môi trường trên máy chủ — xem Phần 4 của
     HUONG_DAN_TRIEN_KHAI_AWS.md:
       ${THU_MUC_APP}/3t-edu-tech-backend/.env.production
       ${THU_MUC_APP}/ai-service/.env.production

  4. Chạy migration cơ sở dữ liệu lên RDS:
       sudo bash ${THU_MUC_APP}/scripts/02-chay-migration.sh

  5. Bật CI/CD trên GitHub (đặt biến DEPLOY_ENABLED = true).

HUONG_DAN
