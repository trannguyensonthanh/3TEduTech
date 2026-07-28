import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import fs from 'fs';
// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: '0.0.0.0', // Lắng nghe ổn định trên mọi IPv4 & IPv6 (localhost, 127.0.0.1) cho Windows/Opera
    port: 5173,
    strictPort: true,
    allowedHosts: [
      'guided-wallaby-measured.ngrok-free.app',
      '.ngrok-free.app',
      '.ngrok.io',
      '.ngrok.app',
      '.trycloudflare.com',
      'localhost',
    ],
    watch: {
      usePolling: false, // Tắt polling: Tránh lỗi rò rỉ RAM, xung đột EBUSY/EPERM khi chỉnh sửa code nhanh trên Windows
      ignored: ['**/node_modules/**', '**/.git/**'], // Bỏ qua theo dõi node_modules để giải phóng tài nguyên CPU/RAM
    },
  },

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
