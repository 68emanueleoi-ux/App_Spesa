import { useEffect, useRef, useState } from 'react'

const riduciMovimento = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Il numero sale da zero fino al valore, una volta sola all'apertura.
 *
 * Non è decorazione: il totale del mese è la prima cosa che si guarda, e vederlo
 * arrivare dice che è stato appena calcolato sui tuoi movimenti. Dura poco meno
 * di un secondo, poi resta fermo. Quando il valore cambia (un movimento nuovo,
 * un altro mese) il conteggio riparte da dov'era, non da zero: l'aggiornamento
 * si legge come uno scatto e non come un ricalcolo da capo.
 *
 * Con "riduci movimento" attivo il numero compare e basta.
 */
export function useConteggio(valore: number, durata = 900): number {
  // La preferenza si legge una volta: cambiarla a metà animazione non è un caso da servire.
  const [fermo] = useState(riduciMovimento)
  const [mostrato, setMostrato] = useState(fermo ? valore : 0)
  const corrente = useRef(0)

  useEffect(() => {
    if (fermo) return
    const da = corrente.current
    if (da === valore) return

    let attivo = true
    const inizio = performance.now()
    const passo = (t: number) => {
      if (!attivo) return
      const p = Math.min(1, (t - inizio) / durata)
      // decelerazione: parte svelto e si posa, come un contachilometri che frena
      const v = da + (valore - da) * (1 - Math.pow(1 - p, 3))
      corrente.current = v
      setMostrato(v)
      if (p < 1) requestAnimationFrame(passo)
      else corrente.current = valore
    }
    requestAnimationFrame(passo)

    return () => {
      attivo = false
      // chi arriva dopo riparte da qui, non da zero
      corrente.current = valore
    }
  }, [valore, durata, fermo])

  return fermo ? valore : mostrato
}
