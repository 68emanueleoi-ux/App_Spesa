# Prompt — Web app per il tracciamento delle spese mensili

## Ruolo
Agisci come **senior frontend developer e product designer**. Progetti interfacce con un'identità visiva precisa, scrivi codice pulito e manutenibile, e ragioni prima sull'esperienza d'uso e poi sull'implementazione.

## Contesto
Sto costruendo una web app personale per tracciare **entrate e uscite mensili**. La userò io, ogni giorno, **soprattutto da smartphone** (installata sulla home come PWA) e da desktop. Lo scopo principale è capire a colpo d'occhio **come sta andando il mese corrente** e dove finiscono i soldi.

## Obiettivo
Realizza una single-page application funzionante, installabile come PWA, con dati persistenti in locale, che permetta di registrare movimenti (a mano o importandoli da CSV), organizzarli per categoria e leggere un report mensile chiaro.

---

## Modalità di lavoro: a fasi
Lavora **a fasi**. Alla fine di ogni fase fermati, riassumi in 5 righe cosa hai fatto e **aspetta il mio ok** prima di continuare.

- **Fase 0 — Design system + wireframe.** Nessun codice. Vedi "Direzione di design".
- **Fase 1 — Fondamenta.** Scaffold Vite, schema Dexie, seed categorie, funzioni di calcolo e formattazione con i relativi test, layout base con navigazione e tema chiaro/scuro. `npm run build` e `npm test` devono passare.
- **Fase 2 — Movimenti.** Form di inserimento, lista con filtri/ordinamento/ricerca, modifica ed eliminazione con annulla.
- **Fase 3 — Dashboard.** Totali, grafici, confronto col mese precedente, ultimi movimenti, stato vuoto.
- **Fase 4 — Categorie, import/export, PWA, rifinitura.**

Regole operative:
- **Crea i file sul disco**, non incollare il codice in chat. Mostra solo gli snippet necessari a spiegare una scelta.
- A fine fase esegui `npm run build`, `npm run lint` e `npm test` e riporta l'esito reale.
- Se una fase è troppo grande, spezzala tu e dimmelo.

---

## Requisiti funzionali

### 1. Pagina iniziale — Report mensile (dashboard)
È la prima schermata che si apre. Deve mostrare:
- **Selettore del mese** (mese precedente / successivo, default: mese corrente). Non si può andare oltre il mese corrente.
- **Totale entrate**, **totale uscite** e **saldo** del mese.
- **Ripartizione delle uscite per categoria** (grafico a ciambella o a barre) con percentuali.
- **Andamento giornaliero** del mese (grafico a linee o ad area: spesa cumulata giorno per giorno), con il mese precedente in sovrapposizione leggera per confronto.
- **Confronto con il mese precedente** (variazione in € e in %). Se il mese precedente non ha movimenti, mostra "—": mai `NaN`, mai `+∞%`.
- **Ultimi movimenti** del mese (5–10 elementi) con link alla lista completa.
- Uno **stato vuoto** utile quando il mese non ha movimenti (invito ad aggiungerne uno o a importare un CSV).

### 2. Movimenti (entrate e uscite)
- Aggiunta di un movimento con: **tipo** (entrata/uscita), **importo**, **categoria**, **data** (default: oggi), **descrizione** opzionale.
- Modifica ed eliminazione di un movimento. L'eliminazione mostra un toast con **"Annulla"** per qualche secondo invece di una finestra di conferma.
- Lista completa filtrabile per **mese, tipo e categoria**, ordinabile per data o importo, con ricerca testuale sulla descrizione. La ricerca ignora maiuscole e accenti ("cafe" trova "Caffè").
- L'inserimento deve essere **rapido**, pensato per il telefono:
  - Pulsante **"+" fisso in basso a destra**, raggiungibile col pollice, sempre visibile.
  - Tipo predefinito **"uscita"** (è il caso più frequente), data predefinita oggi. **Nessun campo a fuoco all'apertura**: su iPhone la tastiera non deve comparire finché non tocco l'importo.
  - Campo importo con `inputmode="decimal"`; accetta sia `12,50` che `12.50`.
  - Categorie selezionabili come griglia di chip con icona, non da un menu a tendina.
  - Scorciatoia da tastiera **`N`** per aprire il form su desktop, **`Esc`** per chiuderlo.
  - Validazione: importo > 0, categoria obbligatoria. Messaggi di errore inline, in italiano.
  - Obiettivo: registrare una spesa in **massimo 5 tocchi** (apri, tocca l'importo, cifra, categoria, salva).

### 3. Categorie
- Categorie **separate per tipo**: categorie di entrata (es. Stipendio, Borsa di studio, Regali) e categorie di uscita (es. Spesa, Affitto, Trasporti, Svago, Bollette).
- Fornisci un set di **categorie predefinite** al primo avvio.
- Ogni categoria ha: **nome, tipo, colore, icona**.
- **Creazione, modifica ed eliminazione** delle categorie.
- Esiste una categoria **"Senza categoria" per ogni tipo** (una per entrate, una per uscite), creata al seed e **non eliminabile**.
- **Eliminazione di una categoria con movimenti associati**: non cancellare i movimenti in silenzio. Chiedi all'utente se spostarli in un'altra categoria o in "Senza categoria".

### 4. Importazione CSV
Un tracker in cui ogni movimento va digitato a mano viene abbandonato. La fonte principale sarà l'**export movimenti di Postepay** (settimanale o mensile), ma l'import deve funzionare con qualsiasi CSV. Serve un import robusto:
- L'utente carica un file CSV (separatore `,` o `;`, rilevato automaticamente; codifica UTF-8 o Latin-1).
- L'app mostra le prime righe e chiede di **mappare le colonne**: data, importo, descrizione, eventuale tipo (o segno dell'importo). Il formato data e il separatore decimale vengono riconosciuti automaticamente e sono modificabili.
- **Anteprima** delle righe che verranno importate, con la categoria proposta per ciascuna, modificabile prima di confermare.
- **Deduplica**: una riga con stessa data + importo + descrizione di un movimento già esistente viene segnalata e saltata (con possibilità di forzare).
- **Regole di auto-categorizzazione**: "se la descrizione contiene X → categoria Y". Le regole sono gestibili dall'utente (crea, modifica, elimina) e si applicano anche ai movimenti inseriti a mano. Quando l'utente corregge la categoria di un movimento importato, proponi di creare una regola.
- La mappatura delle colonne viene **ricordata**: al secondo import dello stesso formato non va rifatta.

### 5. Esportazione e backup
- Esportazione e importazione dell'**intero database in JSON** (backup/ripristino).
- Esportazione dei movimenti in **CSV** (con gli stessi filtri attivi nella lista).

---

## Modello dati (indicativo)
```ts
type TipoMovimento = "entrata" | "uscita";

interface Categoria {
  id: string;
  nome: string;
  tipo: TipoMovimento;
  colore: string;      // hex
  icona: string;       // nome icona lucide
  diSistema?: boolean; // true per "Senza categoria": non eliminabile
}

interface Movimento {
  id: string;
  tipo: TipoMovimento;
  importo: number;     // in CENTESIMI, intero (1250 = € 12,50). MAI float in euro.
  categoriaId: string;
  data: string;        // ISO yyyy-mm-dd
  descrizione?: string;
  creatoIl: string;    // ISO datetime
  origine?: "manuale" | "import";
}

interface RegolaCategoria {
  id: string;
  contiene: string;    // testo cercato nella descrizione, case/accent-insensitive
  categoriaId: string;
  priorita: number;
}
```

### Importi: regola non negoziabile
Gli importi sono **interi in centesimi** ovunque nel codice (DB, stato, calcoli). In JavaScript `0.1 + 0.2 !== 0.3`: con i float in euro i totali mensili sbagliano di un centesimo, e per un'app di spese è il bug peggiore possibile. In `lib/` esistono solo due punti di conversione:
- `parseImporto("12,50") → 1250` (accetta virgola e punto, spazi, simbolo €)
- `formatImporto(1250) → "€ 12,50"`

---

## Persistenza
- Dati in **locale nel browser** con **IndexedDB tramite Dexie.js**.
- Stato reattivo tramite **`useLiveQuery` di `dexie-react-hooks`**: il database è l'unica fonte di verità, nessuno store parallelo da tenere sincronizzato.
- Tema scelto e mappatura CSV ricordati in una tabella `impostazioni`.

---

## PWA — il telefono di riferimento è un iPhone 15 (Safari iOS)
- **`vite-plugin-pwa`**: manifest (nome, icone, colore tema, `display: standalone`) e service worker.
- L'app deve essere **installabile sulla home** ("Condividi → Aggiungi alla schermata Home"), aprirsi a schermo intero senza barra del browser e **funzionare offline** (i dati sono già locali).
- Su iOS il manifest da solo non basta: servono `<meta name="apple-mobile-web-app-capable">`, `apple-mobile-web-app-status-bar-style`, `apple-touch-icon` 180×180 e `theme-color` per entrambi i temi.
- **Safe area**: `viewport-fit=cover` e `env(safe-area-inset-top/bottom)` per Dynamic Island e barra home; la barra schede e il pulsante + devono stare sopra l'indicatore home.
- Altezze con `100dvh`, mai `100vh` (con la tastiera aperta sbaglia). Il form deve restare visibile sopra la tastiera.
- **Tutti i campi di input a 16px o più**, altrimenti Safari zooma al focus. `inputmode="decimal"` per l'importo.
- **Font auto-ospitati** (pacchetti `@fontsource`), non caricati da Google Fonts: offline non arriverebbero.
- Chiedere `navigator.storage.persist()` al primo avvio. Ricordare all'utente il backup JSON: Safari può cancellare i dati dei siti non usati per 7 giorni (le app installate sulla home ne sono esenti, ma il backup resta la rete di sicurezza).
- Niente `-webkit-tap-highlight` grigio sui tocchi; feedback di tocco esplicito sui pulsanti.

---

## Direzione di design
Non voglio un'interfaccia da template (niente kit di card tutte uguali con ombra grigia, niente gradienti decorativi a caso). Nella Fase 0, prima di scrivere codice:

1. **Proponi un piccolo design system**: 4–6 colori con valori hex e ruolo, 1–2 font scelti con intenzione (non i soliti default), scala tipografica, raggi e spaziature.
2. **Proponi il layout** della dashboard con un wireframe ASCII (versione mobile e desktop) e spiega perché è adatto a leggere le finanze del mese.
3. **Scegli un solo elemento memorabile** (es. il saldo del mese trattato in modo tipografico forte, oppure un'animazione quando si aggiunge un movimento) e mantieni il resto sobrio.
4. Rivedi la proposta: se qualcosa sembra generico, cambialo e spiega cosa hai cambiato.

Vincoli di qualità:
- **Responsive, mobile first**, **tema chiaro e scuro**: segue il sistema, ma il toggle manuale ha precedenza e viene ricordato.
- Colori coerenti: entrate e uscite distinguibili, ma mai solo tramite colore (usa anche segno +/− o icona).
- Focus da tastiera visibile, contrasto accessibile (WCAG AA), rispetto di `prefers-reduced-motion`.
- Animazioni solo dove rispondono a un'azione (apertura del form, conferma, eliminazione), realizzate in **CSS** (`transition`, `@keyframes`).
- Testi dell'interfaccia in **italiano**, chiari e con verbi d'azione ("Aggiungi spesa", "Elimina categoria"). Importi in formato **€ 1.234,56**, date in formato italiano.

---

## Stack tecnico
- **React + Vite + TypeScript**
- **Tailwind CSS** per lo styling
- **shadcn/ui** (componenti accessibili e personalizzabili, non preconfezionati nello stile)
- **Recharts** per i grafici
- **lucide-react** per le icone delle categorie
- **Dexie.js + dexie-react-hooks** per IndexedDB e stato reattivo
- **React Hook Form + Zod** per form e validazione
- **date-fns** (locale `it`) per le date
- **PapaParse** per il parsing CSV
- **vite-plugin-pwa** per manifest e service worker
- **Vitest** per i test

Volutamente esclusi: **Zustand** (Dexie con `useLiveQuery` copre già lo stato reattivo; uno store parallelo è una seconda fonte di verità da tenere allineata) e **Framer Motion** (le animazioni richieste sono transizioni CSS). Se ritieni che una scelta della lista sia superflua o ne manchi una, dimmelo e motiva.

## Struttura del progetto attesa
```
src/
  components/    # UI riutilizzabili
  features/
    dashboard/
    movimenti/
    categorie/
    importazione/
  db/            # schema Dexie, seed categorie, migrazioni
  lib/           # importi (parse/format), date, calcoli mensili, normalizzazione testo
  lib/__tests__/ # test Vitest sulla logica
  App.tsx
```

---

## Test
Test **Vitest** solo sulla logica in `lib/`, nessun test sulla UI:
- `parseImporto` / `formatImporto` (virgola, punto, spazi, valori limite)
- totali entrate/uscite e saldo del mese
- variazione rispetto al mese precedente, **incluso il caso di mese precedente vuoto**
- ripartizione per categoria con percentuali che sommano a 100
- deduplica dell'import e applicazione delle regole di categorizzazione
- normalizzazione testo per la ricerca (maiuscole, accenti)

---

## Casi limite da gestire esplicitamente
- Mese precedente senza movimenti → confronto mostra "—".
- Primo avvio: seed delle categorie predefinite e delle due "Senza categoria", dashboard con stato vuoto.
- Movimento con data in un mese futuro: bloccato dalla validazione.
- CSV con righe vuote, intestazioni mancanti, importi con simbolo €, date in formati diversi.
- Import dello stesso file due volte: zero duplicati.
- Eliminazione di una categoria usata da regole di categorizzazione: le regole vengono eliminate o riassegnate insieme ai movimenti.

---

## Output richiesto per ogni fase
1. Riassunto di cosa è stato fatto (5 righe).
2. Esito reale di `npm run build`, `npm run lint`, `npm test`.
3. Eventuali decisioni prese in autonomia, con motivazione.
4. Alla fine della Fase 4: istruzioni per avviare il progetto, installarlo sul telefono, e un breve elenco di evoluzioni possibili (budget per categoria, spese ricorrenti, obiettivi di risparmio, inserimento automatico via URL con parametri da un'app di automazione Android che legge le notifiche Postepay).

## Criteri di accettazione
Funzionali:
- All'apertura vedo il report del mese corrente.
- Posso aggiungere una spesa in massimo 4 tocchi da smartphone.
- Posso aggiungere, modificare ed eliminare entrate e uscite, e annullare un'eliminazione.
- Posso creare ed eliminare categorie, e l'eliminazione gestisce i movimenti collegati.
- Posso importare un CSV, mappare le colonne, vedere l'anteprima, e reimportarlo senza creare duplicati.
- I dati restano salvati dopo aver ricaricato la pagina e dopo aver chiuso l'app.

Verificabili:
- `npm run build` termina senza errori né warning TypeScript.
- `npm run lint` e `npm test` passano.
- Nessun errore o warning nella console del browser durante l'uso normale.
- Lighthouse (mobile): Accessibilità ≥ 95, PWA installabile.
- Ogni form è usabile solo da tastiera (Tab, Invio per salvare, Esc per chiudere).
- L'app funziona offline dopo la prima apertura.
