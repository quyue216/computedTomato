import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  base: "/",
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
   server: {
    proxy: {
      // 配置以/api开头的请求代理
      '/dev-api': {
        target: 'http://127.0.0.1:3001', // 后端服务地址
        changeOrigin: true, // 允许跨域
        rewrite: (path) => path.replace(/^\/dev-api/, '') // 移除请求路径中的/api前缀
      },
      // 可以添加更多代理规则
      '/auth': {
        target: 'http://localhost:4000',
        changeOrigin: true
      }
    }
  }
  
})
