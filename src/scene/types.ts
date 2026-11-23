/**
 * Descrizione dichiarativa di una scena. Le stesse strutture alimentano la vista dall'alto (SVG),
 * la vista in soggettiva (three.js) e la simulazione dinamica: la scena è una sola, le viste sono letture
 * diverse dello stesso modello.
 *
 * Convenzioni: coordinate mondo in metri, x verso est, y verso nord, z quota. Le strade hanno un'ascissa
 * curvilinea s lungo l'asse e un'ordinata d positiva verso DESTRA rispetto al verso di percorrenza.
 */
import type { SurfaceId } from '../physics/friction';

export interface Vec2 {
  x: number;
  y: number;
}

export type Segment =
  | { kind: 'rettifilo'; length: number }
  /** angle in gradi: positivo = curva a sinistra, negativo = curva a destra */
  | { kind: 'curva'; radius: number; angle: number }
  /** curva a raggio variabile linearmente da r0 a r1 (clotoide approssimata) */
  | { kind: 'transizione'; r0: number; r1: number; length: number; dir: 1 | -1 };

export type RoadStyle = 'urbano' | 'extraurbano' | 'autostrada' | 'rampa' | 'sterrato' | 'percorso';

export interface RoadSpec {
  id: string;
  style: RoadStyle;
  /** heading in gradi (0 = est, 90 = nord) */
  start: { x: number; y: number; heading: number };
  segments: Segment[];
  lanesRight: number;
  lanesLeft: number;
  laneWidth: number;
  shoulderRight?: number;
  shoulderLeft?: number;
  centerLine?: 'tratteggiata' | 'continua' | 'doppia' | 'nessuna';
  /** carreggiate separate: spartitraffico e carreggiata opposta (solo autostrada) */
  divided?: { median: number; oppositeLanes: number; barrier: 'newjersey' | 'guardrail' };
  /** profilo altimetrico come coppie (s, z) raccordate */
  elevation?: { s: number; z: number }[];
  /** marciapiede (urbano) */
  sidewalk?: number;
  /** strada che si innesta su un'altra: l'origine viene calcolata sul margine della strada madre */
  junction?: { road: string; s: number; side: 'left' | 'right'; angle?: number };
  /** percorso invisibile usato solo come traiettoria (svolte, rotatorie) */
  hidden?: boolean;
  /** strada ad anello (rotatoria) */
  ring?: boolean;
}

export type HazardKind =
  | 'buca'
  | 'ormaie'
  | 'gasolio'
  | 'ghiaia'
  | 'acqua'
  | 'chiusino'
  | 'strisce'
  | 'rotaie'
  | 'foglie'
  | 'sigillature'
  | 'lucidato'
  | 'giunto'
  | 'detrito'
  | 'fresato';

export interface HazardSpec {
  id: string;
  kind: HazardKind;
  road: string;
  s0: number;
  s1: number;
  d0: number;
  d1: number;
  shape?: 'rett' | 'ellisse';
  /** superficie che determina l'aderenza locale; se assente la zona non modifica l'aderenza */
  surface?: SurfaceId;
  /** altezza dell'oggetto se sporge dal piano viabile (detriti) [m] */
  height?: number;
  label?: string;
}

export type ObjectSpec =
  | { kind: 'edificio'; poly: Vec2[]; height: number; color?: string }
  | { kind: 'albero'; at: Vec2; r: number }
  | { kind: 'siepe' | 'muro' | 'scarpata'; line: Vec2[]; height: number; thickness: number; label?: string }
  | { kind: 'guardrail'; line: Vec2[]; dsm?: boolean; label?: string }
  | { kind: 'newjersey'; line: Vec2[] }
  | { kind: 'palo'; at: Vec2; tipo: 'luce' | 'linea' | 'segnale' }
  | { kind: 'delineatore'; at: Vec2; side: 'left' | 'right' }
  | { kind: 'isola'; center: Vec2; r: number }
  | { kind: 'cartello'; at: Vec2; text: string }
  | { kind: 'zebra'; road: string; s: number; width: number; d0: number; d1: number };

export type ActorKind = 'auto' | 'furgone' | 'camion' | 'autobus' | 'trattore' | 'moto' | 'pedone' | 'animale';

export interface MotionSample {
  t: number;
  s: number;
  v: number;
}

export interface ActorSpec {
  id: string;
  kind: ActorKind;
  label?: string;
  color?: string;
  road: string;
  /** offset laterale costante o profilo d(s) */
  d: number | [number, number][];
  /** legge del moto s(t) campionata */
  motion: MotionSample[];
  /** il veicolo procede in verso opposto all'asse della strada (d resta riferito all'asse) */
  reverse?: boolean;
  lights?: boolean;
  /** portiera aperta (lato sinistro) a partire dall'istante t */
  doorOpenAt?: number;
  indicator?: { side: 'left' | 'right'; from: number; to?: number };
}

export interface WatchTarget {
  /** attore o pericolo che il motociclista deve percepire */
  actor?: string;
  hazard?: string;
  /** istante da cui il bersaglio costituisce una minaccia (es. inizio della svolta) */
  from?: number;
  /** distanza minima di riconoscimento se la minaccia è un pericolo a terra (default 40 m) */
  range?: number;
  label: string;
}

export interface EgoSpec {
  road: string;
  s0: number;
  /** profilo laterale d(s) */
  d: number | [number, number][];
  /** velocità iniziale di default [km/h] */
  speed: number;
  /** limite di velocità vigente [km/h] */
  limit: number;
  /** cosa il motociclista deve riconoscere per iniziare la reazione */
  watch: WatchTarget[];
  /** accelerazione in marcia libera [m/s²] (es. uscita di curva) */
  accel?: { from: number; to: number; a: number; vMax: number };
}

export interface SceneNote {
  t: number;
  text: string;
}

export interface SceneSpec {
  id: string;
  duration: number;
  roads: RoadSpec[];
  hazards: HazardSpec[];
  objects: ObjectSpec[];
  actors: ActorSpec[];
  ego: EgoSpec;
  notes?: SceneNote[];
  /** inquadratura della vista dall'alto [x0, y0, x1, y1] */
  frame?: [number, number, number, number];
  /** condizioni ambientali di default */
  env?: { wet?: boolean; night?: boolean; rain?: boolean };
  /** superficie base della carreggiata */
  baseSurface?: SurfaceId;
  /** parametri esposti con i loro valori di default */
  params?: Partial<SimParams>;
  /** parametri da mostrare nel pannello */
  controls?: (keyof SimParams)[];
}

export interface SimParams {
  speed: number; // km/h
  tau: number; // s
  /** frazione dell'aderenza effettivamente utilizzata in frenata d'emergenza */
  effort: number;
  wet: boolean;
  night: boolean;
  abs: boolean;
  /** piega massima che il pilota è disposto/capace di raggiungere [°] */
  maxLean: number;
  /** distanza dal veicolo che precede espressa in secondi (dove previsto) */
  gap: number;
  /** spostamento laterale della traiettoria rispetto a quella di riferimento [m], positivo a destra */
  offset: number;
}

export const DEFAULT_PARAMS: SimParams = {
  speed: 50,
  tau: 1.0,
  effort: 0.75,
  wet: false,
  night: false,
  abs: true,
  maxLean: 42,
  gap: 1.5,
  offset: 0,
};
