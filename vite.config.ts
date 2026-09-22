import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

// Su GitHub Pages l'app vive in una sottocartella (https://<utente>.github.io/App_Spesa/):
// il workflow imposta VITE_BASE=/App_Spesa/. In locale resta "/".
const base = process.env.VITE_BASE ?? '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // 'prompt' invece di 'autoUpdate': la nuova versione non si installa alle
      // spalle dell'utente mentre sta scrivendo un movimento, ma si annuncia con
      // un avviso e si applica quando lui dice di sì. Vedi lib/aggiornamento.ts.
      registerType: 'prompt',
      injectRegister: null,
      includeAssets: ['apple-touch-icon.png', 'favicon.svg'],
      manifest: {
        name: 'Spese',
        short_name: 'Spese',
        description: 'Entrate e uscite del mese, a colpo d\'occhio.',
        lang: 'it',
        display: 'standalone',
        start_url: base,
        scope: base,
        background_color: '#F3F4F0',
        theme_color: '#F3F4F0',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
})
