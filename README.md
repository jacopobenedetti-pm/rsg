# Atlante dei pericoli per il motociclista

Web app pensata innanzitutto per i motociclisti: descrive in modo organizzato le circostanze di pericolo in cui ci si può
trovare sulle strade pubbliche, a partire dai principi di dinamica del veicolo e del contatto pneumatico-pavimentazione, e
le fa vedere con simulazioni dinamiche dall'alto e in soggettiva.

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
| **Scenari** | 50 scenari (18 urbani, 18 extraurbani, 14 autostradali), matrice contesto × causa, filtri. Ogni scheda: il consiglio «In sella», come riconoscere la situazione, come comportarsi, cosa succede alla moto, il ruolo della strada e del traffico, rischio P × G, riferimenti alle tesi; in fondo, per tecnici e gestori, le contromisure. |
| **Simulazioni** | Tutti i 50 scenari hanno una scena dinamica: vista dall'alto (che segue la moto), vista 3D in soggettiva, inseguimento e drone. Parametri regolabili secondo lo scenario: velocità, tempo di reazione, intensità di frenata, bagnato, notte, ABS, piega massima, distanza di sicurezza, posizione in corsia, angolo di attraversamento, accelerazione, ghiaccio. |
| **Con e senza guard-rail** | Negli scenari con uscita di strada (E-02, E-03, E-05, E-06, E-07, E-10, A-08, A-11) si sceglie cosa c'è sul margine: nessuna barriera (rilevato, alberi), guard-rail a paletti, guard-rail con protezione per motociclisti (o, per le cuspidi, testata nuda, terminale, attenuatore). Una tabella confronta le tre conseguenze della stessa caduta. |
| **Fisica della moto** | 12 calcolatori, ciascuno con un consiglio pratico: aderenza, frenata e trasferimento di carico, spazio d'arresto, percezione, piega, ellisse di aderenza, visibilità in curva e sui raccordi, faro in curva, aquaplaning e ormaie, impatto e barriere, diagramma delle velocità. |
| **Insidie dell'asfalto** | I degradi A-Q dei cataloghi riletti per la moto. |
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
scivola, se supera la piega accettata dal pilota la traiettoria si allarga. Sono modellati anche il velo d'acqua e
l'aquaplaning (altezza critica in funzione della velocità, ormaie a sezione parabolica), la pendenza in frenata e in
scivolata, le frenate programmate, l'angolo di attraversamento di rotaie e gradini, dossi e cordoli, raffiche e scia dei
mezzi pesanti, la nube d'acqua che sollevano sul bagnato, l'adattamento visivo in galleria, il semirimorchio che taglia le
curve (cinematica della ralla) e le portiere. Dopo una caduta moto e pilota scivolano fino all'arresto o all'urto: con il
guard-rail a paletti l'impatto è contro i sostegni, con la protezione continua il corpo viene guidato lungo la barriera,
senza barriera cade nel rilevato o contro gli alberi.

### Aggiungere uno scenario

1. Aggiungere la scheda in `src/data/scenari/<contesto>.ts`.
2. Facoltativo: descrivere la scena in `src/scene/presets/<contesto>.ts` (funzione dei parametri) e registrarla.
3. `npm run check <ID>` per verificare gli esiti, `npm run catalog` per aggiornare il documento.

## Limiti

I modelli sono volutamente semplici e servono a confrontare situazioni e mostrare i meccanismi, non a ricostruire incidenti
o a progettare. I coefficienti di aderenza delle superfici sono indicativi; le curve aderenza-velocità-velo idrico sono
digitalizzate dalle figure della tesi; alcune calibrazioni (soglia di percezione dell'avvicinamento, coefficiente w della
gravità delle ormaie) sono dichiarate nel codice.
