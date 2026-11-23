/**
 * Geometria delle strade: campionamento dell'asse, terne locali, bande trasversali e segnaletica.
 */
import type { RoadSpec, Segment, Vec2 } from './types';
import { interp } from '../physics/units';

export interface RoadSample {
  s: number;
  x: number;
  y: number;
  th: number;
  k: number;
  z: number;
}

export interface Pose {
  x: number;
  y: number;
  z: number;
  th: number;
  k: number;
}

const DS = 0.5;

export class RoadGeom {
  readonly spec: RoadSpec;
  readonly samples: RoadSample[];
  readonly length: number;
  /** estensione della pavimentazione a destra e a sinistra dell'asse */
  readonly right: number;
  readonly left: number;
  /** interruzioni della segnaletica di margine e del marciapiede in corrispondenza delle intersezioni */
  gaps: { side: 'left' | 'right'; s0: number; s1: number }[] = [];

  constructor(spec: RoadSpec, start: { x: number; y: number; heading: number } = spec.start) {
    this.spec = spec;
    const w = spec.laneWidth;
    this.right = spec.lanesRight * w + (spec.shoulderRight ?? 0);
    if (spec.divided) {
      const opp = spec.divided.oppositeLanes * w + (spec.shoulderLeft ?? 0) + (spec.shoulderRight ?? 0);
      this.left = (spec.shoulderLeft ?? 0) + spec.divided.median + opp;
    } else {
      this.left = spec.lanesLeft * w + (spec.shoulderLeft ?? 0);
    }
    this.samples = buildSamples(spec.segments, start);
    this.length = this.samples[this.samples.length - 1].s;
    // profilo altimetrico: interpolazione lineare tra punti fitti (la pendenza resta continua a tratti)
    if (spec.elevation) {
      const tab = spec.elevation.map((e) => [e.s, e.z] as [number, number]);
      for (const p of this.samples) p.z = interp(tab, p.s);
    }
  }

  at(s: number): RoadSample {
    const n = this.samples.length;
    if (this.spec.ring) {
      s = ((s % this.length) + this.length) % this.length;
    }
    if (s <= 0) return extrapolate(this.samples[0], s);
    if (s >= this.length) return extrapolate(this.samples[n - 1], s - this.length);
    const i = Math.min(n - 2, Math.floor(s / DS));
    const a = this.samples[i];
    const b = this.samples[i + 1];
    const t = (s - a.s) / (b.s - a.s || 1);
    let dth = b.th - a.th;
    if (dth > Math.PI) dth -= 2 * Math.PI;
    if (dth < -Math.PI) dth += 2 * Math.PI;
    return {
      s,
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
      th: a.th + dth * t,
      k: a.k + (b.k - a.k) * t,
      z: a.z + (b.z - a.z) * t,
    };
  }

  /** punto alla progressiva s e distanza d dall'asse (d > 0 verso destra) */
  pose(s: number, d = 0, reverse = false): Pose {
    const p = this.at(s);
    const x = p.x + d * Math.sin(p.th);
    const y = p.y - d * Math.cos(p.th);
    // curvatura del percorso traslato di d: k / (1 + k d) (d a destra riduce il raggio delle curve a destra)
    const k = p.k / (1 + p.k * d || 1);
    return { x, y, z: p.z, th: reverse ? p.th + Math.PI : p.th, k: reverse ? -k : k };
  }

  point(s: number, d = 0): Vec2 {
    const p = this.pose(s, d);
    return { x: p.x, y: p.y };
  }

  polyline(d: number, s0 = 0, s1 = this.length, step = 1): Vec2[] {
    const pts: Vec2[] = [];
    const n = Math.max(1, Math.ceil((s1 - s0) / step));
    for (let i = 0; i <= n; i++) pts.push(this.point(s0 + ((s1 - s0) * i) / n, d));
    return pts;
  }

  /** proiezione di un punto sull'asse (ricerca grossolana + raffinamento) */
  project(p: Vec2): { s: number; d: number } {
    let best = 0;
    let bd = Infinity;
    for (let i = 0; i < this.samples.length; i += 4) {
      const q = this.samples[i];
      const dd = (q.x - p.x) ** 2 + (q.y - p.y) ** 2;
      if (dd < bd) {
        bd = dd;
        best = i;
      }
    }
    for (let i = Math.max(0, best - 4); i < Math.min(this.samples.length, best + 5); i++) {
      const q = this.samples[i];
      const dd = (q.x - p.x) ** 2 + (q.y - p.y) ** 2;
      if (dd < bd) {
        bd = dd;
        best = i;
      }
    }
    const q = this.samples[best];
    const dx = p.x - q.x;
    const dy = p.y - q.y;
    const along = dx * Math.cos(q.th) + dy * Math.sin(q.th);
    const d = dx * Math.sin(q.th) - dy * Math.cos(q.th);
    return { s: q.s + along, d };
  }

  inGap(side: 'left' | 'right', s: number) {
    return this.gaps.some((g) => g.side === side && s >= g.s0 && s <= g.s1);
  }

  /** suddivide [0, L] escludendo le interruzioni per il lato indicato */
  spansOutsideGaps(side: 'left' | 'right'): [number, number][] {
    const gaps = this.gaps.filter((g) => g.side === side).sort((a, b) => a.s0 - b.s0);
    const spans: [number, number][] = [];
    let cur = 0;
    for (const g of gaps) {
      if (g.s0 > cur) spans.push([cur, g.s0]);
      cur = Math.max(cur, g.s1);
    }
    if (cur < this.length) spans.push([cur, this.length]);
    return spans;
  }
}

function extrapolate(p: RoadSample, ds: number): RoadSample {
  return { ...p, s: p.s + ds, x: p.x + Math.cos(p.th) * ds, y: p.y + Math.sin(p.th) * ds };
}

function buildSamples(segments: Segment[], start: { x: number; y: number; heading: number }): RoadSample[] {
  let x = start.x;
  let y = start.y;
  let th = (start.heading * Math.PI) / 180;
  let s = 0;
  const out: RoadSample[] = [];
  const push = (k: number) => out.push({ s, x, y, th, k, z: 0 });
  // curvatura alla progressiva locale u di ciascun segmento
  const curv = (seg: Segment, u: number) => {
    if (seg.kind === 'rettifilo') return 0;
    if (seg.kind === 'curva') return Math.sign(seg.angle) / seg.radius;
    const k0 = Number.isFinite(seg.r0) ? 1 / seg.r0 : 0;
    const k1 = Number.isFinite(seg.r1) ? 1 / seg.r1 : 0;
    return seg.dir * (k0 + (k1 - k0) * (u / seg.length));
  };
  const segLen = (seg: Segment) =>
    seg.kind === 'rettifilo' ? seg.length : seg.kind === 'curva' ? (Math.abs(seg.angle) * Math.PI * seg.radius) / 180 : seg.length;

  push(segments.length ? curv(segments[0], 0) : 0);
  for (const seg of segments) {
    const L = segLen(seg);
    const n = Math.max(1, Math.round(L / DS));
    const h = L / n;
    for (let i = 0; i < n; i++) {
      // integrazione al punto medio
      const k = curv(seg, (i + 0.5) * h);
      const thm = th + (k * h) / 2;
      x += Math.cos(thm) * h;
      y += Math.sin(thm) * h;
      th += k * h;
      s += h;
      push(curv(seg, (i + 1) * h));
    }
  }
  // ricampionamento a passo costante DS per un accesso diretto per indice
  const res: RoadSample[] = [];
  const total = out[out.length - 1].s;
  let j = 0;
  for (let si = 0; si <= total + 1e-6; si += DS) {
    while (j < out.length - 2 && out[j + 1].s < si) j++;
    const a = out[j];
    const b = out[Math.min(out.length - 1, j + 1)];
    const t = b.s > a.s ? (si - a.s) / (b.s - a.s) : 0;
    res.push({
      s: si,
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
      th: a.th + (b.th - a.th) * t,
      k: a.k + (b.k - a.k) * t,
      z: 0,
    });
  }
  return res;
}

/* ------------------------------------------------------------------------------------------------
 * Sezione trasversale: bande di pavimentazione e linee di segnaletica
 * ------------------------------------------------------------------------------------------------ */

export type BandKind = 'asfalto' | 'banchina' | 'spartitraffico' | 'marciapiede' | 'verde' | 'sterrato';

export interface Band {
  d0: number;
  d1: number;
  kind: BandKind;
  side?: 'left' | 'right';
}

export function roadBands(g: RoadGeom): Band[] {
  const sp = g.spec;
  if (sp.hidden) return [];
  const w = sp.laneWidth;
  const bands: Band[] = [];
  if (sp.divided) {
    const sl = sp.shoulderLeft ?? 0;
    const sr = sp.shoulderRight ?? 0;
    bands.push({ d0: -sl, d1: sp.lanesRight * w + sr, kind: 'asfalto' });
    const m0 = -sl - sp.divided.median;
    bands.push({ d0: m0, d1: -sl, kind: 'spartitraffico' });
    bands.push({ d0: -g.left, d1: m0, kind: 'asfalto' });
  } else {
    bands.push({ d0: -g.left, d1: g.right, kind: sp.style === 'sterrato' ? 'sterrato' : 'asfalto' });
  }
  if (sp.style === 'urbano' && sp.sidewalk) {
    bands.push({ d0: g.right, d1: g.right + sp.sidewalk, kind: 'marciapiede', side: 'right' });
    bands.push({ d0: -g.left - sp.sidewalk, d1: -g.left, kind: 'marciapiede', side: 'left' });
  } else if (sp.style === 'extraurbano' || sp.style === 'autostrada' || sp.style === 'rampa') {
    bands.push({ d0: g.right, d1: g.right + 1.2, kind: 'banchina', side: 'right' });
    bands.push({ d0: -g.left - 1.2, d1: -g.left, kind: 'banchina', side: 'left' });
  }
  return bands;
}

export type LineKind = 'tratteggiata' | 'continua' | 'margine';

export interface MarkLine {
  d: number;
  kind: LineKind;
  /** passo [tratto, vuoto] in metri per le linee tratteggiate */
  dash?: [number, number];
  side?: 'left' | 'right';
}

export function roadLines(g: RoadGeom): MarkLine[] {
  const sp = g.spec;
  if (sp.hidden || sp.style === 'percorso' || sp.style === 'sterrato') return [];
  const w = sp.laneWidth;
  const dash: [number, number] = sp.style === 'urbano' ? [3, 4.5] : [4.5, 7.5];
  const lines: MarkLine[] = [];
  const edges = sp.style !== 'urbano';
  if (sp.divided) {
    const sl = sp.shoulderLeft ?? 0;
    const sr = sp.shoulderRight ?? 0;
    for (let i = 1; i < sp.lanesRight; i++) lines.push({ d: i * w, kind: 'tratteggiata', dash });
    lines.push({ d: 0.1, kind: 'margine', side: 'left' });
    lines.push({ d: sp.lanesRight * w, kind: 'margine', side: 'right' });
    const o0 = -sl - sp.divided.median - sl; // margine interno della carreggiata opposta
    for (let i = 1; i < sp.divided.oppositeLanes; i++) lines.push({ d: o0 - i * w, kind: 'tratteggiata', dash });
    lines.push({ d: o0 - 0.1, kind: 'margine' });
    lines.push({ d: o0 - sp.divided.oppositeLanes * w, kind: 'margine' });
    void sr;
    return lines;
  }
  if (sp.lanesLeft > 0 && sp.lanesRight > 0) {
    const c = sp.centerLine ?? 'tratteggiata';
    if (c === 'doppia') {
      lines.push({ d: -0.12, kind: 'continua' }, { d: 0.12, kind: 'continua' });
    } else if (c !== 'nessuna') {
      lines.push({ d: 0, kind: c, dash });
    }
  }
  for (let i = 1; i < sp.lanesRight; i++) lines.push({ d: i * w, kind: 'tratteggiata', dash });
  for (let i = 1; i < sp.lanesLeft; i++) lines.push({ d: -i * w, kind: 'tratteggiata', dash });
  if (edges) {
    lines.push({ d: sp.lanesRight * w, kind: 'margine', side: 'right' });
    if (sp.lanesLeft > 0) lines.push({ d: -sp.lanesLeft * w, kind: 'margine', side: 'left' });
    else lines.push({ d: 0.1, kind: 'margine', side: 'left' });
  }
  return lines;
}

/** tratti [s0, s1] di una linea tratteggiata lungo la strada */
export function dashSpans(length: number, dash: [number, number], offset = 0): [number, number][] {
  const out: [number, number][] = [];
  const p = dash[0] + dash[1];
  for (let s = offset; s < length; s += p) out.push([s, Math.min(length, s + dash[0])]);
  return out;
}
