import { Link } from 'react-router'
import { Pannello } from '@/components/ui/Pannello'
import { IconaCategoria } from '@/components/IconaCategoria'
import type { Categoria } from '@/db/tipi'
import type { RiepilogoBudget, VoceBudget } from '@/lib/calcoli'
import { cn } from '@/lib/cn'
import { coloreCss } from '@/lib/colori'
import { formatImporto } from '@/lib/importi'

interface Props {
  riepilogo: RiepilogoBudget
  perId: Map<string, Categoria>
  mese: string
}

/**
 * I budget del mese. Il numero da solo dice poco ("60% speso" è tranquillo il
 * giorno 25 e preoccupante il giorno 5): accanto a ogni barra c'è una tacca
 * col ritmo atteso a oggi, così si vede subito chi sta correndo troppo.
 */
export function Budget({ riepilogo, perId, mese }: Props) {
  const { voci, budgetTotale, spesoTotale, sforate, attesoOggi } = riepilogo

  // Senza budget il pannello spariva del tutto: chi non sapeva che la funzione
  // esiste non aveva modo di scoprirla. Uno spazio vuoto è un invito ad agire.
  if (voci.length === 0) return <Invito />

  const residuoTotale = budgetTotale - spesoTotale

  return (
    <Pannello
      titolo="Budget"
      azione={
        <Link to="/categorie" className="font-testo text-sm font-medium text-cobalto">
          Modifica i budget
        </Link>
      }
    >
      <p className="num mb-3.5 text-sm text-inchiostro-2">
        {residuoTotale >= 0 ? (
          <>
            <b className="font-medium text-inchiostro">{formatImporto(residuoTotale)}</b> ancora disponibili su{' '}
            {formatImporto(budgetTotale)}
          </>
        ) : (
          <>
            <b className="font-medium text-rosso">{formatImporto(Math.abs(residuoTotale))} oltre</b> il budget
            complessivo di {formatImporto(budgetTotale)}
          </>
        )}
        {sforate > 0 && (
          <span>. {sforate === 1 ? 'Una categoria ha sforato.' : `${sforate} categorie hanno sforato.`}</span>
        )}
      </p>

      <ul className="num grid gap-4 text-sm">
        {voci.map((v) => (
          <li key={v.categoriaId}>
            <Riga voce={v} categoria={perId.get(v.categoriaId)} mese={mese} attesoOggi={attesoOggi} />
          </li>
        ))}
      </ul>

      {attesoOggi !== null && (
        <p className="mt-3 text-xs text-inchiostro-2">
          La tacca segna il {attesoOggi}% del mese trascorso: una barra che la supera sta correndo più del tempo.
        </p>
      )}
    </Pannello>
  )
}

function Invito() {
  return (
    <Pannello titolo="Budget">
      <p className="text-sm text-inchiostro-2">
        Metti un tetto mensile a una categoria e qui vedrai quanto ne resta, e se il ritmo di spesa regge fino a fine
        mese.
      </p>
      <Link
        to="/categorie"
        className="mt-3.5 inline-grid h-11 place-items-center rounded-lg bg-carta px-4 text-sm font-medium"
      >
        Scegli una categoria
      </Link>
    </Pannello>
  )
}

function Riga({
  voce,
  categoria,
  mese,
  attesoOggi,
}: {
  voce: VoceBudget
  categoria?: Categoria
  mese: string
  attesoOggi: number | null
}) {
  const colore = coloreCss(categoria?.colore ?? 'neutro')
  const sforato = voce.residuo < 0
  // Oltre il tetto la barra resta piena: il "quanto oltre" lo dice il numero.
  const larghezza = Math.min(100, voce.percentuale)
  const inRitardo = attesoOggi !== null && !sforato && voce.percentuale > attesoOggi + 10

  return (
    <Link
      to={`/movimenti?mese=${mese}&cat=${voce.categoriaId}`}
      className="block rounded-ctrl py-0.5 active:bg-filetto-leggero"
      aria-label={`${categoria?.nome ?? 'Categoria'}: ${formatImporto(voce.speso)} di ${formatImporto(voce.budget)}, ${voce.percentuale}% del budget${sforato ? ', sforato' : ''}. Vedi movimenti`}
    >
      <span className="flex items-baseline justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2">
          <IconaCategoria
            nome={categoria?.icona ?? 'circle-dashed'}
            className="size-4 shrink-0"
            style={{ color: colore }}
          />
          <span className="truncate font-testo">{categoria?.nome ?? 'Senza categoria'}</span>
        </span>
        <span
          className={cn(
            'shrink-0 whitespace-nowrap',
            sforato ? 'font-medium text-rosso' : inRitardo ? 'text-inchiostro' : 'text-inchiostro-2',
          )}
        >
          {formatImporto(voce.speso, { simbolo: false })}
          <span className="text-inchiostro-2"> / {formatImporto(voce.budget, { simbolo: false })}</span>
        </span>
      </span>

      <span className="relative mt-1.5 block h-2 overflow-hidden rounded-full bg-filetto-leggero" aria-hidden="true">
        <span
          className="block h-full rounded-r-full"
          style={{ width: `${Math.max(2, larghezza)}%`, background: sforato ? 'var(--rosso)' : colore }}
        />
        {attesoOggi !== null && (
          <span className="absolute top-0 h-full w-px bg-inchiostro-2 opacity-70" style={{ left: `${attesoOggi}%` }} />
        )}
      </span>

      <span
        className={cn('mt-1 block text-xs', sforato ? 'font-medium text-rosso' : 'text-inchiostro-2')}
      >
        {sforato
          ? `${formatImporto(Math.abs(voce.residuo))} oltre il tetto`
          : `restano ${formatImporto(voce.residuo)}`}
      </span>
    </Link>
  )
}
