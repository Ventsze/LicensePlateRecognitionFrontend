import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // 允许用局域网 IP 访问
    https: {
      key: fs.readFileSync('./localhost+3-key.pem'),  // 私钥文件路径
      cert: fs.readFileSync('./localhost+3.pem') ,
    },
    // host: 'zhangwenze.local',
    proxy: {
      '/api':    { target: 'http://localhost:8080', changeOrigin: true },
      '/files':  { target: 'http://localhost:8080', changeOrigin: true },
      '/thumbs': { target: 'http://localhost:8080', changeOrigin: true },
    },
    // ↓ 如果手机上 HMR 热更新连不上，再加这个（否则不要加）
    // hmr: { protocol: 'wss', host: '192.168.31.76', port: 5173 },
  },
})
