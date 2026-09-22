/**
 * Gli importi sono SEMPRE interi in centesimi (1250 = € 12,50).
 * Questo file è l'unico punto di conversione da/verso testo.
 */

export type SeparatoreDecimale = ',' | '.' | 'auto'

const MENO = '−' // segno meno tipografico, più leggibile del trattino

/**
 * Converte una stringa ("12,50", "€ 1.234,56", "-3.5") in centesimi.
 * Restituisce null se il testo non è un importo.
 * Con `decimale: 'auto'` la virgola è sempre decimale; il punto è decimale
 * a meno che sia l'unico separatore e sia seguito da esattamente 3 cifre
 * ("1.234" → 1234 euro, "12.50" → 12,50 euro).
 */
export function parseImporto(input: string, decimale: SeparatoreDecimale = 'auto'): number | null {
  let s = input
    .replace(/[€\s ]/g, '')
    .replace(/−/g, '-')
    .trim()
  if (s === '') return null

  let segno = 1
  if (s.startsWith('-')) {
    segno = -1
    s = s.slice(1)
  } else if (s.startsWith('+')) {
    s = s.slice(1)
  }
  if (!/^[\d.,]+$/.test(s)) return null

  const sep = decimale === 'auto' ? rilevaDecimale(s) : decimale
  const migliaia = sep === ',' ? '.' : ','
  const pezzi = s.split(sep)
  if (pezzi.length > 2) return null
  const intera = pezzi[0].split(migliaia).join('')
  const frazione = pezzi[1] ?? ''
  if (frazione.includes(migliaia)) return null
  if (intera === '' && frazione === '') return null
  if (!/^\d*$/.test(intera) || !/^\d*$/.test(frazione)) return null

  // arrotonda alla seconda cifra decimale
  const fraz3 = (frazione + '000').slice(0, 3)
  let cent = Number(intera || '0') * 100 + Number(fraz3.slice(0, 2))
  if (Number(fraz3[2]) >= 5) cent += 1
  if (!Number.isSafeInteger(cent)) return null
  return segno * cent
}

function rilevaDecimale(s: string): ',' | '.' {
  const ultimaVirgola = s.lastIndexOf(',')
  const ultimoPunto = s.lastIndexOf('.')
  if (ultimaVirgola === -1 && ultimoPunto === -1) return ','
  if (ultimaVirgola !== -1 && ultimoPunto !== -1) return ultimaVirgola > ultimoPunto ? ',' : '.'
  if (ultimaVirgola !== -1) return ','
  // solo punti: un solo punto seguito da 3 cifre → separatore delle migliaia
  const punti = s.split('.').length - 1
  const dopo = s.slice(ultimoPunto + 1)
  if (punti > 1) return ','
  if (dopo.length === 3) return ','
  return '.'
}

export interface OpzioniFormato {
  /** 'auto': segno solo se negativo · 'sempre': anche il + · 'mai': valore assoluto */
  segno?: 'auto' | 'sempre' | 'mai'
  /** mostra il simbolo € (default true) */
  simbolo?: boolean
}

/** 1234567 → "€ 12.345,67" · -1250 → "−€ 12,50" */
export function formatImporto(centesimi: number, opzioni: OpzioniFormato = {}): string {
  const { segno = 'auto', simbolo = true } = opzioni
  const assoluto = Math.abs(Math.round(centesimi))
  const euro = Math.floor(assoluto / 100)
  const cent = assoluto % 100
  const interaConPunti = euro.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  const corpo = `${simbolo ? '€ ' : ''}${interaConPunti},${cent.toString().padStart(2, '0')}`
  if (segno === 'mai') return corpo
  if (centesimi < 0) return `${MENO}${corpo}`
  if (segno === 'sempre' && centesimi > 0) return `+${corpo}`
  return corpo
}

/** Importo di un movimento con il segno del suo tipo: uscita → "−€ 12,50", entrata → "+€ 12,50" */
export function formatImportoMovimento(centesimi: number, tipo: 'entrata' | 'uscita'): string {
  const v = Math.abs(centesimi)
  return tipo === 'uscita' ? `${MENO}${formatImporto(v)}` : `+${formatImporto(v)}`
}

/** Valore da mostrare in un campo di input: 1250 → "12,50" (senza simbolo né punti delle migliaia) */
export function centesimiInInput(centesimi: number): string {
  return formatImporto(Math.abs(centesimi), { simbolo: false, segno: 'mai' }).replace(/\./g, '')
}
