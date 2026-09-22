import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useToast } from '@/components/useToast'
import { MovimentiContext } from './useMovimenti'
import { eliminaMovimento, ripristinaMovimento } from '@/db/movimenti'
import type { Movimento, TipoMovimento } from '@/db/tipi'
import { FormMovimento } from './FormMovimento'

interface StatoForm {
  aperto: boolean
  /** movimento da modificare; assente = nuovo */
  movimento?: Movimento
  tipoIniziale?: TipoMovimento
}

/**
 * Stato globale del form movimento (raggiungibile da +, da "Nuovo movimento", dal tasto N
 * e da ogni riga della lista) e dell'eliminazione con ripristino.
 */
export function MovimentiProvider({ children }: { children: ReactNode }) {
  const [form, setForm] = useState<StatoForm>({ aperto: false })
  const { mostra } = useToast()

  const apriNuovo = useCallback((tipo?: TipoMovimento) => setForm({ aperto: true, tipoIniziale: tipo }), [])
  const apriModifica = useCallback((m: Movimento) => setForm({ aperto: true, movimento: m }), [])
  const chiudi = useCallback(() => setForm((f) => ({ ...f, aperto: false })), [])

  const elimina = useCallback(
    async (id: string) => {
      const m = await eliminaMovimento(id)
      if (!m) return
      mostra(m.tipo === 'uscita' ? 'Spesa eliminata' : 'Entrata eliminata', {
        etichetta: 'Annulla',
        esegui: () => void ripristinaMovimento(m),
      })
    },
    [mostra],
  )

  // Scorciatoia da tastiera: N apre il form (non mentre si scrive in un campo)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'n' && e.key !== 'N') return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return
      e.preventDefault()
      apriNuovo()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [apriNuovo])

  return (
    <MovimentiContext.Provider value={{ apriNuovo, apriModifica, chiudi, elimina }}>
      {children}
      <FormMovimento
        aperto={form.aperto}
        movimento={form.movimento}
        tipoIniziale={form.tipoIniziale}
        onChiudi={chiudi}
        onElimina={elimina}
      />
    </MovimentiContext.Provider>
  )
}
