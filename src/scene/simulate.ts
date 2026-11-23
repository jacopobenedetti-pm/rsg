/**
 * Simulazione dinamica del motociclista (ego) in una scena.
 *
 * Fasi: marcia → percezione (il bersaglio diventa minaccia ED è visibile) → reazione (τ) → frenata.
 * Ad ogni passo si confronta l'aderenza impegnata con quella disponibile (ellisse di aderenza):
 *  - richiesta trasversale > aderenza locale            → caduta (scivolata laterale, low-side)
 *  - richiesta trasversale > piega accettata dal pilota → allargamento della traiettoria
 *  - frenata oltre il residuo dell'ellisse               → con ABS la decelerazione viene limitata,
 *                                                          senza ABS bloccaggio dell'anteriore e caduta
 * Altri effetti: velo d'acqua e aquaplaning, pendenza longitudinale, frenate programmate, attraversamento
 * di rotaie e gradini, dossi e cordoli, raffiche laterali, nube d'acqua dei mezzi pesanti, adattamento
 * visivo. Dopo una caduta moto e pilota scivolano lungo la direzione del moto fino all'arresto o all'urto;
 * l'esito dipende dal dispositivo incontrato (paletti, protezione continua, New Jersey, rilevato, alberi).
 */
import type { SceneSpec, SimParams, Vec2, WatchTarget } from './types';
import { compileWorld, ACTOR_DIMS, type World } from './world';
import { orientedRect, pointInPolygon, polygonsOverlap, profileAt, segPolygonHit, segPolylineHit, wrapAngle } from './geometry';
import { G, kmh, toKmh, deg } from '../physics/units';
import { criticalWaterDepth, surfaceMu, wetFrictionFactor } from '../physics/friction';

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
  /** aquaplaning in corso */
  aqua?: boolean;
}

export interface SimEvent {
  t: number;
  kind: 'percezione' | 'frenata' | 'abs' | 'arresto' | 'caduta' | 'urto' | 'uscita' | 'invasione' | 'nota' | 'aquaplaning' | 'contenimento';
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

export interface Impact {
  elemento: string;
  vKmh: number;
  angoloDeg: number;
  energiaKJ: number;
  trasversaleKJ: number;
  nota: string;
}

export interface SimResult {
  world: World;
  dt: number;
  frames: EgoFrame[];
  events: SimEvent[];
  outcome: Outcome;
  impact?: Impact;
  metrics: {
    perceptionT?: number;
    perceptionDist?: number;
    brakeT?: number;
    /** spazio d'arresto teorico alla velocità iniziale con i parametri scelti */
    stopDistance: number;
    decel: number;
    muBase: number;
    /** massimo spostamento laterale indotto da raffiche e scie [m] */
    lateralMax: number;
  };
}

const EYE_H = 1.3; // altezza dell'occhio del motociclista in marcia verticale [m]
const RIDER_MASS = 85; // massa del pilota per l'energia d'impatto del corpo [kg]
const BIKE_MASS = 280; // massa del complesso moto + pilota [kg]
const MU_SLIDE = 0.55; // attrito di strisciamento di moto e pilota sull'asfalto
const MU_SLIDE_GRASS = 0.45; // sul terreno a lato della strada
const HEADLIGHT_RANGE = 55; // portata utile dell'anabbagliante [m]
const HEADLIGHT_HALF = (14 * Math.PI) / 180; // semiapertura orizzontale del fascio
const AQUA_MU = 0.05; // aderenza residua in aquaplaning

/** note sulla gravità dell'urto per il corpo del motociclista (prove d'urto con manichino, HIC) */
export const IMPACT_NOTES = {
  paletti: 'Il corpo scivola sotto la lama e incontra i paletti di sostegno: nelle prove d’urto con manichino l’HIC supera 2000 (danni permanenti).',
  dsm: 'La protezione continua guida il corpo lungo la barriera: nelle prove d’urto con manichino l’HIC misurato è 132 (leggera contusione).',
  newjersey: 'Superficie continua senza spigoli: il corpo assorbe la componente trasversale e viene deviato lungo la barriera.',
  albero: 'Ostacolo rigido e concentrato: tutta l’energia si scarica su una piccola superficie, come per un paletto o peggio.',
  rilevato: 'Senza barriera il corpo esce dalla piattaforma e cade lungo la scarpata del rilevato.',
  spigolo: 'Testata rigida non protetta: urto frontale contro uno spigolo.',
  attenuatore: 'L’attenuatore d’urto si deforma e dissipa l’energia in modo progressivo.',
  muro: 'Parete rigida: il corpo assorbe la componente trasversale e scivola lungo il muro.',
};

export function simulate(spec: SceneSpec, P: SimParams): SimResult {
  const world = compileWorld(spec);
  const ego = spec.ego;
  const g = world.roads.get(ego.road)!;
  const dt = 1 / 100;
  const n = Math.round(spec.duration / dt);
  const nMax = n + Math.round(10 / dt);
  const baseId = spec.baseSurface ?? 'asfalto';
  const muBase = surfaceMu(baseId, P.wet);
  const muBaseWet = surfaceMu(baseId, true);
  const aCmdNominal = P.effort * muBase * G;
  const maxLeanF = Math.tan((P.maxLean * Math.PI) / 180);
  const urbanLit = spec.roads.some((r) => r.style === 'urbano');
  const hasElevation = !!g.spec.elevation;

  const frames: EgoFrame[] = [];
  const events: SimEvent[] = [];
  let outcome: Outcome | null = null;
  let impact: Impact | undefined;

  let s = ego.s0;
  let v = kmh(P.speed);
  let mode: 'ride' | 'free' | 'slide' | 'stopped' | 'crashed' = 'ride';
  let x = 0;
  let y = 0;
  let z = 0;
  let th = 0;
  let lean = 0;
  let perceptionT: number | undefined;
  let perceptionDist: number | undefined;
  let brakeT: number | undefined;
  let absShown = false;
  let invaded = false;
  let lastPhase: Phase = 'marcia';
  let following = false;
  let firstWatch = -1;
  let minGap = Infinity;
  let slideFrom: Vec2 | null = null;
  let slideCause = '';
  let containedBy: string | null = null;
  const contained = new Set<number>();
  const perceived = ego.watch.map(() => false);
  const once = new Set<string>();
  // spostamento laterale da raffiche e scie
  let e = 0;
  let ev = 0;
  let gustOn = -1;
  let lateralMax = 0;
  let slipT = 0;
  let pendingSlip: { key: string; label: string; t: number } | undefined;
  const crossSide = new Map<string, number>();

  const addEvent = (kind: SimEvent['kind'], label: string, t: number) => {
    events.push({ t, kind, label, x, y });
    if (events.length > 1 && events[events.length - 2].t > t) events.sort((a, b) => a.t - b.t);
  };
  const onceEvent = (key: string, kind: SimEvent['kind'], label: string, t: number) => {
    if (once.has(key)) return;
    once.add(key);
    addEvent(kind, label, t);
  };
  const dAt = (q: number) => profileAt(ego.d, q) + P.offset;
  const gradeAt = (q: number) => (hasElevation ? (g.at(q + 1).z - g.at(q - 1).z) / 2 : 0);
  const groundZ = (p: Vec2) => (hasElevation ? g.at(g.project(p).s).z : 0);

  const sprayPoly = (a: SceneSpec['actors'][number], t: number) => {
    const st = world.actorState(a, t);
    const b = st.bodies[st.bodies.length - 1];
    const back = { x: b.x - Math.cos(b.th) * (b.l / 2 + 11), y: b.y - Math.sin(b.th) * (b.l / 2 + 11) };
    return orientedRect(back, b.th, 22 + b.l * 0.6, b.w + 2.6);
  };

  /** linea di vista libera tra l'occhio e un punto */
  const losClear = (eye: { x: number; y: number; z: number }, tgt: { x: number; y: number; z: number }, skipActor: string | undefined, t: number, skipLit = false) => {
    const sight = (u: number) => eye.z + (tgt.z - eye.z) * u;
    const base = (u: number) => (hasElevation ? groundZ({ x: eye.x + (tgt.x - eye.x) * u, y: eye.y + (tgt.y - eye.y) * u }) : 0);
    for (const o of world.occluders) {
      const u = o.closed ? segPolygonHit(eye, tgt, o.poly) : segPolylineHit(eye, tgt, o.poly);
      if (u !== null && u > 0.001 && u < 0.999 && sight(u) < base(u) + o.height) return false;
    }
    const dist = Math.hypot(tgt.x - eye.x, tgt.y - eye.y);
    for (const a of spec.actors) {
      const st = world.actorState(a, t);
      // nube d'acqua dei mezzi pesanti: opaca oltre 15 m (35 m per le luci accese del veicolo osservato)
      if (a.spray && P.wet && st.v > 8 && dist > (skipLit ? 35 : 15)) {
        const sp = sprayPoly(a, t);
        if (pointInPolygon(eye, sp) || segPolygonHit(eye, tgt, sp) !== null) return false;
      }
      if (a.id === skipActor) continue;
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
      tg = groundZ(h.center);
    }
    for (const zone of ego.visibility ?? []) if (s >= zone.s0 && s <= zone.s1) range = Math.min(range, zone.range);
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
      if (losClear(eye, { x: p.x, y: p.y, z: tg + tz }, w.actor, t, lit)) return true;
    }
    return false;
  };

  /** urto o contenimento contro un elemento lineare durante scivolata o uscita di traiettoria */
  const hitBarrier = (t: number, p0: Vec2, p1: Vec2): boolean => {
    for (let bi = 0; bi < world.barriers.length; bi++) {
      const b = world.barriers[bi];
      const u = segPolylineHit(p0, p1, b.line);
      if (u === null) continue;
      const segDir = nearestSegmentDir(b.line, p1);
      if (contained.has(bi)) {
        // il corpo già a contatto segue la barriera anche dove questa curva
        const ux = p0.x - p1.x;
        const uy = p0.y - p1.y;
        const ul = Math.hypot(ux, uy) || 1;
        x = p0.x + (ux / ul) * 0.2;
        y = p0.y + (uy / ul) * 0.2;
        th = Math.cos(th - segDir) >= 0 ? segDir : segDir + Math.PI;
        v *= 0.99;
        return false;
      }
      const sinT = Math.abs(Math.sin(th - segDir));
      const theta = Math.asin(Math.min(1, sinT));
      const vn = v * sinT;
      const ek = (0.5 * RIDER_MASS * v * v) / 1000;
      const et = (0.5 * RIDER_MASS * vn * vn) / 1000;
      x = p0.x + (p1.x - p0.x) * u;
      y = p0.y + (p1.y - p0.y) * u;
      if (b.kind === 'terminale') {
        const tipo = b.tipo ?? 'spigolo';
        const ek2 = (0.5 * RIDER_MASS * v * v) / 1000;
        const what = tipo === 'attenuatore' ? 'l\u2019attenuatore d\u2019urto' : tipo === 'terminale' ? 'il terminale del guard-rail' : 'la testata non protetta della cuspide';
        const nota = tipo === 'attenuatore' ? IMPACT_NOTES.attenuatore : IMPACT_NOTES.spigolo;
        addEvent('urto', `Impatto contro ${what} a ${toKmh(v).toFixed(0)} km/h`, t);
        impact = { elemento: what, vKmh: toKmh(v), angoloDeg: deg(theta), energiaKJ: ek2, trasversaleKJ: et, nota };
        outcome = {
          kind: tipo === 'attenuatore' ? 'caduta' : 'urto',
          title: `Impatto contro ${what}`,
          detail: `${slideCause ? cap(slideCause) + '. ' : ''}Velocità d\u2019impatto ${toKmh(v).toFixed(0)} km/h, energia del corpo ${ek2.toFixed(1)} kJ. ${nota}`,
          impactKmh: toKmh(v),
          energyKJ: ek2,
        };
        mode = 'crashed';
        return true;
      }
      if (b.kind === 'rilevato') {
        const H = b.height ?? 3;
        const vg = Math.sqrt(v * v + 2 * G * H);
        addEvent('urto', `Uscita dal ciglio: caduta di ${H.toFixed(1)} m nella scarpata`, t);
        impact = { elemento: `scarpata del rilevato (${H.toFixed(1)} m)`, vKmh: toKmh(vg), angoloDeg: deg(theta), energiaKJ: (0.5 * RIDER_MASS * vg * vg) / 1000, trasversaleKJ: et, nota: IMPACT_NOTES.rilevato };
        outcome = {
          kind: 'urto',
          title: 'Caduta nella scarpata',
          detail: `Nessuna barriera: il corpo lascia la carreggiata a ${toKmh(v).toFixed(0)} km/h e cade per ${H.toFixed(1)} m; arriva al suolo a circa ${toKmh(vg).toFixed(0)} km/h.`,
          impactKmh: toKmh(vg),
          energyKJ: impact.energiaKJ,
        };
        mode = 'crashed';
        return true;
      }
      if ((b.kind === 'guardrail' && b.dsm) || b.kind === 'newjersey' || b.kind === 'muro') {
        // contenimento: la componente trasversale si annulla, il corpo scivola lungo la barriera
        contained.add(bi);
        const what = b.kind === 'guardrail' ? 'barriera con protezione per motociclisti' : b.kind === 'newjersey' ? 'barriera New Jersey' : 'parete';
        addEvent('contenimento', `Contatto con ${what} a ${toKmh(v).toFixed(0)} km/h (componente trasversale ${toKmh(vn).toFixed(0)} km/h)`, t);
        impact = {
          elemento: what,
          vKmh: toKmh(v),
          angoloDeg: deg(theta),
          energiaKJ: ek,
          trasversaleKJ: et,
          nota: b.kind === 'guardrail' ? IMPACT_NOTES.dsm : b.kind === 'newjersey' ? IMPACT_NOTES.newjersey : IMPACT_NOTES.muro,
        };
        containedBy = what;
        const along = Math.cos(th - segDir) >= 0 ? segDir : segDir + Math.PI;
        // il corpo resta dal lato della carreggiata, a 0,5 m dalla barriera
        const ux = p0.x - p1.x;
        const uy = p0.y - p1.y;
        const ul = Math.hypot(ux, uy) || 1;
        x += (ux / ul) * 0.5;
        y += (uy / ul) * 0.5;
        th = along;
        v = v * Math.cos(theta) * 0.85;
        if (mode === 'free') {
          slideCause = 'la moto, uscita di traiettoria, striscia contro la barriera';
          mode = 'slide';
        }
        return false;
      }
      // guard-rail a paletti, scarpate in trincea, edifici: urto
      const what = b.kind === 'guardrail' ? 'guard-rail a paletti' : b.kind === 'scarpata' ? 'scarpata' : b.kind === 'edificio' ? 'edificio' : b.kind;
      if (mode === 'free' && b.kind === 'guardrail') {
        // moto ancora in piedi: urto radente, il pilota viene proiettato su lama e paletti
        addEvent('urto', `La moto urta il guard-rail a ${toKmh(v).toFixed(0)} km/h: il pilota viene proiettato sulla barriera`, t);
        impact = { elemento: what, vKmh: toKmh(v), angoloDeg: deg(theta), energiaKJ: ek, trasversaleKJ: et, nota: IMPACT_NOTES.paletti };
        outcome = {
          kind: 'urto',
          title: 'Urto contro il guard-rail',
          detail: `La moto, ancora in piedi, raggiunge la barriera a ${toKmh(v).toFixed(0)} km/h con angolo di ${deg(theta).toFixed(0)}°: il pilota viene proiettato su lama e paletti (energia del corpo ${ek.toFixed(1)} kJ). ${IMPACT_NOTES.paletti}`,
          impactKmh: toKmh(v),
          energyKJ: ek,
        };
        mode = 'crashed';
        return true;
      }
      addEvent('urto', `Impatto contro ${what} a ${toKmh(v).toFixed(0)} km/h`, t);
      impact = { elemento: what, vKmh: toKmh(v), angoloDeg: deg(theta), energiaKJ: ek, trasversaleKJ: et, nota: b.kind === 'guardrail' ? IMPACT_NOTES.paletti : IMPACT_NOTES.muro };
      outcome = {
        kind: 'urto',
        title: `Impatto contro ${what}`,
        detail: `Velocità d’impatto ${toKmh(v).toFixed(0)} km/h con angolo di ${deg(theta).toFixed(0)}°: energia del corpo ${ek.toFixed(1)} kJ. ${impact.nota}`,
        impactKmh: toKmh(v),
        energyKJ: ek,
      };
      mode = 'crashed';
      return true;
    }
    return false;
  };

  for (let i = 0; i <= nMax; i++) {
    // oltre la durata nominale si prosegue solo finché la manovra è in corso
    if (i > n && !((mode === 'ride' && (brakeT !== undefined || (ego.plan?.length ?? 0) > 0) && !following && v > 0.01) || mode === 'slide' || mode === 'free')) break;
    const t = i * dt;
    let k = 0;
    let d = 0;
    if (mode === 'ride' || mode === 'stopped') {
      d = dAt(s) + e;
      const p = g.pose(s, d);
      x = p.x;
      y = p.y;
      z = p.z;
      th = p.th + Math.atan2(-(dAt(s + 1) - dAt(s)), 1);
      // curvatura della traiettoria: strada più cambio di posizione laterale (d positivo a destra)
      const dpp = dAt(s + 1) - 2 * dAt(s) + dAt(s - 1);
      k = p.k - dpp;
    }
    const vk = toKmh(v);

    // aderenza locale: superficie, contaminanti, velo d'acqua, dossi
    let muLoc = muBase;
    let hazardId: string | undefined;
    let aqua = false;
    for (const h of world.hazards) {
      if (!pointInPolygon({ x, y }, h.poly)) continue;
      let m = Infinity;
      if (h.mu) m = P.wet ? h.mu.wet : h.mu.dry;
      if (h.spec.water && P.wet) {
        let depth = h.spec.water;
        if (h.spec.kind === 'ormaie') {
          const dc = (h.spec.d0 + h.spec.d1) / 2;
          const b = (h.spec.d1 - h.spec.d0) / 2;
          const dl = h.spec.road === ego.road && (mode === 'ride' || mode === 'stopped') ? d : world.roads.get(h.spec.road)!.project({ x, y }).d;
          const xr = (dl - dc) / b;
          depth = Math.max(0, h.spec.water * (1 - xr * xr));
        }
        m = Math.min(m, muBaseWet * wetFrictionFactor(vk, depth));
        const hc = criticalWaterDepth(vk);
        if (depth >= hc && vk > 30) {
          aqua = true;
          m = Math.min(m, AQUA_MU);
          if (mode === 'ride') onceEvent(`aq-${h.spec.id}`, 'aquaplaning', `Aquaplaning: velo di ${depth.toFixed(0)} mm, oltre l’altezza critica di ${hc.toFixed(1)} mm a ${vk.toFixed(0)} km/h`, t);
        }
      }
      if (h.spec.kind === 'dosso' && mode === 'ride' && vk > 30) {
        m = Math.min(m, muLoc * 0.55);
        onceEvent(`dosso-${h.spec.id}`, 'nota', vk > 50 ? `Dosso a ${vk.toFixed(0)} km/h: la ruota anteriore si stacca dal suolo` : `Dosso a ${vk.toFixed(0)} km/h: la sospensione si estende e scarica le ruote`, t);
      }
      if (m < muLoc) {
        muLoc = m;
        hazardId = h.spec.id;
      }
    }

    // urti della ruota, attraversamenti di rotaie e gradini
    if (mode === 'ride') {
      for (const h of world.hazards) {
        const kind = h.spec.kind;
        if (kind === 'buca' || kind === 'detrito' || kind === 'cordolo') {
          if (once.has(`bump-${h.spec.id}`) || !pointInPolygon({ x, y }, h.poly)) continue;
          once.add(`bump-${h.spec.id}`);
          const what = h.spec.label ?? kind;
          const lim = kind === 'cordolo' ? 15 : 30;
          if (vk > lim) {
            mode = 'slide';
            slideCause = `la ruota anteriore urta ${what} a ${vk.toFixed(0)} km/h`;
            addEvent('caduta', `Caduta: ${slideCause}`, t);
          } else addEvent('nota', `Sobbalzo su ${what} a ${vk.toFixed(0)} km/h: controllo mantenuto`, t);
        }
        if ((kind === 'rotaie' || kind === 'gradino') && i > 0) {
          // posizione della moto rispetto alla linea della rotaia o del gradino (anche se non parallela alla strada)
          const hr = world.roads.get(h.spec.road)!;
          const now = hr.project({ x, y });
          const key = `cross-${h.spec.id}`;
          const dc = (h.spec.d0 + h.spec.d1) / 2;
          const prevSide = crossSide.get(key);
          const side = Math.sign(now.d - dc);
          crossSide.set(key, side);
          if (prevSide !== undefined && side !== 0 && prevSide !== side && now.s >= h.spec.s0 && now.s <= h.spec.s1) {
            let rel = Math.abs(wrapAngle(th - hr.at(now.s).th));
            if (rel > Math.PI / 2) rel = Math.PI - rel;
            const ang = deg(rel);
            const what = h.spec.label ?? (kind === 'rotaie' ? 'rotaia' : 'gradino');
            let fall = '';
            if (kind === 'rotaie') {
              if (ang < 20) fall = `attraversa ${what} a ${ang.toFixed(0)}°: la ruota anteriore entra nella gola e viene guidata`;
              else if (ang < 35 && P.wet) fall = `attraversa ${what} bagnata a ${ang.toFixed(0)}°: la ruota scivola sul fungo d’acciaio`;
            } else if (ang < 15) fall = `attraversa ${what} a ${ang.toFixed(0)}°: lo pneumatico non sale e l’anteriore viene deviato`;
            if (fall) {
              mode = 'slide';
              slideCause = fall;
              addEvent('caduta', `Caduta: ${fall}`, t);
            } else addEvent('nota', `Attraversamento di ${what} a ${ang.toFixed(0)}°: la ruota supera l’ostacolo`, t);
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
      if (tw?.response === 'arretra') {
        // si frena finché la moto non è almeno 10 m dietro la coda del veicolo, poi si segue
        const rear = st.bodies[st.bodies.length - 1];
        const rx = rear.x - Math.cos(rear.th) * (rear.l / 2);
        const ry = rear.y - Math.sin(rear.th) * (rear.l / 2);
        const along = (x + Math.cos(th) * 1.05 - rx) * Math.cos(rear.th) + (y + Math.sin(th) * 1.05 - ry) * Math.sin(rear.th);
        const cab = st.bodies[0];
        const fx0 = cab.x + Math.cos(cab.th) * (cab.l / 2);
        const fy0 = cab.y + Math.sin(cab.th) * (cab.l / 2);
        const ahead = (x - Math.cos(th) * 1.05 - fx0) * Math.cos(cab.th) + (y - Math.sin(th) * 1.05 - fy0) * Math.sin(cab.th);
        // già davanti alla motrice: si prosegue; altrimenti si frena per arretrare dietro il rimorchio
        if (ahead > 1) vTarget = v;
        else if (along > -10) vTarget = Math.max(0, vTarget - 6);
      }
      const gap = Math.hypot(st.x - x, st.y - y) - 1.05 - ACTOR_DIMS[tActor.kind].l / 2;
      if (mode === 'ride' && gap < minGap) minGap = gap;
    }
    const reacting = mode === 'ride' && perceptionT !== undefined && t >= perceptionT + P.tau;
    const braking = reacting && v > 0 && (vTarget < 0.3 || v > vTarget + 0.05);
    following = reacting && !braking && vTarget > 0.3;
    if (braking && brakeT === undefined) {
      brakeT = t;
      addEvent('frenata', 'Inizio frenata d’emergenza', t);
    }
    // frenate programmate dal pilota
    let planFx = 0;
    if (mode === 'ride') {
      for (const [pi, pl] of (ego.plan ?? []).entries()) {
        if (s >= pl.s0 && v > kmh(pl.toKmh) + 0.05) {
          planFx = Math.max(planFx, pl.a / G);
          onceEvent(`plan-${pi}`, 'frenata', pl.label ?? `Frenata per rallentare a ${pl.toKmh} km/h`, t);
        }
      }
    }
    // pendenza: in discesa il pilota frena anche solo per mantenere la velocità
    const iGrade = mode === 'ride' ? gradeAt(s) : 0;
    let accel = 0;
    if (mode === 'ride' && !braking && planFx === 0 && ego.accel && s >= ego.accel.from && s <= ego.accel.to && v < kmh(ego.accel.vMax)) {
      accel = ego.accel.a;
    }
    let fx = Math.max(braking ? aCmdNominal / G : 0, planFx);
    if (fx === 0 && accel === 0 && iGrade < 0) fx = -iGrade;
    const aLat = v * v * k;
    let fy = Math.abs(aLat) / G;
    let phase: Phase = lastPhase;

    if (mode === 'ride') {
      // uno scivolamento laterale brevissimo (giunto, chiusino attraversati in un attimo) si recupera
      if (fy > muLoc + 1e-3) slipT += dt;
      else slipT = Math.max(0, slipT - dt * 2);
      // la nota dello scivolamento recuperato si scrive solo quando l'aderenza torna sufficiente
      if (fy <= muLoc + 1e-3 && pendingSlip) {
        onceEvent(pendingSlip.key, 'nota', pendingSlip.label, pendingSlip.t);
        pendingSlip = undefined;
      }
      if (fy > muLoc + 1e-3 && slipT <= 0.06 && fx > 0 && !P.abs && (braking || planFx > 0)) {
        // mentre lo pneumatico scivola di lato, la frenata senza ABS blocca l'anteriore
        pendingSlip = undefined;
        mode = 'slide';
        slideCause = `bloccaggio dell’anteriore${hazardId ? ' su ' + labelOf(spec, hazardId) : ''} mentre la moto scivola di lato`;
        addEvent('caduta', `Caduta: ${slideCause}`, t);
      } else if (fy > muLoc + 1e-3 && slipT <= 0.06) {
        pendingSlip ??= { key: `slip-${hazardId ?? 'base'}`, label: `Scivolamento laterale momentaneo${hazardId ? ' su ' + labelOf(spec, hazardId) : ''}: la moto si scompone ma recupera`, t };
      } else if (fy > muLoc + 1e-3) {
        pendingSlip = undefined;
        mode = 'slide';
        slideCause = aqua ? 'aquaplaning con la moto in manovra: lo pneumatico non trasmette forza laterale' : hazardId ? `aderenza insufficiente su ${labelOf(spec, hazardId)}` : 'aderenza trasversale insufficiente';
        addEvent('caduta', `Caduta: ${slideCause}`, t);
      } else if (fy > maxLeanF && Math.abs(k) > 1e-4) {
        mode = 'free';
        addEvent('uscita', `La piega necessaria (${deg(Math.atan(fy)).toFixed(0)}°) supera quella del pilota: la traiettoria si allarga`, t);
      } else if (fx > 0) {
        const avail = muLoc * Math.sqrt(Math.max(0, 1 - (fy / muLoc) ** 2));
        if (fx > avail) {
          if (P.abs) {
            fx = avail;
            if (!absShown && (braking || planFx > 0)) {
              absShown = true;
              addEvent('abs', 'Interviene l’ABS: decelerazione limitata dall’aderenza', t);
            }
          } else if (braking || planFx > 0) {
            mode = 'slide';
            slideCause = `bloccaggio dell’anteriore${hazardId ? ' su ' + labelOf(spec, hazardId) : ''}`;
            addEvent('caduta', `Caduta: ${slideCause}`, t);
          } else {
            fx = avail;
          }
        }
      }
    }

    // integrazione
    if (mode === 'ride') {
      v = Math.max(0, v + (accel - (fx + iGrade) * G) * dt);
      if (following) v = Math.min(v, vTarget);
      s += v * dt;
      lean = lean + (Math.atan(aLat / G) - lean) * Math.min(1, dt * 8);
      phase = braking || planFx > 0 ? 'frenata' : following ? 'velocità adeguata' : perceptionT !== undefined ? 'reazione' : 'marcia';
      const planStop = (ego.plan ?? []).some((pl) => pl.toKmh === 0 && s >= pl.s0);
      if ((v <= 0.01 && braking) || (planStop && v <= 0.05)) {
        mode = 'stopped';
        v = 0;
        phase = 'fermo';
        addEvent('arresto', 'Moto ferma', t);
      }
      // raffiche e scie: spostamento laterale, corretto dal pilota dopo 0,5 s
      let ay = 0;
      let label = '';
      for (const gu of ego.gusts ?? []) {
        if (s >= gu.s0 && s <= gu.s1) {
          const u = (s - gu.s0) / (gu.s1 - gu.s0);
          ay += gu.ay * Math.sin(Math.PI * u) ** 2;
          label = gu.label;
        }
      }
      if (ay !== 0 && gustOn < 0) gustOn = t;
      if (ay !== 0 && label) onceEvent(`gust-${label}`, 'nota', label, t);
      if (ay === 0 && Math.abs(e) < 0.01 && Math.abs(ev) < 0.01) gustOn = -1;
      const correcting = gustOn >= 0 && t - gustOn > 0.5;
      const acc = ay - (correcting ? 4 * e + 3.2 * ev : 0);
      ev += acc * dt;
      e += ev * dt;
      lateralMax = Math.max(lateralMax, Math.abs(e));
    } else if (mode === 'free') {
      // il pilota cerca di seguire la curvatura della strada, ma la velocità di imbardata è limitata
      const fAvail = Math.min(muLoc * 0.95, maxLeanF);
      const kRoad = g.at(g.project({ x, y }).s).k;
      const yawMax = v > 0.5 ? (G * fAvail) / v : 0;
      const yaw = Math.max(-yawMax, Math.min(yawMax, v * kRoad));
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
        slideCause = 'uscita dalla carreggiata';
        addEvent('uscita', 'Uscita dalla carreggiata', t);
      }
    } else if (mode === 'slide') {
      if (!slideFrom) slideFrom = { x, y };
      const pr = g.project({ x, y });
      const off = pr.d > g.right + 1.2 || pr.d < -g.left - 1.2;
      // in discesa la gravità allunga la scivolata (componente della pendenza lungo la direzione del moto)
      const iSlide = hasElevation ? gradeAt(pr.s) * Math.cos(th - g.at(pr.s).th) : 0;
      v = Math.max(0, v - ((off ? MU_SLIDE_GRASS : MU_SLIDE) + iSlide) * G * dt);
      x += Math.cos(th) * v * dt;
      y += Math.sin(th) * v * dt;
      z = groundZ({ x, y });
      lean = lean + (Math.sign(lean || 1) * 1.3 - lean) * Math.min(1, dt * 6);
      phase = 'scivolata';
      fx = MU_SLIDE;
      if (v <= 0.01) {
        mode = 'crashed';
        if (!outcome) {
          const len = Math.hypot(x - slideFrom.x, y - slideFrom.y);
          outcome = containedBy
            ? {
                kind: 'caduta',
                title: 'Caduta, contenuta dalla barriera',
                detail: `${cap(slideCause)}. Il corpo raggiunge la ${containedBy} e scivola lungo di essa per arrestarsi dopo ${len.toFixed(0)} m. ${impact?.nota ?? ''}`,
                impactKmh: impact?.vKmh,
                energyKJ: impact?.energiaKJ,
              }
            : {
                kind: 'caduta',
                title: 'Caduta',
                detail: `${cap(slideCause)}. Moto e pilota scivolano per ${len.toFixed(0)} m e si arrestano senza urtare ostacoli.`,
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
      const offH = (Math.sign(lean) * head) / 2;
      const egoPoly = orientedRect({ x: x - Math.sin(th) * offH, y: y + Math.cos(th) * offH }, th, 2.1, 0.8 + head);
      for (const a of spec.actors) {
        const st = world.actorState(a, t);
        if (st.polys.some((poly) => polygonsOverlap(egoPoly, poly))) {
          const vx = Math.cos(th) * v - Math.cos(st.th) * st.v;
          const vy = Math.sin(th) * v - Math.sin(st.th) * st.v;
          const rel = Math.hypot(vx, vy);
          const m = mode === 'slide' ? RIDER_MASS : BIKE_MASS;
          const what = a.label ?? a.kind;
          addEvent('urto', `Urto contro ${what} a ${toKmh(rel).toFixed(0)} km/h`, t);
          impact = { elemento: what, vKmh: toKmh(rel), angoloDeg: 0, energiaKJ: (0.5 * m * rel * rel) / 1000, trasversaleKJ: 0, nota: '' };
          outcome = {
            kind: 'urto',
            title: mode === 'slide' ? `Caduta e urto a ${toKmh(rel).toFixed(0)} km/h` : `Urto a ${toKmh(rel).toFixed(0)} km/h`,
            detail: `${mode === 'slide' ? `${cap(slideCause)}; il corpo del motociclista urta` : 'La moto urta'} ${what}. Energia cinetica relativa ${((0.5 * m * rel * rel) / 1000).toFixed(1)} kJ, pari a una caduta da ${((rel * rel) / (2 * G)).toFixed(1)} m.`,
            impactKmh: toKmh(rel),
            energyKJ: (0.5 * m * rel * rel) / 1000,
          };
          mode = 'crashed';
          break;
        }
      }
      if (mode !== 'crashed' && prev && (mode === 'slide' || mode === 'free')) {
        const hit = hitBarrier(t, { x: prev.x, y: prev.y }, { x, y });
        if (!hit) {
          for (const pst of world.posts) {
            if (Math.hypot(pst.at.x - x, pst.at.y - y) >= pst.r + 0.45) continue;
            if (pst.kind === 'cono') {
              onceEvent(`cono-${pst.at.x}-${pst.at.y}`, 'nota', 'Travolge un cono', t);
              continue;
            }
            const ek = (0.5 * RIDER_MASS * v * v) / 1000;
            const what = pst.kind === 'albero' ? 'un albero' : pst.kind === 'palo' ? 'un palo' : pst.kind === 'attenuatore' ? 'l’attenuatore d’urto' : pst.kind === 'terminale' ? 'il terminale della barriera' : 'lo spigolo della cuspide';
            addEvent('urto', `Impatto contro ${what} a ${toKmh(v).toFixed(0)} km/h`, t);
            const nota = pst.kind === 'attenuatore' ? IMPACT_NOTES.attenuatore : pst.kind === 'spigolo' || pst.kind === 'terminale' ? IMPACT_NOTES.spigolo : IMPACT_NOTES.albero;
            impact = { elemento: what, vKmh: toKmh(v), angoloDeg: 90, energiaKJ: ek, trasversaleKJ: ek, nota };
            outcome = {
              kind: pst.kind === 'attenuatore' ? 'caduta' : 'urto',
              title: `Impatto contro ${what}`,
              detail: `${slideCause ? cap(slideCause) + '. ' : ''}Velocità d’impatto ${toKmh(v).toFixed(0)} km/h, energia del corpo ${ek.toFixed(1)} kJ. ${nota}`,
              impactKmh: toKmh(v),
              energyKJ: ek,
            };
            mode = 'crashed';
            break;
          }
        }
      }
      if ((mode as string) === 'crashed') {
        v = 0;
        phase = 'urto';
      }
    }

    lastPhase = phase;
    frames.push({ t, x, y, z, th, v, a: Math.max(0, (fx + iGrade) * G), lean, s, d, phase, mu: muLoc, fx, fy, hazard: hazardId, seen, aqua });
  }

  if (!outcome) {
    const last = frames[frames.length - 1];
    const fall = events.find((q) => q.kind === 'caduta');
    const lat = lateralMax > 0.05 ? ` Spostamento laterale massimo ${(lateralMax * 100).toFixed(0)} cm.` : '';
    if (fall) {
      outcome = { kind: 'caduta', title: 'Caduta', detail: fall.label.replace(/^Caduta: /, '') + '.' };
    } else if (last.phase === 'fermo') {
      const gap = nearestTargetGap(spec, world, last);
      outcome = {
        kind: 'evitato',
        title: 'Arresto in sicurezza',
        detail: (gap !== undefined ? `La moto si ferma con un margine di ${gap.toFixed(1)} m dal bersaglio.` : 'La moto si ferma senza urti.') + lat,
      };
    } else if (events.some((q) => q.kind === 'uscita' || q.kind === 'invasione')) {
      outcome = { kind: 'uscita', title: 'Uscita di traiettoria', detail: 'La moto non riesce a mantenere la traiettoria della curva.' + lat };
    } else if (perceptionT === undefined) {
      const aq = events.find((q) => q.kind === 'aquaplaning');
      outcome = aq
        ? { kind: 'evitato', title: 'Aquaplaning superato', detail: 'Lo pneumatico ha perso contatto con la pavimentazione, ma senza manovre in corso la moto ha proseguito diritta.' + lat }
        : { kind: 'nessuno', title: 'Nessun conflitto', detail: 'Nella finestra simulata la moto percorre la scena senza perdere aderenza.' + lat };
    } else {
      const vt = frames.find((f) => f.phase === 'velocità adeguata');
      outcome = {
        kind: 'evitato',
        title: 'Conflitto evitato',
        detail: `${vt ? `La moto rallenta fino alla velocità del veicolo (${toKmh(vt.v).toFixed(0)} km/h)` : 'La moto supera il punto di conflitto'} senza urti${Number.isFinite(minGap) ? `; distanza minima ${Math.max(0, minGap).toFixed(1)} m` : ''}.${lat}`,
      };
    }
  }

  const v0 = kmh(P.speed);
  const stopDistance = v0 * P.tau + (v0 * v0) / (2 * Math.max(0.1, aCmdNominal));

  return {
    world,
    dt,
    frames,
    events,
    outcome,
    impact,
    metrics: { perceptionT, perceptionDist, brakeT, stopDistance, decel: aCmdNominal, muBase, lateralMax },
  };
}

const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

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

/** stato dell'ego all'istante t */
export function frameAt(sim: SimResult, t: number): EgoFrame {
  const i = Math.max(0, Math.min(sim.frames.length - 1, Math.round(t / sim.dt)));
  return sim.frames[i];
}

/** poligono della nube d'acqua sollevata da un veicolo (per le viste) */
export function sprayFootprint(world: World, a: SceneSpec['actors'][number], t: number) {
  const st = world.actorState(a, t);
  const b = st.bodies[st.bodies.length - 1];
  const back = { x: b.x - Math.cos(b.th) * (b.l / 2 + 11), y: b.y - Math.sin(b.th) * (b.l / 2 + 11) };
  return { poly: orientedRect(back, b.th, 22 + b.l * 0.6, b.w + 2.6), v: st.v };
}
