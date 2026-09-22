import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowDownUp, Database, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { SelettoreMese } from '@/components/SelettoreMese'
import { useGruppoRadio } from '@/components/ui/useGruppoRadio'
import { db } from '@/db/db'
import { cercaMovimenti, movimentiDelMese } from '@/db/movimenti'
import type { Categoria, Movimento } from '@/db/tipi'
import { totali } from '@/lib/calcoli'
import { cn } from '@/lib/cn'
import { formatDataLunga, formatMese } from '@/lib/date'
import { formatImporto } from '@/lib/importi'
import { useMeseSelezionato } from '@/lib/mese'
import { contiene, normalizza } from '@/lib/testo'
import { useFiltriMovimenti } from './useFiltri'
import { useMovimenti } from './useMovimenti'
import { RigaMovimento } from './RigaMovimento'
import { PannelloDati } from './PannelloDati'

type Ordine = 'data' | 'importo'

export function MovimentiPage() {
  const { mese } = useMeseSelezionato()
  const { apriNuovo } = useMovimenti()
  const { tipo, categoriaId, impostaTipo, impostaCategoria } = useFiltriMovimenti()
  const [ordine, setOrdine] = useState<Ordine>('data')
  const [ricerca, setRicerca] = useState('')
  const [datiAperto, setDatiAperto] = useState(false)

  const categorie = useLiveQuery(() => db.categorie.orderBy('ordine').toArray())
  const perId = useMemo(() => new Map((categorie ?? []).map((c) => [c.id, c])), [categorie])

  // Da due caratteri in su la ricerca esce dal mese selezionato e guarda tutto
  // l'archivio: ritrovare una spesa di qualche mese fa era il limite piu
  // fastidioso dell'app.
  const cercato = ricerca.trim()
  const ricercaGlobale = cercato.length >= 2
  const idCategorieCoincidenti = useMemo(
    () =>
      ricercaGlobale
        ? (categorie ?? []).filter((c) => normalizza(c.nome).includes(normalizza(cercato))).map((c) => c.id)
        : [],
    [categorie, cercato, ricercaGlobale],
  )

  const delMese = useLiveQuery(() => (ricercaGlobale ? undefined : movimentiDelMese(mese)), [mese, ricercaGlobale])
  const globali = useLiveQuery(
    () => (ricercaGlobale ? cercaMovimenti(cercato, idCategorieCoincidenti) : undefined),
    [cercato, ricercaGlobale, idCategorieCoincidenti],
  )
  const movimenti = ricercaGlobale ? globali : delMese

  const filtrati = useMemo(() => {
    if (!movimenti) return []
    let lista = movimenti
    if (tipo !== 'tutti') lista = lista.filter((m) => m.tipo === tipo)
    if (categoriaId) lista = lista.filter((m) => m.categoriaId === categoriaId)
    // Nella ricerca globale il filtro per testo l'ha gia applicato il database.
    if (!ricercaGlobale && cercato)
      lista = lista.filter((m) => contiene(m.descrizione ?? '', cercato) || contiene(perId.get(m.categoriaId)?.nome ?? '', cercato))
    if (ordine === 'importo') lista = [...lista].sort((a, b) => b.importo - a.importo)
    return lista
  }, [movimenti, tipo, categoriaId, cercato, ricercaGlobale, ordine, perId])

  const categorieFiltro = (categorie ?? []).filter((c) => tipo === 'tutti' || c.tipo === tipo)
  const TIPI = ['tutti', 'uscita', 'entrata'] as const
  const gruppoTipo = useGruppoRadio(TIPI.indexOf(tipo), (i) => impostaTipo(TIPI[i]))

  return (
    <>
      <div className="flex items-center justify-between py-2">
        <SelettoreMese />
        <button
          type="button"
          onClick={() => setDatiAperto(true)}
          aria-label="Dati: importa, esporta, backup"
          className="grid size-9 place-items-center rounded-ctrl text-inchiostro-2 hover:bg-filetto-leggero active:bg-filetto"
        >
          <Database className="size-[18px]" />
        </button>
      </div>

      {/* Ricerca e filtri sono un cluster solo: prima galleggiavano sciolti sulla carta */}
      <div className="mt-1 rounded-[18px] bg-foglio p-3 md:p-3.5 dark:ring-1 dark:ring-filetto-leggero">
      <label className="flex h-11 items-center gap-2 rounded-ctrl bg-carta px-3 text-sm focus-within:ring-1 focus-within:ring-cobalto">
        <Search className="size-4 shrink-0 text-inchiostro-2" aria-hidden="true" />
        <input
          type="search"
          value={ricerca}
          onChange={(e) => setRicerca(e.target.value)}
          placeholder="Cerca in tutti i mesi"
          aria-label="Cerca in tutti i mesi"
          className="w-full min-w-0 bg-transparent outline-none placeholder:text-inchiostro-2"
        />
      </label>

      <div className="-mx-3 mt-2.5 flex gap-2 overflow-x-auto px-3 pb-0.5 [scrollbar-width:none]">
        <div {...gruppoTipo.propsGruppo} role="radiogroup" aria-label="Tipo" className="flex gap-2">
          {TIPI.map((t, i) => (
            <Chip
              key={t}
              attivo={tipo === t}
              onClick={() => impostaTipo(t)}
              role="radio"
              ariaChecked={tipo === t}
              tabIndex={gruppoTipo.tabIndex(i)}
            >
              {t === 'tutti' ? 'Tutti' : t === 'uscita' ? 'Uscite' : 'Entrate'}
            </Chip>
          ))}
        </div>
        <select
          value={categoriaId}
          onChange={(e) => impostaCategoria(e.target.value)}
          aria-label="Categoria"
          className={cn(
            'h-9 shrink-0 appearance-none rounded-ctrl border bg-foglio px-3 text-sm',
            categoriaId ? 'border-cobalto font-medium text-cobalto' : 'border-filetto',
          )}
        >
          <option value="">Tutte le categorie</option>
          {tipo === 'tutti' ? (
            (['uscita', 'entrata'] as const).map((t) => (
              <optgroup key={t} label={t === 'uscita' ? 'Uscite' : 'Entrate'}>
                {categorieFiltro
                  .filter((c) => c.tipo === t)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
              </optgroup>
            ))
          ) : (
            categorieFiltro.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))
          )}
        </select>
        <Chip attivo={ordine === 'importo'} onClick={() => setOrdine(ordine === 'data' ? 'importo' : 'data')}>
          <ArrowDownUp className="size-3.5" aria-hidden="true" />
          {ordine === 'data' ? 'Per data' : 'Per importo'}
        </Chip>
      </div>
      </div>

      {ricercaGlobale && filtrati.length > 0 && (
        <p className="num mt-3.5 text-xs text-inchiostro-2">
          {filtrati.length === 1 ? 'Un risultato' : `${filtrati.length} risultati`} in tutti i mesi ·{' '}
          <button type="button" onClick={() => setRicerca('')} className="font-medium text-cobalto">
            torna a {formatMese(mese)}
          </button>
        </p>
      )}

      {movimenti === undefined ? null : ricercaGlobale ? (
        filtrati.length === 0 ? (
          <Vuoto>Nessun movimento contiene “{cercato}”, in nessun mese.</Vuoto>
        ) : (
          <Lista>
            {filtrati.map((m) => (
              <RigaMovimento key={m.id} movimento={m} categoria={perId.get(m.categoriaId)} mostraData conAnno />
            ))}
          </Lista>
        )
      ) : movimenti.length === 0 ? (
        <Vuoto>
          Nessun movimento questo mese.{' '}
          <button type="button" onClick={() => apriNuovo()} className="font-medium text-cobalto">
            Aggiungi il primo
          </button>
        </Vuoto>
      ) : filtrati.length === 0 ? (
        <Vuoto>Nessun movimento corrisponde ai filtri.</Vuoto>
      ) : ordine === 'data' ? (
        <ListaPerGiorno movimenti={filtrati} perId={perId} />
      ) : (
        <Lista>
          {filtrati.map((m) => (
            <RigaMovimento key={m.id} movimento={m} categoria={perId.get(m.categoriaId)} mostraData />
          ))}
        </Lista>
      )}

      <PannelloDati
        aperto={datiAperto}
        onChiudi={() => setDatiAperto(false)}
        filtrati={filtrati}
        perId={perId}
        descrizioneFiltro={[
          ricercaGlobale ? 'tutti i mesi' : formatMese(mese),
          tipo === 'tutti' ? null : tipo === 'uscita' ? 'solo uscite' : 'solo entrate',
          categoriaId ? perId.get(categoriaId)?.nome : null,
          cercato ? `"${cercato}"` : null,
        ]
          .filter(Boolean)
          .join(', ')}
      />
    </>
  )
}

function ListaPerGiorno({ movimenti, perId }: { movimenti: Movimento[]; perId: Map<string, Categoria> }) {
  const giorni = useMemo(() => {
    const mappa = new Map<string, Movimento[]>()
    for (const m of movimenti) {
      const g = mappa.get(m.data)
      if (g) g.push(m)
      else mappa.set(m.data, [m])
    }
    return [...mappa.entries()]
  }, [movimenti])

  return (
    <Lista>
      {giorni.map(([data, lista], i) => {
        const t = totali(lista)
        return (
          <section key={data} className={i > 0 ? 'mt-5' : undefined}>
            <h2 className="num flex items-baseline justify-between gap-3 pb-1.5 text-xs text-inchiostro-2">
              <span>{formatDataLunga(data)}</span>
              <span className={cn('font-medium', t.saldo > 0 && 'text-verde')}>
                {formatImporto(t.saldo, { segno: 'sempre' })}
              </span>
            </h2>
            {lista.map((m) => (
              <RigaMovimento key={m.id} movimento={m} categoria={perId.get(m.categoriaId)} />
            ))}
          </section>
        )
      })}
    </Lista>
  )
}

/** Il registro sta su foglio, come i blocchi del report. */
function Lista({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-[18px] bg-foglio px-5 py-4 md:px-6 md:py-5 dark:ring-1 dark:ring-filetto-leggero">
      {children}
    </div>
  )
}

function Vuoto({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 rounded-[18px] bg-foglio px-5 py-16 text-center text-sm text-inchiostro-2 dark:ring-1 dark:ring-filetto-leggero">
      {children}
    </p>
  )
}

function Chip({
  attivo,
  onClick,
  children,
  role,
  ariaChecked,
  tabIndex,
}: {
  attivo: boolean
  onClick: () => void
  children: React.ReactNode
  role?: string
  ariaChecked?: boolean
  tabIndex?: number
}) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={ariaChecked}
      tabIndex={tabIndex}
      onClick={onClick}
      className={cn(
        'flex h-9 shrink-0 items-center gap-1.5 rounded-ctrl border bg-foglio px-3 text-sm whitespace-nowrap',
        attivo ? 'border-cobalto font-medium text-cobalto' : 'border-filetto',
      )}
    >
      {children}
    </button>
  )
}
