import { db, nuovoId } from './db'
import type { RegolaCategoria } from './tipi'

export async function aggiungiRegola(contiene: string, categoriaId: string): Promise<RegolaCategoria> {
  const tutte = await db.regole.toArray()
  const priorita = tutte.reduce((max, r) => Math.max(max, r.priorita), 0) + 1
  const r: RegolaCategoria = { id: nuovoId(), contiene: contiene.trim(), categoriaId, priorita }
  await db.regole.add(r)
  return r
}

export async function aggiornaRegola(id: string, contiene: string, categoriaId: string): Promise<void> {
  await db.regole.update(id, { contiene: contiene.trim(), categoriaId })
}

export async function eliminaRegola(id: string): Promise<void> {
  await db.regole.delete(id)
}

/** Esiste già una regola con lo stesso testo? (per non proporla due volte) */
export async function esisteRegola(contiene: string): Promise<boolean> {
  const c = contiene.trim().toLowerCase()
  return (await db.regole.filter((r) => r.contiene.trim().toLowerCase() === c).count()) > 0
}
