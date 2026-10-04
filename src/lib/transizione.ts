import { flushSync } from 'react-dom'

const riduciMovimento = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Esegue un cambio di schermata (o di mese) dentro una View Transition: il
 * browser fotografa la pagina prima e dopo e le dissolve l'una nell'altra.
 *
 * Solo in risposta a un'azione dell'utente. Dove l'API non c'è, o con "riduci
 * movimento", il cambio è istantaneo. flushSync fa sì che React abbia già
 * disegnato la pagina nuova quando il browser scatta la seconda fotografia.
 */
export function conTransizione(aggiorna: () => void) {
  if (typeof document === 'undefined' || !('startViewTransition' in document) || riduciMovimento()) {
    aggiorna()
    return
  }
  document.startViewTransition(() => flushSync(aggiorna))
}
