import { useLiveQuery } from 'dexie-react-hooks'
import { useOutletContext } from 'react-router'
import { BottoneTema } from '@/components/AppShell'
import { SelettoreMese } from '@/components/SelettoreMese'
import { db } from '@/db/db'
import type { Movimento } from '@/db/tipi'
import { totali } from '@/lib/calcoli'
import { formatImporto, formatImportoMovimento } from '@/lib/importi'
import { useMeseSelezionato } from '@/lib/mese'

export function ReportPage() {
  const { mese } = useMeseSelezionato()
  const tema = useOutletContext<{ scuro: boolean; alterna: () => void }>()
  const movimenti = useLiveQuery(
    () => db.movimenti.where('data').between(`${mese}-01`, `${mese}-32`).toArray(),
    [mese],
  )

  return (
    <>
      <div className="flex items-center justify-between py-2">
        <SelettoreMese />
        <span className="md:hidden">
          <BottoneTema scuro={tema.scuro} alterna={tema.alterna} />
        </span>
      </div>

      {movimenti === undefined ? null : movimenti.length === 0 ? (
        <StatoVuoto />
      ) : (
        <Anteprima movimenti={movimenti} />
      )}
    </>
  )
}

function StatoVuoto() {
  return (
    <div className="py-16 text-center">
      <p className="font-display text-xl font-semibold">Nessun movimento questo mese</p>
      <p className="mt-2 text-sm text-inchiostro-2">
        Aggiungi la prima spesa con il pulsante + oppure importa un CSV.
      </p>
    </div>
  )
}

/** Riepilogo minimo: il report completo arriva nella Fase 3. */
function Anteprima({ movimenti }: { movimenti: Movimento[] }) {
  const t = totali(movimenti)
  return (
    <div className="num grid grid-cols-3 gap-2 border-b border-filetto py-4 text-xs text-inchiostro-2">
      <div>
        Entrate
        <b className="mt-0.5 block text-base font-medium text-verde">{formatImportoMovimento(t.entrate, 'entrata')}</b>
      </div>
      <div className="text-center">
        Uscite
        <b className="mt-0.5 block text-base font-medium text-inchiostro">{formatImportoMovimento(t.uscite, 'uscita')}</b>
      </div>
      <div className="text-right">
        Saldo
        <b className={`mt-0.5 block text-base font-medium ${t.saldo < 0 ? 'text-rosso' : 'text-inchiostro'}`}>
          {formatImporto(t.saldo)}
        </b>
      </div>
    </div>
  )
}
