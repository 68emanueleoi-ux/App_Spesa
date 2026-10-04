// Genera src/tema-mesi.css: i token di colore del restyling "Mastro, colore del mese".
// - tavolozza fissa (categorie, verde delle entrate, rosso) per tema chiaro e scuro;
// - per ognuno dei 12 mesi e dei 2 temi: testata, carta, inchiostro, accento e pesi di Bitter.
// Il mese attivo si sceglie con l'attributo data-mese su <html> (1-12), il tema con la classe .dark.
// Prima di scrivere verifica i contrasti: se una coppia non passa, si ferma.
// Uso: node design/strumenti/genera-tema-mesi.mjs
import fs from 'node:fs'
import path from 'node:path'
import { MESI, coloriMese, contrasto } from './colori-mesi.mjs'

const ROOT = path.resolve(import.meta.dirname, '../..')
const PAL = JSON.parse(fs.readFileSync(new URL('./palette-proposte.json', import.meta.url))).mese
// Il rosso non sta nella tavolozza delle categorie: serve per "oltre il tetto" e per il saldo negativo.
const ROSSO = { chiaro: '#b3261e', scuro: '#ff7d6e' }

/* ---------- verifiche ---------- */
const errori = []
const mescola = (a, b, t) => '#' + [1, 3, 5].map((k) => Math.round(parseInt(a.slice(k, k + 2), 16) * t + parseInt(b.slice(k, k + 2), 16) * (1 - t)).toString(16).padStart(2, '0')).join('')
for (const tema of ['chiaro', 'scuro'])
  MESI.forEach((m, i) => {
    const c = coloriMese(i, tema)
    const prove = [
      ['testo sulla testata', c.bloccoTesto, c.blocco, 4.5], ['secondario sulla testata', c.bloccoTesto2, c.blocco, 4.5],
      ['inchiostro', c.inchiostro, c.carta, 4.5], ['inchiostro secondario', c.inchiostro2, c.carta, 4.5], ['accento', c.accento, c.carta, 4.5],
      ['carta sull’accento (pulsanti pieni)', c.carta, c.accento, 4.5], ['verde', PAL[tema].verde, c.carta, 4.5], ['rosso', ROSSO[tema], c.carta, 4.5],
      ...['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8'].flatMap((k) => [[k, PAL[tema][k], c.carta, 3], [`${k} su riquadro`, PAL[tema][k], mescola(PAL[tema][k], c.carta, 0.18), 3]]),
    ]
    for (const [nome, a, b, min] of prove) if (contrasto(a, b) < min) errori.push(`${tema} ${m.m}: ${nome} ${contrasto(a, b).toFixed(2)} < ${min}`)
  })
if (errori.length) { console.error(errori.join('\n')); process.exit(1) }

/* ---------- pesi di Bitter: seguono la vivacità della stagione ---------- */
const cMin = Math.min(...MESI.map((m) => m.C)), cMax = Math.max(...MESI.map((m) => m.C))
const peso = (C, da, a) => Math.round(da + ((C - cMin) / (cMax - cMin)) * (a - da))

/* ---------- CSS ---------- */
const blocco = (sel, c, m) => `${sel} {
  --blocco: ${c.blocco}; --blocco-testo: ${c.bloccoTesto}; --blocco-testo-2: ${c.bloccoTesto2};
  --carta: ${c.carta}; --inchiostro: ${c.inchiostro}; --inchiostro-2: ${c.inchiostro2}; --accento: ${c.accento};${m ? `
  --peso-cifra: ${peso(m.C, 640, 880)}; --peso-titoli: ${peso(m.C, 600, 820)}; --peso-importi: ${peso(m.C, 520, 680)};` : ''}
}`
const fissi = (sel, t) => `${sel} {
  ${['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8'].map((k) => `--cat-${k.slice(1)}: ${PAL[t][k]};`).join(' ')}
  --verde: ${PAL[t].verde}; --rosso: ${ROSSO[t]};
}`
const ora = new Date().getMonth()
const css = `/*
  FILE GENERATO da design/strumenti/genera-tema-mesi.mjs — non modificarlo a mano.

  Il colore del mese: ogni mese ha una tinta presa dalla stagione e una vivacità che
  segue l'anno (spenta d'inverno, piena d'estate). Ne derivano la testata (--blocco),
  la carta, l'inchiostro e l'accento di filetti, margini, grafico e collegamenti.
  Restano fissi i colori di categoria e il verde delle entrate.

  data-mese su <html> (1-12) sceglie il mese; senza, valgono i colori di ${MESI[ora].nome.toLowerCase()}
  (il mese della generazione), così la pagina non resta mai scolorita.
  Tutti i contrasti sono verificati dal generatore per i 12 mesi nei due temi.
*/

/* ---- tavolozza fissa ---- */
${fissi(':root', 'chiaro')}
${fissi(':root.dark', 'scuro')}

/* ---- valori di riserva, prima che data-mese sia impostato ---- */
${blocco(':root', coloriMese(ora, 'chiaro'), MESI[ora])}
${blocco(':root.dark', coloriMese(ora, 'scuro'))}

/* ---- i dodici mesi ---- */
${MESI.map((m, i) => `/* ${m.nome}: ${m.nota} */
${blocco(`:root[data-mese="${i + 1}"]`, coloriMese(i, 'chiaro'), m)}
${blocco(`:root.dark[data-mese="${i + 1}"]`, coloriMese(i, 'scuro'))}`).join('\n')}
`
fs.writeFileSync(path.join(ROOT, 'src/tema-mesi.css'), css)
console.log('src/tema-mesi.css scritto; contrasti verificati per 12 mesi × 2 temi')
