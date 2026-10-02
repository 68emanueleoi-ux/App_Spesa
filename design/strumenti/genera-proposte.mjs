// Genera i tre mockup statici della Fase 1 in design/proposte/.
// Dati: quelli di mockup.html (settembre 2026, oggi = 22). Importi in centesimi interi.
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const ROOT = path.resolve(import.meta.dirname, '../..')
const OUT = path.join(ROOT, 'design/proposte/giro-1')
fs.mkdirSync(OUT, { recursive: true })
const PAL = JSON.parse(fs.readFileSync(new URL('./palette-proposte.json', import.meta.url)))

/* ---------- formattazione: stessa logica di src/lib/importi.ts ---------- */
const MENO = '\u2212'
function fmt(c, { segno = 'auto', simbolo = true } = {}) {
  const a = Math.abs(Math.round(c))
  const corpo = `${simbolo ? '€ ' : ''}${Math.floor(a / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${(a % 100).toString().padStart(2, '0')}`
  if (segno === 'mai') return corpo
  if (c < 0) return MENO + corpo
  if (segno === 'sempre' && c > 0) return '+' + corpo
  return corpo
}
const nb = (s) => s.replace(/ /g, '\u00a0')

/* ---------- icone lucide, lette dal pacchetto installato ---------- */
const NOMI_ICONE = ['shopping-basket', 'house', 'bus', 'party-popper', 'zap', 'heart-pulse', 'sofa', 'briefcase-business',
  'chart-no-axes-combined', 'list', 'layers', 'plus', 'moon', 'chevron-down', 'arrow-down', 'arrow-right', 'circle-dashed']
const NODI = {}
for (const n of NOMI_ICONE) {
  const mod = await import(pathToFileURL(path.join(ROOT, `node_modules/lucide-react/dist/esm/icons/${n}.mjs`)).href)
  NODI[n] = mod.__iconData.node
}
function icona(n, { size = 18, stroke = 2, cls = '' } = {}) {
  const figli = NODI[n].map(([tag, at]) => `<${tag} ${Object.entries(at).filter(([k]) => k !== 'key').map(([k, v]) => `${k}="${v}"`).join(' ')}/>`).join('')
  return `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${figli}</svg>`
}

/* ---------- dati ---------- */
const CAT = {
  spesa: { nome: 'Spesa', c: 'c1', i: 'shopping-basket' },
  affitto: { nome: 'Affitto', c: 'c2', i: 'house' },
  trasporti: { nome: 'Trasporti', c: 'c3', i: 'bus' },
  svago: { nome: 'Svago', c: 'c4', i: 'party-popper' },
  bollette: { nome: 'Bollette', c: 'c5', i: 'zap' },
  salute: { nome: 'Salute', c: 'c6', i: 'heart-pulse' },
  casa: { nome: 'Casa', c: 'c8', i: 'sofa' },
  stipendio: { nome: 'Stipendio', c: 'verde', i: 'briefcase-business' },
}
const QUOTE = [['spesa', 41200, 32], ['affitto', 40000, 31], ['trasporti', 18000, 14], ['svago', 15000, 12], ['bollette', 5850, 5], ['salute', 4880, 4], ['casa', 3500, 3]]
// come RipartizioneCategorie: oltre 6 voci si mostrano le prime 5 e "Altre N"
const VISIBILI = QUOTE.slice(0, 5)
const ALTRE = { n: 2, imp: 4880 + 3500, pct: 7 }
const MOV = [
  { g: 22, d: 'Conad', k: 'spesa', v: -4320 },
  { g: 21, d: 'Trenitalia', k: 'trasporti', v: -1290 },
  { g: 21, d: 'Netflix', k: 'svago', v: -1299 },
  { g: 20, d: 'Stipendio', k: 'stipendio', v: 150000 },
  { g: 19, d: 'Pizzeria da Michele', k: 'svago', v: -3400 },
  { g: 19, d: 'Lidl', k: 'spesa', v: -3000 },
  { g: 19, d: 'Bar Centrale', k: 'svago', v: -240 },
  { g: 18, d: 'Enel', k: 'bollette', v: -5850 },
]
const cent = (a) => a.map((v) => Math.round(v * 100))
const SETT = cent([0, 18.4, 0, 412, 9.9, 131.2, 0, 44.6, 12.9, 0, 127.5, 0, 163.2, 8.8, 0, 113.01, 48.8, 58.5, 66.4, 0, 25.89, 43.2])
const AGO = cent([0, 30, 20, 400, 35, 0, 105, 18, 0, 125, 25, 60, 0, 160, 30, 0, 45, 70, 22, 0, 65, 170.4, 40, 0, 85, 25, 50, 0, 70, 30, 45])
const cumula = (a) => a.reduce((acc, v) => (acc.push((acc.at(-1) ?? 0) + v), acc), [])
const CS = cumula(SETT), CA = cumula(AGO)
const OGGI = 22, GG = 30, GG_MAX = 31
const USCITE = CS.at(-1), ENTRATE = 150000, SALDO = ENTRATE - USCITE
const AGO_OGGI = CA[OGGI - 1], AGO_TOT = CA.at(-1), DIFF = USCITE - AGO_OGGI
if (USCITE !== 128430 || DIFF !== -9610) throw new Error('dati incoerenti')
const coloreVar = (k) => `var(--${CAT[k].c})`

/* ---------- pezzi comuni ---------- */
const F = '../../../node_modules'
const FONT = `
@font-face { font-family: "Bricolage"; font-weight: 200 800; font-stretch: 75% 100%; font-display: block;
  src: url(${F}/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-standard-normal.woff2) format("woff2-variations"); }
@font-face { font-family: "Bricolage Ottico"; font-weight: 200 800; font-display: block;
  src: url(${F}/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-opsz-normal.woff2) format("woff2-variations"); }
${[400, 500, 700, 800].map((w) => `@font-face { font-family: "Atkinson"; font-weight: ${w}; font-display: block;
  src: url(${F}/@fontsource/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-${w}-normal.woff2) format("woff2"); }`).join('\n')}`

const varsPalette = (dir, tema) => Object.entries(PAL[dir][tema]).map(([k, v]) => `--${k}: ${v};`).join(' ')

const STATO = `<div class="stato"><span>17:45</span><span class="isola"></span><span class="segnali">
  <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>
  <svg width="25" height="12" viewBox="0 0 25 12" fill="none"><rect x=".5" y=".5" width="21" height="11" rx="3" stroke="currentColor" stroke-opacity=".5"/><rect x="2" y="2" width="14" height="8" rx="1.6" fill="currentColor"/></svg></span></div>`

function pagina({ titolo, sottotitolo, css, schermo, dir, note }) {
  return `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titolo} — proposta per Spese</title>
<style>
${FONT}
*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body { margin: 0; background: #8a877f; color: #111; font: 15px/1.45 "Atkinson", system-ui, sans-serif; }
.intro { max-width: 860px; margin: 0 auto; padding: 28px 20px 8px; color: #fff; }
.intro h1 { font: 700 26px/1.1 "Bricolage", sans-serif; margin: 0; }
.intro p { margin: 8px 0 0; max-width: 70ch; }
.coppia { display: flex; flex-wrap: wrap; gap: 28px; justify-content: center; padding: 20px 16px 60px; }
.coppia figure { margin: 0; }
.coppia figcaption { color: #fff; font-weight: 700; margin: 0 0 8px 4px; }
.telefono { width: 393px; height: 852px; border-radius: 48px; overflow: hidden; position: relative; isolation: isolate;
  box-shadow: 0 0 0 10px #111, 0 30px 60px rgba(0,0,0,.35); }
.scorre { height: 100%; overflow-y: auto; scrollbar-width: none; }
.scorre::-webkit-scrollbar { display: none; }
.stato { height: 54px; display: flex; align-items: center; justify-content: space-between; padding: 6px 30px 0 34px; font: 700 15px "Atkinson"; position: relative; }
.stato .isola { position: absolute; left: 50%; top: 11px; width: 124px; height: 36px; margin-left: -62px; background: #000; border-radius: 20px; }
.stato .segnali { display: flex; gap: 6px; align-items: center; }
.num { font-variant-numeric: tabular-nums; }
/* #intero: il telefono si allunga per vedere tutta la schermata in una volta */
.intero .telefono { height: auto; } .intero .scorre { height: auto; }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
${css}
</style>
</head>
<body>
<script>if (location.hash === '#intero') document.documentElement.classList.add('intero')</script>
<header class="intro"><h1>${titolo}</h1><p>${sottotitolo}</p><p><a href="#intero" onclick="setTimeout(() => location.reload())" style="color:#fff">Mostra la schermata intera</a> · <a href="#" onclick="setTimeout(() => location.reload())" style="color:#fff">Altezza iPhone 15</a></p></header>
<main class="coppia">
  <figure><figcaption>Chiaro</figcaption><div class="telefono ${dir} chiaro">${schermo}</div></figure>
  <figure><figcaption>Scuro</figcaption><div class="telefono ${dir} scuro">${schermo}</div></figure>
</main>
${note ?? ''}
</body>
</html>
`
}

/* ======================================================================
   A — SCONTRINO
   ====================================================================== */
function codiceABarre({ serie, giorni, alt, w, oggi, classe }) {
  const slot = w / GG_MAX
  const max = Math.max(...SETT, ...AGO)
  let s = ''
  for (let i = 0; i < giorni; i++) {
    const cx = (i + 0.5) * slot
    if (oggi !== undefined && i >= oggi) {
      s += `<rect x="${(cx - 0.6).toFixed(2)}" y="${alt - 3}" width="1.2" height="3" class="futuro"/>`
      continue
    }
    const v = serie[i] ?? 0
    if (!v) continue
    const larg = Math.max(1, (v / max) * slot * 0.92)
    s += `<rect x="${(cx - larg / 2).toFixed(2)}" y="0" width="${larg.toFixed(2)}" height="${alt}" class="${classe}"/>`
  }
  return s
}
function scontrino() {
  const W = 321
  const leader = (sx, dx, cls = '') => `<div class="riga ${cls}"><span class="sx">${sx}</span><span class="punti"></span><span class="dx num">${dx}</span></div>`
  const quota = ([k, v, p]) => `<div class="voce">
      <span class="tess" style="color:${coloreVar(k)}">${icona(CAT[k].i, { size: 15, stroke: 2.2 })}</span>
      <span class="sx">${CAT[k].nome}</span><span class="punti"></span><span class="pc num">${p}%</span><span class="dx num">${fmt(v, { simbolo: false })}</span></div>`
  const slot = W / GG_MAX
  const schermo = `<div class="scorre">${STATO}
  <div class="capo"><button class="mese">Settembre 2026 ${icona('chevron-down', { size: 14, stroke: 2.6 })}</button><button class="tema" aria-label="Passa al tema scuro">${icona('moon', { size: 17 })}</button></div>
  <article class="striscia">
    <p class="intest">Conto del mese<br><span class="num">01.09 — 22.09.2026 · giorno 22 di 30</span></p>
    <div class="taglio"></div>
    <p class="eti">Speso finora</p>
    <p class="totale num"><span class="cifre">${fmt(USCITE, { simbolo: false })}</span><span class="eur">EUR</span></p>
    <p class="resto num">${icona('arrow-down', { size: 15, stroke: 2.8 })} ${nb(fmt(-DIFF, { simbolo: false }))} in meno del 22 agosto</p>
    ${leader('Agosto al 22', fmt(AGO_OGGI, { simbolo: false }), 'fioco')}
    <figure class="barre">
      <figcaption class="eti">Ogni giorno <span>· tocca una barra</span></figcaption>
      <svg width="${W}" height="70" viewBox="0 0 ${W} 70" role="img" aria-label="Uscite giorno per giorno, settembre sopra e agosto sotto">
        <g>${codiceABarre({ serie: SETT, giorni: GG, alt: 46, w: W, oggi: OGGI, classe: 'sett' })}</g>
        <g transform="translate(0 52)">${codiceABarre({ serie: AGO, giorni: GG_MAX, alt: 12, w: W, classe: 'ago' })}</g>
      </svg>
      <div class="assi num"><span style="left:${(0.5 * slot).toFixed(1)}px">1</span><span style="left:${(9.5 * slot).toFixed(1)}px">10</span><span class="oggi" style="left:${(21.5 * slot).toFixed(1)}px">▲ 22</span><span style="left:${(29.5 * slot).toFixed(1)}px">30</span></div>
      <p class="leggenda"><span><i class="sw sett"></i>settembre</span><span><i class="sw ago"></i>agosto</span><span>spessore = quanto</span></p>
    </figure>
    <div class="taglio"></div>
    <div class="saldo">${leader('Ti restano', fmt(SALDO, { simbolo: false }), 'forte')}
      <button class="apri">Entrate e uscite ${icona('chevron-down', { size: 13, stroke: 2.6 })}</button></div>
    <div class="taglio"></div>
    <p class="eti">Dove sono finiti i soldi</p>
    ${VISIBILI.map(quota).join('')}
    <div class="voce altre"><span class="tess vuota"></span><span class="sx">Altre 2</span><span class="punti"></span><span class="pc num">${ALTRE.pct}%</span><span class="dx num">${fmt(ALTRE.imp, { simbolo: false })}</span></div>
    <div class="taglio"></div>
    <p class="eti">Ultimi movimenti</p>
    ${MOV.map((m) => `<div class="mov"><span class="data num">${String(m.g).padStart(2, '0')}.09</span>
      <span class="tess" style="color:${coloreVar(m.k)}">${icona(CAT[m.k].i, { size: 15, stroke: 2.2 })}</span>
      <span class="desc">${m.d}<small>${CAT[m.k].nome}</small></span>
      <span class="dx num ${m.v > 0 ? 'piu' : ''}">${m.v > 0 ? '+' : MENO}${fmt(Math.abs(m.v), { simbolo: false })}</span></div>`).join('')}
    <p class="coda">*** 8 di 31 movimenti ***<br><a href="#">Tutti i movimenti →</a></p>
  </article>
  <div class="fondo"></div>
  </div>
  <button class="tasto-piu" aria-label="Aggiungi movimento">${icona('plus', { size: 26, stroke: 2.4 })}</button>
  <nav class="schede">${[['chart-no-axes-combined', 'Report', 1], ['list', 'Movimenti'], ['layers', 'Categorie']].map(([i, t, on]) => `<a href="#" class="${on ? 'on' : ''}">${icona(i, { size: 21, stroke: 1.8 })}<span>${t}</span></a>`).join('')}</nav>`

  const css = `
.scontrino.chiaro { --tavolo: #e7e2d6; --carta: #fbf9f3; --inchiostro: #1f1d1a; --inchiostro-2: #605a50; --filetto: rgba(31,29,26,.42); ${varsPalette('scontrino', 'chiaro')} }
.scontrino.scuro { --tavolo: #0e0d0c; --carta: #1c1b19; --inchiostro: #ece8dc; --inchiostro-2: #a39d91; --filetto: rgba(236,232,220,.38); ${varsPalette('scontrino', 'scuro')} }
.scontrino { background: var(--tavolo); color: var(--inchiostro); font-family: "Atkinson"; }
.scontrino button { font: inherit; color: inherit; background: none; border: 0; padding: 0; }
.scontrino .capo { display: flex; justify-content: space-between; align-items: center; padding: 2px 16px 12px 22px; }
.scontrino .mese { display: flex; align-items: center; gap: 6px; min-height: 44px; font-weight: 800; font-size: 13px; letter-spacing: .14em; text-transform: uppercase; }
.scontrino .tema { width: 44px; height: 44px; display: grid; place-items: center; border: 1.5px solid var(--filetto); border-radius: 4px; color: var(--inchiostro-2); }
/* la striscia: bordo dritto in alto, dentellato in fondo dove si stampa la prossima riga */
.scontrino .striscia { margin: 0 16px; padding: 22px 20px 34px; background: var(--carta);
  -webkit-mask: conic-gradient(from -45deg at bottom, #0000, #000 1deg 89deg, #0000 90deg) 50% / 14px 100%;
          mask: conic-gradient(from -45deg at bottom, #0000, #000 1deg 89deg, #0000 90deg) 50% / 14px 100%; }
.scontrino .intest { text-align: center; margin: 0; font-weight: 800; font-size: 13px; letter-spacing: .16em; text-transform: uppercase; }
.scontrino .intest span { font-weight: 500; letter-spacing: .04em; font-size: 12.5px; color: var(--inchiostro-2); text-transform: none; }
.scontrino .taglio { border-top: 1.5px dashed var(--filetto); margin: 16px 0; }
.scontrino .eti { margin: 0 0 6px; font-weight: 800; font-size: 12px; letter-spacing: .14em; text-transform: uppercase; color: var(--inchiostro-2); }
.scontrino .eti span { font-weight: 500; letter-spacing: .02em; text-transform: none; }
/* il totale "a doppia altezza", come le stampanti termiche fanno coi totali */
.scontrino .totale { margin: 0; display: flex; align-items: baseline; gap: 8px; font-family: "Bricolage"; font-stretch: 75%; font-weight: 700; }
.scontrino .totale .cifre { font-size: 76px; line-height: .9; letter-spacing: -.01em; transform: scaleY(1.12); transform-origin: bottom; display: inline-block; }
.scontrino .totale .eur { font-family: "Atkinson"; font-size: 13px; font-weight: 800; letter-spacing: .14em; color: var(--inchiostro-2); }
.scontrino .resto { display: flex; align-items: center; gap: 8px; margin: 14px 0 10px; padding: 7px 10px; background: var(--inchiostro); color: var(--carta); font-weight: 800; font-size: 14.5px; }
.scontrino .riga, .scontrino .voce { display: flex; align-items: baseline; gap: 6px; font-size: 15px; }
.scontrino .punti { flex: 1; border-bottom: 2px dotted var(--filetto); transform: translateY(-4px); min-width: 12px; }
.scontrino .riga.fioco { color: var(--inchiostro-2); font-size: 14px; }
.scontrino .riga.forte { font-weight: 800; font-size: 17px; text-transform: uppercase; letter-spacing: .06em; }
.scontrino .riga.forte .dx { letter-spacing: 0; font-size: 22px; font-family: "Bricolage"; font-stretch: 75%; }
.scontrino .apri { display: flex; align-items: center; gap: 4px; min-height: 44px; font-size: 13px; color: var(--inchiostro-2); font-weight: 700; }
.scontrino .barre { margin: 18px 0 0; }
.scontrino .barre svg { display: block; }
.scontrino .sett { fill: var(--inchiostro); }
.scontrino .ago { fill: var(--inchiostro-2); opacity: .75; }
.scontrino .futuro { fill: var(--inchiostro-2); }
.scontrino .assi { position: relative; height: 18px; font-size: 11.5px; color: var(--inchiostro-2); }
.scontrino .assi span { position: absolute; top: 3px; transform: translateX(-50%); }
.scontrino .assi .oggi { color: var(--inchiostro); font-weight: 800; }
.scontrino .leggenda { display: flex; gap: 14px; margin: 4px 0 0; font-size: 12px; color: var(--inchiostro-2); }
.scontrino .sw { display: inline-block; width: 3px; height: 10px; margin-right: 5px; vertical-align: -1px; }
.scontrino .sw.sett { background: var(--inchiostro); } .scontrino .sw.ago { background: var(--inchiostro-2); }
.scontrino .voce { align-items: center; min-height: 40px; }
.scontrino .voce .pc { color: var(--inchiostro-2); font-size: 13px; width: 34px; text-align: right; }
.scontrino .voce .dx { width: 64px; text-align: right; }
.scontrino .voce .punti { transform: translateY(3px); }
/* l'icona di categoria resta nel suo riquadro tinto: è l'elemento da conservare */
.scontrino .tess { flex: none; width: 30px; height: 30px; display: grid; place-items: center; border-radius: 6px; background: color-mix(in srgb, currentColor 20%, var(--carta)); margin-right: 4px; }
.scontrino .tess.vuota { background: none; border: 1.5px dashed var(--filetto); }
.scontrino .altre { color: var(--inchiostro-2); }
.scontrino .mov { display: grid; grid-template-columns: 40px 34px 1fr auto; align-items: center; gap: 4px; min-height: 48px; font-size: 15px; }
.scontrino .mov .data { font-size: 12.5px; color: var(--inchiostro-2); }
.scontrino .mov .desc { min-width: 0; line-height: 1.2; }
.scontrino .mov small { display: block; font-size: 12px; color: var(--inchiostro-2); }
.scontrino .mov .piu { color: var(--verde); font-weight: 800; }
.scontrino .coda { text-align: center; margin: 18px 0 0; font-size: 12.5px; letter-spacing: .1em; color: var(--inchiostro-2); }
.scontrino .coda a { display: inline-block; margin-top: 6px; color: var(--inchiostro); font-weight: 800; letter-spacing: .02em; min-height: 44px; line-height: 44px; }
/* spazio in fondo: barra schede + pulsante + margine + safe area */
.scontrino .fondo { height: calc(64px + 56px + 24px + 34px); }
.scontrino .tasto-piu { position: absolute; right: 18px; bottom: calc(64px + 34px + 14px); width: 58px; height: 58px; display: grid; place-items: center;
  background: var(--inchiostro); color: var(--carta); border-radius: 6px; }
.scontrino .schede { position: absolute; inset: auto 0 0 0; display: grid; grid-template-columns: repeat(3, 1fr); padding: 6px 0 34px; background: var(--carta); border-top: 1.5px dashed var(--filetto); }
.scontrino .schede a { display: grid; justify-items: center; gap: 3px; min-height: 52px; padding-top: 4px; text-decoration: none; color: var(--inchiostro-2); font-size: 11px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
.scontrino .schede a.on { color: var(--inchiostro); }
.scontrino .schede a.on span { border-bottom: 2px solid var(--inchiostro); }`

  return pagina({
    dir: 'scontrino',
    titolo: 'A — Scontrino',
    sottotitolo: 'Il mese è uno scontrino che si allunga: ogni spesa è una riga stampata, il totale sta in alto a doppia altezza, e il codice a barre in mezzo è fatto dei tuoi giorni. Elemento memorabile: il codice a barre del mese.',
    css,
    schermo,
  })
}

/* ======================================================================
   B — COPERTINA
   ====================================================================== */
function copertina() {
  const W = 353, H = 168, PADT = 18, PADB = 22
  const max = Math.max(AGO_TOT, USCITE) * 1.06
  const x = (i) => (i / (GG_MAX - 1)) * W
  const y = (v) => H - PADB - (v / max) * (H - PADT - PADB)
  const linea = (s) => s.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const xo = x(OGGI - 1)
  const grafico = `<svg width="100%" viewBox="0 0 ${W} ${H}" role="img" aria-label="Uscite accumulate: settembre contro agosto">
    <line x1="0" x2="${W}" y1="${H - PADB}" y2="${H - PADB}" class="base"/>
    ${[1, 10, 30].map((g) => `<text x="${x(g - 1)}" y="${H - 6}" text-anchor="${g === 1 ? 'start' : 'middle'}" class="ax num">${g}</text>`).join('')}
    <text x="${xo}" y="${H - 6}" text-anchor="middle" class="ax forte num">oggi 22</text>
    <path d="${linea(CA)}" class="ago"/>
    <path d="${linea(CS)}" class="sett"/>
    <line x1="${xo}" x2="${xo}" y1="${y(AGO_OGGI) - 2}" y2="${y(USCITE) + 2}" class="parentesi"/>
    <line x1="${xo - 4}" x2="${xo + 4}" y1="${y(AGO_OGGI)}" y2="${y(AGO_OGGI)}" class="parentesi"/>
    <line x1="${xo - 4}" x2="${xo + 4}" y1="${y(USCITE)}" y2="${y(USCITE)}" class="parentesi"/>
    <text x="${xo + 8}" y="${(y(AGO_OGGI) + y(USCITE)) / 2 + 4}" class="nota num">${MENO}${fmt(-DIFF, { simbolo: false })}</text>
    <circle cx="${xo}" cy="${y(USCITE)}" r="4" class="punto"/>
    <text x="${W}" y="${y(AGO_TOT) - 7}" text-anchor="end" class="ax num">agosto ${fmt(AGO_TOT, { simbolo: false })}</text>
  </svg>`
  const massimo = QUOTE[0][1]
  const riga = (k, v, p, vuota) => `<li${vuota ? ' class="altre"' : ''}>
      <span class="tess" style="color:${vuota ? 'var(--inchiostro-2)' : coloreVar(k)}">${icona(vuota ? 'circle-dashed' : CAT[k].i, { size: 16, stroke: 2.1 })}</span>
      <span class="nome">${vuota ? 'Altre 2' : CAT[k].nome}<i style="width:${((v / massimo) * 100).toFixed(1)}%;background:${vuota ? 'var(--inchiostro-2)' : coloreVar(k)}"></i></span>
      <span class="pc num">${p}%</span><span class="imp num">${fmt(v, { simbolo: false })}</span></li>`
  const schermo = `<div class="scorre">${STATO}
  <header class="testata">
    <button class="mese">N° 9 · Settembre 2026 ${icona('chevron-down', { size: 14, stroke: 2.6 })}</button>
    <button class="tema" aria-label="Passa al tema scuro">${icona('moon', { size: 17 })}</button>
  </header>
  <p class="occhiello">Speso finora <span class="num">· giorno 22 di 30</span></p>
  <h1 class="titolone num" data-adatta><span class="eu">€</span>${fmt(USCITE, { simbolo: false })}</h1>
  <p class="sommario"><b>${nb(fmt(-DIFF))} sotto il 22 agosto.</b> Ti restano <b class="num">${nb(fmt(SALDO))}</b> dei <span class="num">${nb(fmt(ENTRATE))}</span> entrati.</p>
  <section class="sez"><h2><span class="num">01</span> Il ritmo del mese</h2>${grafico}
    <p class="didascalia"><i class="l-sett"></i> settembre &nbsp; <i class="l-ago"></i> agosto, giorno per giorno</p></section>
  <section class="sez"><h2><span class="num">02</span> Dove sono finiti i soldi</h2>
    <ul class="tabella">${VISIBILI.map(([k, v, p]) => riga(k, v, p)).join('')}${riga(null, ALTRE.imp, ALTRE.pct, true)}</ul></section>
  <section class="sez"><h2><span class="num">03</span> Ultimi movimenti <a href="#">Tutti ${icona('arrow-right', { size: 13, stroke: 2.6 })}</a></h2>
    <ul class="registro">${MOV.map((m) => `<li><span class="data num">${m.g}.9</span>
      <span class="tess" style="color:${coloreVar(m.k)}">${icona(CAT[m.k].i, { size: 16, stroke: 2.1 })}</span>
      <span class="desc">${m.d}<small>${CAT[m.k].nome}</small></span>
      <span class="imp num ${m.v > 0 ? 'piu' : ''}">${m.v > 0 ? '+' : MENO}${fmt(Math.abs(m.v), { simbolo: false })}</span></li>`).join('')}</ul></section>
  <div class="fondo"></div>
  </div>
  <button class="tasto-piu" aria-label="Aggiungi movimento">${icona('plus', { size: 26, stroke: 2.4 })}</button>
  <nav class="schede">${[['chart-no-axes-combined', 'Report', 1], ['list', 'Movimenti'], ['layers', 'Categorie']].map(([i, t, on]) => `<a href="#" class="${on ? 'on' : ''}">${icona(i, { size: 21, stroke: 1.8 })}<span>${t}</span></a>`).join('')}</nav>`

  const css = `
.copertina.chiaro { --carta: #f4f1ea; --inchiostro: #151412; --inchiostro-2: #5c574f; --filetto: rgba(21,20,18,.16); --spot: #c4400c; ${varsPalette('copertina', 'chiaro')} }
.copertina.scuro { --carta: #121211; --inchiostro: #efebe3; --inchiostro-2: #a29c91; --filetto: rgba(239,235,227,.18); --spot: #ff7d4a; ${varsPalette('copertina', 'scuro')} }
.copertina { background: var(--carta); color: var(--inchiostro); font-family: "Atkinson"; }
.copertina button { font: inherit; color: inherit; background: none; border: 0; padding: 0; }
.copertina .scorre { padding: 0 20px; }
.copertina .stato { margin: 0 -20px; }
/* testata da giornale: doppio filetto, uno pieno e uno sottile */
.copertina .testata { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid var(--inchiostro); box-shadow: 0 3px 0 var(--carta), 0 4px 0 var(--inchiostro); padding-bottom: 4px; }
.copertina .mese { display: flex; align-items: center; gap: 6px; min-height: 44px; font-family: "Bricolage Ottico"; font-variation-settings: "opsz" 14; font-weight: 700; font-size: 16px; }
.copertina .tema { width: 44px; height: 44px; display: grid; place-items: center; color: var(--inchiostro-2); }
.copertina .occhiello { margin: 22px 0 0; font-weight: 800; font-size: 12.5px; letter-spacing: .14em; text-transform: uppercase; color: var(--spot); }
.copertina .occhiello span { color: var(--inchiostro-2); font-weight: 500; letter-spacing: .04em; text-transform: none; }
/* il titolo: la cifra occupa tutta la giustezza, da margine a margine */
.copertina .titolone { margin: 0; font-family: "Bricolage Ottico"; font-variation-settings: "opsz" 96; font-weight: 800; line-height: .86; letter-spacing: -.045em; white-space: nowrap; font-size: 96px; padding: 6px 0 4px; }
.copertina .titolone .eu { font-size: .3em; font-weight: 600; letter-spacing: 0; vertical-align: .95em; margin-right: .1em; color: var(--inchiostro-2); }
.copertina .sommario { margin: 10px 0 0; font-family: "Bricolage Ottico"; font-variation-settings: "opsz" 24; font-size: 21px; line-height: 1.22; font-weight: 400; letter-spacing: -.01em; }
.copertina .sommario b { font-weight: 700; }
.copertina .sommario > b:first-child { color: var(--inchiostro); box-shadow: inset 0 -3px 0 var(--spot); }
.copertina .sez { margin-top: 30px; border-top: 1px solid var(--inchiostro); padding-top: 9px; }
.copertina h2 { display: flex; align-items: baseline; gap: 10px; margin: 0 0 12px; font-family: "Bricolage Ottico"; font-variation-settings: "opsz" 18; font-size: 16px; font-weight: 700; }
.copertina h2 span { font-size: 12.5px; color: var(--spot); font-weight: 800; }
.copertina h2 a { margin-left: auto; display: inline-flex; align-items: center; gap: 4px; min-height: 44px; margin-top: -14px; margin-bottom: -14px; font-family: "Atkinson"; font-size: 14px; font-weight: 700; color: var(--inchiostro); }
.copertina svg .base { stroke: var(--inchiostro); stroke-width: 1; }
.copertina svg .ax { font: 11.5px "Atkinson"; fill: var(--inchiostro-2); }
.copertina svg .ax.forte { fill: var(--spot); font-weight: 800; }
.copertina svg .ago { fill: none; stroke: var(--inchiostro-2); stroke-width: 1.4; stroke-dasharray: 1 4; stroke-linecap: round; }
.copertina svg .sett { fill: none; stroke: var(--inchiostro); stroke-width: 2.2; stroke-linejoin: round; }
.copertina svg .parentesi { stroke: var(--spot); stroke-width: 1.5; }
.copertina svg .nota { font: 800 12.5px "Atkinson"; fill: var(--spot); }
.copertina svg .punto { fill: var(--spot); stroke: var(--carta); stroke-width: 2; }
.copertina .didascalia { margin: 6px 0 0; font-size: 12.5px; color: var(--inchiostro-2); }
.copertina .didascalia i { display: inline-block; width: 16px; vertical-align: 4px; }
.copertina .l-sett { border-top: 2px solid var(--inchiostro); } .copertina .l-ago { border-top: 2px dotted var(--inchiostro-2); }
.copertina ul { list-style: none; margin: 0; padding: 0; }
.copertina .tess { flex: none; width: 34px; height: 34px; display: grid; place-items: center; border-radius: 8px; background: color-mix(in srgb, currentColor 20%, var(--carta)); }
.copertina .tabella li { display: grid; grid-template-columns: 34px 1fr 38px 66px; gap: 10px; align-items: center; min-height: 48px; border-bottom: 1px solid var(--filetto); font-size: 15px; }
.copertina .tabella .nome { position: relative; padding-bottom: 7px; }
.copertina .tabella .nome i { position: absolute; left: 0; bottom: 0; height: 3px; }
.copertina .tabella .pc { text-align: right; font-size: 13px; color: var(--inchiostro-2); }
.copertina .tabella .imp { text-align: right; font-weight: 700; }
.copertina .tabella .altre { color: var(--inchiostro-2); }
.copertina .registro li { display: grid; grid-template-columns: 34px 34px 1fr auto; gap: 10px; align-items: center; min-height: 54px; border-bottom: 1px solid var(--filetto); font-size: 15px; }
.copertina .registro .data { font-family: "Bricolage Ottico"; font-variation-settings: "opsz" 14; font-size: 13px; font-weight: 700; color: var(--inchiostro-2); }
.copertina .registro small { display: block; font-size: 12.5px; color: var(--inchiostro-2); }
.copertina .registro .desc { line-height: 1.2; min-width: 0; }
.copertina .registro .imp { font-weight: 700; }
.copertina .registro .piu { color: var(--verde); }
.copertina .fondo { height: calc(64px + 56px + 24px + 34px); }
.copertina .tasto-piu { position: absolute; right: 18px; bottom: calc(64px + 34px + 14px); width: 58px; height: 58px; display: grid; place-items: center; background: var(--inchiostro); color: var(--carta); border-radius: 50%; }
.copertina .schede { position: absolute; inset: auto 0 0 0; display: grid; grid-template-columns: repeat(3, 1fr); padding: 0 0 34px; background: var(--carta); border-top: 1px solid var(--inchiostro); }
.copertina .schede a { display: grid; justify-items: center; gap: 3px; min-height: 56px; padding-top: 8px; text-decoration: none; color: var(--inchiostro-2); font-size: 11.5px; font-weight: 700; border-top: 3px solid transparent; margin-top: -2px; }
.copertina .schede a.on { color: var(--inchiostro); border-top-color: var(--spot); }`

  // la cifra riempie la giustezza: si misura una volta al caricamento (nessuna animazione)
  const note = `<script>
  document.fonts.ready.then(() => document.querySelectorAll('[data-adatta]').forEach((el) => {
    const disp = el.parentElement.clientWidth - 40
    el.style.fontSize = (96 * disp / el.scrollWidth).toFixed(1) + 'px'
  }))
  </script>`
  return pagina({
    dir: 'copertina',
    titolo: 'B — Copertina',
    sottotitolo: 'Ogni mese è un numero di una rivista con un solo lettore: il Report è la copertina, il resto è impaginato a colonne e filetti. Elemento memorabile: la cifra del mese composta come un titolo, larga quanto la pagina, con il sommario scritto in parole.',
    css,
    schermo,
    note,
  })
}

/* ======================================================================
   C — BINARIO
   ====================================================================== */
function binario() {
  const W = 353
  const scala = 180000 // fondo linea: poco oltre il capolinea di agosto
  const px = (v) => 6 + (v / scala) * (W - 12)
  const fermate = [0, 50000, 100000, 150000]
  const linea = `<svg width="${W}" height="96" viewBox="0 0 ${W} 96" role="img" aria-label="Linea del mese: hai speso ${fmt(USCITE)}, agosto allo stesso giorno era a ${fmt(AGO_OGGI)}">
    <line x1="${px(0)}" x2="${px(scala)}" y1="48" y2="48" class="resto"/>
    <line x1="${px(0)}" x2="${px(USCITE)}" y1="48" y2="48" class="fatto"/>
    ${fermate.map((f) => `<line x1="${px(f)}" x2="${px(f)}" y1="42" y2="54" class="tacca"/><text x="${px(f)}" y="76" text-anchor="${f ? 'middle' : 'start'}" class="eti num">${f ? (f / 100).toLocaleString('it-IT') : '0'}</text>`).join('')}
    <g class="capolinea"><line x1="${px(AGO_TOT)}" x2="${px(AGO_TOT)}" y1="36" y2="60"/><text x="${W}" y="92" text-anchor="end" class="eti num">fine agosto ${fmt(AGO_TOT, { simbolo: false })}</text></g>
    <circle cx="${px(AGO_OGGI)}" cy="48" r="8" class="fantasma"/>
    <text x="${px(AGO_OGGI) + 2}" y="22" text-anchor="start" class="eti">agosto al 22</text>
    <line x1="${px(AGO_OGGI)}" x2="${px(AGO_OGGI)}" y1="26" y2="40" class="filo"/>
    <rect x="${px(USCITE) - 12}" y="36" width="24" height="24" rx="5" class="tu"/>
    <text x="${px(USCITE)}" y="52.5" text-anchor="middle" class="tu-t">22</text>
  </svg>`
  // orario alla Marey: i giorni in orizzontale, le "fermate" in euro in verticale
  const MW = 353, MH = 150, ML = 42, MB = 18
  const mx = (i) => ML + (i / (GG_MAX - 1)) * (MW - ML)
  const my = (v) => MH - MB - (v / scala) * (MH - MB - 6)
  const traccia = (s) => s.map((v, i) => `${i ? 'L' : 'M'}${mx(i).toFixed(1)},${my(v).toFixed(1)}`).join(' ')
  const marey = `<svg width="${MW}" height="${MH}" viewBox="0 0 ${MW} ${MH}" role="img" aria-label="Uscite accumulate giorno per giorno, settembre e agosto">
    ${fermate.map((f) => `<line x1="${ML}" x2="${MW}" y1="${my(f)}" y2="${my(f)}" class="g"/><text x="0" y="${my(f) + 4}" class="eti num">${(f / 100).toLocaleString('it-IT')}</text>`).join('')}
    ${[1, 10, 20, 30].map((g) => `<line x1="${mx(g - 1)}" x2="${mx(g - 1)}" y1="${my(0)}" y2="${my(0) + 4}" class="g"/><text x="${mx(g - 1)}" y="${MH - 2}" text-anchor="middle" class="eti num">${g}</text>`).join('')}
    <path d="${traccia(CA)}" class="t-ago"/>
    <path d="${traccia(CS)}" class="t-sett"/>
    <rect x="${mx(OGGI - 1) - 5}" y="${my(USCITE) - 5}" width="10" height="10" rx="2" class="tu"/>
  </svg>`
  const massimo = QUOTE[0][1]
  const schermo = `<div class="scorre">${STATO}
  <header class="cartello">
    <button class="mese">Settembre 2026 ${icona('chevron-down', { size: 15, stroke: 2.6 })}</button>
    <span class="giorno num">22<small>/30</small></span>
    <button class="tema" aria-label="Passa al tema scuro">${icona('moon', { size: 17 })}</button>
  </header>
  <section class="corsa">
    <p class="eti-k">Speso finora</p>
    <p class="cifra num">${fmt(USCITE, { simbolo: false })}<span>€</span></p>
    <p class="stato-corsa"><b>${icona('arrow-down', { size: 16, stroke: 2.8 })} ${nb(fmt(-DIFF))} dietro ad agosto</b> allo stesso giorno: stai spendendo meno.</p>
    <div class="linea">${linea}</div>
  </section>
  <section class="pannello saldo"><div><p class="eti-k">Ti restano</p><p class="v num">${nb(fmt(SALDO))}</p></div>
    <button class="apri">Entrate e uscite ${icona('chevron-down', { size: 14, stroke: 2.6 })}</button></section>
  <h2 class="titolo">Orario del mese</h2>
  <div class="marey">${marey}<p class="leg"><i class="l-sett"></i> settembre <i class="l-ago"></i> agosto</p></div>
  <h2 class="titolo">Linee <span>dove sono finiti i soldi</span></h2>
  <ul class="linee">${VISIBILI.map(([k, v, p]) => `<li><span class="tess" style="color:${coloreVar(k)}">${icona(CAT[k].i, { size: 17, stroke: 2.1 })}</span>
    <span class="n">${CAT[k].nome}<i style="width:${((v / massimo) * 100).toFixed(1)}%;background:${coloreVar(k)}"></i></span><span class="pc num">${p}%</span><span class="imp num">${fmt(v, { simbolo: false })}</span></li>`).join('')}
    <li class="altre"><span class="tess vuota">${icona('circle-dashed', { size: 17, stroke: 2.1 })}</span><span class="n">Altre 2<i style="width:${((ALTRE.imp / massimo) * 100).toFixed(1)}%;background:var(--inchiostro-2)"></i></span><span class="pc num">${ALTRE.pct}%</span><span class="imp num">${fmt(ALTRE.imp, { simbolo: false })}</span></li></ul>
  <h2 class="titolo">Ultime partenze <a href="#">Tutte ${icona('arrow-right', { size: 14, stroke: 2.6 })}</a></h2>
  <div class="tabellone"><div class="th"><span>Giorno</span><span></span><span>Destinazione</span><span>Importo</span></div>
    ${MOV.map((m) => `<div class="tr"><span class="data num">${String(m.g).padStart(2, '0')}.09</span><span class="tess" style="color:${coloreVar(m.k)}">${icona(CAT[m.k].i, { size: 16, stroke: 2.1 })}</span>
    <span class="desc">${m.d}<small>${CAT[m.k].nome}</small></span><span class="imp num ${m.v > 0 ? 'piu' : ''}">${m.v > 0 ? '+' : MENO}${fmt(Math.abs(m.v), { simbolo: false })}</span></div>`).join('')}</div>
  <div class="fondo"></div>
  </div>
  <button class="tasto-piu" aria-label="Aggiungi movimento">${icona('plus', { size: 26, stroke: 2.6 })}</button>
  <nav class="schede">${[['chart-no-axes-combined', 'Report', 1], ['list', 'Movimenti'], ['layers', 'Categorie']].map(([i, t, on]) => `<a href="#" class="${on ? 'on' : ''}">${icona(i, { size: 21, stroke: 1.9 })}<span>${t}</span></a>`).join('')}</nav>`

  const css = `
.binario.chiaro { --fondo: #ffffff; --lastra: #eef0f3; --inchiostro: #0c1117; --inchiostro-2: #535d69; --filetto: rgba(12,17,23,.14); --segnale: #ffcc00; --su-segnale: #0c1117; --cartello: #0c1117; --su-cartello: #ffffff; ${varsPalette('binario', 'chiaro')} }
.binario.scuro { --fondo: #0c1117; --lastra: #161d26; --inchiostro: #f2f4f7; --inchiostro-2: #9ba6b2; --filetto: rgba(242,244,247,.14); --segnale: #ffd23f; --su-segnale: #0c1117; --cartello: #1d2733; --su-cartello: #ffffff; ${varsPalette('binario', 'scuro')} }
.binario { background: var(--fondo); color: var(--inchiostro); font-family: "Atkinson"; }
.binario button { font: inherit; color: inherit; background: none; border: 0; padding: 0; }
.binario .scorre { padding: 0 20px; }
.binario .stato { margin: 0 -20px; }
.binario .k, .binario .eti-k { margin: 0; font-size: 13px; font-weight: 700; color: var(--inchiostro-2); }
/* il cartello di stazione: l'unico blocco pieno della pagina */
.binario .cartello { display: grid; grid-template-columns: 1fr auto auto; align-items: center; gap: 6px; background: var(--cartello); color: var(--su-cartello); border-radius: 8px; padding: 6px 6px 6px 14px; }
.binario .mese { display: flex; align-items: center; gap: 6px; min-height: 44px; font-family: "Bricolage"; font-stretch: 75%; font-weight: 700; font-size: 22px; letter-spacing: .005em; }
.binario .giorno { background: var(--segnale); color: var(--su-segnale); font-family: "Bricolage"; font-stretch: 75%; font-weight: 800; font-size: 22px; padding: 4px 9px; border-radius: 5px; line-height: 1.1; }
.binario .giorno small { font-size: 14px; font-weight: 700; }
.binario .tema { width: 44px; height: 44px; display: grid; place-items: center; color: var(--su-cartello); opacity: .8; }
.binario .corsa { padding: 20px 0 0; }
.binario .cifra { margin: 0; font-family: "Bricolage"; font-stretch: 75%; font-weight: 800; font-size: 78px; line-height: .9; letter-spacing: -.01em; }
.binario .cifra span { font-size: 30px; font-weight: 600; margin-left: 6px; color: var(--inchiostro-2); }
.binario .stato-corsa { margin: 10px 0 0; font-size: 15.5px; line-height: 1.35; }
.binario .stato-corsa b { display: inline-flex; align-items: center; gap: 5px; }
.binario .linea { margin: 10px 0 0; }
.binario .linea svg { display: block; overflow: visible; }
.binario .resto { stroke: var(--inchiostro-2); stroke-width: 3; stroke-dasharray: 2 5; stroke-linecap: round; opacity: .7; }
.binario .fatto { stroke: var(--inchiostro); stroke-width: 7; stroke-linecap: round; }
.binario .tacca { stroke: var(--inchiostro); stroke-width: 2; }
.binario .eti { font: 600 11.5px "Atkinson"; fill: var(--inchiostro-2); }
.binario .capolinea line { stroke: var(--inchiostro-2); stroke-width: 2; }
.binario .fantasma { fill: var(--fondo); stroke: var(--inchiostro-2); stroke-width: 2.5; stroke-dasharray: 3 3; }
.binario .filo { stroke: var(--inchiostro-2); stroke-width: 1; }
.binario .tu { fill: var(--segnale); stroke: var(--inchiostro); stroke-width: 2.5; }
.binario .tu-t { font: 800 13px "Bricolage"; font-stretch: 75%; fill: var(--su-segnale); }
.binario .pannello { margin-top: 18px; background: var(--lastra); border-radius: 8px; padding: 12px 8px 12px 14px; display: flex; justify-content: space-between; align-items: center; }
.binario .saldo .v { margin: 0; font-family: "Bricolage"; font-stretch: 75%; font-weight: 800; font-size: 30px; line-height: 1.05; }
.binario .apri { display: flex; align-items: center; gap: 4px; min-height: 44px; padding: 0 8px; font-size: 13.5px; font-weight: 700; color: var(--inchiostro-2); }
.binario .titolo { display: flex; align-items: baseline; gap: 8px; margin: 30px 0 10px; font-family: "Bricolage"; font-stretch: 75%; font-weight: 800; font-size: 24px; letter-spacing: .005em; }
.binario .titolo span { font-family: "Atkinson"; font-size: 13px; font-weight: 500; color: var(--inchiostro-2); }
.binario .titolo a { margin-left: auto; display: inline-flex; align-items: center; gap: 4px; min-height: 44px; margin-block: -12px; font-family: "Atkinson"; font-size: 14px; font-weight: 700; color: var(--inchiostro); }
.binario .marey svg { display: block; }
.binario .marey .g { stroke: var(--filetto); stroke-width: 1; }
.binario .t-sett { fill: none; stroke: var(--inchiostro); stroke-width: 2.5; stroke-linejoin: round; }
.binario .t-ago { fill: none; stroke: var(--inchiostro-2); stroke-width: 1.5; stroke-dasharray: 5 4; }
.binario .leg { margin: 6px 0 0; font-size: 12.5px; color: var(--inchiostro-2); }
.binario .leg i { display: inline-block; width: 18px; vertical-align: 4px; margin: 0 2px 0 8px; }
.binario .leg i:first-child { margin-left: 0; }
.binario .l-sett { border-top: 3px solid var(--inchiostro); } .binario .l-ago { border-top: 2px dashed var(--inchiostro-2); }
.binario ul { list-style: none; margin: 0; padding: 0; }
.binario .tess { flex: none; width: 36px; height: 36px; display: grid; place-items: center; border-radius: 8px; background: color-mix(in srgb, currentColor 20%, var(--fondo)); }
.binario .tess.vuota { color: var(--inchiostro-2); background: none; border: 2px dashed var(--filetto); }
.binario .linee li { display: grid; grid-template-columns: 36px 1fr 36px 66px; gap: 10px; align-items: center; min-height: 52px; font-size: 15.5px; font-weight: 700; }
.binario .linee .n { position: relative; padding-bottom: 9px; }
/* ogni categoria è una linea: tratto spesso, testa arrotondata come sulle mappe dei trasporti */
.binario .linee .n i { position: absolute; left: 0; bottom: 0; height: 5px; border-radius: 3px; }
.binario .linee .pc { text-align: right; font-size: 13px; font-weight: 500; color: var(--inchiostro-2); }
.binario .linee .imp { text-align: right; }
.binario .linee .altre { color: var(--inchiostro-2); }
.binario .tabellone { background: var(--lastra); border-radius: 8px; padding: 4px 12px; }
.binario .th, .binario .tr { display: grid; grid-template-columns: 44px 36px 1fr auto; gap: 8px; align-items: center; }
.binario .th { font-size: 11.5px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: var(--inchiostro-2); padding: 8px 0 6px; border-bottom: 2px solid var(--inchiostro); }
.binario .th span:last-child { text-align: right; }
.binario .tr { min-height: 54px; border-bottom: 1px solid var(--filetto); font-size: 15px; }
.binario .tr:last-child { border-bottom: 0; }
.binario .tr .data { font-family: "Bricolage"; font-stretch: 75%; font-weight: 700; font-size: 16px; }
.binario .tr .desc { min-width: 0; line-height: 1.2; font-weight: 700; }
.binario .tr small { display: block; font-weight: 400; font-size: 12.5px; color: var(--inchiostro-2); }
.binario .tr .imp { font-weight: 700; text-align: right; }
.binario .tr .piu { color: var(--verde); }
.binario .fondo { height: calc(64px + 56px + 24px + 34px); }
.binario .tasto-piu { position: absolute; right: 18px; bottom: calc(64px + 34px + 14px); width: 58px; height: 58px; display: grid; place-items: center; background: var(--segnale); color: var(--su-segnale); border: 2.5px solid var(--inchiostro); border-radius: 10px; }
.binario .schede { position: absolute; inset: auto 0 0 0; display: grid; grid-template-columns: repeat(3, 1fr); padding: 0 0 34px; background: var(--cartello); }
.binario .schede a { display: grid; justify-items: center; gap: 3px; min-height: 58px; padding-top: 9px; text-decoration: none; color: color-mix(in srgb, var(--su-cartello) 72%, var(--cartello)); font-size: 11.5px; font-weight: 700; }
.binario .schede a.on { color: var(--su-cartello); box-shadow: inset 0 4px 0 var(--segnale); }`

  return pagina({
    dir: 'binario',
    titolo: 'C — Binario',
    sottotitolo: 'Il mese è una corsa su una linea: le fermate sono gli euro, il treno di agosto ti precede o ti segue. Segnaletica di stazione, cifre strette, giallo solo dove sei tu. Elemento memorabile: la linea del mese con il tuo segnale giallo e il fantasma di agosto.',
    css,
    schermo,
  })
}

fs.writeFileSync(path.join(OUT, 'a-scontrino.html'), scontrino())
fs.writeFileSync(path.join(OUT, 'b-copertina.html'), copertina())
fs.writeFileSync(path.join(OUT, 'c-binario.html'), binario())
console.log('ok', fs.readdirSync(OUT))
