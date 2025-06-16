import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    // Only set up proxy when NOT using Netlify Dev
    // Netlify Dev handles API routing internally
    ...(process.env.NETLIFY !== 'true' && {
      proxy: {
        '/api': {
          target: 'http://localhost:8888', // Default Netlify Dev port
          changeOrigin: true,
        }
      }
    })
  },
  define: {
    // Polyfill for process.env in the browser (for legacy code)
    'process.env': {
      NODE_ENV: JSON.stringify(process.env.NODE_ENV),
      // Add any other process.env variables your app might need
    }
  }
})
