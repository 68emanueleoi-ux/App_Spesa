import { db } from './db'
import { CATEGORIE_PREDEFINITE } from './seed'
import type { Categoria, Movimento, RegolaCategoria } from './tipi'

export interface Backup {
  app: 'spese'
  versione: 1
  esportatoIl: string
  categorie: Categoria[]
  movimenti: Movimento[]
  regole: RegolaCategoria[]
}

const CHIAVE_ULTIMO = 'backup.ultimo'

export async function creaBackup(): Promise<Backup> {
  const [categorie, movimenti, regole] = await Promise.all([db.categorie.toArray(), db.movimenti.toArray(), db.regole.toArray()])
  const esportatoIl = new Date().toISOString()
  await db.impostazioni.put({ chiave: CHIAVE_ULTIMO, valore: esportatoIl })
  return { app: 'spese', versione: 1, esportatoIl, categorie, movimenti, regole }
}

export async function dataUltimoBackup(): Promise<string | null> {
  const r = await db.impostazioni.get(CHIAVE_ULTIMO)
  return typeof r?.valore === 'string' ? r.valore : null
}

/** Controlla la forma del file prima di toccare il database. */
export function leggiBackup(testo: string): Backup {
  let dati: unknown
  try {
    dati = JSON.parse(testo)
  } catch {
    throw new Error('Il file non è un backup valido (JSON non leggibile).')
  }
  const b = dati as Partial<Backup>
  if (b?.app !== 'spese' || b.versione !== 1 || !Array.isArray(b.categorie) || !Array.isArray(b.movimenti)) {
    throw new Error("Il file non è un backup di quest'app.")
  }
  for (const m of b.movimenti) {
    if (typeof m.id !== 'string' || !Number.isInteger(m.importo) || typeof m.data !== 'string' || !m.categoriaId) {
      throw new Error('Il backup contiene movimenti in un formato non riconosciuto.')
    }
  }
  return { ...b, regole: Array.isArray(b.regole) ? b.regole : [] } as Backup
}

/** Sostituisce TUTTI i dati con quelli del backup, in una sola transazione. */
export async function ripristinaBackup(b: Backup): Promise<void> {
  await db.transaction('rw', db.categorie, db.movimenti, db.regole, async () => {
    await Promise.all([db.categorie.clear(), db.movimenti.clear(), db.regole.clear()])
    // le "Senza categoria" devono esserci sempre
    const categorie = [...b.categorie]
    for (const s of CATEGORIE_PREDEFINITE.filter((c) => c.diSistema)) {
      if (!categorie.some((c) => c.id === s.id)) categorie.push(s)
    }
    await db.categorie.bulkAdd(categorie)
    await db.movimenti.bulkAdd(b.movimenti)
    await db.regole.bulkAdd(b.regole)
  })
}
