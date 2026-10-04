import { ArrowDown, ArrowUp } from 'lucide-react'
import { BottoneTema } from '@/components/AppShell'
import { SelettoreMese } from '@/components/SelettoreMese'
import { TestataPagina } from '@/components/TestataPagina'
import type { Confronto, Totali } from '@/lib/calcoli'
import { useConteggio } from '@/lib/conteggio'
import { nomeMese } from '@/lib/date'
import { formatImporto } from '@/lib/importi'

interface Props {
  mese: string
  mesePrecedente: string
  eCorrente: boolean
  giornoOggi?: number
  /** null finché i movimenti non sono caricati: la testata c'è già, i numeri no */
  totali: Totali | null
  confronto: Confronto | null
  tema: { scuro: boolean; alterna: () => void }
}

/**
 * La testata del mese: una campitura piena nel colore del mese, da bordo a bordo.
 *
 * Dentro c'è tutto quello che si guarda aprendo l'app: la tendina del mese,
 * quanto si è speso (60 px, in Bitter col peso della stagione), il confronto con
 * il mese prima allo stesso giorno e le tre righe del conto. Niente pillole né
 * colori di "bene/male": il verso lo dicono la freccia e le parole.
 */
export function TestataMese({ mese, mesePrecedente, eCorrente, giornoOggi, totali, confronto, tema }: Props) {
  const uscite = totali?.uscite ?? 0
  // scorre solo quando il totale cambia nello stesso mese (un movimento salvato), mai all'apertura
  const contato = useConteggio(uscite, mese)
  const cifra = formatImporto(contato, { simbolo: false })

  return (
    <TestataPagina className="pb-5">
      <div className="flex items-center justify-between gap-3">
        <SelettoreMese />
        <span className="md:hidden">
          <BottoneTema scuro={tema.scuro} alterna={tema.alterna} />
        </span>
      </div>

      <p className="mt-5 text-sm font-semibold">
        {eCorrente ? 'Speso finora' : 'Speso in totale'}
        {eCorrente && giornoOggi !== undefined && (
          <span className="font-normal text-blocco-testo-2">
            {' '}al {giornoOggi} {nomeMese(mese)}
          </span>
        )}
      </p>

      {totali && (
        <>
          {/*
            La cifra: le cifre in transizione sono nascoste ai lettori di schermo,
            che ricevono una volta sola il valore finale dalla regione live.
          */}
          <p className="cifra-grande mt-0.5 whitespace-nowrap" style={{ fontSize: dimensioneCifra(cifra) }}>
            <span aria-hidden="true">{cifra}</span>
            <span className="ml-1 text-[0.42em] text-blocco-testo-2" aria-hidden="true">€</span>
            <span className="sr-only" aria-live="polite">
              {formatImporto(uscite)}
            </span>
          </p>

          <RigaConfronto confronto={confronto} uscite={uscite} mesePrecedente={mesePrecedente} eCorrente={eCorrente} giornoOggi={giornoOggi} />

          <dl className="num mt-4 grid grid-cols-3 border-y border-[color-mix(in_srgb,var(--blocco-testo)_30%,transparent)]">
            <Conto etichetta="Entrate" valore={formatImporto(totali.entrate, { simbolo: false, segno: 'sempre' })} />
            <Conto etichetta="Uscite" valore={formatImporto(-totali.uscite, { simbolo: false })} />
            <Conto etichetta="Saldo" valore={formatImporto(totali.saldo, { simbolo: false })} saldo />
          </dl>
        </>
      )}
    </TestataPagina>
  )
}

/**
 * 60 px finché la cifra ci sta; con importi molto lunghi si riduce quanto basta
 * a restare su una riga dentro lo schermo (le cifre di Bitter sono larghe ~0,6 em).
 */
function dimensioneCifra(testo: string): string {
  return `min(60px, calc((100vw - 64px) / ${(testo.length * 0.62 + 0.6).toFixed(2)}))`
}

function Conto({ etichetta, valore, saldo }: { etichetta: string; valore: string; saldo?: boolean }) {
  return (
    <div className="py-2.5 pl-3 first:pl-0 [&+&]:border-l [&+&]:border-[color-mix(in_srgb,var(--blocco-testo)_30%,transparent)]">
      <dt className="text-xs text-blocco-testo-2">{etichetta}</dt>
      <dd
        className={saldo ? 'mt-0.5 font-display text-[15.5px] underline decoration-double underline-offset-4' : 'mt-0.5 font-display text-[15.5px]'}
        style={{ fontWeight: saldo ? 800 : 'var(--peso-importi)' }}
      >
        {valore}
      </dd>
    </div>
  )
}

/**
 * Il confronto col mese prima, in una riga: freccia, quanto, e rispetto a cosa.
 * Allo stesso giorno quando il mese è in corso, sul mese intero quando è chiuso.
 */
function RigaConfronto({
  confronto,
  uscite,
  mesePrecedente,
  eCorrente,
  giornoOggi,
}: {
  confronto: Confronto | null
  uscite: number
  mesePrecedente: string
  eCorrente: boolean
  giornoOggi?: number
}) {
  const nome = nomeMese(mesePrecedente)
  const classe = 'num mt-2.5 flex flex-wrap items-center gap-x-1.5 text-sm'

  if (!confronto) return <p className={`${classe} text-blocco-testo-2`}>Niente da confrontare con {nome}</p>

  const stessoGiorno = eCorrente && confronto.stessoGiorno && giornoOggi !== undefined
  const differenza = stessoGiorno ? confronto.stessoGiorno!.differenza : confronto.differenza
  const precedente = stessoGiorno ? confronto.stessoGiorno!.precedente : uscite - confronto.differenza
  const riferimento = stessoGiorno ? `${giornoOggi} ${nome}` : nome

  if (differenza === 0) return <p className={classe}>Come al {riferimento}</p>

  const inMeno = differenza < 0
  const Freccia = inMeno ? ArrowDown : ArrowUp
  return (
    <p className={classe}>
      <Freccia className="size-4" strokeWidth={2.6} aria-hidden="true" />
      <b className="font-display" style={{ fontWeight: 'var(--peso-importi)' }}>
        {formatImporto(Math.abs(differenza), { simbolo: false })}
      </b>
      <span className="text-blocco-testo-2">
        in {inMeno ? 'meno' : 'più'} {stessoGiorno ? 'del' : 'di'} {riferimento} ({formatImporto(precedente, { simbolo: false })})
      </span>
    </p>
  )
}
