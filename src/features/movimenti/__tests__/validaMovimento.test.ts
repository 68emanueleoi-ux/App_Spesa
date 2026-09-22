import { describe, expect, it } from 'vitest'
import { meseCorrente, meseSuccessivo } from '@/lib/date'
import { fineMeseCorrente, resolverMovimento, validaMovimento, type ValoriMovimento } from '../validaMovimento'

const valido: ValoriMovimento = {
  tipo: 'uscita',
  importo: '12,50',
  categoriaId: 'spesa',
  data: `${meseCorrente()}-01`,
  descrizione: 'Conad',
}

describe('validaMovimento', () => {
  it('non trova errori in un movimento valido', () => {
    expect(validaMovimento(valido)).toEqual({})
  })

  it('accetta la virgola, il punto e il simbolo di euro', () => {
    for (const importo of ['12,50', '12.50', '€ 12,50', '1.234,56', '0,01']) {
      expect(validaMovimento({ ...valido, importo })).toEqual({})
    }
  })

  it('rifiuta importo vuoto, non numerico, zero o negativo', () => {
    for (const importo of ['', '   ', 'abc', '0', '0,00', '-5']) {
      expect(validaMovimento({ ...valido, importo }).importo).toBe('Inserisci un importo maggiore di zero')
    }
  })

  it('pretende una categoria', () => {
    expect(validaMovimento({ ...valido, categoriaId: '' }).categoriaId).toBe('Scegli una categoria')
  })

  it('pretende una data in formato ISO', () => {
    for (const data of ['', '22/09/2026', '2026-9-1']) {
      expect(validaMovimento({ ...valido, data }).data).toBe('Inserisci una data')
    }
  })

  it('accetta tutto il mese corrente ma non il mese successivo', () => {
    expect(validaMovimento({ ...valido, data: fineMeseCorrente() }).data).toBeUndefined()
    const domaniIlMeseProssimo = `${meseSuccessivo(meseCorrente())}-01`
    expect(validaMovimento({ ...valido, data: domaniIlMeseProssimo }).data).toBe(
      'La data non può essere in un mese futuro',
    )
  })

  it('accetta le date passate', () => {
    expect(validaMovimento({ ...valido, data: '2020-01-01' }).data).toBeUndefined()
  })

  it('limita la descrizione a 100 caratteri', () => {
    expect(validaMovimento({ ...valido, descrizione: 'a'.repeat(100) }).descrizione).toBeUndefined()
    expect(validaMovimento({ ...valido, descrizione: 'a'.repeat(101) }).descrizione).toBe('Massimo 100 caratteri')
  })

  it('segnala tutti i campi sbagliati insieme, non solo il primo', () => {
    const errori = validaMovimento({ ...valido, importo: '', categoriaId: '', data: 'x' })
    expect(Object.keys(errori).sort()).toEqual(['categoriaId', 'data', 'importo'])
  })
})

describe('resolverMovimento', () => {
  const contesto = { criteriaMode: 'firstError' as const, fields: {}, shouldUseNativeValidation: false }

  it('restituisce i valori quando è tutto a posto', async () => {
    expect(await resolverMovimento(valido, undefined, contesto)).toEqual({ values: valido, errors: {} })
  })

  it('traduce gli errori nel formato di react-hook-form', async () => {
    const esito = await resolverMovimento({ ...valido, importo: '' }, undefined, contesto)
    expect(esito.values).toEqual({})
    expect(esito.errors.importo).toMatchObject({ message: 'Inserisci un importo maggiore di zero' })
  })
})
