import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    // Allow ngrok and other tunnel hosts (use only for local dev; avoid in production)
    allowedHosts: true,
    proxy: {
      '/api': 'http://localhost:3000',
      '/uploads': 'http://localhost:3000',
      '/health': 'http://localhost:3000',
      '/debug': 'http://localhost:3000',
    },
  },
})