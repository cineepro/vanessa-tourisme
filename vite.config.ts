import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // Sépare les grosses librairies pour un meilleur cache navigateur
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          appwrite: ['appwrite'],
          maplibre: ['maplibre-gl'],
          pdf: ['jspdf', 'qrcode'],
        },
      },
    },
  },
})