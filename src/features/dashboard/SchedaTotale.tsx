import { ArrowDown, ArrowUp } from 'lucide-react'
import type { Confronto } from '@/lib/calcoli'
import { useConteggio } from '@/lib/conteggio'
import { nomeMese } from '@/lib/date'
import { formatImporto } from '@/lib/importi'
import { TracciatoMese } from './TracciatoMese'

interface Props {
  uscite: number
  confronto: Confronto | null
  cumCorrente: number[]
  cumPrecedente: number[]
  mese: string
  mesePrecedente: string
  eCorrente: boolean
  giornoOggi?: number
}

/**
 * La scheda del totale: l'unica superficie colorata della pagina.
 *
 * Tutto il resto dell'app sta su fondi neutri; qui il mese in corso ha una
 * sfumatura viva con un alone che si muove piano. È l'ancora visiva: aprendo
 * l'app la prima cosa che si incontra è il numero, non una griglia di pannelli.
 *
 * Il tracciato vive dentro la scheda, non sotto: il totale e la curva sono la
 * stessa cosa, il numero di oggi e la strada per arrivarci. Le variabili di
 * colore vengono ridefinite sulla scheda (vedi `su-scheda` in index.css), così
 * il grafico si ridisegna in chiaro senza sapere dove si trova.
 */
export function SchedaTotale({
  uscite,
  confronto,
  cumCorrente,
  cumPrecedente,
  mese,
  mesePrecedente,
  eCorrente,
  giornoOggi,
}: Props) {
  const contato = useConteggio(uscite)

  return (
    <section className="su-scheda scheda-totale relative overflow-hidden">
      <div className="relative px-5 pt-5 md:px-6 md:pt-6">
        <p className="text-sm font-semibold text-[color:var(--hero-testo-2)]">
          {eCorrente ? 'Speso finora' : 'Speso in totale'}
        </p>
        <p className="cifra-grande mt-1 flex items-baseline gap-0.5 text-[clamp(2.9rem,13vw,3.6rem)]">
          <span className="text-[0.42em] font-bold text-[color:var(--hero-testo-2)]">€</span>
          <span className="testo-sfumato">{formatImporto(contato, { simbolo: false })}</span>
        </p>
        <PillolaConfronto
          confronto={confronto}
          mesePrecedente={mesePrecedente}
          eCorrente={eCorrente}
          giornoOggi={giornoOggi}
        />
      </div>

      <div className="-mt-2">
        <TracciatoMese
          corrente={cumCorrente}
          precedente={cumPrecedente}
          mese={mese}
          mesePrecedente={mesePrecedente}
          altezza={168}
        />
      </div>
    </section>
  )
}

/**
 * Il confronto col mese scorso come pastiglia, non come frase in corpo piccolo:
 * è l'unica informazione della scheda che cambia di segno, e il colore lo dice
 * prima delle parole. Verde quando si sta spendendo meno, ambra quando di più.
 */
function PillolaConfronto({
  confronto,
  mesePrecedente,
  eCorrente,
  giornoOggi,
}: {
  confronto: Confronto | null
  mesePrecedente: string
  eCorrente: boolean
  giornoOggi?: number
}) {
  const nome = nomeMese(mesePrecedente)

  if (!confronto) {
    return (
      <p className="mt-3 inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-[color:var(--hero-testo-2)]">
        Niente da confrontare con {nome}
      </p>
    )
  }

  const stessoGiorno = eCorrente && confronto.stessoGiorno && giornoOggi !== undefined
  const differenza = stessoGiorno ? confronto.stessoGiorno!.differenza : confronto.differenza
  const riferimento = stessoGiorno ? `${giornoOggi} ${nome}` : nome

  if (differenza === 0) {
    return (
      <p className="mt-3 inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-[color:var(--hero-testo-2)]">
        Come al {riferimento}
      </p>
    )
  }

  const inMeno = differenza < 0
  const Freccia = inMeno ? ArrowDown : ArrowUp

  return (
    <p
      className={
        'num mt-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ' +
        (inMeno
          ? 'border-[color:var(--verde)]/35 bg-[color:var(--verde)]/15 text-[color:var(--verde)]'
          : 'border-amber-300/35 bg-amber-300/15 text-amber-200')
      }
    >
      <Freccia className="size-3.5" strokeWidth={2.8} aria-hidden="true" />
      {formatImporto(Math.abs(differenza))} in {inMeno ? 'meno' : 'più'} di {riferimento}
    </p>
  )
}
