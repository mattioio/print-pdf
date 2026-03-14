import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'pdf-renderer': ['@react-pdf/renderer'],
          'pdf-viewer': ['react-pdf', 'pdfjs-dist'],
        },
      },
    },
  },
})
