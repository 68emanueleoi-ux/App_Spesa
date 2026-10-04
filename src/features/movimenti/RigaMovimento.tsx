import { IconaCategoria } from '@/components/IconaCategoria'
import type { Categoria, Movimento } from '@/db/tipi'
import { cn } from '@/lib/cn'
import { coloreCss } from '@/lib/colori'
import { formatDataBreve, formatDataBreveConAnno } from '@/lib/date'
import { formatImporto, formatImportoMovimento } from '@/lib/importi'
import { useMovimenti } from './useMovimenti'

interface Props {
  movimento: Movimento
  categoria?: Categoria
  /** mostra la data a sinistra (lista del report); nella lista per giorno non serve */
  mostraData?: boolean
  /** nei risultati che attraversano più mesi la data porta anche l'anno */
  conAnno?: boolean
  /** saldo del mese subito dopo questo movimento (centesimi): sotto l'importo, come in un estratto */
  saldoDopo?: number
  className?: string
}

/**
 * Una riga del registro: tocco → modifica.
 *
 * L'importo sta oltre un doppio filetto nell'accento del mese, come la colonna
 * degli importi di un libro dei conti; sotto, quando c'è, il saldo del mese
 * dopo questo movimento.
 */
export function RigaMovimento({ movimento: m, categoria, mostraData, conAnno, saldoDopo, className }: Props) {
  const { apriModifica } = useMovimenti()
  const colore = coloreCss(categoria?.colore ?? 'neutro')
  const titolo = m.descrizione || categoria?.nome || 'Senza categoria'
  const data = conAnno ? formatDataBreveConAnno(m.data) : formatDataBreve(m.data)
  const importo = formatImportoMovimento(m.importo, m.tipo)

  return (
    <button
      type="button"
      onClick={() => apriModifica(m)}
      aria-label={`${titolo}, ${importo}, ${data}${saldoDopo !== undefined ? `, saldo del mese dopo: ${formatImporto(saldoDopo)}` : ''}. Modifica`}
      className={cn(
        'grid min-h-[52px] w-full items-stretch border-b border-filetto-leggero text-left text-[15px] last:border-b-0 active:bg-filetto-leggero',
        mostraData ? (conAnno ? 'grid-cols-[4.6rem_1fr_auto]' : 'grid-cols-[3.1rem_1fr_auto]') : 'grid-cols-[1fr_auto]',
        className,
      )}
    >
      {mostraData && <span className="num self-center text-xs text-inchiostro-2">{data}</span>}
      <span className="flex min-w-0 items-center gap-3 py-2 pr-3">
        {/* Il riquadro tinto dell'icona: l'unico appiglio per riconoscere la categoria senza leggerla. */}
        <span className="riquadro size-8 shrink-0" style={{ color: colore }} aria-hidden="true">
          <IconaCategoria nome={categoria?.icona ?? 'circle-dashed'} className="size-4" />
        </span>
        <span className="min-w-0">
          <span className="block truncate">{titolo}</span>
          <span className="block truncate text-xs text-inchiostro-2">{categoria?.nome ?? 'Senza categoria'}</span>
        </span>
      </span>
      <span className="registro-importo flex min-w-[6.5rem] flex-col items-end justify-center py-2 pl-3">
        <span
          className={cn('num font-display', m.tipo === 'entrata' && 'text-verde')}
          style={{ fontWeight: 'var(--peso-importi)' }}
        >
          {formatImporto(m.tipo === 'uscita' ? -m.importo : m.importo, { simbolo: false, segno: 'sempre' })}
        </span>
        {saldoDopo !== undefined && (
          <span className="num font-display text-[11.5px] text-inchiostro-2">{formatImporto(saldoDopo, { simbolo: false })}</span>
        )}
      </span>
    </button>
  )
}
