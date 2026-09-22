import { createContext, useContext } from 'react'

export interface Toast {
  id: number
  testo: string
  azione?: { etichetta: string; esegui: () => void }
  /** 'errore': avviso rosso, resta più a lungo */
  tono?: 'normale' | 'errore'
}

export interface ToastApi {
  mostra: (testo: string, azione?: Toast['azione'], durataMs?: number) => void
  /** Un'operazione non è riuscita: avviso rosso, 8 secondi. */
  errore: (testo: string) => void
}

export const ToastContext = createContext<ToastApi | null>(null)

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast va usato dentro ToastProvider')
  return ctx
}
