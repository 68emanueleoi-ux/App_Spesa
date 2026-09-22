import { createContext, useContext } from 'react'
import type { Movimento, TipoMovimento } from '@/db/tipi'

export interface MovimentiApi {
  apriNuovo: (tipo?: TipoMovimento) => void
  apriModifica: (m: Movimento) => void
  chiudi: () => void
  /** elimina subito e offre "Annulla" per 5 secondi */
  elimina: (id: string) => Promise<void>
}

export const MovimentiContext = createContext<MovimentiApi | null>(null)

export function useMovimenti(): MovimentiApi {
  const ctx = useContext(MovimentiContext)
  if (!ctx) throw new Error('useMovimenti va usato dentro MovimentiProvider')
  return ctx
}
