import { SENZA_CATEGORIA_ENTRATA, SENZA_CATEGORIA_USCITA, type Categoria } from './tipi'

/** Categorie create al primo avvio. Le icone sono nomi lucide in kebab-case. */
export const CATEGORIE_PREDEFINITE: Categoria[] = [
  // Uscite
  { id: 'spesa', nome: 'Spesa', tipo: 'uscita', colore: 'c1', icona: 'shopping-basket', ordine: 1 },
  { id: 'affitto', nome: 'Affitto', tipo: 'uscita', colore: 'c2', icona: 'house', ordine: 2 },
  { id: 'trasporti', nome: 'Trasporti', tipo: 'uscita', colore: 'c3', icona: 'bus', ordine: 3 },
  { id: 'svago', nome: 'Svago', tipo: 'uscita', colore: 'c4', icona: 'party-popper', ordine: 4 },
  { id: 'bollette', nome: 'Bollette', tipo: 'uscita', colore: 'c5', icona: 'zap', ordine: 5 },
  { id: 'salute', nome: 'Salute', tipo: 'uscita', colore: 'c6', icona: 'heart-pulse', ordine: 6 },
  { id: 'ristoranti', nome: 'Ristoranti', tipo: 'uscita', colore: 'c7', icona: 'utensils', ordine: 7 },
  { id: 'casa', nome: 'Casa', tipo: 'uscita', colore: 'c8', icona: 'sofa', ordine: 8 },
  { id: 'abbigliamento', nome: 'Abbigliamento', tipo: 'uscita', colore: 'c4', icona: 'shirt', ordine: 9 },
  { id: 'abbonamenti', nome: 'Abbonamenti', tipo: 'uscita', colore: 'c6', icona: 'repeat', ordine: 10 },
  {
    id: SENZA_CATEGORIA_USCITA,
    nome: 'Senza categoria',
    tipo: 'uscita',
    colore: 'neutro',
    icona: 'circle-dashed',
    ordine: 999,
    diSistema: true,
  },
  // Entrate
  { id: 'stipendio', nome: 'Stipendio', tipo: 'entrata', colore: 'verde', icona: 'briefcase-business', ordine: 1 },
  { id: 'borsa-di-studio', nome: 'Borsa di studio', tipo: 'entrata', colore: 'verde', icona: 'graduation-cap', ordine: 2 },
  { id: 'regali', nome: 'Regali', tipo: 'entrata', colore: 'verde', icona: 'gift', ordine: 3 },
  { id: 'rimborsi', nome: 'Rimborsi', tipo: 'entrata', colore: 'verde', icona: 'rotate-ccw', ordine: 4 },
  {
    id: SENZA_CATEGORIA_ENTRATA,
    nome: 'Senza categoria',
    tipo: 'entrata',
    colore: 'neutro',
    icona: 'circle-dashed',
    ordine: 999,
    diSistema: true,
  },
]
