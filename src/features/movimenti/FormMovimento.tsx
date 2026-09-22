import { zodResolver } from '@hookform/resolvers/zod'
import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useRef } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { useToast } from '@/components/useToast'
import { IconaCategoria } from '@/components/IconaCategoria'
import { Sheet } from '@/components/ui/Sheet'
import { db } from '@/db/db'
import { aggiungiMovimento, aggiornaMovimento } from '@/db/movimenti'
import { aggiungiRegola, esisteRegola } from '@/db/regole'
import type { Movimento, TipoMovimento } from '@/db/tipi'
import { applicaRegole } from '@/lib/calcoli'
import { cn } from '@/lib/cn'
import { coloreCss } from '@/lib/colori'
import { giorniNelMese, meseCorrente, oggiIso } from '@/lib/date'
import { centesimiInInput, parseImporto } from '@/lib/importi'
import { testoPerRegola } from '@/lib/testo'

function fineMeseCorrente(): string {
  const m = meseCorrente()
  return `${m}-${String(giorniNelMese(m)).padStart(2, '0')}`
}

const schema = z.object({
  tipo: z.enum(['entrata', 'uscita']),
  importo: z.string().refine(
    (v) => {
      const c = parseImporto(v)
      return c !== null && c > 0
    },
    { message: 'Inserisci un importo maggiore di zero' },
  ),
  categoriaId: z.string().min(1, 'Scegli una categoria'),
  data: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Inserisci una data')
    .refine((d) => d <= fineMeseCorrente(), { message: 'La data non può essere in un mese futuro' }),
  descrizione: z.string().max(100, 'Massimo 100 caratteri'),
})

type Valori = z.infer<typeof schema>

interface Props {
  aperto: boolean
  movimento?: Movimento
  tipoIniziale?: TipoMovimento
  onChiudi: () => void
  onElimina: (id: string) => Promise<void>
}

export function FormMovimento({ aperto, movimento, tipoIniziale, onChiudi, onElimina }: Props) {
  const { mostra } = useToast()
  const campoImporto = useRef<HTMLInputElement>(null)
  const modifica = movimento !== undefined

  const { control, register, handleSubmit, setValue, reset, formState } = useForm<Valori>({
    resolver: zodResolver(schema),
    defaultValues: valoriIniziali(movimento, tipoIniziale),
  })
  const tipo = useWatch({ control, name: 'tipo' })
  const categoriaId = useWatch({ control, name: 'categoriaId' })

  // Ogni apertura riparte dai valori giusti (nuovo → uscita/oggi, modifica → il movimento)
  useEffect(() => {
    if (aperto) reset(valoriIniziali(movimento, tipoIniziale))
  }, [aperto, movimento, tipoIniziale, reset])

  const categorie = useLiveQuery(() => db.categorie.where('tipo').equals(tipo).sortBy('ordine'), [tipo])

  // Cambiando tipo, una categoria dell'altro tipo non è più valida
  useEffect(() => {
    if (categoriaId && categorie && !categorie.some((c) => c.id === categoriaId)) {
      setValue('categoriaId', '')
    }
  }, [categorie, categoriaId, setValue])

  const salva = handleSubmit(async (v) => {
    const dati = {
      tipo: v.tipo,
      importo: parseImporto(v.importo)!,
      categoriaId: v.categoriaId,
      data: v.data,
      descrizione: v.descrizione,
    }
    if (modifica) {
      await aggiornaMovimento(movimento.id, dati)
      const testo = testoPerRegola(v.descrizione)
      // Categoria corretta su un movimento importato: proponi una regola per la prossima volta
      if (movimento.origine === 'import' && movimento.categoriaId !== v.categoriaId && testo && !(await esisteRegola(testo))) {
        const nomeCat = categorie?.find((c) => c.id === v.categoriaId)?.nome ?? 'questa categoria'
        mostra(`Assegnare sempre "${testo}" a ${nomeCat}?`, {
          etichetta: 'Crea regola',
          esegui: () => void aggiungiRegola(testo, v.categoriaId),
        }, 7000)
      } else {
        mostra('Modifiche salvate', undefined, 2500)
      }
    } else {
      await aggiungiMovimento(dati)
      mostra(v.tipo === 'uscita' ? 'Spesa aggiunta' : 'Entrata aggiunta', undefined, 2500)
    }
    onChiudi()
  })

  // Descrizione senza categoria scelta: prova le regole di categorizzazione
  const suggerisciCategoria = async (descrizione: string) => {
    if (categoriaId) return
    const regole = await db.regole.toArray()
    const id = applicaRegole(descrizione, regole)
    if (id && categorie?.some((c) => c.id === id)) setValue('categoriaId', id)
  }

  const titolo = modifica ? 'Modifica movimento' : tipo === 'uscita' ? 'Aggiungi spesa' : 'Aggiungi entrata'
  const errori = formState.errors
  const importoReg = register('importo')

  return (
    <Sheet aperto={aperto} onChiudi={onChiudi} titolo={titolo} focusIniziale={campoImporto}>
      <form onSubmit={salva} noValidate className="flex flex-col">
        {/* Tipo */}
        <Controller
          control={control}
          name="tipo"
          render={({ field }) => (
            <div role="radiogroup" aria-label="Tipo" className="grid grid-cols-2 rounded-lg bg-carta p-[3px] text-sm font-medium">
              {(['uscita', 'entrata'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={field.value === t}
                  onClick={() => field.onChange(t)}
                  className={cn(
                    'rounded-ctrl py-2 text-inchiostro-2 transition-colors',
                    field.value === t && 'bg-foglio text-inchiostro shadow-[0_1px_2px_rgba(0,0,0,0.12)]',
                  )}
                >
                  {t === 'uscita' ? 'Uscita' : 'Entrata'}
                </button>
              ))}
            </div>
          )}
        />

        {/* Importo */}
        <label className="mt-5 flex items-baseline gap-2 border-b border-filetto pb-3">
          <span className="font-display text-lg text-inchiostro-2">€</span>
          <input
            {...importoReg}
            ref={(el) => {
              importoReg.ref(el)
              campoImporto.current = el
            }}
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
        <Errore messaggio={errori.importo?.message} />

        {/* Categoria */}
        <Controller
          control={control}
          name="categoriaId"
          render={({ field }) => (
            <div role="radiogroup" aria-label="Categoria" className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))] gap-2">
              {(categorie ?? []).map((c) => {
                const attiva = field.value === c.id
                return (
                  <button
                    key={c.id}
                    type="button"
                    role="radio"
                    aria-checked={attiva}
                    onClick={() => field.onChange(c.id)}
                    className={cn(
                      'flex min-h-11 items-center gap-2 rounded-ctrl border border-filetto px-2.5 py-2 text-left text-sm font-medium active:bg-carta',
                      attiva && 'border-cobalto ring-1 ring-cobalto ring-inset',
                      c.diSistema && 'text-inchiostro-2',
                    )}
                  >
                    <IconaCategoria nome={c.icona} className="size-4 shrink-0" style={{ color: coloreCss(c.colore) }} />
                    <span className="truncate">{c.nome}</span>
                  </button>
                )
              })}
            </div>
          )}
        />
        <Errore messaggio={errori.categoriaId?.message} />

        {/* Data e descrizione */}
        <div className="mt-4 grid grid-cols-[1fr_1.4fr] gap-2">
          <div>
            <input
              {...register('data')}
              type="date"
              max={fineMeseCorrente()}
              aria-label="Data"
              aria-invalid={!!errori.data}
              className="h-11 w-full min-w-0 rounded-ctrl border border-filetto bg-foglio px-3 text-sm"
            />
            <Errore messaggio={errori.data?.message} />
          </div>
          <div>
            <input
              {...register('descrizione', { onBlur: (e) => void suggerisciCategoria(e.target.value) })}
              type="text"
              placeholder="Descrizione"
              aria-label="Descrizione"
              autoComplete="off"
              enterKeyHint="done"
              maxLength={100}
              className="h-11 w-full rounded-ctrl border border-filetto bg-foglio px-3 text-sm placeholder:text-inchiostro-2"
            />
            <Errore messaggio={errori.descrizione?.message} />
          </div>
        </div>

        <button
          type="submit"
          disabled={formState.isSubmitting}
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
    </Sheet>
  )
}

function valoriIniziali(m: Movimento | undefined, tipoIniziale: TipoMovimento | undefined): Valori {
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
