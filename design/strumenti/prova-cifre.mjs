// Verifica che un font abbia cifre tabellari (vincolo del prompt): misura in Chrome headless
// "1111", "0000", "4444", "7777" con font-variant-numeric: tabular-nums. Se le larghezze
// coincidono, le cifre sono tabellari.
// Uso: node design/strumenti/prova-cifre.mjs @fontsource-variable/brygada-1918 @fontsource/b612 ...
// Esportato anche come funzione per i generatori.
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const ROOT = path.resolve(import.meta.dirname, '../..')
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'

/** il file latin più completo del pacchetto: full > standard > wght > 400 */
export function fileLatino(pkg) {
  const dir = path.join(ROOT, 'node_modules', pkg, 'files')
  const file = fs.readdirSync(dir).filter((f) => /-latin-(full|standard|wght|400)-normal\.woff2$/.test(f) && !f.includes('-ext-'))
  const pref = ['full', 'standard', 'wght', '400']
  file.sort((a, b) => pref.findIndex((x) => a.includes(`-${x}-`)) - pref.findIndex((x) => b.includes(`-${x}-`)))
  return file[0]
}

export function provaCifre(pacchetti) {
  const pagina = path.join(ROOT, 'design', '_prova-cifre.html')
  const css = pacchetti.map((p, i) => `@font-face{font-family:F${i};src:url(../node_modules/${p}/files/${fileLatino(p)})}`).join('')
  fs.writeFileSync(pagina, `<!doctype html><meta charset=utf-8><style>${css} span{font-size:100px;font-variant-numeric:tabular-nums;white-space:pre}</style><body><div id=o></div><script>
const N=${JSON.stringify(pacchetti)};Promise.all(N.map((n,i)=>document.fonts.load('100px F'+i))).then(()=>{o.innerHTML=N.map((n,i)=>{const w=t=>{const s=document.createElement('span');s.style.fontFamily='F'+i;s.textContent=t;document.body.appendChild(s);const x=s.getBoundingClientRect().width;s.remove();return x.toFixed(1)};const a=[w('1111'),w('0000'),w('4444'),w('7777')];return 'ESITO|'+n+'|'+(new Set(a).size===1)+'|'+document.fonts.check('100px F'+i)}).join('<br>')})</script>`)
  try {
    const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--allow-file-access-from-files', '--virtual-time-budget=15000', '--dump-dom', 'file:///' + pagina.replace(/\\/g, '/')], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
    return Object.fromEntries([...dom.matchAll(/ESITO\|([^|]+)\|(true|false)\|(true|false)/g)].map(([, p, t, c]) => [p, { tabellari: t === 'true', caricato: c === 'true' }]))
  } finally {
    fs.rmSync(pagina, { force: true })
  }
}

if (process.argv[1] && import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  const esito = provaCifre(process.argv.slice(2))
  for (const [p, e] of Object.entries(esito)) console.log(`${e.tabellari ? 'SI' : 'no'} ${e.caricato ? '' : '(non caricato) '}${p}`)
}
