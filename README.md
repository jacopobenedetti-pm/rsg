# Atlante dei pericoli per il motociclista

Web app che descrive in modo organizzato le circostanze di pericolo in cui si può trovare un motociclista sulle strade
pubbliche, a partire dai principi di dinamica del veicolo e del contatto pneumatico-pavimentazione.

Le basi tecniche sono due tesi di laurea in Ingegneria Civile (Università Roma Tre):

- **Tesi Manutenzione (TM)** — *L'analisi del degrado delle sovrastrutture stradali per la programmazione degli interventi
  finalizzati alla sicurezza dell'esercizio*: catalogo degli ammaloramenti, rischio R = P · G, caso studio delle ormaie e
  dell'aquaplaning.
- **Tesi Progettazione (TP)** — *Verifica dei criteri progettuali per gli utenti deboli della strada. Analisi degli standard
  normativi* (Tavole 01-18): trasferimento di carico, inclinazione, visuali libere, marcia notturna, diagramma delle velocità,
  aderenza impegnata e disponibile, barriere di sicurezza.

## Cosa contiene

| Sezione | Contenuto |
|---|---|
| **Scenari** | 50 scenari (18 urbani, 18 extraurbani, 14 autostradali), matrice contesto × causa, filtri. Ogni scheda: dinamica, cause infrastrutturali e d'esercizio, combinazione, segnali premonitori, condotta del motociclista, contromisure, rischio P × G, riferimenti alle tesi. |
| **Simulazioni** | 18 scenari con scena dinamica: vista dall'alto (planimetria animata), vista 3D in soggettiva, inseguimento e drone, parametri regolabili (velocità, tempo di reazione, intensità di frenata, bagnato, notte, ABS, piega massima, distanza di sicurezza, posizione in corsia). |
| **Fondamenti** | 12 calcolatori: aderenza, frenata e trasferimento di carico, spazio d'arresto, percezione, piega, ellisse di aderenza, visibilità in curva e sui raccordi, faro in curva, aquaplaning e ormaie, impatto e barriere, diagramma delle velocità. |
| **Ammaloramenti** | I degradi A-Q dei cataloghi riletti per la moto. |
| **Metodo** | Tassonomia, matrice di rischio, descrizione del modello di simulazione. |

Il catalogo ragionato completo è anche in [`docs/catalogo-scenari.md`](docs/catalogo-scenari.md), generato dagli stessi dati
dell'app.

## Classificazione

Ogni scenario è letto su tre assi:

1. **Contesto**: urbano, extraurbano, autostradale.
2. **Cause scatenanti**: infrastruttura (visibilità, stato della pavimentazione, geometria d'asse, arredo e margini) e
   condizioni di esercizio (traffico e interferenze, rallentamenti e code, mezzi pesanti). Da queste la **natura**:
   infrastrutturale, d'esercizio o combinata.
3. **Aggravanti ambientali**: pioggia, notte, abbagliamento, vento, temperatura, nebbia.

Gli scenari **fuori norma** (velocità oltre il limite, marcia tra le file, corsia d'emergenza, sorpassi vietati) analizzano
condotte non ammesse dal Codice della Strada per quantificarne il rischio, non per indicarle come condotte di guida.

## Avvio

```bash
npm install
npm run dev
```

Altri comandi:

```bash
npm run build          # verifica dei tipi e build di produzione in dist/
npm run build:single   # un unico file HTML autosufficiente in dist-single/
npm test               # verifica dei modelli fisici sui valori numerici delle tesi
npm run check          # esegue tutte le scene con varianti di parametri e stampa gli esiti
npm run catalog        # rigenera docs/catalogo-scenari.md
```

## Struttura del codice

```
src/
  data/            tassonomia, 50 scenari (urbano, extraurbano, autostradale), ammaloramenti
  physics/         modelli fisici dalle tesi (aderenza, frenata, curva, visibilità, impatto, ormaie, velocità)
  scene/           modello di scena condiviso, geometria stradale, simulatore, scene dei singoli scenari (presets/)
  views/           vista dall'alto (SVG), vista 3D (three.js), pannello di simulazione, orologio condiviso
  pages/           catalogo, scheda scenario, fondamenti, ammaloramenti, metodo
scripts/           verifica dei modelli, banco di prova delle scene, generazione del catalogo
docs/              catalogo ragionato generato
```

### Modello di scena

Una scena (`src/scene/types.ts`) è descritta una sola volta e alimenta tutte le viste: strade con ascissa curvilinea e
sezione trasversale (corsie, banchine, marciapiedi, spartitraffico, profilo altimetrico), innesti, arredo (edifici, alberi,
siepi, scarpate, guard-rail con o senza protezione per motociclisti, New Jersey, pali, delineatori), ammaloramenti e
contaminanti con la loro aderenza, veicoli con leggi del moto.

Il simulatore (`src/scene/simulate.ts`) muove la moto a passi di 1/100 s: il pericolo è percepito quando è una minaccia e la
linea di vista dall'occhio del pilota è libera da ostacoli, veicoli e profilo altimetrico (di notte, fuori dai centri abitati,
solo nel fascio del faro); dopo il tempo di reazione inizia la frenata, limitata dall'ellisse di aderenza (con ABS la
decelerazione si adatta, senza ABS l'anteriore si blocca). Se l'aderenza trasversale richiesta supera quella locale la moto
scivola, se supera la piega accettata dal pilota la traiettoria si allarga. Dopo una caduta moto e pilota scivolano fino
all'arresto o all'urto contro barriere, pali e veicoli.

### Aggiungere uno scenario

1. Aggiungere la scheda in `src/data/scenari/<contesto>.ts`.
2. Facoltativo: descrivere la scena in `src/scene/presets/<contesto>.ts` (funzione dei parametri) e registrarla.
3. `npm run check <ID>` per verificare gli esiti, `npm run catalog` per aggiornare il documento.

## Limiti

I modelli sono volutamente semplici e servono a confrontare situazioni e mostrare i meccanismi, non a ricostruire incidenti
o a progettare. I coefficienti di aderenza delle superfici sono indicativi; le curve aderenza-velocità-velo idrico sono
digitalizzate dalle figure della tesi; alcune calibrazioni (soglia di percezione dell'avvicinamento, coefficiente w della
gravità delle ormaie) sono dichiarate nel codice.
