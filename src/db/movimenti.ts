import { db, nuovoId } from './db'
import type { Movimento } from './tipi'

export type DatiMovimento = Pick<Movimento, 'tipo' | 'importo' | 'categoriaId' | 'data' | 'descrizione'>

export async function aggiungiMovimento(dati: DatiMovimento): Promise<Movimento> {
  const m: Movimento = {
    id: nuovoId(),
    ...dati,
    descrizione: dati.descrizione?.trim() || undefined,
    creatoIl: new Date().toISOString(),
    origine: 'manuale',
  }
  await db.movimenti.add(m)
  return m
}

export async function aggiornaMovimento(id: string, dati: DatiMovimento): Promise<void> {
  await db.movimenti.update(id, { ...dati, descrizione: dati.descrizione?.trim() || undefined })
}

/** Elimina e restituisce il movimento, così si può ripristinare con "Annulla". */
export async function eliminaMovimento(id: string): Promise<Movimento | undefined> {
  const m = await db.movimenti.get(id)
  if (m) await db.movimenti.delete(id)
  return m
}

export async function ripristinaMovimento(m: Movimento): Promise<void> {
  await db.movimenti.put(m)
}

/** Movimenti di un mese ("2026-09"), dal più recente (a parità di data, l'ultimo inserito per primo). */
export async function movimentiDelMese(mese: string): Promise<Movimento[]> {
  const lista = await db.movimenti.where('data').between(`${mese}-01`, `${mese}-31`, true, true).toArray()
  return ordinaPerDataDesc(lista)
}

export function ordinaPerDataDesc(lista: Movimento[]): Movimento[] {
  return [...lista].sort((a, b) => (b.data + b.creatoIl).localeCompare(a.data + a.creatoIl))
}
