import { describe, expect, it } from 'vitest'
import {
  formatDataBreve,
  formatDataBreveConAnno,
  formatDataLunga,
  formatDataNumerica,
  formatMese,
  giorniNelMese,
  giornoDi,
  meseCorrente,
  meseDi,
  mesePrecedente,
  meseSuccessivo,
  nomeMese,
  oggiIso,
  parseData,
} from '../date'
import { contiene, normalizza, testoPerRegola } from '../testo'

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

  it('rifiuta i giorni che non esistono in quel mese', () => {
    expect(parseData('31/02/2026')).toBeNull()
    expect(parseData('31/04/2026')).toBeNull()
    expect(parseData('29/02/2026')).toBeNull() // 2026 non e' bisestile
    expect(parseData('29/02/2028')).toBe('2028-02-29') // 2028 si
  })

  it('accetta giorno e mese a una cifra', () => {
    expect(parseData('1/2/2026')).toBe('2026-02-01')
    expect(parseData('2026-1-2')).toBe('2026-01-02')
  })

  it('accetta le barre anche con l anno davanti', () => {
    expect(parseData('2026/09/22')).toBe('2026-09-22')
  })

  it('interpreta l anno a due cifre come fa il resto del mondo', () => {
    expect(parseData('01/01/00')).toBe('2000-01-01')
    expect(parseData('01/01/68')).toBe('2068-01-01')
    expect(parseData('01/01/69')).toBeNull() // 1969: prima del 1970, rifiutata
  })

  it('rifiuta testo che assomiglia a una data ma non lo e', () => {
    expect(parseData('22/09')).toBeNull()
    expect(parseData('2026')).toBeNull()
    expect(parseData('22-09-2026-11')).toBeNull()
    expect(parseData('00/09/2026')).toBeNull()
  })

  it('non slitta di un giorno per via del fuso orario', () => {
    // con il parsing UTC, a ovest di Greenwich il primo del mese diventerebbe l ultimo del mese prima
    expect(formatDataNumerica('2026-01-01')).toBe('01/01/2026')
    expect(giornoDi('2026-01-01')).toBe(1)
    expect(parseData('2026-01-01')).toBe('2026-01-01')
  })

  it('formatta le altre varianti di data', () => {
    expect(formatDataNumerica('2026-09-22')).toBe('22/09/2026')
    expect(formatDataBreveConAnno('2026-09-22')).toBe('22 set 2026')
    expect(nomeMese('2026-09')).toBe('settembre')
    expect(formatMese('2026-01')).toBe('Gennaio 2026')
    expect(formatDataLunga('2026-01-01')).toBe('Giovedì 1 gennaio')
  })

  it('oggiIso e meseCorrente sono coerenti fra loro', () => {
    expect(oggiIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(meseCorrente()).toBe(oggiIso().slice(0, 7))
  })

  it('naviga i mesi avanti e indietro tornando al punto di partenza', () => {
    for (const m of ['2026-01', '2026-02', '2026-12', '2028-02']) {
      expect(meseSuccessivo(mesePrecedente(m))).toBe(m)
    }
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

describe('testoPerRegola', () => {
  it('toglie i prefissi bancari e i numeri, tiene al massimo due parole', () => {
    expect(testoPerRegola('PAGAMENTO POS CONAD SUPERSTORE ROMA')).toBe('conad superstore')
    expect(testoPerRegola('Addebito diretto SDD TIM 12/09')).toBe('tim')
    expect(testoPerRegola('Trenitalia')).toBe('trenitalia')
    expect(testoPerRegola('PAGAMENTO POS 22/09/26 AMAZON EU')).toBe('amazon eu')
  })
})
