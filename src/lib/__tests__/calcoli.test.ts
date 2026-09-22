import { describe, expect, it } from 'vitest'
import type { Movimento, RegolaCategoria } from '@/db/tipi'
import {
  applicaRegole,
  mediaUscitePerCategoria,
  mesiPrecedenti,
  statoBudget,
  chiaveDuplicato,
  confrontoConMesePrecedente,
  cumulataUscite,
  ripartizioneUscite,
  totali,
} from '../calcoli'

let contatore = 0
function mov(p: Partial<Movimento> & { importo: number }): Movimento {
  contatore += 1
  return {
    id: `m${contatore}`,
    tipo: 'uscita',
    categoriaId: 'spesa',
    data: '2026-09-10',
    creatoIl: '2026-09-10T10:00:00Z',
    ...p,
  }
}

describe('totali', () => {
  it('somma entrate e uscite e calcola il saldo', () => {
    const t = totali([
      mov({ tipo: 'entrata', importo: 150000 }),
      mov({ importo: 4320 }),
      mov({ importo: 1290 }),
    ])
    expect(t).toEqual({ entrate: 150000, uscite: 5610, saldo: 144390 })
  })
  it('con lista vuota è tutto zero', () => {
    expect(totali([])).toEqual({ entrate: 0, uscite: 0, saldo: 0 })
  })
  it('il saldo può essere negativo', () => {
    expect(totali([mov({ importo: 100 })]).saldo).toBe(-100)
  })
})

describe('ripartizioneUscite', () => {
  it('ordina per importo decrescente e ignora le entrate', () => {
    const r = ripartizioneUscite([
      mov({ categoriaId: 'svago', importo: 100 }),
      mov({ categoriaId: 'spesa', importo: 300 }),
      mov({ tipo: 'entrata', categoriaId: 'stipendio', importo: 9999 }),
      mov({ categoriaId: 'spesa', importo: 100 }),
    ])
    expect(r.map((q) => q.categoriaId)).toEqual(['spesa', 'svago'])
    expect(r[0].importo).toBe(400)
    expect(r[0].percentuale).toBe(80)
    expect(r[1].percentuale).toBe(20)
  })
  it('le percentuali sommano sempre a 100', () => {
    const r = ripartizioneUscite([
      mov({ categoriaId: 'a', importo: 100 }),
      mov({ categoriaId: 'b', importo: 100 }),
      mov({ categoriaId: 'c', importo: 100 }),
    ])
    expect(r.reduce((s, q) => s + q.percentuale, 0)).toBe(100)
    expect(r.map((q) => q.percentuale).sort()).toEqual([33, 33, 34])
  })
  it('senza uscite restituisce lista vuota', () => {
    expect(ripartizioneUscite([mov({ tipo: 'entrata', importo: 10 })])).toEqual([])
  })
})

describe('cumulataUscite', () => {
  it('accumula giorno per giorno', () => {
    const c = cumulataUscite(
      [mov({ data: '2026-09-01', importo: 100 }), mov({ data: '2026-09-03', importo: 50 })],
      '2026-09',
    )
    expect(c).toHaveLength(30)
    expect(c.slice(0, 4)).toEqual([100, 100, 150, 150])
    expect(c[29]).toBe(150)
  })
  it('si ferma al giorno indicato per il mese in corso', () => {
    const c = cumulataUscite([mov({ data: '2026-09-05', importo: 100 })], '2026-09', 3)
    expect(c).toEqual([0, 0, 0])
  })
  it('ignora movimenti di altri mesi e le entrate', () => {
    const c = cumulataUscite(
      [mov({ data: '2026-08-31', importo: 100 }), mov({ data: '2026-09-02', tipo: 'entrata', importo: 100 })],
      '2026-09',
    )
    expect(c.every((v) => v === 0)).toBe(true)
  })
})

describe('confrontoConMesePrecedente', () => {
  it('restituisce null se il mese precedente è vuoto (la UI mostra "—", mai NaN)', () => {
    expect(confrontoConMesePrecedente([mov({ importo: 100 })], [], '2026-08')).toBeNull()
  })
  it('calcola differenza e percentuale', () => {
    const c = confrontoConMesePrecedente(
      [mov({ importo: 12000 })],
      [mov({ data: '2026-08-10', importo: 10000 })],
      '2026-08',
    )
    expect(c).toEqual({ differenza: 2000, percentuale: 20, stessoGiorno: null })
  })
  it('percentuale null se il mese precedente ha solo entrate', () => {
    const c = confrontoConMesePrecedente(
      [mov({ importo: 100 })],
      [mov({ data: '2026-08-10', tipo: 'entrata', importo: 100 })],
      '2026-08',
    )
    expect(c?.percentuale).toBeNull()
    expect(c?.differenza).toBe(100)
  })
  it('confronta allo stesso giorno del mese', () => {
    const c = confrontoConMesePrecedente(
      [mov({ data: '2026-09-22', importo: 128430 })],
      [mov({ data: '2026-08-05', importo: 138040 }), mov({ data: '2026-08-30', importo: 34500 })],
      '2026-08',
      22,
    )
    expect(c?.stessoGiorno).toEqual({ precedente: 138040, differenza: -9610 })
    expect(c?.differenza).toBe(128430 - 172540)
  })
})

describe('applicaRegole', () => {
  const regole: RegolaCategoria[] = [
    { id: 'r2', contiene: 'conad', categoriaId: 'spesa', priorita: 2 },
    { id: 'r1', contiene: 'conad city', categoriaId: 'ristoranti', priorita: 1 },
    { id: 'r3', contiene: 'trenitalia', categoriaId: 'trasporti', priorita: 3 },
  ]
  it('trova la categoria ignorando maiuscole e accenti', () => {
    expect(applicaRegole('TRENITALIA SPA', regole)).toBe('trasporti')
    expect(applicaRegole('Pagamento Trenìtalia', regole)).toBe('trasporti')
  })
  it('rispetta la priorità', () => {
    expect(applicaRegole('CONAD CITY ROMA', regole)).toBe('ristoranti')
    expect(applicaRegole('CONAD SUPERSTORE', regole)).toBe('spesa')
  })
  it('null se nessuna regola corrisponde o la descrizione manca', () => {
    expect(applicaRegole('Amazon', regole)).toBeNull()
    expect(applicaRegole(undefined, regole)).toBeNull()
    expect(applicaRegole('Conad', [{ id: 'x', contiene: '   ', categoriaId: 'a', priorita: 0 }])).toBeNull()
  })
})

describe('chiaveDuplicato', () => {
  it('è uguale per movimenti con stessa data, tipo, importo e descrizione (a meno di maiuscole/accenti)', () => {
    const a = chiaveDuplicato({ data: '2026-09-10', tipo: 'uscita', importo: 1250, descrizione: 'Caffè Centrale' })
    const b = chiaveDuplicato({ data: '2026-09-10', tipo: 'uscita', importo: 1250, descrizione: 'caffe  centrale ' })
    expect(a).toBe(b)
  })
  it('cambia se cambia uno dei campi', () => {
    const base = { data: '2026-09-10', tipo: 'uscita' as const, importo: 1250, descrizione: 'x' }
    expect(chiaveDuplicato(base)).not.toBe(chiaveDuplicato({ ...base, importo: 1251 }))
    expect(chiaveDuplicato(base)).not.toBe(chiaveDuplicato({ ...base, data: '2026-09-11' }))
    expect(chiaveDuplicato(base)).not.toBe(chiaveDuplicato({ ...base, tipo: 'entrata' }))
  })
})


describe('statoBudget', () => {
  const cat = (id: string, budget?: number) => ({ id, budget })

  it('considera solo le categorie con un tetto maggiore di zero', () => {
    const r = statoBudget([mov({ importo: 1000 })], [cat('spesa', 5000), cat('svago'), cat('casa', 0)], '2026-09')
    expect(r.voci.map((v) => v.categoriaId)).toEqual(['spesa'])
  })

  it('calcola speso, percentuale e residuo', () => {
    const r = statoBudget(
      [mov({ importo: 3000, categoriaId: 'spesa' }), mov({ importo: 1000, categoriaId: 'spesa' })],
      [cat('spesa', 20000)],
      '2026-09',
    )
    expect(r.voci[0]).toMatchObject({ speso: 4000, budget: 20000, percentuale: 20, residuo: 16000 })
  })

  it('ignora le entrate', () => {
    const r = statoBudget(
      [mov({ importo: 9000, categoriaId: 'spesa', tipo: 'entrata' })],
      [cat('spesa', 10000)],
      '2026-09',
    )
    expect(r.voci[0].speso).toBe(0)
  })

  it('segnala le categorie sforate con residuo negativo', () => {
    const r = statoBudget(
      [mov({ importo: 12000, categoriaId: 'spesa' }), mov({ importo: 500, categoriaId: 'svago' })],
      [cat('spesa', 10000), cat('svago', 10000)],
      '2026-09',
    )
    expect(r.sforate).toBe(1)
    expect(r.voci[0]).toMatchObject({ categoriaId: 'spesa', percentuale: 120, residuo: -2000 })
  })

  it('ordina dalla piu consumata', () => {
    const r = statoBudget(
      [mov({ importo: 1000, categoriaId: 'spesa' }), mov({ importo: 9000, categoriaId: 'svago' })],
      [cat('spesa', 10000), cat('svago', 10000)],
      '2026-09',
    )
    expect(r.voci.map((v) => v.categoriaId)).toEqual(['svago', 'spesa'])
  })

  it('somma i totali dei soli budget sorvegliati', () => {
    const r = statoBudget(
      [mov({ importo: 1000, categoriaId: 'spesa' }), mov({ importo: 7000, categoriaId: 'senza-tetto' })],
      [cat('spesa', 10000), cat('svago', 5000), cat('senza-tetto')],
      '2026-09',
    )
    expect(r.budgetTotale).toBe(15000)
    expect(r.spesoTotale).toBe(1000)
  })

  it('dice quanta parte del mese e trascorsa, per giudicare il ritmo', () => {
    expect(statoBudget([], [], '2026-09', 15).attesoOggi).toBe(50) // 15 di 30
    expect(statoBudget([], [], '2026-02', 14).attesoOggi).toBe(50) // 14 di 28
    expect(statoBudget([], [], '2026-09').attesoOggi).toBeNull() // mese concluso
  })
})


describe('mesiPrecedenti', () => {
  it('elenca i mesi prima di quello dato, dal piu lontano', () => {
    expect(mesiPrecedenti('2026-09', 3)).toEqual(['2026-06', '2026-07', '2026-08'])
  })

  it('scavalca il capodanno', () => {
    expect(mesiPrecedenti('2026-02', 3)).toEqual(['2025-11', '2025-12', '2026-01'])
  })

  it('con zero mesi non restituisce nulla', () => {
    expect(mesiPrecedenti('2026-09', 0)).toEqual([])
  })
})

describe('mediaUscitePerCategoria', () => {
  const mesi = ['2026-06', '2026-07', '2026-08']

  it('divide per i mesi con dati, non per quanti ne abbiamo chiesti', () => {
    // un solo mese di storico: la media e' quel mese, non un terzo
    const m = mediaUscitePerCategoria([mov({ importo: 30000, data: '2026-08-05' })], mesi)
    expect(m.get('spesa')).toBe(30000)
  })

  it('fa la media sui mesi effettivamente usati', () => {
    const m = mediaUscitePerCategoria(
      [
        mov({ importo: 10000, data: '2026-06-05' }),
        mov({ importo: 20000, data: '2026-07-05' }),
        mov({ importo: 30000, data: '2026-08-05' }),
      ],
      mesi,
    )
    expect(m.get('spesa')).toBe(20000)
  })

  it('ignora i mesi fuori intervallo', () => {
    const m = mediaUscitePerCategoria(
      [mov({ importo: 10000, data: '2026-08-05' }), mov({ importo: 99900, data: '2026-09-05' })],
      mesi,
    )
    expect(m.get('spesa')).toBe(10000)
  })

  it('ignora le entrate ma il loro mese conta come mese usato', () => {
    const m = mediaUscitePerCategoria(
      [
        mov({ importo: 10000, data: '2026-07-05' }),
        mov({ importo: 50000, data: '2026-08-05', tipo: 'entrata', categoriaId: 'stipendio' }),
      ],
      mesi,
    )
    expect(m.get('stipendio')).toBeUndefined()
    expect(m.get('spesa')).toBe(5000) // 10000 su due mesi con movimenti
  })

  it('tiene le categorie separate', () => {
    const m = mediaUscitePerCategoria(
      [
        mov({ importo: 10000, data: '2026-07-05', categoriaId: 'spesa' }),
        mov({ importo: 6000, data: '2026-07-06', categoriaId: 'svago' }),
      ],
      mesi,
    )
    expect(m.get('spesa')).toBe(10000)
    expect(m.get('svago')).toBe(6000)
  })

  it('senza storico restituisce una mappa vuota', () => {
    expect(mediaUscitePerCategoria([], mesi).size).toBe(0)
    expect(mediaUscitePerCategoria([mov({ importo: 100, data: '2026-09-05' })], mesi).size).toBe(0)
  })
})
