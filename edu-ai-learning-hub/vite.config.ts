import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import fs from 'fs';
// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: '::',
    // https: {
    //   key: fs.readFileSync('./localhost.key'),
    //   cert: fs.readFileSync('./localhost.crt'),
    // },
    port: 8080,
    watch: {
      // Watch all files in the project
      ignored: ['!**/node_modules/@react-pdf/renderer/**'],
      // Hoặc thử một pattern khác nếu cần
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
