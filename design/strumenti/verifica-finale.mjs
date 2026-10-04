// Verifica finale del restyling sulla build di produzione (npx vite preview --port 5288).
// Chrome headless pilotato via DevTools, viewport iPhone 15 (393×852, mobile, tocco).
// Controlla: console pulita, nessuna richiesta esterna, nessuna animazione al caricamento,
// movimento ridotto, ultimo elemento sopra pulsante + e schede, PWA installabile, offline.
// Uso: node design/strumenti/verifica-finale.mjs   (con la preview attiva; dist deve contenere design/strumenti/anteprima-app.html)
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const BASE = 'http://localhost:5288'
const porta = 9500 + Math.floor(Math.random() * 300)
const profilo = fs.mkdtempSync(path.join(os.tmpdir(), 'spese-verifica-'))
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--disable-gpu', `--remote-debugging-port=${porta}`, `--user-data-dir=${profilo}`, 'about:blank'], { stdio: 'ignore' })
const pausa = (ms) => new Promise((r) => setTimeout(r, ms))
const esiti = []
const segna = (nome, ok, dettaglio = '') => { esiti.push({ nome, ok, dettaglio }); console.log(`${ok ? 'OK  ' : 'NO  '} ${nome}${dettaglio ? ' — ' + dettaglio : ''}`) }

let ws
try {
  let t
  for (let i = 0; i < 50 && !t; i++) { await pausa(200); try { t = (await (await fetch(`http://127.0.0.1:${porta}/json`)).json()).find((x) => x.type === 'page') } catch {} }
  ws = new WebSocket(t.webSocketDebuggerUrl)
  await new Promise((r) => (ws.onopen = r))
  let id = 0
  const attese = new Map()
  const console_ = []
  const richieste = []
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data)
    if (attese.has(m.id)) { attese.get(m.id)(m); attese.delete(m.id) }
    if (m.method === 'Runtime.consoleAPICalled' && ['error', 'warning', 'assert'].includes(m.params.type)) console_.push(`${m.params.type}: ${m.params.args.map((a) => a.value ?? a.description).join(' ')}`)
    if (m.method === 'Runtime.exceptionThrown') console_.push('eccezione: ' + (m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text))
    if (m.method === 'Log.entryAdded' && ['error', 'warning'].includes(m.params.entry.level)) console_.push(`log ${m.params.entry.level}: ${m.params.entry.text} ${m.params.entry.url ?? ''}`)
    if (m.method === 'Network.requestWillBeSent') richieste.push(m.params.request.url)
  }
  const cmd = (method, params = {}) => new Promise((r) => { attese.set(++id, r); ws.send(JSON.stringify({ id, method, params })) })
  const valuta = async (expr) => { const r = (await cmd('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result; return r?.exceptionDetails ? { errore: r.exceptionDetails.exception?.description } : r?.result?.value }
  const vai = async (url, attesa = 2500) => { await cmd('Page.navigate', { url }); await pausa(attesa) }

  await cmd('Page.enable'); await cmd('Runtime.enable'); await cmd('Network.enable'); await cmd('Log.enable')
  await cmd('Emulation.setDeviceMetricsOverride', { width: 393, height: 852, deviceScaleFactor: 3, mobile: true })
  await cmd('Emulation.setTouchEmulationEnabled', { enabled: true })
  // Chrome headless dichiara da solo "riduci movimento": senza questo il controllo sulle animazioni
  // al caricamento sarebbe troppo facile (con movimento ridotto durano 0,01 ms)
  await cmd('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] })

  // 0. dati di prova (agosto e settembre 2026) e service worker installato
  await vai(`${BASE}/design/strumenti/anteprima-app.html?altezza=852`, 1000)
  for (let i = 0; i < 60 && (await valuta('document.title')) !== 'pronto'; i++) await pausa(500)
  console_.length = 0

  // 1. ogni schermata: console, animazioni al caricamento, ultimo elemento sopra + e schede
  const PAGINE = [['Report', '/?mese=2026-09'], ['Movimenti', '/movimenti?mese=2026-09'], ['Categorie', '/categorie?mese=2026-09'], ['Importazione', '/importazione?mese=2026-09'], ['Report di un mese vuoto', '/']]
  for (const tema of ['chiaro', 'scuro']) {
    await valuta(`localStorage.setItem('spese.tema', '${tema}')`)
    for (const [nome, url] of PAGINE) {
      await vai(BASE + url, 3000)
      const anim = await valuta(`document.getAnimations().filter((a) => a.playState === 'running').map((a) => a.animationName || a.constructor.name)`)
      segna(`${nome} (${tema}): nessuna animazione partita da sola`, Array.isArray(anim) && anim.length === 0, Array.isArray(anim) && anim.length ? anim.join(', ') : '')
      const sotto = await valuta(`(async () => {
        window.scrollTo(0, document.documentElement.scrollHeight)
        await new Promise((r) => setTimeout(r, 400))
        const main = document.querySelector('main')
        const tutti = [...main.querySelectorAll('button, a, p, li, h2, input, select, table, svg')].filter((e) => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden')
        const ultimo = tutti.reduce((a, b) => (b.getBoundingClientRect().bottom > a.getBoundingClientRect().bottom ? b : a))
        const piu = document.querySelector('[aria-label="Aggiungi movimento"]').getBoundingClientRect()
        const schede = document.querySelector('nav[aria-label="Sezioni"].fixed').getBoundingClientRect()
        const fondo = ultimo.getBoundingClientRect().bottom
        return { fondo: Math.round(fondo), piu: Math.round(piu.top), schede: Math.round(schede.top), libero: fondo <= piu.top && fondo <= schede.top }
      })()`)
      segna(`${nome} (${tema}): l'ultimo elemento resta sopra il + e le schede`, sotto?.libero === true, sotto ? `ultimo a ${sotto.fondo}px, + a ${sotto.piu}px, schede a ${sotto.schede}px` : JSON.stringify(sotto))
    }
  }
  segna('Console senza errori né avvisi su tutte le schermate', console_.length === 0, console_.slice(0, 5).join(' | '))

  // 2. nessuna richiesta fuori da questo dominio (font compresi)
  const esterne = [...new Set(richieste.filter((u) => /^https?:/.test(u) && !u.startsWith(BASE) && !u.startsWith('http://127.0.0.1')))]
  segna('Nessuna richiesta a domini esterni', esterne.length === 0, esterne.slice(0, 5).join(', '))
  const font = [...new Set(richieste.filter((u) => /\.woff2?($|\?)/.test(u)).map((u) => u.replace(BASE, '')))]
  segna('Font serviti dal sito stesso', font.length > 0 && font.every((u) => u.startsWith('/')), font.map((u) => u.split('/').pop().replace(/-[A-Za-z0-9_]{8}\./, '.')).join(', '))

  // 3. movimento ridotto: pannello aperto e cambio di scheda senza animazioni che durano
  await cmd('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
  await vai(`${BASE}/?mese=2026-09`, 2500)
  const ridotto = await valuta(`(async () => {
    document.querySelector('[aria-label="Aggiungi movimento"]').click()
    await new Promise((r) => setTimeout(r, 60))
    const durate = document.getAnimations().map((a) => a.effect?.getTiming().duration ?? 0).map((d) => (typeof d === 'number' ? d : 0))
    const vt = 'startViewTransition' in document
    return { lunghe: durate.filter((d) => d > 1).length, totali: durate.length, vt }
  })()`)
  segna('Con "riduci movimento" niente si muove (apertura del pannello)', ridotto?.lunghe === 0, JSON.stringify(ridotto))
  await cmd('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] })

  // 4. PWA installabile: errori di installabilità secondo Chrome, e manifest
  await vai(`${BASE}/`, 3000)
  const inst = await cmd('Page.getInstallabilityErrors')
  const errInst = inst.result?.installabilityErrors ?? []
  segna('PWA installabile (nessun errore di installabilità)', errInst.length === 0, errInst.map((e) => e.errorId).join(', '))
  const manifest = await cmd('Page.getAppManifest')
  segna('Manifest senza errori', (manifest.result?.errors ?? []).length === 0, (manifest.result?.errors ?? []).map((e) => e.message).join(' | '))

  // 5. offline: con il service worker attivo l'app si apre senza rete
  const sw = await valuta(`navigator.serviceWorker.ready.then((r) => !!r.active)`)
  await cmd('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 })
  await vai(`${BASE}/movimenti?mese=2026-09`, 3000)
  const offline = await valuta(`document.body.innerText.includes('Conad') && document.body.innerText.includes('Settembre 2026')`)
  segna('Funziona offline dopo la prima visita', sw === true && offline === true, `service worker attivo: ${sw}, movimenti visibili offline: ${offline}`)
  await cmd('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 })
} finally {
  ws?.close(); chrome.kill(); await pausa(500); fs.rmSync(profilo, { recursive: true, force: true })
}
const falliti = esiti.filter((e) => !e.ok)
console.log(`\n${esiti.length - falliti.length}/${esiti.length} controlli superati`)
process.exit(falliti.length ? 1 : 0)
