// Mastro definitivo: Bitter (cifra, mese, titoli, importi) + Sora (testo), e ogni dettaglio della
// pagina preso dal colore del mese: testata, carta, inchiostro, filetti, margine del registro,
// grafico, collegamenti, pulsante +, scheda attiva. Restano fissi solo i colori di categoria
// (chiavi per riconoscerle) e il verde delle entrate (ha un significato, accompagna il "+").
// Interruttore: il peso di Bitter segue la stagione, come la vivacità del colore.
// Uscita: design/proposte/giro-9/mastro.html
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { MESI, coloriMese } from './colori-mesi.mjs'
import { provaCifre } from './prova-cifre.mjs'

const ROOT = path.resolve(import.meta.dirname, '../..')
const OUT = path.join(ROOT, 'design/proposte/giro-9')
fs.mkdirSync(OUT, { recursive: true })
const PAL = JSON.parse(fs.readFileSync(new URL('./palette-proposte.json', import.meta.url))).mese

const esito = provaCifre(['@fontsource-variable/bitter', '@fontsource-variable/sora'])
if (!Object.values(esito).every((e) => e.tabellari)) { console.error('Bitter o Sora senza cifre tabellari'); process.exit(1) }
const F = '../../../node_modules'
const facce = `@font-face { font-family: "Bitter"; font-weight: 100 900; font-display: block; src: url(${F}/@fontsource-variable/bitter/files/bitter-latin-wght-normal.woff2) format("woff2"); }
@font-face { font-family: "Sora"; font-weight: 100 800; font-display: block; src: url(${F}/@fontsource-variable/sora/files/sora-latin-wght-normal.woff2) format("woff2"); }`

/* ---------- dati (mockup.html) ---------- */
const MENO = '−'
const fmt = (c) => { const a = Math.abs(c); const t = `${Math.floor(a / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${String(a % 100).padStart(2, '0')}`; return c < 0 ? MENO + t : t }
const firmato = (v) => (v > 0 ? '+' : MENO) + fmt(Math.abs(v))
const CAT = { spesa: ['Spesa', 'c1', 'shopping-basket'], affitto: ['Affitto', 'c2', 'house'], trasporti: ['Trasporti', 'c3', 'bus'], svago: ['Svago', 'c4', 'party-popper'], bollette: ['Bollette', 'c5', 'zap'], stipendio: ['Stipendio', 'verde', 'briefcase-business'] }
const QUOTE = [['spesa', 41200, 32], ['affitto', 40000, 31], ['trasporti', 18000, 14], ['svago', 15000, 12], ['bollette', 5850, 5]]
const MOV = [
  { g: 22, d: 'Conad', k: 'spesa', v: -4320 }, { g: 21, d: 'Trenitalia', k: 'trasporti', v: -1290 }, { g: 21, d: 'Netflix', k: 'svago', v: -1299 },
  { g: 20, d: 'Stipendio', k: 'stipendio', v: 150000 }, { g: 19, d: 'Pizzeria da Michele', k: 'svago', v: -3400 }, { g: 19, d: 'Lidl', k: 'spesa', v: -3000 },
  { g: 19, d: 'Bar Centrale', k: 'svago', v: -240 }, { g: 18, d: 'Enel', k: 'bollette', v: -5850 },
]
const PROG = []; MOV.reduce((s, m) => (PROG.push(s), s - m.v), 21570)
const SETT = [0, 1840, 0, 41200, 990, 13120, 0, 4460, 1290, 0, 12750, 0, 16320, 880, 0, 11301, 4880, 5850, 6640, 0, 2589, 4320]
const AGO = [0, 3000, 2000, 40000, 3500, 0, 10500, 1800, 0, 12500, 2500, 6000, 0, 16000, 3000, 0, 4500, 7000, 2200, 0, 6500, 17040, 4000, 0, 8500, 2500, 5000, 0, 7000, 3000, 4500]
const cum = (a) => a.reduce((r, v) => (r.push((r.at(-1) ?? 0) + v), r), [])
const CS = cum(SETT), CA = cum(AGO)

const NOMI = ['shopping-basket', 'house', 'bus', 'party-popper', 'zap', 'briefcase-business', 'chevron-down', 'moon', 'arrow-down', 'circle-dashed', 'plus', 'chart-no-axes-combined', 'list', 'layers', 'arrow-right']
const NODI = {}
for (const n of NOMI) NODI[n] = (await import(pathToFileURL(path.join(ROOT, `node_modules/lucide-react/dist/esm/icons/${n}.mjs`)).href)).__iconData.node
const icona = (n, size = 15, stroke = 2.1) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${NODI[n].map(([t, a]) => `<${t} ${Object.entries(a).filter(([k]) => k !== 'key').map(([k, v]) => `${k}="${v}"`).join(' ')}/>`).join('')}</svg>`

/* ---------- grafico ---------- */
const W = 353, H = 140, PT = 10, PB = 22
const max = CA.at(-1) * 1.06
const gx = (i) => (i / 30) * W, gy = (v) => H - PB - (v / max) * (H - PT - PB)
const linea = (s) => s.map((v, i) => `${i ? 'L' : 'M'}${gx(i).toFixed(1)},${gy(v).toFixed(1)}`).join(' ')
const grafico = `<svg width="100%" viewBox="0 0 ${W} ${H}" role="img" aria-label="Uscite accumulate, questo mese contro il precedente">
  ${[0, 50000, 100000, 150000].map((v) => `<line x1="0" x2="${W}" y1="${gy(v)}" y2="${gy(v)}" class="griglia"/><text x="0" y="${gy(v) - 4}" class="ax num">${(v / 100).toLocaleString('it-IT')}</text>`).join('')}
  <path d="${linea(CA)}" class="prec"/><path d="${linea(CS)}" class="ora"/>
  <line x1="${gx(21)}" x2="${gx(21)}" y1="${gy(CS[21])}" y2="${H - PB}" class="oggi"/><circle cx="${gx(21)}" cy="${gy(CS[21])}" r="5" class="punto"/>
  ${[1, 10, 20, 30].map((d) => `<text x="${gx(d - 1)}" y="${H - 5}" text-anchor="${d === 1 ? 'start' : 'middle'}" class="ax num">${d}</text>`).join('')}
</svg>`

const STATO = `<div class="stato"><span>17:45</span><span class="isola"></span><span class="segnali"><svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg><svg width="25" height="12" viewBox="0 0 25 12" fill="none"><rect x=".5" y=".5" width="21" height="11" rx="3" stroke="currentColor" stroke-opacity=".5"/><rect x="2" y="2" width="14" height="8" rx="1.6" fill="currentColor"/></svg></span></div>`
const schermata = (tema) => `<div class="telefono ${tema}" style="${Object.entries(PAL[tema]).map(([k, v]) => `--${k}:${v}`).join(';')}"><div class="scorre">
  <header class="testata">${STATO}
    <div class="capo"><button class="scegli"><span class="nome-mese">Settembre 2026</span>${icona('chevron-down', 16, 2.2)}</button><button class="tema" aria-label="Cambia tema">${icona('moon', 18, 2)}</button></div>
    <p class="k">Speso finora <span>al 22 <span class="mese-min">settembre</span></span></p>
    <p class="cifra num">1.284,30<span class="eu">€</span></p>
    <p class="confronto">${icona('arrow-down', 15, 2.6)}<b class="num">96,10</b> <span>meno del 22 <span class="mese-prec">agosto</span> (1.380,40)</span></p>
    <dl class="conti"><div><dt>Entrate</dt><dd class="num">+1.500,00</dd></div><div><dt>Uscite</dt><dd class="num">${MENO}1.284,30</dd></div><div class="saldo"><dt>Saldo</dt><dd class="num">215,70</dd></div></dl>
  </header>
  <main class="corpo">
    <h2>Andamento</h2>${grafico}<p class="leg"><i class="l1"></i><span class="mese-min">settembre</span> <i class="l2"></i><span class="mese-prec">agosto</span></p>
    <h2>Per categoria</h2>
    <table class="registro"><thead><tr><th colspan="2">Voce</th><th>%</th><th>Importo</th></tr></thead><tbody>
      ${QUOTE.map(([k, v, pc]) => `<tr><td class="t"><span class="tess" style="color:var(--${CAT[k][1]})">${icona(CAT[k][2])}</span></td><td>${CAT[k][0]}</td><td class="pc num">${pc}</td><td class="imp num">${fmt(v)}</td></tr>`).join('')}
      <tr class="altre"><td class="t"><span class="tess vuota">${icona('circle-dashed')}</span></td><td>Altre 2</td><td class="pc num">7</td><td class="imp num">83,80</td></tr>
      <tr class="tot"><td></td><td>Totale uscite</td><td class="pc num">100</td><td class="imp num">1.284,30</td></tr></tbody></table>
    <h2>Ultimi movimenti <a href="#">Tutti ${icona('arrow-right', 14, 2.4)}</a></h2>
    <table class="registro mov"><tbody>
      ${MOV.map((m, i) => `<tr><td class="data num">${m.g}/<span class="mm">09</span></td><td class="t"><span class="tess" style="color:var(--${CAT[m.k][1]})">${icona(CAT[m.k][2])}</span></td><td class="desc">${m.d}</td><td class="imp num"><span class="${m.v > 0 ? 'piu' : ''}">${firmato(m.v)}</span><span class="prog">${fmt(PROG[i])}</span></td></tr>`).join('')}
    </tbody></table>
    <div class="fondo"></div>
  </main></div>
  <button class="tasto-piu" aria-label="Aggiungi movimento">${icona('plus', 26, 2.4)}</button>
  <nav class="schede">${[['chart-no-axes-combined', 'Report', 1], ['list', 'Movimenti'], ['layers', 'Categorie']].map(([i, t, on]) => `<a href="#" class="${on ? 'on' : ''}"><span class="ic">${icona(i, 21, 1.8)}</span><span>${t}</span></a>`).join('')}</nav>
</div>`

/*
  Peso di Bitter con la stagione: stessa curva del croma del mese.
  Inverno (croma 0,04) → 640 per la cifra; luglio (0,19) → 880. I titoli seguono di conserva.
*/
const cMin = Math.min(...MESI.map((m) => m.C)), cMax = Math.max(...MESI.map((m) => m.C))
const peso = (C, da, a) => Math.round(da + ((C - cMin) / (cMax - cMin)) * (a - da))
const MESI_JS = MESI.map((m, i) => ({
  nome: m.nome, nota: m.nota, chiaro: coloriMese(i, 'chiaro'), scuro: coloriMese(i, 'scuro'),
  pesoCifra: peso(m.C, 640, 880), pesoTitoli: peso(m.C, 600, 820), pesoTab: peso(m.C, 520, 680),
}))
const OGGI = new Date().getMonth()

const html = `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Mastro — Bitter + Sora, colore del mese</title>
<style>
${facce}
*, *::before, *::after { box-sizing: border-box; }
:root { --w-cifra: 800; --w-titoli: 800; --w-tab: 600; }
body { margin: 0; background: #5f5d59; color: #fff; font: 15px/1.45 system-ui, sans-serif; }
.intro { max-width: 900px; margin: 0 auto; padding: 22px 20px 4px; } .intro h1 { margin: 0; font-size: 22px; } .intro p { margin: 6px 0 0; }
.comandi { position: sticky; top: 0; z-index: 50; display: flex; flex-wrap: wrap; gap: 8px 16px; align-items: center; justify-content: center; padding: 10px 12px; background: #2f2e2b; }
.comandi label { font-weight: 700; } .comandi select, .comandi button { font: 600 15px system-ui; padding: 9px 12px; border-radius: 8px; border: 0; }
.comandi .spunta { display: flex; align-items: center; gap: 8px; font-weight: 600; } .comandi input { width: 20px; height: 20px; }
#nota { width: 100%; text-align: center; font-size: 13.5px; opacity: .9; }
.coppia { display: flex; flex-wrap: wrap; gap: 28px; justify-content: center; padding: 20px 12px 60px; }
.coppia figure { margin: 0; } .coppia figcaption { font-weight: 700; margin: 0 0 8px 6px; }
.num { font-variant-numeric: tabular-nums; }
button { font: inherit; color: inherit; background: none; border: 0; padding: 0; } a { color: inherit; }

/* ---- tutti i colori della schermata vengono dal mese (impostati da mese()) ---- */
.telefono { --filetto: color-mix(in srgb, var(--inchiostro) 15%, transparent); --rigo: color-mix(in srgb, var(--inchiostro) 8%, transparent);
  width: 393px; border-radius: 48px; overflow: hidden; position: relative; isolation: isolate; box-shadow: 0 0 0 10px #111, 0 30px 60px rgba(0,0,0,.35);
  background: var(--carta); color: var(--inchiostro); font-family: "Sora"; }
.iphone .telefono { height: 852px; } .iphone .scorre { height: 100%; overflow-y: auto; scrollbar-width: none; }
.stato { height: 54px; display: flex; align-items: center; justify-content: space-between; padding: 6px 30px 0 34px; font: 600 15px system-ui; position: relative; margin: 0 -20px; }
.stato .isola { position: absolute; left: 50%; top: 11px; width: 124px; height: 36px; margin-left: -62px; background: #000; border-radius: 20px; }
.stato .segnali { display: flex; gap: 6px; align-items: center; }

.testata { background: var(--blocco); color: var(--blocco-testo); padding: 0 20px 18px; }
.capo { display: flex; justify-content: space-between; align-items: center; }
.scegli { display: flex; align-items: center; gap: 10px; height: 44px; padding: 0 12px 0 14px; border: 1px solid color-mix(in srgb, var(--blocco-testo) 45%, transparent); border-radius: 8px; }
.scegli .nome-mese, h2 { font-family: "Bitter"; font-weight: var(--w-titoli); }
.scegli .nome-mese { font-size: 18px; }
.tema { width: 44px; height: 44px; display: grid; place-items: center; }
.k { margin: 20px 0 0; font-size: 14px; font-weight: 600; } .k > span, .eu, .confronto span, .testata dt { color: var(--blocco-testo-2); } .k > span { font-weight: 400; }
.cifra { margin: 2px 0 0; font-family: "Bitter"; font-weight: var(--w-cifra); font-size: 60px; line-height: 1.02; letter-spacing: -.015em; white-space: nowrap; }
.cifra .eu { font-size: .42em; margin-left: .12em; letter-spacing: 0; }
.confronto { display: flex; align-items: center; gap: 5px; margin: 10px 0 0; font-size: 14px; } .confronto b { font-family: "Bitter"; font-weight: var(--w-tab); }
.conti { display: grid; grid-template-columns: 1fr 1fr 1fr; margin: 16px 0 0; border-top: 1px solid color-mix(in srgb, var(--blocco-testo) 30%, transparent); border-bottom: 1px solid color-mix(in srgb, var(--blocco-testo) 30%, transparent); }
.conti div { padding: 9px 0 9px 12px; } .conti div:first-child { padding-left: 0; } .conti div + div { border-left: 1px solid color-mix(in srgb, var(--blocco-testo) 30%, transparent); }
.conti dt { font-size: 12.5px; } .conti dd { margin: 2px 0 0; font-family: "Bitter"; font-weight: var(--w-tab); font-size: 15.5px; }
.conti .saldo dd { font-weight: 800; text-decoration: underline double; text-underline-offset: 4px; }

.corpo { padding: 0 20px; }
h2 { display: flex; align-items: baseline; margin: 26px 0 8px; font-size: 20px; }
h2 a { margin-left: auto; display: inline-flex; align-items: center; gap: 4px; min-height: 44px; margin-block: -12px; font-family: "Sora"; font-size: 14px; font-weight: 700; color: var(--accento); }
svg .griglia { stroke: var(--rigo); } svg .ax { font: 500 11px "Bitter"; fill: var(--inchiostro-2); }
svg .prec { fill: none; stroke: var(--inchiostro-2); stroke-width: 1.3; stroke-dasharray: 4 3; } svg .ora { fill: none; stroke: var(--accento); stroke-width: 2.4; stroke-linejoin: round; }
svg .oggi { stroke: var(--accento); stroke-width: 1; stroke-dasharray: 2 3; } svg .punto { fill: var(--blocco); stroke: var(--accento); stroke-width: 2.5; }
.leg { margin: 4px 0 0; font-size: 12.5px; color: var(--inchiostro-2); } .leg i { display: inline-block; width: 16px; margin: 0 5px 0 0; vertical-align: 4px; } .leg .l2 { margin-left: 12px; }
.l1 { border-top: 2.4px solid var(--accento); } .l2 { border-top: 1.5px dashed var(--inchiostro-2); }
.registro { width: 100%; border-collapse: collapse; font-size: 15px; }
.registro th { text-align: left; font-size: 11.5px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--inchiostro-2); padding: 0 0 6px; border-bottom: 1.5px solid var(--accento); }
.registro th:nth-child(2) { text-align: right; padding-right: 10px; } .registro th:last-child { text-align: right; }
.registro td { height: 44px; border-bottom: 1px solid var(--rigo); padding: 0; }
.registro .t { width: 38px; }
.registro .pc { text-align: right; width: 40px; color: var(--inchiostro-2); font-size: 13px; padding-right: 10px; font-family: "Bitter"; }
/* il doppio margine del registro prende l'accento del mese */
.registro td.imp { text-align: right; width: 104px; padding-left: 8px; font-family: "Bitter"; font-weight: var(--w-tab); font-size: 15.5px;
  box-shadow: inset 3px 0 0 -1px var(--carta), inset 4px 0 0 -1px var(--accento), inset 1px 0 0 0 var(--accento); }
.registro .altre { color: var(--inchiostro-2); } .registro .tot td { border-bottom: 3px double var(--accento); font-weight: 700; }
.tess { width: 28px; height: 28px; display: grid; place-items: center; border-radius: 6px; background: color-mix(in srgb, currentColor 18%, var(--carta)); }
.tess.vuota { color: var(--inchiostro-2); background: none; border: 1px dashed var(--filetto); }
.mov td { height: 52px; } .mov .data { width: 48px; font-size: 12.5px; color: var(--inchiostro-2); font-family: "Bitter"; }
.mov .desc { max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mov .imp > span { display: block; } .mov .prog { font-size: .76em; color: var(--inchiostro-2); margin-top: 1px; }
.piu { color: var(--verde); }
.fondo { height: calc(60px + 58px + 24px + 34px); }
.tasto-piu { position: absolute; right: 18px; bottom: calc(60px + 34px + 14px); width: 58px; height: 58px; display: grid; place-items: center; background: var(--blocco); color: var(--blocco-testo); border-radius: 16px; box-shadow: 0 0 0 1.5px var(--accento); }
.schede { position: absolute; inset: auto 0 0 0; display: grid; grid-template-columns: repeat(3, 1fr); padding-bottom: 34px; background: var(--carta); border-top: 1px solid var(--filetto); }
.schede a { display: grid; justify-items: center; gap: 3px; min-height: 60px; padding-top: 7px; text-decoration: none; color: var(--inchiostro-2); font-size: 11.5px; font-weight: 600; }
.schede .ic { display: grid; place-items: center; width: 52px; height: 28px; border-radius: 14px; }
.schede a.on { color: var(--inchiostro); font-weight: 700; } .schede a.on .ic { background: var(--blocco); color: var(--blocco-testo); }
</style>
</head>
<body>
<header class="intro"><h1>Mastro — Bitter + Sora, tutto nel colore del mese</h1>
<p>Testata, carta, inchiostro, filetti, doppio margine del registro, linea del grafico, collegamenti, pulsante + e scheda attiva cambiano col mese. Restano fissi i colori delle categorie e il verde delle entrate. Tutti i contrasti sono verificati per i 12 mesi, in chiaro e in scuro.</p></header>
<div class="comandi">
  <label for="mese">Mese</label>
  <select id="mese">${MESI.map((m, i) => `<option value="${i}">${m.nome}</option>`).join('')}</select>
  <label class="spunta"><input type="checkbox" id="stagione" checked> Il peso del carattere segue la stagione</label>
  <button id="altezza">Altezza iPhone</button>
  <span id="nota"></span>
</div>
<main class="coppia"><figure><figcaption>Chiaro</figcaption>${schermata('chiaro')}</figure><figure><figcaption>Scuro</figcaption>${schermata('scuro')}</figure></main>
<script>
  const MESI = ${JSON.stringify(MESI_JS)}
  const radice = document.documentElement
  const stagione = document.getElementById('stagione')
  let attuale = 0
  function mese(i) {
    attuale = i
    const m = MESI[i], prec = MESI[(i + 11) % 12]
    for (const tema of ['chiaro', 'scuro']) {
      const t = document.querySelector('.telefono.' + tema), c = m[tema]
      const v = { blocco: c.blocco, 'blocco-testo': c.bloccoTesto, 'blocco-testo-2': c.bloccoTesto2, carta: c.carta, inchiostro: c.inchiostro, 'inchiostro-2': c.inchiostro2, accento: c.accento }
      Object.entries(v).forEach(([k, x]) => t.style.setProperty('--' + k, x))
    }
    const pesi = stagione.checked ? [m.pesoCifra, m.pesoTitoli, m.pesoTab] : [800, 800, 600]
    radice.style.setProperty('--w-cifra', pesi[0]); radice.style.setProperty('--w-titoli', pesi[1]); radice.style.setProperty('--w-tab', pesi[2])
    document.querySelectorAll('.nome-mese').forEach((e) => (e.textContent = m.nome + ' 2026'))
    document.querySelectorAll('.mese-min').forEach((e) => (e.textContent = m.nome.toLowerCase()))
    document.querySelectorAll('.mese-prec').forEach((e) => (e.textContent = prec.nome.toLowerCase()))
    document.querySelectorAll('.mm').forEach((e) => (e.textContent = String(i + 1).padStart(2, '0')))
    document.getElementById('nota').textContent = m.nome + ': ' + m.nota + (stagione.checked ? ' — peso della cifra ' + m.pesoCifra : ' — peso fisso')
  }
  document.getElementById('mese').addEventListener('change', (e) => mese(+e.target.value))
  stagione.addEventListener('change', () => mese(attuale))
  document.getElementById('altezza').addEventListener('click', (e) => { radice.classList.toggle('iphone'); e.target.textContent = radice.classList.contains('iphone') ? 'Schermata intera' : 'Altezza iPhone' })
  const q = new URLSearchParams(location.search)
  const m0 = +(q.get('mese') ?? ${OGGI})
  if (q.get('stagione') === '0') stagione.checked = false
  document.getElementById('mese').value = m0
  mese(m0)
</script>
</body>
</html>
`
fs.writeFileSync(path.join(OUT, 'mastro.html'), html)
console.log('ok; pesi della cifra per mese:', MESI_JS.map((m) => m.nome.slice(0, 3) + ' ' + m.pesoCifra).join(', '))
