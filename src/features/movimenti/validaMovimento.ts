import type { Resolver } from 'react-hook-form'
import { giorniNelMese, meseCorrente } from '@/lib/date'
import { parseImporto } from '@/lib/importi'

export interface ValoriMovimento {
  tipo: 'entrata' | 'uscita'
  /** testo come lo scrive l'utente: "12,50", "12.50", "€ 12,50" */
  importo: string
  categoriaId: string
  /** ISO yyyy-mm-dd */
  data: string
  descrizione: string
}

export type ErroriMovimento = Partial<Record<keyof ValoriMovimento, string>>

/** Ultimo giorno del mese corrente: oltre non si registra nulla. */
export function fineMeseCorrente(): string {
  const m = meseCorrente()
  return `${m}-${String(giorniNelMese(m)).padStart(2, '0')}`
}

/**
 * Le stesse quattro regole di prima (importo > 0, categoria scelta, data non
 * futura, descrizione entro 100 caratteri), senza schema dichiarativo:
 * gli altri due form dell'app validano già così, e zod pesava 142 kB
 * minificati per questo solo punto.
 */
export function validaMovimento(v: ValoriMovimento): ErroriMovimento {
  const errori: ErroriMovimento = {}

  const centesimi = parseImporto(v.importo)
  if (centesimi === null || centesimi <= 0) errori.importo = 'Inserisci un importo maggiore di zero'

  if (!v.categoriaId) errori.categoriaId = 'Scegli una categoria'

  if (!/^\d{4}-\d{2}-\d{2}$/.test(v.data)) errori.data = 'Inserisci una data'
  else if (v.data > fineMeseCorrente()) errori.data = 'La data non può essere in un mese futuro'

  if (v.descrizione.length > 100) errori.descrizione = 'Massimo 100 caratteri'

  return errori
}

/** Adatta `validaMovimento` al formato che react-hook-form si aspetta. */
export const resolverMovimento: Resolver<ValoriMovimento> = (valori) => {
  const errori = validaMovimento(valori)
  const campi = Object.keys(errori) as (keyof ValoriMovimento)[]
  if (campi.length === 0) return { values: valori, errors: {} }
  return {
    values: {},
    errors: Object.fromEntries(campi.map((c) => [c, { type: 'validazione', message: errori[c] }])),
  }
}
