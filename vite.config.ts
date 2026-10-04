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
      /*
        'autoUpdate': il service worker nuovo si attiva da solo e prende in
        carico le schede aperte.

        Con 'prompt' restava in attesa finché non era la pagina a dirgli di
        attivarsi, e una pagina che esegue codice vecchio quel messaggio non lo
        manda mai: chi aveva l'app installata restava bloccato sulla versione
        vecchia finché non la chiudeva del tutto. Qui si attiva da sé, e a
        decidere quando ricaricare resta comunque l'utente: l'avviso lo chiede,
        vedi lib/aggiornamento.ts.
      */
      registerType: 'autoUpdate',
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
        // la carta neutra dei mesi: all'apertura la barra prende poi il colore del mese (lib/coloreMese.ts)
        background_color: '#F8F4EE',
        theme_color: '#F8F4EE',
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
