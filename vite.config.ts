// vite.config.ts — Vanessa Tourisme
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

/**
 * Sépare les grosses librairies en fichiers distincts (meilleur cache navigateur).
 * Forme "fonction" : acceptée par toutes les versions de Vite.
 */
function manualChunks(id: string): string | undefined {
  if (!id.includes('node_modules')) return undefined

  if (/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(id)) return 'react'
  if (/node_modules\/appwrite\//.test(id)) return 'appwrite'
  if (/node_modules\/maplibre-gl\//.test(id)) return 'maplibre'
  if (/node_modules\/(jspdf|qrcode)\//.test(id)) return 'pdf'

  return undefined
}

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
        manualChunks,
      },
    },
  },
})