import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronDown } from 'lucide-react'
import { useMemo } from 'react'
import { db } from '@/db/db'
import { cn } from '@/lib/cn'
import { formatMese, meseCorrente, meseDi, mesePrecedente, type MeseKey } from '@/lib/date'
import { useMeseSelezionato } from '@/lib/mese'
import { conTransizione } from '@/lib/transizione'

/** Quanti mesi indietro si possono scegliere anche senza movimenti registrati. */
const MESI_MINIMI = 12

/** Dal mese corrente all'indietro fino al più vecchio da offrire. */
function elencoMesi(primo: MeseKey, ultimo: MeseKey): MeseKey[] {
  const out: MeseKey[] = []
  for (let m = ultimo; m >= primo; m = mesePrecedente(m)) out.push(m)
  return out
}

/**
 * La tendina del mese: il nome del mese è il comando che apre la scelta.
 *
 * È un <select> nativo vestito da campo: su iPhone apre la rotella di sistema,
 * che si usa col pollice e legge già VoiceOver; il corpo resta a 18 px, sopra i
 * 16 sotto cui Safari ingrandisce la pagina. Prende il colore del testo che ha
 * intorno, così sta sulla testata del mese come sulla carta.
 *
 * Si sceglie fra i mesi dal primo movimento registrato (o almeno gli ultimi 12)
 * fino a quello corrente: oltre non c'è niente da vedere.
 */
export function SelettoreMese({ className }: { className?: string }) {
  const { mese, imposta } = useMeseSelezionato()
  const primoMovimento = useLiveQuery(() => db.movimenti.orderBy('data').first(), [])

  const mesi = useMemo(() => {
    const corrente = meseCorrente()
    let primo = corrente
    for (let i = 1; i < MESI_MINIMI; i++) primo = mesePrecedente(primo)
    const dalPrimo = primoMovimento ? meseDi(primoMovimento.data) : primo
    const inizio = [primo, dalPrimo, mese].sort()[0]
    return elencoMesi(inizio, corrente)
  }, [primoMovimento, mese])

  return (
    <label className={cn('relative inline-flex items-center', className)}>
      <span className="sr-only">Mese da mostrare</span>
      <select
        value={mese}
        // il mese nuovo (e il suo colore) entra con una dissolvenza; istantaneo con "riduci movimento"
        onChange={(e) => {
          const scelto = e.target.value
          conTransizione(() => imposta(scelto))
        }}
        style={{ fontWeight: 'var(--peso-titoli)' }}
        className="h-11 cursor-pointer appearance-none rounded-ctrl border border-[color-mix(in_srgb,currentColor_40%,transparent)] bg-transparent py-0 pr-10 pl-3.5 font-display text-[18px] text-current active:bg-[color-mix(in_srgb,currentColor_10%,transparent)]"
      >
        {mesi.map((m) => (
          <option key={m} value={m}>
            {formatMese(m)}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 size-4" strokeWidth={2.4} aria-hidden="true" />
    </label>
  )
}
