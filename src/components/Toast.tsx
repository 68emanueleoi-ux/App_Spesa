import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { ToastContext, type Toast, type ToastApi } from './useToast'

const DURATA_DEFAULT = 5000

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

  useEffect(() => () => window.clearTimeout(timer.current), [])

  return (
    <ToastContext.Provider value={{ mostra }}>
      {children}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-x-4 bottom-[calc(80px+env(safe-area-inset-bottom))] z-30 mx-auto flex max-w-[420px] items-center gap-3 rounded-lg bg-inchiostro px-4 py-3 text-sm text-carta shadow-[0_8px_24px_rgba(0,0,0,0.25)] animate-[toast-entra_200ms_ease-out] md:bottom-6"
        >
          <span className="flex-1">{toast.testo}</span>
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
        </div>
      )}
    </ToastContext.Provider>
  )
}
