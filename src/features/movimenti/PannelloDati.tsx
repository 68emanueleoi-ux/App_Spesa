import { useLiveQuery } from 'dexie-react-hooks'
import { Download, FileUp, HardDriveDownload, HardDriveUpload } from 'lucide-react'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { Sheet } from '@/components/ui/Sheet'
import { useToast } from '@/components/useToast'
import { creaBackup, dataUltimoBackup, leggiBackup, ripristinaBackup, type Backup } from '@/db/backup'
import type { Categoria, Movimento } from '@/db/tipi'
import { formatDataLunga } from '@/lib/date'
import { conAvviso } from '@/lib/errori'
import { consegnaFile, movimentiInCsv, nomeFileConData } from '@/lib/esporta'

interface Props {
  aperto: boolean
  onChiudi: () => void
  /** movimenti con i filtri attivi nella lista (quelli che verranno esportati) */
  filtrati: Movimento[]
  perId: Map<string, Categoria>
  descrizioneFiltro: string
}

export function PannelloDati({ aperto, onChiudi, filtrati, perId, descrizioneFiltro }: Props) {
  const { mostra, errore: avvisaErrore } = useToast()
  const navigate = useNavigate()
  const inputBackup = useRef<HTMLInputElement>(null)
  const [daRipristinare, setDaRipristinare] = useState<Backup | null>(null)
  const [errore, setErrore] = useState<string | null>(null)
  const ultimo = useLiveQuery(() => dataUltimoBackup(), [aperto])

  const esportaCsv = async () => {
    const fatto = await conAvviso(
      () => consegnaFile(nomeFileConData('movimenti', 'csv'), movimentiInCsv(filtrati, perId), 'text/csv'),
      'esportare i movimenti',
      avvisaErrore,
    )
    if (fatto) onChiudi()
  }

  const esportaBackup = async () => {
    const fatto = await conAvviso(
      async () => {
        const b = await creaBackup()
        await consegnaFile(nomeFileConData('spese-backup', 'json'), JSON.stringify(b, null, 2), 'application/json')
      },
      'creare il backup',
      avvisaErrore,
    )
    if (!fatto) return
    mostra('Backup creato', undefined, 2500)
    onChiudi()
  }

  const leggiFileBackup = async (file: File) => {
    setErrore(null)
    try {
      setDaRipristinare(leggiBackup(await file.text()))
    } catch (e) {
      setErrore((e as Error).message)
    }
  }

  const confermaRipristino = async () => {
    if (!daRipristinare) return
    const fatto = await conAvviso(() => ripristinaBackup(daRipristinare), 'ripristinare il backup', avvisaErrore)
    if (!fatto) return
    setDaRipristinare(null)
    mostra(`Ripristinati ${daRipristinare.movimenti.length} movimenti`, undefined, 3500)
    onChiudi()
  }

  return (
    <Sheet aperto={aperto} onChiudi={onChiudi} titolo="Dati">
      <h2 className="font-display text-lg font-semibold">Dati</h2>

      {daRipristinare ? (
        <div className="mt-3">
          <p className="text-sm">
            Il backup del <b className="font-medium">{formatDataLunga(daRipristinare.esportatoIl.slice(0, 10))}</b> contiene{' '}
            <b className="num font-medium">{daRipristinare.movimenti.length}</b> movimenti e{' '}
            <b className="num font-medium">{daRipristinare.categorie.length}</b> categorie.
          </p>
          <p className="mt-2 text-sm text-rosso">Il ripristino sostituisce tutti i dati attuali. Non si può annullare.</p>
          <button type="button" onClick={confermaRipristino} className="mt-4 h-12 w-full rounded-lg bg-rosso text-base font-bold text-white">
            Sostituisci i dati con il backup
          </button>
          <button type="button" onClick={() => setDaRipristinare(null)} className="mt-2 h-11 w-full rounded-lg text-sm font-medium text-inchiostro-2">
            Annulla
          </button>
        </div>
      ) : (
        <ul className="mt-2 divide-y divide-filetto-leggero">
          <Voce
            Icona={FileUp}
            titolo="Importa CSV"
            dettaglio="Dall'app Postepay, dalla banca o da un foglio di calcolo"
            onClick={() => {
              onChiudi()
              navigate('/importazione')
            }}
          />
          <Voce
            Icona={Download}
            titolo="Esporta CSV"
            dettaglio={`${filtrati.length} ${filtrati.length === 1 ? 'movimento' : 'movimenti'} · ${descrizioneFiltro}`}
            onClick={esportaCsv}
            disabilitato={filtrati.length === 0}
          />
          <Voce
            Icona={HardDriveDownload}
            titolo="Salva un backup"
            dettaglio={
              ultimo === undefined ? '' : ultimo ? `Ultimo backup: ${formatDataLunga(ultimo.slice(0, 10))}` : 'Nessun backup fatto finora'
            }
            onClick={esportaBackup}
          />
          <Voce
            Icona={HardDriveUpload}
            titolo="Ripristina da backup"
            dettaglio="Sostituisce tutti i dati con quelli del file"
            onClick={() => inputBackup.current?.click()}
          />
        </ul>
      )}
      <input
        ref={inputBackup}
        type="file"
        accept=".json,application/json"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void leggiFileBackup(f)
          e.target.value = ''
        }}
      />
      {errore && (
        <p role="alert" className="mt-3 text-sm font-medium text-rosso">
          {errore}
        </p>
      )}
      <p className="mt-4 text-xs text-inchiostro-2">
        I dati vivono solo su questo dispositivo. Un backup ogni tanto (su iCloud, File o via mail) è l'unica copia di sicurezza.
      </p>
    </Sheet>
  )
}

function Voce({
  Icona,
  titolo,
  dettaglio,
  onClick,
  disabilitato,
}: {
  Icona: typeof Download
  titolo: string
  dettaglio: string
  onClick: () => void
  disabilitato?: boolean
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        disabled={disabilitato}
        className="flex w-full items-center gap-3 py-3 text-left active:bg-carta disabled:opacity-50"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-ctrl bg-carta text-inchiostro-2">
          <Icona className="size-[18px]" aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-medium">{titolo}</span>
          <span className="block truncate text-xs text-inchiostro-2">{dettaglio}</span>
        </span>
      </button>
    </li>
  )
}
