import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { IconaCategoria } from '@/components/IconaCategoria'
import { spostaCategoria } from '@/db/categorie'
import { db } from '@/db/db'
import type { Categoria, RegolaCategoria, TipoMovimento } from '@/db/tipi'
import { coloreCss } from '@/lib/colori'
import { conAvviso } from '@/lib/errori'
import { formatImporto } from '@/lib/importi'
import { useToast } from '@/components/useToast'
import { EliminaCategoria } from './EliminaCategoria'
import { FormCategoria } from './FormCategoria'
import { FormRegola } from './FormRegola'

type StatoForm = { aperto: false } | { aperto: true; tipo: TipoMovimento; categoria?: Categoria }
type StatoRegola = { aperto: false } | { aperto: true; regola?: RegolaCategoria }

export function CategoriePage() {
  const { errore: avvisaErrore } = useToast()
  const categorie = useLiveQuery(() => db.categorie.orderBy('ordine').toArray())
  const regole = useLiveQuery(() => db.regole.orderBy('priorita').toArray())
  const perId = useMemo(() => new Map((categorie ?? []).map((c) => [c.id, c])), [categorie])
  const [form, setForm] = useState<StatoForm>({ aperto: false })
  const [daEliminare, setDaEliminare] = useState<Categoria | null>(null)
  const [formRegola, setFormRegola] = useState<StatoRegola>({ aperto: false })

  const sposta = (id: string, direzione: 'su' | 'giu') => {
    void conAvviso(() => spostaCategoria(id, direzione), 'spostare la categoria', avvisaErrore)
  }

  if (!categorie || !regole) return null

  return (
    <>
      <h1 className="py-3 font-display text-xl font-semibold">Categorie</h1>

      <Gruppo
        titolo="Uscite"
        tipo="uscita"
        categorie={categorie}
        onNuova={() => setForm({ aperto: true, tipo: 'uscita' })}
        onModifica={(c) => setForm({ aperto: true, tipo: c.tipo, categoria: c })}
        onElimina={setDaEliminare}
        onSposta={sposta}
      />
      <Gruppo
        titolo="Entrate"
        tipo="entrata"
        categorie={categorie}
        onNuova={() => setForm({ aperto: true, tipo: 'entrata' })}
        onModifica={(c) => setForm({ aperto: true, tipo: c.tipo, categoria: c })}
        onElimina={setDaEliminare}
        onSposta={sposta}
      />

      {/* Regole */}
      <section className="py-4">
        <div className="mb-1 flex items-baseline justify-between">
          <h2 className="font-display text-base font-semibold">Regole di categorizzazione</h2>
          <button
            type="button"
            onClick={() => setFormRegola({ aperto: true })}
            className="flex items-center gap-1 text-sm font-medium text-cobalto"
          >
            <Plus className="size-4" aria-hidden="true" />
            Nuova
          </button>
        </div>
        <p className="mb-2 text-xs text-inchiostro-2">
          Assegnano la categoria da sole in base alla descrizione, sia nell'importazione CSV sia nei movimenti inseriti
          a mano.
        </p>
        {regole.length === 0 ? (
          <p className="py-4 text-sm text-inchiostro-2">Nessuna regola. Esempio: "conad" → Spesa.</p>
        ) : (
          <ul>
            {regole.map((r) => {
              const c = perId.get(r.categoriaId)
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => setFormRegola({ aperto: true, regola: r })}
                    className="flex w-full items-center gap-3 border-b border-filetto-leggero py-2.5 text-left text-sm active:bg-filetto-leggero"
                  >
                    <span className="min-w-0 flex-1 truncate">
                      contiene <b className="font-medium">"{r.contiene}"</b>
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5 text-inchiostro-2">
                      →{' '}
                      {c && (
                        <IconaCategoria nome={c.icona} className="size-3.5" style={{ color: coloreCss(c.colore) }} />
                      )}
                      {c?.nome ?? '?'}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <FormCategoria
        aperto={form.aperto}
        tipo={form.aperto ? form.tipo : 'uscita'}
        categoria={form.aperto ? form.categoria : undefined}
        onChiudi={() => setForm({ aperto: false })}
      />
      <EliminaCategoria categoria={daEliminare} categorie={categorie} onChiudi={() => setDaEliminare(null)} />
      <FormRegola
        aperto={formRegola.aperto}
        regola={formRegola.aperto ? formRegola.regola : undefined}
        categorie={categorie}
        onChiudi={() => setFormRegola({ aperto: false })}
      />
    </>
  )
}

function Gruppo({
  titolo,
  tipo,
  categorie,
  onNuova,
  onModifica,
  onElimina,
  onSposta,
}: {
  titolo: string
  tipo: TipoMovimento
  categorie: Categoria[]
  onNuova: () => void
  onModifica: (c: Categoria) => void
  onElimina: (c: Categoria) => void
  onSposta: (id: string, direzione: 'su' | 'giu') => void
}) {
  const ordinabili = categorie.filter((c) => c.tipo === tipo && !c.diSistema)
  return (
    <section className="border-b border-filetto py-4">
      <div className="mb-1 flex items-baseline justify-between">
        <h2 className="font-display text-base font-semibold">{titolo}</h2>
        <button type="button" onClick={onNuova} className="flex items-center gap-1 text-sm font-medium text-cobalto">
          <Plus className="size-4" aria-hidden="true" />
          Nuova
        </button>
      </div>
      <ul>
        {categorie
          .filter((c) => c.tipo === tipo)
          .map((c, i) => (
            <li key={c.id} className="flex items-center border-b border-filetto-leggero last:border-b-0">
              <button
                type="button"
                onClick={() => !c.diSistema && onModifica(c)}
                disabled={!!c.diSistema}
                aria-label={c.diSistema ? c.nome : `${c.nome}. Modifica`}
                className="flex min-w-0 flex-1 items-center gap-3 py-2.5 text-left text-sm active:bg-filetto-leggero disabled:cursor-default"
              >
                <span
                  className="grid size-8 shrink-0 place-items-center rounded-ctrl"
                  style={{
                    color: coloreCss(c.colore),
                    background: 'color-mix(in srgb, currentColor 14%, transparent)',
                  }}
                  aria-hidden="true"
                >
                  <IconaCategoria nome={c.icona} className="size-4" />
                </span>
                <span className={c.diSistema ? 'truncate text-inchiostro-2' : 'truncate'}>{c.nome}</span>
                {c.budget !== undefined && (
                  <span className="num ml-auto pr-2 text-xs text-inchiostro-2">
                    {formatImporto(c.budget)}/mese
                  </span>
                )}
                {c.diSistema && <span className="ml-auto pr-2 text-xs text-inchiostro-2">non eliminabile</span>}
              </button>
              {!c.diSistema && (
                <>
                  <button
                    type="button"
                    onClick={() => onSposta(c.id, 'su')}
                    disabled={i === 0}
                    aria-label={`Sposta ${c.nome} più in alto`}
                    className="grid size-8 shrink-0 place-items-center rounded-ctrl text-inchiostro-2 hover:bg-filetto-leggero disabled:opacity-25"
                  >
                    <ChevronUp className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onSposta(c.id, 'giu')}
                    disabled={i === ordinabili.length - 1}
                    aria-label={`Sposta ${c.nome} più in basso`}
                    className="grid size-8 shrink-0 place-items-center rounded-ctrl text-inchiostro-2 hover:bg-filetto-leggero disabled:opacity-25"
                  >
                    <ChevronDown className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onElimina(c)}
                    aria-label={`Elimina ${c.nome}`}
                    className="grid size-9 shrink-0 place-items-center rounded-ctrl text-inchiostro-2 hover:text-rosso active:bg-filetto-leggero"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </>
              )}
            </li>
          ))}
      </ul>
    </section>
  )
}
