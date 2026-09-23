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
 * Un blocco di contenuto su foglio.
 *
 * Prima il report era una pila di bande separate da filetti, tutte allo stesso
 * livello: la pagina sembrava un pannello di impostazioni. Qui i blocchi di
 * supporto stanno su una superficie staccata dalla carta e si separano con lo
 * spazio, non con una riga.
 *
 * Il totale del mese resta volutamente fuori da questi pannelli, sulla carta
 * nuda: è l'unica cosa in pagina che deve pesare di più.
 */
export function Pannello({ titolo, azione, children, className }: Props) {
  return (
    <section className={cn('scheda p-5 md:p-6', className)}>
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="font-display text-base font-extrabold tracking-tight">{titolo}</h2>
        {azione}
      </div>
      {children}
    </section>
  )
}
