import { Navigate, Route, Routes } from 'react-router'
import { AppShell } from './components/AppShell'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ToastProvider } from './components/Toast'
import { MovimentiProvider } from './features/movimenti/MovimentiProvider'
import { CategoriePage } from './features/categorie/CategoriePage'
import { ReportPage } from './features/dashboard/ReportPage'
import { ImportazionePage } from './features/importazione/ImportazionePage'
import { MovimentiPage } from './features/movimenti/MovimentiPage'

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <MovimentiProvider>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<ReportPage />} />
              <Route path="movimenti" element={<MovimentiPage />} />
              <Route path="categorie" element={<CategoriePage />} />
              <Route path="importazione" element={<ImportazionePage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </MovimentiProvider>
      </ToastProvider>
    </ErrorBoundary>
  )
}
