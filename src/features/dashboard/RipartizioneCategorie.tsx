import { useNavigate } from 'react-router'
import { IconaCategoria } from '@/components/IconaCategoria'
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

/** Le colonne del registro: icona, voce, percentuale, importo oltre il doppio filetto. */
const COLONNE = 'grid grid-cols-[2.25rem_1fr_3rem_6.5rem] items-stretch'

/**
 * Le uscite per categoria come un registro: una riga per voce, la percentuale
 * delle uscite e l'importo in colonna, e in fondo il totale sotto la doppia riga.
 * Tocco su una riga → i movimenti di quella categoria.
 *
 * Quando una voce si allontana molto dal solito degli ultimi mesi, al posto della
 * percentuale compare lo scarto (+22%, −40%).
 */
export function RipartizioneCategorie({ quote, perId, mese, medie, mesiMedia = 3, massime = 5 }: Props) {
  const navigate = useNavigate()
  if (quote.length === 0) return null

  const visibili = quote.length > massime + 1 ? quote.slice(0, massime) : quote
  const altre = quote.slice(visibili.length)
  const altreImporto = altre.reduce((s, q) => s + q.importo, 0)
  const altrePct = altre.reduce((s, q) => s + q.percentuale, 0)
  const totale = quote.reduce((s, q) => s + q.importo, 0)

  const vaiA = (categoriaId?: string) => {
    const p = new URLSearchParams({ mese })
    if (categoriaId) p.set('cat', categoriaId)
    navigate(`/movimenti?${p.toString()}`)
  }

  const conScarti = medie !== undefined && visibili.some((q) => medie.get(q.categoriaId) !== undefined)

  return (
    <>
      <div className={cn(COLONNE, 'border-b border-accento pb-1.5 text-[11.5px] font-bold tracking-[0.06em] text-inchiostro-2 uppercase')} aria-hidden="true">
        <span className="col-span-2">Voce</span>
        <span className="pr-2.5 text-right">%</span>
        <span className="text-right">Importo</span>
      </div>
      <ul className="num">
        {visibili.map((q) => {
          const c = perId.get(q.categoriaId)
          return (
            <li key={q.categoriaId}>
              <Riga
                nome={c?.nome ?? 'Senza categoria'}
                icona={c?.icona ?? 'circle-dashed'}
                colore={coloreCss(c?.colore ?? 'neutro')}
                percentuale={q.percentuale}
                importo={q.importo}
                media={medie?.get(q.categoriaId)}
                mesiMedia={mesiMedia}
                onClick={() => vaiA(q.categoriaId)}
              />
            </li>
          )
        })}
        {altre.length > 0 && (
          <li>
            <Riga
              nome={`Altre ${altre.length}`}
              icona="circle-dashed"
              colore="var(--inchiostro-2)"
              percentuale={altrePct}
              importo={altreImporto}
              vuota
              onClick={() => vaiA()}
            />
          </li>
        )}
      </ul>
      <div className={cn(COLONNE, 'min-h-11 border-b-[3px] border-double border-accento font-bold')}>
        <span className="col-span-2 self-center">Totale uscite</span>
        <span className="num self-center pr-2.5 text-right text-[13px] text-inchiostro-2">100</span>
        <span className="registro-importo num flex items-center justify-end font-display">{formatImporto(totale, { simbolo: false })}</span>
      </div>
      {conScarti && (
        <p className="mt-2.5 text-xs text-inchiostro-2">
          Quando una voce si allontana parecchio dal solito {mesiMedia === 1 ? 'del mese scorso' : `degli ultimi ${mesiMedia} mesi`}, al posto della
          percentuale compare lo scarto.
        </p>
      )}
    </>
  )
}

function Riga({
  nome,
  icona,
  colore,
  percentuale,
  importo,
  media,
  mesiMedia,
  vuota,
  onClick,
}: {
  nome: string
  icona: string
  colore: string
  percentuale: number
  importo: number
  media?: number
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
      className={cn(COLONNE, 'min-h-11 w-full border-b border-filetto-leggero text-left text-[15px] active:bg-filetto-leggero', vuota && 'text-inchiostro-2')}
    >
      <span
        className={cn('riquadro size-7 self-center', vuota && 'border border-dashed border-filetto')}
        style={{ color: colore, background: vuota ? 'transparent' : undefined }}
        aria-hidden="true"
      >
        <IconaCategoria nome={icona} className="size-[15px]" />
      </span>
      <span className="truncate self-center">{nome}</span>
      <span className={cn('self-center pr-2.5 text-right text-[13px]', notevole ? 'font-bold text-inchiostro' : 'text-inchiostro-2')}>
        {notevole ? `${scarto > 0 ? '+' : '−'}${Math.abs(scarto)}%` : percentuale}
      </span>
      <span className="registro-importo flex items-center justify-end font-display" style={{ fontWeight: 'var(--peso-importi)' }}>
        {formatImporto(importo, { simbolo: false })}
      </span>
    </button>
  )
}
