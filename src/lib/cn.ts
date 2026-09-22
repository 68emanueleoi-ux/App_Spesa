import { clsx, type ClassValue } from 'clsx'

/**
 * Unisce le classi condizionali.
 *
 * Niente tailwind-merge (55 kB minificati): serviva solo a risolvere i
 * conflitti nati dallo scrivere `'text-inchiostro-2'` nella base e
 * `isActive && 'text-inchiostro'` nella condizione. Quei punti ora usano un
 * ternario, così di ogni famiglia di utilità ne esce sempre una sola e non
 * c'è niente da risolvere.
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}
