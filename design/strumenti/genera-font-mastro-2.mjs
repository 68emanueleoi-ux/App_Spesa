// Mastro con dieci caratteri non comuni. La cifra di "Speso finora" è più grande
// (60 px di partenza, regolabile a 52/60/68 dai pulsanti in alto).
// Uscita: design/proposte/giro-4/font-mastro.html (#scuro per il tema scuro).
// Tutti i caratteri usati per gli importi hanno cifre tabellari, verificate in Chrome.
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const ROOT = path.resolve(import.meta.dirname, '../..')
const OUT = path.join(ROOT, 'design/proposte/giro-4')
fs.mkdirSync(OUT, { recursive: true })
const PAL = JSON.parse(fs.readFileSync(new URL('./palette-proposte.json', import.meta.url))).mastro

const MENO = '−'
function fmt(c, { simbolo = true } = {}) {
  const a = Math.abs(Math.round(c))
  const corpo = `${simbolo ? '€ ' : ''}${Math.floor(a / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${(a % 100).toString().padStart(2, '0')}`
  return c < 0 ? MENO + corpo : corpo
}
const firmato = (v) => `${v > 0 ? '+' : MENO}${fmt(Math.abs(v), { simbolo: false })}`

const NOMI = ['shopping-basket', 'house', 'bus', 'party-popper', 'zap', 'briefcase-business', 'chevron-down', 'moon', 'arrow-down', 'circle-dashed']
const NODI = {}
for (const n of NOMI) NODI[n] = (await import(pathToFileURL(path.join(ROOT, `node_modules/lucide-react/dist/esm/icons/${n}.mjs`)).href)).__iconData.node
const icona = (n, size = 15, stroke = 2.1) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${NODI[n].map(([t, a]) => `<${t} ${Object.entries(a).filter(([k]) => k !== 'key').map(([k, v]) => `${k}="${v}"`).join(' ')}/>`).join('')}</svg>`

const CAT = { spesa: ['Spesa', 'c1', 'shopping-basket'], affitto: ['Affitto', 'c2', 'house'], trasporti: ['Trasporti', 'c3', 'bus'], svago: ['Svago', 'c4', 'party-popper'], bollette: ['Bollette', 'c5', 'zap'], stipendio: ['Stipendio', 'verde', 'briefcase-business'] }
const QUOTE = [['spesa', 41200, 32], ['affitto', 40000, 31], ['trasporti', 18000, 14], ['svago', 15000, 12], ['bollette', 5850, 5]]
const MOV = [{ g: 22, d: 'Conad', k: 'spesa', v: -4320, s: 21570 }, { g: 21, d: 'Trenitalia', k: 'trasporti', v: -1290, s: 25890 }, { g: 20, d: 'Stipendio', k: 'stipendio', v: 150000, s: 28479 }]

const F = '../../../node_modules'
const V = (pkg, file) => `${F}/@fontsource-variable/${pkg}/files/${file}`
const S = (pkg, file) => `${F}/@fontsource/${pkg}/files/${file}`

/*
  Ogni proposta: un carattere di carattere ("voce") per la cifra grande, i titoli e,
  quando regge il corpo piccolo, anche gli importi del registro; un carattere da
  testo tranquillo per tutto il resto. Due famiglie al massimo.
*/
const PROPOSTE = [
  {
    nome: 'Moda', voce: 'Bodoni Moda', testo: 'Hanken Grotesk', tab: 'Hanken Grotesk',
    pesoVoce: 600, vsVoce: "'opsz' 96", tabPeso: 500,
    facce: [['Bodoni Moda', V('bodoni-moda', 'bodoni-moda-latin-opsz-normal.woff2')], ['Hanken Grotesk', V('hanken-grotesk', 'hanken-grotesk-latin-wght-normal.woff2')]],
    nota: 'Bodoni a contrasto altissimo: filetti sottili e aste piene, come le cifre sulle copertine di moda. Il registro sotto resta in un grottesco calmo.',
  },
  {
    nome: 'Cassa', voce: 'Doto', testo: 'Geist', tab: 'Doto', pesoVoce: 800, tabPeso: 700,
    facce: [['Doto', V('doto', 'doto-latin-wght-normal.woff2')], ['Geist', V('geist', 'geist-latin-wght-normal.woff2')]],
    nota: 'Cifre a matrice di punti, come il display del registratore di cassa o della bilancia del mercato. Gli importi del registro sono anche loro a punti.',
  },
  {
    nome: 'Macchina', voce: 'Xanh Mono', testo: 'Familjen Grotesk', tab: 'Xanh Mono', pesoVoce: 400, tabPeso: 400,
    facce: [['Xanh Mono', S('xanh-mono', 'xanh-mono-latin-400-normal.woff2'), 400], ['Familjen Grotesk', V('familjen-grotesk', 'familjen-grotesk-latin-wght-normal.woff2')]],
    nota: 'Un monospaziato con le grazie e un’aria un po’ storta, da macchina da scrivere vietnamita. Il registro diventa un vero libro battuto a macchina.',
  },
  {
    nome: 'Galleria', voce: 'Syne', testo: 'Syne', tab: 'Syne Mono', pesoVoce: 700, scalaCifra: 0.8, tabPeso: 400,
    facce: [['Syne', V('syne', 'syne-latin-wght-normal.woff2')], ['Syne Mono', S('syne-mono', 'syne-mono-latin-400-normal.woff2'), 400]],
    nota: 'Syne è nato per un centro d’arte parigino: largo e pesante nei neretti, stretto nei chiari. Gli importi in Syne Mono, il suo gemello.',
  },
  {
    nome: 'Largo', voce: 'Hubot Sans', testo: 'Mona Sans', tab: 'Mona Sans', pesoVoce: 800, larghezzaVoce: '125%', tabPeso: 500,
    facce: [['Hubot Sans', V('hubot-sans', 'hubot-sans-latin-standard-normal.woff2'), '200 900', 'font-stretch: 75% 125%;'], ['Mona Sans', V('mona-sans', 'mona-sans-latin-wght-normal.woff2')]],
    nota: 'La cifra stesa al massimo della larghezza (125%), pesante e piatta come una targa. Il resto in Mona Sans, che è della stessa famiglia.',
  },
  {
    nome: 'Antico', voce: 'Cormorant', testo: 'Geologica', tab: 'Cormorant', pesoVoce: 600, tabPeso: 600, tabCorpo: 17,
    facce: [['Cormorant', V('cormorant', 'cormorant-latin-wght-normal.woff2')], ['Geologica', V('geologica', 'geologica-latin-wght-normal.woff2')]],
    nota: 'Un Garamond da titolo, sottile ed elegante: il libro mastro di una bottega di una volta. Gli importi restano nel Garamond, un po’ più grandi.',
  },
  {
    nome: 'Tondo', voce: 'Unbounded', testo: 'Geist', tab: 'Geist', pesoVoce: 600, scalaCifra: 0.86, tabPeso: 500,
    facce: [['Unbounded', V('unbounded', 'unbounded-latin-wght-normal.woff2')], ['Geist', V('geist', 'geist-latin-wght-normal.woff2')]],
    nota: 'Largo e tondo, con le pance delle cifre piene: la cifra si legge da lontano e ha una faccia sua. Tutto il resto in Geist, neutro, così Unbounded resta l’unica voce forte.',
  },
  {
    nome: 'Pennarello', voce: 'Recursive', testo: 'Recursive', tab: 'Recursive', pesoVoce: 800, vsVoce: "'CASL' 1, 'MONO' 0, 'slnt' -15, 'CRSV' 1", vsTesto: "'CASL' 0, 'MONO' 0", vsTab: "'CASL' 1, 'MONO' 1", tabPeso: 600,
    facce: [['Recursive', V('recursive', 'recursive-latin-full-normal.woff2')]],
    nota: 'Recursive con l’asse "casual" al massimo, inclinato e con le forme corsive: la cifra sembra scritta a pennarello sul quaderno dei conti. Testo nella versione composta, importi nella versione monospaziata casual.',
  },
  {
    nome: 'Spigolo', voce: 'Piazzolla', testo: 'Spline Sans', tab: 'Piazzolla', pesoVoce: 700, vsVoce: "'opsz' 72", tabPeso: 500, vsTab: "'opsz' 14",
    facce: [['Piazzolla', V('piazzolla', 'piazzolla-latin-opsz-normal.woff2')], ['Spline Sans', V('spline-sans', 'spline-sans-latin-wght-normal.woff2')]],
    nota: 'Un serif dalle forme spigolose e intagliate, nato per i giornali: molto riconoscibile senza essere fragile ai corpi piccoli.',
  },
  {
    nome: 'Bottega', voce: 'Young Serif', testo: 'Instrument Sans', tab: 'Young Serif', pesoVoce: 400, tabPeso: 400,
    facce: [['Young Serif', S('young-serif', 'young-serif-latin-400-normal.woff2'), 400], ['Instrument Sans', V('instrument-sans', 'instrument-sans-latin-wght-normal.woff2')]],
    nota: 'Un serif grasso e rotondo, da insegna di bottega o da etichetta di marmellata: caldo, pieno, per niente "bancario".',
  },
]

const usate = new Set()
const fontFace = PROPOSTE.flatMap((p) => p.facce).filter(([, url]) => !usate.has(url) && usate.add(url)).map(([fam, url, peso = '100 900', extra = '']) =>
  `@font-face { font-family: "${fam}"; font-weight: ${peso}; ${extra} font-display: block; src: url(${url}) format("woff2"); }`).join('\n')

const stile = (p) => [
  `--voce: '${p.voce}'`, `--testo: '${p.testo}'`, `--tab: '${p.tab}'`,
  `--peso-voce: ${p.pesoVoce}`, `--vs-voce: ${p.vsVoce ?? 'normal'}`, `--vs-testo: ${p.vsTesto ?? 'normal'}`, `--vs-tab: ${p.vsTab ?? p.vsTesto ?? 'normal'}`,
  `--largo-voce: ${p.larghezzaVoce ?? '100%'}`, `--scala-cifra: ${p.scalaCifra ?? 1}`, `--peso-tab: ${p.tabPeso}`, `--corpo-tab: ${p.tabCorpo ?? 15}px`,
].join('; ')

const scheda = (p, i) => `<section class="scheda" style="${stile(p)}">
  <header class="etichetta"><h2>${i + 1}. ${p.nome} <span>${p.voce.replace(' Assi', '')}${p.testo !== p.voce ? ` + ${p.testo}` : ''}</span></h2><p>${p.nota}</p></header>
  <div class="mastro">
    <div class="capo"><button class="scegli"><span>Settembre 2026</span>${icona('chevron-down', 16, 2.2)}</button><button class="tema" aria-label="Tema">${icona('moon', 17, 2)}</button></div>
    <p class="k">Speso finora <span>al 22 settembre</span></p>
    <p class="cifra num">1.284,30<span class="eu">€</span></p>
    <p class="confronto">${icona('arrow-down', 14, 2.6)}<b class="num">96,10</b> <span>rispetto al 22 agosto (1.380,40)</span></p>
    <dl class="conti"><div><dt>Entrate</dt><dd class="piu num">+1.500,00</dd></div><div><dt>Uscite</dt><dd class="num">${MENO}1.284,30</dd></div><div class="saldo"><dt>Saldo</dt><dd class="num">215,70</dd></div></dl>
    <h3>Per categoria</h3>
    <table class="registro"><thead><tr><th colspan="2">Voce</th><th>%</th><th>Importo</th></tr></thead><tbody>
      ${QUOTE.map(([k, v, pc]) => `<tr><td class="t"><span class="tess" style="color:var(--${CAT[k][1]})">${icona(CAT[k][2])}</span></td><td>${CAT[k][0]}</td><td class="pc num">${pc}</td><td class="imp num">${fmt(v, { simbolo: false })}</td></tr>`).join('')}
      <tr class="altre"><td class="t"><span class="tess vuota">${icona('circle-dashed')}</span></td><td>Altre 2</td><td class="pc num">7</td><td class="imp num">83,80</td></tr>
      <tr class="tot"><td></td><td>Totale uscite</td><td class="pc num">100</td><td class="imp num">1.284,30</td></tr></tbody></table>
    <h3>Ultimi movimenti</h3>
    <table class="registro mov"><tbody>
      ${MOV.map((m) => `<tr><td class="data num">${m.g}/09</td><td class="t"><span class="tess" style="color:var(--${CAT[m.k][1]})">${icona(CAT[m.k][2])}</span></td><td class="desc">${m.d}</td><td class="imp num"><span class="${m.v > 0 ? 'piu' : ''}">${firmato(m.v)}</span><span class="prog">${fmt(m.s, { simbolo: false })}</span></td></tr>`).join('')}
    </tbody></table>
  </div></section>`

const vars = (t) => Object.entries(PAL[t]).map(([k, v]) => `--${k}: ${v};`).join(' ')
const html = `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Mastro — dieci caratteri non comuni</title>
<style>
${fontFace}
*, *::before, *::after { box-sizing: border-box; }
:root { --cifra: 60px; }
body { margin: 0; background: #77756f; color: #fff; font: 15px/1.45 system-ui, sans-serif; }
.intro { max-width: 1240px; margin: 0 auto; padding: 26px 20px 4px; }
.intro h1 { margin: 0; font-size: 24px; }
.intro p { margin: 8px 0 0; max-width: 84ch; }
.comandi { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.comandi button { font: 600 14px system-ui; padding: 10px 16px; border-radius: 8px; border: 0; cursor: pointer; background: #fff; color: #111; }
.comandi button[aria-pressed="true"] { background: #111; color: #fff; }
.griglia { display: flex; flex-wrap: wrap; gap: 26px; justify-content: center; padding: 22px 16px 60px; }
.scheda { width: 393px; }
.etichetta h2 { margin: 0; font: 700 18px system-ui; }
.etichetta h2 span { font-weight: 400; font-size: 14px; opacity: .85; margin-left: 4px; }
.etichetta p { margin: 4px 0 10px; font-size: 13.5px; min-height: 58px; opacity: .92; }
.num { font-variant-numeric: tabular-nums; }
button { font: inherit; color: inherit; background: none; border: 0; padding: 0; }
.mastro { --carta: #f7f6f2; --rigo: rgba(28,40,60,.07); --inchiostro: #1a1c1f; --inchiostro-2: #5d6168; --filetto: rgba(26,28,31,.14); --margine: #d4561f; --menu: #fff; ${vars('chiaro')}
  background: var(--carta); color: var(--inchiostro); border-radius: 28px; padding: 18px 20px 20px; font-family: var(--testo); font-variation-settings: var(--vs-testo); }
.scuro .mastro { --carta: #121416; --rigo: rgba(255,255,255,.045); --inchiostro: #e9eaec; --inchiostro-2: #9a9fa7; --filetto: rgba(233,234,236,.14); --margine: #f07a45; --menu: #1d2024; ${vars('scuro')} }
.capo { display: flex; justify-content: space-between; align-items: center; }
.scegli { display: flex; align-items: center; gap: 10px; height: 44px; padding: 0 12px 0 14px; border: 1px solid var(--filetto); border-radius: 8px; font-size: 16px; font-weight: 600; background: var(--menu); }
.scegli span { font-family: var(--voce); font-variation-settings: var(--vs-voce); font-stretch: var(--largo-voce); font-weight: var(--peso-voce); font-size: 17px; }
.tema { width: 44px; height: 44px; display: grid; place-items: center; color: var(--inchiostro-2); }
.k { margin: 22px 0 0; font-size: 14px; font-weight: 600; } .k span { font-weight: 400; color: var(--inchiostro-2); }
/* la cifra del mese: il carattere "di voce", grande */
.cifra { margin: 2px 0 0; font-family: var(--voce); font-variation-settings: var(--vs-voce); font-stretch: var(--largo-voce); font-weight: var(--peso-voce); font-size: calc(var(--cifra) * var(--scala-cifra)); line-height: 1; letter-spacing: -.02em; white-space: nowrap; }
.cifra .eu { font-size: .42em; margin-left: .12em; color: var(--inchiostro-2); letter-spacing: 0; }
.confronto { display: flex; align-items: center; gap: 5px; margin: 10px 0 0; font-size: 14px; color: var(--verde); }
.confronto b { font-weight: 600; } .confronto span { color: var(--inchiostro-2); }
.conti { display: grid; grid-template-columns: 1fr 1fr 1fr; margin: 18px 0 0; border-top: 1px solid var(--filetto); border-bottom: 1px solid var(--filetto); }
.conti div { padding: 10px 0 10px 12px; } .conti div:first-child { padding-left: 0; } .conti div + div { border-left: 1px solid var(--filetto); }
.conti dt { font-size: 12.5px; color: var(--inchiostro-2); }
.conti dd { margin: 2px 0 0; font-family: var(--tab); font-variation-settings: var(--vs-tab); font-weight: var(--peso-tab); font-size: var(--corpo-tab); }
.conti .saldo dd { font-weight: 700; text-decoration: underline double; text-underline-offset: 4px; }
.piu { color: var(--verde); }
h3 { margin: 26px 0 8px; font-family: var(--voce); font-variation-settings: var(--vs-voce); font-stretch: var(--largo-voce); font-weight: var(--peso-voce); font-size: 19px; letter-spacing: -.01em; }
.registro { width: 100%; border-collapse: collapse; font-size: 15px; }
.registro th { text-align: left; font-size: 11.5px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: var(--inchiostro-2); padding: 0 0 6px; border-bottom: 1px solid var(--inchiostro); }
.registro th:nth-child(2) { text-align: right; padding-right: 10px; } .registro th:last-child { text-align: right; }
.registro td { height: 44px; border-bottom: 1px solid var(--rigo); padding: 0; }
.registro .t { width: 38px; }
.registro .pc { text-align: right; width: 40px; color: var(--inchiostro-2); font-size: 13px; padding-right: 10px; }
.registro td.imp { text-align: right; width: 100px; padding-left: 8px; font-family: var(--tab); font-variation-settings: var(--vs-tab); font-weight: var(--peso-tab); font-size: var(--corpo-tab);
  box-shadow: inset 3px 0 0 -1px var(--carta), inset 4px 0 0 -1px var(--margine), inset 1px 0 0 0 var(--margine); }
.registro .altre { color: var(--inchiostro-2); }
.registro .tot td { border-bottom: 3px double var(--inchiostro); font-weight: 700; }
.tess { width: 28px; height: 28px; display: grid; place-items: center; border-radius: 6px; background: color-mix(in srgb, currentColor 18%, var(--carta)); }
.tess.vuota { color: var(--inchiostro-2); background: none; border: 1px dashed var(--filetto); }
.mov .data { width: 48px; font-size: 12.5px; color: var(--inchiostro-2); }
.mov td { height: 52px; } .mov td.imp { width: 108px; } .mov .imp > span { display: block; }
.mov .prog { font-size: .76em; color: var(--inchiostro-2); margin-top: 1px; }
</style>
</head>
<body>
<script>
  if (location.hash === '#scuro') document.documentElement.classList.add('scuro')
  const m = location.search.match(/cifra=(\\d+)/); if (m) document.documentElement.style.setProperty('--cifra', m[1] + 'px')
</script>
<header class="intro"><h1>Mastro — dieci caratteri non comuni</h1>
<p>Stesso Mastro, stessi dati. "Speso finora" parte da 60 px (era 40); con i pulsanti la porti a 52 o 68 per confrontare. Ogni proposta ha un carattere con una voce sua per la cifra, i titoli e, dove regge, gli importi; il resto è in un carattere da testo calmo. Tutti hanno cifre tabellari verificate, sono @fontsource con licenza OFL e funzionano offline.</p>
<div class="comandi">
  <button onclick="document.documentElement.classList.toggle('scuro')">Chiaro / scuro</button>
  ${[52, 60, 68].map((n) => `<button aria-pressed="${n === 60}" onclick="document.documentElement.style.setProperty('--cifra','${n}px');document.querySelectorAll('[aria-pressed]').forEach(b=>b.setAttribute('aria-pressed',b===this))">Cifra ${n} px</button>`).join('')}
</div></header>
<main class="griglia">${PROPOSTE.map(scheda).join('')}</main>
</body>
</html>
`
fs.writeFileSync(path.join(OUT, 'font-mastro.html'), html)
console.log('ok', PROPOSTE.length, 'proposte')
