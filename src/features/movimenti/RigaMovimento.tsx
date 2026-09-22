import { IconaCategoria } from '@/components/IconaCategoria'
import type { Categoria, Movimento } from '@/db/tipi'
import { cn } from '@/lib/cn'
import { coloreCss } from '@/lib/colori'
import { formatDataBreve, formatDataBreveConAnno } from '@/lib/date'
import { formatImportoMovimento } from '@/lib/importi'
import { useMovimenti } from './useMovimenti'

interface Props {
  movimento: Movimento
  categoria?: Categoria
  /** mostra la data a sinistra (lista del report); nella lista per giorno non serve */
  mostraData?: boolean
  /** nei risultati che attraversano più mesi la data porta anche l'anno */
  conAnno?: boolean
  className?: string
}

/** Una riga del registro: tocco → modifica. */
export function RigaMovimento({ movimento: m, categoria, mostraData, conAnno, className }: Props) {
  const { apriModifica } = useMovimenti()
  const colore = coloreCss(categoria?.colore ?? 'neutro')
  const titolo = m.descrizione || categoria?.nome || 'Senza categoria'
  const data = conAnno ? formatDataBreveConAnno(m.data) : formatDataBreve(m.data)

  return (
    <button
      type="button"
      onClick={() => apriModifica(m)}
      aria-label={`${titolo}, ${formatImportoMovimento(m.importo, m.tipo)}, ${data}. Modifica`}
      className={cn(
        'grid w-full items-center gap-3 border-b border-filetto-leggero py-2.5 text-left text-sm last:border-b-0 active:bg-filetto-leggero',
        mostraData ? (conAnno ? 'grid-cols-[5.2rem_1fr_auto]' : 'grid-cols-[3.2rem_1fr_auto]') : 'grid-cols-[1fr_auto]',
        className,
      )}
    >
      {mostraData && <span className="num text-xs text-inchiostro-2">{data}</span>}
      <span className="flex min-w-0 items-center gap-2.5">
        <IconaCategoria nome={categoria?.icona ?? 'circle-dashed'} className="size-4 shrink-0" style={{ color: colore }} />
        <span className="min-w-0">
          <span className="block truncate">{titolo}</span>
          {!mostraData && m.descrizione && (
            <span className="block truncate text-xs text-inchiostro-2">{categoria?.nome ?? 'Senza categoria'}</span>
          )}
        </span>
      </span>
      <span className={cn('num font-medium', m.tipo === 'entrata' && 'text-verde')}>
        {formatImportoMovimento(m.importo, m.tipo)}
      </span>
    </button>
  )
}
