/**
 * Modello di rischio delle ormaie (Tesi Manutenzione, Cap. IV §2).
 *   sezione parabolica   y = (h/b²) x²
 *   velo idrico          h_g(x) = h − (h/b²) x²
 *   ascissa critica      x_crit = b · √((h − h_crit)/h)
 *   probabilità          P_h,l = ∫_{−x_crit}^{x_crit} f(x) dx    (f = dispersione gaussiana delle traiettorie)
 *                        P_dl  = k · Σ(l_d + l_s) / L_tot
 *                        P     = P_h,l · P_dl
 *   gravità              G = w · (½ (P/g) v² − P · f_attrito · l_diss),  f_attrito = 0.85 f_a,  w = A/R
 *
 * Nota di implementazione: la tesi lascia w da tarare sperimentalmente (A > 1, maggiore nelle curve
 * destrorse). Qui w vale 1 in rettifilo e max(1, A·R_rif/R) in curva, con R_rif = 100 m come
 * normalizzazione: serve al confronto relativo tra situazioni, non come valore assoluto.
 */
import { normCdf, G as g } from './units';
import { criticalWaterDepth, waterFilmFriction } from './friction';

export interface RutInput {
  /** profondità massima dell'ormaia [mm] */
  hMm: number;
  /** semi-larghezza b [m] */
  b: number;
  /** velocità media del flusso [km/h] */
  vKmh: number;
  /** scarto della dispersione delle traiettorie rispetto all'asse dell'ormaia [m] */
  sigma: number;
  /** spostamento medio delle traiettorie rispetto all'asse dell'ormaia [m] */
  mu?: number;
  tread?: 'battistrada' | 'liscio';
}

export function rutProbability({ hMm, b, vKmh, sigma, mu = 0, tread = 'battistrada' }: RutInput) {
  const hCrit = criticalWaterDepth(vKmh, tread);
  if (hMm <= hCrit) return { hCrit, xCrit: 0, P: 0 };
  const xCrit = b * Math.sqrt((hMm - hCrit) / hMm);
  const P = normCdf((xCrit - mu) / sigma) - normCdf((-xCrit - mu) / sigma);
  return { hCrit, xCrit, P };
}

/** P_dl: quota longitudinale del tratto interessato dalle ormaie. */
export const longitudinalDiffusion = (lengths: number[], Ltot: number, k = 1) =>
  Math.min(1, (k * lengths.reduce((a, b) => a + b, 0)) / Ltot);

/** Velo idrico nella sezione dell'ormaia alla distanza x dall'asse [mm]. */
export const waterDepthInRut = (hMm: number, b: number, x: number) => Math.max(0, hMm - (hMm / (b * b)) * x * x);

export interface RutSeverityInput {
  /** peso del veicolo [N] — per la moto si usa m·g */
  m: number;
  vKmh: number;
  /** velo idrico [mm] */
  waterMm: number;
  /** lunghezza di dissipazione tra perdita di aderenza e urto [m] */
  lDiss: number;
  /** raggio della curva [m] (Infinity in rettifilo) */
  R: number;
  /** coefficiente di taratura A (> 1; maggiore per le curve destrorse) */
  A?: number;
}

/** Energia residua all'impatto [J] e indice di gravità G. */
export function rutSeverity({ m, vKmh, waterMm, lDiss, R, A = 1.5 }: RutSeverityInput) {
  const v = vKmh / 3.6;
  const fa = waterFilmFriction(vKmh, waterMm);
  const fAttr = 0.85 * fa;
  const Ein = 0.5 * m * v * v;
  const Ediss = m * g * fAttr * lDiss;
  const Efin = Math.max(0, Ein - Ediss);
  const R_RIF = 100;
  const w = Number.isFinite(R) ? Math.max(1, (A * R_RIF) / R) : 1;
  return { fa, Ein, Ediss, Efin, w, G: w * Efin };
}
