import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowDownUp, Database, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { SelettoreMese } from '@/components/SelettoreMese'
import { bordoSuTestata, TestataPagina } from '@/components/TestataPagina'
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
      {/* La testata del mese: tendina, dati e ricerca. */}
      <TestataPagina>
        <div className="flex items-center justify-between gap-3">
          <SelettoreMese />
          <button
            type="button"
            onClick={() => setDatiAperto(true)}
            aria-label="Dati: importa, esporta, backup"
            className="grid size-11 place-items-center rounded-ctrl opacity-85 hover:opacity-100 active:bg-[color-mix(in_srgb,currentColor_12%,transparent)]"
          >
            <Database className="size-[19px]" />
          </button>
        </div>
        <label
          className={cn(
            'mt-3 flex h-11 items-center gap-2 rounded-ctrl px-3 focus-within:outline-2 focus-within:outline-current',
            bordoSuTestata,
          )}
        >
          <Search className="size-4 shrink-0 text-blocco-testo-2" aria-hidden="true" />
          <input
            type="search"
            value={ricerca}
            onChange={(e) => setRicerca(e.target.value)}
            placeholder="Cerca in tutti i mesi"
            aria-label="Cerca in tutti i mesi"
            className="w-full min-w-0 bg-transparent text-base outline-none placeholder:text-blocco-testo-2"
          />
        </label>
      </TestataPagina>

      {/* I filtri, sulla carta: scorrono in orizzontale se non ci stanno */}
      <div className="-mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-0.5 [scrollbar-width:none] md:mx-0 md:px-0">
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
            // 16px: sotto i 16 iPhone ingrandisce la pagina al tocco e ci resta
            'h-11 shrink-0 appearance-none rounded-ctrl border bg-carta px-3.5 text-base',
            categoriaId ? 'border-accento font-bold text-accento' : 'border-filetto text-inchiostro-2',
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

      {ricercaGlobale && filtrati.length > 0 && (
        <p className="num mt-3 text-xs text-inchiostro-2">
          {filtrati.length === 1 ? 'Un risultato' : `${filtrati.length} risultati`} in tutti i mesi ·{' '}
          <button type="button" onClick={() => setRicerca('')} className="min-h-11 font-bold text-accento">
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
          <button type="button" onClick={() => apriNuovo()} className="min-h-11 font-bold text-accento">
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
          <section key={data} className={i > 0 ? 'mt-6' : undefined}>
            {/* L'intestazione del giorno: data in Bitter, e il saldo del giorno sopra la colonna degli importi */}
            <h2 className="num flex items-baseline justify-between gap-3 border-b border-accento pb-1.5">
              <span className="font-display text-[17px]" style={{ fontWeight: 'var(--peso-titoli)' }}>
                {formatDataLunga(data)}
              </span>
              <span className={cn('font-display text-sm', t.saldo > 0 ? 'text-verde' : 'text-inchiostro-2')} style={{ fontWeight: 'var(--peso-importi)' }}>
                {formatImporto(t.saldo, { simbolo: false, segno: 'sempre' })}
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

/** Il registro sta sulla carta, come nel report: niente scheda intorno. */
function Lista({ children }: { children: React.ReactNode }) {
  return <div className="mt-5">{children}</div>
}

function Vuoto({ children }: { children: React.ReactNode }) {
  return <p className="mt-5 border-t border-accento px-2 py-14 text-center text-sm text-inchiostro-2">{children}</p>
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
        'flex h-11 shrink-0 items-center gap-1.5 rounded-ctrl border px-3.5 text-sm whitespace-nowrap transition-colors',
        // il filtro scelto prende la campitura del mese, come la scheda attiva in basso
        attivo
          ? 'accento border-accento font-bold'
          : 'border-filetto bg-carta text-inchiostro-2 active:bg-filetto-leggero',
      )}
    >
      {children}
    </button>
  )
}
