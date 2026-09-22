// L'import deve venire prima di qualsiasi modulo che tocchi il database.
import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { beforeEach, describe, expect, it } from 'vitest'
import { SpeseDb } from '../db'
import type { Categoria, Movimento, RegolaCategoria } from '../tipi'

const NOME = 'spese-migrazione'

/** Il database com'era nella versione 1, con gli indici `tipo` e `[tipo+data]`. */
function apriV1() {
  const v1 = new Dexie(NOME)
  v1.version(1).stores({
    categorie: 'id, tipo, ordine',
    movimenti: 'id, data, tipo, categoriaId, [tipo+data]',
    regole: 'id, priorita, categoriaId',
    impostazioni: 'chiave',
  })
  return v1
}

const movimento = (id: string, data: string): Movimento => ({
  id,
  tipo: 'uscita',
  importo: 1250,
  categoriaId: 'spesa',
  data,
  descrizione: `spesa ${id}`,
  creatoIl: `${data}T10:00:00.000Z`,
  origine: 'manuale',
})

beforeEach(async () => {
  await Dexie.delete(NOME)
})

describe('migrazione da v1 a v2', () => {
  it('non perde movimenti, categorie, regole e impostazioni', async () => {
    const v1 = apriV1()
    await v1.open()
    await v1.table<Categoria, string>('categorie').bulkAdd([
      { id: 'spesa', nome: 'Spesa', tipo: 'uscita', colore: 'c1', icona: 'shopping-basket', ordine: 1 },
      { id: 'svago', nome: 'Svago', tipo: 'uscita', colore: 'c4', icona: 'party-popper', ordine: 2, budget: 10000 },
    ])
    await v1.table<Movimento, string>('movimenti').bulkAdd([
      movimento('m1', '2026-07-01'),
      movimento('m2', '2026-08-15'),
      movimento('m3', '2026-09-22'),
    ])
    await v1
      .table<RegolaCategoria, string>('regole')
      .add({ id: 'r1', contiene: 'conad', categoriaId: 'spesa', priorita: 1 })
    await v1.table('impostazioni').put({ chiave: 'backup.ultimo', valore: '2026-09-01T00:00:00.000Z' })
    v1.close()

    const v2 = new SpeseDb(NOME)
    await v2.open()
    try {
      expect(v2.verno).toBe(2)
      expect(await v2.movimenti.count()).toBe(3)
      expect(await v2.categorie.count()).toBe(2)
      expect(await v2.regole.count()).toBe(1)
      // i campi non indicizzati sopravvivono: budget e descrizione erano i più a rischio
      expect((await v2.categorie.get('svago'))?.budget).toBe(10000)
      expect((await v2.movimenti.get('m2'))?.descrizione).toBe('spesa m2')
      expect((await v2.impostazioni.get('backup.ultimo'))?.valore).toBe('2026-09-01T00:00:00.000Z')
    } finally {
      v2.close()
    }
  })

  it('gli indici rimasti funzionano ancora dopo la migrazione', async () => {
    const v1 = apriV1()
    await v1.open()
    await v1
      .table<Movimento, string>('movimenti')
      .bulkAdd([movimento('m1', '2026-07-01'), movimento('m2', '2026-09-10'), movimento('m3', '2026-09-22')])
    v1.close()

    const v2 = new SpeseDb(NOME)
    await v2.open()
    try {
      // `data`: è l'indice su cui girano sia il mese sia la ricerca globale
      const settembre = await v2.movimenti.where('data').between('2026-09-01', '2026-09-31', true, true).toArray()
      expect(settembre.map((m) => m.id).sort()).toEqual(['m2', 'm3'])
      // `categoriaId`: lo usa l'eliminazione di una categoria
      expect(await v2.movimenti.where('categoriaId').equals('spesa').count()).toBe(3)
    } finally {
      v2.close()
    }
  })

  it('il seed non riparte su un database che ha già dei dati', async () => {
    const v1 = apriV1()
    await v1.open()
    await v1
      .table<Categoria, string>('categorie')
      .add({ id: 'solo-mia', nome: 'Solo mia', tipo: 'uscita', colore: 'c1', icona: 'house', ordine: 1 })
    v1.close()

    const v2 = new SpeseDb(NOME)
    await v2.open()
    try {
      // populate scatta solo alla creazione: una migrazione non deve riportare le predefinite
      expect(await v2.categorie.count()).toBe(1)
      expect((await v2.categorie.toArray())[0].id).toBe('solo-mia')
    } finally {
      v2.close()
    }
  })
})
