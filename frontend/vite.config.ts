import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    // Proxy ALL /api/* requests to the backend
    // This means the browser never makes a cross-origin request at all
    // CORS is completely bypassed — requests go frontend→Vite→backend
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        // Log proxy activity for debugging
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.log('[Proxy Error]', err.message)
          })
          proxy.on('proxyReq', (_proxyReq, req) => {
            console.log('[Proxy →]', req.method, req.url)
          })
        },
      },
    },
  },
})
