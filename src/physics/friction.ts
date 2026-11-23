/**
 * Aderenza pneumatico-pavimentazione.
 *
 * - Coefficienti di aderenza di normativa (DM 5/11/2001), riportati in Tesi Manutenzione §III.3 nota 27
 *   e in Tesi Progettazione Tav. 10/17.
 * - Valori indicativi di picco per superfici e contaminanti tipici (ordine di grandezza di letteratura,
 *   da usare per confronti relativi, non come dato di progetto).
 * - Curve aderenza / velocità / spessore del velo idrico digitalizzate dalle Fig. IV.1-IV.2 della Tesi
 *   Manutenzione (fonte originale: Ferrari-Giannini, "Geometria e progetto di strade").
 */
import { interp, clamp } from './units';

/** f_l longitudinale di normativa in funzione della velocità [km/h]. */
export const NORM_FL_STRADE: ReadonlyArray<readonly [number, number]> = [
  [25, 0.45],
  [40, 0.43],
  [60, 0.35],
  [80, 0.3],
  [100, 0.25],
  [120, 0.21],
];
export const NORM_FL_AUTOSTRADE: ReadonlyArray<readonly [number, number]> = [
  [80, 0.44],
  [100, 0.4],
  [120, 0.36],
  [140, 0.34],
];
/** f_t trasversale massima impegnabile di normativa (strade A, B, C, F extraurbane) — Tav. 10 e 17. */
export const NORM_FT: ReadonlyArray<readonly [number, number]> = [
  [40, 0.21],
  [60, 0.17],
  [80, 0.13],
  [100, 0.11],
];
/** Adeguamento di f_t proposto nella Tesi Progettazione (Tav. 17, esempio strada C1). */
export const NORM_FT_ADEGUATO_MOTO: ReadonlyArray<readonly [number, number]> = [
  [40, 0.13],
  [60, 0.1],
  [80, 0.07],
  [100, 0.06],
];

export const normFl = (vKmh: number, autostrada = false) =>
  interp(autostrada ? NORM_FL_AUTOSTRADE : NORM_FL_STRADE, vKmh);
export const normFt = (vKmh: number) => interp(NORM_FT, vKmh);

export type SurfaceId =
  | 'asfalto'
  | 'asfalto-usurato'
  | 'lucidato'
  | 'trasudo'
  | 'segnaletica'
  | 'chiusino'
  | 'rotaia'
  | 'lapideo'
  | 'ghiaia'
  | 'gasolio'
  | 'foglie'
  | 'fango'
  | 'sigillatura'
  | 'fresato'
  | 'giunto'
  | 'ghiaccio';

export interface Surface {
  id: SurfaceId;
  nome: string;
  /** coefficiente di aderenza di picco indicativo su asciutto */
  dry: number;
  /** coefficiente di aderenza di picco indicativo su bagnato */
  wet: number;
  nota: string;
}

export const SURFACES: Record<SurfaceId, Surface> = {
  asfalto: { id: 'asfalto', nome: 'Conglomerato in buono stato', dry: 0.95, wet: 0.65, nota: 'Micro e macrotessitura integre.' },
  'asfalto-usurato': { id: 'asfalto-usurato', nome: 'Conglomerato usurato', dry: 0.8, wet: 0.5, nota: 'Macrotessitura ridotta, minor drenaggio del velo idrico.' },
  lucidato: { id: 'lucidato', nome: 'Inerti lucidati', dry: 0.7, wet: 0.35, nota: 'Microtessitura rasata dal traffico (degrado B).' },
  trasudo: { id: 'trasudo', nome: 'Trasudo di bitume', dry: 0.55, wet: 0.3, nota: 'Legante in superficie, peggiora col caldo (degrado A).' },
  segnaletica: { id: 'segnaletica', nome: 'Segnaletica orizzontale', dry: 0.75, wet: 0.35, nota: 'Vernici e termoplastici a bassa tessitura.' },
  chiusino: { id: 'chiusino', nome: 'Chiusino / griglia metallica', dry: 0.45, wet: 0.15, nota: 'Metallo liscio, spesso con gradino.' },
  rotaia: { id: 'rotaia', nome: 'Rotaia tranviaria', dry: 0.35, wet: 0.12, nota: 'Acciaio levigato e gola che trattiene la ruota.' },
  lapideo: { id: 'lapideo', nome: 'Sampietrini / porfido lucidati', dry: 0.6, wet: 0.3, nota: 'Elementi lapidei levigati, giunti sconnessi.' },
  ghiaia: { id: 'ghiaia', nome: 'Ghiaia / sabbia su asfalto', dry: 0.4, wet: 0.3, nota: 'Granuli che rotolano sotto lo pneumatico.' },
  gasolio: { id: 'gasolio', nome: 'Gasolio / olio', dry: 0.2, wet: 0.12, nota: 'Film lubrificante, spesso invisibile.' },
  foglie: { id: 'foglie', nome: 'Foglie bagnate', dry: 0.4, wet: 0.2, nota: 'Strato organico che trattiene acqua.' },
  fango: { id: 'fango', nome: 'Fango', dry: 0.35, wet: 0.25, nota: 'Da accessi agricoli e cantieri.' },
  sigillatura: { id: 'sigillatura', nome: 'Sigillatura bituminosa', dry: 0.5, wet: 0.35, nota: 'Mastice liscio, morbido col caldo.' },
  fresato: { id: 'fresato', nome: 'Superficie fresata', dry: 0.7, wet: 0.45, nota: 'Solchi longitudinali che guidano la ruota.' },
  giunto: { id: 'giunto', nome: 'Giunto di dilatazione', dry: 0.45, wet: 0.15, nota: 'Elementi metallici trasversali.' },
  ghiaccio: { id: 'ghiaccio', nome: 'Ghiaccio', dry: 0.08, wet: 0.05, nota: 'Zone d’ombra, viadotti, gallerie in inverno.' },
};

export const surfaceMu = (id: SurfaceId, wet: boolean) => (wet ? SURFACES[id].wet : SURFACES[id].dry);

/* ------------------------------------------------------------------------------------------------
 * Velo idrico: curve f_a(V) per diversi spessori d'acqua (Fig. IV.1 lisci, IV.2 con battistrada 8 mm).
 * Ogni curva è una spezzata [V km/h, f_a]; lo spessore di riferimento è il valore centrale della fascia.
 * Sotto i 50 km/h le figure non riportano dati: si estrapola costante.
 * ------------------------------------------------------------------------------------------------ */
type Curve = { h: number; pts: ReadonlyArray<readonly [number, number]> };

const AQ_FLOOR = 0.03; // aderenza residua in aquaplaning conclamato (la tesi indica ~0.04)

export const WATER_CURVES_TREAD: Curve[] = [
  { h: 0, pts: [[50, 0.41], [52, 0.4], [80, 0.34], [102, 0.3], [131, 0.23], [160, 0.17]] },
  { h: 1, pts: [[50, 0.4], [52, 0.4], [80, 0.34], [102, 0.3], [131, 0.23], [160, 0.17]] },
  { h: 7, pts: [[50, 0.34], [52, 0.336], [80, 0.19], [95, AQ_FLOOR]] },
  { h: 12, pts: [[49, 0.29], [65, 0.15], [80, AQ_FLOOR]] },
  { h: 20, pts: [[40, 0.2], [60, AQ_FLOOR]] },
];

export const WATER_CURVES_SMOOTH: Curve[] = [
  { h: 0, pts: [[48, 0.235], [100, 0.14], [144, 0.063]] },
  { h: 0.5, pts: [[48, 0.231], [100, 0.14], [144, 0.063]] },
  { h: 5.5, pts: [[49, 0.2], [89, AQ_FLOOR]] },
  { h: 7.5, pts: [[50, 0.17], [66, AQ_FLOOR]] },
  { h: 12, pts: [[50, 0.11], [58, AQ_FLOOR]] },
  { h: 20, pts: [[40, 0.08], [50, AQ_FLOOR]] },
];

function curveAt(c: Curve, vKmh: number) {
  return Math.max(AQ_FLOOR, interp(c.pts, vKmh));
}

/**
 * Coefficiente di aderenza f_a (scala normativa) in funzione di velocità e spessore del velo idrico.
 * Interpolazione lineare tra le curve delle figure di riferimento.
 */
export function waterFilmFriction(vKmh: number, waterMm: number, tread: 'battistrada' | 'liscio' = 'battistrada') {
  const curves = tread === 'battistrada' ? WATER_CURVES_TREAD : WATER_CURVES_SMOOTH;
  const h = clamp(waterMm, 0, curves[curves.length - 1].h);
  for (let i = 1; i < curves.length; i++) {
    if (h <= curves[i].h) {
      const a = curves[i - 1];
      const b = curves[i];
      const t = (h - a.h) / (b.h - a.h || 1);
      return curveAt(a, vKmh) * (1 - t) + curveAt(b, vKmh) * t;
    }
  }
  return curveAt(curves[curves.length - 1], vKmh);
}

/**
 * Altezza critica del velo idrico [mm] in funzione della velocità (andamento qualitativo di Fig. IV.9),
 * tarata sui punti di innesco dell'aquaplaning delle Fig. IV.1-IV.2:
 *  - battistrada: 12 mm → 80 km/h, 7 mm → 95 km/h
 *  - liscio: 12 mm → 58 km/h, 5.5 mm → 89 km/h
 */
export function criticalWaterDepth(vKmh: number, tread: 'battistrada' | 'liscio' = 'battistrada') {
  return tread === 'battistrada' ? 212 * Math.exp(-0.0359 * vKmh) : 51.7 * Math.exp(-0.0252 * vKmh);
}

/** Velocità di innesco dell'aquaplaning [km/h] per un dato spessore d'acqua (inversa della precedente). */
export function aquaplaningSpeed(waterMm: number, tread: 'battistrada' | 'liscio' = 'battistrada') {
  if (waterMm <= 0) return Infinity;
  return tread === 'battistrada' ? Math.log(212 / waterMm) / 0.0359 : Math.log(51.7 / waterMm) / 0.0252;
}
