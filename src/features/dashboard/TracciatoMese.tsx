import { useId, useState } from 'react'
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

const PAD_TOP = 26
const PAD_BOTTOM = 20

/**
 * L'elemento memorabile dell'app: le uscite del mese che si accumulano, disegnate
 * come una superficie che si riempie invece che come una linea sottile. Il mese
 * precedente resta dietro, tratteggiato, per avere un metro di paragone.
 * Tocco o passaggio del puntatore → giorno e valori.
 */
export function TracciatoMese({ corrente, precedente, mese, mesePrecedente, altezza = 180 }: Props) {
  const { ref, larghezza } = useLarghezza<HTMLDivElement>()
  const [giornoAttivo, setGiornoAttivo] = useState<number | null>(null)
  const idSfumatura = useId()

  const giorniMese = giorniNelMese(mese)
  const giorni = Math.max(giorniMese, giorniNelMese(mesePrecedente))
  // un filo di aria sopra il punto più alto, così il tratto non tocca il bordo
  const massimo = Math.max(1, corrente.at(-1) ?? 0, precedente.at(-1) ?? 0) * 1.08
  const W = larghezza
  const H = altezza

  const x = (i: number) => (i / (giorni - 1)) * W
  const y = (v: number) => H - PAD_BOTTOM - (v / massimo) * (H - PAD_TOP - PAD_BOTTOM)
  const linea = (serie: number[]) =>
    serie.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')

  const dCorrente = linea(corrente)
  // la stessa linea, chiusa sulla base: è la superficie che dà corpo al mese
  const areaCorrente = corrente.length > 1 ? `${dCorrente} L${x(corrente.length - 1).toFixed(1)},${H - PAD_BOTTOM} L0,${H - PAD_BOTTOM} Z` : ''
  const dPrecedente = linea(precedente)

  const ultimo = corrente.length - 1
  const nome = nomeMese(mese)
  const nomeMesePrec = nomeMese(mesePrecedente)
  const meseInCorso = corrente.length < giorniMese

  const suPuntatore = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const i = Math.round(((e.clientX - rect.left) / rect.width) * (giorni - 1))
    setGiornoAttivo(Math.min(giorni - 1, Math.max(0, i)))
  }

  const attivo = giornoAttivo
  const valCorr = attivo !== null && attivo < corrente.length ? corrente[attivo] : null
  const valPrec = attivo !== null && attivo < precedente.length ? precedente[attivo] : null

  return (
    <div ref={ref} className="relative select-none">
      <svg
        width="100%"
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        className="block touch-pan-y"
        role="img"
        aria-label={`Uscite accumulate giorno per giorno, confrontate con ${nomeMesePrec}`}
        onPointerMove={suPuntatore}
        onPointerDown={suPuntatore}
        onPointerLeave={() => setGiornoAttivo(null)}
      >
        <defs>
          <linearGradient id={idSfumatura} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--inchiostro)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--inchiostro)" stopOpacity="0.03" />
          </linearGradient>
        </defs>

        {/* tacche dei giorni: pochissime, appoggiate alla base */}
        {[1, 10, 20, giorniMese].map((g) => (
          <text
            key={g}
            x={Math.min(W - 8, Math.max(8, x(g - 1)))}
            y={H - 4}
            textAnchor={g === 1 ? 'start' : g === giorniMese ? 'end' : 'middle'}
            fontSize={11}
            fill="var(--inchiostro-2)"
            className="num"
          >
            {g}
          </text>
        ))}

        <line x1={0} x2={W} y1={H - PAD_BOTTOM} y2={H - PAD_BOTTOM} stroke="var(--filetto)" strokeWidth={1} />

        {/* mese precedente: dietro, tratteggiato */}
        {precedente.length > 1 && (
          <path
            d={dPrecedente}
            fill="none"
            stroke="var(--ghost)"
            strokeWidth={1.5}
            strokeDasharray="2 5"
            strokeLinecap="round"
          />
        )}

        {/* il mese selezionato: superficie + tratto */}
        {areaCorrente && <path d={areaCorrente} fill={`url(#${idSfumatura})`} />}
        {corrente.length > 1 && (
          <path
            d={dCorrente}
            fill="none"
            stroke="var(--inchiostro)"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* dove siamo arrivati: il punto scende fino alla base */}
        {corrente.length > 0 && (
          <>
            <line
              x1={x(ultimo)}
              x2={x(ultimo)}
              y1={y(corrente[ultimo])}
              y2={H - PAD_BOTTOM}
              stroke="var(--inchiostro)"
              strokeWidth={1}
              strokeOpacity={0.35}
            />
            <circle
              cx={x(ultimo)}
              cy={y(corrente[ultimo])}
              r={4.5}
              fill="var(--inchiostro)"
              stroke="var(--carta)"
              strokeWidth={2.5}
            />
            {meseInCorso && (
              <text
                x={Math.min(W - 4, x(ultimo) + 10)}
                y={y(corrente[ultimo]) - 8}
                textAnchor={x(ultimo) > W - 60 ? 'end' : 'start'}
                fontSize={11}
                fill="var(--inchiostro-2)"
              >
                oggi
              </text>
            )}
          </>
        )}

        {/* totale del mese precedente, appoggiato alla sua fine */}
        {precedente.length > 1 && (
          <text
            x={W}
            y={y(precedente.at(-1)!) - 8}
            textAnchor="end"
            fontSize={11}
            fill="var(--inchiostro-2)"
            className="num"
          >
            {nomeMesePrec} {formatImporto(precedente.at(-1)!)}
          </text>
        )}

        {/* lettura puntuale */}
        {attivo !== null && (
          <g pointerEvents="none">
            <line
              x1={x(attivo)}
              x2={x(attivo)}
              y1={PAD_TOP - 10}
              y2={H - PAD_BOTTOM}
              stroke="var(--cobalto)"
              strokeWidth={1}
            />
            {valPrec !== null && (
              <circle cx={x(attivo)} cy={y(valPrec)} r={3.5} fill="var(--carta)" stroke="var(--ghost)" strokeWidth={2} />
            )}
            {valCorr !== null && (
              <circle
                cx={x(attivo)}
                cy={y(valCorr)}
                r={4.5}
                fill="var(--cobalto)"
                stroke="var(--carta)"
                strokeWidth={2.5}
              />
            )}
          </g>
        )}
      </svg>

      {attivo !== null && (
        <div
          role="status"
          className="num pointer-events-none absolute top-0 z-10 rounded-ctrl bg-inchiostro px-2.5 py-1.5 text-xs text-carta"
          style={{
            left: x(attivo) > W / 2 ? undefined : Math.min(x(attivo) + 12, W - 160),
            right: x(attivo) > W / 2 ? Math.max(W - x(attivo) + 12, 0) : undefined,
          }}
        >
          <div className="font-medium">Giorno {attivo + 1}</div>
          <div className="flex justify-between gap-4 opacity-80">
            <span>{nome}</span>
            <span>{valCorr === null ? '—' : formatImporto(valCorr)}</span>
          </div>
          <div className="flex justify-between gap-4 opacity-80">
            <span>{nomeMesePrec}</span>
            <span>{valPrec === null ? '—' : formatImporto(valPrec)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
