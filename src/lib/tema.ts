import { useCallback, useEffect, useState } from 'react'

export type Tema = 'chiaro' | 'scuro' | 'sistema'

const CHIAVE = 'spese.tema'

function leggiScelta(): Tema {
  try {
    const v = localStorage.getItem(CHIAVE)
    return v === 'chiaro' || v === 'scuro' ? v : 'sistema'
  } catch {
    return 'sistema'
  }
}

function sistemaScuro(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function applica(scuro: boolean) {
  document.documentElement.classList.toggle('dark', scuro)
}

/**
 * Tema: segue il sistema finché l'utente non sceglie; la scelta manuale ha precedenza
 * ed è ricordata in localStorage (letta anche dallo script inline in index.html, prima del primo render).
 */
export function useTema() {
  const [scelta, setScelta] = useState<Tema>(leggiScelta)
  const [scuro, setScuro] = useState<boolean>(() => document.documentElement.classList.contains('dark'))

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const aggiorna = () => {
      const s = scelta === 'sistema' ? sistemaScuro() : scelta === 'scuro'
      applica(s)
      setScuro(s)
    }
    aggiorna()
    mq.addEventListener('change', aggiorna)
    return () => mq.removeEventListener('change', aggiorna)
  }, [scelta])

  const alterna = useCallback(() => {
    const prossimo: Tema = scuro ? 'chiaro' : 'scuro'
    try {
      localStorage.setItem(CHIAVE, prossimo)
    } catch {
      // senza storage il tema vale solo per la sessione
    }
    setScelta(prossimo)
  }, [scuro])

  return { scuro, alterna }
}
