import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo } from 'react'
import { Link, useOutletContext } from 'react-router'
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
import { classeAzionePannello, Pannello } from '@/components/ui/Pannello'
import { Budget } from './Budget'
import { RipartizioneCategorie } from './RipartizioneCategorie'
import { TestataMese } from './TestataMese'
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

  // Il saldo del mese dopo ogni movimento, dal più recente indietro: si parte dal saldo
  // di oggi e si toglie il movimento appena passato. Centesimi interi, nessun float.
  const saldiDopo = useMemo(() => {
    if (!dati || !movimenti) return []
    const out: number[] = []
    let saldo = dati.totali.saldo
    for (const m of movimenti.slice(0, ULTIMI)) {
      out.push(saldo)
      saldo -= m.tipo === 'entrata' ? m.importo : -m.importo
    }
    return out
  }, [dati, movimenti])

  return (
    <>
      {/* La testata c'è sempre, anche a mese vuoto: dentro sta la tendina per cambiare mese. */}
      <TestataMese
        mese={mese}
        mesePrecedente={mesePrec}
        eCorrente={eCorrente}
        giornoOggi={giornoOggi}
        totali={dati?.totali ?? null}
        confronto={dati?.confronto ?? null}
        tema={tema}
      />

      {!dati || !movimenti ? null : movimenti.length === 0 ? (
        <StatoVuoto onAggiungi={() => apriNuovo()} />
      ) : (
        /*
          Il registro del mese, sulla carta. Su schermo largo andamento e categorie
          stanno affiancati, budget e movimenti sotto.
        */
        <div className="grid lg:grid-cols-2 lg:gap-x-10">
          <Pannello titolo="Andamento">
            <TracciatoMese corrente={dati.cumCorrente} precedente={dati.cumPrecedente} mese={mese} mesePrecedente={mesePrec} />
          </Pannello>

          <Pannello titolo="Per categoria">
            {dati.quote.length === 0 ? (
              <p className="text-sm text-inchiostro-2">Nessuna uscita questo mese.</p>
            ) : (
              <RipartizioneCategorie quote={dati.quote} perId={perId} mese={mese} medie={medie} mesiMedia={MESI_MEDIA} />
            )}
          </Pannello>

          {/* Budget: se nessuna categoria ha un tetto, un invito a metterlo */}
          <Budget riepilogo={dati.budget} perId={perId} mese={mese} />

          <Pannello
            titolo="Ultimi movimenti"
            azione={
              <Link to={eCorrente ? '/movimenti' : `/movimenti?mese=${mese}`} className={classeAzionePannello}>
                Tutti
              </Link>
            }
          >
            <div className="border-t border-accento">
              {movimenti.slice(0, ULTIMI).map((m: Movimento, i) => (
                <RigaMovimento key={m.id} movimento={m} categoria={perId.get(m.categoriaId)} mostraData saldoDopo={saldiDopo[i]} />
              ))}
            </div>
          </Pannello>
        </div>
      )}
    </>
  )
}

function StatoVuoto({ onAggiungi }: { onAggiungi: () => void }) {
  return (
    <div className="py-14 text-center">
      <p className="font-display text-xl" style={{ fontWeight: 'var(--peso-titoli)' }}>Nessun movimento questo mese</p>
      <p className="mx-auto mt-2 max-w-[32ch] text-sm text-inchiostro-2">
        Registra la prima spesa, oppure importa i movimenti da un file CSV.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={onAggiungi}
          className="bottone-forte h-11 px-5 text-sm"
        >
          Aggiungi spesa
        </button>
        <Link to="/importazione" className="grid h-11 place-items-center rounded-ctrl border border-accento px-5 text-sm font-bold text-accento active:bg-filetto-leggero">
          Importa CSV
        </Link>
      </div>
    </div>
  )
}
