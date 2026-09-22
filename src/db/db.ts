import Dexie, { type EntityTable } from 'dexie'
import type { Categoria, Impostazione, Movimento, RegolaCategoria } from './tipi'
import { CATEGORIE_PREDEFINITE } from './seed'

export class SpeseDb extends Dexie {
  categorie!: EntityTable<Categoria, 'id'>
  movimenti!: EntityTable<Movimento, 'id'>
  regole!: EntityTable<RegolaCategoria, 'id'>
  impostazioni!: EntityTable<Impostazione, 'chiave'>

  constructor(nome = 'spese') {
    super(nome)
    this.version(1).stores({
      // solo i campi indicizzati; gli altri vengono salvati comunque
      categorie: 'id, tipo, ordine',
      movimenti: 'id, data, tipo, categoriaId, [tipo+data]',
      regole: 'id, priorita, categoriaId',
      impostazioni: 'chiave',
    })
  }
}

export const db = new SpeseDb()

/** Seed delle categorie al primo avvio e richiesta di storage persistente (Safari può cancellare i dati dei siti non usati). */
export async function inizializzaDb(istanza: SpeseDb = db): Promise<void> {
  const n = await istanza.categorie.count()
  if (n === 0) {
    await istanza.categorie.bulkAdd(CATEGORIE_PREDEFINITE)
  }
  // Non si aspetta la risposta: su alcuni browser resta in sospeso finché l'utente non decide.
  if (typeof navigator !== 'undefined' && navigator.storage?.persist) {
    navigator.storage.persist().catch(() => undefined)
  }
}

export function nuovoId(): string {
  return crypto.randomUUID()
}
