import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo } from 'react'
import { Link, useOutletContext } from 'react-router'
import { BottoneTema } from '@/components/AppShell'
import { SelettoreMese } from '@/components/SelettoreMese'
import { db } from '@/db/db'
import { movimentiDelMese, movimentiFraMesi } from '@/db/movimenti'
import type { Movimento } from '@/db/tipi'
import {
  confrontoConMesePrecedente,
  cumulataUscite,
  mediaUscitePerCategoria,
  mesiPrecedenti,
  ripartizioneUscite,
  statoBudget,
  totali,
  type Confronto,
} from '@/lib/calcoli'
import { cn } from '@/lib/cn'
import { giornoDi, mesePrecedente as calcolaMesePrecedente, nomeMese, oggiIso } from '@/lib/date'
import { formatImporto, formatImportoMovimento } from '@/lib/importi'
import { useMeseSelezionato } from '@/lib/mese'
import { useMovimenti } from '@/features/movimenti/useMovimenti'
import { RigaMovimento } from '@/features/movimenti/RigaMovimento'
import { Budget } from './Budget'
import { Pannello } from '@/components/ui/Pannello'
import { RipartizioneCategorie } from './RipartizioneCategorie'
import { TracciatoMese } from './TracciatoMese'

const ULTIMI = 8
/** Su quanti mesi si calcola il "solito": tre bastano a dare un riferimento senza inseguire stagionalità lontane. */
const MESI_MEDIA = 3

export function ReportPage() {
  const { mese, eCorrente } = useMeseSelezionato()
  const tema = useOutletContext<{ scuro: boolean; alterna: () => void }>()
  const { apriNuovo } = useMovimenti()
  const mesePrec = calcolaMesePrecedente(mese)

  const movimenti = useLiveQuery(() => movimentiDelMese(mese), [mese])
  const precedenti = useLiveQuery(() => movimentiDelMese(mesePrec), [mesePrec])
  const mesiStorico = useMemo(() => mesiPrecedenti(mese, MESI_MEDIA), [mese])
  const storico = useLiveQuery(
    () => movimentiFraMesi(mesiStorico[0], mesiStorico[mesiStorico.length - 1]),
    [mesiStorico],
  )
  const medie = useMemo(
    () => (storico ? mediaUscitePerCategoria(storico, mesiStorico) : undefined),
    [storico, mesiStorico],
  )
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
          {/*
            Il totale e la curva sono un oggetto solo: il numero poggia sulla
            superficie che si riempie giorno per giorno. È l'unica cosa forte
            della pagina, tutto il resto sta a corpo piccolo.
          */}
          <section className="mt-1">
            {/* Numero e conti stanno sulla stessa riga: senza, metà della testata restava vuota */}
            <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
              <div className="min-w-0">
                <p className="text-sm text-inchiostro-2">{eCorrente ? 'Speso finora' : 'Speso in totale'}</p>
                <p className="totale-mese mt-1.5">
                  <span className="segno-euro">€</span>
                  {formatImporto(dati.totali.uscite, { simbolo: false })}
                </p>
                <div className="mt-2.5">
                  <FraseConfronto
                    confronto={dati.confronto}
                    mesePrec={mesePrec}
                    eCorrente={eCorrente}
                    giornoOggi={giornoOggi}
                  />
                </div>
              </div>
              <Totali entrate={dati.totali.entrate} uscite={dati.totali.uscite} saldo={dati.totali.saldo} />
            </div>

            {/* La curva parte subito sotto il numero: è la stessa cosa, vista nel tempo */}
            <div className="mt-4">
              <TracciatoMese
                corrente={dati.cumCorrente}
                precedente={dati.cumPrecedente}
                mese={mese}
                mesePrecedente={mesePrec}
                altezza={172}
              />
            </div>
          </section>

          {/*
            I blocchi di supporto stanno su foglio e si separano con lo spazio.
            Su schermo largo ripartizione e budget stanno affiancati e i movimenti
            prendono tutta la riga: senza questo la pagina finiva a metà altezza.
          */}
          <div className="mt-5 grid gap-4 lg:grid-cols-2 lg:items-start">
            <Pannello titolo="Dove sono finiti i soldi">
              {dati.quote.length === 0 ? (
                <p className="text-sm text-inchiostro-2">Nessuna uscita questo mese.</p>
              ) : (
                <RipartizioneCategorie quote={dati.quote} perId={perId} mese={mese} medie={medie} mesiMedia={MESI_MEDIA} />
              )}
            </Pannello>

            {/* Budget: c'è solo se almeno una categoria ha un tetto */}
            <Budget riepilogo={dati.budget} perId={perId} mese={mese} />

            <Pannello
              className="lg:col-span-2"
              titolo="Ultimi movimenti"
              azione={
                <Link
                  to={eCorrente ? '/movimenti' : `/movimenti?mese=${mese}`}
                  className="font-testo text-sm font-medium text-cobalto"
                >
                  Tutti i movimenti
                </Link>
              }
            >
              <div className="lg:grid lg:grid-cols-2 lg:gap-x-10">
                {movimenti.slice(0, ULTIMI).map((m: Movimento) => (
                  <RigaMovimento key={m.id} movimento={m} categoria={perId.get(m.categoriaId)} mostraData />
                ))}
              </div>
            </Pannello>
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
  const nomeMesePrec = nomeMese(mesePrec)
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
    <dl className="num grid w-full shrink-0 grid-cols-3 gap-x-6 text-xs text-inchiostro-2 sm:w-auto sm:gap-x-9 sm:text-right">
      <div>
        <dt>Entrate</dt>
        <dd className="mt-1 text-lg font-medium text-verde">{formatImportoMovimento(entrate, 'entrata')}</dd>
      </div>
      <div>
        <dt>Uscite</dt>
        <dd className="mt-1 text-lg font-medium text-inchiostro">{formatImportoMovimento(uscite, 'uscita')}</dd>
      </div>
      <div>
        <dt>Saldo</dt>
        <dd className={cn('mt-1 text-lg font-medium', saldo < 0 ? 'text-rosso' : 'text-inchiostro')}>
          {formatImporto(saldo)}
        </dd>
      </div>
    </dl>
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
