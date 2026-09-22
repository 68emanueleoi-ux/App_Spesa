/** "Caffè  Centrale" → "caffe centrale": per ricerche e confronti insensibili a maiuscole e accenti */
export function normalizza(testo: string): string {
  return testo
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

export function contiene(testo: string, cercato: string): boolean {
  const c = normalizza(cercato)
  if (c === '') return true
  return normalizza(testo).includes(c)
}
