import { useRef, useState } from 'react'
import { Sheet } from '@/components/ui/Sheet'
import { useToast } from '@/components/useToast'
import { aggiornaRegola, aggiungiRegola, eliminaRegola } from '@/db/regole'
import type { Categoria, RegolaCategoria } from '@/db/tipi'

interface Props {
  aperto: boolean
  regola?: RegolaCategoria
  /** valori proposti per una regola nuova (es. dal form movimento) */
  proposta?: { contiene: string; categoriaId: string }
  categorie: Categoria[]
  onChiudi: () => void
}

/** "Se la descrizione contiene X → categoria Y". */
export function FormRegola({ aperto, regola, proposta, categorie, onChiudi }: Props) {
  const campo = useRef<HTMLInputElement>(null)
  return (
    <Sheet
      aperto={aperto}
      onChiudi={onChiudi}
      titolo={regola ? 'Modifica regola' : 'Nuova regola'}
      focusIniziale={campo}
    >
      {aperto && <Corpo regola={regola} proposta={proposta} categorie={categorie} campo={campo} onChiudi={onChiudi} />}
    </Sheet>
  )
}

function Corpo({
  regola,
  proposta,
  categorie,
  campo,
  onChiudi,
}: Omit<Props, 'aperto'> & { campo: React.RefObject<HTMLInputElement | null> }) {
  const { mostra } = useToast()
  const [contiene, setContiene] = useState(regola?.contiene ?? proposta?.contiene ?? '')
  const [categoriaId, setCategoriaId] = useState(regola?.categoriaId ?? proposta?.categoriaId ?? '')
  const [errore, setErrore] = useState<string | null>(null)

  const salva = async (e: React.FormEvent) => {
    e.preventDefault()
    if (contiene.trim().length < 2) {
      setErrore('Scrivi almeno due caratteri')
      campo.current?.focus()
      return
    }
    if (!categoriaId) {
      setErrore('Scegli una categoria')
      return
    }
    if (regola) await aggiornaRegola(regola.id, contiene, categoriaId)
    else await aggiungiRegola(contiene, categoriaId)
    mostra(regola ? 'Regola aggiornata' : 'Regola creata', undefined, 2500)
    onChiudi()
  }

  const uscite = categorie.filter((c) => c.tipo === 'uscita')
  const entrate = categorie.filter((c) => c.tipo === 'entrata')

  return (
    <form onSubmit={salva} noValidate className="flex flex-col">
      <h2 className="font-display text-lg font-semibold">{regola ? 'Modifica regola' : 'Nuova regola'}</h2>
      <p className="mt-1 text-sm text-inchiostro-2">
        Quando la descrizione di un movimento contiene questo testo, la categoria viene assegnata da sola.
      </p>

      <label className="mt-4 text-xs text-inchiostro-2">
        Se la descrizione contiene
        <input
          ref={campo}
          value={contiene}
          onChange={(e) => {
            setContiene(e.target.value)
            setErrore(null)
          }}
          placeholder="es. conad"
          autoComplete="off"
          enterKeyHint="done"
          maxLength={60}
          className="mt-1 h-11 w-full rounded-ctrl border border-filetto bg-foglio px-3 text-base text-inchiostro placeholder:text-inchiostro-2"
        />
      </label>

      <label className="mt-3 text-xs text-inchiostro-2">
        Assegna la categoria
        <select
          value={categoriaId}
          onChange={(e) => {
            setCategoriaId(e.target.value)
            setErrore(null)
          }}
          className="mt-1 h-11 w-full rounded-ctrl border border-filetto bg-foglio px-3 text-base text-inchiostro"
        >
          <option value="">Scegli…</option>
          <optgroup label="Uscite">
            {uscite.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </optgroup>
          <optgroup label="Entrate">
            {entrate.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </optgroup>
        </select>
      </label>
      {errore && (
        <p role="alert" className="mt-1.5 text-xs font-medium text-rosso">
          {errore}
        </p>
      )}

      <button
        type="submit"
        className="mt-5 h-12 rounded-lg bg-cobalto text-base font-bold text-cobalto-testo active:brightness-95"
      >
        {regola ? 'Salva modifiche' : 'Crea regola'}
      </button>
      {regola && (
        <button
          type="button"
          onClick={async () => {
            await eliminaRegola(regola.id)
            mostra('Regola eliminata', undefined, 2500)
            onChiudi()
          }}
          className="mt-2 h-11 rounded-lg text-sm font-medium text-rosso active:bg-carta"
        >
          Elimina regola
        </button>
      )}
    </form>
  )
}
