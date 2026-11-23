/**
 * Equilibrio in curva e aderenza combinata.
 * Riferimenti: Tesi Progettazione Tav. 03 (angolo di inclinazione), Tav. 10 (equilibrio e normativa),
 * Tav. 11-16 (aderenza impegnata/disponibile, ellisse di aderenza).
 */
import { G, clamp } from './units';

/** Angolo di rollio rispetto alla verticale γ = arctan(v²/(gR)) [rad] — indipendente dalla sopraelevazione. */
export const leanAngle = (v: number, R: number) => Math.atan((v * v) / (G * R));

/**
 * Angolo rispetto alla normale al piano viabile φ con sopraelevazione q (= tan α):
 *   φ = arctan( (v²/gR − tan α) / (1 + v²/gR · tan α) ),   γ = α + φ.
 * tan φ è l'aderenza trasversale impegnata.
 */
export function leanOnBankedRoad(v: number, R: number, q: number) {
  const k = (v * v) / (G * R);
  const ft = (k - q) / (1 + k * q);
  return { phi: Math.atan(ft), gamma: Math.atan(q) + Math.atan(ft), ft };
}

/**
 * Inclinazione effettiva per la larghezza dello pneumatico (spostamento laterale del punto di contatto):
 *   φ_T = φ + arcsin( t·sin φ / (h − t) )
 * con t raggio della sezione trasversale dello pneumatico e h altezza del baricentro.
 */
export function effectiveLean(phi: number, t = 0.09, h = 0.65) {
  return phi + Math.asin(clamp((t * Math.sin(phi)) / (h - t), -1, 1));
}

/** Aderenza trasversale impegnata f_t = v²/(gR) − q (forma linearizzata usata dalla norma). */
export const requiredLateralFriction = (v: number, R: number, q = 0) => (v * v) / (G * R) - q;

/** Velocità limite in curva per una data aderenza trasversale disponibile. */
export const maxCornerSpeed = (R: number, fLat: number, q = 0) => Math.sqrt(Math.max(0, G * R * (fLat + q)));

/** Raggio di normativa R = v² / (g (q + f_t)). */
export const normRadius = (v: number, q: number, ft: number) => (v * v) / (G * (q + ft));

/**
 * Ellisse di aderenza (Tav. 14-15): x²/f_t² + y²/f_l² = 1.
 * Restituisce l'aderenza longitudinale ancora disponibile quando si impegna f_lat in direzione trasversale.
 */
export function remainingLongitudinal(fLat: number, fLatMax: number, fLongMax: number) {
  const r = fLat / fLatMax;
  if (Math.abs(r) >= 1) return 0;
  return fLongMax * Math.sqrt(1 - r * r);
}

/**
 * Aderenza disponibile nella direzione generica γ (angolo tra la risultante e l'asse longitudinale),
 * intersezione della retta di direzione γ con l'ellisse di semiassi f_l e f_t.
 */
export function frictionInDirection(gammaRad: number, fl: number, ft: number) {
  const c = Math.cos(gammaRad);
  const s = Math.sin(gammaRad);
  return 1 / Math.sqrt((c * c) / (fl * fl) + (s * s) / (ft * ft));
}

/** Abbassamento del punto di vista del pilota in piega: h_eff = h0 · cos γ. */
export const eyeHeightInLean = (h0: number, gamma: number) => h0 * Math.cos(gamma);

/** Ingombro laterale del capo del pilota oltre la linea di contatto delle ruote in piega: h_testa · sin γ. */
export const headOffsetInLean = (hHead: number, gamma: number) => hHead * Math.sin(gamma);
