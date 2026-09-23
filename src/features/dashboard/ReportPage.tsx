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
} from '@/lib/calcoli'
import { giornoDi, mesePrecedente as calcolaMesePrecedente, oggiIso } from '@/lib/date'
import { useMeseSelezionato } from '@/lib/mese'
import { useMovimenti } from '@/features/movimenti/useMovimenti'
import { RigaMovimento } from '@/features/movimenti/RigaMovimento'
import { Budget } from './Budget'
import { SaldoDelMese } from './SaldoDelMese'
import { SchedaTotale } from './SchedaTotale'
import { Pannello } from '@/components/ui/Pannello'
import { RipartizioneCategorie } from './RipartizioneCategorie'

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
          <SchedaTotale
            uscite={dati.totali.uscite}
            confronto={dati.confronto}
            cumCorrente={dati.cumCorrente}
            cumPrecedente={dati.cumPrecedente}
            mese={mese}
            mesePrecedente={mesePrec}
            eCorrente={eCorrente}
            giornoOggi={giornoOggi}
          />

          <SaldoDelMese
            entrate={dati.totali.entrate}
            uscite={dati.totali.uscite}
            saldo={dati.totali.saldo}
          />

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
