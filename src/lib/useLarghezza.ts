import { useLayoutEffect, useRef, useState } from 'react'

/** Larghezza in px di un elemento, aggiornata al ridimensionamento. */
export function useLarghezza<T extends HTMLElement>(iniziale = 360) {
  const ref = useRef<T>(null)
  const [larghezza, setLarghezza] = useState(iniziale)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const aggiorna = () => setLarghezza(Math.max(1, Math.round(el.getBoundingClientRect().width)))
    aggiorna()
    const ro = new ResizeObserver(aggiorna)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return { ref, larghezza }
}
