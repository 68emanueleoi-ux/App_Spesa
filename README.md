# Spese

Web app personale per tracciare entrate e uscite mensili. Pensata per iPhone (installata sulla home come PWA) e desktop. I dati restano **solo sul dispositivo** (IndexedDB): niente account, niente server.

- **Report del mese**: quanto hai speso finora, il tratto delle uscite cumulate confrontato con il mese precedente allo stesso giorno, ripartizione per categoria, ultimi movimenti.
- **Movimenti**: inserimento in 4 tocchi, lista per giorno con filtri e ricerca, modifica, eliminazione con Annulla.
- **Categorie** con colore e icona; eliminazione che sposta i movimenti invece di cancellarli.
- **Importazione CSV** (Postepay, banca, fogli di calcolo) con riconoscimento delle colonne, anteprima, deduplica e regole di categorizzazione automatica.
- **Backup e ripristino** in JSON, **esportazione CSV**.
- Tema chiaro/scuro, offline, importi sempre in centesimi interi (mai float).

## Avvio

```bash
npm install
npm run dev        # http://localhost:5173
```

```bash
npm run build      # produce dist/
npm run preview    # serve dist/ su http://localhost:4173 (con service worker)
npm test           # test Vitest sulla logica (importi, date, calcoli, CSV, export)
npm run lint       # oxlint
```

## Installare su iPhone

L'app va servita **in HTTPS** (Safari installa le PWA solo da HTTPS, `localhost` escluso). Due strade:

1. **GitHub Pages** (gratis): pubblicare `dist/` e aprire l'URL da Safari.
2. **Rete locale per provare**: `npm run preview -- --host` e aprire l'indirizzo del PC dall'iPhone (funziona ma senza HTTPS non si installa e non lavora offline).

Poi, da Safari: **Condividi → Aggiungi alla schermata Home**. L'app si apre a schermo intero, funziona offline e non risente della pulizia dei dati dei siti che Safari fa dopo 7 giorni di inattività. Fai comunque un backup ogni tanto: Movimenti → icona database → **Salva un backup** (si salva in File o si manda via AirDrop/mail).

## Importare da Postepay

1. Dall'app Postepay o dall'area riservata esporta la lista movimenti (CSV o Excel → salva come CSV).
2. Nell'app: Movimenti → icona database → **Importa CSV**, oppure "Importa CSV" dal report vuoto.
3. Controlla le colonne (di solito sono riconosciute), guarda l'anteprima, correggi le categorie: ogni correzione propone una regola ("conad" → Spesa) che vale per gli import successivi e per i movimenti a mano.
4. Reimportare lo stesso file non crea doppioni: un movimento con stessa data, importo e descrizione viene saltato.

## Struttura

```
src/
  components/      # Sheet (pannello modale), Toast, shell con navigazione, icone
  features/
    dashboard/     # report: tratto del mese, ripartizione, confronto
    movimenti/     # form, lista, pannello dati (import/export/backup)
    categorie/     # categorie e regole
    importazione/  # procedura CSV in tre passi
  db/              # Dexie: schema, seed, operazioni per tabella, backup
  lib/             # importi (centesimi), date, calcoli mensili, CSV, export, tema
  lib/__tests__/   # test
```

Decisioni tecniche: importi come interi in centesimi; colore di categoria come chiave di tavolozza (valori diversi in chiaro e scuro, validati per contrasto e daltonismo); stato reattivo con `useLiveQuery` di Dexie (nessuno store parallelo); grafico in SVG puro; set fisso di icone lucide (offline e bundle leggero).

## Evoluzioni possibili

- **Budget per categoria** con barra di avanzamento nel report.
- **Spese ricorrenti** (affitto, abbonamenti) create in automatico il giorno giusto.
- **Obiettivi di risparmio** mensili.
- **Inserimento automatico da notifiche Postepay** (Android): un'app di automazione legge la notifica di pagamento e apre l'app con `?importo=…&descrizione=…`; l'app crea il movimento applicando le regole.
- Sincronizzazione fra dispositivi tramite backup su iCloud Drive.
