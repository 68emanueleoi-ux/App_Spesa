import { useLiveQuery } from 'dexie-react-hooks'
import { IconaCategoria } from '@/components/IconaCategoria'
import { db } from '@/db/db'
import type { Categoria, TipoMovimento } from '@/db/tipi'
import { coloreCss } from '@/lib/colori'

export function CategoriePage() {
  const categorie = useLiveQuery(() => db.categorie.orderBy('ordine').toArray())
  if (!categorie) return null
  return (
    <>
      <h1 className="py-3 font-display text-xl font-semibold">Categorie</h1>
      <Gruppo titolo="Uscite" tipo="uscita" categorie={categorie} />
      <Gruppo titolo="Entrate" tipo="entrata" categorie={categorie} />
    </>
  )
}

function Gruppo({ titolo, tipo, categorie }: { titolo: string; tipo: TipoMovimento; categorie: Categoria[] }) {
  return (
    <section className="border-b border-filetto py-4 last:border-b-0">
      <h2 className="mb-2 font-display text-base font-semibold">{titolo}</h2>
      <ul>
        {categorie
          .filter((c) => c.tipo === tipo)
          .map((c) => {
            return (
              <li key={c.id} className="flex items-center gap-3 border-b border-filetto-leggero py-2.5 text-sm last:border-b-0">
                <span
                  className="grid size-8 place-items-center rounded-ctrl"
                  style={{ color: coloreCss(c.colore), background: 'color-mix(in srgb, currentColor 14%, transparent)' }}
                >
                  <IconaCategoria nome={c.icona} className="size-4" />
                </span>
                <span className={c.diSistema ? 'text-inchiostro-2' : ''}>{c.nome}</span>
              </li>
            )
          })}
      </ul>
    </section>
  )
}
