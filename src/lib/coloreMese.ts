import { useLayoutEffect } from 'react'
import type { MeseKey } from './date'

/**
 * Il colore del mese: scrive su <html> il mese che si sta guardando (data-mese="1"…"12"),
 * e tema-mesi.css ne ricava testata, carta, inchiostro e accento.
 *
 * Aggiorna anche i due <meta name="theme-color">, così la barra del browser prende il
 * colore della testata. Tutti e due, perché il tema può essere scelto a mano contro
 * quello del sistema: con un solo valore giusto la barra sarebbe sbagliata metà delle volte.
 */
export function useColoreDelMese(mese: MeseKey, scuro: boolean) {
  // prima del disegno: dentro una View Transition la seconda fotografia ha già i colori nuovi
  useLayoutEffect(() => {
    const radice = document.documentElement
    radice.dataset.mese = String(Number(mese.slice(5)))
    // il colore si legge dopo che data-mese e .dark sono applicati, dal CSS e non da una tabella doppia
    const blocco = getComputedStyle(radice).getPropertyValue('--blocco').trim()
    if (!blocco) return
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', blocco))
  }, [mese, scuro])
}
