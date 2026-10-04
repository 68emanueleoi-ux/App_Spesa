// La testata di Mastro nei dodici mesi, chiaro e scuro, con i colori stagionali di colori-mesi.mjs.
// Uscita: design/proposte/giro-6/colori-mesi.html. Le cifre sono le stesse in ogni mese: conta il colore.
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { PROPOSTE } from './font-proposte.mjs'
import { MESI, coloriMese, contrasto } from './colori-mesi.mjs'

const ROOT = path.resolve(import.meta.dirname, '../..')
const OUT = path.join(ROOT, 'design/proposte/giro-6')
fs.mkdirSync(OUT, { recursive: true })

const NOMI = ['chevron-down', 'moon', 'arrow-down']
const NODI = {}
for (const n of NOMI) NODI[n] = (await import(pathToFileURL(path.join(ROOT, `node_modules/lucide-react/dist/esm/icons/${n}.mjs`)).href)).__iconData.node
const icona = (n, size = 15, stroke = 2.1) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${NODI[n].map(([t, a]) => `<${t} ${Object.entries(a).filter(([k]) => k !== 'key').map(([k, v]) => `${k}="${v}"`).join(' ')}/>`).join('')}</svg>`

const usate = new Set()
const fontFace = PROPOSTE.flatMap((p) => p.facce).filter(([, url]) => !usate.has(url) && usate.add(url)).map(([fam, url, peso = '100 900', extra = '']) =>
  `@font-face { font-family: "${fam}"; font-weight: ${peso}; ${extra} font-display: block; src: url(${url}) format("woff2"); }`).join('\n')
const varsFont = (p) => ({
  '--voce': `'${p.voce}'`, '--testo': `'${p.testo}'`, '--tab': `'${p.tab}'`, '--peso-voce': p.pesoVoce, '--vs-voce': p.vsVoce ?? 'normal',
  '--vs-testo': p.vsTesto ?? 'normal', '--vs-tab': p.vsTab ?? p.vsTesto ?? 'normal', '--largo-voce': p.larghezzaVoce ?? '100%',
  '--scala-cifra': p.scalaCifra ?? 1, '--peso-tab': p.tabPeso, '--corpo-tab': `${p.tabCorpo ?? 15}px`,
})
const PREDEFINITO = PROPOSTE.findIndex((p) => p.nome === 'Bottega')
const STAGIONE = ['inverno', 'inverno', 'primavera', 'primavera', 'primavera', 'estate', 'estate', 'estate', 'autunno', 'autunno', 'autunno', 'inverno']

const testata = (i, tema) => {
  const c = coloriMese(i, tema)
  return `<figure class="mese"><figcaption><b>${MESI[i].nome}</b> · ${MESI[i].nota} <span>${STAGIONE[i]} · vivacità ${MESI[i].C.toFixed(3).replace('.', ',')} · contrasto ${contrasto(c.bloccoTesto, c.blocco).toFixed(1).replace('.', ',')}:1</span></figcaption>
  <div class="testata" style="--blocco:${c.blocco};--blocco-testo:${c.bloccoTesto};--blocco-testo-2:${c.bloccoTesto2}">
    <div class="capo"><button class="scegli"><span>${MESI[i].nome} 2026</span>${icona('chevron-down', 16, 2.2)}</button><button class="tema" aria-label="Tema">${icona('moon', 17, 2)}</button></div>
    <p class="k">Speso finora <span>al 22 ${MESI[i].nome.toLowerCase()}</span></p>
    <p class="cifra num">1.284,30<span class="eu">€</span></p>
    <p class="confronto">${icona('arrow-down', 14, 2.6)}<b class="num">96,10</b> <span>rispetto allo stesso giorno del mese prima</span></p>
    <dl class="conti"><div><dt>Entrate</dt><dd class="num">+1.500,00</dd></div><div><dt>Uscite</dt><dd class="num">−1.284,30</dd></div><div class="saldo"><dt>Saldo</dt><dd class="num">215,70</dd></div></dl>
  </div></figure>`
}

const html = `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Il colore del mese — dodici mesi</title>
<style>
${fontFace}
*, *::before, *::after { box-sizing: border-box; }
:root { --cifra: 60px; ${Object.entries(varsFont(PROPOSTE[PREDEFINITO])).map(([k, v]) => `${k}: ${v};`).join(' ')} }
body { margin: 0; background: #6f6d68; color: #fff; font: 15px/1.45 system-ui, sans-serif; }
.intro { max-width: 1280px; margin: 0 auto; padding: 26px 20px 4px; }
.intro h1 { margin: 0; font-size: 24px; } .intro p { margin: 8px 0 0; max-width: 90ch; }
.comandi { position: sticky; top: 0; z-index: 10; display: flex; gap: 10px; align-items: center; justify-content: center; padding: 10px 16px; background: #3a3936; }
.comandi select { font: 600 15px system-ui; padding: 9px 12px; border-radius: 8px; border: 0; }
.striscia { display: flex; max-width: 1280px; margin: 16px auto 0; padding: 0 20px; gap: 4px; }
.striscia span { flex: 1; height: 34px; border-radius: 6px; display: grid; place-items: center; font: 700 12px system-ui; }
h2 { max-width: 1280px; margin: 28px auto 0; padding: 0 20px; font-size: 21px; }
.griglia { display: flex; flex-wrap: wrap; gap: 22px; justify-content: center; padding: 14px 16px 30px; }
.mese { margin: 0; width: 393px; }
.mese figcaption { margin: 0 0 6px 4px; font-size: 13.5px; } .mese figcaption span { display: block; opacity: .8; font-size: 12.5px; }
.num { font-variant-numeric: tabular-nums; }
button { font: inherit; color: inherit; background: none; border: 0; padding: 0; }
.testata { background: var(--blocco); color: var(--blocco-testo); border-radius: 28px; padding: 18px 20px 18px; font-family: var(--testo); font-variation-settings: var(--vs-testo); }
.capo { display: flex; justify-content: space-between; align-items: center; }
.scegli { display: flex; align-items: center; gap: 10px; height: 44px; padding: 0 12px 0 14px; border: 1px solid color-mix(in srgb, var(--blocco-testo) 45%, transparent); border-radius: 8px; }
.scegli span { font-family: var(--voce); font-variation-settings: var(--vs-voce); font-stretch: var(--largo-voce); font-weight: var(--peso-voce); font-size: 17px; }
.tema { width: 44px; height: 44px; display: grid; place-items: center; }
.k { margin: 22px 0 0; font-size: 14px; font-weight: 600; } .k span, .eu, .confronto span, dt { color: var(--blocco-testo-2); } .k span { font-weight: 400; }
.cifra { margin: 2px 0 0; font-family: var(--voce); font-variation-settings: var(--vs-voce); font-stretch: var(--largo-voce); font-weight: var(--peso-voce); font-size: calc(var(--cifra) * var(--scala-cifra)); line-height: 1; letter-spacing: -.02em; white-space: nowrap; }
.cifra .eu { font-size: .42em; margin-left: .12em; letter-spacing: 0; }
.confronto { display: flex; align-items: center; gap: 5px; margin: 10px 0 0; font-size: 14px; } .confronto b { font-weight: 700; }
.conti { display: grid; grid-template-columns: 1fr 1fr 1fr; margin: 18px 0 0; border-top: 1px solid color-mix(in srgb, var(--blocco-testo) 30%, transparent); border-bottom: 1px solid color-mix(in srgb, var(--blocco-testo) 30%, transparent); }
.conti div { padding: 10px 0 10px 12px; } .conti div:first-child { padding-left: 0; } .conti div + div { border-left: 1px solid color-mix(in srgb, var(--blocco-testo) 30%, transparent); }
.conti dt { font-size: 12.5px; } .conti dd { margin: 2px 0 0; font-family: var(--tab); font-variation-settings: var(--vs-tab); font-weight: var(--peso-tab); font-size: var(--corpo-tab); }
.conti .saldo dd { font-weight: 700; text-decoration: underline double; text-underline-offset: 4px; }
</style>
</head>
<body>
<header class="intro"><h1>Il colore del mese — tutto l'anno</h1>
<p>Ogni mese ha una tinta presa dalla stagione (gelo, germoglio, grano, terracotta, castagna…) e una vivacità che segue l'anno: spenta d'inverno, piena d'estate, a metà in primavera e autunno. La luminosità è la stessa per tutti i mesi, così il testo ha sempre lo stesso contrasto (sopra 8:1). Cifre uguali in ogni mese: conta solo il colore.</p></header>
<div class="comandi"><label for="font">Carattere</label><select id="font">${PROPOSTE.map((p, i) => `<option value="${i}"${i === PREDEFINITO ? ' selected' : ''}>${i + 1}. ${p.nome} — ${p.voce.replace(' Assi', '')}</option>`).join('')}</select></div>
<div class="striscia">${MESI.map((m, i) => `<span style="background:${coloriMese(i, 'chiaro').blocco};color:${coloriMese(i, 'chiaro').bloccoTesto}">${m.m}</span>`).join('')}</div>
<div class="striscia">${MESI.map((m, i) => `<span style="background:${coloriMese(i, 'scuro').blocco};color:${coloriMese(i, 'scuro').bloccoTesto}">${m.m}</span>`).join('')}</div>
<h2>Tema chiaro</h2><main class="griglia">${MESI.map((_, i) => testata(i, 'chiaro')).join('')}</main>
<h2>Tema scuro</h2><main class="griglia">${MESI.map((_, i) => testata(i, 'scuro')).join('')}</main>
<script>
  const FONT = ${JSON.stringify(PROPOSTE.map(varsFont))}
  document.getElementById('font').addEventListener('change', (e) => Object.entries(FONT[e.target.value]).forEach(([k, v]) => document.documentElement.style.setProperty(k, v)))
</script>
</body>
</html>
`
fs.writeFileSync(path.join(OUT, 'colori-mesi.html'), html)
console.log('ok')
