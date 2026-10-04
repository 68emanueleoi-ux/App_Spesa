// Schermata di una pagina con Chrome headless pilotato via DevTools Protocol, in tempo reale
// (il --virtual-time-budget di Chrome blocca IndexedDB, quindi qui si aspetta davvero).
// Nessuna dipendenza: usa il WebSocket di Node.
// Uso: node design/strumenti/schermata.mjs <url> <file.png> [larghezza] [altezza] [attesa ms] [titolo atteso]
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const [url, uscita, larghezza = '900', altezza = '2400', attesa = '15000', titolo = ''] = process.argv.slice(2)
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const porta = 9300 + Math.floor(Math.random() * 500)
const profilo = fs.mkdtempSync(path.join(os.tmpdir(), 'spese-chrome-'))
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${porta}`, `--user-data-dir=${profilo}`,
  `--window-size=${larghezza},${altezza}`, '--force-device-scale-factor=1', 'about:blank'], { stdio: 'ignore' })

const pausa = (ms) => new Promise((r) => setTimeout(r, ms))
let ws
try {
  let bersaglio
  for (let i = 0; i < 50 && !bersaglio; i++) {
    await pausa(200)
    try { bersaglio = (await (await fetch(`http://127.0.0.1:${porta}/json`)).json()).find((t) => t.type === 'page') } catch { /* Chrome non è ancora pronto */ }
  }
  ws = new WebSocket(bersaglio.webSocketDebuggerUrl)
  await new Promise((r) => (ws.onopen = r))
  let id = 0
  const attese = new Map()
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (attese.has(m.id)) { attese.get(m.id)(m); attese.delete(m.id) } }
  const cmd = (method, params = {}) => new Promise((r) => { attese.set(++id, r); ws.send(JSON.stringify({ id, method, params })) })
  await cmd('Page.enable')
  await cmd('Emulation.setDeviceMetricsOverride', { width: +larghezza, height: +altezza, deviceScaleFactor: 1, mobile: false })
  await cmd('Page.navigate', { url })
  // si aspetta il titolo "pronto" (se richiesto) o semplicemente il tempo indicato
  const fine = Date.now() + +attesa
  while (Date.now() < fine) {
    await pausa(500)
    if (titolo) {
      const r = await cmd('Runtime.evaluate', { expression: 'document.title', returnByValue: true })
      if (r.result?.result?.value === titolo) { await pausa(1500); break }
    }
  }
  const foto = await cmd('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
  fs.writeFileSync(uscita, Buffer.from(foto.result.data, 'base64'))
  console.log('scritto', uscita)
} finally {
  ws?.close()
  chrome.kill()
  await pausa(500)
  fs.rmSync(profilo, { recursive: true, force: true })
}
