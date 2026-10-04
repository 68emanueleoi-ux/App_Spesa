// I dodici colori dei mesi, costruiti in OKLCH perché la stagione si regola con un numero solo:
// il croma (la vivacità). Inverno spento, estate viva, primavera e autunno in mezzo.
// Luminosità fissa per tema, così ogni mese ha lo stesso contrasto col testo.
// Esportati per il generatore della pagina; eseguito da solo stampa la tabella con le verifiche.

/* ---------- conversioni OKLCH → sRGB ---------- */
const gam = (v) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055)
const lin = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
function oklab2lin([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s]
}
const hex = (rgb) => '#' + rgb.map((v) => Math.round(Math.min(1, Math.max(0, gam(v))) * 255).toString(16).padStart(2, '0')).join('')
/** OKLCH → hex; se il colore esce dal gamut sRGB si riduce il croma, la tinta resta ferma */
export function oklch(L, C, H) {
  const h = (H * Math.PI) / 180
  for (let c = C; c >= 0; c -= 0.002) {
    const rgb = oklab2lin([L, c * Math.cos(h), c * Math.sin(h)])
    if (rgb.every((v) => v >= -1e-4 && v <= 1 + 1e-4)) return hex(rgb)
  }
  return hex(oklab2lin([L, 0, 0]))
}
const lum = (h) => { const [r, g, b] = [1, 3, 5].map((i) => lin(parseInt(h.slice(i, i + 2), 16) / 255)); return 0.2126 * r + 0.7152 * g + 0.0722 * b }
export const contrasto = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }

/*
  tinta (gradi OKLCH), croma e scarto di luminosità di ogni mese.
  Il croma sale da 0,04 (inverno) a 0,19 (luglio) e torna giù: è questo che rende
  spento l'inverno e vivace l'estate. Lo scarto di luminosità (dL) serve a tenere
  distinti i mesi vicini, soprattutto quelli invernali, che di colore ne hanno poco:
  resta entro il margine che mantiene il testo sopra 4,5:1. Tinte e scarti sono stati
  rifiniti con una ricerca che massimizza la distanza minima fra due mesi qualsiasi.
*/
export const MESI = [
  { m: 'gen', nome: 'Gennaio', nota: 'gelo', H: 241, C: 0.04, dL: 0.06 },
  { m: 'feb', nome: 'Febbraio', nota: 'lavanda grigia', H: 316, C: 0.05, dL: 0.02 },
  { m: 'mar', nome: 'Marzo', nota: 'salvia', H: 165, C: 0.085, dL: 0.04 },
  { m: 'apr', nome: 'Aprile', nota: 'germoglio', H: 132, C: 0.12, dL: -0.03 },
  { m: 'mag', nome: 'Maggio', nota: 'fiore di pesco', H: 355, C: 0.13, dL: 0.02 },
  { m: 'giu', nome: 'Giugno', nota: 'grano', H: 102, C: 0.15, dL: 0.05 },
  { m: 'lug', nome: 'Luglio', nota: 'anguria', H: 25, C: 0.19, dL: -0.05 },
  { m: 'ago', nome: 'Agosto', nota: 'albicocca', H: 63, C: 0.17, dL: 0.05 },
  { m: 'set', nome: 'Settembre', nota: 'terracotta', H: 46, C: 0.13, dL: -0.05 },
  { m: 'ott', nome: 'Ottobre', nota: 'ocra', H: 85, C: 0.09, dL: -0.06 },
  { m: 'nov', nome: 'Novembre', nota: 'nebbia', H: 183, C: 0.035, dL: -0.02 },
  { m: 'dic', nome: 'Dicembre', nota: 'ardesia', H: 268, C: 0.045, dL: -0.06 },
]

/*
  Per tema: luminosità della campitura e del testo che ci sta sopra.
  Chiaro: campitura chiara-media, testo scuro della stessa tinta.
  Scuro: campitura profonda, testo chiaro della stessa tinta.
*/
const TEMI = {
  chiaro: { campo: 0.76, scarto: 1, testo: 0.2, testo2: 0.33, cTesto: 0.04 },
  scuro: { campo: 0.4, scarto: 0.6, testo: 0.97, testo2: 0.86, cTesto: 0.03 },
}

export function coloriMese(i, tema) {
  const { H, C, dL } = MESI[i], t = TEMI[tema]
  return {
    // nel tema scuro lo scarto è più stretto: la campitura è già vicina al limite del contrasto
    blocco: oklch(t.campo + dL * t.scarto, C, H),
    bloccoTesto: oklch(t.testo, Math.min(C, t.cTesto), H),
    bloccoTesto2: oklch(t.testo2, Math.min(C, t.cTesto * 1.6), H),
  }
}

/** distanza percettiva in OKLab fra due colori hex */
export function distanza(a, b) {
  const lab = (h) => {
    const [r, g, bl] = [1, 3, 5].map((i) => lin(parseInt(h.slice(i, i + 2), 16) / 255))
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * bl)
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * bl)
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * bl)
    return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s]
  }
  const [x, y] = [lab(a), lab(b)]
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2])
}
/** sotto questa distanza due mesi si confondono a colpo d'occhio */
export const DISTANZA_MINIMA = 0.06

if (process.argv[1] && import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  let ko = 0
  for (const tema of Object.keys(TEMI)) {
    console.log(`\n${tema}`)
    MESI.forEach((mese, i) => {
      const c = coloriMese(i, tema)
      const r1 = contrasto(c.bloccoTesto, c.blocco), r2 = contrasto(c.bloccoTesto2, c.blocco)
      if (r1 < 4.5 || r2 < 4.5) ko++
      console.log(`${mese.m.padEnd(4)} C=${mese.C.toFixed(3)} ${c.blocco} testo ${r1.toFixed(2)} secondario ${r2.toFixed(2)}${r1 < 4.5 || r2 < 4.5 ? '  NO' : ''}`)
    })
  }
  for (const tema of Object.keys(TEMI)) {
    const c = MESI.map((_, i) => coloriMese(i, tema).blocco)
    const vicini = []
    for (let i = 0; i < 12; i++) for (let j = i + 1; j < 12; j++) {
      const d = distanza(c[i], c[j])
      if (d < DISTANZA_MINIMA) vicini.push(`${MESI[i].m}–${MESI[j].m} ${d.toFixed(3)}`)
    }
    console.log(`${tema}: ${vicini.length ? 'mesi che si confondono ' + vicini.join(', ') : 'tutti i mesi distinti'}`)
    ko += vicini.length
  }
  if (ko) process.exit(1)
}
