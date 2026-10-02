// Secondo giro: cinque design del Report, chiaro e scuro affiancati.
// Dati di mockup.html (settembre 2026, oggi = 22), importi in centesimi interi.
// Font letti da node_modules (installati con --no-save solo per questi mockup).
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const ROOT = path.resolve(import.meta.dirname, '../..')
const OUT = path.join(ROOT, 'design/proposte/giro-2')
fs.mkdirSync(OUT, { recursive: true })
const PAL = JSON.parse(fs.readFileSync(new URL('./palette-proposte.json', import.meta.url)))

/* ---------- formattazione: stessa logica di src/lib/importi.ts ---------- */
const MENO = '−'
function fmt(c, { segno = 'auto', simbolo = true } = {}) {
  const a = Math.abs(Math.round(c))
  const corpo = `${simbolo ? '€ ' : ''}${Math.floor(a / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${(a % 100).toString().padStart(2, '0')}`
  if (segno === 'mai') return corpo
  if (c < 0) return MENO + corpo
  if (segno === 'sempre' && c > 0) return '+' + corpo
  return corpo
}
const nb = (s) => s.replace(/ /g, ' ')
const firmato = (v) => `${v > 0 ? '+' : MENO}${fmt(Math.abs(v), { simbolo: false })}`

/* ---------- icone lucide ---------- */
const NOMI = ['shopping-basket', 'house', 'bus', 'party-popper', 'zap', 'heart-pulse', 'sofa', 'briefcase-business', 'chart-no-axes-combined',
  'list', 'layers', 'plus', 'moon', 'chevron-down', 'chevron-left', 'chevron-right', 'arrow-down', 'arrow-right', 'circle-dashed', 'check', 'trending-down']
const NODI = {}
for (const n of NOMI) NODI[n] = (await import(pathToFileURL(path.join(ROOT, `node_modules/lucide-react/dist/esm/icons/${n}.mjs`)).href)).__iconData.node
const icona = (n, { size = 18, stroke = 2 } = {}) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${NODI[n].map(([t, a]) => `<${t} ${Object.entries(a).filter(([k]) => k !== 'key').map(([k, v]) => `${k}="${v}"`).join(' ')}/>`).join('')}</svg>`

/* ---------- dati ---------- */
const CAT = {
  spesa: { nome: 'Spesa', c: 'c1', i: 'shopping-basket' }, affitto: { nome: 'Affitto', c: 'c2', i: 'house' },
  trasporti: { nome: 'Trasporti', c: 'c3', i: 'bus' }, svago: { nome: 'Svago', c: 'c4', i: 'party-popper' },
  bollette: { nome: 'Bollette', c: 'c5', i: 'zap' }, salute: { nome: 'Salute', c: 'c6', i: 'heart-pulse' },
  casa: { nome: 'Casa', c: 'c8', i: 'sofa' }, stipendio: { nome: 'Stipendio', c: 'verde', i: 'briefcase-business' },
}
const QUOTE = [['spesa', 41200, 32], ['affitto', 40000, 31], ['trasporti', 18000, 14], ['svago', 15000, 12], ['bollette', 5850, 5], ['salute', 4880, 4], ['casa', 3500, 3]]
const VISIBILI = QUOTE.slice(0, 5)
const ALTRE = { imp: 4880 + 3500, pct: 7 }
const MOV = [
  { g: 22, d: 'Conad', k: 'spesa', v: -4320 }, { g: 21, d: 'Trenitalia', k: 'trasporti', v: -1290 },
  { g: 21, d: 'Netflix', k: 'svago', v: -1299 }, { g: 20, d: 'Stipendio', k: 'stipendio', v: 150000 },
  { g: 19, d: 'Pizzeria da Michele', k: 'svago', v: -3400 }, { g: 19, d: 'Lidl', k: 'spesa', v: -3000 },
  { g: 19, d: 'Bar Centrale', k: 'svago', v: -240 }, { g: 18, d: 'Enel', k: 'bollette', v: -5850 },
]
const GIORNO_SETT = { 18: 'venerdì', 19: 'sabato', 20: 'domenica', 21: 'lunedì', 22: 'martedì' }
const cent = (a) => a.map((v) => Math.round(v * 100))
const SETT = cent([0, 18.4, 0, 412, 9.9, 131.2, 0, 44.6, 12.9, 0, 127.5, 0, 163.2, 8.8, 0, 113.01, 48.8, 58.5, 66.4, 0, 25.89, 43.2])
const AGO = cent([0, 30, 20, 400, 35, 0, 105, 18, 0, 125, 25, 60, 0, 160, 30, 0, 45, 70, 22, 0, 65, 170.4, 40, 0, 85, 25, 50, 0, 70, 30, 45])
const cumula = (a) => a.reduce((acc, v) => (acc.push((acc.at(-1) ?? 0) + v), acc), [])
const CS = cumula(SETT), CA = cumula(AGO)
const OGGI = 22, GG = 30, GG_MAX = 31
const USCITE = CS.at(-1), ENTRATE = 150000, SALDO = ENTRATE - USCITE
const AGO_OGGI = CA[OGGI - 1], AGO_TOT = CA.at(-1), DIFF = USCITE - AGO_OGGI
if (USCITE !== 128430 || DIFF !== -9610) throw new Error('dati incoerenti')
// saldo del mese dopo ogni movimento: si parte dal saldo di oggi e si torna indietro
const PROGRESSIVO = []
MOV.reduce((s, m) => (PROGRESSIVO.push(s), s - m.v), SALDO)
const col = (k) => `var(--${CAT[k].c})`

/* ---------- font ---------- */
const F = '../../../node_modules'
const ff = (fam, file, peso = '100 900', extra = '') =>
  `@font-face { font-family: "${fam}"; font-weight: ${peso}; font-display: block; ${extra} src: url(${F}/${file}) format("woff2"); }`

/* ---------- grafico delle uscite accumulate (parametrico) ---------- */
function curva({ W, H, padT = 14, padB = 22, padL = 0, scalino = false, cls = '' }) {
  const max = Math.max(AGO_TOT, USCITE) * 1.06
  const x = (i) => padL + (i / (GG_MAX - 1)) * (W - padL)
  const y = (v) => H - padB - (v / max) * (H - padT - padB)
  const d = (s) => s.map((v, i) => {
    if (!i) return `M${x(0).toFixed(1)},${y(v).toFixed(1)}`
    return scalino ? `H${x(i).toFixed(1)} V${y(v).toFixed(1)}` : `L${x(i).toFixed(1)},${y(v).toFixed(1)}`
  }).join(' ')
  return { x, y, dS: d(CS), dA: d(CA), area: `${d(CS)} L${x(CS.length - 1)},${H - padB} L${x(0)},${H - padB} Z`, xo: x(OGGI - 1), yo: y(USCITE), yA: y(AGO_OGGI), W, H, padB, cls }
}

/* ---------- pagina ---------- */
const STATO = `<div class="stato"><span>17:45</span><span class="isola"></span><span class="segnali">
  <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>
  <svg width="25" height="12" viewBox="0 0 25 12" fill="none"><rect x=".5" y=".5" width="21" height="11" rx="3" stroke="currentColor" stroke-opacity=".5"/><rect x="2" y="2" width="14" height="8" rx="1.6" fill="currentColor"/></svg></span></div>`
const SCHEDE = (attiva = 'Report') => [['chart-no-axes-combined', 'Report'], ['list', 'Movimenti'], ['layers', 'Categorie']]
  .map(([i, t]) => `<a href="#" class="${t === attiva ? 'on' : ''}"${t === attiva ? ' aria-current="page"' : ''}>${icona(i, { size: 21, stroke: 1.8 })}<span>${t}</span></a>`).join('')
const varsPal = (dir, tema) => Object.entries(PAL[dir][tema]).map(([k, v]) => `--${k}: ${v};`).join(' ')
const MESI = ['Settembre 2026', 'Agosto 2026', 'Luglio 2026', 'Giugno 2026', 'Maggio 2026', 'Aprile 2026']

function pagina({ dir, titolo, idea, font, css, schermo, extra = '' }) {
  return `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titolo} — proposta per Spese</title>
<style>
${font}
*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body { margin: 0; background: #77756f; color: #fff; font: 15px/1.45 system-ui, sans-serif; }
.intro { max-width: 860px; margin: 0 auto; padding: 28px 20px 4px; }
.intro h1 { font-size: 24px; margin: 0; }
.intro p { margin: 8px 0 0; max-width: 72ch; }
.intro a { color: #fff; }
.coppia { display: flex; flex-wrap: wrap; gap: 28px; justify-content: center; padding: 20px 16px 40px; }
.coppia figure { margin: 0; }
.coppia figcaption { font-weight: 700; margin: 0 0 8px 4px; }
.telefono { width: 393px; height: 852px; border-radius: 48px; overflow: hidden; position: relative; isolation: isolate; box-shadow: 0 0 0 10px #111, 0 30px 60px rgba(0,0,0,.35); }
.telefono.basso { height: 470px; }
.intero .telefono:not(.basso), .intero .telefono:not(.basso) .scorre { height: auto; }
.scorre { height: 100%; overflow-y: auto; scrollbar-width: none; }
.scorre::-webkit-scrollbar { display: none; }
.stato { height: 54px; display: flex; align-items: center; justify-content: space-between; padding: 6px 30px 0 34px; font: 600 15px system-ui, sans-serif; position: relative; }
.stato .isola { position: absolute; left: 50%; top: 11px; width: 124px; height: 36px; margin-left: -62px; background: #000; border-radius: 20px; }
.stato .segnali { display: flex; gap: 6px; align-items: center; }
.num { font-variant-numeric: tabular-nums; }
button { font: inherit; color: inherit; background: none; border: 0; padding: 0; cursor: pointer; }
a { color: inherit; }
ul { list-style: none; margin: 0; padding: 0; }
/* spazio in fondo: barra schede + pulsante + margine + safe area (34 px su iPhone 15) */
.fondo { height: calc(60px + 58px + 24px + 34px); }
${css}
</style>
</head>
<body>
<script>if (location.hash === '#intero') document.documentElement.classList.add('intero')</script>
<header class="intro"><h1>${titolo}</h1><p>${idea}</p>
<p><a href="#intero" onclick="setTimeout(() => location.reload())">Schermata intera</a> · <a href="#" onclick="setTimeout(() => location.reload())">Altezza iPhone 15</a></p></header>
<main class="coppia">
  <figure><figcaption>Chiaro</figcaption><div class="telefono ${dir} chiaro">${schermo}</div></figure>
  <figure><figcaption>Scuro</figcaption><div class="telefono ${dir} scuro">${schermo}</div></figure>
</main>
${extra}
</body>
</html>
`
}

/* ======================================================================
   1 — MASTRO: il registro di cassa
   ====================================================================== */
function mastro() {
  const g = curva({ W: 353, H: 150, padT: 10, padB: 22 })
  const tendina = (aperta) => `<div class="tendina${aperta ? ' aperta' : ''}">
    <button class="scegli" aria-haspopup="listbox" aria-expanded="${aperta}"><span>Settembre 2026</span>${icona('chevron-down', { size: 16, stroke: 2.2 })}</button>
    ${aperta ? `<ul role="listbox" class="menu">${MESI.map((m, i) => `<li role="option" aria-selected="${!i}">${m}${!i ? icona('check', { size: 16, stroke: 2.4 }) : ''}</li>`).join('')}</ul>` : ''}</div>`
  const testa = (aperta) => `<header class="capo">${tendina(aperta)}<button class="tema" aria-label="Passa al tema scuro">${icona('moon', { size: 17 })}</button></header>`
  const schermo = `<div class="scorre">${STATO}${testa(false)}
  <section class="cassa">
    <p class="k">Speso finora <span>al 22 settembre</span></p>
    <p class="cifra num">${fmt(USCITE, { simbolo: false })}<span class="eu">EUR</span></p>
    <p class="confronto num">${icona('arrow-down', { size: 14, stroke: 2.6 })}${fmt(-DIFF, { simbolo: false })} <span>rispetto al 22 agosto (${fmt(AGO_OGGI, { simbolo: false })})</span></p>
    <dl class="conti num"><div><dt>Entrate</dt><dd class="piu">+${fmt(ENTRATE, { simbolo: false })}</dd></div><div><dt>Uscite</dt><dd>${MENO}${fmt(USCITE, { simbolo: false })}</dd></div><div class="saldo"><dt>Saldo</dt><dd>${fmt(SALDO, { simbolo: false })}</dd></div></dl>
  </section>
  <section class="blocco"><h2>Andamento</h2>
    <svg width="100%" viewBox="0 0 ${g.W} ${g.H}" role="img" aria-label="Uscite accumulate, settembre contro agosto">
      ${[0, 50000, 100000, 150000].map((v) => `<line x1="0" x2="${g.W}" y1="${g.y(v)}" y2="${g.y(v)}" class="griglia"/><text x="0" y="${g.y(v) - 4}" class="ax num">${(v / 100).toLocaleString('it-IT')}</text>`).join('')}
      <path d="${g.dA}" class="ago"/><path d="${g.dS}" class="sett"/>
      <line x1="${g.xo}" x2="${g.xo}" y1="${g.yo}" y2="${g.H - g.padB}" class="oggi"/>
      <rect x="${g.xo - 3.5}" y="${g.yo - 3.5}" width="7" height="7" class="punto"/>
      ${[1, 10, 20, 30].map((d) => `<text x="${g.x(d - 1)}" y="${g.H - 6}" text-anchor="${d === 1 ? 'start' : 'middle'}" class="ax num">${d}</text>`).join('')}
    </svg>
    <p class="leg"><i class="l1"></i>settembre <i class="l2"></i>agosto</p></section>
  <section class="blocco"><h2>Per categoria</h2>
    <table class="registro num"><thead><tr><th colspan="2">Voce</th><th>%</th><th>Importo</th></tr></thead><tbody>
    ${VISIBILI.map(([k, v, p]) => `<tr><td class="t"><span class="tess" style="color:${col(k)}">${icona(CAT[k].i, { size: 15, stroke: 2.1 })}</span></td><td>${CAT[k].nome}</td><td class="pc">${p}</td><td class="imp">${fmt(v, { simbolo: false })}</td></tr>`).join('')}
    <tr class="altre"><td class="t"><span class="tess vuota">${icona('circle-dashed', { size: 15, stroke: 2.1 })}</span></td><td>Altre 2</td><td class="pc">${ALTRE.pct}</td><td class="imp">${fmt(ALTRE.imp, { simbolo: false })}</td></tr>
    <tr class="tot"><td></td><td>Totale uscite</td><td class="pc">100</td><td class="imp">${fmt(USCITE, { simbolo: false })}</td></tr></tbody></table></section>
  <section class="blocco"><h2>Ultimi movimenti <a href="#">Tutti ${icona('arrow-right', { size: 13, stroke: 2.4 })}</a></h2>
    <table class="registro mov num"><thead><tr><th>Data</th><th colspan="2">Descrizione</th><th>Importo · saldo</th></tr></thead><tbody>
    ${MOV.map((m, i) => `<tr><td class="data">${String(m.g).padStart(2, '0')}/09</td><td class="t"><span class="tess" style="color:${col(m.k)}">${icona(CAT[m.k].i, { size: 15, stroke: 2.1 })}</span></td><td class="desc">${m.d}</td><td class="imp"><span class="${m.v > 0 ? 'piu' : ''}">${firmato(m.v)}</span><span class="prog">${fmt(PROGRESSIVO[i], { simbolo: false })}</span></td></tr>`).join('')}
    </tbody></table></section>
  <div class="fondo"></div></div>
  <button class="tasto-piu" aria-label="Aggiungi movimento">${icona('plus', { size: 26, stroke: 2.2 })}</button>
  <nav class="schede">${SCHEDE()}</nav>`

  const css = `
.mastro.chiaro { --carta: #f7f6f2; --rigo: rgba(28,40,60,.07); --inchiostro: #1a1c1f; --inchiostro-2: #5d6168; --filetto: rgba(26,28,31,.14); --margine: #d4561f; --menu: #ffffff; ${varsPal('mastro', 'chiaro')} }
.mastro.scuro { --carta: #121416; --rigo: rgba(255,255,255,.045); --inchiostro: #e9eaec; --inchiostro-2: #9a9fa7; --filetto: rgba(233,234,236,.14); --margine: #f07a45; --menu: #1d2024; ${varsPal('mastro', 'scuro')} }
.mastro { background: var(--carta); color: var(--inchiostro); font-family: "Plex Sans"; }
.mastro .scorre { padding: 0 20px; }
.mastro .stato { margin: 0 -20px; }
.mastro .capo { display: flex; justify-content: space-between; align-items: center; margin-top: 2px; }
/* la tendina del mese: un campo, non un titolo */
.mastro .tendina { position: relative; }
.mastro .scegli { display: flex; align-items: center; gap: 10px; height: 44px; padding: 0 12px 0 14px; border: 1px solid var(--filetto); border-radius: 8px; font-size: 16px; font-weight: 600; background: var(--menu); }
.mastro .menu { position: absolute; z-index: 5; top: 50px; left: 0; width: 230px; background: var(--menu); border: 1px solid var(--filetto); border-radius: 8px; padding: 4px; box-shadow: 0 12px 30px rgba(0,0,0,.18); }
.mastro .menu li { display: flex; justify-content: space-between; align-items: center; height: 44px; padding: 0 12px; border-radius: 5px; font-size: 16px; }
.mastro .menu li[aria-selected="true"] { background: color-mix(in srgb, var(--margine) 12%, transparent); font-weight: 600; }
.mastro .tema { width: 44px; height: 44px; display: grid; place-items: center; color: var(--inchiostro-2); }
.mastro .cassa { margin-top: 22px; }
.mastro .k { margin: 0; font-size: 14px; font-weight: 600; }
.mastro .k span { font-weight: 400; color: var(--inchiostro-2); }
.mastro .cifra { margin: 4px 0 0; font-family: "Plex Mono"; font-weight: 500; font-size: 40px; line-height: 1.05; letter-spacing: -.02em; }
.mastro .cifra .eu { font-size: 14px; font-weight: 500; margin-left: 8px; color: var(--inchiostro-2); letter-spacing: .04em; }
.mastro .confronto { display: flex; align-items: center; gap: 5px; margin: 8px 0 0; font-family: "Plex Mono"; font-size: 14px; font-weight: 600; color: var(--verde); }
.mastro .confronto span { font-family: "Plex Sans"; font-weight: 400; color: var(--inchiostro-2); }
/* i conti come una riga di registro: tre colonne, filetto sopra e doppio filetto sotto al saldo */
.mastro .conti { display: grid; grid-template-columns: 1fr 1fr 1fr; margin: 18px 0 0; border-top: 1px solid var(--filetto); border-bottom: 1px solid var(--filetto); }
.mastro .conti div { padding: 10px 0 10px 12px; } .mastro .conti div:first-child { padding-left: 0; }
.mastro .conti div + div { border-left: 1px solid var(--filetto); }
.mastro .conti dt { font-size: 12.5px; color: var(--inchiostro-2); }
.mastro .conti dd { margin: 2px 0 0; font-family: "Plex Mono"; font-size: 15px; font-weight: 500; }
.mastro .conti .saldo dd { font-weight: 600; text-decoration: underline double; text-underline-offset: 4px; }
.mastro .piu { color: var(--verde); }
.mastro .blocco { margin-top: 30px; }
.mastro h2 { display: flex; align-items: baseline; margin: 0 0 10px; font-size: 13px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: var(--inchiostro-2); }
.mastro h2 a { margin-left: auto; display: inline-flex; align-items: center; gap: 4px; min-height: 44px; margin-block: -14px; font-size: 14px; letter-spacing: 0; text-transform: none; font-weight: 600; color: var(--inchiostro); }
.mastro svg .griglia { stroke: var(--rigo); stroke-width: 1; }
.mastro svg .ax { font: 11px "Plex Mono"; fill: var(--inchiostro-2); }
.mastro svg .ago { fill: none; stroke: var(--inchiostro-2); stroke-width: 1.3; stroke-dasharray: 4 3; }
.mastro svg .sett { fill: none; stroke: var(--inchiostro); stroke-width: 2; stroke-linejoin: round; }
.mastro svg .oggi { stroke: var(--margine); stroke-width: 1; }
.mastro svg .punto { fill: var(--margine); }
.mastro .leg { margin: 4px 0 0; font-size: 12.5px; color: var(--inchiostro-2); }
.mastro .leg i { display: inline-block; width: 16px; margin: 0 5px 0 0; vertical-align: 4px; } .mastro .leg .l2 { margin-left: 12px; }
.mastro .l1 { border-top: 2px solid var(--inchiostro); } .mastro .l2 { border-top: 1.5px dashed var(--inchiostro-2); }
/* il registro: righe a quaderno, e il doppio filetto arancio che separa la colonna degli importi */
.mastro .registro { width: 100%; border-collapse: collapse; font-size: 15px; }
.mastro .registro th { text-align: left; font-size: 11.5px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: var(--inchiostro-2); padding: 0 0 6px; border-bottom: 1px solid var(--inchiostro); }
.mastro .registro td { height: 46px; border-bottom: 1px solid var(--rigo); padding: 0; }
.mastro .registro .t { width: 38px; }
.mastro .registro .pc, .mastro .registro th:nth-child(2) { text-align: right; width: 40px; color: var(--inchiostro-2); font-family: "Plex Mono"; font-size: 13px; padding-right: 10px; }
.mastro .registro .imp, .mastro .registro th:last-child, .mastro .registro th:nth-last-child(2) { text-align: right; font-family: "Plex Mono"; }
.mastro .registro td.imp { width: 86px; box-shadow: inset 3px 0 0 -1px var(--carta), inset 4px 0 0 -1px var(--margine), inset 1px 0 0 0 var(--margine); padding-left: 8px; }
.mastro .registro th:last-child { box-shadow: none; }
.mastro .registro .altre { color: var(--inchiostro-2); }
.mastro .registro .tot td { border-bottom: 3px double var(--inchiostro); font-weight: 600; }
.mastro .tess { width: 28px; height: 28px; display: grid; place-items: center; border-radius: 6px; background: color-mix(in srgb, currentColor 18%, var(--carta)); }
.mastro .tess.vuota { color: var(--inchiostro-2); background: none; border: 1px dashed var(--filetto); }
.mastro .mov .data { width: 48px; font-family: "Plex Mono"; font-size: 12.5px; color: var(--inchiostro-2); }
.mastro .mov .desc { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 150px; }
.mastro .mov td.imp { width: 104px; height: 52px; }
.mastro .mov .imp > span { display: block; }
/* il saldo del mese dopo quel movimento: sotto l'importo, piccolo, come la colonna "progressivo" di un estratto */
.mastro .mov .prog { font-size: 11.5px; color: var(--inchiostro-2); margin-top: 1px; }
.mastro .mov th:nth-child(2) { width: auto; text-align: left; font-family: inherit; font-size: 11.5px; }
.mastro .tasto-piu { position: absolute; right: 18px; bottom: calc(60px + 34px + 14px); width: 58px; height: 58px; display: grid; place-items: center; background: var(--inchiostro); color: var(--carta); border-radius: 14px; }
.mastro .schede { position: absolute; inset: auto 0 0 0; display: grid; grid-template-columns: repeat(3, 1fr); padding-bottom: 34px; background: var(--carta); border-top: 1px solid var(--filetto); }
.mastro .schede a { display: grid; justify-items: center; gap: 2px; min-height: 60px; padding-top: 9px; text-decoration: none; color: var(--inchiostro-2); font-size: 11.5px; font-weight: 500; }
.mastro .schede a.on { color: var(--inchiostro); font-weight: 600; }
.mastro .schede a.on svg { color: var(--margine); }`

  const extra = `<section class="coppia"><figure><figcaption>La tendina del mese, aperta (chiaro e scuro)</figcaption><div style="display:flex;gap:28px;flex-wrap:wrap">
    <div class="telefono mastro chiaro basso"><div class="scorre">${STATO}${testa(true)}</div></div>
    <div class="telefono mastro scuro basso"><div class="scorre">${STATO}${testa(true)}</div></div></div></figure></section>`

  return pagina({
    dir: 'mastro', titolo: '1 — Mastro',
    idea: 'Il registro di cassa di casa. Le cifre sono in un carattere a spaziatura fissa e stanno in colonna come in un libro dei conti; un doppio filetto arancio separa la colonna degli importi; ogni movimento porta accanto il saldo del mese dopo di lui. Font: IBM Plex Sans + IBM Plex Mono. Con la tendina del mese.',
    font: [ff('Plex Sans', '@fontsource-variable/ibm-plex-sans/files/ibm-plex-sans-latin-wght-normal.woff2'), ...[400, 500, 600].map((w) => ff('Plex Mono', `@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-${w}-normal.woff2`, w))].join('\n'),
    css, schermo, extra,
  })
}

/* ======================================================================
   2 — AGENDA: il mese come pagina di calendario
   ====================================================================== */
function agenda() {
  const inizio = 1 // 1 settembre 2026 è martedì: una casella vuota prima (settimana da lunedì)
  const max = Math.max(...SETT)
  let celle = ''
  for (let i = 0; i < inizio; i++) celle += '<span class="vuota"></span>'
  for (let d = 1; d <= GG; d++) {
    const v = SETT[d - 1]
    const futuro = d > OGGI
    // al massimo 60% di arancio: oltre, le cifre dentro la casella non reggono il contrasto
    const intensita = v ? Math.max(0.08, Math.sqrt(v / max) * 0.6) : 0
    celle += `<button class="giorno${futuro ? ' futuro' : ''}${d === OGGI ? ' oggi' : ''}" style="--t:${(intensita * 100).toFixed(0)}%"
      aria-label="${d} settembre: ${futuro ? 'non ancora' : v ? fmt(v) : 'nessuna spesa'}"><span class="n num">${d}</span>${!futuro && v ? `<span class="v num">${Math.round(v / 100)}</span>` : ''}</button>`
  }
  const tendina = (aperta) => `<div class="tendina">
    <button class="titolo-mese" aria-haspopup="listbox" aria-expanded="${aperta}">Settembre <span class="anno">2026</span>${icona('chevron-down', { size: 20, stroke: 2 })}</button>
    ${aperta ? `<ul role="listbox" class="menu">${MESI.map((m, i) => `<li role="option" aria-selected="${!i}"><span>${m.split(' ')[0]}</span><span class="anno">${m.split(' ')[1]}</span></li>`).join('')}</ul>` : ''}</div>`
  const testa = (aperta) => `<header class="capo">${tendina(aperta)}<button class="tema" aria-label="Passa al tema scuro">${icona('moon', { size: 18 })}</button></header>`
  const schermo = `<div class="scorre">${STATO}${testa(false)}
  <section class="riassunto">
    <div><p class="k">Speso finora</p><p class="cifra num">${nb(fmt(USCITE))}</p></div>
    <div class="destra"><p class="k">Ti restano</p><p class="saldo num">${nb(fmt(SALDO))}</p></div>
  </section>
  <p class="confronto num">${icona('arrow-down', { size: 14, stroke: 2.6 })} ${nb(fmt(-DIFF))} meno del 22 agosto</p>
  <section class="calendario" aria-label="Uscite giorno per giorno">
    <div class="sett">${['lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom'].map((g) => `<span>${g}</span>`).join('')}</div>
    <div class="griglia">${celle}</div>
    <p class="nota">Più è pieno il giorno, più hai speso. Tocca un giorno per i suoi movimenti.</p>
  </section>
  <section class="blocco"><h2>Dove sono finiti i soldi</h2><ul class="cat">
    ${VISIBILI.map(([k, v, p]) => `<li><span class="tess" style="color:${col(k)}">${icona(CAT[k].i, { size: 18, stroke: 2 })}</span><span class="nome">${CAT[k].nome}<small class="num">${p}% delle uscite</small></span><span class="imp num">${fmt(v, { simbolo: false })}</span></li>`).join('')}
    <li class="altre"><span class="tess vuota">${icona('circle-dashed', { size: 18, stroke: 2 })}</span><span class="nome">Altre 2<small class="num">${ALTRE.pct}% delle uscite</small></span><span class="imp num">${fmt(ALTRE.imp, { simbolo: false })}</span></li></ul></section>
  <section class="blocco"><h2>Ultimi movimenti <a href="#">Tutti</a></h2>
    ${[22, 21, 20, 19, 18].map((d) => { const r = MOV.filter((m) => m.g === d); return `<div class="giornata"><p class="data"><span class="num">${d}</span> ${GIORNO_SETT[d]}</p><ul>${r.map((m) => `<li><span class="tess" style="color:${col(m.k)}">${icona(CAT[m.k].i, { size: 17, stroke: 2 })}</span><span class="nome">${m.d}<small>${CAT[m.k].nome}</small></span><span class="imp num ${m.v > 0 ? 'piu' : ''}">${firmato(m.v)}</span></li>`).join('')}</ul></div>` }).join('')}
  </section>
  <div class="fondo"></div></div>
  <button class="tasto-piu" aria-label="Aggiungi movimento">${icona('plus', { size: 26, stroke: 2.2 })}</button>
  <nav class="schede">${SCHEDE()}</nav>`

  const css = `
.agenda.chiaro { --carta: #fbfaf7; --foglio: #f1eee7; --inchiostro: #1d1b19; --inchiostro-2: #625d56; --filetto: rgba(29,27,25,.12); --accento: #d9541e; --cella: #e2581f; --menu: #ffffff; ${varsPal('agenda', 'chiaro')} }
.agenda.scuro { --carta: #18171b; --foglio: #222126; --inchiostro: #eeebe6; --inchiostro-2: #a29d96; --filetto: rgba(238,235,230,.13); --accento: #f58a52; --cella: #f0763c; --menu: #26252b; ${varsPal('agenda', 'scuro')} }
.agenda { background: var(--carta); color: var(--inchiostro); font-family: "Instrument Sans"; }
.agenda .scorre { padding: 0 20px; }
.agenda .stato { margin: 0 -20px; }
.agenda .capo { display: flex; justify-content: space-between; align-items: center; }
.agenda .tendina { position: relative; }
/* il nome del mese è il titolo e insieme il comando che apre la tendina */
.agenda .titolo-mese { display: flex; align-items: center; gap: 8px; min-height: 48px; font-family: "Instrument Serif"; font-size: 36px; line-height: 1; letter-spacing: -.01em; }
.agenda .titolo-mese .anno, .agenda .menu .anno { color: var(--inchiostro-2); }
.agenda .titolo-mese svg { color: var(--accento); margin-top: 6px; }
.agenda .menu { position: absolute; z-index: 5; top: 54px; left: 0; width: 250px; background: var(--menu); border-radius: 14px; padding: 6px; box-shadow: 0 0 0 1px var(--filetto), 0 16px 40px rgba(0,0,0,.2); }
.agenda .menu li { display: flex; gap: 8px; align-items: baseline; height: 46px; padding: 10px 12px 0; border-radius: 9px; font-family: "Instrument Serif"; font-size: 24px; }
.agenda .menu li[aria-selected="true"] { background: var(--foglio); }
.agenda .tema { width: 44px; height: 44px; display: grid; place-items: center; color: var(--inchiostro-2); }
.agenda .riassunto { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 16px; }
.agenda .k { margin: 0; font-size: 13.5px; color: var(--inchiostro-2); }
.agenda .cifra { margin: 2px 0 0; font-size: 40px; font-weight: 600; line-height: 1.05; letter-spacing: -.025em; }
.agenda .destra { text-align: right; }
.agenda .saldo { margin: 2px 0 4px; font-size: 19px; font-weight: 600; letter-spacing: -.01em; }
.agenda .confronto { display: flex; align-items: center; gap: 5px; margin: 8px 0 0; font-size: 14.5px; font-weight: 600; color: var(--verde); }
/* il calendario: ogni giorno si riempie d'arancio in proporzione a quanto ha speso */
.agenda .calendario { margin-top: 20px; background: var(--foglio); border-radius: 18px; padding: 12px 10px 12px; }
.agenda .sett, .agenda .griglia { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
.agenda .sett span { text-align: center; font-size: 11.5px; color: var(--inchiostro-2); padding-bottom: 6px; }
.agenda .giorno { position: relative; height: 46px; border-radius: 9px; background: color-mix(in srgb, var(--cella) var(--t), var(--carta)); display: grid; align-content: space-between; padding: 4px 5px; text-align: left; }
.agenda .giorno .n { font-size: 11.5px; color: var(--inchiostro); opacity: .72; }
.agenda .giorno .v { font-size: 13px; font-weight: 600; text-align: right; }
.agenda .giorno.futuro { background: transparent; box-shadow: inset 0 0 0 1px var(--filetto); }
.agenda .giorno.oggi { box-shadow: 0 0 0 2px var(--inchiostro); }
.agenda .giorno.oggi .n { opacity: 1; font-weight: 700; }
.agenda .nota { margin: 10px 4px 0; font-size: 12.5px; color: var(--inchiostro-2); }
.agenda .blocco { margin-top: 30px; }
.agenda h2 { display: flex; align-items: baseline; margin: 0 0 6px; font-family: "Instrument Serif"; font-size: 26px; font-weight: 400; line-height: 1.1; }
.agenda h2 a { margin-left: auto; font-family: "Instrument Sans"; font-size: 14px; font-weight: 600; color: var(--accento); min-height: 44px; display: inline-flex; align-items: center; margin-block: -10px; }
.agenda .tess { width: 40px; height: 40px; display: grid; place-items: center; border-radius: 12px; background: color-mix(in srgb, currentColor 18%, var(--carta)); }
.agenda .tess.vuota { color: var(--inchiostro-2); background: none; border: 1.5px dashed var(--filetto); }
.agenda .cat li, .agenda .giornata li { display: grid; grid-template-columns: 40px 1fr auto; gap: 12px; align-items: center; min-height: 58px; border-bottom: 1px solid var(--filetto); font-size: 15.5px; font-weight: 500; }
.agenda .cat li:last-child, .agenda .giornata li:last-child { border-bottom: 0; }
.agenda small { display: block; font-size: 12.5px; font-weight: 400; color: var(--inchiostro-2); }
.agenda .imp { font-weight: 600; }
.agenda .altre { color: var(--inchiostro-2); }
.agenda .piu { color: var(--verde); }
.agenda .data { margin: 14px 0 0; font-size: 13px; color: var(--inchiostro-2); }
.agenda .data span { font-family: "Instrument Serif"; font-size: 22px; color: var(--inchiostro); margin-right: 2px; }
.agenda .tasto-piu { position: absolute; right: 18px; bottom: calc(60px + 34px + 14px); width: 58px; height: 58px; display: grid; place-items: center; background: var(--accento); color: #fff; border-radius: 50%; }
.agenda.chiaro .tasto-piu { background: #c74a15; }
.agenda.scuro .tasto-piu { color: #1b1209; }
.agenda .schede { position: absolute; inset: auto 0 0 0; display: grid; grid-template-columns: repeat(3, 1fr); padding-bottom: 34px; background: var(--carta); box-shadow: 0 -1px 0 var(--filetto); }
.agenda .schede a { display: grid; justify-items: center; gap: 2px; min-height: 60px; padding-top: 9px; text-decoration: none; color: var(--inchiostro-2); font-size: 11.5px; font-weight: 500; }
.agenda .schede a.on { color: var(--inchiostro); font-weight: 600; }`

  const extra = `<section class="coppia"><figure><figcaption>La tendina del mese, aperta (chiaro e scuro)</figcaption><div style="display:flex;gap:28px;flex-wrap:wrap">
    <div class="telefono agenda chiaro basso"><div class="scorre">${STATO}${testa(true)}</div></div>
    <div class="telefono agenda scuro basso"><div class="scorre">${STATO}${testa(true)}</div></div></div></figure></section>`

  return pagina({
    dir: 'agenda', titolo: '2 — Agenda',
    idea: 'Il mese come pagina di un\'agenda: al posto del grafico c\'è il calendario, e ogni giorno si colora d\'arancio quanto più hai speso, con la cifra scritta dentro. Il nome del mese è un titolo con grazie, e toccandolo si apre la tendina. Font: Instrument Serif (solo titoli) + Instrument Sans.',
    font: [ff('Instrument Sans', '@fontsource-variable/instrument-sans/files/instrument-sans-latin-wght-normal.woff2'), ff('Instrument Serif', '@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2', 400)].join('\n'),
    css, schermo, extra,
  })
}

/* ======================================================================
   3 — ETICHETTA: i valori del mese, come un'etichetta nutrizionale
   ====================================================================== */
function etichetta() {
  const g = curva({ W: 321, H: 92, padT: 8, padB: 18 })
  const schermo = `<div class="scorre">${STATO}
  <header class="capo"><div class="mese"><button aria-label="Mese precedente">${icona('chevron-left', { size: 20, stroke: 2.4 })}</button><h1>Settembre 2026</h1><button aria-label="Mese successivo" disabled>${icona('chevron-right', { size: 20, stroke: 2.4 })}</button></div>
    <button class="tema" aria-label="Passa al tema scuro">${icona('moon', { size: 18 })}</button></header>
  <article class="etichetta-box">
    <h2>Valori del mese</h2>
    <p class="porzione">al 22 settembre · 22 giorni su 30</p>
    <div class="riga spessa"><span>Speso finora</span></div>
    <p class="cifra num">${nb(fmt(USCITE))}</p>
    <div class="riga"><span><b>Rispetto al 22 agosto</b></span><span class="num verde">${MENO}${nb(fmt(-DIFF))}</span></div>
    <div class="riga"><span>Entrate</span><span class="num">+${nb(fmt(ENTRATE))}</span></div>
    <div class="riga media"><span><b>Ti restano</b></span><span class="num"><b>${nb(fmt(SALDO))}</b></span></div>
    <div class="intest"><span>Per categoria</span><span>% uscite</span></div>
    ${VISIBILI.map(([k, v, p]) => `<div class="riga cat"><span class="tess" style="color:${col(k)}">${icona(CAT[k].i, { size: 15, stroke: 2.2 })}</span><span class="nome"><b>${CAT[k].nome}</b> <span class="num">${fmt(v, { simbolo: false })}</span></span><span class="num pc">${p}%</span></div>`).join('')}
    <div class="riga cat altre"><span class="tess vuota">${icona('circle-dashed', { size: 15, stroke: 2.2 })}</span><span class="nome">Altre 2 <span class="num">${fmt(ALTRE.imp, { simbolo: false })}</span></span><span class="num pc">${ALTRE.pct}%</span></div>
    <div class="riga spessa"><span>Andamento</span></div>
    <svg width="100%" viewBox="0 0 ${g.W} ${g.H}" role="img" aria-label="Uscite accumulate, settembre contro agosto">
      <line x1="0" x2="${g.W}" y1="${g.H - g.padB}" y2="${g.H - g.padB}" class="base"/>
      <path d="${g.dA}" class="ago"/><path d="${g.dS}" class="sett"/><circle cx="${g.xo}" cy="${g.yo}" r="4" class="punto"/>
      ${[1, 10, 20, 30].map((d) => `<text x="${g.x(d - 1)}" y="${g.H - 4}" text-anchor="${d === 1 ? 'start' : d === 30 ? 'end' : 'middle'}" class="ax num">${d}</text>`).join('')}
    </svg>
    <p class="piede">— settembre &nbsp; ┄ agosto. Le percentuali sono sul totale delle uscite del mese.</p>
  </article>
  <section class="blocco"><h2>Ultimi movimenti <a href="#">Tutti</a></h2><ul class="mov">
    ${MOV.map((m) => `<li><span class="tess" style="color:${col(m.k)}">${icona(CAT[m.k].i, { size: 17, stroke: 2.1 })}</span><span class="nome">${m.d}<small>${CAT[m.k].nome} · ${m.g} set</small></span><span class="imp num ${m.v > 0 ? 'piu' : ''}">${firmato(m.v)}</span></li>`).join('')}</ul></section>
  <div class="fondo"></div></div>
  <button class="tasto-piu" aria-label="Aggiungi movimento">${icona('plus', { size: 28, stroke: 2.6 })}</button>
  <nav class="schede">${SCHEDE()}</nav>`

  const css = `
.etichetta.chiaro { --carta: #ffffff; --fondo-pag: #efeee9; --inchiostro: #111111; --inchiostro-2: #575757; --filetto: rgba(17,17,17,.14); --accento: #c84b12; ${varsPal('etichetta', 'chiaro')} }
.etichetta.scuro { --carta: #0b0b0b; --fondo-pag: #0b0b0b; --inchiostro: #f3f3f1; --inchiostro-2: #a8a8a4; --filetto: rgba(243,243,241,.16); --accento: #ff7f45; ${varsPal('etichetta', 'scuro')} }
.etichetta { background: var(--fondo-pag); color: var(--inchiostro); font-family: "Archivo"; }
.etichetta .scorre { padding: 0 16px; }
.etichetta .stato { margin: 0 -16px; }
.etichetta .capo { display: flex; justify-content: space-between; align-items: center; }
.etichetta .mese { display: flex; align-items: center; }
.etichetta .mese button { width: 44px; height: 44px; display: grid; place-items: center; }
.etichetta .mese button:disabled { opacity: .3; }
.etichetta h1 { margin: 0; font-size: 18px; font-weight: 800; letter-spacing: -.01em; }
.etichetta .tema { width: 44px; height: 44px; display: grid; place-items: center; color: var(--inchiostro-2); }
/* l'etichetta: riquadro a filo nero, filetti di tre spessori, nient'altro */
.etichetta .etichetta-box { margin-top: 8px; background: var(--carta); border: 2px solid var(--inchiostro); padding: 8px 14px 12px; }
.etichetta .etichetta-box h2 { margin: 0; font-size: 34px; font-weight: 900; letter-spacing: -.03em; line-height: 1.05; }
.etichetta .porzione { margin: 2px 0 6px; font-size: 14px; }
.etichetta .riga { display: flex; justify-content: space-between; align-items: center; gap: 10px; min-height: 34px; border-top: 1px solid var(--inchiostro); font-size: 15px; }
.etichetta .riga.spessa { border-top: 10px solid var(--inchiostro); min-height: 28px; padding-top: 4px; font-size: 14px; font-weight: 800; }
.etichetta .riga.media { border-top-width: 4px; }
.etichetta .cifra { margin: 0 0 6px; font-size: 40px; font-weight: 800; letter-spacing: -.025em; line-height: 1.05; }
.etichetta .verde { color: var(--verde); font-weight: 700; }
.etichetta .intest { display: flex; justify-content: space-between; border-top: 4px solid var(--inchiostro); padding: 5px 0 3px; font-size: 12.5px; font-weight: 800; }
.etichetta .riga.cat { justify-content: flex-start; min-height: 42px; }
.etichetta .riga.cat .nome { flex: 1; }
.etichetta .riga.cat .nome .num { color: var(--inchiostro-2); margin-left: 4px; }
.etichetta .riga .pc { font-weight: 800; }
.etichetta .altre { color: var(--inchiostro-2); }
.etichetta .tess { flex: none; width: 28px; height: 28px; display: grid; place-items: center; border-radius: 5px; background: color-mix(in srgb, currentColor 20%, var(--carta)); }
.etichetta .tess.vuota { color: var(--inchiostro-2); background: none; border: 1.5px dashed var(--filetto); }
.etichetta svg { display: block; margin-top: 6px; }
.etichetta svg .base { stroke: var(--inchiostro); stroke-width: 1; }
.etichetta svg .ago { fill: none; stroke: var(--inchiostro-2); stroke-width: 1.4; stroke-dasharray: 3 3; }
.etichetta svg .sett { fill: none; stroke: var(--inchiostro); stroke-width: 2.4; stroke-linejoin: round; }
.etichetta svg .punto { fill: var(--accento); }
.etichetta svg .ax { font: 600 11px "Archivo"; fill: var(--inchiostro-2); }
.etichetta .piede { margin: 8px 0 0; padding-top: 6px; border-top: 4px solid var(--inchiostro); font-size: 12px; color: var(--inchiostro-2); }
.etichetta .blocco { margin-top: 26px; }
.etichetta .blocco h2 { display: flex; align-items: baseline; margin: 0 0 4px; font-size: 20px; font-weight: 900; letter-spacing: -.02em; }
.etichetta .blocco h2 a { margin-left: auto; font-size: 14px; font-weight: 700; color: var(--accento); min-height: 44px; display: inline-flex; align-items: center; margin-block: -10px; }
.etichetta .mov li { display: grid; grid-template-columns: 28px 1fr auto; gap: 12px; align-items: center; min-height: 56px; border-bottom: 1px solid var(--filetto); font-size: 15.5px; font-weight: 600; }
.etichetta .mov small { display: block; font-size: 12.5px; font-weight: 400; color: var(--inchiostro-2); }
.etichetta .mov .imp { font-weight: 700; }
.etichetta .piu { color: var(--verde); }
.etichetta .tasto-piu { position: absolute; right: 16px; bottom: calc(60px + 34px + 14px); width: 58px; height: 58px; display: grid; place-items: center; background: var(--inchiostro); color: var(--carta); border-radius: 0; }
.etichetta .schede { position: absolute; inset: auto 0 0 0; display: grid; grid-template-columns: repeat(3, 1fr); padding-bottom: 34px; background: var(--carta); border-top: 2px solid var(--inchiostro); }
.etichetta .schede a { display: grid; justify-items: center; gap: 2px; min-height: 60px; padding-top: 9px; text-decoration: none; color: var(--inchiostro-2); font-size: 11.5px; font-weight: 600; }
.etichetta .schede a.on { color: var(--inchiostro); font-weight: 800; }`

  return pagina({
    dir: 'etichetta', titolo: '3 — Etichetta',
    idea: 'I conti del mese impaginati come un\'etichetta dei valori nutrizionali: riquadro a filo nero, filetti di tre spessori, percentuali in colonna a destra. Bianco e nero, l\'arancio solo per "oggi" e i collegamenti. Font: Archivo, una famiglia sola: è un grottesco dello stesso tipo del Franklin Gothic, il carattere delle etichette vere, ma con le cifre tabellari, che a Libre Franklin mancano. Selettore del mese a frecce, come oggi.',
    font: ff('Archivo', '@fontsource-variable/archivo/files/archivo-latin-standard-normal.woff2', '100 900', 'font-stretch: 62% 125%;'),
    css, schermo,
  })
}

/* ======================================================================
   4 — MOSAICO: i soldi come superfici di colore
   ====================================================================== */
function mosaico() {
  const W = 353, H = 270, GAP = 5
  const righe = [[['spesa', 41200], ['affitto', 40000]], [['trasporti', 18000], ['svago', 15000], ['altre', ALTRE.imp], ['bollette', 5850]]]
  const totR = righe.map((r) => r.reduce((s, [, v]) => s + v, 0))
  const tot = totR[0] + totR[1]
  let y = 0
  const tessere = righe.map((r, ri) => {
    const h = Math.round((totR[ri] / tot) * (H - GAP))
    let x = 0
    const out = r.map(([k, v], i) => {
      const w = i === r.length - 1 ? W - x : Math.round((v / totR[ri]) * (W - GAP * (r.length - 1)))
      const altre = k === 'altre'
      const t = `<button class="tessera${w < 80 ? ' stretta' : ''}${altre ? ' altre' : ''}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;color:${altre ? 'var(--inchiostro-2)' : col(k)}"
        aria-label="${altre ? 'Altre 2' : CAT[k].nome}: ${fmt(v)}">${icona(altre ? 'circle-dashed' : CAT[k].i, { size: w < 80 ? 18 : 22, stroke: 2 })}
        ${w >= 80 ? `<span class="n">${altre ? 'Altre 2' : CAT[k].nome}</span><span class="v num">${fmt(v, { simbolo: false })}</span>` : ''}</button>`
      x += w + GAP
      return t
    }).join('')
    y += h + GAP
    return out
  }).join('')
  const g = curva({ W: 353, H: 120, padT: 10, padB: 20 })
  const schermo = `<div class="scorre">${STATO}
  <header class="capo"><div class="mese"><button aria-label="Mese precedente">${icona('chevron-left', { size: 20, stroke: 2.4 })}</button><h1>Settembre</h1><button aria-label="Mese successivo" disabled>${icona('chevron-right', { size: 20, stroke: 2.4 })}</button></div>
    <button class="tema" aria-label="Passa al tema scuro">${icona('moon', { size: 18 })}</button></header>
  <section class="testa">
    <p class="k">Speso finora</p>
    <p class="cifra num">${nb(fmt(USCITE))}</p>
    <p class="sotto num"><span class="verde">${icona('arrow-down', { size: 14, stroke: 2.8 })} ${nb(fmt(-DIFF))}</span> rispetto al 22 agosto · ti restano <b>${nb(fmt(SALDO))}</b></p>
  </section>
  <section class="mosaico-box" aria-label="Ripartizione delle uscite"><div class="campo" style="height:${H}px">${tessere}</div>
    <p class="nota">Ogni riquadro è grande quanto la sua spesa. Bollette: ${fmt(5850)}.</p></section>
  <section class="blocco"><h2>Il mese, giorno per giorno</h2>
    <svg width="100%" viewBox="0 0 ${g.W} ${g.H}" role="img" aria-label="Uscite accumulate, settembre contro agosto">
      <path d="${g.area}" class="area"/><path d="${g.dA}" class="ago"/><path d="${g.dS}" class="sett"/>
      <circle cx="${g.xo}" cy="${g.yo}" r="5" class="punto"/>
      ${[1, 10, 20, 30].map((d) => `<text x="${g.x(d - 1)}" y="${g.H - 4}" text-anchor="${d === 1 ? 'start' : d === 30 ? 'end' : 'middle'}" class="ax num">${d}</text>`).join('')}
    </svg></section>
  <section class="blocco"><h2>Ultimi movimenti <a href="#">Tutti</a></h2><ul class="mov">
    ${MOV.map((m) => `<li><span class="tess" style="color:${col(m.k)}">${icona(CAT[m.k].i, { size: 18, stroke: 2 })}</span><span class="nome">${m.d}<small>${CAT[m.k].nome} · ${m.g} set</small></span><span class="imp num ${m.v > 0 ? 'piu' : ''}">${firmato(m.v)}</span></li>`).join('')}</ul></section>
  <div class="fondo"></div></div>
  <button class="tasto-piu" aria-label="Aggiungi movimento">${icona('plus', { size: 26, stroke: 2.6 })}</button>
  <nav class="schede">${SCHEDE()}</nav>`

  const css = `
.mosaico.chiaro { --carta: #f3efe8; --foglio: #fbf9f5; --inchiostro: #201d24; --inchiostro-2: #615b66; --filetto: rgba(32,29,36,.1); --accento: #c84f17; ${varsPal('mosaico', 'chiaro')} }
.mosaico.scuro { --carta: #1b1a1f; --foglio: #242329; --inchiostro: #f1eef3; --inchiostro-2: #a7a1ac; --filetto: rgba(241,238,243,.1); --accento: #ff8a52; ${varsPal('mosaico', 'scuro')} }
.mosaico { background: var(--carta); color: var(--inchiostro); font-family: "Figtree"; }
.mosaico .scorre { padding: 0 20px; }
.mosaico .stato { margin: 0 -20px; }
.mosaico .capo { display: flex; justify-content: space-between; align-items: center; }
.mosaico .mese { display: flex; align-items: center; margin-left: -12px; }
.mosaico .mese button { width: 44px; height: 44px; display: grid; place-items: center; color: var(--inchiostro-2); }
.mosaico .mese button:disabled { opacity: .3; }
.mosaico h1 { margin: 0; font-family: "Gabarito"; font-size: 20px; font-weight: 700; }
.mosaico .tema { width: 44px; height: 44px; display: grid; place-items: center; border-radius: 14px; background: var(--foglio); color: var(--inchiostro-2); }
.mosaico .testa { margin-top: 14px; }
.mosaico .k { margin: 0; font-size: 14px; font-weight: 600; color: var(--inchiostro-2); }
.mosaico .cifra { margin: 0; font-family: "Gabarito"; font-size: 44px; font-weight: 700; letter-spacing: -.02em; line-height: 1.1; }
.mosaico .sotto { margin: 6px 0 0; font-size: 14.5px; color: var(--inchiostro-2); }
.mosaico .sotto b { color: var(--inchiostro); }
.mosaico .verde { display: inline-flex; align-items: center; gap: 3px; color: var(--verde); font-weight: 700; }
/* il mosaico: superfici proporzionali alla spesa, tinte della categoria, icona sempre presente */
.mosaico .mosaico-box { margin-top: 20px; }
.mosaico .campo { position: relative; }
.mosaico .tessera { position: absolute; border-radius: 16px; background: color-mix(in srgb, currentColor 22%, var(--carta)); display: flex; flex-direction: column; justify-content: space-between; align-items: flex-start; padding: 12px; text-align: left; }
.mosaico .tessera.stretta { align-items: center; justify-content: center; padding: 0; }
.mosaico .tessera .n { color: var(--inchiostro); font-weight: 600; font-size: 14.5px; line-height: 1.2; margin-top: auto; }
.mosaico .tessera .v { color: var(--inchiostro); font-family: "Gabarito"; font-weight: 600; font-size: 17px; }
.mosaico .tessera.altre { background: transparent; box-shadow: inset 0 0 0 1.5px var(--filetto); }
.mosaico .nota { margin: 8px 0 0; font-size: 12.5px; color: var(--inchiostro-2); }
.mosaico .blocco { margin-top: 28px; }
.mosaico h2 { display: flex; align-items: baseline; margin: 0 0 10px; font-family: "Gabarito"; font-size: 19px; font-weight: 700; }
.mosaico h2 a { margin-left: auto; font-family: "Figtree"; font-size: 14px; font-weight: 700; color: var(--accento); min-height: 44px; display: inline-flex; align-items: center; margin-block: -12px; }
.mosaico svg .area { fill: var(--inchiostro); opacity: .06; }
.mosaico svg .ago { fill: none; stroke: var(--inchiostro-2); stroke-width: 1.6; stroke-dasharray: 2 4; stroke-linecap: round; }
.mosaico svg .sett { fill: none; stroke: var(--inchiostro); stroke-width: 2.6; stroke-linejoin: round; stroke-linecap: round; }
.mosaico svg .punto { fill: var(--accento); stroke: var(--carta); stroke-width: 2.5; }
.mosaico svg .ax { font: 600 11px "Figtree"; fill: var(--inchiostro-2); }
.mosaico .mov { background: var(--foglio); border-radius: 20px; padding: 2px 14px; }
.mosaico .mov li { display: grid; grid-template-columns: 40px 1fr auto; gap: 12px; align-items: center; min-height: 60px; border-bottom: 1px solid var(--filetto); font-size: 15.5px; font-weight: 600; }
.mosaico .mov li:last-child { border-bottom: 0; }
.mosaico .mov small { display: block; font-size: 12.5px; font-weight: 500; color: var(--inchiostro-2); }
.mosaico .tess { width: 40px; height: 40px; display: grid; place-items: center; border-radius: 13px; background: color-mix(in srgb, currentColor 22%, var(--foglio)); }
.mosaico .imp { font-family: "Gabarito"; font-weight: 600; font-size: 16px; }
.mosaico .piu { color: var(--verde); }
.mosaico .tasto-piu { position: absolute; right: 18px; bottom: calc(60px + 34px + 14px); width: 60px; height: 60px; display: grid; place-items: center; background: var(--inchiostro); color: var(--carta); border-radius: 20px; }
.mosaico .schede { position: absolute; inset: auto 0 0 0; display: grid; grid-template-columns: repeat(3, 1fr); padding-bottom: 34px; background: var(--carta); box-shadow: 0 -1px 0 var(--filetto); }
.mosaico .schede a { display: grid; justify-items: center; gap: 2px; min-height: 60px; padding-top: 9px; text-decoration: none; color: var(--inchiostro-2); font-size: 11.5px; font-weight: 600; }
.mosaico .schede a.on { color: var(--inchiostro); font-weight: 700; }`

  return pagina({
    dir: 'mosaico', titolo: '4 — Mosaico',
    idea: 'La ripartizione diventa la protagonista: un mosaico in cui ogni categoria occupa una superficie grande quanto la sua spesa, con la sua tinta e la sua icona. Le icone, che sono la cosa da conservare, qui hanno il ruolo principale. Tono più morbido e caldo. Font: Gabarito (cifre e titoli) + Figtree (testo).',
    font: [ff('Gabarito', '@fontsource-variable/gabarito/files/gabarito-latin-wght-normal.woff2'), ff('Figtree', '@fontsource-variable/figtree/files/figtree-latin-wght-normal.woff2')].join('\n'),
    css, schermo,
  })
}

/* ======================================================================
   5 — NOTTURNO: Notte, senza stampino
   ====================================================================== */
function notturno() {
  const g = curva({ W: 393, H: 190, padT: 16, padB: 26, scalino: true })
  const schermo = `<div class="scorre">${STATO}
  <header class="capo"><div class="mese"><button aria-label="Mese precedente">${icona('chevron-left', { size: 20, stroke: 2.2 })}</button><h1>Settembre 2026</h1><button aria-label="Mese successivo" disabled>${icona('chevron-right', { size: 20, stroke: 2.2 })}</button></div>
    <button class="tema" aria-label="Passa al tema chiaro">${icona('moon', { size: 18 })}</button></header>
  <section class="testa">
    <p class="k">Speso finora</p>
    <p class="cifra num">${fmt(USCITE, { simbolo: false })} <span>€</span></p>
    <p class="confronto num"><span class="verde">${icona('trending-down', { size: 16, stroke: 2.4 })} ${nb(fmt(-DIFF))}</span> rispetto al 22 agosto</p>
  </section>
  <figure class="grafico">
    <svg width="100%" viewBox="0 0 ${g.W} ${g.H}" role="img" aria-label="Uscite accumulate giorno per giorno, a gradini; agosto dietro">
      <path d="${g.area}" class="area"/>
      <path d="${g.dA}" class="ago"/><path d="${g.dS}" class="sett"/>
      <line x1="${g.xo}" x2="${g.xo}" y1="${g.yo}" y2="${g.H - g.padB}" class="filo"/>
      <circle cx="${g.xo}" cy="${g.yo}" r="5" class="punto"/>
      <text x="${g.xo + 9}" y="${g.yo + 4}" class="eti">oggi</text>
      ${[1, 10, 20, 30].map((d) => `<text x="${Math.min(g.W - 14, Math.max(16, g.x(d - 1)))}" y="${g.H - 7}" text-anchor="middle" class="ax num">${d}</text>`).join('')}
    </svg>
    <figcaption><i class="l1"></i>settembre <i class="l2"></i>agosto</figcaption>
  </figure>
  <section class="saldo"><div><p class="k">Ti restano questo mese</p><p class="v num">${nb(fmt(SALDO))}</p></div><button class="apri">Entrate e uscite ${icona('chevron-down', { size: 15, stroke: 2.4 })}</button></section>
  <section class="blocco"><h2>Dove sono finiti i soldi</h2><ul class="cat">
    ${VISIBILI.map(([k, v, p]) => `<li><span class="tess" style="color:${col(k)}">${icona(CAT[k].i, { size: 19, stroke: 1.9 })}</span><span class="nome">${CAT[k].nome}<span class="barra"><i style="width:${(v / QUOTE[0][1] * 100).toFixed(1)}%;background:${col(k)}"></i></span></span><span class="imp num">${fmt(v, { simbolo: false })}<small>${p}%</small></span></li>`).join('')}
    <li class="altre"><span class="tess vuota">${icona('circle-dashed', { size: 19, stroke: 1.9 })}</span><span class="nome">Altre 2<span class="barra"><i style="width:${(ALTRE.imp / QUOTE[0][1] * 100).toFixed(1)}%;background:var(--inchiostro-2)"></i></span></span><span class="imp num">${fmt(ALTRE.imp, { simbolo: false })}<small>${ALTRE.pct}%</small></span></li></ul></section>
  <section class="blocco"><h2>Ultimi movimenti <a href="#">Tutti</a></h2><ul class="mov">
    ${MOV.map((m) => `<li><span class="tess" style="color:${col(m.k)}">${icona(CAT[m.k].i, { size: 19, stroke: 1.9 })}</span><span class="nome">${m.d}<small>${CAT[m.k].nome} · ${m.g} set</small></span><span class="imp num ${m.v > 0 ? 'piu' : ''}">${firmato(m.v)}</span></li>`).join('')}</ul></section>
  <div class="fondo"></div></div>
  <button class="tasto-piu" aria-label="Aggiungi movimento">${icona('plus', { size: 26, stroke: 2.4 })}</button>
  <nav class="schede">${SCHEDE()}</nav>`

  const css = `
.notturno.chiaro { --carta: #f4f5f8; --foglio: #ffffff; --inchiostro: #10131a; --inchiostro-2: #5a6070; --filetto: rgba(16,19,26,.09); --accento: #d0581c; ${varsPal('notturno', 'chiaro')} }
.notturno.scuro { --carta: #0d1017; --foglio: #161a23; --inchiostro: #eef0f5; --inchiostro-2: #949bab; --filetto: rgba(238,240,245,.08); --accento: #ff8a4c; ${varsPal('notturno', 'scuro')} }
.notturno { background: var(--carta); color: var(--inchiostro); font-family: "Host Grotesk"; }
.notturno .scorre { padding: 0 20px; }
.notturno .stato { margin: 0 -20px; }
.notturno .capo { display: flex; justify-content: space-between; align-items: center; }
.notturno .mese { display: flex; align-items: center; margin-left: -12px; }
.notturno .mese button { width: 44px; height: 44px; display: grid; place-items: center; color: var(--inchiostro-2); }
.notturno .mese button:disabled { opacity: .3; }
.notturno h1 { margin: 0; font-size: 17px; font-weight: 600; }
.notturno .tema { width: 44px; height: 44px; display: grid; place-items: center; border-radius: 12px; color: var(--inchiostro-2); }
.notturno .testa { margin-top: 18px; }
.notturno .k { margin: 0; font-size: 14px; color: var(--inchiostro-2); }
.notturno .cifra { margin: 2px 0 0; font-size: 44px; font-weight: 600; letter-spacing: -.035em; line-height: 1.05; }
.notturno .cifra span { font-size: 24px; font-weight: 400; color: var(--inchiostro-2); }
.notturno .confronto { margin: 8px 0 0; font-size: 14.5px; color: var(--inchiostro-2); }
.notturno .verde { display: inline-flex; align-items: center; gap: 4px; color: var(--verde); font-weight: 600; }
/* il grafico prende tutta la larghezza dello schermo: niente scheda intorno, niente sfumature */
.notturno .grafico { margin: 10px -20px 0; }
.notturno .grafico svg { display: block; }
.notturno svg .area { fill: var(--inchiostro); opacity: .06; }
.notturno svg .ago { fill: none; stroke: var(--inchiostro-2); stroke-width: 1.4; stroke-dasharray: 3 4; opacity: .8; }
.notturno svg .sett { fill: none; stroke: var(--inchiostro); stroke-width: 2.2; stroke-linejoin: round; }
.notturno svg .filo { stroke: var(--accento); stroke-width: 1; stroke-dasharray: 2 3; }
.notturno svg .punto { fill: var(--accento); stroke: var(--carta); stroke-width: 3; }
.notturno svg .eti { font: 600 12px "Host Grotesk"; fill: var(--accento); }
.notturno svg .ax { font: 11.5px "Host Grotesk"; fill: var(--inchiostro-2); }
.notturno figcaption { padding: 0 20px; font-size: 12.5px; color: var(--inchiostro-2); }
.notturno figcaption i { display: inline-block; width: 14px; vertical-align: 4px; margin-right: 4px; } .notturno figcaption .l2 { margin-left: 10px; }
.notturno .l1 { border-top: 2px solid var(--inchiostro); } .notturno .l2 { border-top: 1.5px dashed var(--inchiostro-2); }
.notturno .saldo { display: flex; justify-content: space-between; align-items: center; margin-top: 20px; padding: 14px 8px 14px 16px; border-radius: 18px; background: var(--foglio); }
.notturno .saldo .v { margin: 2px 0 0; font-size: 24px; font-weight: 600; letter-spacing: -.02em; }
.notturno .apri { display: flex; align-items: center; gap: 4px; min-height: 44px; padding: 0 8px; font-size: 13.5px; font-weight: 600; color: var(--inchiostro-2); }
.notturno .blocco { margin-top: 28px; }
.notturno h2 { display: flex; align-items: baseline; margin: 0 0 8px; font-size: 17px; font-weight: 600; }
.notturno h2 a { margin-left: auto; font-size: 14px; font-weight: 600; color: var(--accento); min-height: 44px; display: inline-flex; align-items: center; margin-block: -12px; }
/* le icone di Notte, cioè la cosa da tenere: riquadro tinto, tratto pieno del colore */
.notturno .tess { width: 42px; height: 42px; display: grid; place-items: center; border-radius: 14px; background: color-mix(in srgb, currentColor 18%, var(--carta)); }
.notturno .tess.vuota { color: var(--inchiostro-2); background: none; border: 1.5px dashed var(--filetto); }
.notturno .cat li, .notturno .mov li { display: grid; grid-template-columns: 42px 1fr auto; gap: 12px; align-items: center; min-height: 60px; font-size: 15.5px; font-weight: 500; }
.notturno .barra { display: block; height: 4px; margin-top: 7px; border-radius: 2px; background: var(--filetto); overflow: hidden; }
.notturno .barra i { display: block; height: 100%; border-radius: 2px; }
.notturno .imp { text-align: right; font-weight: 600; }
.notturno .imp small { display: block; font-size: 12px; font-weight: 400; color: var(--inchiostro-2); }
.notturno .altre { color: var(--inchiostro-2); }
.notturno .mov small { display: block; font-size: 12.5px; font-weight: 400; color: var(--inchiostro-2); }
.notturno .piu { color: var(--verde); }
.notturno .tasto-piu { position: absolute; right: 18px; bottom: calc(60px + 34px + 14px); width: 58px; height: 58px; display: grid; place-items: center; background: var(--accento); color: #fff; border-radius: 18px; }
.notturno.chiaro .tasto-piu { background: #bf4f15; }
.notturno.scuro .tasto-piu { color: #1a0f08; }
.notturno .schede { position: absolute; inset: auto 0 0 0; display: grid; grid-template-columns: repeat(3, 1fr); padding-bottom: 34px; background: var(--carta); box-shadow: 0 -1px 0 var(--filetto); }
.notturno .schede a { display: grid; justify-items: center; gap: 2px; min-height: 60px; padding-top: 9px; text-decoration: none; color: var(--inchiostro-2); font-size: 11.5px; font-weight: 500; }
.notturno .schede a.on { color: var(--inchiostro); font-weight: 600; }
.notturno .schede a.on svg { color: var(--accento); }`

  return pagina({
    dir: 'notturno', titolo: '5 — Notturno',
    idea: 'La variante che avevi scelto, Notte, senza tutto quello che la rendeva da stampino: niente sfumature, aloni, vetro né testo sfumato. Restano il fondo profondo e le icone nel riquadro tinto. Il viola diventa un arancio caldo usato solo per "oggi" e il pulsante +. Il grafico prende tutta la larghezza ed è a gradini: ogni gradino è un giorno di spese. Font: Host Grotesk, una famiglia sola.',
    font: ff('Host Grotesk', '@fontsource-variable/host-grotesk/files/host-grotesk-latin-wght-normal.woff2'),
    css, schermo,
  })
}

const PAGINE = { '1-mastro': mastro, '2-agenda': agenda, '3-etichetta': etichetta, '4-mosaico': mosaico, '5-notturno': notturno }
for (const [nome, fn] of Object.entries(PAGINE)) fs.writeFileSync(path.join(OUT, `${nome}.html`), fn())
console.log('ok', Object.keys(PAGINE).join(', '))
