import { useState } from 'react'
import { giorniNelMese, nomeMese } from '@/lib/date'
import { formatImporto } from '@/lib/importi'
import { useLarghezza } from '@/lib/useLarghezza'

interface Props {
  /** uscite cumulate del mese selezionato (indice 0 = giorno 1), già troncate a oggi se il mese è in corso */
  corrente: number[]
  /** uscite cumulate del mese precedente, intero */
  precedente: number[]
  mese: string
  mesePrecedente: string
  altezza?: number
}

const PAD_X = 6
const PAD_TOP = 22
const PAD_BOTTOM = 8

/**
 * L'elemento memorabile: un solo tratto d'inchiostro con le uscite cumulate del mese,
 * il mese precedente tratteggiato sotto. Tocco/hover → giorno e valori.
 */
export function TracciatoMese({ corrente, precedente, mese, mesePrecedente, altezza = 140 }: Props) {
  const { ref, larghezza } = useLarghezza<HTMLDivElement>()
  const [giornoAttivo, setGiornoAttivo] = useState<number | null>(null)

  const giorni = Math.max(giorniNelMese(mese), giorniNelMese(mesePrecedente))
  const massimo = Math.max(1, corrente.at(-1) ?? 0, precedente.at(-1) ?? 0) * 1.06
  const W = larghezza
  const H = altezza

  const x = (i: number) => PAD_X + (i / (giorni - 1)) * (W - 2 * PAD_X)
  const y = (v: number) => H - PAD_BOTTOM - (v / massimo) * (H - PAD_TOP - PAD_BOTTOM)
  const tracciato = (serie: number[]) => serie.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')

  const dCorrente = tracciato(corrente)
  const dPrecedente = tracciato(precedente)

  const ultimo = corrente.length - 1
  const nome = nomeMese(mese)
  const nomeMesePrec = nomeMese(mesePrecedente)

  const suPuntatore = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = e.clientX - rect.left
    const i = Math.round(((px - PAD_X) / (W - 2 * PAD_X)) * (giorni - 1))
    setGiornoAttivo(Math.min(giorni - 1, Math.max(0, i)))
  }

  const attivo = giornoAttivo
  const valCorr = attivo !== null && attivo < corrente.length ? corrente[attivo] : null
  const valPrec = attivo !== null && attivo < precedente.length ? precedente[attivo] : null

  return (
    <div ref={ref} className="relative -mx-1 select-none">
      <svg
        width="100%"
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        className="block overflow-visible touch-pan-y"
        role="img"
        aria-label={`Uscite cumulate giorno per giorno, confrontate con ${nomeMesePrec}`}
        onPointerMove={suPuntatore}
        onPointerDown={suPuntatore}
        onPointerLeave={() => setGiornoAttivo(null)}
      >
        {/* linea di base */}
        <line x1={PAD_X} x2={W - PAD_X} y1={H - PAD_BOTTOM} y2={H - PAD_BOTTOM} stroke="var(--filetto)" strokeWidth={1} />

        {/* mese precedente: tratteggiato, sbiadito */}
        {precedente.length > 1 && (
          <path d={dPrecedente} fill="none" stroke="var(--ghost)" strokeWidth={2} strokeDasharray="3 4" strokeLinecap="round" strokeLinejoin="round" />
        )}
        {precedente.length > 1 && (
          <text
            x={W - PAD_X}
            y={y(precedente.at(-1)!) - 7}
            textAnchor="end"
            fontSize={11}
            fill="var(--inchiostro-2)"
            className="num"
          >
            {nomeMesePrec} {formatImporto(precedente.at(-1)!)}
          </text>
        )}

        {/* mese selezionato: il tratto */}
        {corrente.length > 1 && (
          <path d={dCorrente} fill="none" stroke="var(--inchiostro)" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" />
        )}
        {corrente.length > 0 && (
          <>
            <circle cx={x(ultimo)} cy={y(corrente[ultimo])} r={4.5} fill="var(--inchiostro)" stroke="var(--carta)" strokeWidth={2} />
            {corrente.length < giorniNelMese(mese) && (
              <text x={x(ultimo) + 9} y={y(corrente[ultimo]) + 4} fontSize={11} fill="var(--inchiostro-2)">
                oggi
              </text>
            )}
          </>
        )}

        {/* crosshair */}
        {attivo !== null && (
          <g pointerEvents="none">
            <line x1={x(attivo)} x2={x(attivo)} y1={PAD_TOP - 6} y2={H - PAD_BOTTOM} stroke="var(--cobalto)" strokeWidth={1} strokeDasharray="2 3" />
            {valPrec !== null && <circle cx={x(attivo)} cy={y(valPrec)} r={4} fill="var(--carta)" stroke="var(--ghost)" strokeWidth={2} />}
            {valCorr !== null && <circle cx={x(attivo)} cy={y(valCorr)} r={4.5} fill="var(--cobalto)" stroke="var(--carta)" strokeWidth={2} />}
          </g>
        )}
      </svg>

      {/* asse: giorni */}
      <div className="num flex justify-between px-1 pt-1 text-xs text-inchiostro-2" aria-hidden="true">
        <span>1</span>
        <span>10</span>
        <span>20</span>
        <span>{giorniNelMese(mese)}</span>
      </div>

      {/* tooltip */}
      {attivo !== null && (
        <div
          role="status"
          className="num pointer-events-none absolute top-0 z-10 rounded-ctrl border border-filetto bg-foglio px-2.5 py-1.5 text-xs shadow-[0_4px_12px_rgba(0,0,0,0.12)]"
          style={{
            left: x(attivo) > W / 2 ? undefined : Math.min(x(attivo) + 10, W - 150),
            right: x(attivo) > W / 2 ? Math.max(W - x(attivo) + 10, 0) : undefined,
          }}
        >
          <div className="font-medium">Giorno {attivo + 1}</div>
          <div className="flex justify-between gap-3">
            <span className="text-inchiostro-2">{nome}</span>
            <span>{valCorr === null ? '—' : formatImporto(valCorr)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-inchiostro-2">{nomeMesePrec}</span>
            <span>{valPrec === null ? '—' : formatImporto(valPrec)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
