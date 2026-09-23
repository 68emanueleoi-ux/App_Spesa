import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import '@fontsource-variable/manrope'
import './index.css'
import App from './App.tsx'
import { inizializzaDb } from './db/db.ts'

// Il seed gira in parallelo al primo render: le pagine leggono il DB con useLiveQuery e si aggiornano da sole.
inizializzaDb().catch((errore: unknown) => {
  console.error('Impossibile aprire il database locale', errore)
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
