/**
 * Le righe appena toccate da un'azione: un movimento salvato o ripristinato con
 * "Annulla". La riga entra con un breve segno nel colore del mese, così si vede
 * dove è finita. All'apertura dell'app nessuna riga è recente: nessuna animazione
 * parte da sola.
 */
const DURATA = 3000
const ripristinate = new Map<string, number>()

/** Segna una riga riapparsa con "Annulla" (il suo creatoIl è quello di allora). */
export function segnaRipristinata(id: string) {
  ripristinate.set(id, Date.now())
}

/** Vero per un movimento creato o ripristinato negli ultimi tre secondi. */
export function eRecente(id: string, creatoIl: string): boolean {
  const ora = Date.now()
  const ripristinata = ripristinate.get(id)
  if (ripristinata !== undefined && ora - ripristinata < DURATA) return true
  const creato = Date.parse(creatoIl)
  return Number.isFinite(creato) && ora - creato >= 0 && ora - creato < DURATA
}
