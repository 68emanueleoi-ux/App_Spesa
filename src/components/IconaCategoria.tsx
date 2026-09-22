import { createElement, type ComponentProps } from 'react'
import { iconaCategoria } from './icone'

type Props = { nome: string } & ComponentProps<'svg'>

/** Icona lucide di una categoria a partire dal nome salvato nel DB. */
export function IconaCategoria({ nome, ...props }: Props) {
  return createElement(iconaCategoria(nome), { 'aria-hidden': true, ...props })
}
