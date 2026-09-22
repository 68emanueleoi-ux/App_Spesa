import { useNavigate } from 'react-router'
import type { Categoria } from '@/db/tipi'
import type { QuotaCategoria } from '@/lib/calcoli'
import { cn } from '@/lib/cn'
import { coloreCss } from '@/lib/colori'
import { formatImporto } from '@/lib/importi'

interface Props {
  quote: QuotaCategoria[]
  perId: Map<string, Categoria>
  mese: string
  /** uscita media mensile per categoria nei mesi precedenti; vuota se non c'è storico */
  medie?: Map<string, number>
  /** su quanti mesi è calcolata la media, per dirlo all'utente */
  mesiMedia?: number
  /** quante categorie mostrare singolarmente; le altre vengono raggruppate */
  massime?: number
}

/** Barre ordinate: nome, percentuale e importo sulla stessa riga, come nel registro. Tocco → lista filtrata. */
export function RipartizioneCategorie({ quote, perId, mese, medie, mesiMedia = 3, massime = 5 }: Props) {
  const navigate = useNavigate()
  if (quote.length === 0) return null

  const visibili = quote.length > massime + 1 ? quote.slice(0, massime) : quote
  const altre = quote.slice(visibili.length)
  const altreImporto = altre.reduce((s, q) => s + q.importo, 0)
  const altrePct = altre.reduce((s, q) => s + q.percentuale, 0)
  const massimo = quote[0].importo

  const vaiA = (categoriaId?: string) => {
    const p = new URLSearchParams({ mese })
    if (categoriaId) p.set('cat', categoriaId)
    navigate(`/movimenti?${p.toString()}`)
  }

  const conMedie = medie !== undefined && visibili.some((q) => medie.get(q.categoriaId) !== undefined)

  return (
    <>
    <ul className="num grid gap-2.5 text-sm">
      {visibili.map((q) => {
        const c = perId.get(q.categoriaId)
        const media = medie?.get(q.categoriaId)
        return (
          <li key={q.categoriaId}>
            <Barra
              nome={c?.nome ?? 'Senza categoria'}
              colore={coloreCss(c?.colore ?? 'neutro')}
              larghezza={(q.importo / massimo) * 100}
              percentuale={q.percentuale}
              importo={q.importo}
              media={media}
              mediaLarghezza={media ? (media / massimo) * 100 : undefined}
              mesiMedia={mesiMedia}
              onClick={() => vaiA(q.categoriaId)}
            />
          </li>
        )
      })}
      {altre.length > 0 && (
        <li>
          <Barra
            nome={`Altre ${altre.length}`}
            colore="var(--inchiostro-2)"
            larghezza={(altreImporto / massimo) * 100}
            percentuale={altrePct}
            importo={altreImporto}
            vuota
            onClick={() => vaiA()}
          />
        </li>
      )}
    </ul>
    {conMedie && (
      <p className="mt-2.5 text-xs text-inchiostro-2">
        La tacca segna il solito di {mesiMedia === 1 ? 'un mese fa' : `questi ultimi ${mesiMedia} mesi`}; la
        percentuale diventa lo scarto quando ci si allontana parecchio.
      </p>
    )}
    </>
  )
}

function Barra({
  nome,
  colore,
  larghezza,
  percentuale,
  importo,
  media,
  mediaLarghezza,
  mesiMedia,
  vuota,
  onClick,
}: {
  nome: string
  colore: string
  larghezza: number
  percentuale: number
  importo: number
  media?: number
  mediaLarghezza?: number
  mesiMedia?: number
  vuota?: boolean
  onClick: () => void
}) {
  // Sotto il 15% di scarto la differenza è rumore: non vale la pena commentarla.
  const scarto = media ? Math.round(((importo - media) / media) * 100) : 0
  const notevole = media !== undefined && Math.abs(scarto) >= 15

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={
        `${nome}: ${formatImporto(importo)}, ${percentuale}% delle uscite` +
        (media !== undefined
          ? `. Media degli ultimi ${mesiMedia} mesi: ${formatImporto(media)}, ${Math.abs(scarto)}% in ${scarto > 0 ? 'più' : 'meno'}`
          : '') +
        '. Vedi movimenti'
      }
      className="grid w-full grid-cols-[10px_5.5rem_1fr_2.4rem_4.5rem] items-center gap-2 rounded-ctrl py-0.5 text-left active:bg-filetto-leggero md:grid-cols-[10px_7rem_1fr_2.6rem_5.5rem]"
    >
      <span
        className="size-2.5 rounded-full"
        style={vuota ? { border: `1.5px solid ${colore}` } : { background: colore }}
        aria-hidden="true"
      />
      <span className={vuota ? 'truncate text-inchiostro-2' : 'truncate'}>{nome}</span>
      <span className="relative block h-2 overflow-hidden rounded-full bg-filetto-leggero" aria-hidden="true">
        <span className="block h-full rounded-r-full" style={{ width: `${Math.max(2, larghezza)}%`, background: colore }} />
        {/* Tacca del solito: stesso segno del ritmo nei budget, così si legge allo stesso modo */}
        {mediaLarghezza !== undefined && mediaLarghezza > 0 && (
          <span
            className="absolute top-0 h-full w-px bg-inchiostro-2 opacity-70"
            style={{ left: `${Math.min(100, mediaLarghezza)}%` }}
          />
        )}
      </span>
      <span className={cn('text-right text-xs', notevole ? 'text-inchiostro' : 'text-inchiostro-2')}>
        {notevole ? `${scarto > 0 ? '+' : ''}${scarto}%` : `${percentuale}%`}
      </span>
      <span className="text-right">{formatImporto(importo, { simbolo: false })}</span>
    </button>
  )
}
