import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface Props {
  titolo: string
  /** collegamento a destra del titolo (es. "Tutti i movimenti") */
  azione?: ReactNode
  children: ReactNode
  className?: string
}

/**
 * Una sezione del registro.
 *
 * Niente scheda intorno: i blocchi stanno sulla carta del mese e si separano con
 * lo spazio e col titolo, come le voci di un libro dei conti. Il titolo è in
 * Bitter, col peso della stagione; l'azione a destra prende l'accento del mese.
 */
export function Pannello({ titolo, azione, children, className }: Props) {
  return (
    <section className={cn('pt-7', className)}>
      <div className="mb-2.5 flex min-h-11 items-center justify-between gap-3">
        <h2 className="font-display text-xl leading-tight" style={{ fontWeight: 'var(--peso-titoli)' }}>
          {titolo}
        </h2>
        {azione}
      </div>
      {children}
    </section>
  )
}

/** Il collegamento nell'angolo di un pannello: accento del mese, area di tocco piena. */
export const classeAzionePannello =
  'inline-flex min-h-11 items-center gap-1 text-sm font-bold text-accento underline-offset-4 active:underline'
