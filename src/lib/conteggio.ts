import { useEffect, useRef, useState } from 'react'

const riduciMovimento = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Il numero che scorre fino al valore nuovo, solo quando cambia per un'azione.
 *
 * All'apertura il numero compare già fermo: un conteggio che parte da solo a ogni
 * avvio è un effetto, non un'informazione. Scorre invece quando il valore cambia
 * restando nello stesso contesto (un movimento salvato o eliminato nel mese che
 * si sta guardando): lì lo scatto dice cosa è appena successo.
 *
 * Cambiando `contesto` (per esempio il mese) il numero salta al valore nuovo
 * senza animazione: non c'è un "prima" a cui legarlo.
 *
 * Ogni valore intermedio è un intero in centesimi, così chi lo formatta con
 * formatImporto non vede mai frazioni di centesimo. Con "riduci movimento" il
 * numero cambia e basta.
 */
export function useConteggio(valore: number, contesto: unknown = null, durata = 700): number {
  const [mostrato, setMostrato] = useState(valore)
  const ultimo = useRef(valore)
  const contestoPrecedente = useRef(contesto)

  useEffect(() => {
    const da = ultimo.current
    const stessoContesto = Object.is(contestoPrecedente.current, contesto)
    contestoPrecedente.current = contesto
    if (da === valore) return

    if (!stessoContesto || riduciMovimento()) {
      ultimo.current = valore
      setMostrato(valore)
      return
    }

    let attivo = true
    const inizio = performance.now()
    const passo = (t: number) => {
      if (!attivo) return
      const p = Math.min(1, (t - inizio) / durata)
      // decelerazione: parte svelto e si posa
      const v = Math.round(da + (valore - da) * (1 - Math.pow(1 - p, 3)))
      ultimo.current = v
      setMostrato(v)
      if (p < 1) requestAnimationFrame(passo)
    }
    requestAnimationFrame(passo)

    return () => {
      attivo = false
    }
  }, [valore, contesto, durata])

  return mostrato
}
