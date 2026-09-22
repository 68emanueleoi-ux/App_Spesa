/**
 * Date e mesi come stringhe ISO ("2026-09-22", "2026-09"), con `Intl` per i
 * nomi italiani. L'app lavorava già su stringhe e faceva `slice()` da sola in
 * mezza pagina: date-fns pesava 97 kB minificati per una decina di funzioni,
 * e la sua `parse` provava nove formati in sequenza a ogni riga importata.
 */

/** Chiave mese: "2026-09" */
export type MeseKey = string

const IT = 'it-IT'

// Le istanze di Intl.DateTimeFormat costano: si creano una volta sola.
const fmtMese = new Intl.DateTimeFormat(IT, { month: 'long', year: 'numeric' })
const fmtNomeMese = new Intl.DateTimeFormat(IT, { month: 'long' })
const fmtBreve = new Intl.DateTimeFormat(IT, { day: 'numeric', month: 'short' })
const fmtBreveConAnno = new Intl.DateTimeFormat(IT, { day: 'numeric', month: 'short', year: 'numeric' })
const fmtLunga = new Intl.DateTimeFormat(IT, { weekday: 'long', day: 'numeric', month: 'long' })
const fmtNumerica = new Intl.DateTimeFormat(IT, { day: '2-digit', month: '2-digit', year: 'numeric' })

function due(n: number): string {
  return String(n).padStart(2, '0')
}

/**
 * Da "2026-09-22" a una Date locale a mezzanotte.
 * `new Date("2026-09-22")` la interpreterebbe come UTC: a ovest di Greenwich
 * la data mostrata slitterebbe al giorno prima.
 */
function dataLocale(dataIso: string): Date {
  const [anno, mese, giorno] = dataIso.split('-').map(Number)
  return new Date(anno, (mese ?? 1) - 1, giorno ?? 1)
}

function isoDi(d: Date): string {
  return `${d.getFullYear()}-${due(d.getMonth() + 1)}-${due(d.getDate())}`
}

/** Prima lettera maiuscola: Intl restituisce i nomi dei mesi in minuscolo. */
function maiuscola(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Alcune versioni di ICU abbreviano con il punto ("set."), altre no. */
function senzaPunto(s: string): string {
  return s.replace(/\./g, '')
}

export function oggiIso(): string {
  return isoDi(new Date())
}

export function meseCorrente(): MeseKey {
  return oggiIso().slice(0, 7)
}

export function meseDi(dataIso: string): MeseKey {
  return dataIso.slice(0, 7)
}

function spostaMese(mese: MeseKey, delta: number): MeseKey {
  const [anno, m] = mese.split('-').map(Number)
  const d = new Date(anno, m - 1 + delta, 1)
  return `${d.getFullYear()}-${due(d.getMonth() + 1)}`
}

export function mesePrecedente(mese: MeseKey): MeseKey {
  return spostaMese(mese, -1)
}

export function meseSuccessivo(mese: MeseKey): MeseKey {
  return spostaMese(mese, 1)
}

export function giorniNelMese(mese: MeseKey): number {
  const [anno, m] = mese.split('-').map(Number)
  // il giorno 0 del mese successivo è l'ultimo di questo: gestisce anche i bisestili
  return new Date(anno, m, 0).getDate()
}

/** Giorno del mese (1–31) di una data ISO */
export function giornoDi(dataIso: string): number {
  return Number(dataIso.slice(8, 10))
}

/** "2026-09" → "Settembre 2026" */
export function formatMese(mese: MeseKey): string {
  return maiuscola(fmtMese.format(dataLocale(`${mese}-01`)))
}

/** "2026-09" → "settembre" (minuscolo: sta dentro una frase) */
export function nomeMese(mese: MeseKey): string {
  return fmtNomeMese.format(dataLocale(`${mese}-01`))
}

/** "2026-09-22" → "22 set" */
export function formatDataBreve(dataIso: string): string {
  return senzaPunto(fmtBreve.format(dataLocale(dataIso)))
}

/** "2026-09-22" → "22 set 2026": nei risultati che attraversano più mesi l'anno serve */
export function formatDataBreveConAnno(dataIso: string): string {
  return senzaPunto(fmtBreveConAnno.format(dataLocale(dataIso)))
}

/** "2026-09-22" → "Martedì 22 settembre" */
export function formatDataLunga(dataIso: string): string {
  return maiuscola(fmtLunga.format(dataLocale(dataIso)))
}

/** "2026-09-22" → "22/09/2026" */
export function formatDataNumerica(dataIso: string): string {
  return fmtNumerica.format(dataLocale(dataIso))
}

const RE_ANNO_PRIMA = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[T ].*)?$/
const RE_GIORNO_PRIMA = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2}|\d{4})$/

/** Anno a due cifre: 00–68 → 2000, 69–99 → 1900 (la convenzione usata anche da date-fns). */
function annoCompleto(anno: number): number {
  if (anno >= 100) return anno
  return anno <= 68 ? 2000 + anno : 1900 + anno
}

/**
 * Riconosce una data in vari formati ("22/09/2026", "22-09-2026", "2026-09-22",
 * "22.09.26", "2026-09-22T14:30:00") e la restituisce in ISO. Null se non valida.
 *
 * Una coppia di regex invece di nove tentativi di parsing in sequenza: sulle
 * righe che non sono date (le intestazioni, quando si indovinano le colonne)
 * il vecchio codice provava tutti e nove i formati prima di arrendersi.
 */
export function parseData(testo: string): string | null {
  const s = testo.trim()
  if (s === '') return null

  let anno: number
  let mese: number
  let giorno: number

  const annoPrima = RE_ANNO_PRIMA.exec(s)
  if (annoPrima) {
    anno = Number(annoPrima[1])
    mese = Number(annoPrima[2])
    giorno = Number(annoPrima[3])
  } else {
    const giornoPrima = RE_GIORNO_PRIMA.exec(s)
    if (!giornoPrima) return null
    giorno = Number(giornoPrima[1])
    mese = Number(giornoPrima[2])
    anno = annoCompleto(Number(giornoPrima[3]))
  }

  if (anno <= 1970 || mese < 1 || mese > 12 || giorno < 1) return null
  // il 31 febbraio non esiste: la Date scivolerebbe a marzo, quindi si ricontrolla
  const d = new Date(anno, mese - 1, giorno)
  if (d.getFullYear() !== anno || d.getMonth() !== mese - 1 || d.getDate() !== giorno) return null

  return isoDi(d)
}
