import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { ToastContext, type Toast, type ToastApi } from './useToast'

const DURATA_DEFAULT = 5000
const DURATA_ERRORE = 8000

/** Un solo avviso alla volta, in basso, con eventuale azione ("Annulla"). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null)
  const timer = useRef<number | undefined>(undefined)

  const chiudi = useCallback(() => {
    window.clearTimeout(timer.current)
    setToast(null)
  }, [])

  const mostra = useCallback<ToastApi['mostra']>((testo, azione, durataMs = DURATA_DEFAULT) => {
    window.clearTimeout(timer.current)
    setToast({ id: Date.now(), testo, azione })
    timer.current = window.setTimeout(() => setToast(null), durataMs)
  }, [])

  const errore = useCallback<ToastApi['errore']>((testo) => {
    window.clearTimeout(timer.current)
    setToast({ id: Date.now(), testo, tono: 'errore' })
    timer.current = window.setTimeout(() => setToast(null), DURATA_ERRORE)
  }, [])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const api = useMemo(() => ({ mostra, errore }), [mostra, errore])

  return (
    <ToastContext.Provider value={api}>
      {children}

      {/*
        La regione resta sempre nel DOM, vuota: molti lettori di schermo non
        annunciano una live region che compare gia piena, e l'avviso passava
        inosservato. Cosi cambia solo il contenuto, ed e quello che viene letto.
      */}
      <div role="status" aria-live="polite" className="sr-only">
        {toast?.tono === 'errore' ? '' : (toast?.testo ?? '')}
      </div>
      <div role="alert" aria-live="assertive" className="sr-only">
        {toast?.tono === 'errore' ? toast.testo : ''}
      </div>

      {toast && (
        <div
          className={cn(
            'fixed inset-x-4 bottom-[calc(80px+env(safe-area-inset-bottom))] z-30 mx-auto flex max-w-[420px] items-center gap-3 rounded-lg px-4 py-3 text-sm shadow-[0_8px_24px_rgba(0,0,0,0.25)] animate-[toast-entra_200ms_ease-out] md:bottom-6',
            toast.tono === 'errore' ? 'bg-rosso text-white' : 'bg-inchiostro text-carta',
          )}
        >
          {/* Il testo e gia stato annunciato dalla live region qui sopra: non ripeterlo. */}
          <span className="flex-1" aria-hidden="true">
            {toast.testo}
          </span>
          {toast.azione && (
            <button
              type="button"
              onClick={() => {
                toast.azione?.esegui()
                chiudi()
              }}
              className="rounded-ctrl px-2 py-1 font-bold text-carta underline-offset-2 hover:underline"
            >
              {toast.azione.etichetta}
            </button>
          )}
          {toast.tono === 'errore' && (
            <button
              type="button"
              onClick={chiudi}
              aria-label="Chiudi avviso"
              className="rounded-ctrl px-2 py-1 font-bold text-white underline-offset-2 hover:underline"
            >
              Ok
            </button>
          )}
        </div>
      )}
    </ToastContext.Provider>
  )
}
