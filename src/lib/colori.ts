import type { ColoreCategoria } from '@/db/tipi'

/** Chiave colore → variabile CSS (valore diverso in tema chiaro e scuro, vedi index.css) */
export function coloreCss(colore: ColoreCategoria): string {
  switch (colore) {
    case 'verde':
      return 'var(--verde)'
    case 'neutro':
      return 'var(--inchiostro-2)'
    default:
      return `var(--cat-${colore.slice(1)})`
  }
}

export const COLORI_TAVOLOZZA: ColoreCategoria[] = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8']
