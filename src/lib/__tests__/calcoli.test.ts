import { describe, expect, it } from 'vitest'
import type { Movimento, RegolaCategoria } from '@/db/tipi'
import {
  applicaRegole,
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
