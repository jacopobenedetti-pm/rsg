import type { Vec2 } from './types';

export const v2 = (x: number, y: number): Vec2 => ({ x, y });
export const dist = (a: Vec2, b: Vec2) => Math.hypot(a.x - b.x, a.y - b.y);

/** Intersezione tra i segmenti p1-p2 e p3-p4: restituisce il parametro u su p1-p2 oppure null. */
export function segIntersect(p1: Vec2, p2: Vec2, p3: Vec2, p4: Vec2): number | null {
  const d1x = p2.x - p1.x;
  const d1y = p2.y - p1.y;
  const d2x = p4.x - p3.x;
  const d2y = p4.y - p3.y;
  const den = d1x * d2y - d1y * d2x;
  if (Math.abs(den) < 1e-12) return null;
  const u = ((p3.x - p1.x) * d2y - (p3.y - p1.y) * d2x) / den;
  const w = ((p3.x - p1.x) * d1y - (p3.y - p1.y) * d1x) / den;
  if (u < 0 || u > 1 || w < 0 || w > 1) return null;
  return u;
}

/** Primo parametro u in [0,1] lungo a-b in cui il segmento entra nel poligono (chiuso). */
export function segPolygonHit(a: Vec2, b: Vec2, poly: Vec2[]): number | null {
  let best: number | null = null;
  for (let i = 0; i < poly.length; i++) {
    const u = segIntersect(a, b, poly[i], poly[(i + 1) % poly.length]);
    if (u !== null && (best === null || u < best)) best = u;
  }
  return best;
}

/** Primo parametro u lungo a-b in cui il segmento attraversa la polilinea aperta. */
export function segPolylineHit(a: Vec2, b: Vec2, line: Vec2[]): number | null {
  let best: number | null = null;
  for (let i = 0; i + 1 < line.length; i++) {
    const u = segIntersect(a, b, line[i], line[i + 1]);
    if (u !== null && (best === null || u < best)) best = u;
  }
  return best;
}

export function pointInPolygon(p: Vec2, poly: Vec2[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

/** Rettangolo orientato (centro, heading in rad, lunghezza, larghezza) come poligono. */
export function orientedRect(c: Vec2, th: number, length: number, width: number): Vec2[] {
  const cx = Math.cos(th);
  const sx = Math.sin(th);
  const hl = length / 2;
  const hw = width / 2;
  const pts: [number, number][] = [
    [hl, hw],
    [hl, -hw],
    [-hl, -hw],
    [-hl, hw],
  ];
  return pts.map(([a, b]) => ({ x: c.x + a * cx - b * sx, y: c.y + a * sx + b * cx }));
}

export function polygonsOverlap(a: Vec2[], b: Vec2[]): boolean {
  for (const p of a) if (pointInPolygon(p, b)) return true;
  for (const p of b) if (pointInPolygon(p, a)) return true;
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      if (segIntersect(a[i], a[(i + 1) % a.length], b[j], b[(j + 1) % b.length]) !== null) return true;
    }
  }
  return false;
}

/** Distanza punto-segmento. */
export function pointSegDist(p: Vec2, a: Vec2, b: Vec2) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const l2 = dx * dx + dy * dy || 1e-9;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

export const smoothstep = (t: number) => t * t * (3 - 2 * t);

/** Interpolazione di un profilo [s, valore] con raccordi smoothstep. */
export function profileAt(profile: number | [number, number][], s: number): number {
  if (typeof profile === 'number') return profile;
  if (s <= profile[0][0]) return profile[0][1];
  for (let i = 1; i < profile.length; i++) {
    const [s1, d1] = profile[i];
    if (s <= s1) {
      const [s0, d0] = profile[i - 1];
      return d0 + (d1 - d0) * smoothstep((s - s0) / (s1 - s0));
    }
  }
  return profile[profile.length - 1][1];
}

export const wrapAngle = (a: number) => {
  while (a > Math.PI) a -= 2 * Math.PI;
  while (a < -Math.PI) a += 2 * Math.PI;
  return a;
};
