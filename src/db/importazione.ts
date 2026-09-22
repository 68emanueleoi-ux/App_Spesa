import { db, nuovoId } from './db'
import type { Movimento, TipoMovimento } from './tipi'
import type { Mappatura } from '@/lib/csv'
import { chiaveDuplicato } from '@/lib/calcoli'

export interface MovimentoDaImportare {
  data: string
  importo: number
  tipo: TipoMovimento
  descrizione: string
  categoriaId: string
}

/** Insieme delle chiavi dei movimenti già presenti, per la deduplica. */
export async function chiaviEsistenti(): Promise<Set<string>> {
  const tutti = await db.movimenti.toArray()
  return new Set(tutti.map(chiaveDuplicato))
}

export async function importaMovimenti(lista: MovimentoDaImportare[]): Promise<number> {
  const adesso = new Date().toISOString()
  const movimenti: Movimento[] = lista.map((m) => ({
    id: nuovoId(),
    tipo: m.tipo,
    importo: m.importo,
    categoriaId: m.categoriaId,
    data: m.data,
    descrizione: m.descrizione || undefined,
    creatoIl: adesso,
    origine: 'import',
  }))
  await db.movimenti.bulkAdd(movimenti)
  return movimenti.length
}

const PREFISSO = 'csv.mappatura.'

export async function mappaturaRicordata(firma: string): Promise<Mappatura | undefined> {
  const r = await db.impostazioni.get(PREFISSO + firma)
  return r?.valore as Mappatura | undefined
}

export async function ricordaMappatura(firma: string, m: Mappatura): Promise<void> {
  await db.impostazioni.put({ chiave: PREFISSO + firma, valore: m })
}
