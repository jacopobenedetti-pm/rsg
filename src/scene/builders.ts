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

/**
 * Dispositivo di ritenuta sul margine secondo la scelta dell'utente; "behind" è ciò che c'è oltre la barriera
 * (rilevato, alberi), presente in ogni caso: senza barriera è lì che finisce una scivolata.
 */
export function roadsideBarrier(g: RoadGeom, d: number, s0: number, s1: number, choice: 'nessuna' | 'paletti' | 'dsm', behind: ObjectSpec[] = []): ObjectSpec[] {
  if (choice === 'nessuna') return behind;
  return [guardrail(g, d, s0, s1, choice === 'dsm'), ...behind];
}

/** ciglio di rilevato lungo la strada */
export function embankment(g: RoadGeom, d: number, s0: number, s1: number, height: number): ObjectSpec {
  return { kind: 'rilevato', line: g.polyline(d, s0, s1, 1), height };
}

/** profilo altimetrico a pendenza costante tra s0 e s1 (i in frazione, negativo in discesa) con raccordi */
export function gradeProfile(s0: number, s1: number, i: number, total: number, z0 = 0) {
  const pts: { s: number; z: number }[] = [];
  for (let s = 0; s <= total + 50; s += 4) {
    const z = s <= s0 ? z0 : s <= s1 ? z0 + i * (s - s0) : z0 + i * (s1 - s0);
    pts.push({ s, z });
  }
  return pts;
}

/** coppia di ormaie nelle tracce delle ruote dei mezzi pesanti di una corsia [dSinistra, dDestra] */
export function rutPair(road: string, idPrefix: string, laneLeft: number, s0: number, s1: number, depth: number, b = 0.4, track = 2.05) {
  const c1 = laneLeft + 0.75;
  const c2 = c1 + track;
  return [
    { id: `${idPrefix}-sx`, kind: 'ormaie' as const, road, s0, s1, d0: c1 - b, d1: c1 + b, water: depth, label: `ormaia di ${depth} mm` },
    { id: `${idPrefix}-dx`, kind: 'ormaie' as const, road, s0, s1, d0: c2 - b, d1: c2 + b, water: depth, label: `ormaia di ${depth} mm` },
  ];
}

/**
 * Traiettoria laterale realistica per spostarsi da d0 a d1: arco di curvatura costante (accelerazione laterale
 * aLat), eventuale tratto rettilineo inclinato dell'angolo massimo, arco di ritorno. Restituisce un profilo fitto.
 * L'angolo raggiungibile dipende dalla velocità: a parità di spazio laterale, più si va forte più è piccolo.
 */
export function lanePath(s0: number, d0: number, d1: number, vKmh: number, aLat = 3, maxDeg = 30, holdMin = 0): [number, number][] {
  const v = Math.max(1, vKmh / 3.6);
  const R = (v * v) / aLat;
  const sign = Math.sign(d1 - d0) || 1;
  const D = Math.abs(d1 - d0);
  let psi = Math.acos(Math.max(-1, 1 - D / (2 * R)));
  let hold = 0;
  const cap = (maxDeg * Math.PI) / 180;
  if (psi > cap || holdMin > 0) {
    psi = Math.min(psi, cap);
    hold = Math.max(holdMin, (D - 2 * R * (1 - Math.cos(psi))) / Math.sin(psi));
    // con il tratto minimo imposto lo spostamento può superare D: si riduce l'angolo
    while (2 * R * (1 - Math.cos(psi)) + hold * Math.sin(psi) > D * 1.001 && psi > 0.01) {
      psi *= 0.97;
      hold = Math.max(holdMin, (D - 2 * R * (1 - Math.cos(psi))) / Math.sin(psi));
    }
  }
  const arc = R * psi;
  const total = 2 * arc + hold;
  const pts: [number, number][] = [[s0 - 5, d0]];
  let s = s0;
  let d = d0;
  let h = 0;
  const step = 0.25;
  let next = s0;
  for (let u = 0; u <= total; u += step) {
    const k = u < arc ? 1 / R : u < arc + hold ? 0 : -1 / R;
    h += k * step;
    s += Math.cos(h) * step;
    d += sign * Math.sin(h) * step;
    if (s >= next) {
      pts.push([s, d]);
      next += 0.5;
    }
  }
  // si mantiene la posizione effettivamente raggiunta, senza salti
  pts.push([s + 0.5, d]);
  pts.push([s + 400, d]);
  return pts;
}

/** profilo laterale costante prima e dopo una traiettoria calcolata */
export function withLead(d: number, path: [number, number][]): [number, number][] {
  return [[-1000, d], ...path];
}
