// Verifica e correzione dei colori di categoria per ogni direzione e tema.
// Contrasto WCAG 2.x, simulazione deuteranopia/protanopia (Machado 2009, severità 1),
// distanza in OKLab. Le correzioni toccano solo la luminosità (L in OKLCH), tinta ferma.
import fs from 'node:fs'

const hex2rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
const rgb2hex = (c) => '#' + c.map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0')).join('')
const lin = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
const gam = (v) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055)
const lum = (h) => { const [r, g, b] = hex2rgb(h).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b }
const contrasto = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }
const mix = (a, b, t) => rgb2hex(hex2rgb(a).map((v, i) => v * t + hex2rgb(b)[i] * (1 - t)))

function lin2oklab([r, g, b]) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s]
}
function oklab2lin([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s]
}
const oklab = (h) => lin2oklab(hex2rgb(h).map(lin))
const toLch = (h) => { const [L, a, b] = oklab(h); return [L, Math.hypot(a, b), Math.atan2(b, a)] }
function fromLch(L, C, H) {
  // riduce il croma finché il colore sta nel gamut sRGB: la tinta non si sposta
  for (let c = C; c >= 0; c -= 0.002) {
    const rgb = oklab2lin([L, c * Math.cos(H), c * Math.sin(H)])
    if (rgb.every((v) => v >= -1e-4 && v <= 1 + 1e-4)) return rgb2hex(rgb.map(gam))
  }
  return rgb2hex(oklab2lin([L, 0, 0]).map(gam))
}

const MACHADO = {
  protan: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deutan: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
}
const simula = (h, t) => { const c = hex2rgb(h).map(lin); return MACHADO[t].map((r) => r.reduce((s, v, i) => s + v * c[i], 0)).map((v) => Math.min(1, Math.max(0, v))) }
const dOk = (p, q) => Math.hypot(...p.map((v, i) => v - q[i]))

/** Cerca la L più vicina all'originale che rispetta i vincoli. */
function correggi(hex, sfondo, { minGrafico = 3, minIcona = 3, minTesto = 0 }) {
  const ok = (h) => contrasto(h, sfondo) >= Math.max(minGrafico, minTesto) && contrasto(h, mix(h, sfondo, 0.2)) >= minIcona
  if (ok(hex)) return hex
  const [L, C, H] = toLch(hex)
  for (let d = 0.005; d < 0.6; d += 0.005)
    for (const s of [-1, 1]) {
      const nL = L + s * d
      if (nL <= 0 || nL >= 1) continue
      const h = fromLch(nL, C, H)
      if (ok(h)) return h
    }
  return hex
}

const BASE = {
  chiaro: { c1: '#2f57e0', c2: '#b8790a', c3: '#0e9c86', c4: '#8b3fd6', c5: '#d4581f', c6: '#0d81c2', c7: '#db3f80', c8: '#6f8511', verde: '#0f9d6b' },
  scuro: { c1: '#5b7cff', c2: '#ffc53d', c3: '#17d6b0', c4: '#b368ff', c5: '#ff8a3d', c6: '#38bdf8', c7: '#ff5c9d', c8: '#a8d63a', verde: '#2be39b' },
}

// Ogni direzione: sfondo per tema e fattore di croma (A smorza: inchiostri da timbro)
const DIREZIONI = {
  scontrino: { chiaro: '#fbf9f3', scuro: '#1c1b19', croma: { chiaro: 0.78, scuro: 0.62 } },
  copertina: { chiaro: '#f4f1ea', scuro: '#121211', croma: { chiaro: 0.92, scuro: 0.8 } },
  binario: { chiaro: '#ffffff', scuro: '#0c1117', croma: { chiaro: 1, scuro: 1 } },
  // secondo giro
  mastro: { chiaro: '#f7f6f2', scuro: '#121416', croma: { chiaro: 0.9, scuro: 0.8 } },
  agenda: { chiaro: '#fbfaf7', scuro: '#18171b', croma: { chiaro: 0.85, scuro: 0.75 } },
  etichetta: { chiaro: '#ffffff', scuro: '#0b0b0b', croma: { chiaro: 1, scuro: 0.9 } },
  mosaico: { chiaro: '#f3efe8', scuro: '#1b1a1f', croma: { chiaro: 1, scuro: 0.9 } },
  notturno: { chiaro: '#f4f5f8', scuro: '#0d1017', croma: { chiaro: 0.95, scuro: 0.9 } },
  // giro del colore su Mastro
  registro: { chiaro: '#ecf2e3', scuro: '#11201a', croma: { chiaro: 0.9, scuro: 0.85 } },
  mese: { chiaro: '#faf6f0', scuro: '#17120e', croma: { chiaro: 0.95, scuro: 0.9 } },
  evidenziatore: { chiaro: '#fdfcf8', scuro: '#141413', croma: { chiaro: 1, scuro: 0.95 } },
  riso: { chiaro: '#f3eee2', scuro: '#1a1630', croma: { chiaro: 1, scuro: 0.95 } },
  blu: { chiaro: '#f4f2ea', scuro: '#0e1531', croma: { chiaro: 0.85, scuro: 0.85 } },
  prugna: { chiaro: '#f8efe8', scuro: '#1e1221', croma: { chiaro: 0.95, scuro: 0.9 } },
}

const out = {}
let report = ''
for (const [nome, d] of Object.entries(DIREZIONI)) {
  out[nome] = {}
  report += `\n## ${nome}\n`
  for (const tema of ['chiaro', 'scuro']) {
    const bg = d[tema]
    const pal = {}
    report += `\n### ${tema} (sfondo ${bg})\n| chiave | base | smorzato | corretto | vs sfondo | icona su riquadro 20% |\n|-|-|-|-|-|-|\n`
    for (const [k, v] of Object.entries(BASE[tema])) {
      const [L, C, H] = toLch(v)
      const smorzato = fromLch(L, C * d.croma[tema], H)
      const fin = correggi(smorzato, bg, { minTesto: k === 'verde' ? 4.5 : 0 })
      pal[k] = fin
      report += `| ${k} | ${v} | ${smorzato} | ${fin}${fin !== smorzato ? ' ✱' : ''} | ${contrasto(fin, bg).toFixed(2)} | ${contrasto(fin, mix(fin, bg, 0.2)).toFixed(2)} |\n`
    }
    // daltonismo: coppie con distanza OKLab simulata sotto soglia
    const chiavi = Object.keys(pal)
    for (const t of ['deutan', 'protan']) {
      const rischio = []
      for (let i = 0; i < chiavi.length; i++)
        for (let j = i + 1; j < chiavi.length; j++) {
          const dd = dOk(lin2oklab(simula(pal[chiavi[i]], t)), lin2oklab(simula(pal[chiavi[j]], t)))
          if (dd < 0.07) rischio.push(`${chiavi[i]}–${chiavi[j]} (${dd.toFixed(3)})`)
        }
      report += `\n${t === 'deutan' ? 'Deuteranopia' : 'Protanopia'}: ${rischio.length ? 'coppie a rischio ' + rischio.join(', ') : 'nessuna coppia sotto 0,07'}\n`
    }
    out[nome][tema] = pal
  }
}
fs.writeFileSync(new URL('./palette-proposte.json', import.meta.url), JSON.stringify(out, null, 2))
fs.writeFileSync(new URL('../proposte/verifica-colori.md', import.meta.url), report)
console.log(report)
