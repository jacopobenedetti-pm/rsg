/** Costanti e conversioni di base. Tutte le grandezze interne sono SI (m, s, kg, rad). */

export const G = 9.81; // accelerazione di gravità [m/s²]
export const RHO_AIR = 1.225; // densità dell'aria [kg/m³]

export const kmh = (vKmh: number) => vKmh / 3.6; // km/h → m/s
export const toKmh = (v: number) => v * 3.6; // m/s → km/h
export const deg = (rad: number) => (rad * 180) / Math.PI;
export const rad = (d: number) => (d * Math.PI) / 180;

export const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Interpolazione lineare su una tabella [x, y] ordinata per x (con estrapolazione costante agli estremi). */
export function interp(table: ReadonlyArray<readonly [number, number]>, x: number): number {
  if (x <= table[0][0]) return table[0][1];
  const last = table[table.length - 1];
  if (x >= last[0]) return last[1];
  for (let i = 1; i < table.length; i++) {
    const [x1, y1] = table[i];
    if (x <= x1) {
      const [x0, y0] = table[i - 1];
      return lerp(y0, y1, (x - x0) / (x1 - x0));
    }
  }
  return last[1];
}

/** Funzione di ripartizione della normale standard (approssimazione di Abramowitz-Stegun 7.1.26). */
export function normCdf(z: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2);
  const y =
    1 -
    (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t) *
      Math.exp(-(z * z) / 2);
  return z >= 0 ? 0.5 * (1 + y) : 0.5 * (1 - y);
}
