import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { IconaCategoria } from '@/components/IconaCategoria'
import { Sheet } from '@/components/ui/Sheet'
import { useGruppoRadio } from '@/components/ui/useGruppoRadio'
import { useToast } from '@/components/useToast'
import { contaMovimentiCategoria, eliminaCategoria, senzaCategoria } from '@/db/categorie'
import type { Categoria } from '@/db/tipi'
import { cn } from '@/lib/cn'
import { coloreCss } from '@/lib/colori'
import { conAvviso } from '@/lib/errori'

interface Props {
  categoria: Categoria | null
  /** tutte le categorie, per proporre la destinazione */
  categorie: Categoria[]
  onChiudi: () => void
}

/**
 * Eliminazione di una categoria. Se ha movimenti, non li cancella in silenzio:
 * chiede dove spostarli (un'altra categoria dello stesso tipo o "Senza categoria").
 */
export function EliminaCategoria({ categoria, categorie, onChiudi }: Props) {
  return (
    <Sheet aperto={categoria !== null} onChiudi={onChiudi} titolo="Elimina categoria">
      {categoria && <Corpo key={categoria.id} categoria={categoria} categorie={categorie} onChiudi={onChiudi} />}
    </Sheet>
  )
}

function Corpo({ categoria, categorie, onChiudi }: { categoria: Categoria; categorie: Categoria[]; onChiudi: () => void }) {
  const { mostra, errore: avvisaErrore } = useToast()
  const conteggio = useLiveQuery(() => contaMovimentiCategoria(categoria.id), [categoria.id])
  const [destinazione, setDestinazione] = useState(() => senzaCategoria(categoria.tipo))
  const alternative = categorie.filter((c) => c.tipo === categoria.tipo && c.id !== categoria.id)
  const gruppo = useGruppoRadio(
    alternative.findIndex((c) => c.id === destinazione),
    (i) => setDestinazione(alternative[i].id),
  )

  const conferma = async () => {
    const fatto = await conAvviso(
      () => eliminaCategoria(categoria.id, destinazione),
      'eliminare la categoria',
      avvisaErrore,
    )
    if (!fatto) return
    mostra(`Categoria "${categoria.nome}" eliminata`, undefined, 3000)
    onChiudi()
  }

  return (
    <>
      <h2 className="font-display text-lg font-semibold">Elimina "{categoria.nome}"</h2>

      {conteggio === undefined ? null : conteggio === 0 ? (
        <p className="mt-2 text-sm text-inchiostro-2">Nessun movimento usa questa categoria.</p>
      ) : (
        <>
          <p className="mt-2 text-sm">
            {conteggio === 1 ? 'Un movimento usa' : `${conteggio} movimenti usano`} questa categoria. Dove li sposto?
          </p>
          <div
            {...gruppo.propsGruppo}
            role="radiogroup"
            aria-label="Categoria di destinazione"
            className="mt-3 grid max-h-[40dvh] gap-1.5 overflow-y-auto"
          >
            {alternative.map((c, i) => (
              <button
                key={c.id}
                type="button"
                role="radio"
                tabIndex={gruppo.tabIndex(i)}
                aria-checked={destinazione === c.id}
                onClick={() => setDestinazione(c.id)}
                className={cn(
                  'flex min-h-11 items-center gap-2.5 rounded-ctrl border px-3 text-left text-sm font-medium',
                  destinazione === c.id ? 'border-cobalto ring-1 ring-cobalto ring-inset' : 'border-filetto',
                  c.diSistema && 'text-inchiostro-2',
                )}
              >
                <IconaCategoria nome={c.icona} className="size-4 shrink-0" style={{ color: coloreCss(c.colore) }} />
                {c.nome}
              </button>
            ))}
          </div>
        </>
      )}

      <button
        type="button"
        onClick={conferma}
        disabled={conteggio === undefined}
        className="mt-5 h-12 w-full rounded-ctrl bg-rosso text-base font-bold text-white active:brightness-95 disabled:opacity-60"
      >
        {conteggio ? 'Sposta i movimenti ed elimina' : 'Elimina categoria'}
      </button>
      <button type="button" onClick={onChiudi} className="mt-2 h-11 w-full rounded-ctrl text-sm font-medium text-inchiostro-2 active:bg-filetto-leggero">
        Annulla
      </button>
    </>
  )
}
