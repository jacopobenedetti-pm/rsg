/**
 * Tassonomia degli scenari di pericolo.
 *
 * Ogni scenario è classificato su tre assi indipendenti:
 *   1. CONTESTO           urbano · extraurbano · autostradale
 *   2. CAUSE SCATENANTI   infrastruttura (visibilità, pavimentazione, geometria d'asse, arredo e margini)
 *                         esercizio (traffico e interferenze, rallentamenti e code, mezzi pesanti)
 *                         → la NATURA dello scenario è infrastrutturale, d'esercizio o combinata
 *   3. AGGRAVANTI         condizioni ambientali (pioggia, notte, abbagliamento, vento, temperatura, nebbia)
 * più un marcatore per le condotte non ammesse dal Codice della Strada (scenari "fuori norma").
 *
 * La stima qualitativa del rischio segue l'impostazione R = P · G della Tesi Manutenzione (§II.4.1).
 */

export type ContextId = 'urbano' | 'extraurbano' | 'autostradale';
export type InfraFactor = 'visibilita' | 'pavimentazione' | 'geometria' | 'arredo';
export type OpFactor = 'traffico' | 'rallentamenti' | 'mezzi-pesanti';
export type EnvFactor = 'pioggia' | 'notte' | 'abbagliamento' | 'vento' | 'temperatura' | 'nebbia';
export type Nature = 'infrastruttura' | 'esercizio' | 'combinato';

export interface Labelled<T extends string> {
  id: T;
  nome: string;
  breve: string;
  descrizione: string;
}

export const CONTEXTS: Labelled<ContextId>[] = [
  {
    id: 'urbano',
    nome: 'Urbano',
    breve: 'U',
    descrizione:
      'Elevato numero di interferenze e di punti di conflitto, marcia stop & go a bassa velocità media, ' +
      'pavimentazioni eterogenee (sottoservizi, chiusini, binari, lapidei), arredo urbano a ridosso della carreggiata.',
  },
  {
    id: 'extraurbano',
    nome: 'Extraurbano',
    breve: 'E',
    descrizione:
      'Interferenze limitate, marcia continua a velocità elevata, geometria d’asse determinante (curve, raccordi, ' +
      'pendenze), margini con alberi, pali, barriere e accessi non pavimentati.',
  },
  {
    id: 'autostradale',
    nome: 'Autostradale',
    breve: 'A',
    descrizione:
      'Velocità massime, flussi intensi con elevata quota di mezzi pesanti, code e rallentamenti improvvisi, ' +
      'opere d’arte (viadotti, gallerie, svincoli), barriere continue su entrambi i margini.',
  },
];

export const INFRA_FACTORS: Labelled<InfraFactor>[] = [
  {
    id: 'visibilita',
    nome: 'Visibilità',
    breve: 'Vis',
    descrizione:
      'Distanza di visibilità inferiore allo spazio di arresto: curve in trincea, raccordi convessi, ostacoli laterali, ' +
      'sosta, illuminazione, abbagliamento. La moto ha punto di vista più basso in piega e sagoma frontale ridotta.',
  },
  {
    id: 'pavimentazione',
    nome: 'Stato della pavimentazione',
    breve: 'Pav',
    descrizione:
      'Ammaloramenti (ormaie, buche, fessure, lucidatura, trasudo, rappezzi), discontinuità (chiusini, giunti, binari), ' +
      'contaminanti (gasolio, ghiaia, fango, foglie), segnaletica orizzontale.',
  },
  {
    id: 'geometria',
    nome: 'Geometria d’asse',
    breve: 'Geo',
    descrizione:
      'Raggi planimetrici, curve a raggio variabile, successioni incoerenti, assenza di curve di transizione, ' +
      'pendenze longitudinali e trasversali, raccordi altimetrici e coordinamento plano-altimetrico, larghezza delle corsie.',
  },
  {
    id: 'arredo',
    nome: 'Arredo e margini',
    breve: 'Arr',
    descrizione:
      'Guard-rail e paletti di sostegno, New Jersey, pali, alberi, cordoli, isole, dissuasori, terminali e cuspidi: ' +
      'elementi che governano la GRAVITÀ dell’evento più che la sua probabilità.',
  },
];

export const OP_FACTORS: Labelled<OpFactor>[] = [
  {
    id: 'traffico',
    nome: 'Traffico e interferenze',
    breve: 'Tra',
    descrizione:
      'Densità del flusso, svolte, immissioni, sorpassi, sosta, pedoni e utenti deboli: tutte le manovre altrui che ' +
      'intersecano la traiettoria della moto.',
  },
  {
    id: 'rallentamenti',
    nome: 'Rallentamenti e code',
    breve: 'Cod',
    descrizione:
      'Code improvvise, stop & go, cantieri, restringimenti: forti differenziali di velocità e manovre di filtraggio.',
  },
  {
    id: 'mezzi-pesanti',
    nome: 'Mezzi pesanti',
    breve: 'MP',
    descrizione:
      'Ingombro e angoli ciechi, turbolenza aerodinamica e spray, carichi persi e sversamenti, ' +
      'ormaie generate dai carichi ripetuti.',
  },
];

export const ENV_FACTORS: Labelled<EnvFactor>[] = [
  { id: 'pioggia', nome: 'Pioggia / bagnato', breve: 'Pio', descrizione: 'Riduzione dell’aderenza, velo idrico, aquaplaning, spray.' },
  { id: 'notte', nome: 'Notte', breve: 'Not', descrizione: 'Visibilità affidata al faro, che in piega illumina l’esterno della curva.' },
  { id: 'abbagliamento', nome: 'Abbagliamento', breve: 'Abb', descrizione: 'Sole radente, fari, transizioni di luminanza in galleria.' },
  { id: 'vento', nome: 'Vento laterale', breve: 'Ven', descrizione: 'Raffiche su viadotti, uscite di galleria, scie dei mezzi pesanti.' },
  { id: 'temperatura', nome: 'Temperatura', breve: 'Tem', descrizione: 'Pneumatici freddi, ghiaccio in ombra, bitume morbido col caldo.' },
  { id: 'nebbia', nome: 'Nebbia', breve: 'Neb', descrizione: 'Riduzione della distanza di visibilità e della percezione delle velocità.' },
];

export const NATURES: Labelled<Nature>[] = [
  {
    id: 'infrastruttura',
    nome: 'Infrastrutturale',
    breve: 'I',
    descrizione: 'Il pericolo nasce dalla strada in sé, anche in assenza di altri veicoli.',
  },
  {
    id: 'esercizio',
    nome: 'D’esercizio',
    breve: 'E',
    descrizione: 'Il pericolo nasce dalle condizioni di circolazione e dalle manovre altrui.',
  },
  {
    id: 'combinato',
    nome: 'Combinato',
    breve: 'C',
    descrizione:
      'Il pericolo nasce dall’interazione: la strada da sola o il traffico da solo non basterebbero a generarlo.',
  },
];

/** Principi di dinamica cui gli scenari rimandano (pagine "Fondamenti"). */
export type PrincipleId =
  | 'aderenza'
  | 'ellisse'
  | 'frenata'
  | 'piega'
  | 'arresto'
  | 'visibilita-curva'
  | 'visibilita-verticale'
  | 'notte'
  | 'aquaplaning'
  | 'impatto'
  | 'velocita'
  | 'percezione';

export const levelLabel = (n: number) => ['', 'molto bassa', 'bassa', 'media', 'alta', 'molto alta'][n] ?? '';

/** Classe di rischio dalla matrice P × G (1..25). */
export function riskClass(P: number, G: number) {
  const r = P * G;
  if (r >= 16) return { r, classe: 'critico', livello: 4 } as const;
  if (r >= 10) return { r, classe: 'elevato', livello: 3 } as const;
  if (r >= 5) return { r, classe: 'medio', livello: 2 } as const;
  return { r, classe: 'basso', livello: 1 } as const;
}
