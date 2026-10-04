// Mastro a colori: sei modi di dare colore allo stesso layout, chiaro e scuro.
// Il font si sceglie dal menu in alto fra le dieci proposte del giro 4.
// Uscita: design/proposte/giro-5/colore-mastro.html
// Prima di scrivere controlla il contrasto di ogni coppia testo/fondo e si ferma se una non passa.
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { PROPOSTE } from './font-proposte.mjs'

const ROOT = path.resolve(import.meta.dirname, '../..')
const OUT = path.join(ROOT, 'design/proposte/giro-5')
fs.mkdirSync(OUT, { recursive: true })
const PAL = JSON.parse(fs.readFileSync(new URL('./palette-proposte.json', import.meta.url)))

/* ---------- contrasto WCAG ---------- */
const hex2rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
const lin = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
const lum = (h) => { const [r, g, b] = hex2rgb(h).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b }
const contrasto = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }

/* ---------- formattazione e icone ---------- */
const MENO = '−'
function fmt(c) {
  const a = Math.abs(Math.round(c))
  const corpo = `${Math.floor(a / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${(a % 100).toString().padStart(2, '0')}`
  return c < 0 ? MENO + corpo : corpo
}
const firmato = (v) => `${v > 0 ? '+' : MENO}${fmt(Math.abs(v))}`
const NOMI = ['shopping-basket', 'house', 'bus', 'party-popper', 'zap', 'briefcase-business', 'chevron-down', 'moon', 'arrow-down', 'circle-dashed']
const NODI = {}
for (const n of NOMI) NODI[n] = (await import(pathToFileURL(path.join(ROOT, `node_modules/lucide-react/dist/esm/icons/${n}.mjs`)).href)).__iconData.node
const icona = (n, size = 15, stroke = 2.1) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${NODI[n].map(([t, a]) => `<${t} ${Object.entries(a).filter(([k]) => k !== 'key').map(([k, v]) => `${k}="${v}"`).join(' ')}/>`).join('')}</svg>`

const CAT = { spesa: ['Spesa', 'c1', 'shopping-basket'], affitto: ['Affitto', 'c2', 'house'], trasporti: ['Trasporti', 'c3', 'bus'], svago: ['Svago', 'c4', 'party-popper'], bollette: ['Bollette', 'c5', 'zap'], stipendio: ['Stipendio', 'verde', 'briefcase-business'] }
const QUOTE = [['spesa', 41200, 32], ['affitto', 40000, 31], ['trasporti', 18000, 14], ['svago', 15000, 12], ['bollette', 5850, 5]]
const MOV = [{ g: 22, d: 'Conad', k: 'spesa', v: -4320, s: 21570 }, { g: 21, d: 'Trenitalia', k: 'trasporti', v: -1290, s: 25890 }, { g: 20, d: 'Stipendio', k: 'stipendio', v: 150000, s: 28479 }]

/*
  I sei colori. Ogni tema dichiara i suoi token; "testi" elenca le coppie da
  verificare a 4,5:1, "grafici" quelle a 3:1 (cifra grande, filetti, segni).
*/
const COLORI = [
  {
    id: 'registro', nome: 'Registro verde',
    idea: 'I colori veri dei libri contabili: carta verdina, righe azzurre, doppio margine rosso. Il colore non è decorazione, è il materiale del registro.',
    chiaro: { carta: '#ecf2e3', menu: '#f6f9f0', inchiostro: '#16261e', inchiostro2: '#475a4f', filetto: 'rgba(22,38,30,.2)', rigo: 'rgba(40,90,190,.3)', margine: '#c22f28', cifra: '#16261e', titoli: '#1f4fa6' },
    scuro: { carta: '#11201a', menu: '#192c23', inchiostro: '#e3ede2', inchiostro2: '#9db3a6', filetto: 'rgba(227,237,226,.16)', rigo: 'rgba(130,175,255,.24)', margine: '#ff6a5c', cifra: '#e3ede2', titoli: '#8fb4ff' },
  },
  {
    id: 'mese', nome: 'Il colore del mese',
    idea: 'Ogni mese ha il suo colore, come le linguette di un’agenda: settembre è terracotta, ottobre sarà un altro. La testata del mese è una campitura piena di quel colore; cambiando mese dalla tendina cambia anche lei.',
    blocco: true,
    chiaro: { carta: '#faf6f0', menu: '#fff', inchiostro: '#221a14', inchiostro2: '#675b51', filetto: 'rgba(34,26,20,.14)', rigo: 'rgba(34,26,20,.08)', margine: '#c4521f', cifra: '#1c0d07', titoli: '#221a14', blocco: '#ef6a3f', bloccoTesto: '#1c0d07', bloccoTesto2: '#3f1a0b' },
    scuro: { carta: '#17120e', menu: '#221a14', inchiostro: '#f1e9e2', inchiostro2: '#a99c90', filetto: 'rgba(241,233,226,.14)', rigo: 'rgba(241,233,226,.06)', margine: '#f07a45', cifra: '#fff3ec', titoli: '#f1e9e2', blocco: '#a3401c', bloccoTesto: '#fff3ec', bloccoTesto2: '#f9d2bf' },
  },
  {
    id: 'evidenziatore', nome: 'Evidenziatore',
    idea: 'Come quando si ripassano i conti con gli evidenziatori: la cifra del mese è ripassata in giallo, e ogni categoria ha la sua passata di colore, lunga quanto la spesa.',
    evidenzia: true,
    chiaro: { carta: '#fdfcf8', menu: '#fff', inchiostro: '#1a1a18', inchiostro2: '#5d5c56', filetto: 'rgba(26,26,24,.14)', rigo: 'rgba(26,26,24,.07)', margine: '#d4561f', cifra: '#1a1a18', titoli: '#1a1a18', passata: '#ffe14d' },
    scuro: { carta: '#141413', menu: '#1f1f1d', inchiostro: '#f2f1ec', inchiostro2: '#a3a29b', filetto: 'rgba(242,241,236,.14)', rigo: 'rgba(242,241,236,.06)', margine: '#f07a45', cifra: '#fffbe6', titoli: '#f2f1ec', passata: '#6e5900' },
  },
  {
    id: 'riso', nome: 'Risografia',
    idea: 'Due inchiostri da stampa risograph, blu e rosa fluo, su carta grezza: tutto è stampato con quei due colori, come una fanzine dei conti. Il rosa sta solo sulle cose grandi.',
    chiaro: { carta: '#f3eee2', menu: '#faf7ef', inchiostro: '#203a8c', inchiostro2: '#55629a', filetto: 'rgba(32,58,140,.2)', rigo: 'rgba(32,58,140,.1)', margine: '#e8288a', cifra: '#d81f7e', titoli: '#b8136c' },
    scuro: { carta: '#1a1630', menu: '#241f40', inchiostro: '#cdd7ff', inchiostro2: '#9099cc', filetto: 'rgba(205,215,255,.18)', rigo: 'rgba(205,215,255,.08)', margine: '#ff6fb5', cifra: '#ff7fbd', titoli: '#ff7fbd' },
  },
  {
    id: 'blu', nome: 'Inchiostro blu',
    idea: 'Penna stilografica blu su carta, con il rosso della correzione per i margini: un colore solo, ma che non è il grigio di tutte le app.',
    chiaro: { carta: '#f4f2ea', menu: '#fbfaf5', inchiostro: '#1b2f86', inchiostro2: '#53608e', filetto: 'rgba(27,47,134,.2)', rigo: 'rgba(27,47,134,.09)', margine: '#b8322a', cifra: '#1b2f86', titoli: '#1b2f86' },
    scuro: { carta: '#0e1531', menu: '#172046', inchiostro: '#dde5ff', inchiostro2: '#98a6d8', filetto: 'rgba(221,229,255,.17)', rigo: 'rgba(221,229,255,.07)', margine: '#ff7a6e', cifra: '#dde5ff', titoli: '#dde5ff' },
  },
  {
    id: 'prugna', nome: 'Prugna e ambra',
    idea: 'Nessun grigio: i neutri sono colorati. Carta pesca e inchiostro prugna di giorno, melanzana e ambra di sera.',
    chiaro: { carta: '#f8efe8', menu: '#fff8f3', inchiostro: '#2b1729', inchiostro2: '#6a5065', filetto: 'rgba(43,23,41,.15)', rigo: 'rgba(43,23,41,.07)', margine: '#b45309', cifra: '#5a1f4f', titoli: '#5a1f4f' },
    scuro: { carta: '#1e1221', menu: '#2a1a2e', inchiostro: '#f7e8f1', inchiostro2: '#b9a0b3', filetto: 'rgba(247,232,241,.15)', rigo: 'rgba(247,232,241,.06)', margine: '#ffb454', cifra: '#ffb454', titoli: '#ffb454' },
  },
]

/* ---------- verifica del contrasto ---------- */
const problemi = []
const righe = []
for (const c of COLORI)
  for (const tema of ['chiaro', 'scuro']) {
    const t = c[tema], verde = PAL[c.id][tema].verde
    const prove = [
      ['testo', t.inchiostro, t.carta, 4.5], ['testo secondario', t.inchiostro2, t.carta, 4.5], ['entrate (verde)', verde, t.carta, 4.5],
      ['titoli', t.titoli, t.carta, 4.5], ['cifra grande', t.cifra, c.blocco ? t.blocco : t.carta, 3], ['margine', t.margine, t.carta, 3],
      ...(c.blocco ? [['testo sulla testata', t.bloccoTesto, t.blocco, 4.5], ['secondario sulla testata', t.bloccoTesto2, t.blocco, 4.5]] : []),
      ...(c.evidenzia ? [['cifra sull’evidenziatore', t.cifra, t.passata, 4.5]] : []),
    ]
    for (const [nome, a, b, min] of prove) {
      const r = contrasto(a, b)
      righe.push(`| ${c.nome} | ${tema} | ${nome} | ${a} su ${b} | ${r.toFixed(2)} | ${r >= min ? 'ok' : 'NO'} (min ${min}) |`)
      if (r < min) problemi.push(`${c.nome} ${tema}: ${nome} ${r.toFixed(2)} < ${min}`)
    }
  }
fs.writeFileSync(path.join(OUT, 'verifica-contrasti.md'), `# Contrasti dei sei colori\n\n| colore | tema | coppia | valori | rapporto | esito |\n|-|-|-|-|-|-|\n${righe.join('\n')}\n`)
if (problemi.length) { console.error('Contrasti insufficienti:\n' + problemi.join('\n')); process.exit(1) }

/* ---------- font ---------- */
const usate = new Set()
const fontFace = PROPOSTE.flatMap((p) => p.facce).filter(([, url]) => !usate.has(url) && usate.add(url)).map(([fam, url, peso = '100 900', extra = '']) =>
  `@font-face { font-family: "${fam}"; font-weight: ${peso}; ${extra} font-display: block; src: url(${url}) format("woff2"); }`).join('\n')
const varsFont = (p) => ({
  '--voce': `'${p.voce}'`, '--testo': `'${p.testo}'`, '--tab': `'${p.tab}'`, '--peso-voce': p.pesoVoce, '--vs-voce': p.vsVoce ?? 'normal',
  '--vs-testo': p.vsTesto ?? 'normal', '--vs-tab': p.vsTab ?? p.vsTesto ?? 'normal', '--largo-voce': p.larghezzaVoce ?? '100%',
  '--scala-cifra': p.scalaCifra ?? 1, '--peso-tab': p.tabPeso, '--corpo-tab': `${p.tabCorpo ?? 15}px`,
})
const PREDEFINITO = PROPOSTE.findIndex((p) => p.nome === 'Bottega')

/* ---------- la scheda ---------- */
const token = (t, pal) => [
  `--carta:${t.carta}`, `--menu:${t.menu}`, `--inchiostro:${t.inchiostro}`, `--inchiostro-2:${t.inchiostro2}`, `--filetto:${t.filetto}`, `--rigo:${t.rigo}`,
  `--margine:${t.margine}`, `--cifra-colore:${t.cifra}`, `--titoli:${t.titoli}`, ...(t.blocco ? [`--blocco:${t.blocco}`, `--blocco-testo:${t.bloccoTesto}`, `--blocco-testo-2:${t.bloccoTesto2}`] : []),
  ...(t.passata ? [`--passata:${t.passata}`] : []), ...Object.entries(pal).map(([k, v]) => `--${k}:${v}`),
].join(';')

const massimo = QUOTE[0][1]
const scheda = (c, tema) => `<div class="mastro ${c.id}${c.blocco ? ' con-blocco' : ''}${c.evidenzia ? ' con-passata' : ''}" style="${token(c[tema], PAL[c.id][tema])}">
  <div class="testata">
    <div class="capo"><button class="scegli"><span>Settembre 2026</span>${icona('chevron-down', 16, 2.2)}</button><button class="tema" aria-label="Tema">${icona('moon', 17, 2)}</button></div>
    <p class="k">Speso finora <span>al 22 settembre</span></p>
    <p class="cifra num"><span class="passata">1.284,30</span><span class="eu">€</span></p>
    <p class="confronto">${icona('arrow-down', 14, 2.6)}<b class="num">96,10</b> <span>rispetto al 22 agosto (1.380,40)</span></p>
    <dl class="conti"><div><dt>Entrate</dt><dd class="piu num">+1.500,00</dd></div><div><dt>Uscite</dt><dd class="num">${MENO}1.284,30</dd></div><div class="saldo"><dt>Saldo</dt><dd class="num">215,70</dd></div></dl>
  </div>
  <div class="corpo">
    <h3>Per categoria</h3>
    <table class="registro"><thead><tr><th colspan="2">Voce</th><th>%</th><th>Importo</th></tr></thead><tbody>
      ${QUOTE.map(([k, v, pc]) => `<tr style="--cat:var(--${CAT[k][1]});--quota:${(v / massimo * 100).toFixed(1)}%"><td class="t"><span class="tess" style="color:var(--${CAT[k][1]})">${icona(CAT[k][2])}</span></td><td class="nome"><span>${CAT[k][0]}</span></td><td class="pc num">${pc}</td><td class="imp num">${fmt(v)}</td></tr>`).join('')}
      <tr class="altre" style="--cat:var(--inchiostro-2);--quota:${(8380 / massimo * 100).toFixed(1)}%"><td class="t"><span class="tess vuota">${icona('circle-dashed')}</span></td><td class="nome"><span>Altre 2</span></td><td class="pc num">7</td><td class="imp num">83,80</td></tr>
      <tr class="tot"><td></td><td>Totale uscite</td><td class="pc num">100</td><td class="imp num">1.284,30</td></tr></tbody></table>
    <h3>Ultimi movimenti</h3>
    <table class="registro mov"><tbody>
      ${MOV.map((m) => `<tr><td class="data num">${m.g}/09</td><td class="t"><span class="tess" style="color:var(--${CAT[m.k][1]})">${icona(CAT[m.k][2])}</span></td><td class="desc">${m.d}</td><td class="imp num"><span class="${m.v > 0 ? 'piu' : ''}">${firmato(m.v)}</span><span class="prog">${fmt(m.s)}</span></td></tr>`).join('')}
    </tbody></table>
  </div></div>`

const MESI_COLORI = [['gen', '#5b7bd5'], ['feb', '#c76bb0'], ['mar', '#4fae7a'], ['apr', '#e4b73a'], ['mag', '#e5855b'], ['giu', '#3fa7b5'], ['lug', '#e2574c'], ['ago', '#d99a2b'], ['set', '#ef6a3f'], ['ott', '#9a6b4f'], ['nov', '#7c78c9'], ['dic', '#3f7f6b']]

const html = `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Mastro — sei modi di dargli colore</title>
<style>
${fontFace}
*, *::before, *::after { box-sizing: border-box; }
:root { --cifra: 60px; ${Object.entries(varsFont(PROPOSTE[PREDEFINITO])).map(([k, v]) => `${k}: ${v};`).join(' ')} }
body { margin: 0; background: #6f6d68; color: #fff; font: 15px/1.45 system-ui, sans-serif; }
.intro { max-width: 900px; margin: 0 auto; padding: 26px 20px 4px; }
.intro h1 { margin: 0; font-size: 24px; }
.intro p { margin: 8px 0 0; max-width: 84ch; }
.comandi { position: sticky; top: 0; z-index: 10; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; justify-content: center; padding: 10px 16px; background: #3a3936; }
.comandi label { font-weight: 600; }
.comandi select, .comandi button { font: 600 15px system-ui; padding: 9px 12px; border-radius: 8px; border: 0; background: #fff; color: #111; }
.comandi button[aria-pressed="true"] { background: #111; color: #fff; outline: 2px solid #fff; }
.colore { max-width: 900px; margin: 0 auto; padding: 30px 16px 10px; }
.colore h2 { margin: 0; font-size: 21px; }
.colore > p { margin: 4px 0 14px; max-width: 80ch; }
.coppia { display: flex; flex-wrap: wrap; gap: 24px; justify-content: center; }
.coppia figure { margin: 0; width: 393px; } .coppia figcaption { font-weight: 700; margin: 0 0 6px 4px; }
.mesi { display: flex; gap: 4px; margin: 0 0 14px; } .mesi span { flex: 1; text-align: center; padding: 6px 0; border-radius: 6px; font-size: 12px; font-weight: 700; color: #111; }
.mesi span.ora { outline: 3px solid #fff; }
.num { font-variant-numeric: tabular-nums; }
button { font: inherit; color: inherit; background: none; border: 0; padding: 0; }

/* ---- Mastro, uguale per tutti i colori ---- */
.mastro { background: var(--carta); color: var(--inchiostro); border-radius: 28px; overflow: hidden; font-family: var(--testo); font-variation-settings: var(--vs-testo); }
.testata { padding: 18px 20px 0; }
.corpo { padding: 0 20px 20px; }
.capo { display: flex; justify-content: space-between; align-items: center; }
.scegli { display: flex; align-items: center; gap: 10px; height: 44px; padding: 0 12px 0 14px; border: 1px solid var(--filetto); border-radius: 8px; background: var(--menu); }
.scegli span { font-family: var(--voce); font-variation-settings: var(--vs-voce); font-stretch: var(--largo-voce); font-weight: var(--peso-voce); font-size: 17px; }
.tema { width: 44px; height: 44px; display: grid; place-items: center; color: var(--inchiostro-2); }
.k { margin: 22px 0 0; font-size: 14px; font-weight: 600; } .k span { font-weight: 400; color: var(--inchiostro-2); }
.cifra { margin: 2px 0 0; color: var(--cifra-colore); font-family: var(--voce); font-variation-settings: var(--vs-voce); font-stretch: var(--largo-voce); font-weight: var(--peso-voce); font-size: calc(var(--cifra) * var(--scala-cifra)); line-height: 1; letter-spacing: -.02em; white-space: nowrap; }
.cifra .eu { font-size: .42em; margin-left: .12em; color: var(--inchiostro-2); letter-spacing: 0; }
.confronto { display: flex; align-items: center; gap: 5px; margin: 10px 0 0; font-size: 14px; color: var(--verde); }
.confronto b { font-weight: 700; } .confronto span { color: var(--inchiostro-2); }
.conti { display: grid; grid-template-columns: 1fr 1fr 1fr; margin: 18px 0 0; border-top: 1px solid var(--filetto); border-bottom: 1px solid var(--filetto); }
.conti div { padding: 10px 0 10px 12px; } .conti div:first-child { padding-left: 0; } .conti div + div { border-left: 1px solid var(--filetto); }
.conti dt { font-size: 12.5px; color: var(--inchiostro-2); }
.conti dd { margin: 2px 0 0; font-family: var(--tab); font-variation-settings: var(--vs-tab); font-weight: var(--peso-tab); font-size: var(--corpo-tab); }
.conti .saldo dd { font-weight: 700; text-decoration: underline double; text-underline-offset: 4px; }
.piu { color: var(--verde); }
h3 { margin: 26px 0 8px; color: var(--titoli); font-family: var(--voce); font-variation-settings: var(--vs-voce); font-stretch: var(--largo-voce); font-weight: var(--peso-voce); font-size: 19px; letter-spacing: -.01em; }
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

/* ---- 1 · registro: righe azzurre più presenti, intestazioni a doppio filetto azzurro ---- */
.registro-verde, .mastro.registro .registro td { border-bottom-color: var(--rigo); }
.mastro.registro .registro th { border-bottom: 3px double var(--titoli); }
.mastro.registro .conti { border-top: 3px double var(--titoli); }

/* ---- 2 · il colore del mese: la testata è una campitura piena ---- */
.con-blocco .testata { background: var(--blocco); color: var(--blocco-testo); padding-bottom: 18px; }
.con-blocco .testata .k span, .con-blocco .testata .eu, .con-blocco .testata .confronto span, .con-blocco .testata dt { color: var(--blocco-testo-2); }
.con-blocco .testata .confronto, .con-blocco .testata .piu { color: var(--blocco-testo); }
.con-blocco .testata .scegli { background: transparent; border-color: color-mix(in srgb, var(--blocco-testo) 45%, transparent); }
.con-blocco .testata .tema { color: var(--blocco-testo); }
.con-blocco .testata .conti, .con-blocco .testata .conti div + div { border-color: color-mix(in srgb, var(--blocco-testo) 30%, transparent); }

/* ---- 3 · evidenziatore: passata gialla sotto la cifra, passata di categoria sotto il nome ---- */
.con-passata .cifra .passata { background: linear-gradient(transparent 38%, var(--passata) 38%, var(--passata) 92%, transparent 92%); padding: 0 .06em; margin-left: -.06em; }
.con-passata .registro .nome span { display: inline-block; position: relative; z-index: 0; }
.con-passata .registro .nome { position: relative; }
.con-passata .registro .nome::before { content: ""; position: absolute; left: -4px; top: 9px; bottom: 9px; width: calc(var(--quota) * 1.35); max-width: 100%; border-radius: 3px 8px 6px 3px; background: color-mix(in srgb, var(--cat) 30%, var(--carta)); }
.scuro-tema .con-passata .registro .nome::before { background: color-mix(in srgb, var(--cat) 40%, var(--carta)); }

/* ---- 4 · risografia: due inchiostri; il rosa sui titoli, sulla cifra e sui filetti ---- */
.mastro.riso .registro th { border-bottom: 2px solid var(--margine); }
.mastro.riso .registro .tot td { border-bottom-color: var(--margine); }
.mastro.riso .conti { border-color: var(--margine); }

/* ---- 6 · prugna: il menu del mese è pieno del colore di accento ---- */
.mastro.prugna .scegli { background: var(--cifra-colore); color: var(--carta); border-color: transparent; }
</style>
</head>
<body>
<header class="intro"><h1>Mastro — sei modi di dargli colore</h1>
<p>Stesso layout, stessi dati, cifra a 60 px. Ogni colore nasce da un oggetto (registro contabile, agenda, evidenziatore, stampa risograph, penna stilografica) e non da effetti: niente sfumature, aloni o vetro. Col menu in alto cambi il carattere su tutta la pagina. I contrasti di ogni coppia testo/fondo sono verificati (vedi verifica-contrasti.md).</p></header>
<div class="comandi">
  <label for="font">Carattere</label>
  <select id="font">${PROPOSTE.map((p, i) => `<option value="${i}"${i === PREDEFINITO ? ' selected' : ''}>${i + 1}. ${p.nome} — ${p.voce.replace(' Assi', '')}</option>`).join('')}</select>
  ${[52, 60, 68].map((n) => `<button class="taglia" aria-pressed="${n === 60}" data-n="${n}">${n} px</button>`).join('')}
</div>
${COLORI.map((c, i) => `<section class="colore"><h2>${i + 1}. ${c.nome}</h2><p>${c.idea}</p>
  ${c.blocco ? `<div class="mesi" aria-label="Un colore per ogni mese">${MESI_COLORI.map(([m, col]) => `<span class="${m === 'set' ? 'ora' : ''}" style="background:${col}">${m}</span>`).join('')}</div>` : ''}
  <div class="coppia"><figure><figcaption>Chiaro</figcaption>${scheda(c, 'chiaro')}</figure><figure class="scuro-tema"><figcaption>Scuro</figcaption>${scheda(c, 'scuro')}</figure></div></section>`).join('')}
<script>
  const FONT = ${JSON.stringify(PROPOSTE.map(varsFont))}
  const radice = document.documentElement
  const usa = (i) => Object.entries(FONT[i]).forEach(([k, v]) => radice.style.setProperty(k, v))
  document.getElementById('font').addEventListener('change', (e) => usa(e.target.value))
  document.querySelectorAll('.taglia').forEach((b) => b.addEventListener('click', () => {
    radice.style.setProperty('--cifra', b.dataset.n + 'px')
    document.querySelectorAll('.taglia').forEach((x) => x.setAttribute('aria-pressed', x === b))
  }))
  const q = new URLSearchParams(location.search)
  if (q.get('font')) { usa(q.get('font')); document.getElementById('font').value = q.get('font') }
</script>
</body>
</html>
`
fs.writeFileSync(path.join(OUT, 'colore-mastro.html'), html)
console.log('ok', COLORI.length, 'colori')
