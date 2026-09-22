import { format, parseISO, addMonths, getDaysInMonth, isValid, parse } from 'date-fns'
import { it } from 'date-fns/locale'

/** Chiave mese: "2026-09" */
export type MeseKey = string

export function oggiIso(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function meseCorrente(): MeseKey {
  return format(new Date(), 'yyyy-MM')
}

export function meseDi(dataIso: string): MeseKey {
  return dataIso.slice(0, 7)
}

export function mesePrecedente(mese: MeseKey): MeseKey {
  return format(addMonths(parseISO(`${mese}-01`), -1), 'yyyy-MM')
}

export function meseSuccessivo(mese: MeseKey): MeseKey {
  return format(addMonths(parseISO(`${mese}-01`), 1), 'yyyy-MM')
}

export function giorniNelMese(mese: MeseKey): number {
  return getDaysInMonth(parseISO(`${mese}-01`))
}

/** Giorno del mese (1–31) di una data ISO */
export function giornoDi(dataIso: string): number {
  return Number(dataIso.slice(8, 10))
}

/** "2026-09" → "Settembre 2026" */
export function formatMese(mese: MeseKey): string {
  const s = format(parseISO(`${mese}-01`), 'LLLL yyyy', { locale: it })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** "2026-09-22" → "22 set" */
export function formatDataBreve(dataIso: string): string {
  return format(parseISO(dataIso), 'd MMM', { locale: it }).replace('.', '')
}

/** "2026-09-22" → "Martedì 22 settembre" */
export function formatDataLunga(dataIso: string): string {
  const s = format(parseISO(dataIso), 'EEEE d MMMM', { locale: it })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** "2026-09-22" → "22/09/2026" */
export function formatDataNumerica(dataIso: string): string {
  return format(parseISO(dataIso), 'dd/MM/yyyy')
}

const FORMATI_DATA = [
  'yyyy-MM-dd',
  'dd/MM/yyyy',
  'dd-MM-yyyy',
  'dd.MM.yyyy',
  'dd/MM/yy',
  'dd-MM-yy',
  'dd.MM.yy',
  'yyyy/MM/dd',
  "yyyy-MM-dd'T'HH:mm:ss",
]

/**
 * Riconosce una data in vari formati ("22/09/2026", "22-09-2026", "2026-09-22", "22.09.26")
 * e la restituisce in ISO. Null se non riconosciuta.
 */
export function parseData(testo: string): string | null {
  const s = testo.trim()
  for (const f of FORMATI_DATA) {
    const d = parse(s, f, new Date())
    if (isValid(d) && d.getFullYear() > 1970) return format(d, 'yyyy-MM-dd')
  }
  return null
}
