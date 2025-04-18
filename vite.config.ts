import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  },
  define: {
    // Polyfill for process.env in the browser (for legacy code)
    'process.env': {
      NODE_ENV: JSON.stringify(process.env.NODE_ENV),
      // Add any other process.env variables your app might need
    }
  }
})
