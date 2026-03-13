import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/neon-auth': {
        target: 'https://ep-rapid-art-a4k5htfk.neonauth.us-east-1.aws.neon.tech/neondb/auth',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/neon-auth/, ''),
      },
    },
  },
})
