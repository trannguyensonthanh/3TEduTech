import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import fs from 'fs';
// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: '0.0.0.0', // Lắng nghe ổn định trên mọi IPv4 & IPv6 (localhost, 127.0.0.1) cho Windows/Opera
    port: 5173,
    strictPort: true, // Giữ vững chính xác port 5173 để đảm bảo CORS và các redirect thanh toán không bị lỗi
    allowedHosts: [
      'guided-wallaby-measured.ngrok-free.app',
      '.ngrok-free.app',
      '.ngrok.io',
      '.ngrok.app',
      '.trycloudflare.com',
      'localhost',
    ],
    watch: {
      usePolling: true, // Bật polling: Bắt buộc để nhận diện file thay đổi khi chạy qua Docker/WSL trên Windows
      ignored: ['**/node_modules/**', '**/.git/**'], // Bỏ qua theo dõi node_modules để giải phóng tài nguyên CPU/RAM
    },
    hmr: {
      clientPort: 5173,
      host: 'localhost',
    },
  },

  /* [THÊM] Gỡ console.* và debugger khỏi bản dựng production.
     Dự án có 200+ lời gọi console.log trong src/, trong đó có những chỗ in cả
     payload request. Giữ nguyên ở chế độ dev để còn gỡ lỗi. */
  esbuild: mode === 'production' ? { drop: ['console', 'debugger'] } : undefined,

  plugins: [
    react(),
    // componentTagger() has been removed
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
}));
