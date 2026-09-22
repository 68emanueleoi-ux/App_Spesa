import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'

export function MovimentiPage() {
  const n = useLiveQuery(() => db.movimenti.count())
  return (
    <>
      <h1 className="py-3 font-display text-xl font-semibold">Movimenti</h1>
      <p className="text-sm text-inchiostro-2">
        {n === undefined ? '' : n === 0 ? 'Nessun movimento registrato.' : `${n} movimenti registrati.`} La lista con filtri e
        ricerca arriva nella Fase 2.
      </p>
    </>
  )
}
