import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { useToast } from '@/components/useToast'
import { IconaCategoria } from '@/components/IconaCategoria'
import { Sheet } from '@/components/ui/Sheet'
import { db } from '@/db/db'
import { aggiungiMovimento, aggiornaMovimento } from '@/db/movimenti'
import { aggiungiRegola, esisteRegola } from '@/db/regole'
import type { Movimento, TipoMovimento } from '@/db/tipi'
import { applicaRegole } from '@/lib/calcoli'
import { cn } from '@/lib/cn'
import { conAvviso } from '@/lib/errori'
import { coloreCss } from '@/lib/colori'
import { oggiIso } from '@/lib/date'
import { centesimiInInput, parseImporto } from '@/lib/importi'
import { testoPerRegola } from '@/lib/testo'
import { fineMeseCorrente, validaMovimento, type ErroriMovimento, type ValoriMovimento } from './validaMovimento'

interface Props {
  aperto: boolean
  movimento?: Movimento
  tipoIniziale?: TipoMovimento
  onChiudi: () => void
  onElimina: (id: string) => Promise<void>
}

export function FormMovimento({ aperto, movimento, tipoIniziale, onChiudi, onElimina }: Props) {
  const titolo = movimento ? 'Modifica movimento' : 'Aggiungi movimento'

  return (
    <Sheet aperto={aperto} onChiudi={onChiudi} titolo={titolo} senzaFocus>
      {/* Il corpo viene montato a ogni apertura: i valori ripartono puliti senza
          un effetto di reset, come già fanno FormCategoria e FormRegola. */}
      {aperto && (
        <Corpo
          key={movimento?.id ?? `nuovo-${tipoIniziale ?? 'uscita'}`}
          movimento={movimento}
          tipoIniziale={tipoIniziale}
          onChiudi={onChiudi}
          onElimina={onElimina}
        />
      )}
    </Sheet>
  )
}

function Corpo({ movimento, tipoIniziale, onChiudi, onElimina }: Omit<Props, 'aperto'>) {
  const { mostra, errore: avvisaErrore } = useToast()
  const modifica = movimento !== undefined

  const [valori, setValori] = useState<ValoriMovimento>(() => valoriIniziali(movimento, tipoIniziale))
  const [errori, setErrori] = useState<ErroriMovimento>({})
  const [inCorso, setInCorso] = useState(false)

  const categorie = useLiveQuery(() => db.categorie.where('tipo').equals(valori.tipo).sortBy('ordine'), [valori.tipo])

  /** Cambia un campo e ne toglie l'errore: correggerlo deve far sparire il messaggio. */
  function cambia<K extends keyof ValoriMovimento>(campo: K, valore: ValoriMovimento[K]) {
    setValori((v) => ({ ...v, [campo]: valore }))
    setErrori((e) => (e[campo] === undefined ? e : { ...e, [campo]: undefined }))
  }

  /** Cambiare tipo azzera la categoria: quella scelta appartiene all'altro tipo. */
  function cambiaTipo(t: ValoriMovimento['tipo']) {
    setValori((v) => ({ ...v, tipo: t, categoriaId: '' }))
    setErrori({})
  }

  // Una categoria eliminata da un'altra scheda mentre il form è aperto non è più
  // selezionabile: la selezione decade qui, senza un effetto che reimposti lo stato.
  const categoriaId = categorie?.some((c) => c.id === valori.categoriaId) ? valori.categoriaId : ''

  const salva = async (e: React.FormEvent) => {
    e.preventDefault()
    const trovati = validaMovimento({ ...valori, categoriaId })
    if (Object.keys(trovati).length > 0) {
      setErrori(trovati)
      return
    }

    const dati = {
      tipo: valori.tipo,
      importo: parseImporto(valori.importo)!,
      categoriaId,
      data: valori.data,
      descrizione: valori.descrizione,
    }

    setInCorso(true)
    try {
      if (modifica) {
        // Il pannello resta aperto se il salvataggio non riesce: i dati digitati non si perdono.
        const fatto = await conAvviso(() => aggiornaMovimento(movimento.id, dati), 'salvare le modifiche', avvisaErrore)
        if (!fatto) return
        const testo = testoPerRegola(valori.descrizione)
        // Categoria corretta su un movimento importato: proponi una regola per la prossima volta
        if (
          movimento.origine === 'import' &&
          movimento.categoriaId !== categoriaId &&
          testo &&
          !(await esisteRegola(testo).catch(() => true))
        ) {
          const nomeCat = categorie?.find((c) => c.id === categoriaId)?.nome ?? 'questa categoria'
          mostra(
            `Assegnare sempre "${testo}" a ${nomeCat}?`,
            {
              etichetta: 'Crea regola',
              esegui: () => {
                void conAvviso(() => aggiungiRegola(testo, categoriaId), 'creare la regola', avvisaErrore)
              },
            },
            7000,
          )
        } else {
          mostra('Modifiche salvate', undefined, 2500)
        }
      } else {
        const fatto = await conAvviso(() => aggiungiMovimento(dati), 'salvare il movimento', avvisaErrore)
        if (!fatto) return
        mostra(valori.tipo === 'uscita' ? 'Spesa aggiunta' : 'Entrata aggiunta', undefined, 2500)
      }
      onChiudi()
    } finally {
      setInCorso(false)
    }
  }

  // Descrizione scritta senza categoria scelta: prova le regole di categorizzazione
  const suggerisciCategoria = async (descrizione: string) => {
    if (categoriaId) return
    try {
      const regole = await db.regole.toArray()
      const id = applicaRegole(descrizione, regole)
      if (id && categorie?.some((c) => c.id === id)) cambia('categoriaId', id)
    } catch (e) {
      // Suggerimento facoltativo: se le regole non si leggono, l'utente sceglie a mano.
      console.error('Regole non leggibili', e)
    }
  }

  const titolo = modifica ? 'Modifica movimento' : valori.tipo === 'uscita' ? 'Aggiungi spesa' : 'Aggiungi entrata'

  return (
    <form onSubmit={salva} noValidate className="flex flex-col">
      {/* Tipo */}
      <div
        role="radiogroup"
        aria-label="Tipo"
        className="grid grid-cols-2 rounded-lg bg-carta p-[3px] text-sm font-medium"
      >
        {(['uscita', 'entrata'] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={valori.tipo === t}
            onClick={() => cambiaTipo(t)}
            className={cn(
              'rounded-ctrl py-2 transition-colors',
              valori.tipo === t
                ? 'bg-foglio text-inchiostro shadow-[0_1px_2px_rgba(0,0,0,0.12)]'
                : 'text-inchiostro-2',
            )}
          >
            {t === 'uscita' ? 'Uscita' : 'Entrata'}
          </button>
        ))}
      </div>

      {/* Importo */}
      <label className="mt-5 flex items-baseline gap-2 border-b border-filetto pb-3">
        <span className="font-display text-lg text-inchiostro-2">€</span>
        <input
          value={valori.importo}
          onChange={(e) => cambia('importo', e.target.value)}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          enterKeyHint="done"
          placeholder="0,00"
          aria-label="Importo in euro"
          aria-invalid={!!errori.importo}
          className="num w-full min-w-0 bg-transparent font-display text-2xl font-medium tracking-tight outline-none placeholder:text-filetto"
        />
      </label>
      <Errore messaggio={errori.importo} />

      {/* Categoria */}
      <div
        role="radiogroup"
        aria-label="Categoria"
        className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))] gap-2"
      >
        {(categorie ?? []).map((c) => {
          const attiva = categoriaId === c.id
          return (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={attiva}
              onClick={() => cambia('categoriaId', c.id)}
              className={cn(
                'flex min-h-11 items-center gap-2 rounded-ctrl border px-2.5 py-2 text-left text-sm font-medium active:bg-carta',
                attiva ? 'border-cobalto ring-1 ring-cobalto ring-inset' : 'border-filetto',
                c.diSistema && 'text-inchiostro-2',
              )}
            >
              <IconaCategoria nome={c.icona} className="size-4 shrink-0" style={{ color: coloreCss(c.colore) }} />
              <span className="truncate">{c.nome}</span>
            </button>
          )
        })}
      </div>
      <Errore messaggio={errori.categoriaId} />

      {/* Data e descrizione */}
      <div className="mt-4 grid grid-cols-[1fr_1.4fr] gap-2">
        <div>
          <input
            value={valori.data}
            onChange={(e) => cambia('data', e.target.value)}
            type="date"
            max={fineMeseCorrente()}
            aria-label="Data"
            aria-invalid={!!errori.data}
            className="h-11 w-full min-w-0 rounded-ctrl border border-filetto bg-foglio px-3 text-sm"
          />
          <Errore messaggio={errori.data} />
        </div>
        <div>
          <input
            value={valori.descrizione}
            onChange={(e) => cambia('descrizione', e.target.value)}
            onBlur={(e) => void suggerisciCategoria(e.target.value)}
            type="text"
            placeholder="Descrizione"
            aria-label="Descrizione"
            autoComplete="off"
            enterKeyHint="done"
            maxLength={100}
            className="h-11 w-full rounded-ctrl border border-filetto bg-foglio px-3 text-sm placeholder:text-inchiostro-2"
          />
          <Errore messaggio={errori.descrizione} />
        </div>
      </div>

      <button
        type="submit"
        disabled={inCorso}
        className="mt-5 h-12 rounded-lg bg-cobalto text-base font-bold text-cobalto-testo active:brightness-95 disabled:opacity-60"
      >
        {modifica ? 'Salva modifiche' : titolo}
      </button>

      {modifica && (
        <button
          type="button"
          onClick={async () => {
            onChiudi()
            await onElimina(movimento.id)
          }}
          className="mt-2 h-11 rounded-lg text-sm font-medium text-rosso active:bg-carta"
        >
          {movimento.tipo === 'uscita' ? 'Elimina spesa' : 'Elimina entrata'}
        </button>
      )}
    </form>
  )
}

function valoriIniziali(m: Movimento | undefined, tipoIniziale: TipoMovimento | undefined): ValoriMovimento {
  if (m) {
    return {
      tipo: m.tipo,
      importo: centesimiInInput(m.importo),
      categoriaId: m.categoriaId,
      data: m.data,
      descrizione: m.descrizione ?? '',
    }
  }
  return { tipo: tipoIniziale ?? 'uscita', importo: '', categoriaId: '', data: oggiIso(), descrizione: '' }
}

function Errore({ messaggio }: { messaggio?: string }) {
  if (!messaggio) return null
  return (
    <p role="alert" className="mt-1.5 text-xs font-medium text-rosso">
      {messaggio}
    </p>
  )
}
