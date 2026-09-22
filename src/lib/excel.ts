import type { TabellaCsv } from './csv'
import { analizzaCsv } from './csv'

/** Converte una cella Excel in testo nel formato che il resto dell'import sa leggere. */
export function cellaInTesto(v: unknown): string {
  if (v === null || v === undefined) return ''
  if (v instanceof Date) {
    const p = (n: number) => String(n).padStart(2, '0')
    return `${p(v.getDate())}/${p(v.getMonth() + 1)}/${v.getFullYear()}`
  }
  // I numeri di Excel usano il punto: li scrivo con la virgola e due decimali, così non vengono
  // scambiati per migliaia ("12.345" sarebbe letto come 12.345 euro).
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toFixed(2).replace('.', ',')
  return String(v).trim()
}

/** Da righe di celle a tabella: riusa il riconoscimento dell'intestazione del CSV. */
export function righeExcelInTabella(righe: unknown[][]): TabellaCsv {
  const testo = righe
    .map((r) => r.map((c) => `"${cellaInTesto(c).replace(/"/g, '""')}"`).join(';'))
    .join('\n')
  return { ...analizzaCsv(testo), delimitatore: 'xlsx' }
}

export function eExcel(file: File): boolean {
  return /\.xlsx?$/i.test(file.name) || file.type.includes('spreadsheetml') || file.type.includes('ms-excel')
}

/** Legge il primo foglio di un .xlsx. La libreria viene caricata solo quando serve. */
export async function leggiFileExcel(file: File): Promise<TabellaCsv> {
  const { readSheet } = await import('read-excel-file/browser')
  const righe = await readSheet(file, 1)
  return righeExcelInTabella(righe as unknown[][])
}
