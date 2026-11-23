/**
 * Frenata: trasferimento di carico, spazi di arresto moto/auto.
 * Riferimenti: Tesi Progettazione Tav. 02 (equilibrio in frenata), Tav. 06 (verifica spazi d'arresto),
 * Tav. 09 (accelerazioni di riferimento), Tesi Manutenzione §III.3 (d_a = v²/2gf).
 */
import { G, RHO_AIR, clamp } from './units';

export interface MotoGeometry {
  /** passo p [m] */
  p: number;
  /** distanza baricentro - asse posteriore b [m] */
  b: number;
  /** altezza del baricentro h [m] */
  h: number;
}

/** Geometria di riferimento della Tesi Progettazione (Tav. 02): h = 0.70 m, p = 1.40 m, b = 0.70 m. */
export const MOTO_RIF: MotoGeometry = { p: 1.4, b: 0.7, h: 0.7 };

/**
 * Ripartizione dei carichi verticali in frenata con decelerazione a = F/(m g) [in g]:
 *   N_F = mg (b/p + a h/p)      N_R = mg ((p-b)/p - a h/p)
 */
export function loadTransfer(aG: number, geo: MotoGeometry = MOTO_RIF) {
  const front = geo.b / geo.p + (aG * geo.h) / geo.p;
  const rear = (geo.p - geo.b) / geo.p - (aG * geo.h) / geo.p;
  return { front: clamp(front, 0, 1), rear: clamp(rear, 0, 1) };
}

/** Decelerazione [g] oltre la quale la ruota posteriore si scarica completamente (ribaltamento in avanti). */
export const stoppieLimit = (geo: MotoGeometry = MOTO_RIF) => (geo.p - geo.b) / geo.h;

/** Decelerazione massima [g] in funzione dell'aderenza e dei freni utilizzati. */
export function maxDeceleration(mu: number, brakes: 'combinata' | 'anteriore' | 'posteriore', geo: MotoGeometry = MOTO_RIF) {
  const lim = stoppieLimit(geo);
  switch (brakes) {
    case 'combinata':
      return Math.min(mu, lim);
    case 'anteriore':
      return Math.min((mu * geo.b) / (geo.p - mu * geo.h), lim);
    case 'posteriore':
      return (mu * (geo.p - geo.b)) / (geo.p + mu * geo.h);
  }
}

/**
 * Quota della forza frenante che spetta al posteriore nella ripartizione ottimale (a = μ).
 * Con la geometria di riferimento: μ = 0.30 → 35 %, μ = 0.85 → 7 % (Tav. 02).
 */
export const rearShareAtLimit = (mu: number, geo: MotoGeometry = MOTO_RIF) => loadTransfer(mu, geo).rear;

/** Tempo psicotecnico di percezione-reazione secondo DM 5/11/2001: τ = 2.8 − 0.01·V [s] (V in km/h). */
export const normReactionTime = (vKmh: number) => clamp(2.8 - 0.01 * vKmh, 1.0, 2.8);

export interface VehicleParams {
  /** massa [kg] (veicolo + occupanti) */
  m: number;
  /** area frontale × coefficiente di resistenza aerodinamica [m²] */
  CxS: number;
  /** coefficiente di resistenza al rotolamento */
  fr: number;
  /** coefficiente delle masse rotanti δ */
  delta: number;
}

export const MOTO: VehicleParams = { m: 280, CxS: 0.55, fr: 0.015, delta: 0.06 };
export const AUTO: VehicleParams = { m: 1400, CxS: 0.7, fr: 0.012, delta: 0.04 };

export interface StoppingInput {
  v: number; // m/s
  /** tempo di percezione e reazione [s] */
  tau: number;
  /** aderenza longitudinale impegnata [-] */
  f: number;
  /** pendenza longitudinale [%] (+ salita, − discesa) */
  grade?: number;
  veh?: VehicleParams;
  /** se true integra resistenza aerodinamica, rotolamento e masse rotanti (Tav. 06) */
  full?: boolean;
}

export interface StoppingResult {
  reaction: number; // spazio percorso nel tempo di reazione [m]
  braking: number; // spazio di frenatura [m]
  total: number;
  time: number; // tempo totale all'arresto [s]
}

/** Spazio di arresto d = v·τ + v²/(2 g (f ± i)), opzionalmente integrato con le resistenze al moto. */
export function stoppingDistance({ v, tau, f, grade = 0, veh = MOTO, full = false }: StoppingInput): StoppingResult {
  const reaction = v * tau;
  const i = grade / 100;
  if (!full) {
    const den = 2 * G * Math.max(0.01, f + i);
    const braking = (v * v) / den;
    return { reaction, braking, total: reaction + braking, time: tau + v / (G * Math.max(0.01, f + i)) };
  }
  // integrazione numerica: (1+δ) m dv/dt = -(f m g + fr m g + m g i + ½ ρ CxS v²)
  let vv = v;
  let s = 0;
  let t = 0;
  const dt = 0.002;
  while (vv > 0.01 && t < 60) {
    const decel = (G * (f + veh.fr + i) + (0.5 * RHO_AIR * veh.CxS * vv * vv) / veh.m) / (1 + veh.delta);
    const a = Math.max(0.05, decel);
    s += vv * dt - 0.5 * a * dt * dt;
    vv -= a * dt;
    t += dt;
  }
  return { reaction, braking: s, total: reaction + s, time: tau + t };
}

/** Velocità residua [m/s] dopo aver percorso la distanza disponibile d con frenata a decelerazione aG. */
export function residualSpeed(v: number, tau: number, aG: number, d: number) {
  const dBrake = d - v * tau;
  if (dBrake <= 0) return v;
  const v2 = v * v - 2 * aG * G * dBrake;
  return v2 > 0 ? Math.sqrt(v2) : 0;
}
