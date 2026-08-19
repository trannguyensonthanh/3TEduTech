# Chuyển từ node:20-alpine (musl libc, KHÔNG có sẵn curl) sang node:20-bookworm-slim
# (Debian glibc — cùng họ với Ubuntu 22.04/24.04 đang chạy trên CPU EC2) để:
#   1) Tránh lỗi "curl: not found" khi Docker healthcheck gọi
#      `curl -f http://localhost:5000/v1/` (xem docker-compose.cpu-ec2.yml /
#      docker-compose.dev.yml) — Alpine không cài sẵn curl.
#   2) Đồng bộ hệ sinh thái glibc với host OS (Ubuntu) đang dùng cho EC2,
#      giảm rủi ro khác biệt hành vi thư viện native giữa dev/prod.
FROM node:20-bookworm-slim

# Cài curl tường minh (không phụ thuộc vào việc base image có sẵn hay không)
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first để tận dụng Docker layer cache
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy the rest of the application code
COPY . .

# Set environment variable
ENV NODE_ENV=production

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
