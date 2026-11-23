/**
 * Funzioni di supporto per descrivere le scene in modo compatto.
 */
import type { MotionSample, ObjectSpec, RoadSpec, Segment, Vec2 } from './types';
import { RoadGeom } from './road';

export const str = (length: number): Segment => ({ kind: 'rettifilo', length });
/** curva: angle in gradi, positivo a sinistra */
export const arc = (radius: number, angle: number): Segment => ({ kind: 'curva', radius, angle });
export const spiral = (r0: number, r1: number, length: number, dir: 1 | -1): Segment => ({ kind: 'transizione', r0, r1, length, dir });

/** geometria di una strada (per posizionare oggetti e attori in fase di descrizione) */
export const geom = (spec: RoadSpec) => new RoadGeom(spec);

/** percorso invisibile che parte da una posa nota */
export function route(id: string, start: { x: number; y: number; th: number }, segments: Segment[]): RoadSpec {
  return {
    id,
    style: 'percorso',
    hidden: true,
    start: { x: start.x, y: start.y, heading: (start.th * 180) / Math.PI },
    segments,
    lanesRight: 1,
    lanesLeft: 0,
    laneWidth: 3.5,
  };
}

/**
 * Legge del moto per gli attori: si concatenano tratti a velocità costante, accelerazioni e soste.
 * Le velocità sono in km/h, le accelerazioni in m/s².
 */
export class Motion {
  private t = 0;
  private s: number;
  private v: number;
  private out: MotionSample[] = [];

  constructor(s0: number, vKmh: number, t0 = 0) {
    this.s = s0;
    this.v = vKmh / 3.6;
    this.t = t0;
    this.out.push({ t: t0, s: s0, v: this.v });
  }

  private step(dt: number, a: number) {
    const n = Math.max(1, Math.ceil(dt / 0.05));
    const h = dt / n;
    for (let i = 0; i < n; i++) {
      const v1 = Math.max(0, this.v + a * h);
      this.s += ((this.v + v1) / 2) * h;
      this.v = v1;
      this.t += h;
      this.out.push({ t: this.t, s: this.s, v: this.v });
    }
  }

  /** mantiene la velocità attuale per dt secondi */
  hold(dt: number) {
    if (dt > 0) this.step(dt, 0);
    return this;
  }

  /** mantiene la velocità attuale fino all'istante assoluto t */
  until(t: number) {
    return this.hold(t - this.t);
  }

  /** mantiene la velocità attuale fino alla progressiva s */
  untilS(s: number) {
    if (this.v <= 0) return this;
    return this.hold(Math.max(0, (s - this.s) / this.v));
  }

  /** porta la velocità a vKmh con accelerazione |a| */
  to(vKmh: number, a: number) {
    const target = vKmh / 3.6;
    const dv = target - this.v;
    if (Math.abs(dv) < 1e-6) return this;
    const acc = Math.sign(dv) * Math.abs(a);
    this.step(dv / acc, acc);
    this.v = target;
    return this;
  }

  /** si ferma esattamente alla progressiva s con decelerazione costante */
  stopAt(s: number) {
    const dist = s - this.s;
    if (dist <= 0 || this.v <= 0) {
      this.v = 0;
      return this;
    }
    const a = (this.v * this.v) / (2 * dist);
    this.step(this.v / a, -a);
    this.v = 0;
    this.s = s;
    this.out[this.out.length - 1].s = s;
    this.out[this.out.length - 1].v = 0;
    return this;
  }

  /** resta fermo per dt secondi */
  wait(dt: number) {
    this.v = 0;
    return this.hold(dt);
  }

  get time() {
    return this.t;
  }
  get pos() {
    return this.s;
  }

  build(duration = 30): MotionSample[] {
    if (this.t < duration) this.hold(duration - this.t);
    return this.out;
  }
}

export const motion = (s0: number, vKmh: number, t0 = 0) => new Motion(s0, vKmh, t0);
/** attore fermo */
export const still = (s: number): MotionSample[] => [
  { t: 0, s, v: 0 },
  { t: 1000, s, v: 0 },
];

/* ------------------------------------------------------------------------------------------------
 * Oggetti disposti lungo una strada
 * ------------------------------------------------------------------------------------------------ */

export function guardrail(g: RoadGeom, d: number, s0: number, s1: number, dsm = false): ObjectSpec {
  return { kind: 'guardrail', line: g.polyline(d, s0, s1, 1), dsm };
}

export function newjersey(g: RoadGeom, d: number, s0: number, s1: number): ObjectSpec {
  return { kind: 'newjersey', line: g.polyline(d, s0, s1, 2) };
}

export function hedge(g: RoadGeom, d: number, s0: number, s1: number, height = 2.2, kind: 'siepe' | 'muro' | 'scarpata' = 'siepe'): ObjectSpec {
  return { kind, line: g.polyline(d, s0, s1, 1), height, thickness: kind === 'scarpata' ? 6 : kind === 'muro' ? 0.4 : 1.2 };
}

export function treeRow(g: RoadGeom, d: number, s0: number, s1: number, step: number, r = 3, jitter = 0): ObjectSpec[] {
  const out: ObjectSpec[] = [];
  let i = 0;
  for (let s = s0; s <= s1; s += step) {
    const j = jitter ? Math.sin(i * 12.9898) * jitter : 0;
    out.push({ kind: 'albero', at: g.point(s, d + j), r: r * (0.85 + 0.3 * Math.abs(Math.sin(i * 3.7))) });
    i++;
  }
  return out;
}

export function poles(g: RoadGeom, d: number, s0: number, s1: number, step: number, tipo: 'luce' | 'linea' | 'segnale' = 'luce'): ObjectSpec[] {
  const out: ObjectSpec[] = [];
  for (let s = s0; s <= s1; s += step) out.push({ kind: 'palo', at: g.point(s, d), tipo });
  return out;
}

export function delineators(g: RoadGeom, dRight: number, dLeft: number, s0: number, s1: number, step = 25): ObjectSpec[] {
  const out: ObjectSpec[] = [];
  for (let s = s0; s <= s1; s += step) {
    out.push({ kind: 'delineatore', at: g.point(s, dRight), side: 'right' });
    out.push({ kind: 'delineatore', at: g.point(s, dLeft), side: 'left' });
  }
  return out;
}

/** fila di edifici lungo un lato della strada (isolati con varchi) */
export function buildings(g: RoadGeom, d: number, s0: number, s1: number, depth = 14, side: 'left' | 'right' = 'right', skip: [number, number][] = []): ObjectSpec[] {
  const out: ObjectSpec[] = [];
  let s = s0;
  let i = 0;
  const palette = ['#c9b8a6', '#b9a48f', '#d8cbbd', '#a89584', '#c2b3a3', '#bfae9a'];
  while (s < s1) {
    const len = 14 + ((i * 7) % 3) * 6;
    const e = Math.min(s1, s + len);
    if (!skip.some(([a, b]) => e > a && s < b)) {
      const sign = side === 'right' ? 1 : -1;
      const p: Vec2[] = [g.point(s, d), g.point(e, d), g.point(e, d + sign * depth), g.point(s, d + sign * depth)];
      out.push({ kind: 'edificio', poly: p, height: 12 + ((i * 5) % 4) * 3.5, color: palette[i % palette.length] });
    }
    s = e + 1.5;
    i++;
  }
  return out;
}
