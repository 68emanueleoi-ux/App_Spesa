import type { Categoria, Movimento } from '@/db/tipi'
import { formatDataNumerica } from './date'
import { formatImporto } from './importi'

/** Movimenti in CSV "italiano": separatore ; e virgola decimale, apribile da Excel/Numbers senza impostazioni. */
export function movimentiInCsv(movimenti: Movimento[], perId: Map<string, Categoria>): string {
  const q = (v: string) => `"${v.replace(/"/g, '""')}"`
  const righe = [
    ['Data', 'Tipo', 'Categoria', 'Descrizione', 'Importo'].join(';'),
    ...movimenti.map((m) =>
      [
        formatDataNumerica(m.data),
        m.tipo === 'entrata' ? 'Entrata' : 'Uscita',
        q(perId.get(m.categoriaId)?.nome ?? 'Senza categoria'),
        q(m.descrizione ?? ''),
        (m.tipo === 'uscita' ? '-' : '') + formatImporto(m.importo, { simbolo: false, segno: 'mai' }).replace(/\./g, ''),
      ].join(';'),
    ),
  ]
  // BOM: così Excel riconosce l'UTF-8 (accenti nelle descrizioni)
  return '﻿' + righe.join('\r\n') + '\r\n'
}

/**
 * Consegna un file all'utente. Su telefono usa il foglio di condivisione (su iPhone si salva in File
 * o si manda via AirDrop/WhatsApp); su desktop scarica direttamente.
 */
export async function consegnaFile(nome: string, contenuto: string, mime: string): Promise<void> {
  const file = new File([contenuto], nome, { type: mime })
  const touch = window.matchMedia('(pointer: coarse)').matches
  if (touch && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: nome })
      return
    } catch (e) {
      if ((e as DOMException).name === 'AbortError') return // l'utente ha chiuso il foglio
    }
  }
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = nome
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

export function nomeFileConData(prefisso: string, estensione: string): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${prefisso}-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}.${estensione}`
}
