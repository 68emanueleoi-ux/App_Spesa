import { Navigate, Route, Routes } from 'react-router'
import { AppShell } from './components/AppShell'
import { ToastProvider } from './components/Toast'
import { MovimentiProvider } from './features/movimenti/MovimentiProvider'
import { CategoriePage } from './features/categorie/CategoriePage'
import { ReportPage } from './features/dashboard/ReportPage'
import { MovimentiPage } from './features/movimenti/MovimentiPage'

export default function App() {
  return (
    <ToastProvider>
      <MovimentiProvider>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<ReportPage />} />
            <Route path="movimenti" element={<MovimentiPage />} />
            <Route path="categorie" element={<CategoriePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </MovimentiProvider>
    </ToastProvider>
  )
}
