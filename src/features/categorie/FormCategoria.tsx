import { useRef, useState } from 'react'
import { IconaCategoria } from '@/components/IconaCategoria'
import { ICONE_CATEGORIA } from '@/components/icone'
import { Sheet } from '@/components/ui/Sheet'
import { useGruppoRadio } from '@/components/ui/useGruppoRadio'
import { useToast } from '@/components/useToast'
import { aggiornaCategoria, aggiungiCategoria } from '@/db/categorie'
import type { Categoria, ColoreCategoria, TipoMovimento } from '@/db/tipi'
import { cn } from '@/lib/cn'
import { conAvviso } from '@/lib/errori'
import { COLORI_TAVOLOZZA, coloreCss } from '@/lib/colori'
import { centesimiInInput, parseImporto } from '@/lib/importi'

interface Props {
  aperto: boolean
  /** categoria da modificare; assente = nuova */
  categoria?: Categoria
  tipo: TipoMovimento
  onChiudi: () => void
}

const NOMI_ICONE = Object.keys(ICONE_CATEGORIA).filter((n) => n !== 'circle-dashed')

export function FormCategoria({ aperto, categoria, tipo, onChiudi }: Props) {
  const campoNome = useRef<HTMLInputElement>(null)
  const titolo = categoria
    ? 'Modifica categoria'
    : tipo === 'uscita'
      ? 'Nuova categoria di uscita'
      : 'Nuova categoria di entrata'
  return (
    <Sheet aperto={aperto} onChiudi={onChiudi} titolo={titolo} focusIniziale={campoNome}>
      {/* Il corpo viene montato a ogni apertura: lo stato riparte pulito senza effetti */}
      {aperto && <Corpo categoria={categoria} tipo={tipo} titolo={titolo} campoNome={campoNome} onChiudi={onChiudi} />}
    </Sheet>
  )
}

function Corpo({
  categoria,
  tipo,
  titolo,
  campoNome,
  onChiudi,
}: {
  categoria?: Categoria
  tipo: TipoMovimento
  titolo: string
  campoNome: React.RefObject<HTMLInputElement | null>
  onChiudi: () => void
}) {
  const { mostra, errore: avvisaErrore } = useToast()
  const [nome, setNome] = useState(categoria?.nome ?? '')
  const [colore, setColore] = useState<ColoreCategoria>(categoria?.colore ?? (tipo === 'entrata' ? 'verde' : 'c1'))
  const [icona, setIcona] = useState(categoria?.icona ?? (tipo === 'entrata' ? 'hand-coins' : 'shopping-basket'))
  const [budget, setBudget] = useState(categoria?.budget ? centesimiInInput(categoria.budget) : '')
  const [errore, setErrore] = useState<string | null>(null)
  const modifica = categoria !== undefined

  const salva = async (e: React.FormEvent) => {
    e.preventDefault()
    if (nome.trim().length === 0) {
      setErrore('Dai un nome alla categoria')
      campoNome.current?.focus()
      return
    }
    // Campo vuoto = nessun tetto. Un testo che non è un importo è un errore, non uno zero.
    let tetto: number | undefined
    if (tipo === 'uscita' && budget.trim() !== '') {
      const c = parseImporto(budget)
      if (c === null || c <= 0) {
        setErrore('Il budget deve essere un importo maggiore di zero (oppure lascialo vuoto)')
        return
      }
      tetto = c
    }

    if (modifica) {
      const fatto = await conAvviso(
        () => aggiornaCategoria(categoria.id, { nome, colore, icona, budget: tetto }),
        'salvare la categoria',
        avvisaErrore,
      )
      if (!fatto) return
      mostra('Categoria aggiornata', undefined, 2500)
    } else {
      const fatto = await conAvviso(
        () => aggiungiCategoria({ nome, tipo, colore, icona, budget: tetto }),
        'creare la categoria',
        avvisaErrore,
      )
      if (!fatto) return
      mostra('Categoria creata', undefined, 2500)
    }
    onChiudi()
  }

  const colori: ColoreCategoria[] = tipo === 'entrata' ? ['verde', ...COLORI_TAVOLOZZA] : COLORI_TAVOLOZZA
  const gruppoColore = useGruppoRadio(colori.indexOf(colore), (i) => setColore(colori[i]))
  const gruppoIcona = useGruppoRadio(NOMI_ICONE.indexOf(icona), (i) => setIcona(NOMI_ICONE[i]))

  return (
    <form onSubmit={salva} noValidate className="flex flex-col">
      <h2 className="font-display text-lg font-semibold">{titolo}</h2>

      {/* Anteprima + nome */}
      <div className="mt-4 flex items-center gap-3">
        <span className="riquadro size-11 shrink-0" style={{ color: coloreCss(colore) }} aria-hidden="true">
          <IconaCategoria nome={icona} className="size-5" />
        </span>
        <input
          ref={campoNome}
          value={nome}
          onChange={(e) => {
            setNome(e.target.value)
            setErrore(null)
          }}
          placeholder="Nome della categoria"
          aria-label="Nome"
          aria-invalid={!!errore}
          maxLength={30}
          autoComplete="off"
          enterKeyHint="done"
          className="h-11 w-full rounded-ctrl border border-filetto bg-foglio px-3 text-base placeholder:text-inchiostro-2"
        />
      </div>
      {errore && (
        <p role="alert" className="mt-1.5 text-xs font-medium text-rosso">
          {errore}
        </p>
      )}

      {/*
        Il budget sta prima di colore e icona: è la scelta che cambia qualcosa
        nel report, mentre dopo la griglia delle icone, su telefono, bisognava
        scorrerne cinquanta per scoprire che esisteva.
      */}
      {tipo === 'uscita' && (
        <>
          <label className="mt-5 block text-xs text-inchiostro-2" htmlFor="campo-budget">
            Budget mensile <span className="text-inchiostro-2">(facoltativo)</span>
          </label>
          <div className="mt-1 flex h-11 items-center gap-2 rounded-ctrl border border-filetto bg-foglio px-3 focus-within:border-cobalto">
            <span className="text-inchiostro-2">€</span>
            <input
              id="campo-budget"
              value={budget}
              onChange={(e) => {
                setBudget(e.target.value)
                setErrore(null)
              }}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              enterKeyHint="done"
              placeholder="nessun tetto"
              className="num w-full min-w-0 bg-transparent text-base outline-none placeholder:text-inchiostro-2"
            />
          </div>
          <p className="mt-1 text-xs text-inchiostro-2">
            Con un tetto, il report mostra quanto ne resta e se il ritmo di spesa regge.
          </p>
        </>
      )}

      {/* Colore */}
      <p className="mt-5 text-xs text-inchiostro-2">Colore</p>
      <div {...gruppoColore.propsGruppo} role="radiogroup" aria-label="Colore" className="mt-2 flex flex-wrap gap-2.5">
        {colori.map((c, i) => (
          <button
            key={c}
            type="button"
            role="radio"
            tabIndex={gruppoColore.tabIndex(i)}
            aria-checked={colore === c}
            aria-label={`Colore ${c}`}
            onClick={() => setColore(c)}
            className={cn(
              'size-8 rounded-full',
              colore === c && 'ring-2 ring-cobalto ring-offset-2 ring-offset-foglio',
            )}
            style={{ background: coloreCss(c) }}
          />
        ))}
      </div>

      {/* Icona */}
      <p className="mt-5 text-xs text-inchiostro-2">Icona</p>
      <div
        {...gruppoIcona.propsGruppo}
        role="radiogroup"
        aria-label="Icona"
        className="mt-2 grid grid-cols-6 gap-1.5 md:grid-cols-8"
      >
        {NOMI_ICONE.map((n, i) => (
          <button
            key={n}
            type="button"
            role="radio"
            tabIndex={gruppoIcona.tabIndex(i)}
            aria-checked={icona === n}
            aria-label={n}
            onClick={() => setIcona(n)}
            className={cn(
              'grid aspect-square place-items-center rounded-ctrl border active:bg-carta',
              icona === n
                ? 'border-cobalto text-inchiostro ring-1 ring-cobalto ring-inset'
                : 'border-filetto text-inchiostro-2',
            )}
          >
            <IconaCategoria nome={n} className="size-[18px]" />
          </button>
        ))}
      </div>

      <button
        type="submit"
        className="mt-6 h-12 rounded-lg bg-cobalto text-base font-bold text-cobalto-testo active:brightness-95"
      >
        {modifica ? 'Salva modifiche' : 'Crea categoria'}
      </button>
    </form>
  )
}
