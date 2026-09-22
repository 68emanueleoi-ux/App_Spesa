import Papa from 'papaparse'
import type { TipoMovimento } from '@/db/tipi'
import { parseData } from './date'
import { parseImporto, type SeparatoreDecimale } from './importi'
import { normalizza } from './testo'

export interface TabellaCsv {
  intestazioni: string[]
  righe: string[][]
  delimitatore: string
}

/** Come ricavare il tipo (entrata/uscita) da una riga */
export type ModoTipo =
  | { modo: 'segno'; invertito: boolean } // importo negativo = uscita (o il contrario)
  | { modo: 'dueColonne'; colonnaEntrate: number } // una colonna per le uscite (importo) e una per le entrate
  | { modo: 'colonna'; colonna: number; valoreEntrata: string } // una colonna testuale che dice il tipo
  | { modo: 'tutteUscite' }

export interface Mappatura {
  data: number | null
  importo: number | null
  descrizione: number | null
  tipo: ModoTipo
  decimale: SeparatoreDecimale
}

export interface RigaInterpretata {
  indice: number
  data: string
  /** centesimi, sempre positivo */
  importo: number
  tipo: TipoMovimento
  descrizione: string
}

export interface RigaScartata {
  indice: number
  motivo: string
}

/** Legge il file come testo: UTF-8 se valido, altrimenti Windows-1252 (export di banche e fogli di calcolo vecchi). */
export async function leggiFileCsv(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer)
  } catch {
    return new TextDecoder('windows-1252').decode(buffer)
  }
}

export function analizzaCsv(testo: string): TabellaCsv {
  const pulito = testo.replace(/^\uFEFF/, '')
  const esito = Papa.parse<string[]>(pulito, { skipEmptyLines: 'greedy', delimitersToGuess: [';', ',', '\t', '|'] })
  const righe = esito.data.filter((r) => r.some((c) => c.trim() !== ''))
  if (righe.length === 0) return { intestazioni: [], righe: [], delimitatore: ';' }
  const larghezza = Math.max(...righe.map((r) => r.length))
  const normalizzate = righe.map((r) =>
    [...r, ...new Array<string>(Math.max(0, larghezza - r.length)).fill('')].map((c) => c.trim()),
  )
  const [prima, ...resto] = normalizzate
  const haIntestazione =
    prima.every((c) => parseImporto(c) === null || c === '') && prima.some((c) => /[a-zà-ú]/i.test(c))
  return {
    intestazioni: haIntestazione ? prima : prima.map((_, i) => `Colonna ${i + 1}`),
    righe: haIntestazione ? resto : normalizzate,
    delimitatore: esito.meta.delimiter,
  }
}

/** Firma del formato: stesse intestazioni → stessa mappatura ricordata. */
export function firmaCsv(intestazioni: string[]): string {
  return intestazioni.map((i) => normalizza(i)).join('|')
}

const NOMI_DATA = ['data', 'date', 'giorno', 'valuta', 'data operazione', 'data contabile']
const NOMI_IMPORTO = ['importo', 'amount', 'valore', 'ammontare', 'uscite', 'dare', 'addebiti', 'debit']
const NOMI_ENTRATE = ['entrate', 'avere', 'accrediti', 'credit', 'importo entrate']
const NOMI_DESCRIZIONE = [
  'descrizione',
  'description',
  'causale',
  'dettagli',
  'esercente',
  'note',
  'beneficiario',
  'memo',
  'operazione',
]
const NOMI_TIPO = ['tipo', 'type', 'segno', 'dare/avere']

function trovaColonna(intestazioni: string[], candidati: string[]): number | null {
  const norm = intestazioni.map(normalizza)
  for (const c of candidati) {
    const i = norm.findIndex((n) => n === c)
    if (i !== -1) return i
  }
  for (const c of candidati) {
    const i = norm.findIndex((n) => n.includes(c))
    if (i !== -1) return i
  }
  return null
}

/** Propone una mappatura leggendo intestazioni e, se non bastano, il contenuto delle colonne. */
export function proponiMappatura(tabella: TabellaCsv): Mappatura {
  const { intestazioni, righe } = tabella
  const campione = righe.slice(0, 20)
  const quotaColonna = (i: number, test: (v: string) => boolean) => {
    const valori = campione.map((r) => r[i] ?? '').filter((v) => v !== '')
    return valori.length === 0 ? 0 : valori.filter(test).length / valori.length
  }

  let data = trovaColonna(intestazioni, NOMI_DATA)
  if (data === null) data = indiceMigliore(intestazioni.length, (i) => quotaColonna(i, (v) => parseData(v) !== null))

  let importo = trovaColonna(intestazioni, NOMI_IMPORTO)
  const entrate = trovaColonna(intestazioni, NOMI_ENTRATE)
  if (importo === null) {
    importo = indiceMigliore(intestazioni.length, (i) =>
      i === data ? 0 : quotaColonna(i, (v) => parseImporto(v) !== null && parseData(v) === null),
    )
  }

  let descrizione = trovaColonna(intestazioni, NOMI_DESCRIZIONE)
  if (descrizione === null) {
    descrizione = indiceMigliore(intestazioni.length, (i) =>
      i === data || i === importo || i === entrate ? 0 : quotaColonna(i, (v) => /[a-z]{3,}/i.test(v)),
    )
  }

  let tipo: ModoTipo = { modo: 'segno', invertito: false }
  const colonnaTipo = trovaColonna(intestazioni, NOMI_TIPO)
  if (entrate !== null && entrate !== importo) {
    tipo = { modo: 'dueColonne', colonnaEntrate: entrate }
  } else if (colonnaTipo !== null && colonnaTipo !== importo && colonnaTipo !== data) {
    const valori = [...new Set(campione.map((r) => normalizza(r[colonnaTipo] ?? '')).filter(Boolean))]
    const entrata = valori.find((v) => /entrat|accredit|avere|credit|in/.test(v)) ?? valori[0] ?? ''
    tipo = { modo: 'colonna', colonna: colonnaTipo, valoreEntrata: entrata }
  } else if (importo !== null) {
    const negativi = quotaColonna(importo, (v) => (parseImporto(v) ?? 0) < 0)
    if (negativi === 0) tipo = { modo: 'tutteUscite' }
  }

  return { data, importo, descrizione, tipo, decimale: 'auto' }
}

function indiceMigliore(n: number, punteggio: (i: number) => number): number | null {
  let migliore: number | null = null
  let max = 0.5 // almeno metà dei valori deve rispondere al criterio
  for (let i = 0; i < n; i++) {
    const p = punteggio(i)
    if (p > max) {
      max = p
      migliore = i
    }
  }
  return migliore
}

/** Applica la mappatura: righe pronte da importare e righe scartate con il motivo. */
export function interpretaRighe(
  righe: string[][],
  m: Mappatura,
): { valide: RigaInterpretata[]; scartate: RigaScartata[] } {
  const valide: RigaInterpretata[] = []
  const scartate: RigaScartata[] = []
  righe.forEach((r, indice) => {
    if (m.data === null || m.importo === null) {
      scartate.push({ indice, motivo: 'Colonne data e importo non indicate' })
      return
    }
    const data = parseData(r[m.data] ?? '')
    if (!data) {
      scartate.push({ indice, motivo: `Data non riconosciuta: "${r[m.data] ?? ''}"` })
      return
    }
    const descrizione = (m.descrizione !== null ? (r[m.descrizione] ?? '') : '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 100)

    let grezzo = parseImporto(r[m.importo] ?? '', m.decimale)
    let tipo: TipoMovimento
    switch (m.tipo.modo) {
      case 'dueColonne': {
        const e = parseImporto(r[m.tipo.colonnaEntrate] ?? '', m.decimale)
        if (e !== null && e !== 0) {
          grezzo = e
          tipo = 'entrata'
        } else tipo = 'uscita'
        break
      }
      case 'colonna':
        tipo = normalizza(r[m.tipo.colonna] ?? '') === normalizza(m.tipo.valoreEntrata) ? 'entrata' : 'uscita'
        break
      case 'tutteUscite':
        tipo = 'uscita'
        break
      default: {
        const negativo = (grezzo ?? 0) < 0
        tipo = negativo !== m.tipo.invertito ? 'uscita' : 'entrata'
      }
    }
    if (grezzo === null) {
      scartate.push({ indice, motivo: `Importo non riconosciuto: "${r[m.importo] ?? ''}"` })
      return
    }
    // Zero è un importo valido ma non è un movimento: dirlo, invece di far
    // credere che la colonna sia sbagliata.
    if (grezzo === 0) {
      scartate.push({ indice, motivo: 'Importo a zero: non è un movimento' })
      return
    }
    valide.push({ indice, data, importo: Math.abs(grezzo), tipo, descrizione })
  })
  return { valide, scartate }
}
