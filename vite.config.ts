import react from '@vitejs/plugin-react'
import tailwind from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwind()],
  server: {
    host: true, // Listen on all addresses
    allowedHosts: [
      '.ngrok-free.dev', // Allow all ngrok free domains
      '.ngrok.io',       // Allow all ngrok domains
      '.ngrok.app',      // Allow all ngrok app domains
    ],
  },
})
