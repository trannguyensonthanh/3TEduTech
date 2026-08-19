#!/usr/bin/env bash
# =============================================================================
# 03-bat-https.sh — Xin chứng chỉ Let's Encrypt và bật HTTPS
# =============================================================================
# [THÊM 18/08/2026]
#
#     sudo bash scripts/03-bat-https.sh ten-mien-cua-ban.duckdns.org  email@cua-ban.com
#
# Điều kiện trước khi chạy:
#   1. Tên miền đã trỏ về IP công cộng của máy chủ này (kiểm tra: dig +short <ten-mien>)
#   2. Cổng 80 mở với 0.0.0.0/0 trong Security Group — Let's Encrypt gọi từ
#      nhiều nơi trên thế giới nên KHÔNG giới hạn nguồn được
#   3. Ngăn xếp đang chạy (docker compose up -d)
#
# Chạy lại nhiều lần được: đã có chứng chỉ thì certbot bỏ qua bước xin.
# =============================================================================

set -euo pipefail

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
buoc()     { echo -e "\n${GREEN}==> $*${NC}"; }
canh_bao() { echo -e "${YELLOW}[!] $*${NC}"; }
loi()      { echo -e "${RED}[LỖI] $*${NC}" >&2; }

TEN_MIEN="${1:-}"
EMAIL="${2:-}"
THU_MUC_APP="${THU_MUC_APP:-/opt/3t-edu-tech}"
COMPOSE="docker compose -f ${THU_MUC_APP}/docker-compose.cpu-ec2.yml"

if [[ -z "${TEN_MIEN}" || -z "${EMAIL}" ]]; then
  loi "Cách dùng: sudo bash $0 <ten-mien> <email>"
  loi "Ví dụ:     sudo bash $0 3tedutech.duckdns.org toi@gmail.com"
  exit 1
fi

if [[ $EUID -ne 0 ]]; then
  loi "Cần quyền root: sudo bash $0 ..."
  exit 1
fi

# ---------------------------------------------------------------------------
buoc "1/5 — Kiểm tra tên miền đã trỏ đúng máy này chưa"
# ---------------------------------------------------------------------------
# ★ Kiểm tra TRƯỚC khi gọi certbot có lý do rất cụ thể: Let's Encrypt áp hạn
# mức 5 lần thất bại/giờ cho mỗi cặp (tên miền, tài khoản). Bấm bừa vài lần khi
# DNS chưa kịp lan là bị khóa cả tiếng đồng hồ — và lúc đó không có cách nào
# rút ngắn ngoài việc ngồi đợi.
IP_MAY_NAY="$(curl -fsS --max-time 10 https://checkip.amazonaws.com || echo '')"
IP_TEN_MIEN="$(getent hosts "${TEN_MIEN}" | awk '{print $1}' | head -1 || echo '')"

echo "  IP máy chủ này : ${IP_MAY_NAY:-không xác định được}"
echo "  ${TEN_MIEN} trỏ tới : ${IP_TEN_MIEN:-chưa phân giải được}"

if [[ -z "${IP_TEN_MIEN}" ]]; then
  loi "Tên miền chưa phân giải được. DNS có thể cần vài phút để lan."
  exit 1
fi
if [[ -n "${IP_MAY_NAY}" && "${IP_TEN_MIEN}" != "${IP_MAY_NAY}" ]]; then
  loi "Tên miền đang trỏ tới ${IP_TEN_MIEN}, KHÔNG phải máy này (${IP_MAY_NAY})."
  loi "Sửa bản ghi DNS rồi đợi vài phút, đừng chạy tiếp — sẽ chỉ tốn hạn mức."
  exit 1
fi
echo "  ✅ Khớp."

# ---------------------------------------------------------------------------
buoc "2/5 — Kiểm tra đường dẫn ACME đi qua được Nginx"
# ---------------------------------------------------------------------------
# Thử trước bằng một tệp giả. Nếu bước này hỏng thì certbot chắc chắn cũng
# hỏng, nhưng ở đây ta thấy rõ nguyên nhân thay vì nhận một thông báo mơ hồ.
mkdir -p "${THU_MUC_APP}/certbot-www/.well-known/acme-challenge"
echo "3tedutech-acme-test" > "${THU_MUC_APP}/certbot-www/.well-known/acme-challenge/kiem-tra"

if curl -fsS --max-time 15 "http://${TEN_MIEN}/.well-known/acme-challenge/kiem-tra" \
     | grep -q '3tedutech-acme-test'; then
  echo "  ✅ Let's Encrypt sẽ đọc được thư mục thử thách."
else
  loi "Không đọc được tệp thử thách qua HTTP."
  cat <<'CHAN_DOAN'

Kiểm tra theo thứ tự:

  1. Security Group của EC2 có mở cổng 80 cho 0.0.0.0/0 không?
     Let's Encrypt xác thực từ nhiều địa điểm nên KHÔNG giới hạn nguồn được.

  2. Container frontend còn sống không?
       docker compose -f docker-compose.cpu-ec2.yml ps frontend

  3. nginx/conf.d/locations.inc có khối `location ^~ /.well-known/acme-challenge/` không?

  4. docker-compose.cpu-ec2.yml có mount `./certbot-www:/var/www/certbot:ro` không?

CHAN_DOAN
  rm -f "${THU_MUC_APP}/certbot-www/.well-known/acme-challenge/kiem-tra"
  exit 1
fi
rm -f "${THU_MUC_APP}/certbot-www/.well-known/acme-challenge/kiem-tra"

# ---------------------------------------------------------------------------
buoc "3/5 — Xin chứng chỉ"
# ---------------------------------------------------------------------------
# `--webroot` chứ KHÔNG phải `--standalone`:
#
#   --standalone bắt certbot tự mở cổng 80, nghĩa là phải TẮT container
#   frontend mỗi lần xin VÀ mỗi lần gia hạn. Gia hạn chạy tự động 90 ngày một
#   lần lúc rạng sáng; một lần hỏng vì cổng bận là chứng chỉ hết hạn mà không
#   ai biết. `--webroot` để Nginx phục vụ tệp thử thách như một tệp tĩnh bình
#   thường — không cần tắt gì cả.
if [[ -d "/etc/letsencrypt/live/${TEN_MIEN}" ]]; then
  canh_bao "Đã có chứng chỉ cho ${TEN_MIEN}, bỏ qua bước xin."
else
  certbot certonly \
    --webroot -w "${THU_MUC_APP}/certbot-www" \
    -d "${TEN_MIEN}" \
    --email "${EMAIL}" \
    --agree-tos \
    --no-eff-email \
    --non-interactive
fi

# ---------------------------------------------------------------------------
buoc "4/5 — Chuyển Nginx sang cấu hình HTTPS"
# ---------------------------------------------------------------------------
MAU="${THU_MUC_APP}/nginx/https-server.conf.template"
DICH="${THU_MUC_APP}/nginx/conf.d/default.conf"

if [[ ! -f "${MAU}" ]]; then
  loi "Không tìm thấy ${MAU}"
  exit 1
fi

# Sao lưu bản HTTP để quay lui được.
#
# ⚠️ Đuôi `.bak` chứ KHÔNG phải `.conf` — thư mục conf.d được mount cả cụm vào
# container, và Nginx nạp MỌI tệp `*.conf` trong đó. Một bản sao lưu tên
# `default-cu.conf` sẽ được nạp song song và Nginx đổ với lỗi trùng
# "duplicate default server".
cp "${DICH}" "${DICH}.http.bak"
echo "  Đã sao lưu bản HTTP: ${DICH}.http.bak"

sed "s/__DOMAIN__/${TEN_MIEN}/g" "${MAU}" > "${DICH}"
echo "  Đã sinh cấu hình HTTPS cho ${TEN_MIEN}"

# ---------------------------------------------------------------------------
buoc "5/5 — Kiểm tra cấu hình rồi nạp lại"
# ---------------------------------------------------------------------------
# ★ `nginx -t` TRƯỚC khi `nginx -s reload`.
#
# `reload` với cấu hình sai KHÔNG làm sập tiến trình đang chạy (Nginx giữ cấu
# hình cũ), nhưng nó cũng không báo gì rõ ràng — bạn tưởng đã bật HTTPS mà thực
# tế vẫn đang chạy cấu hình cũ. Tệ hơn: lần container khởi động lại tiếp theo
# sẽ đọc cấu hình sai và chết hẳn, vào đúng lúc bạn không hề đụng gì tới nó.
if ! ${COMPOSE} exec -T frontend nginx -t; then
  loi "Cấu hình Nginx không hợp lệ. Đang khôi phục bản HTTP…"
  mv "${DICH}.http.bak" "${DICH}"
  ${COMPOSE} exec -T frontend nginx -s reload || true
  exit 1
fi

${COMPOSE} exec -T frontend nginx -s reload
echo "  ✅ Nginx đã nạp cấu hình HTTPS."

# ---------------------------------------------------------------------------
buoc "Kiểm tra tự động gia hạn"
# ---------------------------------------------------------------------------
# certbot cài sẵn một systemd timer chạy hai lần mỗi ngày. Nó CHỈ gia hạn khi
# chứng chỉ còn dưới 30 ngày, nên không tốn hạn mức.
#
# `--dry-run` diễn tập toàn bộ quy trình với máy chủ thử nghiệm của Let's
# Encrypt. Đây là lúc DUY NHẤT bạn phát hiện được gia hạn có chạy hay không —
# lần gia hạn thật diễn ra sau 60 ngày nữa, và nếu nó hỏng thì bạn chỉ biết khi
# trình duyệt bắt đầu báo "không an toàn".
if certbot renew --dry-run --webroot -w "${THU_MUC_APP}/certbot-www"; then
  echo "  ✅ Diễn tập gia hạn thành công."
else
  canh_bao "Diễn tập gia hạn THẤT BẠI. Chứng chỉ hiện tại vẫn dùng được ~90 ngày,"
  canh_bao "nhưng phải sửa trước khi hết hạn. Xem: certbot renew --dry-run -v"
fi

# Nạp lại Nginx sau mỗi lần gia hạn — nếu không, Nginx giữ chứng chỉ cũ trong
# bộ nhớ cho tới lần khởi động lại kế tiếp, và người dùng vẫn nhận chứng chỉ
# đã hết hạn dù trên đĩa đã có bản mới.
mkdir -p /etc/letsencrypt/renewal-hooks/deploy
cat > /etc/letsencrypt/renewal-hooks/deploy/nap-lai-nginx.sh <<HOOK
#!/bin/sh
docker compose -f ${THU_MUC_APP}/docker-compose.cpu-ec2.yml exec -T frontend nginx -s reload
HOOK
chmod +x /etc/letsencrypt/renewal-hooks/deploy/nap-lai-nginx.sh
echo "  ✅ Đã cài hook nạp lại Nginx sau mỗi lần gia hạn."

cat <<KET_QUA

======================================================================
 HTTPS đã bật:  https://${TEN_MIEN}

 Việc còn phải làm bằng tay:

  1. Cập nhật GitHub Secrets rồi CHẠY LẠI CI/CD:
        VITE_API_URL  = https://${TEN_MIEN}/v1
     ⚠️ Vite nhúng biến này vào bundle LÚC BUILD. Không build lại ảnh
        frontend thì trình duyệt vẫn gọi địa chỉ HTTP cũ và bị chặn vì
        lỗi nội dung hỗn hợp (mixed content).

  2. Cập nhật trong secret BACKEND_ENV_PRODUCTION:
        SERVER_URL=https://${TEN_MIEN}
        FRONTEND_URL=https://${TEN_MIEN}
        CORS_ALLOWED_ORIGINS=https://${TEN_MIEN}
        VNP_RETURN_URL / VNP_IPN_URL / GOOGLE_CALLBACK_URL / FACEBOOK_CALLBACK_URL

  3. Khai báo lại URL chuyển hướng ở từng nhà cung cấp:
        Google Cloud Console, Facebook Developers, VNPay, Stripe, PayPal

  4. Sau vài tuần chạy ổn định, cân nhắc bật HSTS
     (dòng Strict-Transport-Security trong nginx/https-server.conf.template).
     Đọc kỹ cảnh báo ở đó trước — đây là thứ không rút lại được.
======================================================================
KET_QUA
