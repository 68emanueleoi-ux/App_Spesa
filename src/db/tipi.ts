export type TipoMovimento = 'entrata' | 'uscita'

/**
 * Colore di categoria come chiave della tavolozza, non come hex:
 * ogni chiave ha un valore diverso nel tema chiaro e in quello scuro (validati per contrasto e daltonismo).
 */
export type ColoreCategoria = 'c1' | 'c2' | 'c3' | 'c4' | 'c5' | 'c6' | 'c7' | 'c8' | 'verde' | 'neutro'

export interface Categoria {
  id: string
  nome: string
  tipo: TipoMovimento
  colore: ColoreCategoria
  /** nome icona lucide in kebab-case (es. "shopping-basket") */
  icona: string
  /** ordine di visualizzazione */
  ordine: number
  /**
   * Tetto di spesa mensile in CENTESIMI, solo per le categorie di uscita.
   * Assente = nessun budget: la categoria non compare fra quelle sorvegliate.
   */
  budget?: number
  /** true per "Senza categoria": non eliminabile */
  diSistema?: boolean
}

export interface Movimento {
  id: string
  tipo: TipoMovimento
  /** in CENTESIMI, intero positivo (1250 = € 12,50) */
  importo: number
  categoriaId: string
  /** ISO yyyy-mm-dd */
  data: string
  descrizione?: string
  /** ISO datetime */
  creatoIl: string
  origine?: 'manuale' | 'import'
}

export interface RegolaCategoria {
  id: string
  /** testo cercato nella descrizione (case/accent-insensitive) */
  contiene: string
  categoriaId: string
  priorita: number
}

export interface Impostazione {
  chiave: string
  valore: unknown
}

export const SENZA_CATEGORIA_USCITA = 'senza-categoria-uscita'
export const SENZA_CATEGORIA_ENTRATA = 'senza-categoria-entrata'
