// Prova alla cieca: la testata di settembre in trenta caratteri, ognuno indicato solo da una lettera.
// Sensazioni cercate: audace, tecnica, editoriale. Tutti con cifre tabellari verificate in Chrome,
// tutti self-hosted da @fontsource (nessuna richiesta esterna).
// Uscita: design/proposte/giro-7/prova-cieca.html
import fs from 'node:fs'
import path from 'node:path'
import { coloriMese } from './colori-mesi.mjs'

const ROOT = path.resolve(import.meta.dirname, '../..')
const OUT = path.join(ROOT, 'design/proposte/giro-7')
fs.mkdirSync(OUT, { recursive: true })
const F = '../../../node_modules'
const V = (pkg, f) => `${F}/@fontsource-variable/${pkg}/files/${pkg}-latin-${f}-normal.woff2`
const S = (pkg, w = 400) => `${F}/@fontsource/${pkg}/files/${pkg}-latin-${w}-normal.woff2`

/* [nome, file, stile della cifra, gruppo]. Il gruppo resta nascosto fino a "mostra i nomi". */
const CANDIDATI = [
  ['Unbounded', V('unbounded', 'wght'), 'font-weight:600', 'audace'],
  ['Syne', V('syne', 'wght'), 'font-weight:700', 'audace'],
  ['Hubot Sans, larghissimo', V('hubot-sans', 'standard'), 'font-weight:800;font-stretch:125%', 'audace'],
  ['Anybody, largo', V('anybody', 'standard'), 'font-weight:800;font-stretch:140%', 'audace'],
  ['Dela Gothic One', S('dela-gothic-one'), 'font-weight:400', 'audace'],
  ['Rubik Mono One', S('rubik-mono-one'), 'font-weight:400', 'audace'],
  ['Archivo Black', S('archivo-black'), 'font-weight:400', 'audace'],
  ['Saira, largo', V('saira', 'standard'), 'font-weight:700;font-stretch:125%', 'audace'],
  ['Doto (a punti)', V('doto', 'full'), 'font-weight:800', 'tecnica'],
  ['Doto, punti tondi', V('doto', 'full'), "font-weight:900;font-variation-settings:'ROND' 100", 'tecnica'],
  ['Handjet', V('handjet', 'full'), 'font-weight:600', 'tecnica'],
  ['Sixtyfour (pixel)', V('sixtyfour', 'full'), 'font-weight:400', 'tecnica'],
  ['Workbench (righe di scansione)', V('workbench', 'full'), 'font-weight:400', 'tecnica'],
  ['Kode Mono', V('kode-mono', 'wght'), 'font-weight:600', 'tecnica'],
  ['Tektur', V('tektur', 'standard'), 'font-weight:700', 'tecnica'],
  ['Oxanium', V('oxanium', 'wght'), 'font-weight:700', 'tecnica'],
  ['Martian Mono', V('martian-mono', 'standard'), 'font-weight:600;font-stretch:87.5%', 'tecnica'],
  ['Fragment Mono', S('fragment-mono'), 'font-weight:400', 'tecnica'],
  ['Chivo Mono', V('chivo-mono', 'wght'), 'font-weight:600', 'tecnica'],
  ['Major Mono Display', S('major-mono-display'), 'font-weight:400', 'tecnica'],
  ['Bodoni Moda', V('bodoni-moda', 'opsz'), "font-weight:600;font-variation-settings:'opsz' 96", 'editoriale'],
  ['EB Garamond, cifre all’antica', V('eb-garamond', 'wght'), 'font-weight:600;font-variant-numeric:oldstyle-nums tabular-nums', 'editoriale'],
  ['Cormorant, cifre all’antica', V('cormorant', 'wght'), 'font-weight:600;font-variant-numeric:oldstyle-nums tabular-nums', 'editoriale'],
  ['Newsreader, titolo', V('newsreader', 'opsz'), "font-weight:500;font-variation-settings:'opsz' 72", 'editoriale'],
  ['Newsreader, cifre all’antica', V('newsreader', 'opsz'), "font-weight:500;font-variation-settings:'opsz' 72;font-variant-numeric:oldstyle-nums tabular-nums", 'editoriale'],
  ['Literata, cifre all’antica', V('literata', 'opsz'), "font-weight:600;font-variation-settings:'opsz' 72;font-variant-numeric:oldstyle-nums tabular-nums", 'editoriale'],
  ['Libre Caslon Text', S('libre-caslon-text'), 'font-weight:400', 'editoriale'],
  ['Piazzolla', V('piazzolla', 'opsz'), "font-weight:700;font-variation-settings:'opsz' 72", 'editoriale'],
  ['Petrona', V('petrona', 'wght'), 'font-weight:700', 'editoriale'],
  ['Roboto Serif, stretto e ottico', V('roboto-serif', 'full'), "font-weight:700;font-variation-settings:'opsz' 72, 'wdth' 80", 'editoriale'],
]

// lettere in ordine sparso: il gruppo non si indovina dalla posizione
const ordine = CANDIDATI.map((c, i) => [i, (i * 17 + 5) % CANDIDATI.length]).sort((a, b) => a[1] - b[1]).map(([i]) => i)
const lettera = (n) => (n < 26 ? String.fromCharCode(65 + n) : 'A' + String.fromCharCode(65 + n - 26))

const fontFace = CANDIDATI.map(([, url], i) => `@font-face { font-family: "C${i}"; font-weight: 100 1000; font-stretch: 50% 150%; font-display: block; src: url(${url}) format("woff2"); }`).join('\n')
const ch = coloriMese(8, 'chiaro'), sc = coloriMese(8, 'scuro')

const tessera = (i, n) => {
  const [nome, , stile, gruppo] = CANDIDATI[i]
  return `<figure class="tessera"><figcaption><b>${lettera(n)}</b><span class="nome">${nome} · ${gruppo}</span></figcaption>
  <div class="testata" style="--f:'C${i}'">
    <p class="mese" style="${stile}">Settembre 2026</p>
    <p class="k">Speso finora</p>
    <p class="cifra num" style="${stile}">1.284,30<span class="eu">€</span></p>
    <p class="riga num" style="${stile.replace(/font-weight:\d+/, 'font-weight:500').replace(/font-stretch:[\d.]+%/, '')}">Entrate +1.500,00 · Saldo 215,70</p>
  </div></figure>`
}

const html = `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Prova alla cieca — la cifra del mese</title>
<style>
${fontFace}
*, *::before, *::after { box-sizing: border-box; }
:root { --blocco: ${ch.blocco}; --blocco-testo: ${ch.bloccoTesto}; --blocco-testo-2: ${ch.bloccoTesto2}; }
.scuro { --blocco: ${sc.blocco}; --blocco-testo: ${sc.bloccoTesto}; --blocco-testo-2: ${sc.bloccoTesto2}; }
body { margin: 0; background: #6f6d68; color: #fff; font: 15px/1.45 system-ui, sans-serif; }
.intro { max-width: 1280px; margin: 0 auto; padding: 26px 20px 4px; }
.intro h1 { margin: 0; font-size: 24px; } .intro p { margin: 8px 0 0; max-width: 92ch; }
.comandi { position: sticky; top: 0; z-index: 10; display: flex; gap: 10px; justify-content: center; padding: 10px; background: #3a3936; }
.comandi button { font: 600 15px system-ui; padding: 9px 14px; border-radius: 8px; border: 0; background: #fff; color: #111; cursor: pointer; }
.griglia { display: grid; grid-template-columns: repeat(auto-fill, 393px); gap: 22px; justify-content: center; padding: 20px 16px 60px; }
.tessera { margin: 0; }
.tessera figcaption { display: flex; gap: 10px; align-items: baseline; margin: 0 0 6px 4px; }
.tessera figcaption b { font-size: 20px; }
.nome { display: none; opacity: .85; font-size: 13.5px; } .con-nomi .nome { display: inline; }
.num { font-variant-numeric: tabular-nums; }
.testata { background: var(--blocco); color: var(--blocco-testo); border-radius: 24px; padding: 16px 20px 18px; font-family: var(--f); }
.mese { margin: 0; font-size: 19px; }
.k { margin: 16px 0 0; font: 600 14px system-ui, sans-serif; color: var(--blocco-testo-2); }
.cifra { margin: 2px 0 0; font-size: 60px; line-height: 1.05; letter-spacing: -.01em; white-space: nowrap; overflow: hidden; }
.cifra .eu { font-size: .42em; margin-left: .12em; color: var(--blocco-testo-2); }
.riga { margin: 12px 0 0; font-size: 15px; color: var(--blocco-testo-2); }
</style>
</head>
<body>
<header class="intro"><h1>Prova alla cieca — la cifra del mese</h1>
<p>Trenta caratteri sulla testata di settembre, senza nomi: guarda solo le forme. La cifra è a 60 px; i pochi caratteri troppo larghi per starci sono ridotti quanto basta. Segnati le lettere che ti colpiscono (anche solo tre), poi, se vuoi, premi "Mostra i nomi". Ci sono caratteri audaci, tecnici ed editoriali, con e senza grazie, alcuni con le cifre "all'antica". Tutti hanno cifre tabellari e sono self-hosted (@fontsource, licenza OFL), nessuno arriva da Google Fonts.</p></header>
<div class="comandi">
  <button onclick="document.documentElement.classList.toggle('scuro')">Chiaro / scuro</button>
  <button onclick="document.documentElement.classList.toggle('con-nomi')">Mostra / nascondi i nomi</button>
</div>
<main class="griglia">${ordine.map((i, n) => tessera(i, n)).join('')}</main>
<script>
  // i caratteri molto larghi non stanno in 353 px a 60 px: solo loro si riducono, una volta al caricamento
  document.fonts.ready.then(() => document.querySelectorAll('.cifra').forEach((el) => {
    const disponibile = el.clientWidth
    if (el.scrollWidth > disponibile) el.style.fontSize = (60 * disponibile / el.scrollWidth).toFixed(1) + 'px'
  }))
</script>
</body>
</html>
`
fs.writeFileSync(path.join(OUT, 'prova-cieca.html'), html)
// la chiave, per riferimento (non è linkata dalla pagina)
fs.writeFileSync(path.join(OUT, 'chiave.md'), `# Chiave della prova alla cieca\n\n${ordine.map((i, n) => `- **${lettera(n)}**: ${CANDIDATI[i][0]} (${CANDIDATI[i][3]})`).join('\n')}\n`)
console.log('ok', CANDIDATI.length)
