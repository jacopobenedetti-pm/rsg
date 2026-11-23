/**
 * Gravità dell'evento: scivolamento, impatto con barriere e ostacoli fissi.
 * Riferimenti: Tesi Progettazione Tav. 14 (lavoro delle forze dissipative), Tav. 18 (barriere, HIC),
 * Tesi Manutenzione §IV.2.2 (G = w · E_fin).
 */
import { G } from './units';

/** Energia d'impatto trasversale sulla barriera L_c = ½ m (v sin θ)² [J]. */
export const barrierImpactEnergy = (m: number, v: number, theta: number) => 0.5 * m * (v * Math.sin(theta)) ** 2;

/** Velocità d'impatto dopo uno scivolamento di lunghezza l con coefficiente di attrito μ_s. */
export const speedAfterSlide = (v0: number, muSlide: number, l: number) =>
  Math.sqrt(Math.max(0, v0 * v0 - 2 * muSlide * G * l));

/**
 * Perdita di aderenza in curva di raggio R con ostacolo (barriera) a distanza b dalla traiettoria verso
 * l'esterno: il veicolo prosegue lungo la tangente e incontra l'ostacolo dopo l = √(2Rb + b²) con
 * angolo d'impatto θ = arccos(R/(R+b)).
 */
export function tangentExit(R: number, b: number) {
  return { length: Math.sqrt(2 * R * b + b * b), theta: Math.acos(R / (R + b)) };
}

/** Classi di contenimento delle barriere (Tav. 18) — L_c in kJ. */
export const BARRIER_CLASSES = [
  { classe: 'N1', tipo: 'minimo', Lc: 44 },
  { classe: 'N2', tipo: 'medio', Lc: 82 },
  { classe: 'H1', tipo: 'normale', Lc: 127 },
  { classe: 'H2', tipo: 'elevato', Lc: 288 },
  { classe: 'H3', tipo: 'elevatissimo', Lc: 463 },
  { classe: 'H4', tipo: 'tratti ad altissimo rischio', Lc: 572 },
] as const;

/** Ordine di grandezza dell'energia d'impatto del motociclista (Tav. 18): L_c,moto ≈ 5 kJ. */
export const LC_MOTO_KJ = 5;

/** Head Injury Criterion: scala delle conseguenze (Tav. 18). */
export const HIC_SCALE = [
  { max: 200, esito: 'leggera contusione' },
  { max: 400, esito: 'forte contusione, stordimento' },
  { max: 600, esito: 'leggera commozione cerebrale' },
  { max: 800, esito: 'forte commozione cerebrale' },
  { max: 1000, esito: 'perdita di conoscenza, possibile perdita di memoria' },
  { max: Infinity, esito: 'danni cerebrali permanenti, coma' },
] as const;

/** Valori HIC misurati all'impatto (Tav. 18). */
export const HIC_MISURATI = [
  { elemento: 'Lama metallica', hic: '800-1800' },
  { elemento: 'Paletto profilato', hic: '> 2000' },
  { elemento: 'Barriera con protezione continua (modello C.U.S.T.O.M., classe N2)', hic: '132' },
] as const;

/** Energia cinetica [J] */
export const kinetic = (m: number, v: number) => 0.5 * m * v * v;

/** Velocità equivalente di caduta libera [m] → utile per rendere percepibile la gravità dell'urto. */
export const equivalentFallHeight = (v: number) => (v * v) / (2 * G);
