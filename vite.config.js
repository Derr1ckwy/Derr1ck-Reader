import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Derr1ck 阅读器',
        short_name: 'Derr1ck阅读器',
        description: '纯本地 Web 电子书阅读器，支持 TXT / EPUB',
        lang: 'zh-CN',
        theme_color: '#4a6fa5',
        background_color: '#f5f2ec',
        display: 'standalone',
        start_url: './',
        scope: './',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        // 系统文件关联：右键 txt → 打开方式 → Derr1ck 阅读器（Chrome/Edge 的 File Handling API）
        file_handlers: [
          {
            action: './',
            accept: { 'text/plain': ['.txt'] },
          },
        ],
      },
      workbox: {
        navigateFallback: 'index.html',
      },
      devOptions: {
        enabled: true, // 开发环境也可测试 PWA
      },
    }),
  ],
})
