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

const PAD_TOP = 12
const PAD_BOTTOM = 22

/** Un passo "tondo" per le righe orizzontali: 1, 2 o 5 per una potenza di dieci, in euro interi. */
function passoTondo(massimoCentesimi: number): number {
  const grezzo = massimoCentesimi / 100 / 4
  const potenza = 10 ** Math.floor(Math.log10(Math.max(1, grezzo)))
  const passo = [1, 2, 5, 10].map((k) => k * potenza).find((p) => p >= grezzo) ?? 10 * potenza
  return passo * 100
}

/**
 * Le uscite del mese che si accumulano giorno per giorno, come una pagina di
 * carta millimetrata: righe orizzontali con gli euro, la linea del mese
 * nell'accento, il mese prima dietro, tratteggiato, per avere un metro.
 * Nessuna sfumatura sotto la linea: non diceva niente in più.
 * Tocco o passaggio del puntatore → giorno e valori.
 */
export function TracciatoMese({ corrente, precedente, mese, mesePrecedente, altezza = 150 }: Props) {
  const { ref, larghezza } = useLarghezza<HTMLDivElement>()
  const [giornoAttivo, setGiornoAttivo] = useState<number | null>(null)

  const giorniMese = giorniNelMese(mese)
  const giorni = Math.max(giorniMese, giorniNelMese(mesePrecedente))
  const massimo = Math.max(1, corrente.at(-1) ?? 0, precedente.at(-1) ?? 0) * 1.08
  const W = larghezza
  const H = altezza
  const passo = passoTondo(massimo)
  const righe: number[] = []
  for (let v = 0; v <= massimo; v += passo) righe.push(v)

  const x = (i: number) => (i / (giorni - 1)) * W
  const y = (v: number) => H - PAD_BOTTOM - (v / massimo) * (H - PAD_TOP - PAD_BOTTOM)
  const linea = (serie: number[]) =>
    serie.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')

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
        {/* righe orizzontali, con gli euro appoggiati sopra a sinistra */}
        {righe.map((v) => (
          <g key={v}>
            <line x1={0} x2={W} y1={y(v)} y2={y(v)} stroke={v === 0 ? 'var(--filetto)' : 'var(--filetto-leggero)'} strokeWidth={1} />
            <text x={0} y={y(v) - 4} fontSize={11} fill="var(--inchiostro-2)" className="num font-display">
              {(v / 100).toLocaleString('it-IT')}
            </text>
          </g>
        ))}

        {/* tacche dei giorni, appoggiate alla base */}
        {[1, 10, 20, giorniMese].map((g) => (
          <text
            key={g}
            x={Math.min(W - 8, Math.max(8, x(g - 1)))}
            y={H - 5}
            textAnchor={g === 1 ? 'start' : g === giorniMese ? 'end' : 'middle'}
            fontSize={11}
            fill="var(--inchiostro-2)"
            className="num font-display"
          >
            {g}
          </text>
        ))}

        {/* mese precedente: dietro, tratteggiato */}
        {precedente.length > 1 && (
          <path d={linea(precedente)} fill="none" stroke="var(--inchiostro-2)" strokeWidth={1.3} strokeDasharray="4 3" />
        )}

        {/* il mese selezionato, nell'accento del mese */}
        {corrente.length > 1 && (
          <path d={linea(corrente)} fill="none" stroke="var(--accento)" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
        )}

        {/* dove siamo arrivati */}
        {corrente.length > 0 && (
          <>
            <line
              x1={x(ultimo)}
              x2={x(ultimo)}
              y1={y(corrente[ultimo])}
              y2={H - PAD_BOTTOM}
              stroke="var(--accento)"
              strokeWidth={1}
              strokeDasharray="2 3"
            />
            <circle cx={x(ultimo)} cy={y(corrente[ultimo])} r={5} fill="var(--blocco)" stroke="var(--accento)" strokeWidth={2.5} />
            {meseInCorso && (
              <text
                x={Math.min(W - 4, x(ultimo) + 10)}
                y={y(corrente[ultimo]) + 16}
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
          <text x={W} y={y(precedente.at(-1)!) - 7} textAnchor="end" fontSize={11} fill="var(--inchiostro-2)" className="num font-display">
            {W > 420 ? `${nomeMesePrec} ` : ''}
            {formatImporto(precedente.at(-1)!, { simbolo: false })}
          </text>
        )}

        {/* lettura puntuale */}
        {attivo !== null && (
          <g pointerEvents="none">
            <line x1={x(attivo)} x2={x(attivo)} y1={PAD_TOP - 6} y2={H - PAD_BOTTOM} stroke="var(--inchiostro)" strokeWidth={1} />
            {valPrec !== null && (
              <circle cx={x(attivo)} cy={y(valPrec)} r={3.5} fill="var(--carta)" stroke="var(--inchiostro-2)" strokeWidth={2} />
            )}
            {valCorr !== null && (
              <circle cx={x(attivo)} cy={y(valCorr)} r={4.5} fill="var(--accento)" stroke="var(--carta)" strokeWidth={2.5} />
            )}
          </g>
        )}
      </svg>

      <p className="mt-1 flex gap-4 text-xs text-inchiostro-2" aria-hidden="true">
        <span className="flex items-center gap-1.5">
          <i className="inline-block w-4 border-t-[2.4px] border-accento" />
          {nome}
        </span>
        <span className="flex items-center gap-1.5">
          <i className="inline-block w-4 border-t-[1.5px] border-dashed border-inchiostro-2" />
          {nomeMesePrec}
        </span>
      </p>

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
