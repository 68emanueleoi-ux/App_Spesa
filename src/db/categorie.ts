import { db, nuovoId } from './db'
import { SENZA_CATEGORIA_ENTRATA, SENZA_CATEGORIA_USCITA, type Categoria, type TipoMovimento } from './tipi'

export type DatiCategoria = Pick<Categoria, 'nome' | 'tipo' | 'colore' | 'icona' | 'budget'>

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
  // budget undefined va scritto esplicitamente: togliere il tetto deve cancellarlo davvero
  await db.categorie.update(id, { ...dati, nome: dati.nome.trim(), budget: dati.budget })
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

/**
 * Sposta una categoria di un posto su o giù fra quelle dello stesso tipo.
 * Il campo `ordine` esisteva dall'inizio ma era deciso dal seed e dalla data di
 * creazione: non c'era modo di mettere in cima quelle che si usano ogni giorno.
 *
 * Scambia l'ordine con la vicina, in transazione. Le categorie di sistema
 * ("Senza categoria", ordine 999) restano in fondo e non si spostano.
 */
export async function spostaCategoria(id: string, direzione: 'su' | 'giu'): Promise<void> {
  await db.transaction('rw', db.categorie, async () => {
    const c = await db.categorie.get(id)
    if (!c || c.diSistema) throw new Error('Questa categoria non si può spostare')

    const sorelle = (await db.categorie.where('tipo').equals(c.tipo).toArray())
      .filter((x) => !x.diSistema)
      .sort((a, b) => a.ordine - b.ordine)

    const i = sorelle.findIndex((x) => x.id === id)
    const j = direzione === 'su' ? i - 1 : i + 1
    if (i === -1 || j < 0 || j >= sorelle.length) return // già agli estremi: non è un errore

    const vicina = sorelle[j]
    // Ordini duplicati o uguali renderebbero lo scambio invisibile: riassegna per posizione.
    await db.categorie.update(c.id, { ordine: j + 1 })
    await db.categorie.update(vicina.id, { ordine: i + 1 })
  })
}
