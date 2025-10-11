import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks for better caching
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'firebase': ['firebase/app', 'firebase/auth'],
          'ui-libs': ['framer-motion', 'react-hot-toast', 'react-icons', 'react-confetti'],
          'utils': ['axios', 'react-device-detect'],
        }
      }
    },
    chunkSizeWarningLimit: 600,
  },
})
