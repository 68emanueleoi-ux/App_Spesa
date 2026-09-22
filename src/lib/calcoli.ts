import type { Movimento, RegolaCategoria } from '@/db/tipi'
import { giorniNelMese, giornoDi, type MeseKey } from './date'
import { normalizza } from './testo'

export interface Totali {
  entrate: number
  uscite: number
  saldo: number
}

export function totali(movimenti: Movimento[]): Totali {
  let entrate = 0
  let uscite = 0
  for (const m of movimenti) {
    if (m.tipo === 'entrata') entrate += m.importo
    else uscite += m.importo
  }
  return { entrate, uscite, saldo: entrate - uscite }
}

export interface QuotaCategoria {
  categoriaId: string
  importo: number
  /** intero 0–100; le quote sommano esattamente a 100 (metodo del resto più grande) */
  percentuale: number
}

/** Ripartizione delle uscite per categoria, ordinata per importo decrescente. */
export function ripartizioneUscite(movimenti: Movimento[]): QuotaCategoria[] {
  const somme = new Map<string, number>()
  for (const m of movimenti) {
    if (m.tipo !== 'uscita') continue
    somme.set(m.categoriaId, (somme.get(m.categoriaId) ?? 0) + m.importo)
  }
  const totale = [...somme.values()].reduce((a, b) => a + b, 0)
  if (totale === 0) return []

  const quote = [...somme.entries()]
    .map(([categoriaId, importo]) => {
      const esatta = (importo / totale) * 100
      return { categoriaId, importo, esatta, percentuale: Math.floor(esatta) }
    })
    .sort((a, b) => b.importo - a.importo)

  // distribuisce i punti mancanti a chi ha il resto decimale più grande
  let mancanti = 100 - quote.reduce((s, q) => s + q.percentuale, 0)
  const perResto = [...quote].sort((a, b) => b.esatta - b.percentuale - (a.esatta - a.percentuale))
  for (const q of perResto) {
    if (mancanti <= 0) break
    q.percentuale += 1
    mancanti -= 1
  }
  return quote.map(({ categoriaId, importo, percentuale }) => ({ categoriaId, importo, percentuale }))
}

/**
 * Uscite cumulate giorno per giorno. L'indice 0 è il giorno 1.
 * Se `finoAlGiorno` è indicato, i giorni successivi non sono inclusi (mese in corso).
 */
export function cumulataUscite(movimenti: Movimento[], mese: MeseKey, finoAlGiorno?: number): number[] {
  const n = giorniNelMese(mese)
  const perGiorno = new Array<number>(n).fill(0)
  for (const m of movimenti) {
    if (m.tipo !== 'uscita' || !m.data.startsWith(mese)) continue
    perGiorno[giornoDi(m.data) - 1] += m.importo
  }
  const limite = Math.max(0, Math.min(n, finoAlGiorno ?? n))
  const out: number[] = []
  let acc = 0
  for (let i = 0; i < limite; i++) {
    acc += perGiorno[i]
    out.push(acc)
  }
  return out
}

export interface Confronto {
  /** differenza uscite: corrente − precedente (centesimi) */
  differenza: number
  /** variazione percentuale intera, null se il mese precedente non ha uscite */
  percentuale: number | null
  /** uscite del mese precedente allo stesso giorno del mese, e differenza rispetto a oggi */
  stessoGiorno: { precedente: number; differenza: number } | null
}

/**
 * Confronta le uscite del mese corrente con il mese precedente.
 * Restituisce null se il mese precedente non ha alcun movimento (la UI mostra "—").
 */
export function confrontoConMesePrecedente(
  corrente: Movimento[],
  precedente: Movimento[],
  mesePrecedente: MeseKey,
  giornoCorrente?: number,
): Confronto | null {
  if (precedente.length === 0) return null
  const uscCorr = totali(corrente).uscite
  const uscPrec = totali(precedente).uscite
  const differenza = uscCorr - uscPrec
  const percentuale = uscPrec === 0 ? null : Math.round((differenza / uscPrec) * 100)

  let stessoGiorno: Confronto['stessoGiorno'] = null
  if (giornoCorrente !== undefined) {
    const cum = cumulataUscite(precedente, mesePrecedente, giornoCorrente)
    const precAlGiorno = cum.length ? cum[cum.length - 1] : 0
    stessoGiorno = { precedente: precAlGiorno, differenza: uscCorr - precAlGiorno }
  }
  return { differenza, percentuale, stessoGiorno }
}

/** Prima regola (per priorità crescente) il cui testo è contenuto nella descrizione. */
export function applicaRegole(descrizione: string | undefined, regole: RegolaCategoria[]): string | null {
  if (!descrizione) return null
  const d = normalizza(descrizione)
  const ordinate = [...regole].sort((a, b) => a.priorita - b.priorita)
  for (const r of ordinate) {
    const c = normalizza(r.contiene)
    if (c !== '' && d.includes(c)) return r.categoriaId
  }
  return null
}

/** Chiave per riconoscere un duplicato in importazione: stessa data, tipo, importo e descrizione. */
export function chiaveDuplicato(m: Pick<Movimento, 'data' | 'importo' | 'descrizione' | 'tipo'>): string {
  return `${m.data}|${m.tipo}|${m.importo}|${normalizza(m.descrizione ?? '')}`
}
