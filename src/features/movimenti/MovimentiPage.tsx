import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowDownUp, Database, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { SelettoreMese } from '@/components/SelettoreMese'
import { db } from '@/db/db'
import { movimentiDelMese } from '@/db/movimenti'
import type { Categoria, Movimento } from '@/db/tipi'
import { totali } from '@/lib/calcoli'
import { cn } from '@/lib/cn'
import { formatDataLunga, formatMese } from '@/lib/date'
import { formatImporto } from '@/lib/importi'
import { useMeseSelezionato } from '@/lib/mese'
import { contiene } from '@/lib/testo'
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

  const movimenti = useLiveQuery(() => movimentiDelMese(mese), [mese])
  const categorie = useLiveQuery(() => db.categorie.orderBy('ordine').toArray())
  const perId = useMemo(() => new Map((categorie ?? []).map((c) => [c.id, c])), [categorie])

  const filtrati = useMemo(() => {
    if (!movimenti) return []
    let lista = movimenti
    if (tipo !== 'tutti') lista = lista.filter((m) => m.tipo === tipo)
    if (categoriaId) lista = lista.filter((m) => m.categoriaId === categoriaId)
    if (ricerca.trim()) lista = lista.filter((m) => contiene(m.descrizione ?? '', ricerca) || contiene(perId.get(m.categoriaId)?.nome ?? '', ricerca))
    if (ordine === 'importo') lista = [...lista].sort((a, b) => b.importo - a.importo)
    return lista
  }, [movimenti, tipo, categoriaId, ricerca, ordine, perId])

  const categorieFiltro = (categorie ?? []).filter((c) => tipo === 'tutti' || c.tipo === tipo)

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

      <label className="mt-1 flex h-10 items-center gap-2 rounded-ctrl border border-filetto bg-foglio px-3 text-sm focus-within:border-cobalto">
        <Search className="size-4 shrink-0 text-inchiostro-2" aria-hidden="true" />
        <input
          type="search"
          value={ricerca}
          onChange={(e) => setRicerca(e.target.value)}
          placeholder="Cerca nella descrizione"
          aria-label="Cerca nella descrizione"
          className="w-full min-w-0 bg-transparent outline-none placeholder:text-inchiostro-2"
        />
      </label>

      <div className="-mx-5 mt-2.5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] md:mx-0 md:px-0">
        <div role="radiogroup" aria-label="Tipo" className="flex gap-2">
          {(['tutti', 'uscita', 'entrata'] as const).map((t) => (
            <Chip key={t} attivo={tipo === t} onClick={() => impostaTipo(t)} role="radio" ariaChecked={tipo === t}>
              {t === 'tutti' ? 'Tutti' : t === 'uscita' ? 'Uscite' : 'Entrate'}
            </Chip>
          ))}
        </div>
        <select
          value={categoriaId}
          onChange={(e) => impostaCategoria(e.target.value)}
          aria-label="Categoria"
          className={cn(
            'h-9 shrink-0 appearance-none rounded-ctrl border border-filetto bg-foglio px-3 text-sm',
            categoriaId && 'border-cobalto font-medium text-cobalto',
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

      {movimenti === undefined ? null : movimenti.length === 0 ? (
        <p className="py-16 text-center text-sm text-inchiostro-2">
          Nessun movimento questo mese.{' '}
          <button type="button" onClick={() => apriNuovo()} className="font-medium text-cobalto">
            Aggiungi il primo
          </button>
        </p>
      ) : filtrati.length === 0 ? (
        <p className="py-16 text-center text-sm text-inchiostro-2">Nessun movimento corrisponde ai filtri.</p>
      ) : ordine === 'data' ? (
        <ListaPerGiorno movimenti={filtrati} perId={perId} />
      ) : (
        <div className="mt-2">
          {filtrati.map((m) => (
            <RigaMovimento key={m.id} movimento={m} categoria={perId.get(m.categoriaId)} mostraData />
          ))}
        </div>
      )}

      <PannelloDati
        aperto={datiAperto}
        onChiudi={() => setDatiAperto(false)}
        filtrati={filtrati}
        perId={perId}
        descrizioneFiltro={[
          formatMese(mese),
          tipo === 'tutti' ? null : tipo === 'uscita' ? 'solo uscite' : 'solo entrate',
          categoriaId ? perId.get(categoriaId)?.nome : null,
          ricerca.trim() ? `"${ricerca.trim()}"` : null,
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
    <div>
      {giorni.map(([data, lista]) => {
        const t = totali(lista)
        return (
          <section key={data}>
            <h2 className="num flex justify-between pt-4 pb-1 text-xs text-inchiostro-2">
              <span>{formatDataLunga(data)}</span>
              <span className={cn(t.saldo > 0 && 'text-verde')}>{formatImporto(t.saldo, { segno: 'sempre' })}</span>
            </h2>
            {lista.map((m) => (
              <RigaMovimento key={m.id} movimento={m} categoria={perId.get(m.categoriaId)} />
            ))}
          </section>
        )
      })}
    </div>
  )
}

function Chip({
  attivo,
  onClick,
  children,
  role,
  ariaChecked,
}: {
  attivo: boolean
  onClick: () => void
  children: React.ReactNode
  role?: string
  ariaChecked?: boolean
}) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={ariaChecked}
      onClick={onClick}
      className={cn(
        'flex h-9 shrink-0 items-center gap-1.5 rounded-ctrl border border-filetto bg-foglio px-3 text-sm whitespace-nowrap',
        attivo && 'border-cobalto font-medium text-cobalto',
      )}
    >
      {children}
    </button>
  )
}
