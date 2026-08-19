# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm ci

# Build-time env vars (injected vào Vite bundle lúc build)
# Truyền qua --build-arg khi docker build
ARG VITE_API_URL
ARG VITE_AI_API_URL
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_AI_API_URL=${VITE_AI_API_URL}

# Copy source files
COPY . .

# Build the Vite application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from build stage to nginx serving directory
COPY --from=build /app/dist /usr/share/nginx/html

# Nginx config sẽ được mount từ bên ngoài qua volume trong docker-compose
# Fallback config cho trường hợp chạy standalone (không mount)
RUN printf 'server {\n\
    listen 80;\n\
    server_name localhost;\n\
    location / {\n\
        root /usr/share/nginx/html;\n\
        index index.html index.htm;\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80
EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]
