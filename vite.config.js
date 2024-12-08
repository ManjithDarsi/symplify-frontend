import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'big-calendar': ['react-big-calendar'],
        }
      }
    },
    chunkSizeWarningLimit: 1000, // Increase the warning limit if needed
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: '0.0.0.0', // Bind to all network interfaces
    port: 8080        // Listen on port 8080
  }
})

