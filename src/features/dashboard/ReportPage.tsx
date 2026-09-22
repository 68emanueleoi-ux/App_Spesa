import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo } from 'react'
import { Link, useOutletContext } from 'react-router'
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import { BottoneTema } from '@/components/AppShell'
import { SelettoreMese } from '@/components/SelettoreMese'
import { db } from '@/db/db'
import { movimentiDelMese } from '@/db/movimenti'
import type { Movimento } from '@/db/tipi'
import { confrontoConMesePrecedente, cumulataUscite, ripartizioneUscite, statoBudget, totali, type Confronto } from '@/lib/calcoli'
import { cn } from '@/lib/cn'
import { giornoDi, mesePrecedente as calcolaMesePrecedente, oggiIso } from '@/lib/date'
import { formatImporto, formatImportoMovimento } from '@/lib/importi'
import { useMeseSelezionato } from '@/lib/mese'
import { useMovimenti } from '@/features/movimenti/useMovimenti'
import { RigaMovimento } from '@/features/movimenti/RigaMovimento'
import { Budget } from './Budget'
import { RipartizioneCategorie } from './RipartizioneCategorie'
import { TracciatoMese } from './TracciatoMese'

const ULTIMI = 8

export function ReportPage() {
  const { mese, eCorrente } = useMeseSelezionato()
  const tema = useOutletContext<{ scuro: boolean; alterna: () => void }>()
  const { apriNuovo } = useMovimenti()
  const mesePrec = calcolaMesePrecedente(mese)

  const movimenti = useLiveQuery(() => movimentiDelMese(mese), [mese])
  const precedenti = useLiveQuery(() => movimentiDelMese(mesePrec), [mesePrec])
  const categorie = useLiveQuery(() => db.categorie.toArray())
  const perId = useMemo(() => new Map((categorie ?? []).map((c) => [c.id, c])), [categorie])

  const oggi = oggiIso()
  const giornoOggi = eCorrente ? giornoDi(oggi) : undefined

  const dati = useMemo(() => {
    if (!movimenti || !precedenti) return null
    return {
      totali: totali(movimenti),
      quote: ripartizioneUscite(movimenti),
      cumCorrente: cumulataUscite(movimenti, mese, giornoOggi),
      cumPrecedente: precedenti.length ? cumulataUscite(precedenti, mesePrec) : [],
      confronto: confrontoConMesePrecedente(movimenti, precedenti, mesePrec, giornoOggi),
      budget: statoBudget(movimenti, categorie ?? [], mese, giornoOggi),
    }
  }, [movimenti, precedenti, categorie, mese, mesePrec, giornoOggi])

  return (
    <>
      <div className="flex items-center justify-between py-2">
        <SelettoreMese />
        <span className="md:hidden">
          <BottoneTema scuro={tema.scuro} alterna={tema.alterna} />
        </span>
      </div>

      {!dati || !movimenti ? null : movimenti.length === 0 ? (
        <StatoVuoto onAggiungi={() => apriNuovo()} />
      ) : (
        <>
          {/* Hero: speso finora + tratto */}
          <div className="md:grid md:grid-cols-[260px_1fr] md:items-end md:gap-8">
            <div className="pt-3">
              <p className="text-sm text-inchiostro-2">{eCorrente ? 'Speso finora' : 'Speso in totale'}</p>
              <p className="num font-display-opsz mt-0.5 text-3xl font-medium tracking-tight">{formatImporto(dati.totali.uscite)}</p>
              <FraseConfronto confronto={dati.confronto} mesePrec={mesePrec} eCorrente={eCorrente} giornoOggi={giornoOggi} />
            </div>
            <div className="mt-4 md:mt-0">
              <TracciatoMese
                corrente={dati.cumCorrente}
                precedente={dati.cumPrecedente}
                mese={mese}
                mesePrecedente={mesePrec}
                altezza={132}
              />
            </div>
          </div>

          {/* Totali */}
          <Totali entrate={dati.totali.entrate} uscite={dati.totali.uscite} saldo={dati.totali.saldo} />

          {/* Budget: c'è solo se almeno una categoria ha un tetto */}
          <Budget riepilogo={dati.budget} perId={perId} mese={mese} />

          <div className="md:grid md:grid-cols-2 md:gap-x-10">
            {/* Ripartizione */}
            <section className="border-b border-filetto py-4 md:border-r md:border-b-0 md:pr-10">
              <h2 className="mb-2.5 font-display text-base font-semibold">Dove sono finiti i soldi</h2>
              {dati.quote.length === 0 ? (
                <p className="text-sm text-inchiostro-2">Nessuna uscita questo mese.</p>
              ) : (
                <RipartizioneCategorie quote={dati.quote} perId={perId} mese={mese} />
              )}
            </section>

            {/* Ultimi movimenti */}
            <section className="py-4">
              <h2 className="mb-1 flex items-baseline justify-between font-display text-base font-semibold">
                Ultimi movimenti
                <Link to={eCorrente ? '/movimenti' : `/movimenti?mese=${mese}`} className="font-testo text-sm font-medium text-cobalto">
                  Tutti ›
                </Link>
              </h2>
              <div>
                {movimenti.slice(0, ULTIMI).map((m: Movimento) => (
                  <RigaMovimento key={m.id} movimento={m} categoria={perId.get(m.categoriaId)} mostraData />
                ))}
              </div>
            </section>
          </div>
        </>
      )}
    </>
  )
}

function FraseConfronto({
  confronto,
  mesePrec,
  eCorrente,
  giornoOggi,
}: {
  confronto: Confronto | null
  mesePrec: string
  eCorrente: boolean
  giornoOggi?: number
}) {
  const nomeMesePrec = format(parseISO(`${mesePrec}-01`), 'LLLL', { locale: it })
  if (!confronto) {
    return <p className="mt-1 text-sm text-inchiostro-2">Nessun movimento a {nomeMesePrec} con cui confrontare</p>
  }
  if (eCorrente && confronto.stessoGiorno && giornoOggi !== undefined) {
    const d = confronto.stessoGiorno.differenza
    return (
      <p className="num mt-1 text-sm">
        {d === 0 ? (
          <>Come al {giornoOggi} {nomeMesePrec}</>
        ) : (
          <>
            <strong className="font-bold">
              {formatImporto(Math.abs(d))} in {d < 0 ? 'meno' : 'più'}
            </strong>{' '}
            rispetto al {giornoOggi} {nomeMesePrec}
          </>
        )}
      </p>
    )
  }
  const d = confronto.differenza
  return (
    <p className="num mt-1 text-sm">
      <strong className="font-bold">
        {formatImporto(Math.abs(d))} in {d < 0 ? 'meno' : 'più'}
      </strong>{' '}
      rispetto a {nomeMesePrec}
      {confronto.percentuale !== null && (
        <span className="text-inchiostro-2">
          {' '}
          ({confronto.percentuale > 0 ? '+' : ''}
          {confronto.percentuale}%)
        </span>
      )}
    </p>
  )
}

function Totali({ entrate, uscite, saldo }: { entrate: number; uscite: number; saldo: number }) {
  return (
    <div className="num mt-4 grid grid-cols-3 gap-2 border-b border-filetto pb-4 text-xs text-inchiostro-2 md:mt-5 md:flex md:gap-10">
      <div>
        Entrate
        <b className="mt-0.5 block text-base font-medium text-verde md:ml-2 md:inline">{formatImportoMovimento(entrate, 'entrata')}</b>
      </div>
      <div className="text-center">
        Uscite
        <b className="mt-0.5 block text-base font-medium text-inchiostro md:ml-2 md:inline">{formatImportoMovimento(uscite, 'uscita')}</b>
      </div>
      <div className="text-right">
        Saldo
        <b className={cn('mt-0.5 block text-base font-medium md:ml-2 md:inline', saldo < 0 ? 'text-rosso' : 'text-inchiostro')}>
          {formatImporto(saldo)}
        </b>
      </div>
    </div>
  )
}

function StatoVuoto({ onAggiungi }: { onAggiungi: () => void }) {
  return (
    <div className="py-16 text-center">
      <p className="font-display text-xl font-semibold">Nessun movimento questo mese</p>
      <p className="mx-auto mt-2 max-w-[32ch] text-sm text-inchiostro-2">
        Registra la prima spesa, oppure importa i movimenti da un file CSV.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={onAggiungi}
          className="h-11 rounded-lg bg-cobalto px-5 text-sm font-bold text-cobalto-testo active:brightness-95"
        >
          Aggiungi spesa
        </button>
        <Link to="/importazione" className="grid h-11 place-items-center rounded-lg border border-filetto px-5 text-sm font-medium">
          Importa CSV
        </Link>
      </div>
    </div>
  )
}
