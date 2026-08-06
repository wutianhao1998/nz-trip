import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// Vite 配置文件
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // 开发服务器代理，将 /api 请求转发到后端
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  // 构建优化配置
  build: {
    outDir: 'dist',
    sourcemap: false,
    // 分块策略优化
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          'supabase': ['@supabase/supabase-js'],
          'pdf-utils': ['jspdf', 'html2canvas'],
        },
      },
    },
    // 打包体积警告阈值调整
    chunkSizeWarningLimit: 1000,
  },
})
