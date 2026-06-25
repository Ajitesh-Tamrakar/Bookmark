import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 8081,
    proxy: {
      '/setup': 'http://localhost:8080',
      '/capture': 'http://localhost:8080',
      '/retrieve': 'http://localhost:8080',
      '/admin': 'http://localhost:8080',
    },
  },
})
