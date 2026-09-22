import { describe, expect, it } from 'vitest'
import {
  formatDataBreve,
  formatDataLunga,
  formatMese,
  giorniNelMese,
  meseDi,
  mesePrecedente,
  meseSuccessivo,
  parseData,
} from '../date'
import { contiene, normalizza } from '../testo'

describe('date', () => {
  it('naviga tra i mesi anche a cavallo dell\'anno', () => {
    expect(mesePrecedente('2026-01')).toBe('2025-12')
    expect(meseSuccessivo('2025-12')).toBe('2026-01')
    expect(mesePrecedente('2026-03')).toBe('2026-02')
  })
  it('conosce i giorni del mese, bisestili inclusi', () => {
    expect(giorniNelMese('2026-02')).toBe(28)
    expect(giorniNelMese('2028-02')).toBe(29)
    expect(giorniNelMese('2026-09')).toBe(30)
  })
  it('formatta in italiano', () => {
    expect(formatMese('2026-09')).toBe('Settembre 2026')
    expect(formatDataBreve('2026-09-22')).toBe('22 set')
    expect(formatDataLunga('2026-09-22')).toBe('Martedì 22 settembre')
    expect(meseDi('2026-09-22')).toBe('2026-09')
  })
  it('riconosce vari formati di data', () => {
    expect(parseData('22/09/2026')).toBe('2026-09-22')
    expect(parseData('22-09-2026')).toBe('2026-09-22')
    expect(parseData('22.09.26')).toBe('2026-09-22')
    expect(parseData('2026-09-22')).toBe('2026-09-22')
    expect(parseData('2026-09-22T14:30:00')).toBe('2026-09-22')
    expect(parseData(' 01/02/2026 ')).toBe('2026-02-01')
  })
  it('rifiuta date non valide', () => {
    expect(parseData('32/13/2026')).toBeNull()
    expect(parseData('ieri')).toBeNull()
    expect(parseData('')).toBeNull()
  })
})

describe('testo', () => {
  it('normalizza maiuscole, accenti e spazi', () => {
    expect(normalizza('  Caffè   Centrale ')).toBe('caffe centrale')
    expect(normalizza('PERÙ')).toBe('peru')
  })
  it('contiene ignora maiuscole e accenti', () => {
    expect(contiene('Caffè Centrale', 'caffe')).toBe(true)
    expect(contiene('Caffè Centrale', 'CENTR')).toBe(true)
    expect(contiene('Caffè Centrale', 'bar')).toBe(false)
    expect(contiene('qualsiasi', '')).toBe(true)
  })
})
