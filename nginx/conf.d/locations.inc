# =============================================================================
# locations.inc — TOÀN BỘ location dùng chung cho cả HTTP và HTTPS
# =============================================================================
# [THÊM 18/08/2026]
#
# ⚠️ Tệp này KHÔNG kết thúc bằng `.conf` — CÓ CHỦ Ý.
#
# Nginx tự nạp mọi tệp `*.conf` trong /etc/nginx/conf.d ở ngữ cảnh `http`.
# Nếu đặt tên là `.conf`, nginx sẽ cố nạp các `location` này ở tầng http và
# thoát với "location directive is not allowed here". Phần mở rộng `.inc` khiến
# nginx bỏ qua, và nó chỉ được kéo vào bởi `include` bên trong khối `server`.
#
# ★ VÌ SAO PHẢI TÁCH RA
#
# Bản cũ chép nguyên toàn bộ location blocks hai lần: một lần cho server HTTP,
# một lần cho khối HTTPS (đang comment). Hai bản đó ĐÃ LỆCH NHAU: bản HTTPS
# thiếu hẳn `/socket.io/` và `/v1/events/` — tức là ngay khi bật SSL thì chat
# realtime và thông báo tức thời chết, mà không có lỗi nào chỉ ra nguyên nhân.
#
# Tách ra một tệp dùng chung khiến sai lệch kiểu đó không thể xảy ra.
# =============================================================================

# ---- Điểm kiểm tra sức khỏe của chính Nginx ----
# [THÊM 18/08/2026] Docker healthcheck gọi đường dẫn này.
#
# ★ Vì sao KHÔNG kiểm tra `/`: khi bật HTTPS, cổng 80 chuyển hướng 301 sang
# https://$host — mà $host lúc healthcheck gọi từ bên trong container là
# "localhost", không khớp chứng chỉ. `wget --spider` đi theo chuyển hướng, gặp
# lỗi TLS, và container bị đánh dấu "unhealthy" VĨNH VIỄN dù trang web phục vụ
# người dùng thật hoàn toàn bình thường.
#
# Đường dẫn này trả 200 thẳng, không đụng tới backend, nên nó trả lời đúng câu
# hỏi "Nginx còn sống và cấu hình còn hợp lệ không?".
location = /nginx-health {
    access_log off;
    add_header Content-Type text/plain;
    return 200 "ok\n";
}

# ---- ACME challenge (Let's Encrypt) ----
# [THÊM 18/08/2026] Bắt buộc để xin và GIA HẠN chứng chỉ mà KHÔNG phải tắt web.
#
# Cách khác là `certbot --standalone`, nhưng nó cần chiếm cổng 80 — tức phải
# dừng container frontend mỗi lần gia hạn (90 ngày một lần, tự động lúc 3 giờ
# sáng). Một lần gia hạn hỏng vào lúc không ai nhìn là chứng chỉ hết hạn và cả
# trang web báo "không an toàn".
#
# `^~` khiến nginx CHỐT ở tiền tố này và không xét tiếp các regex location phía
# sau — quan trọng vì khối SPA bên dưới có regex bắt tệp tĩnh.
location ^~ /.well-known/acme-challenge/ {
    root /var/www/certbot;
    default_type "text/plain";
}

# ---- Socket.IO (WebSocket) ----
# Phải khai báo TRƯỚC location / : Socket.IO gắn vào cùng cổng 5000 của backend
# nhưng dùng đường dẫn riêng /socket.io.
location /socket.io/ {
    proxy_pass http://backend_api/socket.io/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # WebSocket là kết nối MỞ LÂU. Mặc định proxy_read_timeout của Nginx là 60s,
    # nghĩa là cứ mỗi phút im lặng là kết nối bị cắt; client nối lại liên tục và
    # người dùng thấy thông báo nhấp nháy. 1 giờ đủ dài, và Socket.IO vẫn tự ping
    # mỗi 20s nên kết nối chết thật vẫn được dọn.
    proxy_read_timeout 3600s;
    proxy_send_timeout 3600s;

    # Đệm phải TẮT: dữ liệu realtime mà bị gom lại thì hết realtime.
    proxy_buffering off;
}

# ---- Server-Sent Events (thông báo tức thời) ----
# ★ ĐÂY LÀ LỖI ĐÃ CHẶN SSE Ở PRODUCTION
# Block /v1/ bên dưới KHÔNG tắt proxy_buffering. Nginx mặc định GOM toàn bộ phản
# hồi rồi mới gửi cho client — nhưng SSE là luồng không bao giờ kết thúc, nên
# Nginx cứ gom mãi và trình duyệt không nhận được sự kiện nào.
#
# Điểm nguy hiểm: ở môi trường dev (Vite gọi thẳng backend, không qua Nginx) SSE
# chạy hoàn hảo. Lỗi chỉ xuất hiện sau khi lên production — đúng lúc khó gỡ nhất.
location /v1/events/ {
    proxy_pass http://backend_api/v1/events/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # HTTP/1.1 + Connection rỗng: bắt buộc để giữ kết nối streaming.
    proxy_http_version 1.1;
    proxy_set_header Connection "";

    # Tắt mọi lớp đệm/nén — ba dòng này mới là thứ làm SSE hoạt động.
    proxy_buffering off;
    proxy_cache off;
    chunked_transfer_encoding on;
    gzip off;

    proxy_read_timeout 3600s;
    proxy_send_timeout 3600s;
}

# ---- Backend API ----
location /v1/ {
    proxy_pass http://backend_api/v1/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # 300s: đủ cho các thao tác chậm như nhập khóa học từ ZIP hay gọi AI.
    proxy_read_timeout 300s;
    proxy_send_timeout 300s;

    # ⚠️ PHẢI ≥ IMPORT_MAX_ZIP_MB trong docker-compose.cpu-ec2.yml (đang là 200MB).
    # Nếu để nhỏ hơn, giảng viên tải ZIP lên sẽ nhận 413 từ Nginx — một lỗi
    # KHÔNG hề xuất hiện trong log backend, nên rất khó lần ra.
    client_max_body_size 250m;
}

# ---- Webhook thanh toán (VNPay, Stripe, PayPal, MoMo, NOWPayments) ----
location /webhooks/ {
    proxy_pass http://backend_api/webhooks/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # Stripe ký webhook trên THÂN REQUEST THÔ. Mọi biến đổi thân request đều làm
    # hỏng chữ ký, nên tuyệt đối không thêm bộ lọc/nén nào ở đây.
    proxy_request_buffering on;
}

# ---- Frontend SPA ----
# Đặt CUỐI CÙNG: `location /` khớp mọi thứ, nên phải để sau các tiền tố cụ thể.
location / {
    root /usr/share/nginx/html;
    index index.html;
    try_files $uri $uri/ /index.html;

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?|ttf|eot)$ {
        # Vite gắn mã băm vào tên tệp (app-a3f9c1.js), nên `immutable` an toàn:
        # nội dung đổi thì tên tệp cũng đổi, trình duyệt tự tải bản mới.
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # index.html thì KHÔNG được cache — nó là tệp chứa đường dẫn tới các bundle
    # có mã băm. Cache nó nghĩa là người dùng cũ mãi mãi trỏ tới bundle cũ đã bị
    # xóa, và nhận trang trắng sau mỗi lần deploy.
    location = /index.html {
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate";
    }
}
