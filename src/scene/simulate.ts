/**
 * Simulazione dinamica del motociclista (ego) in una scena.
 *
 * Fasi: marcia → percezione (il bersaglio diventa minaccia ED è visibile) → reazione (τ) → frenata.
 * Ad ogni passo si confronta l'aderenza impegnata con quella disponibile (ellisse di aderenza):
 *  - richiesta trasversale > aderenza locale            → caduta (scivolata laterale, low-side)
 *  - richiesta trasversale > piega accettata dal pilota → allargamento della traiettoria
 *  - frenata oltre il residuo dell'ellisse               → con ABS la decelerazione viene limitata,
 *                                                          senza ABS bloccaggio dell'anteriore e caduta
 * Dopo una caduta moto e pilota scivolano lungo la direzione del moto fino all'arresto o all'urto.
 */
import type { SceneSpec, SimParams, Vec2, WatchTarget } from './types';
import { compileWorld, ACTOR_DIMS, type World } from './world';
import { orientedRect, pointInPolygon, polygonsOverlap, profileAt, segPolygonHit, segPolylineHit, wrapAngle } from './geometry';
import { G, kmh, toKmh, deg } from '../physics/units';
import { surfaceMu } from '../physics/friction';

export type Phase = 'marcia' | 'reazione' | 'frenata' | 'velocità adeguata' | 'fermo' | 'fuori traiettoria' | 'scivolata' | 'urto';

export interface EgoFrame {
  t: number;
  x: number;
  y: number;
  z: number;
  th: number;
  v: number;
  /** decelerazione longitudinale [m/s²] */
  a: number;
  /** angolo di rollio [rad], positivo a sinistra */
  lean: number;
  s: number;
  d: number;
  phase: Phase;
  /** aderenza disponibile locale e componenti impegnate (in g) */
  mu: number;
  fx: number;
  fy: number;
  hazard?: string;
  /** visibilità di ciascun bersaglio sorvegliato */
  seen: boolean[];
}

export interface SimEvent {
  t: number;
  kind: 'percezione' | 'frenata' | 'abs' | 'arresto' | 'caduta' | 'urto' | 'uscita' | 'invasione' | 'nota';
  label: string;
  x: number;
  y: number;
}

export interface Outcome {
  kind: 'evitato' | 'urto' | 'caduta' | 'uscita' | 'nessuno';
  title: string;
  detail: string;
  impactKmh?: number;
  energyKJ?: number;
}

export interface SimResult {
  world: World;
  dt: number;
  frames: EgoFrame[];
  events: SimEvent[];
  outcome: Outcome;
  metrics: {
    perceptionT?: number;
    perceptionDist?: number;
    brakeT?: number;
    /** spazio d'arresto teorico alla velocità iniziale con i parametri scelti */
    stopDistance: number;
    decel: number;
    muBase: number;
  };
}

const EYE_H = 1.3; // altezza dell'occhio del motociclista in marcia verticale [m]
const RIDER_MASS = 85; // massa del pilota per l'energia d'impatto del corpo [kg]
const BIKE_MASS = 280; // massa del complesso moto + pilota [kg]
const MU_SLIDE = 0.55; // attrito di strisciamento di moto e pilota sull'asfalto
const HEADLIGHT_RANGE = 55; // portata utile dell'anabbagliante [m]
const HEADLIGHT_HALF = (14 * Math.PI) / 180; // semiapertura orizzontale del fascio

export function simulate(spec: SceneSpec, P: SimParams): SimResult {
  const world = compileWorld(spec);
  const ego = spec.ego;
  const g = world.roads.get(ego.road)!;
  const dt = 1 / 100;
  const n = Math.round(spec.duration / dt);
  const muBase = surfaceMu(spec.baseSurface ?? 'asfalto', P.wet);
  const aCmdNominal = P.effort * muBase * G;
  const maxLeanF = Math.tan((P.maxLean * Math.PI) / 180);
  const urbanLit = spec.roads.some((r) => r.style === 'urbano');

  const frames: EgoFrame[] = [];
  const events: SimEvent[] = [];
  let outcome: Outcome | null = null;

  let s = ego.s0;
  let v = kmh(P.speed);
  let mode: 'ride' | 'free' | 'slide' | 'stopped' | 'crashed' = 'ride';
  let x = 0;
  let y = 0;
  let z = 0;
  let th = 0;
  let lean = 0;
  let freeTurn = 0;
  let perceptionT: number | undefined;
  let perceptionDist: number | undefined;
  let brakeT: number | undefined;
  let absShown = false;
  let invaded = false;
  let lastPhase: Phase = 'marcia';
  const perceived = ego.watch.map(() => false);
  const bumped = new Set<string>();

  const addEvent = (kind: SimEvent['kind'], label: string, t: number) => events.push({ t, kind, label, x, y });

  const hasElevation = !!g.spec.elevation;

  /** visibilità di un bersaglio dall'occhio del motociclista */
  const isVisible = (w: WatchTarget, t: number, eye: { x: number; y: number; z: number }): boolean => {
    let pts: Vec2[] = [];
    let tz = 0;
    let lit = false;
    let range = 400;
    let tg = 0;
    if (w.actor) {
      const a = spec.actors.find((q) => q.id === w.actor);
      if (!a) return false;
      const st = world.actorState(a, t);
      pts = [{ x: st.x, y: st.y }, ...st.polys.flat()];
      tz = ACTOR_DIMS[a.kind].h;
      tg = st.z;
      lit = !!a.lights;
    } else if (w.hazard) {
      const h = world.hazards.find((q) => q.spec.id === w.hazard);
      if (!h) return false;
      pts = [h.center, ...h.poly.filter((_, i) => i % 5 === 0)];
      tz = h.spec.height ?? 0.05;
      range = w.range ?? 40;
      tg = g.at(g.project(h.center).s).z;
    }
    const night = P.night && !urbanLit;
    for (const p of pts) {
      const dx = p.x - eye.x;
      const dy = p.y - eye.y;
      const dd = Math.hypot(dx, dy);
      if (dd > range) continue;
      if (night && !lit) {
        // fascio dell'anabbagliante: centrato sulla direzione di marcia; in piega l'interno curva resta in ombra
        const ang = wrapAngle(Math.atan2(dy, dx) - th);
        const inside = Math.sign(ang) === Math.sign(lean) && Math.abs(lean) > 0.02;
        const factor = inside ? Math.max(0.2, 1 - Math.abs(lean) / 0.7) : 1;
        if (Math.abs(ang) > HEADLIGHT_HALF * factor + 0.03 || dd > HEADLIGHT_RANGE * (inside ? factor : 1)) continue;
      }
      if (losClear(eye, { x: p.x, y: p.y, z: tg + tz }, w.actor, t)) return true;
    }
    return false;
  };

  const groundZ = (p: Vec2) => (hasElevation ? g.at(g.project(p).s).z : 0);

  const losClear = (eye: { x: number; y: number; z: number }, tgt: { x: number; y: number; z: number }, skipActor: string | undefined, t: number) => {
    const sight = (u: number) => eye.z + (tgt.z - eye.z) * u;
    const base = (u: number) => (hasElevation ? groundZ({ x: eye.x + (tgt.x - eye.x) * u, y: eye.y + (tgt.y - eye.y) * u }) : 0);
    for (const o of world.occluders) {
      const u = o.closed ? segPolygonHit(eye, tgt, o.poly) : segPolylineHit(eye, tgt, o.poly);
      if (u !== null && u > 0.001 && u < 0.999 && sight(u) < base(u) + o.height) return false;
    }
    for (const a of spec.actors) {
      if (a.id === skipActor) continue;
      const st = world.actorState(a, t);
      for (const poly of st.polys) {
        const u = segPolygonHit(eye, tgt, poly);
        if (u !== null && u > 0.01 && u < 0.99 && sight(u) < st.z + ACTOR_DIMS[a.kind].h) return false;
      }
    }
    if (hasElevation) {
      for (let i = 1; i < 16; i++) {
        const u = i / 16;
        if (sight(u) < base(u) + 0.05) return false;
      }
    }
    return true;
  };

  const nMax = n + Math.round(10 / dt);
  let following = false;
  let firstWatch = -1;
  let minGap = Infinity;
  let slideFrom: Vec2 | null = null;
  for (let i = 0; i <= nMax; i++) {
    // oltre la durata nominale si prosegue solo finché la manovra è in corso
    if (i > n && !((mode === 'ride' && brakeT !== undefined && !following && v > 0.01) || mode === 'slide' || mode === 'free')) break;
    const t = i * dt;
    let k = 0;
    let d = 0;
    if (mode === 'ride' || mode === 'stopped') {
      d = profileAt(ego.d, s) + P.offset;
      const p = g.pose(s, d);
      x = p.x;
      y = p.y;
      z = p.z;
      th = p.th;
      k = p.k;
      // effetto del cambio di corsia sulla direzione
      if (typeof ego.d !== 'number') {
        const d2 = profileAt(ego.d, s + 1) + P.offset;
        th += Math.atan2(-(d2 - d), 1);
      }
    }

    // aderenza locale (zona di pericolo più critica sotto la ruota)
    let muLoc = muBase;
    let hazardId: string | undefined;
    for (const h of world.hazards) {
      if (!h.mu) continue;
      if (pointInPolygon({ x, y }, h.poly)) {
        const m = P.wet ? h.mu.wet : h.mu.dry;
        if (m < muLoc) {
          muLoc = m;
          hazardId = h.spec.id;
        }
      }
    }

    // urto della ruota contro buche e oggetti in carreggiata
    if (mode === 'ride') {
      for (const h of world.hazards) {
        if ((h.spec.kind !== 'buca' && h.spec.kind !== 'detrito') || bumped.has(h.spec.id)) continue;
        if (pointInPolygon({ x, y }, h.poly)) {
          bumped.add(h.spec.id);
          const what = h.spec.label ?? h.spec.kind;
          if (v > kmh(30)) {
            mode = 'slide';
            addEvent('caduta', `Caduta: la ruota anteriore urta ${what} a ${toKmh(v).toFixed(0)} km/h`, t);
          } else {
            addEvent('nota', `Sobbalzo su ${what} a ${toKmh(v).toFixed(0)} km/h: controllo mantenuto`, t);
          }
        }
      }
    }

    // percezione
    const eye = { x, y, z: z + EYE_H * Math.cos(lean) };
    const seen = ego.watch.map((w, wi) => {
      const active = t >= (w.from ?? 0);
      const vis = mode === 'ride' || mode === 'stopped' || mode === 'free' ? isVisible(w, t, eye) : false;
      if (active && vis && !perceived[wi]) {
        perceived[wi] = true;
        if (perceptionT === undefined) {
          perceptionT = t;
          firstWatch = wi;
          const tg = w.actor ? spec.actors.find((a) => a.id === w.actor) : undefined;
          const tp = tg ? world.actorState(tg, t) : world.hazards.find((h) => h.spec.id === w.hazard)?.center;
          perceptionDist = tp ? Math.hypot(tp.x - x, tp.y - y) : undefined;
          addEvent('percezione', `Percezione: ${w.label}`, t);
        }
      }
      return vis;
    });

    // comando di frenata: verso l'arresto se il bersaglio è fermo o trasversale, fino alla sua velocità
    // (componente lungo la direzione della moto) se procede nello stesso verso
    let vTarget = 0;
    const tw = firstWatch >= 0 ? ego.watch[firstWatch] : undefined;
    const tActor = tw?.actor ? spec.actors.find((a) => a.id === tw.actor) : undefined;
    if (tActor) {
      const st = world.actorState(tActor, t);
      vTarget = Math.max(0, st.v * Math.cos(st.th - th));
      const gap = Math.hypot(st.x - x, st.y - y) - 1.05 - ACTOR_DIMS[tActor.kind].l / 2;
      if (mode === 'ride' && gap < minGap) minGap = gap;
    }
    const reacting = mode === 'ride' && perceptionT !== undefined && t >= perceptionT + P.tau;
    const braking = reacting && v > 0 && (vTarget < 0.3 || v > vTarget + 0.05);
    following = reacting && !braking && vTarget > 0.3;
    if (braking && brakeT === undefined) {
      brakeT = t;
      addEvent('frenata', 'Inizio frenata', t);
    }

    let fx = braking ? aCmdNominal / G : 0;
    const aLat = v * v * k;
    let fy = Math.abs(aLat) / G;
    let phase: Phase = lastPhase;

    if (mode === 'ride') {
      if (fy > muLoc + 1e-3) {
        mode = 'slide';
        addEvent('caduta', hazardId ? `Caduta: aderenza insufficiente su ${labelOf(spec, hazardId)}` : 'Caduta: aderenza trasversale insufficiente', t);
      } else if (fy > maxLeanF && Math.abs(k) > 1e-4) {
        mode = 'free';
        freeTurn = Math.sign(k);
        addEvent('uscita', `La piega necessaria (${deg(Math.atan(fy)).toFixed(0)}°) supera quella del pilota: la traiettoria si allarga`, t);
      } else if (braking) {
        const avail = muLoc * Math.sqrt(Math.max(0, 1 - (fy / muLoc) ** 2));
        if (fx > avail) {
          if (P.abs) {
            fx = avail;
            if (!absShown) {
              absShown = true;
              addEvent('abs', 'Interviene l’ABS: decelerazione limitata dall’aderenza', t);
            }
          } else {
            mode = 'slide';
            addEvent('caduta', `Caduta: bloccaggio dell’anteriore${hazardId ? ' su ' + labelOf(spec, hazardId) : ''}`, t);
          }
        }
      }
    }

    // accelerazione libera prevista dalla scena (es. tra due curve)
    let accel = 0;
    if (mode === 'ride' && !braking && ego.accel && s >= ego.accel.from && s <= ego.accel.to && v < kmh(ego.accel.vMax)) {
      accel = ego.accel.a;
    }

    // integrazione
    if (mode === 'ride') {
      v = Math.max(0, v + (accel - fx * G) * dt);
      if (following) v = Math.min(v, vTarget);
      s += v * dt;
      lean = lean + (Math.atan(aLat / G) - lean) * Math.min(1, dt * 8);
      phase = braking ? 'frenata' : following ? 'velocità adeguata' : perceptionT !== undefined ? 'reazione' : 'marcia';
      if (v <= 0.01 && braking) {
        mode = 'stopped';
        v = 0;
        addEvent('arresto', 'Moto ferma', t);
      }
    } else if (mode === 'free') {
      // il pilota cerca di seguire la curvatura della strada, ma la velocità di imbardata è limitata
      // dall'aderenza o dalla piega che accetta: v·k_strada richiesta, g·f/v massima
      const fAvail = Math.min(muLoc * 0.95, maxLeanF);
      const kRoad = g.at(g.project({ x, y }).s).k;
      const yawMax = v > 0.5 ? (G * fAvail) / v : 0;
      const yaw = Math.max(-yawMax, Math.min(yawMax, v * kRoad));
      void freeTurn;
      th += yaw * dt;
      v = Math.max(0, v - 0.05 * G * dt);
      x += Math.cos(th) * v * dt;
      y += Math.sin(th) * v * dt;
      lean = Math.atan((v * yaw) / G);
      fy = Math.abs(v * yaw) / G;
      phase = 'fuori traiettoria';
      const pr = g.project({ x, y });
      d = pr.d;
      s = pr.s;
      z = g.at(s).z;
      if (!invaded && !g.spec.divided && g.spec.lanesLeft > 0 && pr.d < 0) {
        invaded = true;
        addEvent('invasione', 'Invasione della corsia opposta', t);
      }
      if (pr.d > g.right + 0.3 || pr.d < -g.left - 0.3) {
        mode = 'slide';
        addEvent('uscita', 'Uscita dalla carreggiata', t);
      }
    } else if (mode === 'slide') {
      if (!slideFrom) slideFrom = { x, y };
      v = Math.max(0, v - MU_SLIDE * G * dt);
      x += Math.cos(th) * v * dt;
      y += Math.sin(th) * v * dt;
      lean = lean + (Math.sign(lean || 1) * 1.3 - lean) * Math.min(1, dt * 6);
      phase = 'scivolata';
      fx = MU_SLIDE;
      if (v <= 0.01) {
        mode = 'crashed';
        if (!outcome) {
          const cause = [...events].reverse().find((e) => e.kind === 'caduta' || e.kind === 'uscita');
          const len = slideFrom ? Math.hypot(x - slideFrom.x, y - slideFrom.y) : 0;
          outcome = {
            kind: 'caduta',
            title: 'Caduta',
            detail: `${cause ? cause.label.replace(/^Caduta: /, '') + '. ' : ''}Moto e pilota scivolano per ${len.toFixed(0)} m e si arrestano senza urtare ostacoli.`,
          };
        }
      }
    } else if (mode === 'stopped') {
      phase = 'fermo';
      fx = 0;
    } else {
      phase = 'urto';
    }

    // urti
    if (mode === 'ride' || mode === 'free' || mode === 'slide') {
      const prev = frames.length ? frames[frames.length - 1] : null;
      // ingombro dinamico: in piega il busto e il capo sporgono verso l'interno di circa 1,5 m · sin(γ)
      const head = mode === 'slide' ? 1.0 : 1.5 * Math.sin(Math.abs(lean));
      const off = (Math.sign(lean) * head) / 2;
      const egoPoly = orientedRect({ x: x - Math.sin(th) * off, y: y + Math.cos(th) * off }, th, 2.1, 0.8 + head);
      for (const a of spec.actors) {
        const st = world.actorState(a, t);
        if (st.polys.some((poly) => polygonsOverlap(egoPoly, poly))) {
          const vx = Math.cos(th) * v - Math.cos(st.th) * st.v;
          const vy = Math.sin(th) * v - Math.sin(st.th) * st.v;
          const rel = Math.hypot(vx, vy);
          const m = mode === 'slide' ? RIDER_MASS : BIKE_MASS;
          addEvent('urto', `Urto contro ${a.label ?? a.kind} a ${toKmh(rel).toFixed(0)} km/h`, t);
          outcome = {
            kind: 'urto',
            title: mode === 'slide' ? `Caduta e urto a ${toKmh(rel).toFixed(0)} km/h` : `Urto a ${toKmh(rel).toFixed(0)} km/h`,
            detail: `${mode === 'slide' ? 'Dopo la caduta, il corpo del motociclista urta' : 'La moto urta'} ${a.label ?? a.kind}. Energia cinetica relativa ${(0.5 * m * rel * rel / 1000).toFixed(1)} kJ, pari a una caduta da ${((rel * rel) / (2 * G)).toFixed(1)} m.`,
            impactKmh: toKmh(rel),
            energyKJ: (0.5 * m * rel * rel) / 1000,
          };
          mode = 'crashed';
          break;
        }
      }
      if (mode !== 'crashed' && prev && (mode === 'slide' || mode === 'free')) {
        const p0 = { x: prev.x, y: prev.y };
        const p1 = { x, y };
        for (const b of world.barriers) {
          const u = segPolylineHit(p0, p1, b.line);
          if (u !== null) {
            const seg = nearestSegmentDir(b.line, p1);
            const theta = Math.abs(Math.sin(th - seg));
            const vt = v * theta;
            const ek = (0.5 * RIDER_MASS * v * v) / 1000;
            const what = b.kind === 'guardrail' ? (b.dsm ? 'barriera con protezione per motociclisti' : 'guard-rail a paletti') : b.kind === 'newjersey' ? 'barriera New Jersey' : b.kind;
            addEvent('urto', `Impatto contro ${what} a ${toKmh(v).toFixed(0)} km/h`, t);
            outcome = {
              kind: 'urto',
              title: `Impatto contro ${what}`,
              detail: `Velocità d’impatto ${toKmh(v).toFixed(0)} km/h con angolo di ${deg(Math.asin(Math.min(1, theta))).toFixed(0)}°: energia del corpo ${ek.toFixed(1)} kJ, componente trasversale ${((0.5 * RIDER_MASS * vt * vt) / 1000).toFixed(2)} kJ. ${b.kind === 'guardrail' && !b.dsm ? 'Il corpo scivola sotto la lama e incontra i paletti (HIC > 2000, Tav. 18).' : ''}`,
              impactKmh: toKmh(v),
              energyKJ: ek,
            };
            x = prev.x + (x - prev.x) * u;
            y = prev.y + (y - prev.y) * u;
            mode = 'crashed';
            break;
          }
        }
        if (mode !== 'crashed') {
          for (const pst of world.posts) {
            if (Math.hypot(pst.at.x - x, pst.at.y - y) < pst.r + 0.45) {
              const ek = (0.5 * RIDER_MASS * v * v) / 1000;
              addEvent('urto', `Impatto contro ${pst.kind} a ${toKmh(v).toFixed(0)} km/h`, t);
              outcome = {
                kind: 'urto',
                title: `Impatto contro ${pst.kind === 'albero' ? 'un albero' : 'un palo'}`,
                detail: `Velocità d’impatto ${toKmh(v).toFixed(0)} km/h, energia ${ek.toFixed(1)} kJ concentrata su un ostacolo rigido.`,
                impactKmh: toKmh(v),
                energyKJ: ek,
              };
              mode = 'crashed';
              break;
            }
          }
        }
      }
      if (mode === 'crashed') {
        v = 0;
        phase = 'urto';
      }
    }

    lastPhase = phase;
    frames.push({ t, x, y, z, th, v, a: fx * G, lean, s, d, phase, mu: muLoc, fx, fy, hazard: hazardId, seen });
  }

  if (!outcome) {
    const last = frames[frames.length - 1];
    const fall = events.find((e) => e.kind === 'caduta');
    if (fall) {
      outcome = { kind: 'caduta', title: 'Caduta', detail: fall.label.replace(/^Caduta: /, '') + '.' };
    } else if (last.phase === 'fermo') {
      const gap = nearestTargetGap(spec, world, last);
      outcome = {
        kind: 'evitato',
        title: 'Arresto in sicurezza',
        detail: gap !== undefined ? `La moto si ferma con un margine di ${gap.toFixed(1)} m dal bersaglio.` : 'La moto si ferma senza urti.',
      };
    } else if (events.some((e) => e.kind === 'uscita' || e.kind === 'invasione')) {
      outcome = { kind: 'uscita', title: 'Uscita di traiettoria', detail: 'La moto non riesce a mantenere la traiettoria della curva.' };
    } else if (perceptionT === undefined) {
      outcome = { kind: 'nessuno', title: 'Nessun conflitto', detail: 'Nella finestra simulata il pericolo non entra in conflitto con la moto.' };
    } else {
      const vt = frames.find((f) => f.phase === 'velocità adeguata');
      outcome = {
        kind: 'evitato',
        title: 'Conflitto evitato',
        detail: `${vt ? `La moto rallenta fino alla velocità del veicolo (${toKmh(vt.v).toFixed(0)} km/h)` : 'La moto supera il punto di conflitto'} senza urti${Number.isFinite(minGap) ? `; distanza minima ${Math.max(0, minGap).toFixed(1)} m` : ''}.`,
      };
    }
  }

  // spazio d'arresto teorico
  const v0 = kmh(P.speed);
  const stopDistance = v0 * P.tau + (v0 * v0) / (2 * Math.max(0.1, aCmdNominal));

  return {
    world,
    dt,
    frames,
    events,
    outcome,
    metrics: { perceptionT, perceptionDist, brakeT, stopDistance, decel: aCmdNominal, muBase },
  };
}

function labelOf(spec: SceneSpec, hazardId: string) {
  const h = spec.hazards.find((q) => q.id === hazardId);
  return h?.label ?? h?.kind ?? 'superficie';
}

function nearestSegmentDir(line: Vec2[], p: Vec2) {
  let best = 0;
  let bd = Infinity;
  for (let i = 0; i + 1 < line.length; i++) {
    const mx = (line[i].x + line[i + 1].x) / 2;
    const my = (line[i].y + line[i + 1].y) / 2;
    const dd = (mx - p.x) ** 2 + (my - p.y) ** 2;
    if (dd < bd) {
      bd = dd;
      best = i;
    }
  }
  return Math.atan2(line[best + 1].y - line[best].y, line[best + 1].x - line[best].x);
}

function nearestTargetGap(spec: SceneSpec, world: World, f: EgoFrame) {
  let best: number | undefined;
  for (const w of spec.ego.watch) {
    let poly: Vec2[] | undefined;
    if (w.actor) {
      const a = spec.actors.find((q) => q.id === w.actor);
      if (a) poly = world.actorState(a, f.t).polys.flat();
    } else if (w.hazard) poly = world.hazards.find((h) => h.spec.id === w.hazard)?.poly;
    if (!poly) continue;
    const front = { x: f.x + Math.cos(f.th) * 1.05, y: f.y + Math.sin(f.th) * 1.05 };
    for (const p of poly) {
      const dd = Math.hypot(p.x - front.x, p.y - front.y);
      if (best === undefined || dd < best) best = dd;
    }
  }
  return best;
}

/** stato interpolato dell'ego all'istante t */
export function frameAt(sim: SimResult, t: number): EgoFrame {
  const i = Math.max(0, Math.min(sim.frames.length - 1, Math.round(t / sim.dt)));
  return sim.frames[i];
}
