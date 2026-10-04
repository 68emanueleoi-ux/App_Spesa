// Mastro con dieci coppie tipografiche: stesso disegno, cambia solo il font.
// Uscita: design/proposte/giro-3/font-mastro.html (#scuro per il tema scuro).
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const ROOT = path.resolve(import.meta.dirname, '../..')
const OUT = path.join(ROOT, 'design/proposte/giro-3')
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

/* le dieci coppie: nome, carattere per il testo, carattere per le cifre, file, note */
const F = '../../../node_modules'
const V = (pkg, file) => `${F}/@fontsource-variable/${pkg}/files/${file}`
const S = (pkg, file) => `${F}/@fontsource/${pkg}/files/${file}`
const COPPIE = [
  { id: 'geist', nome: 'Geist + Geist Mono', testo: 'Geist', cifre: 'Geist Mono', facce: [['Geist', V('geist', 'geist-latin-wght-normal.woff2')], ['Geist Mono', V('geist-mono', 'geist-mono-latin-wght-normal.woff2')]], nota: 'Una famiglia sola in due versioni, disegnata per le interfacce: netta, molto leggibile, cifre compatte.' },
  { id: 'recursive', nome: 'Recursive (Sans + Mono)', testo: 'Recursive', cifre: 'Recursive', mono: '"MONO" 1', facce: [['Recursive', V('recursive', 'recursive-latin-full-normal.woff2')]], nota: 'Un solo file variabile con un asse "MONO": le cifre passano a spaziatura fissa senza cambiare carattere. Ha anche un asse "casual" per ammorbidirlo. Il più personalizzabile.' },
  { id: 'redhat', nome: 'Red Hat Text + Red Hat Mono', testo: 'Red Hat Text', cifre: 'Red Hat Mono', facce: [['Red Hat Text', V('red-hat-text', 'red-hat-text-latin-wght-normal.woff2')], ['Red Hat Mono', V('red-hat-mono', 'red-hat-mono-latin-wght-normal.woff2')]], nota: 'Geometrico ma caldo, con le "a" e le "g" a un piano; il mono è gemello del testo.' },
  { id: 'dm', nome: 'DM Sans + DM Mono', testo: 'DM Sans', cifre: 'DM Mono', facce: [['DM Sans', V('dm-sans', 'dm-sans-latin-wght-normal.woff2')], ...[400, 500].map((w) => ['DM Mono', S('dm-mono', `dm-mono-latin-${w}-normal.woff2`), w])], nota: 'Morbido e rotondo: il registro perde un po\' di rigidità e diventa più amichevole.' },
  { id: 'jetbrains', nome: 'Instrument Sans + JetBrains Mono', testo: 'Instrument Sans', cifre: 'JetBrains Mono', facce: [['Instrument Sans', V('instrument-sans', 'instrument-sans-latin-wght-normal.woff2')], ['JetBrains Mono', V('jetbrains-mono', 'jetbrains-mono-latin-wght-normal.woff2')]], nota: 'Testo elegante e stretto, cifre alte e squadrate: il contrasto fra i due è forte.' },
  { id: 'fragment', nome: 'Schibsted Grotesk + Fragment Mono', testo: 'Schibsted Grotesk', cifre: 'Fragment Mono', facce: [['Schibsted Grotesk', V('schibsted-grotesk', 'schibsted-grotesk-latin-wght-normal.woff2')], ['Fragment Mono', S('fragment-mono', 'fragment-mono-latin-400-normal.woff2'), 400]], nota: 'Grottesco da giornale (nato per un quotidiano norvegese) e un mono che è una Helvetica a spaziatura fissa.' },
  { id: 'martian', nome: 'Hanken Grotesk + Martian Mono', testo: 'Hanken Grotesk', cifre: 'Martian Mono', stretto: true, facce: [['Hanken Grotesk', V('hanken-grotesk', 'hanken-grotesk-latin-wght-normal.woff2')], ['Martian Mono', V('martian-mono', 'martian-mono-latin-standard-normal.woff2'), '100 800', 'font-stretch: 75% 112.5%;']], nota: 'Mono tecnico con un asse di larghezza: qui è usato stretto (75%) perché le colonne respirino.' },
  { id: 'reddit', nome: 'Reddit Sans + Reddit Mono', testo: 'Reddit Sans', cifre: 'Reddit Mono', facce: [['Reddit Sans', V('reddit-sans', 'reddit-sans-latin-wght-normal.woff2')], ['Reddit Mono', V('reddit-mono', 'reddit-mono-latin-wght-normal.woff2')]], nota: 'Grottesco semplice e un mono dalle forme piene: il più neutro della serie.' },
  { id: 'literata', nome: 'Literata + Azeret Mono', testo: 'Literata', cifre: 'Azeret Mono', facce: [['Literata', V('literata', 'literata-latin-wght-normal.woff2')], ['Azeret Mono', V('azeret-mono', 'azeret-mono-latin-wght-normal.woff2')]], nota: 'Testo con grazie, come un vero libro dei conti; le cifre restano a spaziatura fissa.' },
  { id: 'sometype', nome: 'Onest + Sometype Mono', testo: 'Onest', cifre: 'Sometype Mono', facce: [['Onest', V('onest', 'onest-latin-wght-normal.woff2')], ['Sometype Mono', V('sometype-mono', 'sometype-mono-latin-wght-normal.woff2')]], nota: 'Testo pulito e un mono un po\' "macchina da scrivere": il registro ha un\'aria più domestica.' },
]
/* seconda serie: un carattere solo, cifre tabellari invece che a spaziatura fissa (verificate in Chrome) */
const UNICI = [
  ['geist-sola', 'Geist', V('geist', 'geist-latin-wght-normal.woff2'), 'La stessa Geist di sopra, ma le cifre restano proporzionali nel disegno e tabellari nella spaziatura: allineate senza l’aria da terminale.'],
  ['mona', 'Mona Sans', V('mona-sans', 'mona-sans-latin-wght-normal.woff2'), 'Grottesco robusto e largo, molto stabile nei numeri grandi.'],
  ['instrument', 'Instrument Sans', V('instrument-sans', 'instrument-sans-latin-wght-normal.woff2'), 'Stretto ed elegante: tanta informazione in poco spazio, tono più raffinato.'],
  ['hanken', 'Hanken Grotesk', V('hanken-grotesk', 'hanken-grotesk-latin-wght-normal.woff2'), 'Neutro e caldo, cifre compatte: il più "tranquillo".'],
  ['funnel', 'Funnel Sans', V('funnel-sans', 'funnel-sans-latin-wght-normal.woff2'), 'Forme un po’ squadrate e moderne, con carattere ma senza stravaganze.'],
  ['sourceserif', 'Source Serif 4', V('source-serif-4', 'source-serif-4-latin-wght-normal.woff2'), 'Con grazie, da libro contabile vero; cifre tabellari allineate in colonna.'],
].map(([id, fam, url, nota]) => ({ id, nome: fam, testo: fam, cifre: fam, facce: [[fam, url]], nota, unico: true }))
const TUTTE = [...COPPIE, ...UNICI]

const fontFace = TUTTE.flatMap((c) => c.facce).map(([fam, url, peso = '100 900', extra = '']) =>
  `@font-face { font-family: "${fam}"; font-weight: ${peso}; ${extra} font-display: block; src: url(${url}) format("woff2"); }`).join('\n')

const scheda = (c) => `<section class="scheda" style="--testo: '${c.testo}'; --cifre: '${c.cifre}'; ${c.mono ? `--mono: ${c.mono};` : '--mono: normal;'} ${c.stretto ? '--largo: 75%;' : '--largo: 100%;'}">
  <header class="etichetta"><h2>${c.nome}</h2><p>${c.nota}</p></header>
  <div class="mastro">
    <div class="capo"><button class="scegli"><span>Settembre 2026</span>${icona('chevron-down', 16, 2.2)}</button><button class="tema" aria-label="Tema">${icona('moon', 17, 2)}</button></div>
    <p class="k">Speso finora <span>al 22 settembre</span></p>
    <p class="cifra num">1.284,30<span class="eu">EUR</span></p>
    <p class="confronto">${icona('arrow-down', 14, 2.6)}<b class="num">96,10</b> <span>rispetto al 22 agosto (1.380,40)</span></p>
    <dl class="conti"><div><dt>Entrate</dt><dd class="piu num">+1.500,00</dd></div><div><dt>Uscite</dt><dd class="num">${MENO}1.284,30</dd></div><div class="saldo"><dt>Saldo</dt><dd class="num">215,70</dd></div></dl>
    <h3>Per categoria</h3>
    <table class="registro"><thead><tr><th colspan="2">Voce</th><th>%</th><th>Importo</th></tr></thead><tbody>
      ${QUOTE.map(([k, v, p]) => `<tr><td class="t"><span class="tess" style="color:var(--${CAT[k][1]})">${icona(CAT[k][2])}</span></td><td>${CAT[k][0]}</td><td class="pc num">${p}</td><td class="imp num">${fmt(v, { simbolo: false })}</td></tr>`).join('')}
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
<title>Mastro — sedici proposte di font</title>
<style>
${fontFace}
*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; background: #77756f; color: #fff; font: 15px/1.45 system-ui, sans-serif; }
.intro { max-width: 1240px; margin: 0 auto; padding: 26px 20px 4px; }
.intro h1 { margin: 0; font-size: 24px; }
.intro p { margin: 8px 0 0; max-width: 80ch; }
.intro button { margin-top: 12px; font: 600 14px system-ui; padding: 10px 16px; border-radius: 8px; border: 0; cursor: pointer; }
.serie { max-width: 1240px; margin: 24px auto 0; padding: 0 20px; font-size: 20px; }
.griglia { display: flex; flex-wrap: wrap; gap: 26px; justify-content: center; padding: 22px 16px 60px; }
.scheda { width: 393px; }
.etichetta h2 { margin: 0; font: 700 17px system-ui; }
.etichetta p { margin: 4px 0 10px; font-size: 13.5px; min-height: 58px; opacity: .92; }
.num { font-variant-numeric: tabular-nums; }
button { font: inherit; color: inherit; background: none; border: 0; padding: 0; }
.mastro { --carta: #f7f6f2; --rigo: rgba(28,40,60,.07); --inchiostro: #1a1c1f; --inchiostro-2: #5d6168; --filetto: rgba(26,28,31,.14); --margine: #d4561f; --menu: #fff; ${vars('chiaro')}
  background: var(--carta); color: var(--inchiostro); border-radius: 28px; padding: 18px 20px 20px; font-family: var(--testo); }
.scuro .mastro { --carta: #121416; --rigo: rgba(255,255,255,.045); --inchiostro: #e9eaec; --inchiostro-2: #9a9fa7; --filetto: rgba(233,234,236,.14); --margine: #f07a45; --menu: #1d2024; ${vars('scuro')} }
/* le cifre: carattere a spaziatura fissa (o l'asse MONO di Recursive) */
.mastro .cifra, .mastro .confronto b, .mastro dd, .mastro .pc, .mastro .imp, .mastro .data, .mastro .prog { font-family: var(--cifre); font-variation-settings: var(--mono); font-stretch: var(--largo); }
.capo { display: flex; justify-content: space-between; align-items: center; }
.scegli { display: flex; align-items: center; gap: 10px; height: 44px; padding: 0 12px 0 14px; border: 1px solid var(--filetto); border-radius: 8px; font-size: 16px; font-weight: 600; background: var(--menu); }
.tema { width: 44px; height: 44px; display: grid; place-items: center; color: var(--inchiostro-2); }
.k { margin: 20px 0 0; font-size: 14px; font-weight: 600; } .k span { font-weight: 400; color: var(--inchiostro-2); }
.cifra { margin: 4px 0 0; font-weight: 500; font-size: 40px; line-height: 1.05; letter-spacing: -.02em; }
.cifra .eu { font-family: var(--testo); font-size: 14px; margin-left: 8px; color: var(--inchiostro-2); letter-spacing: .04em; }
.confronto { display: flex; align-items: center; gap: 5px; margin: 8px 0 0; font-size: 14px; color: var(--verde); }
.confronto b { font-weight: 600; } .confronto span { color: var(--inchiostro-2); }
.conti { display: grid; grid-template-columns: 1fr 1fr 1fr; margin: 18px 0 0; border-top: 1px solid var(--filetto); border-bottom: 1px solid var(--filetto); }
.conti div { padding: 10px 0 10px 12px; } .conti div:first-child { padding-left: 0; } .conti div + div { border-left: 1px solid var(--filetto); }
.conti dt { font-size: 12.5px; color: var(--inchiostro-2); }
.conti dd { margin: 2px 0 0; font-size: 15px; font-weight: 500; }
.conti .saldo dd { font-weight: 600; text-decoration: underline double; text-underline-offset: 4px; }
.piu { color: var(--verde); }
h3 { margin: 26px 0 8px; font-size: 13px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: var(--inchiostro-2); }
.registro { width: 100%; border-collapse: collapse; font-size: 15px; }
.registro th { text-align: left; font-size: 11.5px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: var(--inchiostro-2); padding: 0 0 6px; border-bottom: 1px solid var(--inchiostro); }
.registro th:nth-child(2) { text-align: right; padding-right: 10px; } .registro th:last-child { text-align: right; }
.registro td { height: 44px; border-bottom: 1px solid var(--rigo); padding: 0; }
.registro .t { width: 38px; }
.registro .pc { text-align: right; width: 40px; color: var(--inchiostro-2); font-size: 13px; padding-right: 10px; }
.registro td.imp { text-align: right; width: 96px; padding-left: 8px; box-shadow: inset 3px 0 0 -1px var(--carta), inset 4px 0 0 -1px var(--margine), inset 1px 0 0 0 var(--margine); }
.registro .altre { color: var(--inchiostro-2); }
.registro .tot td { border-bottom: 3px double var(--inchiostro); font-weight: 600; }
.tess { width: 28px; height: 28px; display: grid; place-items: center; border-radius: 6px; background: color-mix(in srgb, currentColor 18%, var(--carta)); }
.tess.vuota { color: var(--inchiostro-2); background: none; border: 1px dashed var(--filetto); }
.mov .data { width: 48px; font-size: 12.5px; color: var(--inchiostro-2); }
.mov td { height: 50px; } .mov td.imp { width: 104px; } .mov .imp > span { display: block; }
.mov .prog { font-size: 11.5px; color: var(--inchiostro-2); margin-top: 1px; }
</style>
</head>
<body>
<script>if (location.hash === '#scuro') document.documentElement.classList.add('scuro')</script>
<header class="intro"><h1>Mastro — sedici proposte di font</h1>
<p>Stesso disegno, stessi dati, stessa dimensione della cifra (40 px). Cambiano solo il carattere del testo e quello delle cifre. Tutti i font sono @fontsource, licenza OFL, e funzionano offline.</p>
<button onclick="document.documentElement.classList.toggle('scuro')">Chiaro / scuro</button></header>
<h2 class="serie">A — Testo + cifre a spaziatura fissa (${COPPIE.length})</h2>
<main class="griglia">${COPPIE.map(scheda).join('')}</main>
<h2 class="serie">B — Un carattere solo, cifre tabellari (${UNICI.length})</h2>
<main class="griglia">${UNICI.map(scheda).join('')}</main>
</body>
</html>
`
fs.writeFileSync(path.join(OUT, 'font-mastro.html'), html)
console.log('ok', TUTTE.length, 'proposte')
