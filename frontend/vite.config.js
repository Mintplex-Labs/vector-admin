import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

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
  plugins: [react(), wasm(), topLevelAwait()],
})
