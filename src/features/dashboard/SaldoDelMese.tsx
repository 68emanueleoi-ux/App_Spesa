import { ChevronDown } from 'lucide-react'
import { useId, useState } from 'react'
import { cn } from '@/lib/cn'
import { useConteggio } from '@/lib/conteggio'
import { formatImporto, formatImportoMovimento } from '@/lib/importi'

interface Props {
  entrate: number
  uscite: number
  saldo: number
}

/**
 * Quello che resta, e basta.
 *
 * Prima qui stavano tre riquadri affiancati — entrate, uscite, saldo — tutti
 * dello stesso peso: tre numeri da leggere e confrontare a mente per rispondere
 * all'unica domanda che ci si fa davvero ("posso spendere?"). Le uscite, per
 * giunta, erano già il numero grande della scheda sopra: dirle due volte non
 * aggiungeva niente.
 *
 * Resta il saldo, in chiaro. Entrate e uscite ci sono ancora, a un tocco: chi
 * le vuole le apre, chi non le vuole non se le porta dietro tutti i giorni.
 */
export function SaldoDelMese({ entrate, uscite, saldo }: Props) {
  const [aperto, setAperto] = useState(false)
  const idDettaglio = useId()
  const contato = useConteggio(saldo)
  const inRosso = saldo < 0

  return (
    <section
      className={cn(
        'mt-4 rounded-scheda border',
        inRosso
          ? 'border-[color:var(--rosso)]/30 bg-[color:var(--rosso)]/10'
          : 'border-[color:var(--verde)]/25 bg-[color:var(--verde)]/10',
      )}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3.5">
        <div className="min-w-0">
          <p
            className={cn(
              'text-xs font-semibold',
              inRosso ? 'text-[color:var(--rosso)]' : 'text-[color:var(--verde)]',
            )}
          >
            {inRosso ? 'Sei sotto di' : 'Ti restano questo mese'}
          </p>
          <p className="cifra-grande mt-0.5 truncate text-[26px]">
            {formatImporto(Math.abs(contato))}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setAperto((a) => !a)}
          aria-expanded={aperto}
          aria-controls={idDettaglio}
          className="flex shrink-0 items-center gap-1.5 rounded-ctrl px-2.5 py-2 text-xs font-bold text-inchiostro-2 transition-colors hover:text-inchiostro active:bg-filetto-leggero"
        >
          Entrate e uscite
          <ChevronDown
            className={cn('size-4 transition-transform duration-200', aperto && 'rotate-180')}
            aria-hidden="true"
          />
        </button>
      </div>

      {aperto && (
        <dl
          id={idDettaglio}
          className="num grid grid-cols-2 gap-px overflow-hidden border-t border-filetto text-sm"
        >
          <div className="px-4 py-3">
            <dt className="text-xs text-inchiostro-2">Entrate</dt>
            <dd className="mt-0.5 font-bold text-[color:var(--verde)]">
              {formatImportoMovimento(entrate, 'entrata')}
            </dd>
          </div>
          <div className="border-l border-filetto px-4 py-3">
            <dt className="text-xs text-inchiostro-2">Uscite</dt>
            <dd className="mt-0.5 font-bold">{formatImportoMovimento(uscite, 'uscita')}</dd>
          </div>
        </dl>
      )}
    </section>
  )
}
