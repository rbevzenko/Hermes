import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
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
