import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const backendUrl = process.env.VITE_API_URL || 'http://localhost:8080'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 8081,
    proxy: {
      '/setup': backendUrl,
      '/capture': backendUrl,
      '/retrieve': backendUrl,
      '/admin': backendUrl,
    },
  },
})
