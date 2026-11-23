/**
 * Visuali libere.
 * Contenuti: visibilità per l'arresto, raccordi altimetrici, marcia notturna e riduzione del cono luminoso
 * in piega.
 */
import { clamp } from './units';

/**
 * Distanza di visibilità in curva planimetrica (misurata lungo la traiettoria) con ostacolo laterale
 * (scarpata in trincea, siepe, muro) a distanza m dalla traiettoria dell'occhio: D = 2R · arccos(1 − m/R).
 */
export function curveSightDistance(R: number, m: number) {
  return 2 * R * Math.acos(clamp(1 - m / R, -1, 1));
}

/** Franco laterale necessario per garantire una visuale D in curva di raggio R: m = R (1 − cos(D / 2R)). */
export const clearanceForSight = (R: number, D: number) => R * (1 - Math.cos(D / (2 * R)));

/**
 * Raccordo convesso (dosso): distanza di visibilità tra occhio a quota h1 e ostacolo a quota h2.
 * Caso D ≤ L: D = √(2 Rv) (√h1 + √h2).
 */
export const crestSightDistance = (Rv: number, h1: number, h2: number) =>
  Math.sqrt(2 * Rv) * (Math.sqrt(h1) + Math.sqrt(h2));

/** Raggio verticale convesso minimo per garantire D: Rv = D² / (2 (h1 + h2 + 2√(h1 h2))). */
export const crestRadiusFor = (D: number, h1: number, h2: number) =>
  (D * D) / (2 * (h1 + h2 + 2 * Math.sqrt(h1 * h2)));

/**
 * Raccordo concavo di notte: il fascio del faro (altezza hf, apertura verso l'alto θ) illumina fino a D con
 * Rv = D² / (2 (hf + D sin θ)). Restituisce D risolvendo l'equazione di secondo grado.
 */
export function sagHeadlightDistance(Rv: number, hf: number, thetaRad: number) {
  // D² − 2 Rv sinθ D − 2 Rv hf = 0
  const b = 2 * Rv * Math.sin(thetaRad);
  return (b + Math.sqrt(b * b + 8 * Rv * hf)) / 2;
}

/**
 * Portata utile del faro in curva: il fascio è orientato lungo la tangente; la traiettoria se ne discosta di
 * circa d²/2R, quindi il centro del fascio esce dalla corsia (margine laterale e) dopo d ≈ √(2 R e + e²).
 */
export const headlightReachInCurve = (R: number, e: number) => Math.sqrt(2 * R * e + e * e);

/**
 * Illuminazione laterale del fascio (sezione frontale):
 *   rettilineo  x_int = x_ext = h · tan β
 *   in piega    x_int = h cos φ · tan(β − φ),  x_ext = h cos φ · tan(β + φ)
 * con h altezza del faro e β semi-apertura del fascio rispetto alla verticale.
 */
export function headlightLateralSpread(h: number, beta: number, phi: number) {
  const hc = h * Math.cos(phi);
  const xInt = beta - phi > 0 ? hc * Math.tan(beta - phi) : 0;
  const xExt = beta + phi < Math.PI / 2 - 0.01 ? hc * Math.tan(beta + phi) : Infinity;
  return { xInt, xExt };
}
