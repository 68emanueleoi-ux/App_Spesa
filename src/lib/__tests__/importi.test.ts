import { describe, expect, it } from 'vitest'
import { centesimiInInput, formatImporto, formatImportoMovimento, parseImporto } from '../importi'

describe('parseImporto', () => {
  it('accetta la virgola come decimale', () => {
    expect(parseImporto('12,50')).toBe(1250)
    expect(parseImporto('0,05')).toBe(5)
    expect(parseImporto(',5')).toBe(50)
  })
  it('accetta il punto come decimale', () => {
    expect(parseImporto('12.50')).toBe(1250)
    expect(parseImporto('3.5')).toBe(350)
    expect(parseImporto('12.5')).toBe(1250)
  })
  it('riconosce il punto delle migliaia', () => {
    expect(parseImporto('1.234')).toBe(123400)
    expect(parseImporto('1.234,56')).toBe(123456)
    expect(parseImporto('1.234.567,89')).toBe(123456789)
  })
  it('riconosce la virgola delle migliaia (formato anglosassone)', () => {
    expect(parseImporto('1,234.56')).toBe(123456)
  })
  it('ignora simbolo euro e spazi', () => {
    expect(parseImporto('€ 1.234,56')).toBe(123456)
    expect(parseImporto(' 12 ')).toBe(1200)
    expect(parseImporto('12,50 €')).toBe(1250)
  })
  it('gestisce il segno', () => {
    expect(parseImporto('-12,50')).toBe(-1250)
    expect(parseImporto('+12,50')).toBe(1250)
    expect(parseImporto('−12,50')).toBe(-1250) // meno tipografico
  })
  it('arrotonda alla seconda cifra decimale', () => {
    expect(parseImporto('12,345')).toBe(1235)
    expect(parseImporto('12,344')).toBe(1234)
    expect(parseImporto('0,999')).toBe(100)
  })
  it('accetta un separatore decimale esplicito', () => {
    expect(parseImporto('1,234', '.')).toBe(123400)
    expect(parseImporto('1.234', ',')).toBe(123400)
    expect(parseImporto('12.50', ',')).toBe(125000)
  })
  it('rifiuta testo non numerico', () => {
    expect(parseImporto('')).toBeNull()
    expect(parseImporto('abc')).toBeNull()
    expect(parseImporto('12,5,0')).toBeNull()
    expect(parseImporto('1.2.3,4.5')).toBeNull()
    expect(parseImporto('€')).toBeNull()
  })
  it('non usa mai i float: 0,1 + 0,2 fa esattamente 30 centesimi', () => {
    expect(parseImporto('0,1')! + parseImporto('0,2')!).toBe(30)
  })
})

describe('formatImporto', () => {
  it('formatta in stile italiano', () => {
    expect(formatImporto(1250)).toBe('€ 12,50')
    expect(formatImporto(123456)).toBe('€ 1.234,56')
    expect(formatImporto(123456789)).toBe('€ 1.234.567,89')
    expect(formatImporto(5)).toBe('€ 0,05')
    expect(formatImporto(0)).toBe('€ 0,00')
  })
  it('gestisce il segno', () => {
    expect(formatImporto(-1250)).toBe('−€ 12,50')
    expect(formatImporto(1250, { segno: 'sempre' })).toBe('+€ 12,50')
    expect(formatImporto(0, { segno: 'sempre' })).toBe('€ 0,00')
    expect(formatImporto(-1250, { segno: 'mai' })).toBe('€ 12,50')
  })
  it('può omettere il simbolo', () => {
    expect(formatImporto(1250, { simbolo: false })).toBe('12,50')
  })
  it('è l\'inverso di parseImporto', () => {
    for (const v of [0, 1, 99, 100, 1250, 123456, 99999999]) {
      expect(parseImporto(formatImporto(v))).toBe(v)
    }
  })
})

describe('formatImportoMovimento', () => {
  it('mette il segno in base al tipo', () => {
    expect(formatImportoMovimento(1250, 'uscita')).toBe('−€ 12,50')
    expect(formatImportoMovimento(150000, 'entrata')).toBe('+€ 1.500,00')
  })
})

describe('centesimiInInput', () => {
  it('produce il testo per il campo importo', () => {
    expect(centesimiInInput(1250)).toBe('12,50')
    expect(centesimiInInput(123456)).toBe('1234,56')
  })
})
