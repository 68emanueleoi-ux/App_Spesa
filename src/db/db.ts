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

    // Il seed gira dentro la transazione che crea il database: due schede aperte
    // insieme al primo avvio non possono seminare due volte (prima era un
    // count() seguito da bulkAdd, e la seconda scheda falliva con un errore di
    // vincolo che finiva solo in console).
    this.on('populate', (tx) => {
      void tx.table<Categoria, string>('categorie').bulkAdd(CATEGORIE_PREDEFINITE)
    })
  }
}

export const db = new SpeseDb()

/** Apre il database (il seed avviene da sé alla creazione) e chiede lo storage persistente: Safari può cancellare i dati dei siti non usati. */
export async function inizializzaDb(istanza: SpeseDb = db): Promise<void> {
  await istanza.open()
  // Non si aspetta la risposta: su alcuni browser resta in sospeso finché l'utente non decide.
  if (typeof navigator !== 'undefined' && navigator.storage?.persist) {
    navigator.storage.persist().catch(() => undefined)
  }
}

export function nuovoId(): string {
  return crypto.randomUUID()
}
