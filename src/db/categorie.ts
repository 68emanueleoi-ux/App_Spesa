import { db, nuovoId } from './db'
import { SENZA_CATEGORIA_ENTRATA, SENZA_CATEGORIA_USCITA, type Categoria, type TipoMovimento } from './tipi'

export type DatiCategoria = Pick<Categoria, 'nome' | 'tipo' | 'colore' | 'icona'>

export function senzaCategoria(tipo: TipoMovimento): string {
  return tipo === 'uscita' ? SENZA_CATEGORIA_USCITA : SENZA_CATEGORIA_ENTRATA
}

export async function aggiungiCategoria(dati: DatiCategoria): Promise<Categoria> {
  const ultime = await db.categorie.where('tipo').equals(dati.tipo).filter((c) => !c.diSistema).toArray()
  const ordine = ultime.reduce((max, c) => Math.max(max, c.ordine), 0) + 1
  const c: Categoria = { id: nuovoId(), ...dati, nome: dati.nome.trim(), ordine }
  await db.categorie.add(c)
  return c
}

export async function aggiornaCategoria(id: string, dati: Omit<DatiCategoria, 'tipo'>): Promise<void> {
  await db.categorie.update(id, { ...dati, nome: dati.nome.trim() })
}

export function contaMovimentiCategoria(id: string): Promise<number> {
  return db.movimenti.where('categoriaId').equals(id).count()
}

/**
 * Elimina una categoria spostando i suoi movimenti (e le regole che la usano) su `destinazioneId`.
 * Tutto in una transazione: o va a buon fine tutto, o niente.
 */
export async function eliminaCategoria(id: string, destinazioneId: string): Promise<void> {
  await db.transaction('rw', db.categorie, db.movimenti, db.regole, async () => {
    const c = await db.categorie.get(id)
    if (!c || c.diSistema) throw new Error('Questa categoria non si può eliminare')
    await db.movimenti.where('categoriaId').equals(id).modify({ categoriaId: destinazioneId })
    await db.regole.where('categoriaId').equals(id).modify({ categoriaId: destinazioneId })
    await db.categorie.delete(id)
  })
}
