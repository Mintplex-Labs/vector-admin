import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0'
  },
  define: {
    'process.env': process.env,
    global: 'window'
  },
  plugins: [react()],
})
