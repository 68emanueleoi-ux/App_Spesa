import { describe, expect, it } from 'vitest'
import { interpretaRighe, proponiMappatura } from '../csv'
import { cellaInTesto, righeExcelInTabella } from '../excel'

describe('excel', () => {
  it('converte date e numeri di Excel in testo leggibile dall\'import', () => {
    expect(cellaInTesto(new Date(2026, 8, 22))).toBe('22/09/2026')
    expect(cellaInTesto(-43.2)).toBe('-43,20')
    expect(cellaInTesto(1500)).toBe('1500')
    expect(cellaInTesto(12.345)).toBe('12,35')
    expect(cellaInTesto(null)).toBe('')
    expect(cellaInTesto(' Conad ')).toBe('Conad')
  })
  it('un foglio Excel passa dalla stessa procedura del CSV', () => {
    const t = righeExcelInTabella([
      ['Data', 'Descrizione', 'Importo'],
      [new Date(2026, 8, 22), 'PAGAMENTO POS CONAD', -43.2],
      [new Date(2026, 8, 20), 'RICARICA', 1500],
    ])
    expect(t.intestazioni).toEqual(['Data', 'Descrizione', 'Importo'])
    const { valide, scartate } = interpretaRighe(t.righe, proponiMappatura(t))
    expect(scartate).toEqual([])
    expect(valide.map((v) => [v.data, v.tipo, v.importo])).toEqual([
      ['2026-09-22', 'uscita', 4320],
      ['2026-09-20', 'entrata', 150000],
    ])
  })
})
