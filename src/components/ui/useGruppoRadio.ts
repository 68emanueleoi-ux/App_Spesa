import { useRef, type KeyboardEvent } from 'react'

/**
 * Comportamento da tastiera di un gruppo `role="radiogroup"` (roving tabindex).
 *
 * Prima ogni pulsante del gruppo era raggiungibile con Tab: nel form categoria
 * la griglia delle icone ne ha una cinquantina, e per arrivare al pulsante di
 * salvataggio bisognava attraversarli tutti. Il pattern ARIA vuole un solo
 * punto di ingresso nel gruppo e le frecce per muoversi dentro.
 *
 * `indiceSelezionato` è -1 quando non c'è ancora una scelta: in quel caso il
 * punto di ingresso è il primo elemento.
 */
export function useGruppoRadio<E extends HTMLElement = HTMLDivElement>(
  indiceSelezionato: number,
  onSeleziona: (indice: number) => void,
) {
  const gruppo = useRef<E>(null)
  const attivo = indiceSelezionato < 0 ? 0 : indiceSelezionato

  const onKeyDown = (e: KeyboardEvent<E>) => {
    const radio = [...(gruppo.current?.querySelectorAll<HTMLElement>('[role="radio"]:not([disabled])') ?? [])]
    if (radio.length === 0) return

    const corrente = radio.indexOf(document.activeElement as HTMLElement)
    const da = corrente === -1 ? attivo : corrente

    let prossimo: number
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        prossimo = (da + 1) % radio.length
        break
      case 'ArrowLeft':
      case 'ArrowUp':
        prossimo = (da - 1 + radio.length) % radio.length
        break
      case 'Home':
        prossimo = 0
        break
      case 'End':
        prossimo = radio.length - 1
        break
      default:
        return
    }

    // Le frecce dentro un radiogroup scelgono, non scorrono la pagina.
    e.preventDefault()
    radio[prossimo].focus()
    onSeleziona(prossimo)
  }

  return {
    /** Da applicare all'elemento con role="radiogroup" */
    propsGruppo: { ref: gruppo, onKeyDown },
    /** tabIndex del radio in posizione `i`: solo uno per gruppo è raggiungibile con Tab */
    tabIndex: (i: number) => (i === attivo ? 0 : -1),
  }
}
