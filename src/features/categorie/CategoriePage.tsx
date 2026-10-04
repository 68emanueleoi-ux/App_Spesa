import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { IconaCategoria } from '@/components/IconaCategoria'
import { TestataPagina } from '@/components/TestataPagina'
import { classeAzionePannello, Pannello } from '@/components/ui/Pannello'
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
      <TestataPagina>
        <h1 className="flex min-h-11 items-center font-display text-[26px] leading-tight" style={{ fontWeight: 'var(--peso-titoli)' }}>
          Categorie
        </h1>
        <p className="mt-1 text-sm text-blocco-testo-2">Colore, icona e tetto mensile di ogni voce, e le regole che le assegnano da sole.</p>
      </TestataPagina>

      {/*
        grid-cols-1 non è decorativo: senza, su telefono la colonna è implicita e
        larga `auto`, cioè almeno quanto il min-content del contenuto. Nel min-content
        il testo di una regola conta per intero, puntini di sospensione esclusi: bastava
        una regola lunga per allargare la colonna oltre lo schermo e portarsi dietro anche
        Uscite ed Entrate, con le frecce e il cestino fuori dal bordo destro.
        grid-cols-1 (come lg:grid-cols-2) è minmax(0, 1fr): il minimo è zero, così la
        colonna non supera mai lo schermo e a stringersi sono i testi, che già troncano.
      */}
      <div className="grid grid-cols-1 lg:grid-cols-2 lg:items-start lg:gap-x-10">
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
      <Pannello
        className="lg:col-span-2"
        titolo="Regole di categorizzazione"
        azione={
          <button
            type="button"
            onClick={() => setFormRegola({ aperto: true })}
            className={classeAzionePannello}
          >
            <Plus className="size-4" aria-hidden="true" />
            Nuova regola
          </button>
        }
      >
        <p className="mb-2.5 text-xs text-inchiostro-2">
          Assegnano la categoria da sole in base alla descrizione, sia nell'importazione CSV sia nei movimenti inseriti
          a mano.
        </p>
        {regole.length === 0 ? (
          <p className="py-4 text-sm text-inchiostro-2">Nessuna regola. Esempio: "conad" → Spesa.</p>
        ) : (
          <ul className="border-t border-accento md:grid md:grid-cols-2 md:gap-x-10">
            {regole.map((r) => {
              const c = perId.get(r.categoriaId)
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => setFormRegola({ aperto: true, regola: r })}
                    className="flex min-h-12 w-full items-center gap-3 border-b border-filetto-leggero py-2 text-left text-[15px] active:bg-filetto-leggero"
                  >
                    <span className="min-w-0 flex-1 truncate">
                      contiene <b className="font-bold">"{r.contiene}"</b>
                    </span>
                    <span className="flex shrink-0 items-center gap-2 text-sm text-inchiostro-2">
                      {c && (
                        <span className="riquadro size-7" style={{ color: coloreCss(c.colore) }} aria-hidden="true">
                          <IconaCategoria nome={c.icona} className="size-[15px]" />
                        </span>
                      )}
                      {c?.nome ?? '?'}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </Pannello>
      </div>

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
    <Pannello
      titolo={titolo}
      azione={
        <button type="button" onClick={onNuova} className={classeAzionePannello}>
          <Plus className="size-4" aria-hidden="true" />
          Nuova categoria
        </button>
      }
    >
      <ul className="border-t border-accento">
        {categorie
          .filter((c) => c.tipo === tipo)
          .map((c, i) => (
            <li key={c.id} className="flex items-center border-b border-filetto-leggero">
              <button
                type="button"
                onClick={() => !c.diSistema && onModifica(c)}
                disabled={!!c.diSistema}
                aria-label={c.diSistema ? c.nome : `${c.nome}. Modifica`}
                className="flex min-h-12 min-w-0 flex-1 items-center gap-3 py-1.5 text-left text-[15px] active:bg-filetto-leggero disabled:cursor-default"
              >
                <span className="riquadro size-9 shrink-0" style={{ color: coloreCss(c.colore) }} aria-hidden="true">
                  <IconaCategoria nome={c.icona} className="size-[17px]" />
                </span>
                <span className={c.diSistema ? 'truncate text-inchiostro-2' : 'truncate font-semibold'}>{c.nome}</span>
                {c.budget !== undefined && (
                  <span className="num ml-auto shrink-0 pr-1 font-display text-xs whitespace-nowrap text-inchiostro-2">
                    {formatImporto(c.budget, { simbolo: false })}/mese
                  </span>
                )}
                {c.diSistema && (
                  <span className="ml-auto shrink-0 pr-2 text-xs whitespace-nowrap text-inchiostro-2">non eliminabile</span>
                )}
              </button>
              {!c.diSistema && (
                <>
                  <button
                    type="button"
                    onClick={() => onSposta(c.id, 'su')}
                    disabled={i === 0}
                    aria-label={`Sposta ${c.nome} più in alto`}
                    className="grid size-11 shrink-0 place-items-center rounded-ctrl text-inchiostro-2 hover:bg-filetto-leggero active:bg-filetto-leggero disabled:opacity-25"
                  >
                    <ChevronUp className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onSposta(c.id, 'giu')}
                    disabled={i === ordinabili.length - 1}
                    aria-label={`Sposta ${c.nome} più in basso`}
                    className="grid size-11 shrink-0 place-items-center rounded-ctrl text-inchiostro-2 hover:bg-filetto-leggero active:bg-filetto-leggero disabled:opacity-25"
                  >
                    <ChevronDown className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onElimina(c)}
                    aria-label={`Elimina ${c.nome}`}
                    className="grid size-11 shrink-0 place-items-center rounded-ctrl text-inchiostro-2 hover:text-rosso active:bg-filetto-leggero"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </>
              )}
            </li>
          ))}
      </ul>
    </Pannello>
  )
}
