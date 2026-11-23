/**
 * Catalogo degli ammaloramenti (sintesi dei cataloghi CNR, SETRA, RDDHD, SHRP)
 * riletto dal punto di vista del motoveicolo: per ciascun degrado si indica l'effetto specifico sulla moto,
 * che a differenza dell'autovettura poggia su due sole impronte di pochi cm² e si inclina in curva.
 */

export type DistressId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L' | 'M' | 'N' | 'O' | 'P' | 'Q';

export interface Distress {
  id: DistressId;
  nome: string;
  descrizione: string;
  effettoMoto: string;
  /** quale caratteristica funzionale compromette: aderenza (rugosità), regolarità, portanza */
  funzione: ('aderenza' | 'regolarità' | 'portanza')[];
  gravitaMoto: 1 | 2 | 3 | 4 | 5;
}

export const DISTRESSES: Distress[] = [
  {
    id: 'A',
    nome: 'Trasudo del legante',
    descrizione: 'Risalita localizzata di legante o di filler alla superficie, in corrispondenza delle tracce delle ruote, più visibile in estate.',
    effettoMoto: 'Zone lucide e morbide proprio sulla traiettoria abituale: col caldo il legante si comporta da lubrificante, col bagnato l’aderenza crolla. Critico in frenata e in piega.',
    funzione: ['aderenza'],
    gravitaMoto: 3,
  },
  {
    id: 'B',
    nome: 'Lucidatura degli inerti',
    descrizione: 'Gli aggregati della superficie vengono rasati progressivamente fino alla scomparsa della microtessitura.',
    effettoMoto: 'Riduce l’aderenza disponibile su asciutto (microtessitura) e soprattutto su bagnato. Allunga lo spazio d’arresto in proporzione alla diffusione e abbassa la velocità limite in curva.',
    funzione: ['aderenza'],
    gravitaMoto: 4,
  },
  {
    id: 'C',
    nome: 'Disgregazione',
    descrizione: 'Separazione degli aggregati dal legante; tessitura aperta su tutta la carreggiata per distacco dei fini.',
    effettoMoto: 'Materiale sciolto che rotola sotto lo pneumatico: in piega produce scivolamenti del posteriore e dell’anteriore (low-side).',
    funzione: ['aderenza', 'regolarità'],
    gravitaMoto: 3,
  },
  {
    id: 'D',
    nome: 'Sgranatura',
    descrizione: 'Progressiva perdita del materiale granulare in grani isolati o a gruppi.',
    effettoMoto: 'Ghiaino libero concentrato ai margini e alla corda delle curve, dove la moto passa in piega.',
    funzione: ['aderenza'],
    gravitaMoto: 3,
  },
  {
    id: 'E',
    nome: 'Pelatura',
    descrizione: 'Distacco di larghe placche di conglomerato; lo strato inferiore è chiaramente visibile.',
    effettoMoto: 'Gradini di qualche centimetro e cambi di tessitura improvvisi: la ruota anteriore subisce urti e variazioni di aderenza.',
    funzione: ['regolarità', 'aderenza'],
    gravitaMoto: 3,
  },
  {
    id: 'F',
    nome: 'Ormaie',
    descrizione: 'Deformazioni trasversali in corrispondenza delle tracce delle ruote, bordate da piccoli rigonfiamenti.',
    effettoMoto: 'Marcia "a binario": l’uscita dall’ormaia genera coppie che deviano la ruota. Con pioggia l’acqua ristagna nel fondo e innesca l’aquaplaning.',
    funzione: ['regolarità', 'aderenza', 'portanza'],
    gravitaMoto: 4,
  },
  {
    id: 'G',
    nome: 'Rigonfiamenti',
    descrizione: 'Spostamento orizzontale del rivestimento e rigonfiamenti allungati ai bordi delle tracce delle ruote.',
    effettoMoto: 'Creste longitudinali che la ruota stretta della moto deve scavalcare con angoli radenti: rischio di deviazione e di caduta nel cambio corsia.',
    funzione: ['regolarità'],
    gravitaMoto: 3,
  },
  {
    id: 'H',
    nome: 'Ondulazioni',
    descrizione: 'Successione di onde di lunghezza variabile, localizzate o meno.',
    effettoMoto: 'Variazioni periodiche del carico verticale: in curva e in frenata riducono il peso aderente proprio quando serve; possono innescare oscillazioni dello sterzo.',
    funzione: ['regolarità'],
    gravitaMoto: 3,
  },
  {
    id: 'I',
    nome: 'Depressioni',
    descrizione: 'Depressioni localizzate di forma arrotondata o cedimenti più o meno estesi del piano viabile.',
    effettoMoto: 'Inducono manovre improvvise; l’instabilità è accentuata dalla massa concentrata vicino al baricentro. Con pioggia diventano pozzanghere profonde.',
    funzione: ['regolarità', 'portanza'],
    gravitaMoto: 3,
  },
  {
    id: 'J',
    nome: 'Fessurazioni longitudinali',
    descrizione: 'Fessure continue parallele all’asse della strada, nelle tracce delle ruote o fuori.',
    effettoMoto: 'Possono "catturare" lo pneumatico anteriore; spesso sono sigillate con mastice bituminoso liscio, scivoloso col caldo e col bagnato.',
    funzione: ['regolarità', 'aderenza'],
    gravitaMoto: 3,
  },
  {
    id: 'K',
    nome: 'Fessurazioni trasversali',
    descrizione: 'Fessure perpendicolari all’asse, a intervalli regolari o isolate.',
    effettoMoto: 'Urti ripetuti e gradini; le sigillature trasversali in piega riducono l’aderenza su tutta la larghezza.',
    funzione: ['regolarità'],
    gravitaMoto: 2,
  },
  {
    id: 'L',
    nome: 'Fessurazioni a blocchi',
    descrizione: 'Fessure reticolari a maglie larghe da 0,1 a 10 m².',
    effettoMoto: 'Superficie discontinua con elementi che tendono a distaccarsi: premessa di buche e materiale sciolto.',
    funzione: ['regolarità', 'portanza'],
    gravitaMoto: 2,
  },
  {
    id: 'M',
    nome: 'Fessurazioni ramificate (a pelle di coccodrillo)',
    descrizione: 'Serie di fessure interconnesse con maglie inferiori a 30 cm.',
    effettoMoto: 'Indica cedimento strutturale: evolve rapidamente in buche, soprattutto dopo cicli di gelo e disgelo.',
    funzione: ['portanza', 'regolarità'],
    gravitaMoto: 3,
  },
  {
    id: 'N',
    nome: 'Fessurazioni dei giunti',
    descrizione: 'Perdita del rivestimento e frantumazione del giunto nelle pavimentazioni semirigide.',
    effettoMoto: 'Gradini trasversali e materiale sciolto in corrispondenza del giunto.',
    funzione: ['regolarità'],
    gravitaMoto: 2,
  },
  {
    id: 'O',
    nome: 'Risalita d’acqua',
    descrizione: 'Risalita d’acqua e di fini dagli strati non legati attraverso i degradi superficiali.',
    effettoMoto: 'Fango fine in superficie anche a giorni di distanza dalla pioggia: zone scivolose localizzate e poco riconoscibili.',
    funzione: ['aderenza', 'portanza'],
    gravitaMoto: 3,
  },
  {
    id: 'P',
    nome: 'Buche',
    descrizione: 'Depressioni localizzate prodotte per asportazione di materiale, estese agli strati profondi.',
    effettoMoto: 'Il degrado più condizionante: in rettifilo e in curva, quando il punto di contatto è avanzato rispetto alla proiezione dell’asse forcella, il mezzo diventa ingovernabile. Piene d’acqua non sono distinguibili da una pozzanghera.',
    funzione: ['regolarità', 'portanza'],
    gravitaMoto: 5,
  },
  {
    id: 'Q',
    nome: 'Rappezzi',
    descrizione: 'Riparazioni con rinforzi o sostituzioni che si scollano e formano fessure ai bordi; i cedimenti danno una superficie irregolare.',
    effettoMoto: 'Cambio di aderenza tra materiale vecchio e nuovo, gradini perimetrali, bitume di sigillatura: in piega ogni transizione è un possibile innesco di scivolata.',
    funzione: ['regolarità', 'aderenza'],
    gravitaMoto: 3,
  },
];

export const distressById = (id: DistressId) => DISTRESSES.find((d) => d.id === id)!;
