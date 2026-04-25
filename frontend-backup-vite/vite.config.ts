/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
    },
    server: {
      port: 3000,
      open: true
    },
    // Base path for production deployment
    base: mode === 'production' ? '/' : '/',
    // Environment variable configuration are handled by Vite automatically using import.meta.env
    // for variables prefixed with VITE_
    // Build optimization
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            ui: ['lucide-react', 'framer-motion', 'clsx', 'tailwind-merge'],
            charts: ['recharts'],
            utils: ['axios', '@tanstack/react-query']
          }
        }
      }
    },
    // Preview server for production build
    preview: {
      port: 3000,
      host: true
    }
  }
})
