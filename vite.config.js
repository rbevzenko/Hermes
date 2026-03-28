import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      selfDestroying: true,
      manifest: {
        name: 'Λεξιλόγιο — Греческий словарь',
        short_name: 'Λεξιλόγιο',
        description: 'Тренажёр греческой лексики: карточки, тест, диктант',
        theme_color: '#1B2A6B',
        background_color: '#FAF6EE',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/Hermes/',
        start_url: '/Hermes/',
        icons: [
          {
            src: '/Hermes/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/Hermes/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  base: '/Hermes/',
  build: {
    rollupOptions: {
      output: {
        entryFileNames: `assets/app.[hash].js`,
        chunkFileNames: `assets/chunk.[hash].js`,
        assetFileNames: `assets/style.[hash][extname]`,
      },
    },
  },
})
