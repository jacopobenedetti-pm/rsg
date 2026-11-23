/**
 * Diagramma delle velocità: la moto raggiunge velocità più elevate tra due
 * curve perché accelera di più (a_M ≈ 2,0 m/s² contro a_A = 0,8 m/s² assunto dalla norma).
 *   L = V1 (V2 − V1)/a + ½ (V2 − V1)²/a
 */
export const A_AUTO_NORMA = 0.8; // m/s²
export const A_MOTO = 2.0; // m/s²

/** Lunghezza necessaria per passare da v1 a v2 [m/s] con accelerazione a. */
export const transitionLength = (v1: number, v2: number, a: number) => (v2 * v2 - v1 * v1) / (2 * a);

/** Velocità raggiunta dopo aver percorso L partendo da v1 con accelerazione a, limitata a vMax. */
export const speedAfter = (v1: number, L: number, a: number, vMax = Infinity) =>
  Math.min(vMax, Math.sqrt(v1 * v1 + 2 * a * L));

/** ΔV % massimo per categoria di strada. */
export const DELTA_V_TABLE = [
  { categoria: 'A - Autostrada', intervallo: '90-140', L: '222-554', vaL1: 110, dVmax: 127.2 },
  { categoria: 'B - Extraurbana principale', intervallo: '70-120', L: '183-458', vaL1: 90, dVmax: 133.3 },
  { categoria: 'C - Extraurbana secondaria', intervallo: '60-100', L: '123-308', vaL1: 76, dVmax: 131 },
  { categoria: 'F - Locale', intervallo: '40-100', L: '162-405', vaL1: 64, dVmax: 156 },
] as const;
