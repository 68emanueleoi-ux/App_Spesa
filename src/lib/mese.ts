import { useCallback } from 'react'
import { useSearchParams } from 'react-router'
import { meseCorrente, mesePrecedente, meseSuccessivo, type MeseKey } from './date'

const RE_MESE = /^\d{4}-(0[1-9]|1[0-2])$/

/**
 * Mese selezionato, tenuto nell'URL (?mese=2026-09) così il tasto indietro e i link funzionano.
 * Non si può andare oltre il mese corrente.
 */
export function useMeseSelezionato() {
  const [params, setParams] = useSearchParams()
  const corrente = meseCorrente()
  const daUrl = params.get('mese')
  const mese: MeseKey = daUrl && RE_MESE.test(daUrl) && daUrl <= corrente ? daUrl : corrente

  const imposta = useCallback(
    (nuovo: MeseKey) => {
      setParams(
        (p) => {
          if (nuovo === meseCorrente()) p.delete('mese')
          else p.set('mese', nuovo)
          return p
        },
        { replace: true },
      )
    },
    [setParams],
  )

  return {
    mese,
    eCorrente: mese === corrente,
    precedente: () => imposta(mesePrecedente(mese)),
    successivo: () => {
      if (mese < corrente) imposta(meseSuccessivo(mese))
    },
    imposta,
  }
}
