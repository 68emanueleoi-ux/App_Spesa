// L'import deve venire prima di qualsiasi modulo che tocchi il database.
import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db, inizializzaDb } from '../db'
import { CATEGORIE_PREDEFINITE } from '../seed'
import { SENZA_CATEGORIA_ENTRATA, SENZA_CATEGORIA_USCITA } from '../tipi'
import {
  aggiungiCategoria,
  aggiornaCategoria,
  contaMovimentiCategoria,
  eliminaCategoria,
  senzaCategoria,
  spostaCategoria,
} from '../categorie'
import {
  aggiungiMovimento,
  aggiornaMovimento,
  cercaMovimenti,
  eliminaMovimento,
  movimentiDelMese,
  ripristinaMovimento,
} from '../movimenti'
import { aggiungiRegola, aggiungiRegole, aggiornaRegola, eliminaRegola, esisteRegola } from '../regole'
import { creaBackup, dataUltimoBackup, leggiBackup, ripristinaBackup, type Backup } from '../backup'
import { chiaviEsistenti, importaMovimenti, mappaturaRicordata, ricordaMappatura } from '../importazione'

beforeEach(async () => {
  await db.delete()
  await db.open()
  await inizializzaDb()
})

const spesa = { tipo: 'uscita' as const, importo: 1250, categoriaId: 'spesa', data: '2026-09-10', descrizione: 'Conad' }

describe('inizializzaDb', () => {
  it('semina le categorie predefinite', async () => {
    expect(await db.categorie.count()).toBe(CATEGORIE_PREDEFINITE.length)
  })

  it('non semina una seconda volta', async () => {
    await inizializzaDb()
    await inizializzaDb()
    expect(await db.categorie.count()).toBe(CATEGORIE_PREDEFINITE.length)
  })

  it('due aperture in parallelo al primo avvio non seminano due volte', async () => {
    await db.delete()
    // Con il vecchio count()+bulkAdd tutte e tre vedevano il database vuoto:
    // la prima seminava, le altre fallivano con un errore di vincolo.
    await Promise.all([inizializzaDb(), inizializzaDb(), inizializzaDb()])
    expect(await db.categorie.count()).toBe(CATEGORIE_PREDEFINITE.length)
  })

  it('crea una "Senza categoria" per ogni tipo', async () => {
    expect(await db.categorie.get(SENZA_CATEGORIA_USCITA)).toBeDefined()
    expect(await db.categorie.get(SENZA_CATEGORIA_ENTRATA)).toBeDefined()
  })
})

describe('movimenti', () => {
  it('aggiunge segnando origine e data di creazione', async () => {
    const m = await aggiungiMovimento(spesa)
    expect(m.origine).toBe('manuale')
    expect(m.creatoIl).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(await db.movimenti.get(m.id)).toMatchObject({ importo: 1250, descrizione: 'Conad' })
  })

  it('normalizza la descrizione: spazi via, vuota diventa assente', async () => {
    const m = await aggiungiMovimento({ ...spesa, descrizione: '   ' })
    expect(m.descrizione).toBeUndefined()
    const n = await aggiungiMovimento({ ...spesa, descrizione: '  Conad  ' })
    expect(n.descrizione).toBe('Conad')
  })

  it('aggiorna senza perdere origine e data di creazione', async () => {
    const m = await aggiungiMovimento(spesa)
    await aggiornaMovimento(m.id, { ...spesa, importo: 999 })
    const dopo = await db.movimenti.get(m.id)
    expect(dopo).toMatchObject({ importo: 999, origine: 'manuale', creatoIl: m.creatoIl })
  })

  it('elimina restituendo il movimento, cosi "Annulla" puo ripristinarlo identico', async () => {
    const m = await aggiungiMovimento(spesa)
    const tolto = await eliminaMovimento(m.id)
    expect(tolto).toEqual(m)
    expect(await db.movimenti.count()).toBe(0)
    await ripristinaMovimento(tolto!)
    expect(await db.movimenti.get(m.id)).toEqual(m)
  })

  it('eliminare un id inesistente non lancia', async () => {
    expect(await eliminaMovimento('non-esiste')).toBeUndefined()
  })
})

describe('movimentiDelMese', () => {
  it('prende tutto il mese, anche il 30 e il 31', async () => {
    await aggiungiMovimento({ ...spesa, data: '2026-09-01' })
    await aggiungiMovimento({ ...spesa, data: '2026-09-30' })
    await aggiungiMovimento({ ...spesa, data: '2026-08-31' })
    await aggiungiMovimento({ ...spesa, data: '2026-10-01' })
    const lista = await movimentiDelMese('2026-09')
    expect(lista.map((m) => m.data)).toEqual(['2026-09-30', '2026-09-01'])

    await aggiungiMovimento({ ...spesa, data: '2026-07-31' })
    expect(await movimentiDelMese('2026-07')).toHaveLength(1)
  })

  it('ordina dal piu recente e, a parita di data, mette per primo l ultimo inserito', async () => {
    const primo = await aggiungiMovimento({ ...spesa, data: '2026-09-10', descrizione: 'primo' })
    // creatoIl ha la precisione del millisecondo: forziamo un ordine certo
    await db.movimenti.update(primo.id, { creatoIl: '2026-09-10T08:00:00.000Z' })
    const secondo = await aggiungiMovimento({ ...spesa, data: '2026-09-10', descrizione: 'secondo' })
    await db.movimenti.update(secondo.id, { creatoIl: '2026-09-10T09:00:00.000Z' })
    await aggiungiMovimento({ ...spesa, data: '2026-09-11', descrizione: 'giorno dopo' })

    const lista = await movimentiDelMese('2026-09')
    expect(lista.map((m) => m.descrizione)).toEqual(['giorno dopo', 'secondo', 'primo'])
  })
})

describe('cercaMovimenti', () => {
  it('trova in tutti i mesi, non solo in quello corrente', async () => {
    await aggiungiMovimento({ ...spesa, data: '2024-02-14', descrizione: 'Cena da Mario' })
    await aggiungiMovimento({ ...spesa, data: '2026-09-10', descrizione: 'Spesa Conad' })
    const trovati = await cercaMovimenti('mario')
    expect(trovati.map((m) => m.data)).toEqual(['2024-02-14'])
  })

  it('ignora maiuscole e accenti', async () => {
    await aggiungiMovimento({ ...spesa, descrizione: 'Caffe Centrale' })
    expect(await cercaMovimenti('CAFFE')).toHaveLength(1)
    expect(await cercaMovimenti('  centrale  ')).toHaveLength(1)
  })

  it('trova anche per nome di categoria, cosi un movimento senza descrizione non sparisce', async () => {
    await aggiungiMovimento({ ...spesa, categoriaId: 'svago', descrizione: undefined })
    expect(await cercaMovimenti('svago')).toHaveLength(0)
    expect(await cercaMovimenti('svago', ['svago'])).toHaveLength(1)
  })

  it('con testo vuoto non restituisce nulla', async () => {
    await aggiungiMovimento(spesa)
    expect(await cercaMovimenti('')).toEqual([])
    expect(await cercaMovimenti('   ')).toEqual([])
  })

  it('ordina dal piu recente e si ferma al limite', async () => {
    for (const data of ['2025-01-05', '2026-03-20', '2024-11-11']) {
      await aggiungiMovimento({ ...spesa, data, descrizione: 'bar' })
    }
    const tutti = await cercaMovimenti('bar')
    expect(tutti.map((m) => m.data)).toEqual(['2026-03-20', '2025-01-05', '2024-11-11'])
    expect(await cercaMovimenti('bar', [], 2)).toHaveLength(2)
  })
})

describe('categorie', () => {
  it('assegna un ordine crescente per tipo, ignorando quelle di sistema', async () => {
    const c = await aggiungiCategoria({ nome: 'Palestra', tipo: 'uscita', colore: 'c3', icona: 'dumbbell' })
    // le predefinite di uscita arrivano a 10; "Senza categoria" e 999 ma e di sistema
    expect(c.ordine).toBe(11)
  })

  it('toglie gli spazi dal nome', async () => {
    const c = await aggiungiCategoria({ nome: '  Palestra  ', tipo: 'uscita', colore: 'c3', icona: 'dumbbell' })
    expect(c.nome).toBe('Palestra')
    await aggiornaCategoria(c.id, { nome: '  Sport  ', colore: 'c3', icona: 'dumbbell' })
    expect((await db.categorie.get(c.id))?.nome).toBe('Sport')
  })

  it('senzaCategoria da la categoria di sistema del tipo giusto', () => {
    expect(senzaCategoria('uscita')).toBe(SENZA_CATEGORIA_USCITA)
    expect(senzaCategoria('entrata')).toBe(SENZA_CATEGORIA_ENTRATA)
  })

  it('conta i movimenti che la usano', async () => {
    await aggiungiMovimento(spesa)
    await aggiungiMovimento({ ...spesa, categoriaId: 'svago' })
    expect(await contaMovimentiCategoria('spesa')).toBe(1)
  })
})

describe('spostaCategoria', () => {
  const ordineUscite = async () =>
    (await db.categorie.where('tipo').equals('uscita').sortBy('ordine')).filter((c) => !c.diSistema).map((c) => c.id)

  it('sposta su scambiando con la precedente', async () => {
    const prima = await ordineUscite()
    await spostaCategoria(prima[3], 'su')
    const dopo = await ordineUscite()
    expect(dopo[2]).toBe(prima[3])
    expect(dopo[3]).toBe(prima[2])
    expect(dopo.slice(4)).toEqual(prima.slice(4))
  })

  it('sposta giu scambiando con la successiva', async () => {
    const prima = await ordineUscite()
    await spostaCategoria(prima[0], 'giu')
    const dopo = await ordineUscite()
    expect(dopo[0]).toBe(prima[1])
    expect(dopo[1]).toBe(prima[0])
  })

  it('agli estremi non fa nulla e non lancia', async () => {
    const prima = await ordineUscite()
    await spostaCategoria(prima[0], 'su')
    await spostaCategoria(prima[prima.length - 1], 'giu')
    expect(await ordineUscite()).toEqual(prima)
  })

  it('non mischia i tipi: spostare un uscita non tocca le entrate', async () => {
    const entratePrima = await db.categorie.where('tipo').equals('entrata').sortBy('ordine')
    const uscite = await ordineUscite()
    await spostaCategoria(uscite[1], 'su')
    const entrateDopo = await db.categorie.where('tipo').equals('entrata').sortBy('ordine')
    expect(entrateDopo.map((c) => c.id)).toEqual(entratePrima.map((c) => c.id))
  })

  it('rifiuta le categorie di sistema', async () => {
    await expect(spostaCategoria(SENZA_CATEGORIA_USCITA, 'su')).rejects.toThrow()
  })

  it('lascia "Senza categoria" in fondo', async () => {
    const uscite = await ordineUscite()
    await spostaCategoria(uscite[uscite.length - 1], 'giu')
    const tutte = await db.categorie.where('tipo').equals('uscita').sortBy('ordine')
    expect(tutte[tutte.length - 1].id).toBe(SENZA_CATEGORIA_USCITA)
  })
})

describe('eliminaCategoria', () => {
  it('sposta movimenti e regole sulla destinazione, poi elimina', async () => {
    const m = await aggiungiMovimento(spesa)
    const r = await aggiungiRegola('conad', 'spesa')
    await eliminaCategoria('spesa', 'svago')

    expect(await db.categorie.get('spesa')).toBeUndefined()
    expect((await db.movimenti.get(m.id))?.categoriaId).toBe('svago')
    expect((await db.regole.get(r.id))?.categoriaId).toBe('svago')
  })

  it('rifiuta le categorie di sistema senza toccare nulla', async () => {
    const m = await aggiungiMovimento({ ...spesa, categoriaId: SENZA_CATEGORIA_USCITA })
    await expect(eliminaCategoria(SENZA_CATEGORIA_USCITA, 'spesa')).rejects.toThrow()
    expect(await db.categorie.get(SENZA_CATEGORIA_USCITA)).toBeDefined()
    expect((await db.movimenti.get(m.id))?.categoriaId).toBe(SENZA_CATEGORIA_USCITA)
  })

  it('rifiuta una categoria inesistente', async () => {
    await expect(eliminaCategoria('non-esiste', 'spesa')).rejects.toThrow()
  })
})

describe('regole', () => {
  it('assegna priorita crescenti e toglie gli spazi', async () => {
    const a = await aggiungiRegola('  conad  ', 'spesa')
    const b = await aggiungiRegola('esselunga', 'spesa')
    expect(a.contiene).toBe('conad')
    expect(b.priorita).toBeGreaterThan(a.priorita)
  })

  it('esisteRegola ignora maiuscole e spazi', async () => {
    await aggiungiRegola('Conad', 'spesa')
    expect(await esisteRegola('  conad ')).toBe(true)
    expect(await esisteRegola('esselunga')).toBe(false)
  })

  it('aggiorna ed elimina', async () => {
    const r = await aggiungiRegola('conad', 'spesa')
    await aggiornaRegola(r.id, 'esselunga', 'svago')
    expect(await db.regole.get(r.id)).toMatchObject({ contiene: 'esselunga', categoriaId: 'svago' })
    await eliminaRegola(r.id)
    expect(await db.regole.get(r.id)).toBeUndefined()
  })
})

describe('aggiungiRegole (in blocco, dall importazione)', () => {
  it('crea solo quelle che non esistono gia', async () => {
    await aggiungiRegola('conad', 'spesa')
    const create = await aggiungiRegole([
      { contiene: 'Conad', categoriaId: 'svago' },
      { contiene: 'esselunga', categoriaId: 'spesa' },
    ])
    expect(create).toBe(1)
    expect(await db.regole.count()).toBe(2)
    const conad = (await db.regole.toArray()).find((r) => r.contiene === 'conad')
    expect(conad?.categoriaId).toBe('spesa')
  })

  it('salta i doppioni dentro lo stesso file', async () => {
    const create = await aggiungiRegole([
      { contiene: 'conad', categoriaId: 'spesa' },
      { contiene: '  CONAD  ', categoriaId: 'svago' },
    ])
    expect(create).toBe(1)
  })

  it('salta i testi vuoti', async () => {
    expect(await aggiungiRegole([{ contiene: '   ', categoriaId: 'spesa' }])).toBe(0)
    expect(await db.regole.count()).toBe(0)
  })

  it('assegna priorita crescenti che continuano da quelle esistenti', async () => {
    const prima = await aggiungiRegola('conad', 'spesa')
    await aggiungiRegole([
      { contiene: 'esselunga', categoriaId: 'spesa' },
      { contiene: 'coop', categoriaId: 'spesa' },
    ])
    const tutte = await db.regole.orderBy('priorita').toArray()
    expect(tutte.map((r) => r.contiene)).toEqual(['conad', 'esselunga', 'coop'])
    expect(tutte[1].priorita).toBeGreaterThan(prima.priorita)
  })

  it('con un elenco vuoto non fa nulla', async () => {
    expect(await aggiungiRegole([])).toBe(0)
  })
})

describe('backup', () => {
  it('contiene tutto e registra la data dell ultimo backup', async () => {
    await aggiungiMovimento(spesa)
    await aggiungiRegola('conad', 'spesa')
    expect(await dataUltimoBackup()).toBeNull()

    const b = await creaBackup()
    expect(b.app).toBe('spese')
    expect(b.movimenti).toHaveLength(1)
    expect(b.regole).toHaveLength(1)
    expect(b.categorie).toHaveLength(CATEGORIE_PREDEFINITE.length)
    expect(await dataUltimoBackup()).toBe(b.esportatoIl)
  })

  it('rifiuta i file che non sono backup di quest app', () => {
    expect(() => leggiBackup('non json')).toThrow(/JSON/)
    expect(() => leggiBackup('{"app":"altro"}')).toThrow()
    expect(() => leggiBackup(JSON.stringify({ app: 'spese', versione: 2, categorie: [], movimenti: [] }))).toThrow()
  })

  it('rifiuta i movimenti malformati invece di importarli a meta', () => {
    const rotto = {
      app: 'spese',
      versione: 1,
      categorie: [],
      movimenti: [{ id: 'x', importo: 12.5, data: '2026-09-01', categoriaId: 'spesa' }],
    }
    expect(() => leggiBackup(JSON.stringify(rotto))).toThrow(/formato non riconosciuto/)
  })

  it('accetta un backup vecchio senza regole', () => {
    const b = leggiBackup(JSON.stringify({ app: 'spese', versione: 1, categorie: [], movimenti: [] }))
    expect(b.regole).toEqual([])
  })

  it('sostituisce tutti i dati e riporta sempre le "Senza categoria"', async () => {
    await aggiungiMovimento(spesa)
    const b = leggiBackup(
      JSON.stringify({
        app: 'spese',
        versione: 1,
        esportatoIl: '2026-08-01T00:00:00.000Z',
        categorie: [{ id: 'viaggi', nome: 'Viaggi', tipo: 'uscita', colore: 'c1', icona: 'plane', ordine: 1 }],
        movimenti: [
          {
            id: 'v1',
            tipo: 'uscita',
            importo: 5000,
            categoriaId: 'viaggi',
            data: '2026-08-05',
            creatoIl: '2026-08-05T10:00:00.000Z',
          },
        ],
        regole: [],
      }),
    )
    await ripristinaBackup(b)

    const movimenti = await db.movimenti.toArray()
    expect(movimenti).toHaveLength(1)
    expect(movimenti[0].id).toBe('v1')
    expect(await db.categorie.get('spesa')).toBeUndefined()
    expect(await db.categorie.get('viaggi')).toBeDefined()
    expect(await db.categorie.get(SENZA_CATEGORIA_USCITA)).toBeDefined()
    expect(await db.categorie.get(SENZA_CATEGORIA_ENTRATA)).toBeDefined()
  })

  it('un ripristino fallito non lascia il database mezzo vuoto', async () => {
    await aggiungiMovimento(spesa)
    const prima = await db.movimenti.count()
    // due movimenti con lo stesso id: bulkAdd fallisce e la transazione torna indietro
    const doppio: Backup = {
      app: 'spese',
      versione: 1,
      esportatoIl: '2026-08-01T00:00:00.000Z',
      categorie: [],
      movimenti: [
        {
          id: 'uguale',
          tipo: 'uscita',
          importo: 100,
          categoriaId: 'spesa',
          data: '2026-08-01',
          creatoIl: '2026-08-01T00:00:00.000Z',
        },
        {
          id: 'uguale',
          tipo: 'uscita',
          importo: 200,
          categoriaId: 'spesa',
          data: '2026-08-02',
          creatoIl: '2026-08-02T00:00:00.000Z',
        },
      ],
      regole: [],
    }
    await expect(ripristinaBackup(doppio)).rejects.toThrow()
    expect(await db.movimenti.count()).toBe(prima)
  })
})

describe('importazione', () => {
  it('chiaviEsistenti riconosce un movimento gia presente, a prescindere da maiuscole e accenti', async () => {
    await aggiungiMovimento({ ...spesa, descrizione: 'Caffe  Centrale' })
    const chiavi = await chiaviEsistenti()
    expect(chiavi.has('2026-09-10|uscita|1250|caffe centrale')).toBe(true)
  })

  it('importa segnando origine "import"', async () => {
    const n = await importaMovimenti([
      { data: '2026-09-01', importo: 500, tipo: 'uscita', descrizione: 'Bar', categoriaId: 'spesa' },
      { data: '2026-09-02', importo: 700, tipo: 'entrata', descrizione: '', categoriaId: 'stipendio' },
    ])
    expect(n).toBe(2)
    const tutti = await db.movimenti.toArray()
    expect(tutti.every((m) => m.origine === 'import')).toBe(true)
    expect(tutti.find((m) => m.tipo === 'entrata')?.descrizione).toBeUndefined()
  })

  it('ricorda la mappatura per firma del formato', async () => {
    expect(await mappaturaRicordata('a|b|c')).toBeUndefined()
    const m = { data: 0, importo: 1, descrizione: 2, tipo: { modo: 'tutteUscite' as const }, decimale: ',' as const }
    await ricordaMappatura('a|b|c', m)
    expect(await mappaturaRicordata('a|b|c')).toEqual(m)
    expect(await mappaturaRicordata('x|y')).toBeUndefined()
  })
})
