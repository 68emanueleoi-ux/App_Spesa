import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import '@fontsource-variable/bricolage-grotesque/opsz.css'
import '@fontsource/atkinson-hyperlegible-next/latin-400.css'
import '@fontsource/atkinson-hyperlegible-next/latin-500.css'
import '@fontsource/atkinson-hyperlegible-next/latin-700.css'
import './index.css'
import App from './App.tsx'
import { inizializzaDb } from './db/db.ts'

// Il seed gira in parallelo al primo render: le pagine leggono il DB con useLiveQuery e si aggiornano da sole.
inizializzaDb().catch((errore: unknown) => {
  console.error('Impossibile aprire il database locale', errore)
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
