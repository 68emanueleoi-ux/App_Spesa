import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * La testata di ogni pagina: una campitura piena nel colore del mese, da bordo a
 * bordo su smartphone (sale fin sotto la barra di stato), un riquadro su desktop.
 * Il testo e i comandi dentro prendono --blocco-testo, verificato a 4,5:1.
 */
export function TestataPagina({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <header
      className={cn(
        '-mx-5 -mt-[max(8px,env(safe-area-inset-top))] bg-blocco px-5 pt-[max(8px,env(safe-area-inset-top))] pb-4 text-blocco-testo md:mx-0 md:mt-0 md:rounded-scheda md:px-6 md:pt-5',
        className,
      )}
    >
      {children}
    </header>
  )
}

/** Il bordo dei comandi che stanno sulla testata: il testo della testata al 40%. */
export const bordoSuTestata = 'border border-[color-mix(in_srgb,currentColor_40%,transparent)]'
