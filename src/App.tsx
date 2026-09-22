import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { AppShell } from './components/AppShell'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ToastProvider } from './components/Toast'
import { useToast } from './components/useToast'
import { useAggiornamentoApp } from './lib/aggiornamento'
import { MovimentiProvider } from './features/movimenti/MovimentiProvider'
import { CategoriePage } from './features/categorie/CategoriePage'
import { ReportPage } from './features/dashboard/ReportPage'
import { MovimentiPage } from './features/movimenti/MovimentiPage'

// L'importazione si apre due volte al mese e si porta dietro papaparse:
// non deve pesare sull'avvio del report, che e la schermata di ogni giorno.
const ImportazionePage = lazy(() =>
  import('./features/importazione/ImportazionePage').then((m) => ({ default: m.ImportazionePage })),
)

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AvvisoAggiornamento />
        <MovimentiProvider>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<ReportPage />} />
              <Route path="movimenti" element={<MovimentiPage />} />
              <Route path="categorie" element={<CategoriePage />} />
              <Route
                path="importazione"
                element={
                  <Suspense fallback={<p className="py-16 text-center text-sm text-inchiostro-2">Un attimo…</p>}>
                    <ImportazionePage />
                  </Suspense>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </MovimentiProvider>
      </ToastProvider>
    </ErrorBoundary>
  )
}

/**
 * Quando c'è una versione nuova lo dice, con il tasto per applicarla.
 * L'avviso resta finché non lo si tocca: 5 secondi sarebbero pochi per una
 * cosa che si può fare una volta sola.
 */
function AvvisoAggiornamento() {
  const applica = useAggiornamentoApp()
  const { mostra } = useToast()

  useEffect(() => {
    if (!applica) return
    mostra("C'è una versione nuova dell'app", { etichetta: 'Aggiorna', esegui: applica }, 60_000)
  }, [applica, mostra])

  return null
}
