import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formatMese } from '@/lib/date'
import { useMeseSelezionato } from '@/lib/mese'

export function SelettoreMese() {
  const { mese, eCorrente, precedente, successivo } = useMeseSelezionato()
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={precedente}
        aria-label="Mese precedente"
        className="grid size-9 place-items-center rounded-ctrl text-inchiostro-2 transition-colors hover:bg-filetto-leggero active:bg-filetto"
      >
        <ChevronLeft className="size-5" />
      </button>
      <h1 className="min-w-[9ch] text-center font-display text-lg font-extrabold tracking-tight whitespace-nowrap">
        {formatMese(mese)}
      </h1>
      <button
        type="button"
        onClick={successivo}
        disabled={eCorrente}
        aria-label="Mese successivo"
        className="grid size-9 place-items-center rounded-ctrl text-inchiostro-2 hover:bg-filetto-leggero active:bg-filetto disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <ChevronRight className="size-5" />
      </button>
    </div>
  )
}
