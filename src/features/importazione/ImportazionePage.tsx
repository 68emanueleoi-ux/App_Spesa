import { useLiveQuery } from 'dexie-react-hooks'
import { FileUp } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useToast } from '@/components/useToast'
import { senzaCategoria } from '@/db/categorie'
import { db } from '@/db/db'
import { chiaviEsistenti, importaMovimenti, mappaturaRicordata, ricordaMappatura } from '@/db/importazione'
import { aggiungiRegole } from '@/db/regole'
import type { Categoria } from '@/db/tipi'
import { applicaRegole, chiaveDuplicato } from '@/lib/calcoli'
import { cn } from '@/lib/cn'
import { conAvviso } from '@/lib/errori'
import {
  analizzaCsv,
  firmaCsv,
  interpretaRighe,
  leggiFileCsv,
  proponiMappatura,
  type Mappatura,
  type ModoTipo,
  type RigaInterpretata,
  type RigaScartata,
  type TabellaCsv,
} from '@/lib/csv'
import { formatDataNumerica, meseDi } from '@/lib/date'
import { eExcel, leggiFileExcel } from '@/lib/excel'
import { formatImportoMovimento } from '@/lib/importi'
import { testoPerRegola } from '@/lib/testo'

interface RigaAnteprima extends RigaInterpretata {
  categoriaId: string
  duplicato: boolean
  includi: boolean
  /** l'utente ha cambiato categoria a mano: proponi di ricordarlo come regola */
  creaRegola: boolean
}

type Passo =
  | { n: 1 }
  | { n: 2; nomeFile: string; tabella: TabellaCsv; firma: string; mappatura: Mappatura }
  | {
      n: 3
      nomeFile: string
      tabella: TabellaCsv
      firma: string
      mappatura: Mappatura
      righe: RigaAnteprima[]
      scartate: RigaScartata[]
    }

export function ImportazionePage() {
  const [passo, setPasso] = useState<Passo>({ n: 1 })
  const [errore, setErrore] = useState<string | null>(null)
  const categorie = useLiveQuery(() => db.categorie.orderBy('ordine').toArray())
  const regole = useLiveQuery(() => db.regole.toArray())
  const navigate = useNavigate()
  const { mostra, errore: avvisaErrore } = useToast()

  const caricaFile = async (file: File) => {
    setErrore(null)
    try {
      const tabella = eExcel(file) ? await leggiFileExcel(file) : analizzaCsv(await leggiFileCsv(file))
      if (tabella.righe.length === 0) {
        setErrore('Il file è vuoto o non contiene righe leggibili.')
        return
      }
      const firma = firmaCsv(tabella.intestazioni)
      const mappatura = (await mappaturaRicordata(firma)) ?? proponiMappatura(tabella)
      setPasso({ n: 2, nomeFile: file.name, tabella, firma, mappatura })
    } catch (e) {
      console.error('Importazione: file non leggibile', e)
      setErrore('Non riesco a leggere questo file. Deve essere un CSV o un Excel (.xlsx).')
    }
  }

  const vaiAllAnteprima = async () => {
    if (passo.n !== 2 || !categorie || !regole) return
    const { valide, scartate } = interpretaRighe(passo.tabella.righe, passo.mappatura)
    let esistenti: Set<string>
    try {
      esistenti = await chiaviEsistenti()
    } catch (e) {
      // Il passo 2 non ha un posto dove mostrare un errore: usa il toast.
      console.error('Deduplica non riuscita', e)
      avvisaErrore('Non riesco a leggere i movimenti già presenti: senza questo controllo rischi dei doppioni. Riprova.')
      return
    }
    const visteNelFile = new Set<string>()
    const righe: RigaAnteprima[] = valide.map((r) => {
      const chiave = chiaveDuplicato(r)
      const duplicato = esistenti.has(chiave) || visteNelFile.has(chiave)
      visteNelFile.add(chiave)
      const daRegola = applicaRegole(r.descrizione, regole)
      const categoriaId =
        daRegola && categorie.some((c) => c.id === daRegola && c.tipo === r.tipo) ? daRegola : senzaCategoria(r.tipo)
      return { ...r, categoriaId, duplicato, includi: !duplicato, creaRegola: false }
    })
    setPasso({ ...passo, n: 3, righe, scartate })
  }

  const importa = async () => {
    if (passo.n !== 3) return
    const daImportare = passo.righe.filter((r) => r.includi)
    if (daImportare.length === 0) return
    // I movimenti prima di tutto: se le regole o la mappatura non si salvano, l'import resta valido.
    const fatto = await conAvviso(
      () => importaMovimenti(daImportare),
      'importare i movimenti',
      avvisaErrore,
    )
    if (!fatto) return
    try {
      const regoleNuove = daImportare
        .filter((r) => r.creaRegola)
        .map((r) => ({ contiene: testoPerRegola(r.descrizione), categoriaId: r.categoriaId }))
      await aggiungiRegole(regoleNuove)
      await ricordaMappatura(passo.firma, passo.mappatura)
    } catch (e) {
      // Accessori: i movimenti sono già dentro, non vale la pena allarmare l'utente.
      console.error('Regole o mappatura non salvate', e)
    }
    const meseRecente = daImportare
      .map((r) => meseDi(r.data))
      .sort()
      .at(-1)!
    mostra(
      `${daImportare.length} ${daImportare.length === 1 ? 'movimento importato' : 'movimenti importati'}`,
      undefined,
      3500,
    )
    navigate(`/movimenti?mese=${meseRecente}`)
  }

  return (
    <>
      <h1 className="py-3 font-display text-xl font-semibold">Importa CSV</h1>
      <Passi corrente={passo.n} />

      {passo.n === 1 && <PassoFile onFile={caricaFile} errore={errore} />}

      {passo.n === 2 && (
        <PassoMappatura
          nomeFile={passo.nomeFile}
          tabella={passo.tabella}
          mappatura={passo.mappatura}
          onCambia={(mappatura) => setPasso({ ...passo, mappatura })}
          onIndietro={() => setPasso({ n: 1 })}
          onAvanti={vaiAllAnteprima}
        />
      )}

      {passo.n === 3 && categorie && (
        <PassoAnteprima
          righe={passo.righe}
          scartate={passo.scartate}
          categorie={categorie}
          onCambia={(righe) => setPasso({ ...passo, righe })}
          onIndietro={() => setPasso({ ...passo, n: 2 })}
          onImporta={importa}
        />
      )}
    </>
  )
}

function Passi({ corrente }: { corrente: 1 | 2 | 3 }) {
  const nomi = ['File', 'Colonne', 'Anteprima']
  return (
    <ol className="mb-4 flex gap-4 text-xs" aria-label="Passaggi">
      {nomi.map((n, i) => (
        <li
          key={n}
          className={cn(
            'flex items-center gap-1.5',
            i + 1 === corrente ? 'font-bold text-inchiostro' : 'text-inchiostro-2',
          )}
        >
          <span
            className={cn(
              'grid size-5 place-items-center rounded-full border text-[11px]',
              i + 1 <= corrente ? 'border-cobalto bg-cobalto text-cobalto-testo' : 'border-filetto',
            )}
            aria-hidden="true"
          >
            {i + 1}
          </span>
          {n}
        </li>
      ))}
    </ol>
  )
}

/* ---------- Passo 1: file ---------- */

function PassoFile({ onFile, errore }: { onFile: (f: File) => void; errore: string | null }) {
  const [trascinando, setTrascinando] = useState(false)
  return (
    <div>
      <label
        onDragOver={(e) => {
          e.preventDefault()
          setTrascinando(true)
        }}
        onDragLeave={() => setTrascinando(false)}
        onDrop={(e) => {
          e.preventDefault()
          setTrascinando(false)
          const f = e.dataTransfer.files[0]
          if (f) onFile(f)
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-sheet border border-dashed px-4 py-12 text-center',
          trascinando ? 'border-cobalto bg-filetto-leggero' : 'border-filetto',
        )}
      >
        <FileUp className="size-7 text-inchiostro-2" aria-hidden="true" />
        <span className="font-medium">Scegli un file CSV o Excel</span>
        <span className="text-xs text-inchiostro-2">
          L'Excel scaricato da poste.it va bene così com'è. Il formato delle colonne lo riconosco io.
        </span>
        <input
          type="file"
          accept=".csv,.txt,.xlsx,.xls,text/csv,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onFile(f)
            e.target.value = ''
          }}
        />
      </label>
      {errore && (
        <p role="alert" className="mt-3 text-sm font-medium text-rosso">
          {errore}
        </p>
      )}
      <div className="mt-6 text-sm text-inchiostro-2">
        <p className="font-medium text-inchiostro">Cosa succede dopo</p>
        <ol className="mt-1 list-decimal space-y-1 pl-5">
          <li>Controlli quali colonne sono data, importo e descrizione (di solito le indovino).</li>
          <li>Vedi l'anteprima con la categoria proposta per ogni riga e la correggi dove serve.</li>
          <li>
            I movimenti già presenti vengono riconosciuti e saltati: puoi reimportare lo stesso file senza doppioni.
          </li>
        </ol>
      </div>
    </div>
  )
}

/* ---------- Passo 2: colonne ---------- */

function PassoMappatura({
  nomeFile,
  tabella,
  mappatura,
  onCambia,
  onIndietro,
  onAvanti,
}: {
  nomeFile: string
  tabella: TabellaCsv
  mappatura: Mappatura
  onCambia: (m: Mappatura) => void
  onIndietro: () => void
  onAvanti: () => void
}) {
  const esito = useMemo(() => interpretaRighe(tabella.righe, mappatura), [tabella, mappatura])
  const opzioniColonne = tabella.intestazioni.map((nome, i) => (
    <option key={i} value={i}>
      {nome}
    </option>
  ))
  const valoriTipo = useMemo(() => {
    if (mappatura.tipo.modo !== 'colonna') return []
    const col = mappatura.tipo.colonna
    return [...new Set(tabella.righe.map((r) => r[col] ?? '').filter(Boolean))].slice(0, 20)
  }, [tabella, mappatura.tipo])

  const setTipo = (tipo: ModoTipo) => onCambia({ ...mappatura, tipo })
  const colonnaTipo = mappatura.tipo.modo === 'colonna' ? mappatura.tipo.colonna : 0
  const modo =
    mappatura.tipo.modo === 'segno' ? (mappatura.tipo.invertito ? 'segnoInvertito' : 'segno') : mappatura.tipo.modo

  return (
    <div>
      <p className="text-sm text-inchiostro-2">
        <b className="font-medium text-inchiostro">{nomeFile}</b> · {tabella.righe.length} righe ·{' '}
        {tabella.delimitatore === 'xlsx'
          ? 'foglio Excel'
          : `separatore "${tabella.delimitatore === '\t' ? 'tab' : tabella.delimitatore}"`}
      </p>

      {/* anteprima grezza */}
      <div className="-mx-5 mt-3 overflow-x-auto px-5 md:mx-0 md:px-0">
        <table className="num w-full text-xs whitespace-nowrap">
          <thead>
            <tr>
              {tabella.intestazioni.map((h, i) => (
                <th key={i} className="border-b border-filetto py-1.5 pr-4 text-left font-medium text-inchiostro-2">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tabella.righe.slice(0, 4).map((r, i) => (
              <tr key={i}>
                {r.map((c, j) => (
                  <td key={j} className="max-w-[16rem] truncate border-b border-filetto-leggero py-1.5 pr-4">
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Campo etichetta="Data">
          <select
            value={mappatura.data ?? ''}
            onChange={(e) => onCambia({ ...mappatura, data: e.target.value === '' ? null : Number(e.target.value) })}
            className={classeSelect}
          >
            <option value="">Scegli la colonna…</option>
            {opzioniColonne}
          </select>
        </Campo>
        <Campo etichetta="Importo">
          <select
            value={mappatura.importo ?? ''}
            onChange={(e) => onCambia({ ...mappatura, importo: e.target.value === '' ? null : Number(e.target.value) })}
            className={classeSelect}
          >
            <option value="">Scegli la colonna…</option>
            {opzioniColonne}
          </select>
        </Campo>
        <Campo etichetta="Descrizione (facoltativa)">
          <select
            value={mappatura.descrizione ?? ''}
            onChange={(e) =>
              onCambia({ ...mappatura, descrizione: e.target.value === '' ? null : Number(e.target.value) })
            }
            className={classeSelect}
          >
            <option value="">Nessuna</option>
            {opzioniColonne}
          </select>
        </Campo>
        <Campo etichetta="Separatore decimale">
          <select
            value={mappatura.decimale}
            onChange={(e) => onCambia({ ...mappatura, decimale: e.target.value as Mappatura['decimale'] })}
            className={classeSelect}
          >
            <option value="auto">Automatico</option>
            <option value=",">Virgola (12,50)</option>
            <option value=".">Punto (12.50)</option>
          </select>
        </Campo>
        <Campo etichetta="Come distinguo entrate e uscite">
          <select
            value={modo}
            onChange={(e) => {
              const v = e.target.value
              if (v === 'segno') setTipo({ modo: 'segno', invertito: false })
              else if (v === 'segnoInvertito') setTipo({ modo: 'segno', invertito: true })
              else if (v === 'tutteUscite') setTipo({ modo: 'tutteUscite' })
              else if (v === 'dueColonne')
                setTipo({ modo: 'dueColonne', colonnaEntrate: mappatura.importo === 0 ? 1 : 0 })
              else setTipo({ modo: 'colonna', colonna: 0, valoreEntrata: '' })
            }}
            className={classeSelect}
          >
            <option value="segno">Dal segno: negativo = uscita</option>
            <option value="segnoInvertito">Dal segno: negativo = entrata</option>
            <option value="dueColonne">Due colonne: uscite ed entrate</option>
            <option value="colonna">Da una colonna che indica il tipo</option>
            <option value="tutteUscite">Sono tutte uscite</option>
          </select>
        </Campo>
        {mappatura.tipo.modo === 'dueColonne' && (
          <Campo etichetta="Colonna delle entrate">
            <select
              value={mappatura.tipo.colonnaEntrate}
              onChange={(e) => setTipo({ modo: 'dueColonne', colonnaEntrate: Number(e.target.value) })}
              className={classeSelect}
            >
              {opzioniColonne}
            </select>
          </Campo>
        )}
        {mappatura.tipo.modo === 'colonna' && (
          <>
            <Campo etichetta="Colonna del tipo">
              <select
                value={mappatura.tipo.colonna}
                onChange={(e) => setTipo({ modo: 'colonna', colonna: Number(e.target.value), valoreEntrata: '' })}
                className={classeSelect}
              >
                {opzioniColonne}
              </select>
            </Campo>
            <Campo etichetta="Valore che significa entrata">
              <select
                value={mappatura.tipo.valoreEntrata}
                onChange={(e) => setTipo({ modo: 'colonna', colonna: colonnaTipo, valoreEntrata: e.target.value })}
                className={classeSelect}
              >
                <option value="">Scegli…</option>
                {valoriTipo.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </Campo>
          </>
        )}
      </div>

      <p className="num mt-4 text-sm">
        <b className="font-medium">{esito.valide.length}</b> righe leggibili
        {esito.scartate.length > 0 && (
          <span className="text-inchiostro-2">
            {' '}
            · {esito.scartate.length} non leggibili (le vedrai nel prossimo passo)
          </span>
        )}
      </p>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={onIndietro}
          className="h-11 rounded-lg border border-filetto px-4 text-sm font-medium"
        >
          Cambia file
        </button>
        <button
          type="button"
          onClick={onAvanti}
          disabled={esito.valide.length === 0}
          className="h-11 flex-1 rounded-lg bg-cobalto px-4 text-sm font-bold text-cobalto-testo disabled:opacity-60"
        >
          Vedi l'anteprima
        </button>
      </div>
    </div>
  )
}

const classeSelect = 'mt-1 h-11 w-full rounded-ctrl border border-filetto bg-foglio px-3 text-base text-inchiostro'

function Campo({ etichetta, children }: { etichetta: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs text-inchiostro-2">
      {etichetta}
      {children}
    </label>
  )
}

/* ---------- Passo 3: anteprima ---------- */

function PassoAnteprima({
  righe,
  scartate,
  categorie,
  onCambia,
  onIndietro,
  onImporta,
}: {
  righe: RigaAnteprima[]
  scartate: RigaScartata[]
  categorie: Categoria[]
  onCambia: (r: RigaAnteprima[]) => void
  onIndietro: () => void
  onImporta: () => Promise<void>
}) {
  const [inCorso, setInCorso] = useState(false)
  const [mostraScartate, setMostraScartate] = useState(false)
  const selezionate = righe.filter((r) => r.includi).length
  const duplicati = righe.filter((r) => r.duplicato).length
  const perId = useMemo(() => new Map(categorie.map((c) => [c.id, c])), [categorie])

  const aggiorna = (indice: number, patch: Partial<RigaAnteprima>) =>
    onCambia(righe.map((r) => (r.indice === indice ? { ...r, ...patch } : r)))

  return (
    <div>
      <p className="num text-sm">
        <b className="font-medium">{selezionate}</b> da importare
        {duplicati > 0 && <span className="text-inchiostro-2"> · {duplicati} già presenti (saltati)</span>}
        {scartate.length > 0 && (
          <>
            <span className="text-inchiostro-2"> · </span>
            <button
              type="button"
              onClick={() => setMostraScartate((v) => !v)}
              className="text-cobalto underline-offset-2 hover:underline"
            >
              {scartate.length} non leggibili
            </button>
          </>
        )}
      </p>
      {mostraScartate && (
        <ul className="mt-2 rounded-ctrl border border-filetto p-3 text-xs text-inchiostro-2">
          {scartate.map((s) => (
            <li key={s.indice}>
              Riga {s.indice + 2}: {s.motivo}
            </li>
          ))}
        </ul>
      )}

      <ul className="mt-3">
        {righe.map((r) => (
          <li key={r.indice} className={cn('border-b border-filetto-leggero py-2.5', !r.includi && 'opacity-50')}>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={r.includi}
                onChange={(e) => aggiorna(r.indice, { includi: e.target.checked })}
                aria-label={`Importa ${r.descrizione || 'movimento'} del ${formatDataNumerica(r.data)}`}
                className="size-5 shrink-0 accent-cobalto"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="truncate">
                    {r.descrizione || <span className="text-inchiostro-2">Senza descrizione</span>}
                  </span>
                  <span className={cn('num shrink-0 font-medium', r.tipo === 'entrata' && 'text-verde')}>
                    {formatImportoMovimento(r.importo, r.tipo)}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-inchiostro-2">
                  <span className="num shrink-0">{formatDataNumerica(r.data)}</span>
                  {r.duplicato && (
                    <span className="shrink-0 rounded-ctrl bg-filetto-leggero px-1.5 py-0.5">già presente</span>
                  )}
                  <select
                    value={r.categoriaId}
                    onChange={(e) => aggiorna(r.indice, { categoriaId: e.target.value, creaRegola: !!r.descrizione })}
                    aria-label="Categoria"
                    className={cn(
                      'ml-auto h-8 max-w-[11rem] truncate rounded-ctrl border border-filetto bg-foglio px-2 text-xs',
                      perId.get(r.categoriaId)?.diSistema ? 'text-inchiostro-2' : 'text-inchiostro',
                    )}
                  >
                    {categorie
                      .filter((c) => c.tipo === r.tipo)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nome}
                        </option>
                      ))}
                  </select>
                </div>
                {r.creaRegola && r.descrizione && (
                  <label className="mt-1.5 flex items-center gap-2 text-xs text-inchiostro-2">
                    <input
                      type="checkbox"
                      checked
                      onChange={() => aggiorna(r.indice, { creaRegola: false })}
                      className="size-4 accent-cobalto"
                    />
                    Ricorda: "{testoPerRegola(r.descrizione)}" → {perId.get(r.categoriaId)?.nome}
                  </label>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="sticky bottom-[calc(72px+env(safe-area-inset-bottom))] mt-4 flex gap-2 bg-carta py-2 md:bottom-4">
        <button
          type="button"
          onClick={onIndietro}
          className="h-11 rounded-lg border border-filetto px-4 text-sm font-medium"
        >
          Indietro
        </button>
        <button
          type="button"
          disabled={selezionate === 0 || inCorso}
          onClick={async () => {
            setInCorso(true)
            try {
              await onImporta()
            } finally {
              setInCorso(false)
            }
          }}
          className="h-11 flex-1 rounded-lg bg-cobalto px-4 text-sm font-bold text-cobalto-testo disabled:opacity-60"
        >
          Importa {selezionate} {selezionate === 1 ? 'movimento' : 'movimenti'}
        </button>
      </div>
    </div>
  )
}
