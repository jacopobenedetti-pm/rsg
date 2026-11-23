# Catalogo ragionato degli scenari di pericolo per il motociclista

> File generato da `npm run catalog` a partire da `src/data/scenari/*.ts` e `src/data/inSella.ts`. Non modificarlo a mano.

L’app è pensata innanzitutto per i motociclisti: ogni scenario ha un consiglio «In sella» e una simulazione dinamica (vista dall’alto e in soggettiva) in cui si possono cambiare velocità, distanze, pioggia, notte, ABS e, dove serve, il tipo di barriera sul margine.

## Criteri di classificazione

Ogni scenario è letto su tre assi indipendenti:

1. **Contesto** — *Urbano*, *Extraurbano*, *Autostradale*.
2. **Cause scatenanti**
   - legate all’infrastruttura: visibilità, stato della pavimentazione, geometria d’asse, arredo e margini;
   - legate alle condizioni di esercizio: traffico e interferenze, rallentamenti e code, mezzi pesanti;
   - da cui la **natura** dello scenario: *infrastrutturale* (il pericolo nasce dalla strada in sé, anche in assenza di altri veicoli); *d’esercizio* (il pericolo nasce dalle condizioni di circolazione e dalle manovre altrui); *combinato* (il pericolo nasce dall’interazione: la strada da sola o il traffico da solo non basterebbero a generarlo).
3. **Aggravanti ambientali** — pioggia / bagnato, notte, abbagliamento, vento laterale, temperatura, nebbia.

Gli scenari marcati **⚠ fuori norma** analizzano condotte non ammesse dal Codice della Strada (velocità oltre il limite, marcia tra le file, corsia d’emergenza, sorpassi vietati) per quantificarne il rischio, non per indicarle come condotte di guida.

La stima del rischio segue la Tesi Manutenzione (§II.4.1): **R = P · G**, con probabilità P e gravità G su scala 1-5.

## Matrice di sintesi

| Codice | Scenario | Natura | Infrastruttura | Esercizio | Ambiente | P | G | R |
|---|---|---|---|---|---|---|---|---|
| U-01 | Svolta a sinistra davanti alla moto | Combinato | Visibilità, Geometria d’asse | Traffico e interferenze | — | 4 | 5 | 20 critico |
| U-02 | Immissione da laterale con visibilità ostruita | Combinato | Visibilità, Arredo e margini | Traffico e interferenze | — | 4 | 4 | 16 critico |
| U-03 | Apertura della portiera di un veicolo in sosta | D’esercizio | Geometria d’asse | Traffico e interferenze | — | 3 | 3 | 9 medio |
| U-04 | Pedone che sbuca davanti a un veicolo fermo sulle strisce ⚠ | Combinato | Visibilità, Stato della pavimentazione | Traffico e interferenze, Mezzi pesanti | — | 3 | 4 | 12 elevato |
| U-05 | Frenata d’emergenza su strisce pedonali bagnate | Combinato | Stato della pavimentazione | Traffico e interferenze | Pioggia / bagnato | 4 | 3 | 12 elevato |
| U-06 | Chiusini e griglie metalliche in curva e in frenata | Infrastrutturale | Stato della pavimentazione, Arredo e margini | — | Pioggia / bagnato | 3 | 3 | 9 medio |
| U-07 | Binari del tram e attraversamento radente | Infrastrutturale | Stato della pavimentazione, Geometria d’asse | Traffico e interferenze | Pioggia / bagnato | 3 | 3 | 9 medio |
| U-08 | Pavimentazioni lapidee lucidate e sconnesse | Infrastrutturale | Stato della pavimentazione | — | Pioggia / bagnato | 3 | 2 | 6 medio |
| U-09 | Buca nascosta dal veicolo che precede | Combinato | Stato della pavimentazione | Traffico e interferenze | — | 4 | 3 | 12 elevato |
| U-10 | Gasolio e sabbia in rotatoria | Combinato | Stato della pavimentazione, Geometria d’asse | Mezzi pesanti | — | 3 | 3 | 9 medio |
| U-11 | Cordoli, isole e dissuasori a ridosso della traiettoria | Infrastrutturale | Arredo e margini, Geometria d’asse | Traffico e interferenze | — | 2 | 4 | 8 medio |
| U-12 | Filtraggio tra le file e cambio di corsia improvviso ⚠ | D’esercizio | Geometria d’asse | Rallentamenti e code, Traffico e interferenze | — | 4 | 2 | 8 medio |
| U-13 | Svolta a destra che taglia la moto ⚠ | D’esercizio | Geometria d’asse | Traffico e interferenze | — | 3 | 3 | 9 medio |
| U-14 | Angolo cieco dei mezzi pesanti in svolta | D’esercizio | Geometria d’asse | Mezzi pesanti | — | 2 | 5 | 10 elevato |
| U-15 | Dossi artificiali e attraversamenti rialzati | Infrastrutturale | Arredo e margini, Geometria d’asse, Visibilità | — | Notte | 2 | 3 | 6 medio |
| U-16 | Contrasti di luminanza: sole radente, ombre, fari | Combinato | Visibilità | Traffico e interferenze | Abbagliamento, Notte | 3 | 4 | 12 elevato |
| U-17 | Contaminanti: foglie, fango di cantiere, olio ai semafori | Combinato | Stato della pavimentazione | Traffico e interferenze, Mezzi pesanti | Pioggia / bagnato | 3 | 2 | 6 medio |
| U-18 | Viale a scorrimento percorso oltre il limite ⚠ | Combinato | Visibilità, Geometria d’asse | Traffico e interferenze | — | 3 | 5 | 15 elevato |
| E-01 | Ostacolo oltre una curva cieca in trincea | Combinato | Visibilità, Geometria d’asse | Traffico e interferenze | — | 3 | 4 | 12 elevato |
| E-02 | Curva a raggio decrescente dopo un lungo rettifilo ⚠ | Infrastrutturale | Geometria d’asse, Visibilità | — | — | 3 | 4 | 12 elevato |
| E-03 | Curva in discesa con frenata in piega | Combinato | Geometria d’asse | Traffico e interferenze | — | 3 | 4 | 12 elevato |
| E-04 | Veicolo fermo oltre un dosso | Combinato | Visibilità, Geometria d’asse | Traffico e interferenze | — | 2 | 4 | 8 medio |
| E-05 | Ghiaia alla corda di una curva | Infrastrutturale | Stato della pavimentazione, Arredo e margini | Traffico e interferenze | — | 3 | 4 | 12 elevato |
| E-06 | Impatto contro guard-rail e paletti dopo la scivolata | Infrastrutturale | Arredo e margini | — | — | 2 | 5 | 10 elevato |
| E-07 | Alberi, pali e muretti al margine | Infrastrutturale | Arredo e margini | — | — | 2 | 5 | 10 elevato |
| E-08 | Ormaie con pioggia: aquaplaning e marcia a binario | Combinato | Stato della pavimentazione | Mezzi pesanti, Traffico e interferenze | Pioggia / bagnato | 3 | 4 | 12 elevato |
| E-09 | Inerti lucidati e prima pioggia | Combinato | Stato della pavimentazione | Traffico e interferenze | Pioggia / bagnato, Temperatura | 3 | 3 | 9 medio |
| E-10 | Sigillature bituminose e rappezzi in curva | Infrastrutturale | Stato della pavimentazione | — | Temperatura, Pioggia / bagnato | 2 | 3 | 6 medio |
| E-11 | Sorpasso della colonna e svolta a sinistra del veicolo sorpassato ⚠ | Combinato | Visibilità, Geometria d’asse | Traffico e interferenze | — | 3 | 5 | 15 elevato |
| E-12 | Mezzo pesante che taglia la curva sinistrorsa | Combinato | Geometria d’asse, Visibilità | Mezzi pesanti | — | 2 | 5 | 10 elevato |
| E-13 | Immissione da accesso privato su rettifilo veloce | Combinato | Visibilità | Traffico e interferenze | — | 3 | 5 | 15 elevato |
| E-14 | Curva di notte: il faro illumina l’esterno | Combinato | Visibilità, Geometria d’asse | Traffico e interferenze | Notte | 2 | 4 | 8 medio |
| E-15 | Vento laterale e onda d’urto dei mezzi pesanti incrociati | Combinato | Geometria d’asse, Arredo e margini | Mezzi pesanti | Vento laterale | 2 | 4 | 8 medio |
| E-16 | Galleria: buco nero all’ingresso e abbagliamento all’uscita | Combinato | Visibilità, Stato della pavimentazione | Rallentamenti e code | Abbagliamento | 2 | 4 | 8 medio |
| E-17 | Cantiere: fresato, gradini e segnaletica provvisoria | Combinato | Stato della pavimentazione, Geometria d’asse | Rallentamenti e code, Mezzi pesanti | — | 3 | 3 | 9 medio |
| E-18 | Accelerazione tra due curve: la velocità oltre quella di progetto ⚠ | Infrastrutturale | Geometria d’asse, Visibilità | — | — | 3 | 4 | 12 elevato |
| A-01 | Fine coda nascosta dalla curva e dal New Jersey | Combinato | Visibilità, Geometria d’asse, Arredo e margini | Rallentamenti e code | — | 3 | 5 | 15 elevato |
| A-02 | Marcia tra le corsie in coda ⚠ | D’esercizio | Geometria d’asse | Rallentamenti e code, Mezzi pesanti | — | 3 | 3 | 9 medio |
| A-03 | Sorpasso di un mezzo pesante sotto la pioggia | D’esercizio | — | Mezzi pesanti | Pioggia / bagnato, Vento laterale | 2 | 4 | 8 medio |
| A-04 | Cambio di corsia del mezzo pesante nell’angolo cieco | D’esercizio | — | Mezzi pesanti, Traffico e interferenze | — | 2 | 5 | 10 elevato |
| A-05 | Ormaie nella corsia di marcia con pioggia | Combinato | Stato della pavimentazione | Mezzi pesanti | Pioggia / bagnato | 3 | 4 | 12 elevato |
| A-06 | Giunti di dilatazione dei viadotti in curva | Infrastrutturale | Stato della pavimentazione, Geometria d’asse | — | Pioggia / bagnato | 2 | 4 | 8 medio |
| A-07 | Detriti in carreggiata scoperti all’ultimo | D’esercizio | Visibilità | Mezzi pesanti, Traffico e interferenze | — | 2 | 5 | 10 elevato |
| A-08 | Rampa di svincolo a raggio decrescente con gasolio | Combinato | Geometria d’asse, Stato della pavimentazione | Mezzi pesanti, Rallentamenti e code | — | 3 | 4 | 12 elevato |
| A-09 | Immissione dalla corsia di accelerazione | Combinato | Geometria d’asse, Visibilità | Traffico e interferenze, Mezzi pesanti | — | 3 | 4 | 12 elevato |
| A-10 | Scambio di carreggiata in cantiere | Combinato | Geometria d’asse, Stato della pavimentazione, Arredo e margini | Rallentamenti e code, Mezzi pesanti | — | 3 | 4 | 12 elevato |
| A-11 | Ostacoli fissi: cuspidi, terminali e barriere | Infrastrutturale | Arredo e margini | — | — | 2 | 5 | 10 elevato |
| A-12 | Velocità molto superiore al limite e cambio di corsia ⚠ | D’esercizio | Visibilità | Traffico e interferenze, Mezzi pesanti | — | 3 | 5 | 15 elevato |
| A-13 | Ristagno d’acqua nella zona di flesso della sopraelevazione | Combinato | Geometria d’asse, Stato della pavimentazione | Traffico e interferenze | Pioggia / bagnato | 2 | 4 | 8 medio |
| A-14 | Corsia d’emergenza in coda ⚠ | D’esercizio | Arredo e margini, Stato della pavimentazione | Rallentamenti e code | — | 2 | 5 | 10 elevato |
| A-15 | Ghiaccio sul viadotto in curva | Infrastrutturale | Stato della pavimentazione, Geometria d’asse | — | Temperatura | 2 | 4 | 8 medio |

### Distribuzione

| Contesto | Infrastrutturali | D’esercizio | Combinati | Fuori norma | Totale |
|---|---|---|---|---|---|
| Urbano | 5 | 4 | 9 | 4 | 18 |
| Extraurbano | 6 | 0 | 12 | 3 | 18 |
| Autostradale | 3 | 6 | 6 | 3 | 15 |

## Contesto urbano

Elevato numero di interferenze e di punti di conflitto, marcia stop & go a bassa velocità media, pavimentazioni eterogenee (sottoservizi, chiusini, binari, lapidei), arredo urbano a ridosso della carreggiata.

### Scenari infrastrutturali

- [U-06](#u-06--chiusini-e-griglie-metalliche-in-curva-e-in-frenata) Chiusini e griglie metalliche in curva e in frenata
- [U-07](#u-07--binari-del-tram-e-attraversamento-radente) Binari del tram e attraversamento radente
- [U-08](#u-08--pavimentazioni-lapidee-lucidate-e-sconnesse) Pavimentazioni lapidee lucidate e sconnesse
- [U-11](#u-11--cordoli-isole-e-dissuasori-a-ridosso-della-traiettoria) Cordoli, isole e dissuasori a ridosso della traiettoria
- [U-15](#u-15--dossi-artificiali-e-attraversamenti-rialzati) Dossi artificiali e attraversamenti rialzati

### Scenari d’esercizio

- [U-03](#u-03--apertura-della-portiera-di-un-veicolo-in-sosta) Apertura della portiera di un veicolo in sosta
- [U-12](#u-12--filtraggio-tra-le-file-e-cambio-di-corsia-improvviso) Filtraggio tra le file e cambio di corsia improvviso ⚠
- [U-13](#u-13--svolta-a-destra-che-taglia-la-moto) Svolta a destra che taglia la moto ⚠
- [U-14](#u-14--angolo-cieco-dei-mezzi-pesanti-in-svolta) Angolo cieco dei mezzi pesanti in svolta

### Scenari combinati

- [U-01](#u-01--svolta-a-sinistra-davanti-alla-moto) Svolta a sinistra davanti alla moto
- [U-02](#u-02--immissione-da-laterale-con-visibilità-ostruita) Immissione da laterale con visibilità ostruita
- [U-04](#u-04--pedone-che-sbuca-davanti-a-un-veicolo-fermo-sulle-strisce) Pedone che sbuca davanti a un veicolo fermo sulle strisce ⚠
- [U-05](#u-05--frenata-demergenza-su-strisce-pedonali-bagnate) Frenata d’emergenza su strisce pedonali bagnate
- [U-09](#u-09--buca-nascosta-dal-veicolo-che-precede) Buca nascosta dal veicolo che precede
- [U-10](#u-10--gasolio-e-sabbia-in-rotatoria) Gasolio e sabbia in rotatoria
- [U-16](#u-16--contrasti-di-luminanza-sole-radente-ombre-fari) Contrasti di luminanza: sole radente, ombre, fari
- [U-17](#u-17--contaminanti-foglie-fango-di-cantiere-olio-ai-semafori) Contaminanti: foglie, fango di cantiere, olio ai semafori
- [U-18](#u-18--viale-a-scorrimento-percorso-oltre-il-limite) Viale a scorrimento percorso oltre il limite ⚠

### U-01 · Svolta a sinistra davanti alla moto

**Natura:** Combinato · **Rischio:** P 4 (alta) × G 5 (molto alta) = 20, critico

Un’auto proveniente dal senso opposto svolta a sinistra in una laterale e taglia la traiettoria della moto che procede diritta.

> **In sella.** Avvicinandoti a un incrocio con un’auto in attesa di svoltare, rallenta e copri i freni: per chi svolta sei più lontano e più lento di quanto sei davvero.

**Dinamica.** La sagoma frontale stretta della moto cresce lentamente nel campo visivo di chi svolta (basso tasso di espansione angolare): la velocità viene sottostimata e l’intervallo ritenuto sufficiente. Per la moto lo spazio disponibile è quello fra il punto in cui la manovra diventa evidente e il punto di conflitto; se è minore di v·τ + v²/(2a) l’urto è inevitabile, e la decelerazione reale di un motociclista medio è ben inferiore all’aderenza disponibile.

**Cause infrastrutturali** (visibilità, geometria d’asse)
- Assenza di corsia di accumulo per la svolta a sinistra: l’auto attende in corsia e parte "di slancio"
- Alberature, pali, cartelloni e veicoli in sosta che mascherano la moto nel cono visivo di chi svolta
- Illuminazione pubblica che crea contrasti e confonde il faro della moto con lo sfondo

**Cause d’esercizio** (traffico e interferenze)
- Colonna di veicoli nel senso della moto che la nasconde fino all’ultimo
- Pressione del traffico in coda dietro chi deve svoltare
- Moto che sopraggiunge a velocità superiore a quella del flusso

**Combinazione.** La geometria dell’intersezione impone di svoltare attraversando il flusso opposto, la visibilità ridotta impedisce una stima corretta, il traffico riduce il tempo di decisione.

**Segnali premonitori**
- Auto ferma con ruote già orientate verso la laterale, indicatore acceso o assente
- Conducente che guarda oltre la moto, verso i veicoli più grandi
- Varco nella colonna opposta in prossimità di una laterale o di un passo carrabile

**Condotta del motociclista**
- Ridurre la velocità prima dell’intersezione e coprire i freni
- Spostarsi lateralmente nella corsia per cambiare la posizione apparente e "farsi vedere"
- Prevedere la via di fuga dietro il veicolo, non davanti

**Contromisure per gestore e progettista**
- Corsie di accumulo e fasi semaforiche protette per le svolte a sinistra
- Triangoli di visibilità liberi da sosta e arredo
- Moderazione della velocità sui viali con molte laterali

**Esito tipico:** Urto frontale-laterale contro la fiancata dell’auto, con proiezione del motociclista.
  
**Riferimenti:** Tesi Progettazione, Tav. 01 — ambito urbano: elevato numero di intersezioni e punti di conflitto

### U-02 · Immissione da laterale con visibilità ostruita

**Natura:** Combinato · **Rischio:** P 4 (alta) × G 4 (alta) = 16, critico

Un’auto si immette da una strada laterale o da un passo carrabile; un furgone in sosta, una siepe o dei cassonetti nascondono reciprocamente i due veicoli.

> **In sella.** Se a destra ci sono furgoni in sosta o siepi, chi esce non ti vede e tu non vedi lui: stai più verso il centro e tieni una velocità da fermarti in 20 metri.

**Dinamica.** Finché la linea di vista è interrotta nessuno dei due può reagire: il tempo di percezione parte solo quando l’auto emerge dall’ostacolo. La distanza utile è quindi fissata dalla geometria dell’ostacolo, non dal comportamento del motociclista, e cresce solo riducendo la velocità o spostandosi verso il centro della carreggiata.

**Cause infrastrutturali** (visibilità, arredo e margini)
- Sosta consentita o tollerata a ridosso dell’intersezione
- Siepi, muri di recinzione, cassonetti, pensiline nel triangolo di visibilità
- Linea di arresto arretrata che obbliga a "sporgersi" per vedere

**Cause d’esercizio** (traffico e interferenze)
- Veicoli alti in sosta (furgoni, camper)
- Chi si immette guarda prima a sinistra, verso il flusso più vicino

**Combinazione.** L’ostacolo infrastrutturale e quello d’esercizio (veicolo in sosta) si sommano nel ridurre la visuale libera.

**Segnali premonitori**
- Muso di un veicolo che sporge oltre la sosta
- Riflessi o ombre in movimento sotto o tra i veicoli parcheggiati
- Interruzioni nella fila di sosta che indicano un accesso

**Condotta del motociclista**
- Marciare più vicino all’asse quando a destra c’è sosta alta
- Ridurre la velocità in prossimità di accessi nascosti
- Usare il faro e la posizione per entrare nel campo visivo di chi si immette

**Contromisure per gestore e progettista**
- Divieto fisico di sosta nei triangoli di visibilità (orecchie, dissuasori bassi)
- Specchi parabolici e avanzamento delle linee di arresto
- Manutenzione delle siepi private (art. 29 CdS)

**Esito tipico:** Urto contro il frontale o la fiancata del veicolo che si immette.

### U-03 · Apertura della portiera di un veicolo in sosta

**Natura:** D’esercizio · **Rischio:** P 3 (media) × G 3 (media) = 9, medio

La moto procede a ridosso della fila di sosta; un occupante apre la portiera lato strada.

> **In sella.** Lascia sempre lo spazio di una portiera aperta tra te e le auto parcheggiate; se non c’è, rallenta.

**Dinamica.** La portiera occupa circa 1 m della corsia in meno di un secondo. A 40 km/h in un secondo si percorrono 11 m: senza margine laterale la sola frenata non basta e lo scarto verso il centro espone al traffico che sopraggiunge.

**Cause infrastrutturali** (geometria d’asse)
- Corsia stretta tra sosta e linea di mezzeria che costringe a marciare a ridosso dei veicoli parcheggiati

**Cause d’esercizio** (traffico e interferenze)
- Sosta in linea continua
- Traffico in senso opposto o in sorpasso che spinge la moto verso destra
- Taxi e veicoli che fanno scendere passeggeri

**Segnali premonitori**
- Teste visibili all’interno dei veicoli in sosta
- Luci di stop o retromarcia appena spente
- Veicolo appena parcheggiato

**Condotta del motociclista**
- Mantenere almeno una portiera di distanza dalla sosta
- Ridurre la velocità quando la distanza laterale non è disponibile

**Contromisure per gestore e progettista**
- Fascia di rispetto tra sosta e corsia ("door zone")
- Sosta in linea solo con corsie di larghezza adeguata

**Esito tipico:** Urto contro lo spigolo della portiera e caduta verso il centro della carreggiata.

### U-04 · Pedone che sbuca davanti a un veicolo fermo sulle strisce ⚠ fuori norma

**Natura:** Combinato · **Rischio:** P 3 (media) × G 4 (alta) = 12, elevato

Un autobus o un furgone si ferma prima delle strisce; la moto lo supera e il pedone, nascosto dalla sagoma del mezzo, entra nella sua traiettoria.

> **In sella.** Un veicolo fermo davanti alle strisce nasconde qualcuno che attraversa: non superarlo.

> ⚠ **Sorpasso di un veicolo fermo per consentire l’attraversamento pedonale.** Manovra vietata in prossimità degli attraversamenti: analizzata per la frequenza con cui si verifica nel traffico urbano.

**Dinamica.** Il veicolo fermo occulta completamente il pedone fino all’ultimo metro. La frenata avviene sulle strisce, dove la segnaletica bagnata offre aderenza dimezzata: senza ABS il bloccaggio dell’anteriore porta alla caduta.

**Cause infrastrutturali** (visibilità, stato della pavimentazione)
- Fermata del trasporto pubblico subito prima dell’attraversamento
- Vernice delle strisce a bassa aderenza (vedi U-05)

**Cause d’esercizio** (traffico e interferenze, mezzi pesanti)
- Mezzi alti fermi
- Pedoni che attraversano in fretta per non perdere il mezzo

**Combinazione.** La posizione della fermata (infrastruttura) rende sistematico l’occultamento creato dal mezzo fermo (esercizio).

**Segnali premonitori**
- Veicolo fermo senza motivo apparente davanti a un attraversamento
- Pedoni sul marciapiede rivolti verso la carreggiata

**Condotta del motociclista**
- Non superare veicoli fermi in prossimità delle strisce
- Se si supera, farlo a passo d’uomo e lontano dalla sagoma

**Contromisure per gestore e progettista**
- Fermate dopo l’attraversamento
- Attraversamenti rialzati e illuminati
- Segnaletica orizzontale ad alta aderenza

**Esito tipico:** Investimento del pedone e caduta del motociclista in frenata.

### U-05 · Frenata d’emergenza su strisce pedonali bagnate

**Natura:** Combinato · **Rischio:** P 4 (alta) × G 3 (media) = 12, elevato

Il veicolo che precede frena all’improvviso in prossimità di un attraversamento; la moto deve fermarsi proprio sulle strisce bagnate.

> **In sella.** Sulle strisce bagnate l’aderenza si dimezza: frena prima, alleggerisci sulla vernice, riprendi dopo.

**Dinamica.** Le vernici e i termoplastici hanno tessitura quasi nulla: bagnati offrono un coefficiente di aderenza intorno a 0,3-0,4 contro 0,6-0,7 dell’asfalto circostante. La ruota anteriore, che in frenata porta gran parte del carico (trasferimento di carico), entra sulla vernice con una richiesta di aderenza superiore a quella offerta: senza ABS si blocca e la moto cade in pochi decimi di secondo.

**Cause infrastrutturali** (stato della pavimentazione)
- Segnaletica orizzontale di grande superficie (strisce, frecce, scritte, linee di arresto)
- Spessore dei termoplastici che crea piccoli gradini

**Cause d’esercizio** (traffico e interferenze)
- Distanza di sicurezza ridotta nel traffico urbano
- Frenate improvvise per pedoni

**Combinazione.** La richiesta di aderenza nasce dal traffico, la sua indisponibilità dalla pavimentazione: è l’esempio tipico di aderenza impegnata maggiore dell’aderenza disponibile.

**Aggravanti ambientali:** pioggia / bagnato

**Segnali premonitori**
- Strisce lucide alla luce dei fari o del sole
- Pioggia iniziata da poco

**Condotta del motociclista**
- Aumentare la distanza prima degli attraversamenti
- Concludere la frenata più forte prima della vernice, rilasciare sulle strisce e riprendere dopo
- Moto con ABS e ripartitore

**Contromisure per gestore e progettista**
- Vernici con inerti antiscivolo e verifica periodica della resistenza allo slittamento
- Strisce discontinue che lascino corridoi di asfalto per le ruote

**Esito tipico:** Caduta per bloccaggio dell’anteriore (low-side) e tamponamento del veicolo che precede.

### U-06 · Chiusini e griglie metalliche in curva e in frenata

**Natura:** Infrastrutturale · **Rischio:** P 3 (media) × G 3 (media) = 9, medio

Un chiusino o una caditoia si trova sulla traiettoria della moto in piega o nel punto di frenata.

> **In sella.** Chiusini e griglie bagnati sono quasi come ghiaccio: raddrizza la moto mentre ci passi sopra o scegli una traiettoria che li eviti.

**Dinamica.** Il metallo bagnato offre aderenza molto bassa (0,1-0,2): se la moto è in piega, l’aderenza trasversale impegnata (≈ tan γ) supera quella disponibile e la ruota scivola lateralmente. Chiusini ribassati o sopraelevati aggiungono un urto verticale che riduce per un istante il carico sulla ruota.

**Cause infrastrutturali** (stato della pavimentazione, arredo e margini)
- Chiusini posizionati nelle traiettorie di svolta
- Dislivelli tra chiusino e pavimentazione dopo rifacimenti
- Griglie con barre parallele al moto

**Aggravanti ambientali:** pioggia / bagnato

**Segnali premonitori**
- Superfici metalliche lucide sulla traiettoria
- Rappezzi circolari intorno ai chiusini

**Condotta del motociclista**
- Raddrizzare la moto mentre si passa sul metallo o scegliere una traiettoria che lo eviti
- Non frenare sopra al chiusino

**Contromisure per gestore e progettista**
- Chiusini con superficie antiscivolo
- Ricollocazione fuori dalle traiettorie di svolta
- Messa in quota dopo ogni rifacimento

**Esito tipico:** Scivolata in piega (low-side).

### U-07 · Binari del tram e attraversamento radente

**Natura:** Infrastrutturale · **Rischio:** P 3 (media) × G 3 (media) = 9, medio

La moto cambia corsia o svolta attraversando le rotaie con un angolo piccolo; la ruota anteriore entra nella gola o scivola sull’acciaio.

> **In sella.** Attraversa i binari il più possibile ad angolo retto, con la moto dritta e senza frenare; con la pioggia rallenta prima per poterlo fare.

**Dinamica.** Con angoli di attraversamento ridotti la ruota viene guidata dalla gola della rotaia o slitta lateralmente sul fungo levigato: si genera una forza laterale improvvisa sulla sola ruota anteriore, che fa perdere il controllo dello sterzo. Bagnata, la rotaia ha aderenza vicina a quella del ghiaccio sporco.

**Cause infrastrutturali** (stato della pavimentazione, geometria d’asse)
- Binari in sede promiscua
- Geometria delle svolte che impone attraversamenti obliqui
- Gola delle rotaie larga quanto lo pneumatico

**Cause d’esercizio** (traffico e interferenze)
- Traffico che costringe a cambiare corsia in spazi brevi

**Aggravanti ambientali:** pioggia / bagnato

**Segnali premonitori**
- Rotaie lucide nella corsia
- Intersezioni con binari in diagonale

**Condotta del motociclista**
- Attraversare le rotaie con l’angolo più vicino possibile a 90°
- Moto verticale e nessuna frenata durante l’attraversamento

**Contromisure per gestore e progettista**
- Sede tranviaria riservata
- Riempitivi in gomma nelle gole
- Geometrie che rendano l’attraversamento ortogonale

**Esito tipico:** Caduta per perdita di direzionalità dell’anteriore.

### U-08 · Pavimentazioni lapidee lucidate e sconnesse

**Natura:** Infrastrutturale · **Rischio:** P 3 (media) × G 2 (bassa) = 6, medio

Sampietrini, porfido o basalto levigati dal traffico, con giunti aperti e avvallamenti dovuti al cedimento del sottofondo.

> **In sella.** Sui sampietrini bagnati velocità più bassa, frenate in anticipo e piega minima: l’aderenza è un terzo di quella dell’asfalto asciutto.

**Dinamica.** Su lapidei lucidati e bagnati l’aderenza scende a 0,2-0,3; l’irregolarità del piano induce oscillazioni del carico verticale, che si traducono in variazioni continue del peso aderente proprio in frenata e in piega.

**Cause infrastrutturali** (stato della pavimentazione)
- Lucidatura degli elementi lapidei
- Cedimenti del sottofondo e giunti aperti
- Transizioni asfalto-lapideo in curva

**Aggravanti ambientali:** pioggia / bagnato

**Segnali premonitori**
- Pietre lucide e riflettenti
- Avvallamenti e ristagni

**Condotta del motociclista**
- Ridurre gli angoli di piega e le decelerazioni richieste
- Frenare in anticipo, prima del lapideo

**Contromisure per gestore e progettista**
- Bocciardatura o fiammatura della superficie
- Rifacimento del sottofondo
- Corsie in asfalto per la percorrenza dei veicoli

**Esito tipico:** Scivolata in frenata o in curva.
  
**Ammaloramenti correlati:** B, I

### U-09 · Buca nascosta dal veicolo che precede

**Natura:** Combinato · **Rischio:** P 4 (alta) × G 3 (media) = 12, elevato

L’auto che precede scavalca una buca facendola passare tra le ruote; la moto, che la segue nella stessa traiettoria centrale, la vede solo quando l’auto la scopre.

> **In sella.** Non seguire l’auto davanti troppo da vicino: le buche che lei scavalca tra le ruote finiscono sotto la tua.

**Dinamica.** L’auto ha carreggiata di 1,5 m e "salta" la buca senza toccarla; la moto ha una sola traccia, spesso proprio al centro della corsia. Una buca di 5-10 cm con bordo vivo produce sull’anteriore un urto che chiude la sospensione e, se la ruota è sterzata o la moto inclinata, la rende ingovernabile. Il tempo di scoperta dipende dalla distanza dal veicolo che precede.

**Cause infrastrutturali** (stato della pavimentazione)
- Buche da fessurazioni ramificate non trattate
- Ripristini di scavi per sottoservizi ceduti
- Buche piene d’acqua indistinguibili dalle pozzanghere

**Cause d’esercizio** (traffico e interferenze)
- Distanza ridotta dal veicolo che precede
- Traffico laterale che impedisce lo scarto

**Combinazione.** Il degrado esiste comunque, ma è il traffico che ne annulla la visibilità e la possibilità di evitarlo.

**Segnali premonitori**
- Veicolo davanti che sobbalza o devia di poco
- Rappezzi e fessure a pelle di coccodrillo nella zona

**Condotta del motociclista**
- Aumentare la distanza per vedere la pavimentazione oltre il veicolo
- Marciare nella traccia delle ruote del veicolo che precede, non al centro

**Contromisure per gestore e progettista**
- Sorveglianza e chiusura tempestiva delle buche
- Ripristini degli scavi a regola d’arte e collaudati

**Esito tipico:** Perdita di controllo per urto sull’anteriore, caduta.
  
**Ammaloramenti correlati:** P, M, Q
  
**Riferimenti:** Tesi Progettazione, Tav. 02 — la buca rende il mezzo ingovernabile

### U-10 · Gasolio e sabbia in rotatoria

**Natura:** Combinato · **Rischio:** P 3 (media) × G 3 (media) = 9, medio

Nella corona della rotatoria la moto è in piega continua; una macchia di gasolio sversato da un mezzo pesante si trova sulla traiettoria.

> **In sella.** In rotatoria tieni sempre un margine di aderenza: il gasolio non si vede, e sopra non esiste una velocità sicura in piega.

**Dinamica.** In rotatoria l’aderenza trasversale impegnata è costante e pari a v²/(gR) (a 35 km/h su R = 20 m vale circa 0,48). Il gasolio porta l’aderenza disponibile intorno a 0,1-0,2: appena le ruote entrano nella macchia la forza laterale necessaria non è più disponibile e la moto scivola verso l’esterno.

**Cause infrastrutturali** (stato della pavimentazione, geometria d’asse)
- Raggi ridotti e pendenza trasversale verso l’esterno della corona
- Pavimentazione chiusa e lucida
- Sabbia e ghiaia accumulate dal traffico in uscita

**Cause d’esercizio** (mezzi pesanti)
- Mezzi pesanti che in rotatoria perdono gasolio dal tappo del serbatoio per l’inclinazione
- Interventi di pulizia con sabbia assorbente non rimossa

**Combinazione.** La rotatoria concentra in un punto sia la causa (l’inclinazione dei mezzi pesanti fa trafilare il gasolio) sia l’effetto (la moto è in piega).

**Segnali premonitori**
- Macchie iridescenti con la pioggia
- Odore di gasolio
- Chiazze di assorbente

**Condotta del motociclista**
- Entrare più lentamente e con margine di aderenza
- Osservare la superficie della corona, non solo i veicoli

**Contromisure per gestore e progettista**
- Pulizia tempestiva con prodotti specifici e rimozione dell’assorbente
- Pavimentazioni ad alta tessitura in corona
- Controlli sui serbatoi dei mezzi pesanti

**Esito tipico:** Scivolata in piega (low-side) e urto contro cordolo o veicoli.

### U-11 · Cordoli, isole e dissuasori a ridosso della traiettoria

**Natura:** Infrastrutturale · **Rischio:** P 2 (bassa) × G 4 (alta) = 8, medio

Cordoli di isole spartitraffico, dissuasori, paletti parapedonali e delimitatori di corsia posti lungo le traiettorie di svolta.

> **In sella.** Di notte, nei restringimenti, non stare attaccato alla mezzeria: le isole spartitraffico compaiono all’ultimo.

**Dinamica.** Il cordolo è un ostacolo per l’autovettura solo se alto; per la moto anche un rilievo modesto genera, all’impatto della ruota, un momento ribaltante (la reazione orizzontale agisce sotto il baricentro posto a h_m > h_a e la base d’appoggio S_m è molto minore di S_a). Dissuasori e paletti diventano ostacoli fissi contro cui il corpo del motociclista urta.

**Cause infrastrutturali** (arredo e margini, geometria d’asse)
- Isole e cordoli poco visibili di notte
- Delimitatori di corsia riservata in rilievo
- Paletti e panettoni sui margini delle svolte

**Cause d’esercizio** (traffico e interferenze)
- Traffico che costringe a traiettorie strette

**Segnali premonitori**
- Delineatori e catarifrangenti sporchi o assenti
- Segni di urti sui cordoli

**Condotta del motociclista**
- Allargare la traiettoria e ridurre la piega in prossimità dei cordoli
- Mai attraversare un cordolo con la moto inclinata

**Contromisure per gestore e progettista**
- Cordoli sormontabili smussati e ben segnalati
- Eliminazione dei dissuasori non necessari
- Illuminazione delle isole

**Esito tipico:** Caduta per urto della ruota, impatto contro elementi rigidi.
  
**Riferimenti:** Tesi Progettazione, Tav. 02 — cordoli: h_m > h_a, S_m ≪ S_a

### U-12 · Filtraggio tra le file e cambio di corsia improvviso ⚠ fuori norma

**Natura:** D’esercizio · **Rischio:** P 4 (alta) × G 2 (bassa) = 8, medio

La moto avanza tra due file di veicoli in coda; un’auto cambia corsia o esce dalla fila per un’inversione o per entrare in un parcheggio.

> **In sella.** Se avanzi tra le file, non superare di più di 15-20 km/h la velocità della coda e guarda i varchi: è lì che qualcuno si sposta.

> ⚠ **Marcia tra le file di veicoli incolonnati e sorpasso a destra.** Pratica diffusa ma non ammessa dal CdS; lo scenario ne quantifica il rischio in funzione del differenziale di velocità.

**Dinamica.** Il rischio cresce con il differenziale di velocità tra moto e coda: l’auto che si sposta lateralmente di 0,5 m chiude il varco in circa un secondo, e lo spazio disponibile per la moto è la distanza a cui si trova in quel momento. Con 20 km/h di differenza la moto percorre 5,6 m al secondo, con 40 km/h 11 m.

**Cause infrastrutturali** (geometria d’asse)
- Corsie strette (varco tra le file inferiore a 1 m)
- Accessi, parcheggi e inversioni lungo il viale

**Cause d’esercizio** (rallentamenti e code, traffico e interferenze)
- Code a velocità variabile
- Conducenti che non controllano lo specchietto prima di spostarsi

**Segnali premonitori**
- Varco che si apre davanti a un’auto (spazio per cambiare corsia)
- Ruote anteriori che ruotano
- Indicatore di direzione o conducente che guarda lo specchietto

**Condotta del motociclista**
- Limitare il differenziale di velocità rispetto alla coda
- Massima attenzione dove la coda opposta o laterale ha varchi
- Non affiancarsi a veicoli alti

**Contromisure per gestore e progettista**
- Corsie di larghezza costante
- Spazi d’attesa avanzati per le moto ai semafori

**Esito tipico:** Urto laterale, caduta e investimento da parte dei veicoli in coda.

### U-13 · Svolta a destra che taglia la moto ⚠ fuori norma

**Natura:** D’esercizio · **Rischio:** P 3 (media) × G 3 (media) = 9, medio

La moto supera a destra una colonna lenta o percorre la corsia riservata; un veicolo svolta a destra in un passo carrabile o in una laterale.

> **In sella.** Non superare a destra vicino ad accessi e laterali: chi svolta non ti aspetta lì.

> ⚠ **Sorpasso a destra di veicoli in marcia o transito in corsia riservata.** La moto si trova in una posizione in cui chi svolta non la attende.

**Dinamica.** Chi svolta controlla lo specchietto prima di iniziare la manovra e non si aspetta un veicolo veloce sul lato destro: il conflitto avviene a distanza brevissima e l’unica difesa è la velocità ridotta.

**Cause infrastrutturali** (geometria d’asse)
- Corsie riservate che corrono a destra dei veicoli in svolta
- Accessi frequenti

**Cause d’esercizio** (traffico e interferenze)
- Colonna lenta
- Svolte senza indicatore

**Segnali premonitori**
- Rallentamento del veicolo davanti senza motivo apparente
- Laterale o accesso a destra

**Condotta del motociclista**
- Evitare di superare a destra in prossimità di accessi
- Velocità simile a quella della colonna

**Contromisure per gestore e progettista**
- Interruzione della corsia riservata con attestamento prima delle svolte
- Segnaletica dei passi carrabili

**Esito tipico:** Urto contro la fiancata destra del veicolo in svolta.

### U-14 · Angolo cieco dei mezzi pesanti in svolta

**Natura:** D’esercizio · **Rischio:** P 2 (bassa) × G 5 (molto alta) = 10, elevato

Un camion o un autobus svolta a destra; la moto ferma o in marcia alla sua destra è nell’angolo cieco e nella zona spazzata dal semirimorchio.

> **In sella.** Mai alla destra di un camion o di un autobus fermo al semaforo: resta dietro, dove l’autista ti vede.

**Dinamica.** In svolta il semirimorchio percorre un arco più interno della motrice (offtracking): la zona tra la ruota posteriore e il marciapiede si chiude. La moto non è visibile dagli specchi della motrice.

**Cause infrastrutturali** (geometria d’asse)
- Raggi di svolta stretti che obbligano il mezzo ad allargarsi prima
- Linee di arresto senza spazio avanzato per le moto

**Cause d’esercizio** (mezzi pesanti)
- Mezzi pesanti nel traffico urbano

**Segnali premonitori**
- Mezzo pesante che si sposta a sinistra prima di una svolta a destra
- Specchi della motrice in cui non si vede il volto del conducente

**Condotta del motociclista**
- Non posizionarsi mai alla destra di un mezzo pesante ai semafori
- Restare dietro e visibili negli specchi

**Contromisure per gestore e progettista**
- Case avanzate per moto e bici
- Specchi e sensori per angolo cieco sui mezzi
- Raggi di svolta adeguati

**Esito tipico:** Schiacciamento o investimento da parte del mezzo pesante.

### U-15 · Dossi artificiali e attraversamenti rialzati

**Natura:** Infrastrutturale · **Rischio:** P 2 (bassa) × G 3 (media) = 6, medio

Rallentatori di altezza o rampa non conforme, non segnalati o posti in curva; di notte poco visibili.

> **In sella.** In città aspettati dossi anche dove non dovrebbero esserci: in curva e di notte rallenta.

**Dinamica.** Il dosso provoca una brusca compressione e successiva estensione delle sospensioni: se la moto è inclinata o in frenata, la variazione di carico verticale riduce l’aderenza disponibile nell’istante di estensione. A velocità elevata la ruota anteriore può staccarsi dal suolo.

**Cause infrastrutturali** (arredo e margini, geometria d’asse, visibilità)
- Dossi fuori norma o in curva
- Segnaletica orizzontale scolorita
- Assenza di illuminazione

**Aggravanti ambientali:** notte

**Segnali premonitori**
- Cartello di dosso
- Rallentamento dei veicoli che precedono

**Condotta del motociclista**
- Superare il dosso in posizione verticale, senza frenare

**Contromisure per gestore e progettista**
- Dossi conformi al regolamento, mai in curva
- Cuscini con varchi e segnaletica ad alta visibilità

**Esito tipico:** Perdita di controllo e caduta.

### U-16 · Contrasti di luminanza: sole radente, ombre, fari

**Natura:** Combinato · **Rischio:** P 3 (media) × G 4 (alta) = 12, elevato

Sole basso su viali orientati est-ovest, alternanza di ombre di alberature e luce, illuminazione pubblica disomogenea.

> **In sella.** Col sole basso alle spalle sei invisibile a chi ti viene incontro: rallenta agli incroci e fatti vedere.

**Dinamica.** L’occhio impiega tempo ad adattarsi ai salti di luminanza: in quell’intervallo il tempo di percezione cresce. La moto, sagoma stretta con un solo faro, scompare nel controluce per chi la deve vedere.

**Cause infrastrutturali** (visibilità)
- Orientamento degli assi viari
- Alberature fitte che alternano zone d’ombra umide
- Punti luce distanti o guasti

**Cause d’esercizio** (traffico e interferenze)
- Veicoli antagonisti che non distinguono la moto nel controluce

**Combinazione.** La condizione luminosa della strada amplifica l’errore di percezione degli altri utenti (vedi U-01).

**Aggravanti ambientali:** abbagliamento, notte

**Segnali premonitori**
- Sole basso alle spalle (gli altri non vi vedono) o di fronte (voi non vedete)

**Condotta del motociclista**
- Ridurre la velocità nelle transizioni luce-ombra
- Visiera pulita e fari accesi

**Contromisure per gestore e progettista**
- Illuminazione uniforme
- Potatura delle alberature in corrispondenza delle intersezioni

**Esito tipico:** Mancata percezione reciproca nelle intersezioni.

### U-17 · Contaminanti: foglie, fango di cantiere, olio ai semafori

**Natura:** Combinato · **Rischio:** P 3 (media) × G 2 (bassa) = 6, medio

Strati di foglie bagnate in autunno, fango in uscita dai cantieri, centro corsia lucido d’olio nelle zone di attesa dei semafori.

> **In sella.** Fermandoti al semaforo frena nella traccia delle ruote, non al centro della corsia dove c’è l’olio.

**Dinamica.** Il contaminante si interpone tra pneumatico e tessitura: l’aderenza dipende dal materiale (foglie bagnate ≈ 0,2, fango ≈ 0,25). Le gocce d’olio si accumulano dove i veicoli sostano a motore acceso: proprio dove la moto frena per fermarsi e riparte in piega.

**Cause infrastrutturali** (stato della pavimentazione)
- Assenza di pulizia stagionale
- Uscite di cantiere senza lavaruote

**Cause d’esercizio** (traffico e interferenze, mezzi pesanti)
- Veicoli in coda ai semafori
- Mezzi d’opera

**Combinazione.** Il traffico deposita il contaminante, la manutenzione carente lo lascia sulla strada.

**Aggravanti ambientali:** pioggia / bagnato

**Segnali premonitori**
- Striscia scura al centro della corsia
- Tracce di fango dagli accessi
- Foglie accumulate ai margini

**Condotta del motociclista**
- Frenare e ripartire nelle tracce delle ruote dei veicoli, non al centro della corsia

**Contromisure per gestore e progettista**
- Spazzamento programmato
- Obbligo di lavaruote nei cantieri

**Esito tipico:** Scivolata in frenata o in partenza.
  
**Ammaloramenti correlati:** O

### U-18 · Viale a scorrimento percorso oltre il limite ⚠ fuori norma

**Natura:** Combinato · **Rischio:** P 3 (media) × G 5 (molto alta) = 15, elevato

Un’auto esce da una laterale quando la moto è a una distanza che sarebbe sufficiente a 50 km/h, ma la moto procede molto più veloce.

> **In sella.** Sui viali larghi la velocità sale da sola, ma chi si immette ti valuta come se andassi a 50 km/h.

> ⚠ **Velocità superiore al limite (es. 80-90 km/h dove vige il limite di 50 km/h).** Chi si immette valuta l’intervallo come se la moto procedesse al limite: lo scenario mostra quanto rapidamente l’intervallo diventa insufficiente.

**Dinamica.** Lo spazio d’arresto cresce con il quadrato della velocità: con τ = 1 s e decelerazione 0,6 g servono circa 30 m a 50 km/h, 64 m a 80 km/h e 78 m a 90 km/h. L’intervallo accettato da chi si immette resta invece quello tarato sui 50 km/h.

**Cause infrastrutturali** (visibilità, geometria d’asse)
- Viali larghi e rettilinei che inducono velocità superiori al limite
- Laterali e accessi frequenti

**Cause d’esercizio** (traffico e interferenze)
- Accettazione di intervalli brevi da parte di chi si immette

**Combinazione.** La geometria "da extraurbana" induce la velocità, la frequenza di immissioni la rende pericolosa.

**Segnali premonitori**
- Veicoli fermi allo stop di laterali
- Accessi a centri commerciali

**Condotta del motociclista**
- Velocità coerente con la densità di intersezioni, non con la larghezza della strada

**Contromisure per gestore e progettista**
- Restringimenti ottici, alberature e attraversamenti che riportino la velocità di progetto
- Controllo della velocità

**Esito tipico:** Urto contro il veicolo in immissione ad alta velocità residua.

## Contesto extraurbano

Interferenze limitate, marcia continua a velocità elevata, geometria d’asse determinante (curve, raccordi, pendenze), margini con alberi, pali, barriere e accessi non pavimentati.

### Scenari infrastrutturali

- [E-02](#e-02--curva-a-raggio-decrescente-dopo-un-lungo-rettifilo) Curva a raggio decrescente dopo un lungo rettifilo ⚠
- [E-05](#e-05--ghiaia-alla-corda-di-una-curva) Ghiaia alla corda di una curva
- [E-06](#e-06--impatto-contro-guardrail-e-paletti-dopo-la-scivolata) Impatto contro guard-rail e paletti dopo la scivolata
- [E-07](#e-07--alberi-pali-e-muretti-al-margine) Alberi, pali e muretti al margine
- [E-10](#e-10--sigillature-bituminose-e-rappezzi-in-curva) Sigillature bituminose e rappezzi in curva
- [E-18](#e-18--accelerazione-tra-due-curve-la-velocità-oltre-quella-di-progetto) Accelerazione tra due curve: la velocità oltre quella di progetto ⚠

### Scenari combinati

- [E-01](#e-01--ostacolo-oltre-una-curva-cieca-in-trincea) Ostacolo oltre una curva cieca in trincea
- [E-03](#e-03--curva-in-discesa-con-frenata-in-piega) Curva in discesa con frenata in piega
- [E-04](#e-04--veicolo-fermo-oltre-un-dosso) Veicolo fermo oltre un dosso
- [E-08](#e-08--ormaie-con-pioggia-aquaplaning-e-marcia-a-binario) Ormaie con pioggia: aquaplaning e marcia a binario
- [E-09](#e-09--inerti-lucidati-e-prima-pioggia) Inerti lucidati e prima pioggia
- [E-11](#e-11--sorpasso-della-colonna-e-svolta-a-sinistra-del-veicolo-sorpassato) Sorpasso della colonna e svolta a sinistra del veicolo sorpassato ⚠
- [E-12](#e-12--mezzo-pesante-che-taglia-la-curva-sinistrorsa) Mezzo pesante che taglia la curva sinistrorsa
- [E-13](#e-13--immissione-da-accesso-privato-su-rettifilo-veloce) Immissione da accesso privato su rettifilo veloce
- [E-14](#e-14--curva-di-notte-il-faro-illumina-lesterno) Curva di notte: il faro illumina l’esterno
- [E-15](#e-15--vento-laterale-e-onda-durto-dei-mezzi-pesanti-incrociati) Vento laterale e onda d’urto dei mezzi pesanti incrociati
- [E-16](#e-16--galleria-buco-nero-allingresso-e-abbagliamento-alluscita) Galleria: buco nero all’ingresso e abbagliamento all’uscita
- [E-17](#e-17--cantiere-fresato-gradini-e-segnaletica-provvisoria) Cantiere: fresato, gradini e segnaletica provvisoria

### E-01 · Ostacolo oltre una curva cieca in trincea

**Natura:** Combinato · **Rischio:** P 3 (media) × G 4 (alta) = 12, elevato

Curva destrorsa con scarpata o vegetazione sul lato interno; oltre la curva c’è un veicolo fermo, un mezzo agricolo lento o un animale.

> **In sella.** In una curva cieca vai alla velocità che ti permette di fermarti entro ciò che vedi, e non stringere la corda.

**Dinamica.** La visuale libera in curva vale D = 2R·arccos(1 − m/R), dove m è la distanza tra l’occhio e l’ostacolo laterale. In curva destrorsa il motociclista percorre la parte interna della corsia, più vicino al ciglio, e in piega abbassa il punto di vista: m si riduce e con esso D (Tav. 07). Con R = 120 m: m = 2,75 m (auto al centro corsia) dà D ≈ 51 m, m = 2,0 m (moto all’interno) dà D ≈ 44 m, mentre a 70 km/h servono circa 52 m per fermarsi. In più, in piega parte dell’aderenza è già impegnata trasversalmente (ellisse di aderenza).

**Cause infrastrutturali** (visibilità, geometria d’asse)
- Curva in trincea senza arretramento della scarpata
- Vegetazione non sfalciata sul ciglio interno
- Raggio planimetrico dimensionato sul punto di vista dell’autovettura (1,10 m al centro corsia)

**Cause d’esercizio** (traffico e interferenze)
- Veicoli lenti o fermi (mezzi agricoli, guasti, code)
- Animali in attraversamento

**Combinazione.** Né la curva né il veicolo lento sono di per sé pericolosi: lo diventano quando la visuale libera è inferiore allo spazio d’arresto della moto in piega.

**Segnali premonitori**
- Scarpata o siepe che chiude l’interno della curva
- Accessi agricoli e strade bianche nelle vicinanze
- Tracce di fango sulla carreggiata

**Condotta del motociclista**
- Tenere una velocità che consenta l’arresto entro la porzione di strada visibile
- In curva destrorsa non stringere troppo la corda: la posizione esterna allunga la visuale
- Ridurre la piega prima di frenare forte

**Contromisure per gestore e progettista**
- Arretramento della scarpata e abbassamento del banchettone (Tav. 07)
- Sfalcio programmato del ciglio interno
- Verifica di visibilità con il punto di vista del motociclista in piega

**Esito tipico:** Tamponamento dell’ostacolo o uscita di strada nel tentativo di evitarlo.
  
**Riferimenti:** Tesi Progettazione, Tav. 06 — visuale libera ≥ distanza di arresto; Tesi Progettazione, Tav. 07 — posizione del punto di vista e arretramento della scarpata

### E-02 · Curva a raggio decrescente dopo un lungo rettifilo ⚠ fuori norma

**Natura:** Infrastrutturale · **Rischio:** P 3 (media) × G 4 (alta) = 12, elevato

Dopo un rettifilo veloce la curva si chiude progressivamente (raggio decrescente o curva composta senza adeguata transizione); la moto entra a una velocità adatta al primo raggio, non all’ultimo.

> **In sella.** Regola la velocità sul punto più stretto della curva, non sull’ingresso.

> ⚠ **Velocità superiore al limite in ingresso curva.** La simulazione permette di confrontare la percorrenza al limite e oltre il limite.

**Dinamica.** L’aderenza trasversale impegnata cresce come v²/(gR): a 90 km/h passa da 0,32 con R = 200 m a 0,80 con R = 80 m (piega da 18° a 39°). Se la richiesta supera l’aderenza disponibile la moto allarga la traiettoria; frenare in piega consuma ulteriore aderenza (ellisse) e raddrizza la moto, allargando ancora.

**Cause infrastrutturali** (geometria d’asse, visibilità)
- Successione di raggi incoerenti rispetto al rettifilo precedente
- Curve di transizione assenti o troppo brevi per la manovra di rollio della moto (Tav. 05)
- Uscita di curva non visibile all’ingresso
- Norme che assumono coefficienti di aderenza trasversale tarati sull’autovettura (Tav. 10)

**Segnali premonitori**
- Delineatori o pali che convergono verso l’interno
- Segnaletica di curva pericolosa ripetuta
- Guard-rail dell’esterno curva che "si chiude"

**Condotta del motociclista**
- Regolare la velocità sul punto più stretto, non sull’ingresso
- Guardare l’uscita, non l’ostacolo
- Mantenere un margine di aderenza per correggere

**Contromisure per gestore e progettista**
- Rettifica della successione dei raggi
- Curve di transizione dimensionate anche sul tempo di rollio della moto
- Segnaletica a frecce progressive e delineatori modulari

**Esito tipico:** Uscita di traiettoria verso l’esterno: invasione della corsia opposta o urto contro la barriera.
  
**Riferimenti:** Tesi Progettazione, Tav. 03 — inclinazione in funzione di velocità e raggio; Tesi Progettazione, Tav. 10 — aderenza trasversale impegnata moto/auto

### E-03 · Curva in discesa con frenata in piega

**Natura:** Combinato · **Rischio:** P 3 (media) × G 4 (alta) = 12, elevato

Discesa con pendenza elevata che termina in curva; la moto deve rallentare per un veicolo lento a metà curva.

> **In sella.** In discesa frena in rettilineo, prima della curva: in piega la frenata disponibile è poca e la pendenza te ne toglie altra.

**Dinamica.** In discesa la componente del peso parallela alla strada si somma alla forza d’inerzia: l’aderenza impegnata cresce, e la tesi mostra che con pendenza del 5% in discesa l’aderenza impegnata supera quella disponibile per un ampio campo di raggi (Tav. 16). Frenare in piega somma la componente longitudinale a quella trasversale: la risultante esce dall’ellisse di aderenza.

**Cause infrastrutturali** (geometria d’asse)
- Raggi dimensionati con gli stessi coefficienti di aderenza per salita, piano e discesa
- Pendenza longitudinale elevata in combinazione con curva stretta

**Cause d’esercizio** (traffico e interferenze)
- Veicolo lento in curva
- Code in uscita dalla discesa

**Combinazione.** La geometria consuma il margine di aderenza, il traffico chiede di usarlo tutto in frenata.

**Segnali premonitori**
- Cartello di discesa pericolosa
- Raggio che si chiude al termine della discesa

**Condotta del motociclista**
- Rallentare in rettilineo prima della curva
- In curva modulare il freno anteriore e posteriore, raddrizzando prima di frenare forte

**Contromisure per gestore e progettista**
- Coefficienti di aderenza variabili con la pendenza (Tav. 12)
- Aumento dei raggi nei tratti in discesa (Tav. 17)

**Esito tipico:** Caduta per perdita di aderenza in frenata o uscita di strada.
  
**Riferimenti:** Tesi Progettazione, Tav. 12 — contributo delle pendenze trasversale e longitudinale; Tesi Progettazione, Tav. 16-17 — confronto aderenza impegnata e disponibile

### E-04 · Veicolo fermo oltre un dosso

**Natura:** Combinato · **Rischio:** P 2 (bassa) × G 4 (alta) = 8, medio

Su una strada secondaria con raccordi verticali stretti, un’auto è ferma subito dopo il dosso in attesa di svoltare a sinistra.

> **In sella.** Prima di un dosso preparati a frenare: dall’altra parte può esserci un’auto ferma.

**Dinamica.** Su un raccordo convesso la visuale vale D = √(2Rv)·(√h1 + √h2). Con Rv = 600 m, occhio a 1,3 m e tetto dell’auto a 1,4 m, D ≈ 80 m: a 90 km/h, con τ = 1 s e frenata a 0,6 g, servono già 78 m. Se l’ostacolo è basso (un oggetto, un animale, un motociclista caduto) D si riduce molto.

**Cause infrastrutturali** (visibilità, geometria d’asse)
- Raccordi verticali di raggio ridotto su strade di vecchia costruzione
- Intersezioni e accessi subito dopo il dosso
- Assenza di corsia di svolta

**Cause d’esercizio** (traffico e interferenze)
- Veicolo fermo in attesa di svolta
- Velocità sostenuta su rettifili ondulati

**Combinazione.** L’intersezione dietro il dosso è un difetto di coordinamento che il traffico trasforma in ostacolo.

**Segnali premonitori**
- Profilo ondulato
- Cartelli di intersezione o accessi segnalati
- Pali e alberi che "spariscono" oltre il colmo

**Condotta del motociclista**
- Avvicinarsi al colmo pronti a frenare
- Non sorpassare in prossimità di un dosso

**Contromisure per gestore e progettista**
- Allargamento dei raccordi convessi
- Corsie di svolta e preavvisi
- Divieto di sorpasso con segnaletica orizzontale

**Esito tipico:** Tamponamento del veicolo fermo.
  
**Riferimenti:** Tesi Progettazione, Tav. 07 — dimensionamento dei raccordi convessi e abbassamento del punto di vista

### E-05 · Ghiaia alla corda di una curva

**Natura:** Infrastrutturale · **Rischio:** P 3 (media) × G 4 (alta) = 12, elevato

Ghiaia e terriccio trascinati da un accesso non pavimentato o dalla banchina si accumulano all’interno della curva, dove passa la moto in piega.

> **In sella.** Nelle curve con accessi sterrati non stringere la corda: è lì che si accumula la ghiaia.

**Dinamica.** A 60 km/h su R = 60 m la piega è di circa 25° e l’aderenza trasversale impegnata vale 0,47. La ghiaia offre circa 0,4: la ruota scivola lateralmente, la moto cade sul fianco e motociclista e veicolo proseguono lungo la tangente fino all’ostacolo, con un angolo d’impatto θ = arccos(R/(R+b)).

**Cause infrastrutturali** (stato della pavimentazione, arredo e margini)
- Accessi agricoli e strade bianche non pavimentati per un tratto adeguato
- Banchine non pavimentate all’interno curva
- Sgranatura e disgregazione dello strato d’usura

**Cause d’esercizio** (traffico e interferenze)
- Veicoli che tagliano la curva e trascinano materiale dalla banchina

**Segnali premonitori**
- Bordo della carreggiata polveroso
- Accessi sterrati nella curva
- Ghiaia visibile sulla linea di margine

**Condotta del motociclista**
- Percorrere la curva con margine di aderenza e senza stringere la corda
- Se si attraversa la ghiaia: moto il più verticale possibile, gas costante, nessuna frenata

**Contromisure per gestore e progettista**
- Pavimentazione degli accessi per almeno 20-30 m
- Spazzamento dopo eventi meteorici
- Banchine pavimentate

**Esito tipico:** Scivolata (low-side) e impatto contro barriera o ostacolo esterno.
  
**Ammaloramenti correlati:** C, D

### E-06 · Impatto contro guard-rail e paletti dopo la scivolata

**Natura:** Infrastrutturale · **Rischio:** P 2 (bassa) × G 5 (molto alta) = 10, elevato

Dopo una perdita di aderenza in curva il motociclista scivola a terra verso la barriera di sicurezza esterna.

> **In sella.** Dove c’è un guard-rail a paletti tieni ancora più margine: in caso di scivolata è contro i paletti che arrivi.

**Dinamica.** Le barriere sono progettate per contenere autovetture e mezzi pesanti (classi da N1, 44 kJ, a H4, 572 kJ) mentre l’energia d’impatto del motociclista è dell’ordine di 5 kJ. Il corpo scivola sotto la lama e incontra i paletti: elementi sagomati e taglienti concentrano la forza su piccole superfici. Gli HIC misurati sono 800-1800 sulla lama e oltre 2000 sul paletto, contro 132 di una barriera con protezione continua.

**Cause infrastrutturali** (arredo e margini)
- Barriere a lama e paletto prive di dispositivo di protezione per motociclisti
- Paletti a profilo aperto e spigoli vivi
- Barriere troppo vicine al ciglio della carreggiata

**Segnali premonitori**
- Curve con barriera sull’esterno e segni di urti precedenti

**Condotta del motociclista**
- In caso di caduta, se possibile, non rialzarsi prima di essersi fermati e cercare di arrivare all’ostacolo con i piedi

**Contromisure per gestore e progettista**
- Dispositivi salva-motociclisti (DSM) continui nelle curve a rischio
- Paletti protetti
- Allontanamento della barriera e zona di recupero

**Esito tipico:** Lesioni gravi e mortali per impatto contro i paletti di sostegno.
  
**Riferimenti:** Tesi Progettazione, Tav. 02 — barriere: lamiere sagomate prive di elementi di protezione; Tesi Progettazione, Tav. 18 — soluzioni tecnologiche per le barriere, HIC

### E-07 · Alberi, pali e muretti al margine

**Natura:** Infrastrutturale · **Rischio:** P 2 (bassa) × G 5 (molto alta) = 10, elevato

Filari alberati, pali dell’illuminazione o delle linee elettriche, muretti e cartelloni entro pochi metri dal ciglio, senza zona libera né protezione.

> **In sella.** Sui viali alberati non c’è spazio per sbagliare: entra in curva più lento e con margine di piega.

**Dinamica.** Qualunque uscita di traiettoria, anche a bassa energia, termina contro un ostacolo puntuale e rigido. La gravità dipende dall’energia residua all’impatto: con μ ≈ 0,6 per il corpo che scivola su asfalto, da 80 km/h servono circa 42 m per dissipare tutta l’energia.

**Cause infrastrutturali** (arredo e margini)
- Filari storici a ridosso della carreggiata
- Pali e sostegni rigidi entro la zona libera
- Muri di contenimento con testate non protette

**Segnali premonitori**
- Ostacoli continui sull’esterno delle curve

**Condotta del motociclista**
- Ridurre la velocità dove non esiste spazio di recupero

**Contromisure per gestore e progettista**
- Zona libera da ostacoli (clear zone)
- Pali a rottura prestabilita
- Protezione degli ostacoli con attenuatori

**Esito tipico:** Impatto contro ostacolo fisso.

### E-08 · Ormaie con pioggia: aquaplaning e marcia a binario

**Natura:** Combinato · **Rischio:** P 3 (media) × G 4 (alta) = 12, elevato

Ormaie profonde nelle tracce delle ruote dei mezzi pesanti si riempiono d’acqua; la moto le percorre o le attraversa per sorpassare.

> **In sella.** Con la pioggia stai sul dorso tra le ormaie e sotto i 70 km/h; per sorpassare cambia corsia con decisione, a moto dritta.

**Dinamica.** Il velo idrico nell’ormaia vale h_g(x) = h − (h/b²)x². Dove supera l’altezza critica h_crit(V) l’impronta perde il contatto con la pavimentazione. La probabilità di interessare quella fascia è P_h,l = ∫ f(x) dx tra ±x_crit, con x_crit = b·√((h − h_crit)/h). Con h = 15 mm, b = 0,4 m e V = 80 km/h (h_crit ≈ 12 mm) la fascia critica è larga 36 cm. In più, uscire dall’ormaia con angolo radente produce coppie che deviano la ruota.

**Cause infrastrutturali** (stato della pavimentazione)
- Conglomerati con eccesso di legante o di vuoti, strati sottodimensionati, cedimenti del sottofondo (cause delle ormaie, §IV.4)
- Pendenza trasversale insufficiente a smaltire l’acqua

**Cause d’esercizio** (mezzi pesanti, traffico e interferenze)
- Transito ripetuto di carichi pesanti
- Canalizzazione del traffico nelle stesse tracce

**Combinazione.** I mezzi pesanti generano l’ormaia, la pioggia la riempie, la moto è il veicolo che ne risente di più per l’impronta singola e stretta.

**Aggravanti ambientali:** pioggia / bagnato

**Segnali premonitori**
- Strisce d’acqua parallele lucide nelle tracce delle ruote
- Spruzzi più alti dei veicoli che precedono

**Condotta del motociclista**
- Marciare fuori dalle tracce, sul "dorso" tra le ormaie
- Cambiare corsia con un angolo deciso, moto verticale, senza frenare
- Ridurre la velocità per alzare h_crit

**Contromisure per gestore e progettista**
- Programmazione degli interventi con priorità basata sul rischio P·G (Tesi Manutenzione)
- Fresatura e ricostruzione degli strati con miscele idonee
- Pavimentazioni drenanti

**Esito tipico:** Perdita di aderenza e di direzionalità, scivolata.
  
**Ammaloramenti correlati:** F, G
  
**Riferimenti:** Tesi Manutenzione, Cap. IV — il caso studio: le ormaie

### E-09 · Inerti lucidati e prima pioggia

**Natura:** Combinato · **Rischio:** P 3 (media) × G 3 (media) = 9, medio

Uno strato d’usura con inerti lucidati, magari con trasudo di bitume, bagnato dai primi minuti di pioggia dopo un periodo secco.

> **In sella.** Nei primi minuti di pioggia raddoppia le distanze: l’asfalto lucidato è più scivoloso che durante un temporale.

**Dinamica.** La microtessitura governa l’aderenza su asciutto, la macrotessitura il drenaggio su bagnato. Con inerti lucidati la riduzione dell’aderenza (40-60%) allunga lo spazio di frenatura in proporzione alla diffusione del degrado (Fig. III.6): a 70 km/h si passa da circa 60 m a quasi 150 m nel caso peggiore. La prima pioggia emulsiona polvere, gomma e oli, peggiorando ulteriormente.

**Cause infrastrutturali** (stato della pavimentazione)
- Inerti di natura calcarea o tenera
- Strato d’usura a fine vita
- Trasudo nelle tracce delle ruote

**Cause d’esercizio** (traffico e interferenze)
- Traffico che lucida le tracce delle ruote
- Frenate in curva e in prossimità delle intersezioni

**Combinazione.** Il traffico produce la lucidatura e richiede le frenate nei punti più lucidati.

**Aggravanti ambientali:** pioggia / bagnato, temperatura

**Segnali premonitori**
- Superficie riflettente nelle tracce delle ruote
- Pioggia dopo giorni secchi
- Odore di asfalto caldo e superficie appiccicosa d’estate

**Condotta del motociclista**
- Raddoppiare le distanze nei primi minuti di pioggia
- Evitare le tracce lucide

**Contromisure per gestore e progettista**
- Monitoraggio della resistenza allo slittamento (SCRIM)
- Trattamenti di irruvidimento
- Rifacimento con inerti duri

**Esito tipico:** Allungamento degli spazi di frenatura, tamponamenti, scivolate in curva.
  
**Ammaloramenti correlati:** A, B
  
**Riferimenti:** Tesi Manutenzione, §III.3 — Fig. III.5-III.6, spazi d’arresto in funzione della lucidatura

### E-10 · Sigillature bituminose e rappezzi in curva

**Natura:** Infrastrutturale · **Rischio:** P 2 (bassa) × G 3 (media) = 6, medio

Fessure sigillate con mastice bituminoso ("serpentoni") e rappezzi a freddo sulla traiettoria in piega.

> **In sella.** D’estate le strisce nere di bitume nelle curve scivolano: riduci la piega quando ci passi sopra.

**Dinamica.** Il mastice è liscio e col caldo si ammorbidisce: in piega lo pneumatico scivola per qualche centimetro su ogni striscia, provocando piccole perdite di aderenza ripetute. Con il bagnato l’effetto si somma alla ridotta tessitura.

**Cause infrastrutturali** (stato della pavimentazione)
- Manutenzione conservativa con sigillature estese
- Rappezzi con materiali di aderenza diversa
- Fessure longitudinali sulla traiettoria

**Aggravanti ambientali:** temperatura, pioggia / bagnato

**Segnali premonitori**
- Strisce nere lucide sulla carreggiata
- Rappezzi di colore diverso

**Condotta del motociclista**
- Ridurre la piega dove la superficie è sigillata
- Attraversare le strisce con moto il più verticale possibile

**Contromisure per gestore e progettista**
- Sigillanti con inerti antiscivolo
- Rifacimento dello strato d’usura invece di interventi puntuali estesi

**Esito tipico:** Scivolate in piega, soprattutto in estate.
  
**Ammaloramenti correlati:** J, K, M, Q

### E-11 · Sorpasso della colonna e svolta a sinistra del veicolo sorpassato ⚠ fuori norma

**Natura:** Combinato · **Rischio:** P 3 (media) × G 5 (molto alta) = 15, elevato

La moto sorpassa una colonna; il primo veicolo svolta a sinistra in un accesso laterale senza vedere la moto che sopraggiunge.

> **In sella.** Sorpassa un veicolo alla volta e mai vicino ad accessi e incroci a sinistra.

> ⚠ **Sorpasso di più veicoli in prossimità di un’intersezione o di un accesso.** Manovra vietata in prossimità delle intersezioni; frequente per la facilità di sorpasso della moto (rapporto peso/potenza).

**Dinamica.** La moto in sorpasso, vicina all’asse, è nascosta dai veicoli della colonna; chi svolta controlla lo specchietto con anticipo e poi non più. Il punto di conflitto è sul lato sinistro, dove la moto non ha via di fuga (corsia opposta e margine).

**Cause infrastrutturali** (visibilità, geometria d’asse)
- Accessi privati e laterali non segnalati lungo rettifili favorevoli al sorpasso
- Segnaletica orizzontale che consente il sorpasso in prossimità degli accessi

**Cause d’esercizio** (traffico e interferenze)
- Colonne dietro veicoli lenti
- Svolte senza indicatore o con indicatore tardivo

**Combinazione.** Il rettifilo invita al sorpasso, l’accesso laterale lo rende pericoloso, la colonna nasconde la moto.

**Segnali premonitori**
- Veicolo in testa alla colonna che rallenta senza motivo
- Accessi, cassette postali, strade bianche a sinistra

**Condotta del motociclista**
- Sorpassare un veicolo alla volta
- Non sorpassare vicino ad accessi e intersezioni

**Contromisure per gestore e progettista**
- Linea continua in prossimità degli accessi
- Riorganizzazione degli accessi su strade di servizio

**Esito tipico:** Urto contro la fiancata sinistra del veicolo in svolta.
  
**Riferimenti:** Tesi Progettazione, Tav. 04 — distanza di visibilità per il sorpasso

### E-12 · Mezzo pesante che taglia la curva sinistrorsa

**Natura:** Combinato · **Rischio:** P 2 (bassa) × G 5 (molto alta) = 10, elevato

In una curva stretta un autoarticolato occupa parte della corsia opposta; la moto percorre la curva sinistrorsa vicino all’asse.

> **In sella.** In una curva sinistrorsa cieca stai al centro della corsia: in piega la tua testa sporge verso chi arriva.

**Dinamica.** Per vedere meglio e per la traiettoria ideale la moto in curva sinistrorsa sta vicino alla mezzeria. In piega il capo del pilota sporge oltre la linea delle ruote di circa h·sin γ (1,5 m × sin 35° ≈ 0,86 m): l’ingombro dinamico invade la corsia opposta anche quando le ruote sono nella propria. L’autoarticolato, per l’ingombro in curva del semirimorchio, si allarga verso l’asse.

**Cause infrastrutturali** (geometria d’asse, visibilità)
- Corsie strette e assenza di allargamento in curva
- Visibilità ridotta sulla corsia opposta

**Cause d’esercizio** (mezzi pesanti)
- Mezzi pesanti su strade secondarie
- Autovetture che tagliano le curve

**Combinazione.** La geometria obbliga il mezzo pesante a invadere, la posizione della moto in piega la porta verso l’asse.

**Segnali premonitori**
- Rumore o luci del mezzo pesante prima della curva
- Assenza di allargamento in curva

**Condotta del motociclista**
- In curva sinistrorsa cieca tenere una posizione più centrale nella corsia
- Ridurre la piega per ridurre l’ingombro laterale

**Contromisure per gestore e progettista**
- Allargamenti in curva
- Separatori di corsia o linee doppie in curva
- Limitazioni al transito dei mezzi pesanti

**Esito tipico:** Urto frontale o urto del capo contro il mezzo che sopraggiunge.

### E-13 · Immissione da accesso privato su rettifilo veloce

**Natura:** Combinato · **Rischio:** P 3 (media) × G 5 (molto alta) = 15, elevato

Un veicolo esce da un accesso laterale nascosto dalla vegetazione su un rettifilo dove la moto procede a 90 km/h.

> **In sella.** Dove ci sono accessi nascosti dalle siepi rallenta: chi esce sottovaluta la tua velocità.

**Dinamica.** Chi si immette giudica l’intervallo sui veicoli a quattro ruote e tende a sottostimare la velocità della moto. Inoltre la moto accelera di più (2 m/s² contro 0,8 m/s² assunti dalla norma, Tav. 09) e raggiunge velocità superiori a quelle di progetto: a parità di distanza l’intervallo temporale reale è minore.

**Cause infrastrutturali** (visibilità)
- Accessi frequenti su strade di categoria C
- Siepi e vegetazione che chiudono la visuale dall’accesso

**Cause d’esercizio** (traffico e interferenze)
- Mezzi agricoli e veicoli lenti in immissione

**Combinazione.** L’accesso esiste per l’infrastruttura, il veicolo che si immette per l’esercizio: insieme creano un punto di conflitto non previsto dalla categoria di strada.

**Segnali premonitori**
- Varchi nelle siepi, cassette postali, cancelli
- Polvere o fango dagli accessi

**Condotta del motociclista**
- Ridurre la velocità dove ci sono accessi non visibili
- Posizione in corsia lontana dal margine degli accessi

**Contromisure per gestore e progettista**
- Accorpamento degli accessi su viabilità di servizio
- Taglio della vegetazione nei triangoli di visibilità

**Esito tipico:** Urto contro la fiancata del veicolo in immissione.
  
**Riferimenti:** Tesi Progettazione, Tav. 09 — il diagramma delle velocità

### E-14 · Curva di notte: il faro illumina l’esterno

**Natura:** Combinato · **Rischio:** P 2 (bassa) × G 4 (alta) = 8, medio

Di notte, in curva, un ostacolo o un animale si trova sulla parte interna della corsia, dove il faro della moto in piega non arriva.

> **In sella.** Di notte in curva vai alla velocità che ti permette di fermarti nella zona illuminata, non a quella che terresti di giorno.

**Dinamica.** Il fascio del faro è orientato lungo la tangente e ruota con il rollio: l’interno della curva resta al buio (x_int = h·cos φ·tan(β − φ) si annulla quando la piega raggiunge la semiapertura del fascio). Lungo la traiettoria il centro del fascio esce dalla corsia dopo circa √(2Re): con R = 100 m ed e = 1,75 m sono 19 m, contro i 52 m necessari per fermarsi da 70 km/h.

**Cause infrastrutturali** (visibilità, geometria d’asse)
- Assenza di illuminazione e di delineatori
- Contemporanea presenza di raccordo concavo e curva (Tav. 08)
- Raggi ridotti

**Cause d’esercizio** (traffico e interferenze)
- Veicoli fermi senza luci, animali selvatici

**Combinazione.** La geometria determina quanto ruota il faro, la presenza dell’ostacolo è casuale ma la sua scoperta tardiva è sistematica.

**Aggravanti ambientali:** notte

**Segnali premonitori**
- Delineatori che indicano lo sviluppo della curva
- Zone boscate con segnale di animali

**Condotta del motociclista**
- Velocità tale da fermarsi entro la porzione illuminata
- Usare i catadiottri dei delineatori per leggere la curva

**Contromisure per gestore e progettista**
- Delineatori normali e di curva a passo ridotto
- Raggi più ampi migliorano anche la visibilità notturna (Tav. 17)
- Recinzioni faunistiche

**Esito tipico:** Urto contro l’ostacolo non illuminato o uscita di strada.
  
**Riferimenti:** Tesi Progettazione, Tav. 08 — le visuali libere: la marcia notturna

### E-15 · Vento laterale e onda d’urto dei mezzi pesanti incrociati

**Natura:** Combinato · **Rischio:** P 2 (bassa) × G 4 (alta) = 8, medio

Su una strada a due corsie la moto incrocia un autoarticolato veloce, all’uscita di una trincea o su un viadotto esposto al vento.

> **In sella.** Su viadotti e all’uscita delle trincee, quando incroci un camion con vento laterale, spostati a destra e tieni il manubrio morbido.

**Dinamica.** La forza laterale aerodinamica vale F = ½ρ·C·A·v²: una raffica di 15 m/s su 1 m² di superficie laterale produce circa 140 N, il 5% del peso del complesso moto-pilota, sufficiente a spostarlo di circa 25 cm in un secondo se non corretto. L’onda di pressione del mezzo incrociato prima respinge e poi richiama la moto.

**Cause infrastrutturali** (geometria d’asse, arredo e margini)
- Viadotti e varchi esposti
- Uscite di trincea e di galleria
- Corsie strette senza banchina

**Cause d’esercizio** (mezzi pesanti)
- Mezzi pesanti veloci in senso opposto

**Combinazione.** La strada stretta riduce la distanza laterale dal mezzo, l’esposizione aggiunge la raffica.

**Aggravanti ambientali:** vento laterale

**Segnali premonitori**
- Manica a vento, alberi piegati
- Mezzo pesante che sopraggiunge

**Condotta del motociclista**
- Spostarsi verso il margine destro della corsia all’incrocio
- Busto rilassato e presa morbida del manubrio

**Contromisure per gestore e progettista**
- Barriere frangivento sui viadotti esposti
- Banchine pavimentate

**Esito tipico:** Deviazione di traiettoria, uscita di corsia.

### E-16 · Galleria: buco nero all’ingresso e abbagliamento all’uscita

**Natura:** Combinato · **Rischio:** P 2 (bassa) × G 4 (alta) = 8, medio

Entrando in galleria di giorno l’occhio non distingue la coda o il veicolo fermo all’interno; la pavimentazione in galleria è umida e sporca.

> **In sella.** Prima di entrare in galleria rallenta e togli gli occhiali da sole: per qualche secondo vedrai molto poco.

**Dinamica.** Il salto di luminanza tra esterno e interno richiede secondi di adattamento: in quell’intervallo la distanza di percezione è ridotta. La pavimentazione in galleria non è lavata dalla pioggia e accumula oli e polveri; all’ingresso spesso è bagnata dall’acqua portata dai veicoli.

**Cause infrastrutturali** (visibilità, stato della pavimentazione)
- Illuminazione di rinforzo insufficiente nella zona d’entrata
- Assenza di banchina
- Drenaggio inadeguato agli imbocchi

**Cause d’esercizio** (rallentamenti e code)
- Code e veicoli fermi all’interno

**Combinazione.** La galleria nasconde l’evento d’esercizio fino all’ultimo e ne amplifica le conseguenze per l’assenza di vie di fuga.

**Aggravanti ambientali:** abbagliamento

**Segnali premonitori**
- Imbocco con forte contrasto
- Luci rosse all’interno

**Condotta del motociclista**
- Rallentare prima dell’imbocco e togliere gli occhiali da sole
- Aumentare la distanza dal veicolo che precede

**Contromisure per gestore e progettista**
- Illuminazione di rinforzo dimensionata sulla velocità
- Pulizia programmata della pavimentazione in galleria

**Esito tipico:** Tamponamento all’interno della galleria.

### E-17 · Cantiere: fresato, gradini e segnaletica provvisoria

**Natura:** Combinato · **Rischio:** P 3 (media) × G 3 (media) = 9, medio

Tratto in lavorazione con superficie fresata, gradino tra fresato e strato esistente, ghiaino, segnaletica gialla provvisoria e deviazioni sulla corsia opposta.

> **In sella.** Nei cantieri attraversa i gradini del fresato con l’angolo più ampio possibile: quindi lentamente.

**Dinamica.** Il fresato ha solchi longitudinali che guidano la ruota stretta della moto e la fanno "serpeggiare"; il gradino longitudinale di alcuni centimetri, attraversato con angolo radente, devia l’anteriore. Le vernici gialle provvisorie sono applicate sopra quelle bianche e sono molto scivolose bagnate.

**Cause infrastrutturali** (stato della pavimentazione, geometria d’asse)
- Fresatura lasciata aperta al traffico
- Gradini longitudinali non raccordati
- Deviazioni con raggi stretti

**Cause d’esercizio** (rallentamenti e code, mezzi pesanti)
- Code a fisarmonica, mezzi d’opera che si immettono, materiale perso

**Combinazione.** Il cantiere altera la strada proprio dove il traffico rallenta e si accoda.

**Segnali premonitori**
- Preavvisi di cantiere
- Cambio di colore della pavimentazione

**Condotta del motociclista**
- Velocità ridotta e moto verticale nei cambi di livello
- Attraversare i gradini con angolo il più possibile retto

**Contromisure per gestore e progettista**
- Raccordo dei gradini con rampe
- Riduzione dei tempi di apertura al traffico del fresato
- Segnaletica provvisoria antiscivolo

**Esito tipico:** Caduta per deviazione dell’anteriore o tamponamento in coda.

### E-18 · Accelerazione tra due curve: la velocità oltre quella di progetto ⚠ fuori norma

**Natura:** Infrastrutturale · **Rischio:** P 3 (media) × G 4 (alta) = 12, elevato

Su un percorso misto la moto accelera fortemente nel rettifilo tra due curve e arriva alla seconda a una velocità molto superiore a quella prevista dal diagramma delle velocità.

> **In sella.** Tra due curve non usare tutta la potenza: conta la velocità con cui arrivi alla curva successiva.

> ⚠ **Velocità superiore a quella di progetto e al limite nel rettifilo tra due curve.** Comportamento tipico della guida sportiva: lo scenario mostra come la strada sia dimensionata per velocità inferiori.

**Dinamica.** La norma costruisce il diagramma delle velocità con accelerazioni e decelerazioni di 0,8 m/s²; la moto accelera a 2,0 m/s². Nello stesso tratto raggiunge velocità fino al 127-156% di quelle previste (Tav. 09), per cui visibilità per l’arresto, curve di transizione e distanze di transizione risultano sottodimensionate.

**Cause infrastrutturali** (geometria d’asse, visibilità)
- Diagramma delle velocità costruito con accelerazioni dell’autovettura
- Rettifili brevi tra curve di raggio diverso

**Segnali premonitori**
- Seconda curva più stretta della prima
- Visuale chiusa sull’uscita

**Condotta del motociclista**
- Ragionare sulla velocità d’ingresso della curva successiva, non sulla potenza disponibile

**Contromisure per gestore e progettista**
- Verifica del diagramma delle velocità con l’accelerazione della moto
- Segnaletica di preavviso coerente

**Esito tipico:** Uscita di strada nella seconda curva o tamponamento di un ostacolo non visibile.
  
**Riferimenti:** Tesi Progettazione, Tav. 09 — il diagramma delle velocità

## Contesto autostradale

Velocità massime, flussi intensi con elevata quota di mezzi pesanti, code e rallentamenti improvvisi, opere d’arte (viadotti, gallerie, svincoli), barriere continue su entrambi i margini.

### Scenari infrastrutturali

- [A-06](#a-06--giunti-di-dilatazione-dei-viadotti-in-curva) Giunti di dilatazione dei viadotti in curva
- [A-11](#a-11--ostacoli-fissi-cuspidi-terminali-e-barriere) Ostacoli fissi: cuspidi, terminali e barriere
- [A-15](#a-15--ghiaccio-sul-viadotto-in-curva) Ghiaccio sul viadotto in curva

### Scenari d’esercizio

- [A-02](#a-02--marcia-tra-le-corsie-in-coda) Marcia tra le corsie in coda ⚠
- [A-03](#a-03--sorpasso-di-un-mezzo-pesante-sotto-la-pioggia) Sorpasso di un mezzo pesante sotto la pioggia
- [A-04](#a-04--cambio-di-corsia-del-mezzo-pesante-nellangolo-cieco) Cambio di corsia del mezzo pesante nell’angolo cieco
- [A-07](#a-07--detriti-in-carreggiata-scoperti-allultimo) Detriti in carreggiata scoperti all’ultimo
- [A-12](#a-12--velocità-molto-superiore-al-limite-e-cambio-di-corsia) Velocità molto superiore al limite e cambio di corsia ⚠
- [A-14](#a-14--corsia-demergenza-in-coda) Corsia d’emergenza in coda ⚠

### Scenari combinati

- [A-01](#a-01--fine-coda-nascosta-dalla-curva-e-dal-new-jersey) Fine coda nascosta dalla curva e dal New Jersey
- [A-05](#a-05--ormaie-nella-corsia-di-marcia-con-pioggia) Ormaie nella corsia di marcia con pioggia
- [A-08](#a-08--rampa-di-svincolo-a-raggio-decrescente-con-gasolio) Rampa di svincolo a raggio decrescente con gasolio
- [A-09](#a-09--immissione-dalla-corsia-di-accelerazione) Immissione dalla corsia di accelerazione
- [A-10](#a-10--scambio-di-carreggiata-in-cantiere) Scambio di carreggiata in cantiere
- [A-13](#a-13--ristagno-dacqua-nella-zona-di-flesso-della-sopraelevazione) Ristagno d’acqua nella zona di flesso della sopraelevazione

### A-01 · Fine coda nascosta dalla curva e dal New Jersey

**Natura:** Combinato · **Rischio:** P 3 (media) × G 5 (molto alta) = 15, elevato

In corsia di sorpasso, in curva sinistrorsa, lo spartitraffico New Jersey chiude la visuale: la coda ferma appare all’improvviso.

> **In sella.** In curva sinistrorsa, se lo spartitraffico chiude la visuale, preferisci la corsia centrale e tieni distanza.

**Dinamica.** In curva sinistrorsa l’ostacolo laterale per chi viaggia in corsia di sorpasso è la barriera centrale, alta 1 m circa e a 1-1,5 m dalla traiettoria. La visuale D = 2R·arccos(1 − m/R) con R = 800 m e m = 2 m vale circa 113 m; a 130 km/h, con τ = 1 s e frenata a 0,7 g, servono circa 131 m. Ogni km/h in più erode il margine; la moto, in frenata d’emergenza ad alta velocità, deve gestire il trasferimento di carico e la tendenza all’instabilità.

**Cause infrastrutturali** (visibilità, geometria d’asse, arredo e margini)
- Spartitraffico rigido continuo in curva sinistrorsa
- Raggi verificati con l’ostacolo posto al centro della corsia e l’occhio a 1,10 m
- Uscite di galleria in curva

**Cause d’esercizio** (rallentamenti e code)
- Code improvvise per incidenti, cantieri, rallentamenti a fisarmonica
- Elevata velocità media in corsia di sorpasso

**Combinazione.** La barriera centrale, utilissima a evitare gli scavalcamenti, è anche l’ostacolo alla visuale: la coda la trasforma in un pericolo.

**Segnali premonitori**
- Pannelli a messaggio variabile
- Luci di emergenza dei veicoli più avanti
- Riduzione improvvisa della distanza tra i veicoli

**Condotta del motociclista**
- In curva sinistrorsa preferire la corsia centrale, che ha visuale più lunga
- Mantenere una distanza che consenta l’arresto entro la visuale
- Valutare la via di fuga (corsia d’emergenza)

**Contromisure per gestore e progettista**
- Allargamento della banchina sinistra in curva
- Sistemi di segnalazione di coda a monte
- Verifiche di visibilità con il punto di vista della moto

**Esito tipico:** Tamponamento ad alta velocità della coda.

### A-02 · Marcia tra le corsie in coda ⚠ fuori norma

**Natura:** D’esercizio · **Rischio:** P 3 (media) × G 3 (media) = 9, medio

Con il traffico rallentato a 20-30 km/h la moto procede a 50-70 km/h tra due file; un veicolo cambia corsia per occupare un varco.

> **In sella.** In coda, se passi tra le file, fallo a non più di 15-20 km/h sopra il traffico e mai tra due camion.

> ⚠ **Marcia tra la corsia di sorpasso e la centrale (o tra centrale e marcia) con veicoli incolonnati.** Non ammessa dal CdS italiano. Lo scenario analizza il rischio in funzione del differenziale di velocità con la coda.

**Dinamica.** Il varco tra le file è di 1-1,5 m, gli specchietti di auto e furgoni lo riducono ancora. Il pericolo dipende dal differenziale di velocità: chi cambia corsia vede la moto troppo tardi, la moto deve fermarsi in uno spazio pari alla distanza dal veicolo in quel momento. Con un differenziale di 40 km/h si percorrono 11 m al secondo.

**Cause infrastrutturali** (geometria d’asse)
- Corsie strette nei cantieri
- Mezzi pesanti che occupano tutta la corsia

**Cause d’esercizio** (rallentamenti e code, mezzi pesanti)
- Code a velocità diversa per corsia
- Cambi di corsia per guadagnare posizioni

**Segnali premonitori**
- Varchi che si aprono davanti ai veicoli in coda
- Coda della corsia adiacente più veloce
- Veicoli che si spostano verso la linea di corsia

**Condotta del motociclista**
- Differenziale di velocità contenuto
- Mai tra mezzi pesanti affiancati
- Fermarsi in coda quando la coda riparte

**Contromisure per gestore e progettista**
- Gestione dinamica delle corsie e informazione in tempo reale

**Esito tipico:** Urto laterale e caduta tra i veicoli in movimento.

### A-03 · Sorpasso di un mezzo pesante sotto la pioggia

**Natura:** D’esercizio · **Rischio:** P 2 (bassa) × G 4 (alta) = 8, medio

La moto sorpassa un autoarticolato sotto la pioggia: lo spray azzera la visibilità e la scia aerodinamica destabilizza la moto.

> **In sella.** Sotto la pioggia non restare nella nube d’acqua dietro un camion: sorpassa con decisione o resta lontano.

**Dinamica.** Le ruote del mezzo pesante sollevano una nube d’acqua che riduce la visibilità a pochi metri e copre la visiera. Affiancandosi, la moto attraversa la zona di depressione e di turbolenza della scia, poi l’onda di pressione davanti alla motrice: forze laterali alternate in un secondo.

**Cause infrastrutturali** ()
- Pavimentazioni chiuse che non drenano

**Cause d’esercizio** (mezzi pesanti)
- Elevata quota di mezzi pesanti
- Velocità di sorpasso ridotta, quindi lunga esposizione

**Aggravanti ambientali:** pioggia / bagnato, vento laterale

**Segnali premonitori**
- Nube d’acqua dietro il mezzo
- Vento laterale

**Condotta del motociclista**
- Sorpasso deciso e distanziato lateralmente
- Non sostare nella zona dello spray

**Contromisure per gestore e progettista**
- Pavimentazioni drenanti e paraspruzzi efficaci sui mezzi

**Esito tipico:** Perdita di visibilità, deviazione e caduta.

### A-04 · Cambio di corsia del mezzo pesante nell’angolo cieco

**Natura:** D’esercizio · **Rischio:** P 2 (bassa) × G 5 (molto alta) = 10, elevato

La moto viaggia affiancata al quarto posteriore di un autoarticolato; il mezzo si sposta per sorpassare un veicolo più lento.

> **In sella.** Non viaggiare affiancato a un camion: sorpassalo o resta indietro, dove ti vede negli specchi.

**Dinamica.** Lo specchio del mezzo pesante non copre la zona accanto al semirimorchio. Lo spostamento laterale di 3,5 m avviene in 4-6 s, ma i primi 50 cm, sufficienti a chiudere la moto contro lo spartitraffico, in poco più di un secondo.

**Cause d’esercizio** (mezzi pesanti, traffico e interferenze)
- Mezzi pesanti che si sorpassano tra loro
- Moto che si attarda affiancata

**Segnali premonitori**
- Mezzo che si avvicina a un veicolo più lento
- Indicatore acceso

**Condotta del motociclista**
- Non viaggiare affiancati ai mezzi pesanti
- Sorpassare rapidamente o restare indietro

**Contromisure per gestore e progettista**
- Divieti di sorpasso tra mezzi pesanti nei tratti critici
- Sistemi di rilevamento dell’angolo cieco

**Esito tipico:** Urto laterale e schiacciamento contro la barriera.

### A-05 · Ormaie nella corsia di marcia con pioggia

**Natura:** Combinato · **Rischio:** P 3 (media) × G 4 (alta) = 12, elevato

La corsia di marcia lenta, percorsa dai mezzi pesanti, presenta ormaie profonde piene d’acqua; la moto le attraversa per spostarsi in corsia di sorpasso.

> **In sella.** Con la pioggia la corsia di marcia ha le ormaie piene d’acqua: stai sotto gli 80 km/h e cambia corsia deciso, a moto dritta.

**Dinamica.** È il caso studio della Tesi Manutenzione: alle velocità autostradali l’altezza critica del velo idrico scende a pochi millimetri (circa 4 mm a 110 km/h con pneumatico scolpito), quindi anche ormaie modeste diventano critiche. L’attraversamento obliquo del bordo dell’ormaia aggiunge una coppia che devia l’anteriore.

**Cause infrastrutturali** (stato della pavimentazione)
- Conglomerati con eccesso di vuoti o di legante
- Strati sottodimensionati per il traffico pesante attuale
- Pendenze trasversali insufficienti

**Cause d’esercizio** (mezzi pesanti)
- Canalizzazione dei mezzi pesanti nella corsia di marcia

**Combinazione.** Il traffico pesante crea il degrado, la pioggia lo rende critico, la moto ne subisce l’effetto maggiore.

**Aggravanti ambientali:** pioggia / bagnato

**Segnali premonitori**
- Doppia striscia d’acqua nella corsia di marcia
- Spray più alto dei veicoli

**Condotta del motociclista**
- Cambiare corsia con angolo deciso
- Ridurre la velocità con pioggia intensa

**Contromisure per gestore e progettista**
- Priorità di intervento basata sul rischio
- Pavimentazioni drenanti
- Miscele ad alto modulo nelle corsie lente

**Esito tipico:** Aquaplaning, perdita di direzionalità.
  
**Ammaloramenti correlati:** F
  
**Riferimenti:** Tesi Manutenzione, Cap. IV §2.1 — analisi della probabilità

### A-06 · Giunti di dilatazione dei viadotti in curva

**Natura:** Infrastrutturale · **Rischio:** P 2 (bassa) × G 4 (alta) = 8, medio

All’inizio e alla fine di un viadotto un giunto metallico (a pettine o modulare) attraversa tutta la carreggiata, spesso in curva: bagnato è una striscia d’acciaio ad aderenza minima, consumato ha gradini e fessure.

> **In sella.** Sul giunto d’acciaio di un viadotto, soprattutto bagnato, passa con la moto più dritta che puoi e senza toccare i freni: frena prima o subito dopo.

**Dinamica.** Sull’acciaio bagnato l’aderenza scende a circa 0,15 contro 0,6-0,7 dell’asfalto. In piega la forza laterale richiesta resta la stessa mentre quella disponibile crolla per qualche decimetro: lo pneumatico slitta di lato e la moto si scompone; il giunto si attraversa in pochi centesimi di secondo e in genere si recupera, ma il ritorno di aderenza può innescare un high-side. Il pericolo vero è sovrapporre una frenata o un’accelerazione: senza ABS l’anteriore si blocca sull’acciaio e la moto cade. I giunti modulari dei viadotti lunghi sono larghi anche un metro e più; quelli ammalorati hanno gradini tra giunto e pavimentazione e varchi che deviano lo sterzo.

**Cause infrastrutturali** (stato della pavimentazione, geometria d’asse)
- Giunti metallici esposti, a pettine o modulari, posti ortogonalmente all’asse anche in curva
- Gradini e avvallamenti tra giunto e pavimentazione, tamponi di raccordo sgretolati
- Viadotti in curva o all’ingresso di uno svincolo, dove si frena in piega

**Aggravanti ambientali:** pioggia / bagnato

**Segnali premonitori**
- Cartello di viadotto, cambio di rumore del rotolamento
- Banda metallica trasversale lucida, ancora più visibile quando è bagnata
- Rattoppi e avvallamenti a cavallo del giunto

**Condotta del motociclista**
- Attraversare il giunto con la moto il più dritta possibile e con il gas costante
- Non frenare né accelerare sopra il giunto: anticipare la frenata o rimandarla di un istante
- Sul bagnato ridurre la velocità prima del viadotto, in modo che la piega sul giunto sia minima

**Contromisure per gestore e progettista**
- Giunti con superficie antiscivolo o giunti sottopavimentazione (a tampone) dove possibile
- Manutenzione dei raccordi tra giunto e pavimentazione
- Evitare giunti in tratti in curva dove si frena (fine viadotto prima di uno svincolo)

**Esito tipico:** Scomposta in piega o caduta per bloccaggio dell’anteriore sul giunto.

### A-07 · Detriti in carreggiata scoperti all’ultimo

**Natura:** D’esercizio · **Rischio:** P 2 (bassa) × G 5 (molto alta) = 10, elevato

Un battistrada di camion o un carico perso si trova in corsia; l’auto che precede lo evita con uno scarto e lo rivela alla moto che la segue troppo da vicino.

> **In sella.** Tieni almeno 3 secondi dal veicolo davanti e una posizione che ti permetta di vedere oltre.

**Dinamica.** Con una distanza di 1 s a 130 km/h la moto è a 36 m dal veicolo che precede: quando l’ostacolo diventa visibile restano poco più di 1,5 s. L’auto lo scavalca o lo evita; la moto non può passarci sopra (un oggetto di 15-20 cm sull’anteriore la destabilizza) e l’evitamento a quella velocità richiede una manovra di controsterzo decisa.

**Cause infrastrutturali** (visibilità)
- Tempi di sorveglianza e rimozione

**Cause d’esercizio** (mezzi pesanti, traffico e interferenze)
- Carichi mal fissati e pneumatici ricostruiti dei mezzi pesanti
- Distanza di sicurezza ridotta

**Segnali premonitori**
- Veicoli davanti che scartano senza motivo apparente
- Frammenti neri di battistrada ai margini

**Condotta del motociclista**
- Distanza di almeno 2-3 s
- Posizione in corsia che consenta di vedere oltre il veicolo che precede

**Contromisure per gestore e progettista**
- Pattugliamento e segnalazione rapida
- Controlli sui carichi

**Esito tipico:** Urto dell’ostacolo e caduta ad alta velocità.

### A-08 · Rampa di svincolo a raggio decrescente con gasolio

**Natura:** Combinato · **Rischio:** P 3 (media) × G 4 (alta) = 12, elevato

La rampa di uscita è un anello di raggio stretto e decrescente, in discesa; i mezzi pesanti vi perdono gasolio e la coda del casello risale.

> **In sella.** Finisci di frenare nella corsia di decelerazione ed entra piano negli anelli delle rampe: lì si accumula il gasolio.

**Dinamica.** Si passa da 130 km/h a 40-50 km/h in poche centinaia di metri: chi sottostima la decelerazione entra nell’anello troppo veloce e deve frenare in piega. Il gasolio, rilasciato dai serbatoi inclinati, è concentrato proprio sulla traiettoria esterna dell’anello.

**Cause infrastrutturali** (geometria d’asse, stato della pavimentazione)
- Corsie di decelerazione corte
- Anelli a raggio decrescente
- Pendenza trasversale verso l’esterno nei raccordi

**Cause d’esercizio** (mezzi pesanti, rallentamenti e code)
- Mezzi pesanti con serbatoi pieni
- Code al casello

**Combinazione.** La geometria della rampa somma le richieste di aderenza (frenata e piega), i mezzi pesanti riducono quella disponibile.

**Segnali premonitori**
- Pannelli di uscita, coda visibile al casello
- Macchie scure in corona

**Condotta del motociclista**
- Completare la frenata in rettilineo nella corsia di decelerazione

**Contromisure per gestore e progettista**
- Allungamento delle corsie di decelerazione
- Raggi costanti nelle rampe
- Pulizia tempestiva

**Esito tipico:** Scivolata in piega e urto contro la barriera della rampa.

### A-09 · Immissione dalla corsia di accelerazione

**Natura:** Combinato · **Rischio:** P 3 (media) × G 4 (alta) = 12, elevato

Un veicolo in immissione taglia la corsia di marcia dove procede la moto, che negli specchi appare piccola e lontana.

> **In sella.** Vicino agli svincoli aspettati qualcuno che si immette senza vederti: se puoi, spostati in corsia centrale.

**Dinamica.** Negli specchietti la moto occupa un angolo visivo minimo e la sua velocità di avvicinamento è difficile da stimare. Con una corsia di accelerazione corta chi si immette non può adeguare la velocità e si sposta comunque.

**Cause infrastrutturali** (geometria d’asse, visibilità)
- Corsie di accelerazione corte
- Barriere antirumore che chiudono la visuale tra rampa e carreggiata

**Cause d’esercizio** (traffico e interferenze, mezzi pesanti)
- Mezzi pesanti lenti in immissione
- Traffico intenso in corsia di marcia

**Combinazione.** La geometria dell’immissione impone la manovra, il traffico ne riduce i tempi.

**Segnali premonitori**
- Veicoli sulla rampa paralleli alla carreggiata
- Fine della corsia di accelerazione

**Condotta del motociclista**
- In prossimità degli svincoli spostarsi in corsia centrale se libera

**Contromisure per gestore e progettista**
- Corsie di accelerazione adeguate
- Visibilità reciproca tra rampa e carreggiata

**Esito tipico:** Urto laterale.

### A-10 · Scambio di carreggiata in cantiere

**Natura:** Combinato · **Rischio:** P 3 (media) × G 4 (alta) = 12, elevato

Deviazione sulla carreggiata opposta attraverso un by-pass con raggi ridotti, corsie da 3 m, New Jersey provvisori, pavimentazione fresata o rattoppata e doppia segnaletica.

> **In sella.** Nei cantieri rispetta il limite: gli scambi di carreggiata hanno curve strette e la vernice gialla bagnata scivola.

**Dinamica.** Le transizioni di traiettoria avvengono con raggi molto minori di quelli autostradali e su superfici eterogenee (fresato, rappezzi, vernice gialla su bianca). La moto deve cambiare piega più volte vicina a barriere rigide e a mezzi pesanti affiancati.

**Cause infrastrutturali** (geometria d’asse, stato della pavimentazione, arredo e margini)
- By-pass con raggi stretti e senza banchine
- Pavimentazione provvisoria
- Segnaletica sovrapposta

**Cause d’esercizio** (rallentamenti e code, mezzi pesanti)
- Code e rallentamenti
- Mezzi pesanti nella corsia ristretta

**Combinazione.** Ogni elemento del cantiere riduce un margine diverso; il traffico rallentato riduce gli spazi di manovra.

**Segnali premonitori**
- Preavvisi di cantiere a 2 km
- Segnaletica gialla

**Condotta del motociclista**
- Seguire la segnaletica gialla, velocità ridotta, nessun sorpasso nel by-pass

**Contromisure per gestore e progettista**
- Raggi e superfici adeguate anche nelle fasi provvisorie
- Rimozione della segnaletica superata

**Esito tipico:** Scivolata o urto contro le barriere provvisorie.

### A-11 · Ostacoli fissi: cuspidi, terminali e barriere

**Natura:** Infrastrutturale · **Rischio:** P 2 (bassa) × G 5 (molto alta) = 10, elevato

Cuspidi di svincolo, terminali di barriera, portali e sostegni della segnaletica, New Jersey e guard-rail lungo tutto il margine.

> **In sella.** Se hai perso l’uscita, prosegui: tagliare la zebratura all’ultimo porta dritti contro la cuspide.

**Dinamica.** In autostrada qualsiasi uscita di traiettoria termina contro una barriera. Il New Jersey, privo di paletti, ha una superficie continua ma la sua forma può sollevare e proiettare la moto; il guard-rail a paletti espone il motociclista a scivolato agli impatti già descritti in E-06. Le cuspidi non protette sono ostacoli frontali.

**Cause infrastrutturali** (arredo e margini)
- Terminali non protetti o non conformi
- Cuspidi senza attenuatori
- Barriere senza protezione per motociclisti

**Segnali premonitori**
- Cuspidi negli svincoli

**Condotta del motociclista**
- Evitare cambi di corsia all’ultimo in prossimità delle cuspidi

**Contromisure per gestore e progettista**
- Attenuatori d’urto
- Dispositivi salva-motociclisti sulle barriere nelle curve degli svincoli

**Esito tipico:** Impatto ad alta energia contro elementi rigidi.
  
**Riferimenti:** Tesi Progettazione, Tav. 18 — classi di contenimento e soluzioni per le barriere

### A-12 · Velocità molto superiore al limite e cambio di corsia ⚠ fuori norma

**Natura:** D’esercizio · **Rischio:** P 3 (media) × G 5 (molto alta) = 15, elevato

In corsia di sorpasso la moto procede a velocità molto superiore al flusso; un’auto in corsia centrale si sposta a sinistra per sorpassare un mezzo pesante.

> **In sella.** In autostrada la velocità eccessiva toglie a te il tempo per reagire e agli altri la possibilità di vederti arrivare.

> ⚠ **Velocità molto superiore al limite (160-200 km/h).** Lo scenario confronta il comportamento a 130 km/h e oltre: chi cambia corsia giudica il varco come se la moto viaggiasse alla velocità del flusso.

**Dinamica.** Il conducente dell’auto vede la moto nello specchietto a 150-200 m e giudica il varco sufficiente, come lo sarebbe se la moto viaggiasse alla velocità del flusso; con 60-70 km/h di differenziale la moto copre 150 m in circa 8 s e lo spazio d’arresto a 190 km/h supera i 250 m. A queste velocità anche irregolarità minime della pavimentazione e i giunti possono innescare oscillazioni (wobble, weave).

**Cause infrastrutturali** (visibilità)
- Rettifili lunghi e scorrevoli

**Cause d’esercizio** (traffico e interferenze, mezzi pesanti)
- Flusso eterogeneo con forti differenziali di velocità
- Sorpassi tra mezzi pesanti e auto

**Segnali premonitori**
- Veicolo in corsia centrale che si avvicina a un mezzo pesante
- Indicatore sinistro acceso

**Condotta del motociclista**
- Velocità coerente con il flusso
- Anticipare i cambi di corsia di chi raggiunge veicoli più lenti

**Contromisure per gestore e progettista**
- Controllo della velocità media (tutor)
- Gestione dinamica dei limiti

**Esito tipico:** Tamponamento ad altissima energia.

### A-13 · Ristagno d’acqua nella zona di flesso della sopraelevazione

**Natura:** Combinato · **Rischio:** P 2 (bassa) × G 4 (alta) = 8, medio

Nel passaggio tra due curve di verso opposto la pendenza trasversale si annulla: l’acqua non defluisce e si forma un velo esteso proprio dove si cambia piega.

> **In sella.** Con la pioggia forte l’acqua ristagna nei cambi di curva: sotto i 90 km/h e nessuna manovra brusca.

**Dinamica.** Nella rotazione della sagoma la pendenza trasversale passa per zero: con pendenza longitudinale bassa il percorso dell’acqua si allunga e il velo idrico cresce. A velocità autostradali bastano pochi millimetri per avvicinarsi all’aquaplaning, e la moto si trova in transizione di piega, condizione in cui è meno tollerante a variazioni improvvise d’aderenza.

**Cause infrastrutturali** (geometria d’asse, stato della pavimentazione)
- Raccordo dei cigli con pendenza longitudinale insufficiente
- Pavimentazione drenante intasata
- Depressioni e ormaie

**Cause d’esercizio** (traffico e interferenze)
- Velocità di flusso elevata anche con pioggia

**Combinazione.** La geometria crea l’accumulo d’acqua, la velocità del traffico lo rende critico.

**Aggravanti ambientali:** pioggia / bagnato

**Segnali premonitori**
- Spray improvvisamente più alto dei veicoli davanti
- Zona di cambio di curvatura

**Condotta del motociclista**
- Ridurre la velocità nei flessi con pioggia intensa
- Nessuna manovra brusca nella zona

**Contromisure per gestore e progettista**
- Verifica dei percorsi di deflusso nella rotazione della sagoma
- Manutenzione delle drenanti

**Esito tipico:** Aquaplaning e perdita di controllo.
  
**Ammaloramenti correlati:** I, F
  
**Riferimenti:** Tesi Progettazione, Tav. 05 — pendenze trasversali e raccordo dei cigli

### A-14 · Corsia d’emergenza in coda ⚠ fuori norma

**Natura:** D’esercizio · **Rischio:** P 2 (bassa) × G 5 (molto alta) = 10, elevato

La moto supera la coda percorrendo la corsia d’emergenza; un veicolo fermo, una persona a piedi o un’auto che esce dalla coda occupano la corsia.

> **In sella.** La corsia d’emergenza non è una corsia: lì ci sono persone a piedi e mezzi fermi.

> ⚠ **Marcia in corsia d’emergenza durante una coda.** Vietata dal CdS; analizzata per i rischi specifici della corsia d’emergenza.

**Dinamica.** La corsia d’emergenza raccoglie detriti, ghiaia, parti di veicoli e ha la segnaletica e i giunti più degradati. È la via di fuga dei soccorsi e di chi ha un guasto: un ostacolo fermo vi compare senza preavviso dietro i veicoli in coda.

**Cause infrastrutturali** (arredo e margini, stato della pavimentazione)
- Superficie sporca e manutenzione ridotta
- Barriera a destra senza via di fuga

**Cause d’esercizio** (rallentamenti e code)
- Veicoli fermi, persone a piedi, mezzi di soccorso

**Segnali premonitori**
- Coda ferma in tutte le corsie
- Luci lampeggianti più avanti

**Condotta del motociclista**
- Restare in coda

**Contromisure per gestore e progettista**
- Sorveglianza e sanzione
- Informazione sui tempi di attesa

**Esito tipico:** Urto contro veicolo fermo o persona, interferenza con i soccorsi.

### A-15 · Ghiaccio sul viadotto in curva

**Natura:** Infrastrutturale · **Rischio:** P 2 (bassa) × G 4 (alta) = 8, medio

Con temperature intorno allo zero la strada è asciutta, ma l’impalcato di un viadotto in curva è coperto da un velo di brina o ghiaccio che non si vede.

> **In sella.** D’inverno i viadotti gelano per primi, anche quando la strada è asciutta: con temperature vicine allo zero rallenta prima di entrarci.

**Dinamica.** Il viadotto è esposto all’aria su entrambe le facce e non riceve il calore del terreno: si raffredda prima e gela anche quando la strada in rilevato è sopra lo zero. Il ghiaccio offre un’aderenza intorno a 0,05-0,1; in curva, a velocità autostradale, la sola piega ne richiede di più e la moto scivola appena entra sulla zona ghiacciata, senza alcuna frenata. A velocità più bassa si resta in piedi, ma senza margine: qualunque correzione o frenata sull’impalcato fa cadere.

**Cause infrastrutturali** (stato della pavimentazione, geometria d’asse)
- Impalcato esposto all’aria su entrambe le facce, senza il calore del terreno
- Viadotti in ombra, nei fondovalle o sopra corsi d’acqua
- Curve sull’impalcato, dove la piega impegna già parte dell’aderenza

**Aggravanti ambientali:** temperatura

**Segnali premonitori**
- Cartello di pericolo di ghiaccio, temperatura esterna vicina a zero
- Asfalto più scuro o opaco sull’impalcato, brina sui guard-rail e sulle barriere
- Mattino presto, giornate serene dopo notti fredde

**Condotta del motociclista**
- Con temperature vicine allo zero ridurre la velocità prima del viadotto, non sopra
- Attraversare l’impalcato con la moto il più dritta possibile, senza frenare né cambiare traiettoria
- Considerare che la strada asciutta prima del viadotto non dice nulla sull’impalcato

**Contromisure per gestore e progettista**
- Trattamento antighiaccio preventivo mirato sui viadotti
- Sensori di temperatura dell’impalcato e pannelli a messaggio variabile
- Segnaletica di pericolo di ghiaccio sui viadotti esposti

**Esito tipico:** Scivolata in curva sulla zona ghiacciata, urto contro la barriera.
