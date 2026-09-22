import { useEffect, useRef, useState } from 'react'
import { registerSW } from 'virtual:pwa-register'

/** Ogni quanto l'app installata controlla se c'è una versione nuova. */
const INTERVALLO_CONTROLLO = 60 * 60 * 1000

/**
 * Aggiornamenti dell'app installata sulla home.
 *
 * Il service worker serve la copia in cache: senza un controllo esplicito una
 * versione nuova può restare invisibile per giorni, e per vederla bisognava
 * chiudere l'app dal multitasking e riaprirla.
 *
 * Qui l'app la cerca all'avvio, una volta all'ora e ogni volta che si torna in
 * primo piano. Quando la trova lo dice, invece di ricaricare da sola:
 * ricaricare mentre si sta scrivendo un movimento farebbe perdere quello che si
 * è digitato.
 *
 * Restituisce la funzione per applicare l'aggiornamento, o null se non ce n'è.
 */
export function useAggiornamentoApp(): (() => void) | null {
  const [pronto, setPronto] = useState(false)
  const applica = useRef<((ricarica: boolean) => Promise<void>) | null>(null)

  useEffect(() => {
    // In sviluppo il service worker non c'è: non c'è niente da aggiornare.
    if (!('serviceWorker' in navigator)) return

    let registrazione: ServiceWorkerRegistration | undefined
    let timer: number | undefined

    const controlla = () => void registrazione?.update().catch(() => undefined)
    const alRitorno = () => {
      if (document.visibilityState === 'visible') controlla()
    }

    applica.current = registerSW({
      immediate: true,
      onNeedRefresh: () => setPronto(true),
      onRegisteredSW: (_url, r) => {
        registrazione = r
        if (!r) return
        timer = window.setInterval(controlla, INTERVALLO_CONTROLLO)
        document.addEventListener('visibilitychange', alRitorno)
      },
    })

    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', alRitorno)
    }
  }, [])

  if (!pronto) return null

  return () => {
    // Non basta ricaricare: finché il nuovo service worker non ha preso il
    // controllo, la pagina riceve l'HTML vecchio dalla cache HTTP e servirebbe
    // una seconda apertura. Prima lo si attiva, poi si ricarica quando è lui a
    // rispondere. Il timeout è la via d'uscita se il controllo non arriva.
    const ricarica = () => window.location.reload()
    navigator.serviceWorker.addEventListener('controllerchange', ricarica, { once: true })
    window.setTimeout(ricarica, 3000)
    void applica.current?.(false)
  }
}
