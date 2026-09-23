import { useEffect, useRef, useState } from 'react'
import { registerSW } from 'virtual:pwa-register'

/** Ogni quanto l'app installata controlla se c'è una versione nuova. */
const INTERVALLO_CONTROLLO = 60 * 60 * 1000

/**
 * Aggiornamenti dell'app installata sulla home.
 *
 * Il service worker serve la copia in cache: senza un controllo esplicito una
 * versione nuova può restare invisibile per giorni. Qui l'app la cerca
 * all'avvio, una volta all'ora e ogni volta che torna in primo piano.
 *
 * Il service worker si attiva da solo (vedi vite.config.ts): quello che decide
 * l'utente è *quando ricaricare*, perché ricaricare mentre si sta scrivendo un
 * movimento farebbe perdere quello che si è digitato. Finché non ricarica,
 * continua a vedere la versione che ha già in memoria.
 *
 * Restituisce la funzione per ricaricare, o null se non c'è niente di nuovo.
 */
export function useAggiornamentoApp(): (() => void) | null {
  const [pronto, setPronto] = useState(false)
  const giaSegnalato = useRef(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    let registrazione: ServiceWorkerRegistration | undefined
    let timer: number | undefined

    const segnala = () => {
      if (giaSegnalato.current) return
      giaSegnalato.current = true
      setPronto(true)
    }

    const controlla = () => void registrazione?.update().catch(() => undefined)
    const alRitorno = () => {
      if (document.visibilityState === 'visible') controlla()
    }

    /**
     * Il primo service worker della vita dell'app non è un aggiornamento: senza
     * controller precedente non c'è niente di vecchio da sostituire.
     */
    const primaInstallazione = !navigator.serviceWorker.controller
    const alCambioControllo = () => {
      if (!primaInstallazione) segnala()
    }
    navigator.serviceWorker.addEventListener('controllerchange', alCambioControllo)

    registerSW({
      immediate: true,
      // Con un service worker che si attiva da solo questo non scatta quasi mai,
      // ma se restasse in attesa (un'altra scheda aperta) l'avviso arriva lo stesso.
      onNeedRefresh: segnala,
      onRegisteredSW: (_url, r) => {
        registrazione = r
        if (!r) return
        // Una versione già installata e in attesa da una sessione precedente.
        if (r.waiting && navigator.serviceWorker.controller) segnala()
        timer = window.setInterval(controlla, INTERVALLO_CONTROLLO)
        document.addEventListener('visibilitychange', alRitorno)
      },
    })

    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', alRitorno)
      navigator.serviceWorker.removeEventListener('controllerchange', alCambioControllo)
    }
  }, [])

  if (!pronto) return null

  // Il service worker nuovo ha già preso il controllo: basta ricaricare perché
  // la pagina riceva i file nuovi, e li riceve da lui, non dalla cache HTTP.
  return () => window.location.reload()
}
