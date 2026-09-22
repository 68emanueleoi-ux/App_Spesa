import { ChartNoAxesCombined, Layers, List, Moon, Plus, Sun } from 'lucide-react'
import { NavLink, Outlet } from 'react-router'
import { cn } from '@/lib/cn'
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

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Barra desktop */}
      <header className="hidden border-b border-filetto md:block">
        <div className="mx-auto flex h-14 max-w-[1040px] items-center gap-7 px-8">
          <span className="font-display text-lg font-semibold">Spese</span>
          <nav className="flex gap-6" aria-label="Sezioni">
            {VOCI.map(({ a, testo }) => (
              <NavLink
                key={a}
                to={a}
                end={a === '/'}
                className={({ isActive }) =>
                  cn(
                    'pb-0.5 text-sm font-medium',
                    isActive
                      ? 'text-inchiostro shadow-[0_2px_0_var(--inchiostro)]'
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
            className="flex items-center gap-1.5 rounded-ctrl bg-cobalto px-3.5 py-2 text-sm font-bold text-cobalto-testo hover:brightness-110 active:brightness-95"
          >
            <Plus className="size-4" strokeWidth={2.6} />
            Nuovo movimento
          </button>
        </div>
      </header>

      {/* Contenuto */}
      <main className="mx-auto w-full max-w-[1040px] flex-1 px-5 pt-[max(8px,env(safe-area-inset-top))] pb-28 md:px-8 md:pt-5 md:pb-10">
        <Outlet context={{ scuro, alterna }} />
      </main>

      {/* Pulsante + su smartphone: sopra la barra schede, raggiungibile col pollice */}
      <button
        type="button"
        aria-label="Aggiungi movimento"
        onClick={() => apriNuovo()}
        className="fixed right-5 bottom-[calc(76px+env(safe-area-inset-bottom))] z-20 grid size-14 place-items-center rounded-full bg-cobalto text-cobalto-testo shadow-[0_6px_16px_rgba(47,79,216,0.35)] active:scale-95 md:hidden"
      >
        <Plus className="size-7" strokeWidth={2.4} />
      </button>

      {/* Schede in basso su smartphone */}
      <nav
        aria-label="Sezioni"
        className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-3 border-t border-filetto bg-carta pt-2 pb-[max(10px,env(safe-area-inset-bottom))] md:hidden"
      >
        {VOCI.map(({ a, testo, Icona }) => (
          <NavLink
            key={a}
            to={a}
            end={a === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 py-1 text-[11px] font-medium',
                isActive ? 'text-inchiostro' : 'text-inchiostro-2',
              )
            }
          >
            <Icona className="size-[22px]" strokeWidth={1.8} />
            {testo}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

export function BottoneTema({ scuro, alterna }: { scuro: boolean; alterna: () => void }) {
  return (
    <button
      type="button"
      onClick={alterna}
      aria-label={scuro ? 'Passa al tema chiaro' : 'Passa al tema scuro'}
      className="grid size-9 place-items-center rounded-ctrl text-inchiostro-2 hover:bg-filetto-leggero active:bg-filetto"
    >
      {scuro ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
    </button>
  )
}
