import { ChartNoAxesCombined, Layers, List, Moon, Plus, Sun } from 'lucide-react'
import { NavLink, Outlet } from 'react-router'
import { cn } from '@/lib/cn'
import { useColoreDelMese } from '@/lib/coloreMese'
import { useMeseSelezionato } from '@/lib/mese'
import { useTema } from '@/lib/tema'
import { useMovimenti } from '@/features/movimenti/useMovimenti'

const VOCI = [
  { a: '/', testo: 'Report', Icona: ChartNoAxesCombined },
  { a: '/movimenti', testo: 'Movimenti', Icona: List },
  { a: '/categorie', testo: 'Categorie', Icona: Layers },
]

/**
 * Struttura comune: barra in alto su desktop, schede in basso su smartphone,
 * pulsante "+" sempre raggiungibile. Rispetta le safe area di iPhone.
 */
export function AppShell() {
  const { scuro, alterna } = useTema()
  const { apriNuovo } = useMovimenti()
  // tutta l'app prende il colore del mese che si sta guardando (o del mese corrente)
  const { mese } = useMeseSelezionato()
  useColoreDelMese(mese, scuro)

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Barra desktop */}
      <header className="vetro sticky top-0 z-30 hidden border-b border-filetto md:block">
        <div className="mx-auto flex h-16 max-w-[1040px] items-center gap-7 px-8">
          <span className="font-display text-lg font-extrabold tracking-tight">Spese</span>
          <nav className="flex gap-6" aria-label="Sezioni">
            {VOCI.map(({ a, testo }) => (
              <NavLink
                key={a}
                to={a}
                end={a === '/'}
                className={({ isActive }) =>
                  cn(
                    'pb-1 text-sm font-semibold transition-colors',
                    isActive
                      ? 'text-inchiostro shadow-[0_2px_0_var(--grad-1)]'
                      : 'text-inchiostro-2 hover:text-inchiostro',
                  )
                }
              >
                {testo}
              </NavLink>
            ))}
          </nav>
          <div className="flex-1" />
          <BottoneTema scuro={scuro} alterna={alterna} />
          <button
            type="button"
            onClick={() => apriNuovo()}
            className="accento flex items-center gap-1.5 rounded-ctrl px-4 py-2.5 text-sm font-bold shadow-[inset_0_0_0_1.5px_var(--accento)] hover:brightness-105 active:brightness-95"
          >
            <Plus className="size-4" strokeWidth={2.6} />
            Nuovo movimento
          </button>
        </div>
      </header>

      {/* Contenuto */}
      {/*
        In fondo, su smartphone: barra schede + pulsante + margine + safe area.
        Il pulsante arriva a 134 px dal bordo (78 + 56), più 16 di respiro:
        l'ultima riga non finisce mai sotto il + o sotto le schede.
      */}
      <main className="mx-auto w-full max-w-[1040px] flex-1 px-5 pt-[max(8px,env(safe-area-inset-top))] pb-[calc(150px+env(safe-area-inset-bottom))] md:px-8 md:pt-5 md:pb-10">
        <Outlet context={{ scuro, alterna }} />
      </main>

      {/* Pulsante + su smartphone: sopra la barra schede, raggiungibile col pollice */}
      <button
        type="button"
        aria-label="Aggiungi movimento"
        onClick={() => apriNuovo()}
        className="accento fixed right-5 bottom-[calc(78px+env(safe-area-inset-bottom))] z-20 grid size-14 place-items-center rounded-2xl shadow-[inset_0_0_0_1.5px_var(--accento)] transition-transform active:scale-95 md:hidden"
      >
        <Plus className="size-7" strokeWidth={2.6} />
      </button>

      {/* Schede in basso su smartphone */}
      <nav
        aria-label="Sezioni"
        className="vetro fixed inset-x-0 bottom-0 z-10 grid grid-cols-3 border-t border-filetto pt-1.5 pb-[max(12px,env(safe-area-inset-bottom))] md:hidden"
      >
        {VOCI.map(({ a, testo, Icona }) => (
          <NavLink
            key={a}
            to={a}
            end={a === '/'}
            className={({ isActive }) =>
              cn(
                'group flex min-h-12 flex-col items-center gap-0.5 py-1 text-[11px] font-semibold transition-colors',
                isActive ? 'text-inchiostro' : 'text-inchiostro-2',
              )
            }
          >
            {/* La scheda attiva: una pillola nel colore della testata del mese */}
            <span className="grid h-7 w-13 place-items-center rounded-full group-aria-[current=page]:bg-blocco group-aria-[current=page]:text-blocco-testo">
              <Icona className="size-[21px]" strokeWidth={1.8} />
            </span>
            {testo}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

/** Cambio di tema. Prende il colore del testo intorno: sta sulla testata del mese come nella barra desktop. */
export function BottoneTema({ scuro, alterna }: { scuro: boolean; alterna: () => void }) {
  return (
    <button
      type="button"
      onClick={alterna}
      aria-label={scuro ? 'Passa al tema chiaro' : 'Passa al tema scuro'}
      className="grid size-11 place-items-center rounded-ctrl text-current opacity-85 transition-opacity hover:opacity-100 active:bg-[color-mix(in_srgb,currentColor_12%,transparent)]"
    >
      {scuro ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
    </button>
  )
}
