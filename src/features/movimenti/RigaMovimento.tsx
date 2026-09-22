import { IconaCategoria } from '@/components/IconaCategoria'
import type { Categoria, Movimento } from '@/db/tipi'
import { cn } from '@/lib/cn'
import { coloreCss } from '@/lib/colori'
import { formatDataBreve } from '@/lib/date'
import { formatImportoMovimento } from '@/lib/importi'
import { useMovimenti } from './useMovimenti'

interface Props {
  movimento: Movimento
  categoria?: Categoria
  /** mostra la data a sinistra (lista del report); nella lista per giorno non serve */
  mostraData?: boolean
  className?: string
}

/** Una riga del registro: tocco → modifica. */
export function RigaMovimento({ movimento: m, categoria, mostraData, className }: Props) {
  const { apriModifica } = useMovimenti()
  const colore = coloreCss(categoria?.colore ?? 'neutro')
  const titolo = m.descrizione || categoria?.nome || 'Senza categoria'

  return (
    <button
      type="button"
      onClick={() => apriModifica(m)}
      aria-label={`${titolo}, ${formatImportoMovimento(m.importo, m.tipo)}, ${formatDataBreve(m.data)}. Modifica`}
      className={cn(
        'grid w-full items-center gap-3 border-b border-filetto-leggero py-2.5 text-left text-sm last:border-b-0 active:bg-filetto-leggero',
        mostraData ? 'grid-cols-[3.2rem_1fr_auto]' : 'grid-cols-[1fr_auto]',
        className,
      )}
    >
      {mostraData && <span className="num text-xs text-inchiostro-2">{formatDataBreve(m.data)}</span>}
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
