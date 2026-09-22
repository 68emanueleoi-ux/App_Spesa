import { describe, expect, it } from 'vitest'
import type { Categoria, Movimento } from '@/db/tipi'
import { movimentiInCsv } from '../esporta'

describe('movimentiInCsv', () => {
  it('produce un CSV italiano (; e virgola), con BOM, segno sulle uscite e virgolette protette', () => {
    const cat = new Map<string, Categoria>([
      ['spesa', { id: 'spesa', nome: 'Spesa', tipo: 'uscita', colore: 'c1', icona: 'x', ordine: 1 }],
    ])
    const m: Movimento[] = [
      { id: '1', tipo: 'uscita', importo: 123456, categoriaId: 'spesa', data: '2026-09-22', descrizione: 'Conad "centro"', creatoIl: '' },
      { id: '2', tipo: 'entrata', importo: 150000, categoriaId: 'boh', data: '2026-09-20', creatoIl: '' },
    ]
    const csv = movimentiInCsv(m, cat)
    expect(csv.charCodeAt(0)).toBe(0xfeff)
    expect(csv.slice(1).split('\r\n')).toEqual([
      'Data;Tipo;Categoria;Descrizione;Importo',
      '22/09/2026;Uscita;"Spesa";"Conad ""centro""";-1234,56',
      '20/09/2026;Entrata;"Senza categoria";"";1500,00',
      '',
    ])
  })
})
