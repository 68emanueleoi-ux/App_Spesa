import { describe, expect, it } from 'vitest'
import { analizzaCsv, firmaCsv, interpretaRighe, proponiMappatura } from '../csv'

const POSTEPAY = `Data;Descrizione;Importo
22/09/2026;PAGAMENTO POS CONAD SUPERSTORE;-43,20
21/09/2026;PAGAMENTO POS TRENITALIA;-12,90
20/09/2026;RICARICA DA CONTO;1.500,00
`

const BANCA_DUE_COLONNE = `Data operazione,Causale,Uscite,Entrate
2026-09-03,Affitto settembre,400.00,
2026-09-20,Stipendio,,1500.00
`

describe('analizzaCsv', () => {
  it('riconosce separatore e intestazione', () => {
    const t = analizzaCsv(POSTEPAY)
    expect(t.delimitatore).toBe(';')
    expect(t.intestazioni).toEqual(['Data', 'Descrizione', 'Importo'])
    expect(t.righe).toHaveLength(3)
    expect(t.righe[0]).toEqual(['22/09/2026', 'PAGAMENTO POS CONAD SUPERSTORE', '-43,20'])
  })
  it('gestisce file senza intestazione e BOM', () => {
    const t = analizzaCsv('﻿22/09/2026;Conad;-43,20\n21/09/2026;Bar;-2,40\n')
    expect(t.intestazioni).toEqual(['Colonna 1', 'Colonna 2', 'Colonna 3'])
    expect(t.righe).toHaveLength(2)
  })
  it('ignora righe vuote e allinea righe corte', () => {
    const t = analizzaCsv('a,b,c\n1,2\n\n3,4,5\n')
    expect(t.righe).toEqual([
      ['1', '2', ''],
      ['3', '4', '5'],
    ])
  })
})

describe('proponiMappatura', () => {
  it('mappa un export in stile Postepay dal nome delle colonne', () => {
    const m = proponiMappatura(analizzaCsv(POSTEPAY))
    expect(m).toMatchObject({ data: 0, descrizione: 1, importo: 2, tipo: { modo: 'segno', invertito: false } })
  })
  it('mappa un export con colonne separate per uscite ed entrate', () => {
    const m = proponiMappatura(analizzaCsv(BANCA_DUE_COLONNE))
    expect(m).toMatchObject({ data: 0, descrizione: 1, importo: 2, tipo: { modo: 'dueColonne', colonnaEntrate: 3 } })
  })
  it('senza intestazione indovina dal contenuto', () => {
    const m = proponiMappatura(analizzaCsv('22/09/2026;Conad;-43,20\n21/09/2026;Trenitalia;-12,90\n'))
    expect(m).toMatchObject({ data: 0, descrizione: 1, importo: 2 })
  })
  it('se gli importi sono tutti positivi propone "tutte uscite"', () => {
    const m = proponiMappatura(analizzaCsv('data;esercente;importo\n22/09/2026;Conad;43,20\n21/09/2026;Bar;2,40\n'))
    expect(m.tipo).toEqual({ modo: 'tutteUscite' })
  })
})

describe('interpretaRighe', () => {
  it('converte le righe in movimenti con importi in centesimi', () => {
    const t = analizzaCsv(POSTEPAY)
    const { valide, scartate } = interpretaRighe(t.righe, proponiMappatura(t))
    expect(scartate).toEqual([])
    expect(valide).toEqual([
      { indice: 0, data: '2026-09-22', importo: 4320, tipo: 'uscita', descrizione: 'PAGAMENTO POS CONAD SUPERSTORE' },
      { indice: 1, data: '2026-09-21', importo: 1290, tipo: 'uscita', descrizione: 'PAGAMENTO POS TRENITALIA' },
      { indice: 2, data: '2026-09-20', importo: 150000, tipo: 'entrata', descrizione: 'RICARICA DA CONTO' },
    ])
  })
  it('gestisce le due colonne uscite/entrate', () => {
    const t = analizzaCsv(BANCA_DUE_COLONNE)
    const { valide } = interpretaRighe(t.righe, proponiMappatura(t))
    expect(valide.map((v) => [v.tipo, v.importo])).toEqual([
      ['uscita', 40000],
      ['entrata', 150000],
    ])
  })
  it('scarta righe con data o importo illeggibili, spiegando perché', () => {
    const t = analizzaCsv('Data;Descrizione;Importo\nieri;Bar;-2,40\n22/09/2026;Conad;boh\n22/09/2026;Ok;-1,00\n')
    const { valide, scartate } = interpretaRighe(t.righe, proponiMappatura(t))
    expect(valide).toHaveLength(1)
    expect(scartate.map((s) => s.indice)).toEqual([0, 1])
    expect(scartate[0].motivo).toContain('Data')
    expect(scartate[1].motivo).toContain('Importo')
  })
  it('rispetta il segno invertito e la colonna tipo', () => {
    const righe = [['22/09/2026', 'Conad', '43,20', 'Uscita'], ['20/09/2026', 'Stipendio', '1500', 'Entrata']]
    const base = { data: 0, descrizione: 1, importo: 2, decimale: 'auto' as const }
    const perColonna = interpretaRighe(righe, { ...base, tipo: { modo: 'colonna', colonna: 3, valoreEntrata: 'entrata' } })
    expect(perColonna.valide.map((v) => v.tipo)).toEqual(['uscita', 'entrata'])
    const invertito = interpretaRighe(righe, { ...base, tipo: { modo: 'segno', invertito: true } })
    expect(invertito.valide.map((v) => v.tipo)).toEqual(['uscita', 'uscita'])
  })
})

describe('firmaCsv', () => {
  it('è la stessa a prescindere da maiuscole e accenti', () => {
    expect(firmaCsv(['Data', 'Descrizione', 'Importo'])).toBe(firmaCsv(['DATA', 'descrizione', 'Importo']))
  })
})
