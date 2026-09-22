import { createContext, useContext } from 'react'

export interface Toast {
  id: number
  testo: string
  azione?: { etichetta: string; esegui: () => void }
}

export interface ToastApi {
  mostra: (testo: string, azione?: Toast['azione'], durataMs?: number) => void
}

export const ToastContext = createContext<ToastApi | null>(null)

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast va usato dentro ToastProvider')
  return ctx
}
