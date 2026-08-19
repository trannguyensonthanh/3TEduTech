# ===================================================
# Nginx Reverse Proxy — Production
# ===================================================
# File này được mount vào container frontend:
#   volumes:
#     - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro
#
# QUAN TRỌNG: Thay 'your-domain.com' và 'GPU_EC2_2_PRIVATE_IP'
# bằng giá trị thật trước khi deploy.
# ===================================================

# ---------------------------------------------------------------
# [THÊM 17/08/2026 — LEVEL 2] Ánh xạ cho WebSocket (Socket.IO)
#
# Nginx mặc định KHÔNG chuyển tiếp header Upgrade — nó là "hop-by-hop header",
# theo chuẩn HTTP thì proxy phải tự xử lý chứ không truyền tiếp. Thiếu block
# map này, mọi kết nối WebSocket bị nâng cấp hụt và Socket.IO tụt vĩnh viễn
# xuống long-polling: vẫn "chạy" nên rất khó phát hiện, chỉ là tốn gấp nhiều
# lần tài nguyên và trễ hơn hẳn.
#
# Biến $connection_upgrade trả về "upgrade" khi client thật sự xin nâng cấp,
# và "close" cho request thường.
# ---------------------------------------------------------------
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

upstream backend_api {
    server edutech-backend:5000;
}

# AI Service trên GPU EC2 #2 — Thay bằng Private IP thật
upstream ai_service {
    # TODO: Thay bằng Private IP thật của GPU EC2 #2
    server GPU_EC2_2_PRIVATE_IP:2111;
}

server {
    listen 80;
    server_name your-domain.com;

    # === Khi có SSL, uncomment dòng dưới để redirect HTTP → HTTPS ===
    # return 301 https://$host$request_uri;

    # ---- Frontend SPA ----
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;

        # Cache static assets (JS, CSS, images, fonts)
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?|ttf|eot)$ {
            expires 30d;
            add_header Cache-Control "public, immutable";
        }
    }

    # ---- Socket.IO (WebSocket) ----
    # [THÊM 17/08/2026 — LEVEL 2, mục 2.3]
    # Phải khai báo TRƯỚC location /v1/ và /: Socket.IO gắn vào cùng cổng 5000
    # của backend nhưng dùng đường dẫn riêng /socket.io.
    location /socket.io/ {
        proxy_pass http://backend_api/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket là kết nối MỞ LÂU. Mặc định proxy_read_timeout của Nginx là
        # 60s, nghĩa là cứ mỗi phút im lặng là kết nối bị cắt; client nối lại
        # liên tục và người dùng thấy thông báo nhấp nháy. 1 giờ đủ dài, và
        # Socket.IO vẫn tự ping mỗi 20s nên kết nối chết thật vẫn được dọn.
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;

        # Đệm phải TẮT: dữ liệu realtime mà bị gom lại thì hết realtime.
        proxy_buffering off;
    }

    # ---- Server-Sent Events (thông báo tức thời) ----
    # [THÊM 17/08/2026 — LEVEL 2] ★ ĐÂY LÀ LỖI ĐÃ CHẶN SSE Ở PRODUCTION
    # Block /v1/ bên dưới KHÔNG hề tắt proxy_buffering. Nginx mặc định GOM toàn
    # bộ phản hồi rồi mới gửi cho client — nhưng SSE là luồng không bao giờ kết
    # thúc, nên Nginx cứ gom mãi và trình duyệt không nhận được một sự kiện nào.
    #
    # Điểm nguy hiểm: ở môi trường dev (Vite gọi thẳng backend, không qua Nginx)
    # SSE chạy hoàn hảo. Lỗi chỉ xuất hiện sau khi lên production — đúng lúc khó
    # gỡ nhất. Vì vậy tách riêng một location cho /v1/events/.
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

        # Kết nối SSE mở vô hạn; heartbeat của backend là 20s.
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }

    # ---- Backend API Proxy ----
    location /v1/ {
        proxy_pass http://backend_api/v1/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
        client_max_body_size 100m;
    }

    # ---- Backend Webhooks (VNPay, Stripe, PayPal...) ----
    location /webhooks/ {
        proxy_pass http://backend_api/webhooks/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # ========================================================================
    # ---- AI Service API Proxy — ĐÃ ĐÓNG (LEVEL 3, 17/08/2026) ----
    #
    # ★ ĐÂY LÀ LỖ HỔNG NGHIÊM TRỌNG NHẤT CỦA HỆ THỐNG, NAY ĐÃ BỊT.
    #
    # Block này cho phép BẤT KỲ AI trên Internet gọi thẳng AI Service:
    #     curl -X POST https://your-domain.com/ai-api/chat/agent-action \
    #          -d '{"query":"..."}'
    # AI Service không hề kiểm tra xác thực (đọc src/main.py trước Level 3:
    # không có dependency nào đọc header api-key), nên chỉ cần một script vòng
    # lặp là hạn mức token Gemini bốc hơi trong vài giờ — và hóa đơn thì vẫn về
    # tài khoản của mình.
    #
    # Hai khóa hardcode trong ai.service.ts (MASTER_API_KEY / COURSE_AI_API_KEY)
    # KHÔNG bảo vệ được gì: chúng nằm ngay trong file JS gửi xuống trình duyệt,
    # ai mở DevTools cũng đọc được — mà thực ra chẳng cần đọc, vì server không
    # kiểm tra.
    #
    # TỪ LEVEL 3: frontend gọi /v1/ai/* (backend, có JWT + giới hạn tần suất),
    # backend mới gọi sang AI Service kèm khóa nội bộ. Không còn đường nào từ
    # trình duyệt đi thẳng tới AI Service.
    #
    # 👉 GIỮ NGUYÊN TRẠNG THÁI COMMENT NÀY. Nếu cần mở lại vì lý do gì đó, phải
    #    kèm theo `proxy_set_header X-Internal-Api-Key` và một cơ chế xác thực
    #    người dùng ở tầng này — nếu không là mở lại đúng lỗ hổng cũ.
    # ========================================================================
    # location /ai-api/ {
    #     proxy_pass http://ai_service/api/;
    # proxy_set_header Host $host;
    # proxy_set_header X-Real-IP $remote_addr;
    # proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    # proxy_http_version 1.1;
    # proxy_set_header Connection "";

    # proxy_read_timeout 300s;

        # SSE Streaming support (cho AI chat streaming)
    # proxy_buffering off;
    # proxy_cache off;
    # chunked_transfer_encoding on;
    # }

    # ---- Security Headers ----
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # ---- Gzip Compression ----
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;
    gzip_min_length 1000;
}

# ===================================================
# HTTPS Server — Uncomment khi có SSL certificate
# ===================================================
# server {
#     listen 443 ssl http2;
#     server_name your-domain.com;
#
#     ssl_certificate /etc/nginx/ssl/fullchain.pem;
#     ssl_certificate_key /etc/nginx/ssl/privkey.pem;
#     ssl_protocols TLSv1.2 TLSv1.3;
#     ssl_ciphers HIGH:!aNULL:!MD5;
#     ssl_prefer_server_ciphers on;
#
#     # --- Copy toàn bộ location blocks từ server HTTP ở trên ---
#
#     location / {
#         root /usr/share/nginx/html;
#         index index.html;
#         try_files $uri $uri/ /index.html;
#         location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?|ttf|eot)$ {
#             expires 30d;
#             add_header Cache-Control "public, immutable";
#         }
#     }
#
#     location /v1/ {
#         proxy_pass http://backend_api/v1/;
#         proxy_set_header Host $host;
#         proxy_set_header X-Real-IP $remote_addr;
#         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
#         proxy_set_header X-Forwarded-Proto $scheme;
#         proxy_read_timeout 300s;
#         proxy_send_timeout 300s;
#         client_max_body_size 100m;
#     }
#
#     location /webhooks/ {
#         proxy_pass http://backend_api/webhooks/;
#         proxy_set_header Host $host;
#         proxy_set_header X-Real-IP $remote_addr;
#         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
#         proxy_set_header X-Forwarded-Proto $scheme;
#     }
#
#     location /ai-api/ {
#         proxy_pass http://ai_service/api/;
#         proxy_set_header Host $host;
#         proxy_set_header X-Real-IP $remote_addr;
#         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
#         proxy_http_version 1.1;
#         proxy_set_header Connection "";
#         proxy_read_timeout 300s;
#         proxy_buffering off;
#         proxy_cache off;
#         chunked_transfer_encoding on;
#     }
#
#     add_header X-Frame-Options "SAMEORIGIN" always;
#     add_header X-Content-Type-Options "nosniff" always;
#     add_header X-XSS-Protection "1; mode=block" always;
#     add_header Referrer-Policy "strict-origin-when-cross-origin" always;
#     add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
#
#     gzip on;
#     gzip_vary on;
#     gzip_proxied any;
#     gzip_comp_level 6;
#     gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;
#     gzip_min_length 1000;
# }
