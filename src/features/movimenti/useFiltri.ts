import { useCallback } from 'react'
import { useSearchParams } from 'react-router'
import type { TipoMovimento } from '@/db/tipi'

export type FiltroTipo = 'tutti' | TipoMovimento

/**
 * Tipo e categoria vivono nell'URL, come il mese.
 *
 * Prima `?cat=` veniva letto solo al montaggio e poi copiato nello stato locale,
 * ma restava nell'URL: togliendo il filtro dal menu e cambiando mese, al
 * ricaricamento il filtro tornava da solo. Con una sola fonte il problema non
 * esiste, e il link che arriva dal report resta valido.
 */
export function useFiltriMovimenti() {
  const [params, setParams] = useSearchParams()

  const daUrl = params.get('tipo')
  const tipo: FiltroTipo = daUrl === 'uscita' || daUrl === 'entrata' ? daUrl : 'tutti'
  const categoriaId = params.get('cat') ?? ''

  // Un solo setParams: due chiamate nello stesso gestore leggerebbero entrambe
  // i parametri del render corrente e la seconda annullerebbe la prima.
  const aggiorna = useCallback(
    (nuovi: { tipo?: FiltroTipo; categoriaId?: string }) => {
      setParams(
        (p) => {
          if (nuovi.tipo !== undefined) {
            if (nuovi.tipo === 'tutti') p.delete('tipo')
            else p.set('tipo', nuovi.tipo)
          }
          if (nuovi.categoriaId !== undefined) {
            if (nuovi.categoriaId === '') p.delete('cat')
            else p.set('cat', nuovi.categoriaId)
          }
          return p
        },
        { replace: true },
      )
    },
    [setParams],
  )

  return {
    tipo,
    categoriaId,
    /** Cambiare tipo azzera la categoria: una categoria di uscita non ha senso fra le entrate. */
    impostaTipo: useCallback((t: FiltroTipo) => aggiorna({ tipo: t, categoriaId: '' }), [aggiorna]),
    impostaCategoria: useCallback((id: string) => aggiorna({ categoriaId: id }), [aggiorna]),
  }
}
