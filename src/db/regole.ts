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

/**
 * Crea in blocco le regole proposte dall'importazione, saltando quelle il cui
 * testo esiste già. Legge le regole una volta sola: prima ogni riga corretta
 * faceva la sua query di controllo e il suo inserimento, in sequenza.
 * Restituisce quante ne ha create.
 */
export async function aggiungiRegole(nuove: { contiene: string; categoriaId: string }[]): Promise<number> {
  if (nuove.length === 0) return 0

  return db.transaction('rw', db.regole, async () => {
    const esistenti = await db.regole.toArray()
    const viste = new Set(esistenti.map((r) => r.contiene.trim().toLowerCase()))
    let priorita = esistenti.reduce((max, r) => Math.max(max, r.priorita), 0)

    const daCreare: RegolaCategoria[] = []
    for (const n of nuove) {
      const contiene = n.contiene.trim()
      const chiave = contiene.toLowerCase()
      // anche i doppioni dentro lo stesso file vanno saltati
      if (contiene === '' || viste.has(chiave)) continue
      viste.add(chiave)
      priorita += 1
      daCreare.push({ id: nuovoId(), contiene, categoriaId: n.categoriaId, priorita })
    }

    await db.regole.bulkAdd(daCreare)
    return daCreare.length
  })
}
