/** "Caffè  Centrale" → "caffe centrale": per ricerche e confronti insensibili a maiuscole e accenti */
export function normalizza(testo: string): string {
  return testo.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()
}

export function contiene(testo: string, cercato: string): boolean {
  const c = normalizza(cercato)
  if (c === '') return true
  return normalizza(testo).includes(c)
}

/** Parole generiche che le banche mettono davanti all'esercente: non dicono nulla sulla categoria */
const PAROLE_GENERICHE = new Set([
  'pagamento', 'pos', 'carta', 'tramite', 'addebito', 'diretto', 'sdd', 'prelievo', 'atm', 'bonifico',
  'favore', 'ricarica', 'acquisto', 'operazione', 'presso', 'del', 'della', 'con', 'srl', 'spa', 'sas', 'snc',
])

/**
 * Da una descrizione bancaria ricava un testo corto per una regola:
 * "PAGAMENTO POS CONAD SUPERSTORE ROMA" → "conad superstore".
 */
export function testoPerRegola(descrizione: string): string {
  const parole = normalizza(descrizione)
    .replace(/\S*\d\S*/g, ' ') // via numeri, date, codici
    .split(/[\s,;:*]+/)
    .filter((p) => p.length > 1 && !PAROLE_GENERICHE.has(p))
  return parole.slice(0, 2).join(' ') || normalizza(descrizione)
}
