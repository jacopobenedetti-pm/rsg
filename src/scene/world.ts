/**
 * Compilazione della scena: risolve gli innesti tra strade, calcola i poligoni dei pericoli,
 * raccoglie occlusori e ostacoli, fornisce lo stato degli attori nel tempo.
 */
import type { ActorKind, ActorSpec, HazardSpec, ObjectSpec, SceneSpec, Vec2 } from './types';
import { RoadGeom } from './road';
import { orientedRect, profileAt } from './geometry';
import { SURFACES } from '../physics/friction';

export const ACTOR_DIMS: Record<ActorKind, { l: number; w: number; h: number }> = {
  auto: { l: 4.3, w: 1.8, h: 1.45 },
  furgone: { l: 5.4, w: 2.0, h: 2.4 },
  camion: { l: 16.5, w: 2.55, h: 3.9 },
  autobus: { l: 12, w: 2.55, h: 3.1 },
  trattore: { l: 4.2, w: 2.3, h: 2.8 },
  moto: { l: 2.1, w: 0.8, h: 1.35 },
  pedone: { l: 0.5, w: 0.6, h: 1.7 },
  animale: { l: 1.4, w: 0.5, h: 1.0 },
};

/** geometria dell'autoarticolato: motrice, ralla, semirimorchio */
const TRUCK = { cab: 6.2, trailer: 13.6, kingpinBehindCab: 1.9, kingpinToAxle: 7.7, kingpinToTrailerCenter: 5.6, refToCab: 5.15 };

export interface HazardWorld {
  spec: HazardSpec;
  poly: Vec2[];
  center: Vec2;
  mu: { dry: number; wet: number } | null;
}

export interface Occluder {
  poly: Vec2[];
  height: number;
  closed: boolean;
}

export interface Body {
  x: number;
  y: number;
  th: number;
  l: number;
  w: number;
  /** parte del veicolo: motrice, rimorchio o veicolo intero */
  part: 'intero' | 'motrice' | 'rimorchio';
}

export interface ActorState {
  x: number;
  y: number;
  z: number;
  th: number;
  v: number;
  /** ingombro in pianta: un poligono per ciascun corpo (gli autoarticolati ne hanno due) più la portiera aperta */
  polys: Vec2[][];
  bodies: Body[];
  /** angolo di apertura della portiera [rad] */
  door: number;
}

export type BarrierKind = 'guardrail' | 'newjersey' | 'muro' | 'edificio' | 'scarpata' | 'rilevato' | 'terminale';

export interface Barrier {
  line: Vec2[];
  kind: BarrierKind;
  dsm?: boolean;
  height?: number;
  tipo?: 'spigolo' | 'terminale' | 'attenuatore';
}

export interface Post {
  at: Vec2;
  r: number;
  kind: 'albero' | 'palo' | 'spigolo' | 'terminale' | 'attenuatore' | 'cono';
}

export interface World {
  spec: SceneSpec;
  roads: Map<string, RoadGeom>;
  hazards: HazardWorld[];
  occluders: Occluder[];
  /** barriere, muri e cigli lineari contro cui può terminare una scivolata */
  barriers: Barrier[];
  /** ostacoli puntuali */
  posts: Post[];
  actorState: (a: ActorSpec, t: number) => ActorState;
  bounds: [number, number, number, number];
}

export function compileWorld(spec: SceneSpec): World {
  const roads = new Map<string, RoadGeom>();
  // le strade innestate dipendono dalla strada madre: si risolvono in ordine
  const pending = [...spec.roads];
  let guard = 0;
  while (pending.length && guard++ < 100) {
    const sp = pending.shift()!;
    if (sp.junction) {
      const parent = roads.get(sp.junction.road);
      if (!parent) {
        pending.push(sp);
        continue;
      }
      const side = sp.junction.side;
      const d = side === 'right' ? parent.right : -parent.left;
      const p = parent.pose(sp.junction.s, d);
      const ang = sp.junction.angle ?? 90;
      const heading = ((p.th * 180) / Math.PI + (side === 'right' ? -ang : ang)) % 360;
      const g = new RoadGeom(sp, { x: p.x, y: p.y, heading });
      roads.set(sp.id, g);
      const half = (g.left + g.right) / 2 + 3;
      const gs = sp.junction.s;
      parent.gaps.push({ side, s0: gs - half, s1: gs + half });
    } else {
      roads.set(sp.id, new RoadGeom(sp));
    }
  }

  const hazards: HazardWorld[] = spec.hazards.map((h) => {
    const g = roads.get(h.road)!;
    const poly: Vec2[] = [];
    if (h.shape === 'ellisse') {
      const sc = (h.s0 + h.s1) / 2;
      const dc = (h.d0 + h.d1) / 2;
      const rs = (h.s1 - h.s0) / 2;
      const rd = (h.d1 - h.d0) / 2;
      for (let i = 0; i < 20; i++) {
        const a = (i / 20) * Math.PI * 2;
        // leggera irregolarità del contorno per buche e macchie
        const wob = h.kind === 'buca' || h.kind === 'gasolio' || h.kind === 'acqua' ? 1 + 0.12 * Math.sin(3 * a + h.s0) : 1;
        poly.push(g.point(sc + rs * Math.cos(a) * wob, dc + rd * Math.sin(a) * wob));
      }
    } else {
      const n = Math.max(1, Math.ceil((h.s1 - h.s0) / 2));
      for (let i = 0; i <= n; i++) poly.push(g.point(h.s0 + ((h.s1 - h.s0) * i) / n, h.d0));
      for (let i = n; i >= 0; i--) poly.push(g.point(h.s0 + ((h.s1 - h.s0) * i) / n, h.d1));
    }
    const center = g.point((h.s0 + h.s1) / 2, (h.d0 + h.d1) / 2);
    const mu = h.surface ? { dry: SURFACES[h.surface].dry, wet: SURFACES[h.surface].wet } : null;
    return { spec: h, poly, center, mu };
  });

  const occluders: Occluder[] = [];
  const barriers: Barrier[] = [];
  const posts: Post[] = [];
  for (const o of spec.objects) collectObject(o, roads, occluders, barriers, posts);

  // semirimorchi: la direzione segue la motrice con la cinematica della ralla (il rimorchio taglia le curve)
  const trailerTables = new Map<string, { dt: number; th: Float64Array }>();
  const cabPose = (a: ActorSpec, t: number) => {
    const g = roads.get(a.road)!;
    const m = sampleMotion(a.motion, t);
    const sr = a.reverse ? 2 * a.motion[0].s - m.s : m.s;
    const dir = a.reverse ? -1 : 1;
    const so = sr + dir * TRUCK.refToCab;
    const q = g.pose(so, profileAt(a.d, so), a.reverse);
    return { x: q.x, y: q.y, th: q.th, sr, z: q.z, v: m.v };
  };
  for (const a of spec.actors) {
    if (a.kind !== 'camion') continue;
    const dt = 0.02;
    const T = Math.max(40, spec.duration + 15);
    const n = Math.ceil(T / dt);
    const th = new Float64Array(n + 1);
    let prev = cabPose(a, 0);
    let tt = prev.th;
    th[0] = tt;
    for (let i = 1; i <= n; i++) {
      const c = cabPose(a, i * dt);
      const kp = { x: c.x - Math.cos(c.th) * TRUCK.kingpinBehindCab, y: c.y - Math.sin(c.th) * TRUCK.kingpinBehindCab };
      const kp0 = { x: prev.x - Math.cos(prev.th) * TRUCK.kingpinBehindCab, y: prev.y - Math.sin(prev.th) * TRUCK.kingpinBehindCab };
      const vx = kp.x - kp0.x;
      const vy = kp.y - kp0.y;
      const ds = Math.hypot(vx, vy);
      if (ds > 1e-6) {
        const heading = Math.atan2(vy, vx);
        let rel = heading - tt;
        while (rel > Math.PI) rel -= 2 * Math.PI;
        while (rel < -Math.PI) rel += 2 * Math.PI;
        tt += (ds / TRUCK.kingpinToAxle) * Math.sin(rel);
      }
      th[i] = tt;
      prev = c;
    }
    trailerTables.set(a.id, { dt, th });
  }

  const actorState = (a: ActorSpec, t: number): ActorState => {
    const g = roads.get(a.road)!;
    const m = sampleMotion(a.motion, t);
    // per i veicoli in senso opposto la legge del moto è una distanza percorsa: la progressiva decresce
    const sr = a.reverse ? 2 * a.motion[0].s - m.s : m.s;
    const d = profileAt(a.d, sr);
    const p = g.pose(sr, d, a.reverse);
    // direzione effettiva del moto: tiene conto della variazione di d lungo s (cambi di corsia)
    let th = p.th;
    if (typeof a.d !== 'number') {
      const d2 = profileAt(a.d, sr + 1);
      th += Math.atan2(-(d2 - d), 1);
    }
    const dims = ACTOR_DIMS[a.kind];
    let bodies: Body[];
    if (a.kind === 'camion') {
      const c = cabPose(a, t);
      const tab = trailerTables.get(a.id)!;
      const idx = Math.min(tab.th.length - 1, Math.max(0, Math.round(t / tab.dt)));
      const tth = tab.th[idx];
      const kp = { x: c.x - Math.cos(c.th) * TRUCK.kingpinBehindCab, y: c.y - Math.sin(c.th) * TRUCK.kingpinBehindCab };
      bodies = [
        { x: c.x, y: c.y, th: c.th, l: TRUCK.cab, w: dims.w, part: 'motrice' },
        { x: kp.x - Math.cos(tth) * TRUCK.kingpinToTrailerCenter, y: kp.y - Math.sin(tth) * TRUCK.kingpinToTrailerCenter, th: tth, l: TRUCK.trailer, w: dims.w, part: 'rimorchio' },
      ];
    } else {
      bodies = [{ x: p.x, y: p.y, th, l: dims.l, w: dims.w, part: 'intero' }];
    }
    const polys = bodies.map((b) => orientedRect({ x: b.x, y: b.y }, b.th, b.l, b.w));
    // portiera anteriore sinistra: si apre fino a 65° in 0,6 s
    let door = 0;
    if (a.doorOpenAt !== undefined && t >= a.doorOpenAt) {
      door = Math.min(1, (t - a.doorOpenAt) / 0.6) * ((65 * Math.PI) / 180);
      const b = bodies[0];
      const hinge = { x: b.x + Math.cos(b.th) * 0.6 - Math.sin(b.th) * (b.w / 2), y: b.y + Math.sin(b.th) * 0.6 + Math.cos(b.th) * (b.w / 2) };
      const dth = b.th + Math.PI - door; // da chiusa (verso il retro) ruota verso l'esterno, a sinistra
      const len = 1.05;
      const tip = { x: hinge.x + Math.cos(dth) * len, y: hinge.y + Math.sin(dth) * len };
      const nx = -Math.sin(dth) * 0.08;
      const ny = Math.cos(dth) * 0.08;
      polys.push([hinge, tip, { x: tip.x + nx, y: tip.y + ny }, { x: hinge.x + nx, y: hinge.y + ny }]);
    }
    return { x: p.x, y: p.y, z: p.z, th, v: m.v, polys, bodies, door };
  };

  // bounding box
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const g of roads.values()) {
    if (g.spec.hidden) continue;
    for (const p of g.samples) {
      x0 = Math.min(x0, p.x);
      y0 = Math.min(y0, p.y);
      x1 = Math.max(x1, p.x);
      y1 = Math.max(y1, p.y);
    }
  }
  return { spec, roads, hazards, occluders, barriers, posts, actorState, bounds: spec.frame ?? [x0 - 20, y0 - 20, x1 + 20, y1 + 20] };
}

function collectObject(o: ObjectSpec, roads: Map<string, RoadGeom>, occ: Occluder[], bar: Barrier[], posts: Post[]) {
  switch (o.kind) {
    case 'edificio':
      occ.push({ poly: o.poly, height: o.height, closed: true });
      bar.push({ line: [...o.poly, o.poly[0]], kind: 'edificio' });
      break;
    case 'siepe':
    case 'muro':
    case 'scarpata':
      occ.push({ poly: o.line, height: o.height, closed: false });
      if (o.kind !== 'siepe') bar.push({ line: o.line, kind: o.kind });
      break;
    case 'guardrail':
      bar.push({ line: o.line, kind: 'guardrail', dsm: o.dsm });
      break;
    case 'newjersey':
      bar.push({ line: o.line, kind: 'newjersey' });
      occ.push({ poly: o.line, height: 1.0, closed: false });
      break;
    case 'rilevato':
      bar.push({ line: o.line, kind: 'rilevato', height: o.height });
      break;
    case 'albero':
      posts.push({ at: o.at, r: 0.35, kind: 'albero' });
      occ.push({ poly: circlePoly(o.at, 0.4), height: 6, closed: true });
      break;
    case 'palo':
      posts.push({ at: o.at, r: 0.15, kind: 'palo' });
      break;
    case 'terminale': {
      // testata della cuspide: fronte trasversale di 3 m che intercetta chi scivola nella zebratura
      const nx = -Math.sin(o.th);
      const ny = Math.cos(o.th);
      bar.push({ line: [{ x: o.at.x - nx * 2, y: o.at.y - ny * 2 }, { x: o.at.x + nx * 2, y: o.at.y + ny * 2 }], kind: 'terminale', tipo: o.tipo });
      break;
    }
    case 'galleria': {
      const g = roads.get(o.road)!;
      // pareti della galleria: occludono e contengono
      for (const d of [o.d0, o.d1]) {
        const line = g.polyline(d, o.s0, o.s1, 2);
        occ.push({ poly: line, height: o.height, closed: false });
        bar.push({ line, kind: 'muro' });
      }
      break;
    }
    case 'spartitraffico':
      occ.push({ poly: o.poly, height: 0.15, closed: true });
      break;
    default:
      break;
  }
}

function circlePoly(c: Vec2, r: number, n = 8): Vec2[] {
  return Array.from({ length: n }, (_, i) => ({
    x: c.x + r * Math.cos((i / n) * Math.PI * 2),
    y: c.y + r * Math.sin((i / n) * Math.PI * 2),
  }));
}

export function sampleMotion(m: ActorSpec['motion'], t: number) {
  if (t <= m[0].t) return { s: m[0].s, v: m[0].v };
  const last = m[m.length - 1];
  if (t >= last.t) return { s: last.s + last.v * (t - last.t), v: last.v };
  let lo = 0;
  let hi = m.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (m[mid].t <= t) lo = mid;
    else hi = mid;
  }
  const a = m[lo];
  const b = m[hi];
  const u = (t - a.t) / (b.t - a.t || 1);
  return { s: a.s + (b.s - a.s) * u, v: a.v + (b.v - a.v) * u };
}
