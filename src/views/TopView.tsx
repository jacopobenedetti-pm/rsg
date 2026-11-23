/**
 * Vista dall'alto (planimetria animata). Coordinate mondo in metri, asse y verso nord.
 * Strato statico (strade, arredo, pericoli) memorizzato; strato dinamico ridisegnato a ogni fotogramma:
 * veicoli, traiettoria, linee di vista, fascio del faro e spazio d'arresto residuo.
 */
import { memo, useMemo, useState } from 'react';
import type { SimResult, EgoFrame } from '../scene/simulate';
import { frameAt, sprayFootprint } from '../scene/simulate';
import type { World } from '../scene/world';
import { roadBands, roadLines, dashSpans, type BandKind } from '../scene/road';
import type { SimParams, Vec2 } from '../scene/types';
import { orientedRect } from '../scene/geometry';
import { type Clock, useClockTime } from './clock';

const VW = 1000;
const VH = 625;

const MAP = {
  groundUrban: '#c4c1b8',
  groundRural: '#9fa88e',
  asfalto: '#4a4e53',
  banchina: '#8f8a7c',
  marciapiede: '#d6d1c6',
  spartitraffico: '#7f8a6a',
  sterrato: '#a58d68',
  verde: '#8c9a72',
  line: '#f4f4f2',
  edificio: '#b9ad9e',
  edificioBordo: '#8a7f72',
  albero: '#56733f',
  siepe: '#4b6a39',
  muro: '#8d8a84',
  scarpata: '#8c7a58',
  guardrail: '#a5acb3',
  dsm: '#e0b030',
  newjersey: '#d3d6d8',
  ego: '#f2b632',
  egoBordo: '#1a1400',
};

const BAND_COLOR: Record<BandKind, string> = {
  asfalto: MAP.asfalto,
  banchina: MAP.banchina,
  marciapiede: MAP.marciapiede,
  spartitraffico: MAP.spartitraffico,
  sterrato: MAP.sterrato,
  verde: MAP.verde,
};

const pts = (p: Vec2[]) => p.map((q) => `${q.x.toFixed(2)},${q.y.toFixed(2)}`).join(' ');

const StaticLayer = memo(function StaticLayer({ world }: { world: World }) {
  const roads = [...world.roads.values()].filter((g) => !g.spec.hidden);
  return (
    <g>
      {/* bande trasversali: prima marciapiedi e banchine, poi la pavimentazione */}
      {(['banchina', 'marciapiede', 'spartitraffico', 'sterrato', 'asfalto'] as BandKind[]).map((kind) =>
        roads.flatMap((g) =>
          roadBands(g)
            .filter((b) => b.kind === kind)
            .flatMap((b, bi) => {
              const spans: [number, number][] = b.side ? g.spansOutsideGaps(b.side) : [[0, g.length]];
              return spans.map(([s0, s1], si) => {
                const left = g.polyline(b.d0, s0, s1, 1);
                const right = g.polyline(b.d1, s0, s1, 1).reverse();
                return <polygon key={`${g.spec.id}-${kind}-${bi}-${si}`} points={pts([...left, ...right])} fill={kind === 'asfalto' && g.spec.paving === 'lapideo' ? 'url(#pat-lapideo)' : BAND_COLOR[kind]} />;
              });
            }),
        ),
      )}
      {/* segnaletica orizzontale */}
      {roads.flatMap((g) =>
        roadLines(g).flatMap((l, li) => {
          const spans: [number, number][] = l.side ? g.spansOutsideGaps(l.side) : [[0, g.length]];
          return spans.flatMap(([s0, s1], si) => {
            if (l.kind === 'tratteggiata' && l.dash) {
              return dashSpans(s1 - s0, l.dash).map(([a, b], di) => (
                <polyline key={`${g.spec.id}-l${li}-${si}-${di}`} points={pts(g.polyline(l.d, s0 + a, s0 + b, 1.5))} fill="none" stroke={MAP.line} strokeWidth={0.15} />
              ));
            }
            return [<polyline key={`${g.spec.id}-l${li}-${si}`} points={pts(g.polyline(l.d, s0, s1, 1))} fill="none" stroke={MAP.line} strokeWidth={l.kind === 'margine' ? 0.15 : 0.12} />];
          });
        }),
      )}
      {/* strisce pedonali */}
      {world.spec.objects.map((o, i) => {
        if (o.kind !== 'zebra') return null;
        const g = world.roads.get(o.road)!;
        const out = [];
        for (let d = o.d0 + 0.25; d < o.d1 - 0.2; d += 1.0) {
          const poly = [...g.polyline(d, o.s - o.width / 2, o.s + o.width / 2, o.width), ...g.polyline(d + 0.5, o.s - o.width / 2, o.s + o.width / 2, o.width).reverse()];
          out.push(<polygon key={`z${i}-${d}`} points={pts(poly)} fill={MAP.line} />);
        }
        return <g key={`zebra${i}`}>{out}</g>;
      })}
      {/* pericoli sulla pavimentazione */}
      {world.hazards.map((h) => (
        <HazardShape key={h.spec.id} kind={h.spec.kind} poly={h.poly} />
      ))}
      {/* arredo e oggetti */}
      {world.spec.objects.map((o, i) => {
        switch (o.kind) {
          case 'edificio':
            return <polygon key={i} points={pts(o.poly)} fill={o.color ?? MAP.edificio} stroke={MAP.edificioBordo} strokeWidth={0.3} />;
          case 'albero':
            return <circle key={i} cx={o.at.x} cy={o.at.y} r={o.r} fill={MAP.albero} opacity={0.85} />;
          case 'siepe':
            return <polyline key={i} points={pts(o.line)} fill="none" stroke={MAP.siepe} strokeWidth={o.thickness} strokeLinejoin="round" />;
          case 'muro':
            return <polyline key={i} points={pts(o.line)} fill="none" stroke={MAP.muro} strokeWidth={Math.max(0.4, o.thickness)} />;
          case 'scarpata':
            return (
              <g key={i}>
                <polyline points={pts(o.line)} fill="none" stroke={MAP.scarpata} strokeWidth={o.thickness} opacity={0.55} />
                <polyline points={pts(o.line)} fill="none" stroke="#5e5138" strokeWidth={0.35} />
              </g>
            );
          case 'guardrail':
            return (
              <g key={i}>
                <polyline points={pts(o.line)} fill="none" stroke={o.dsm ? MAP.dsm : MAP.guardrail} strokeWidth={0.35} />
                {o.line
                  .filter((_, k) => k % 2 === 0)
                  .map((p, k) => (
                    <rect key={k} x={p.x - 0.12} y={p.y - 0.12} width={0.24} height={0.24} fill="#5f666d" />
                  ))}
              </g>
            );
          case 'newjersey':
            return <polyline key={i} points={pts(o.line)} fill="none" stroke={MAP.newjersey} strokeWidth={0.6} />;
          case 'palo':
            return <circle key={i} cx={o.at.x} cy={o.at.y} r={0.25} fill="#2f3337" />;
          case 'delineatore':
            return <rect key={i} x={o.at.x - 0.1} y={o.at.y - 0.1} width={0.2} height={0.2} fill="#f3f3f3" stroke="#222" strokeWidth={0.04} />;
          case 'isola':
            return <circle key={i} cx={o.center.x} cy={o.center.y} r={o.r} fill={MAP.verde} stroke="#d9d4ca" strokeWidth={0.5} />;
          case 'rilevato':
            return (
              <g key={i}>
                <polyline points={pts(o.line)} fill="none" stroke="#6d5f44" strokeWidth={3} opacity={0.45} />
                <polyline points={pts(o.line)} fill="none" stroke="#3c3324" strokeWidth={0.25} strokeDasharray="0.8 0.5" />
              </g>
            );
          case 'galleria': {
            const g = world.roads.get(o.road)!;
            const poly = [...g.polyline(o.d0, o.s0, o.s1, 2), ...g.polyline(o.d1, o.s0, o.s1, 2).reverse()];
            return (
              <g key={i}>
                <polygon points={pts(poly)} fill="#1b1e21" opacity={0.55} />
                <polyline points={pts(g.polyline(o.d0 - 0.6, o.s0, o.s1, 2))} fill="none" stroke="#7a7d80" strokeWidth={1.2} />
                <polyline points={pts(g.polyline(o.d1 + 0.6, o.s0, o.s1, 2))} fill="none" stroke="#7a7d80" strokeWidth={1.2} />
              </g>
            );
          }
          case 'cono':
            return <circle key={i} cx={o.at.x} cy={o.at.y} r={0.25} fill="#ff6a00" stroke="#fff" strokeWidth={0.08} />;
          case 'terminale':
            return (
              <rect
                key={i}
                x={o.at.x - (o.tipo === 'attenuatore' ? 1.6 : 0.4)}
                y={o.at.y - 0.4}
                width={o.tipo === 'attenuatore' ? 3.2 : 0.8}
                height={0.8}
                transform={`rotate(${(o.th * 180) / Math.PI} ${o.at.x} ${o.at.y})`}
                fill={o.tipo === 'attenuatore' ? '#f2b632' : o.tipo === 'spigolo' ? '#d3d6d8' : '#a5acb3'}
                stroke="#222"
                strokeWidth={0.08}
              />
            );
          case 'spartitraffico':
            return <polygon key={i} points={pts(o.poly)} fill="#cfcac0" stroke="#f4f4f2" strokeWidth={0.2} />;
          case 'cartello':
            return <polygon key={i} points={`${o.at.x - 0.5},${o.at.y - 0.3} ${o.at.x + 0.5},${o.at.y - 0.3} ${o.at.x},${o.at.y + 0.5}`} fill="#fff" stroke="#c8372d" strokeWidth={0.15} />;
          default:
            return null;
        }
      })}
    </g>
  );
});

function HazardShape({ kind, poly }: { kind: string; poly: Vec2[] }) {
  const p = pts(poly);
  switch (kind) {
    case 'buca':
      return <polygon points={p} fill="#1c1b19" stroke="#6b655b" strokeWidth={0.08} />;
    case 'gasolio':
      return <polygon points={p} fill="url(#pat-gasolio)" opacity={0.95} />;
    case 'ghiaia':
      return <polygon points={p} fill="url(#pat-ghiaia)" />;
    case 'acqua':
      return <polygon points={p} fill="#5f86a8" opacity={0.75} />;
    case 'ormaie':
      return <polygon points={p} fill="url(#pat-ormaia)" opacity={0.85} />;
    case 'dosso':
      return <polygon points={p} fill="url(#pat-dosso)" />;
    case 'cordolo':
      return <polygon points={p} fill="#d9d4ca" stroke="#555" strokeWidth={0.06} />;
    case 'rotaie':
    case 'gradino':
      return <polygon points={p} fill={kind === 'rotaie' ? '#c9ced3' : '#2a2c2e'} stroke={kind === 'rotaie' ? '#7b8187' : '#111'} strokeWidth={0.04} />;
    case 'ghiaccio':
      return <polygon points={p} fill="#cfe7f5" opacity={0.55} />;
    case 'fango':
      return <polygon points={p} fill="#6b5236" opacity={0.75} />;
    case 'fresato':
      return <polygon points={p} fill="url(#pat-fresato)" />;
    case 'lucidato':
      return <polygon points={p} fill="#8b9096" opacity={0.35} />;
    case 'giunto':
      return <polygon points={p} fill="#9aa1a8" stroke="#555" strokeWidth={0.05} />;
    case 'strisce':
      return <polygon points={p} fill="none" />;
    case 'sigillature':
      return <polygon points={p} fill="url(#pat-fessure)" />;
    case 'detrito':
      return <polygon points={p} fill="#111" stroke="#000" strokeWidth={0.05} />;
    case 'chiusino':
      return <polygon points={p} fill="#8d9297" stroke="#55595e" strokeWidth={0.08} />;
    default:
      return <polygon points={p} fill="#6d6a63" opacity={0.6} />;
  }
}

function ActorShape({ kind, color, poly, part }: { kind: string; color?: string; poly: Vec2[]; part: string }) {
  if (kind === 'pedone') {
    const c = { x: (poly[0].x + poly[2].x) / 2, y: (poly[0].y + poly[2].y) / 2 };
    return <circle cx={c.x} cy={c.y} r={0.35} fill={color ?? '#2f5d8a'} stroke="#111" strokeWidth={0.08} />;
  }
  const fill = color ?? '#6b7c8f';
  // parabrezza: segmento verso la parte anteriore (lato 0-1 del rettangolo orientato)
  const front = [poly[0], poly[1]];
  const back = [poly[3], poly[2]];
  const f = 0.72;
  const w0 = { x: back[0].x + (front[0].x - back[0].x) * f, y: back[0].y + (front[0].y - back[0].y) * f };
  const w1 = { x: back[1].x + (front[1].x - back[1].x) * f, y: back[1].y + (front[1].y - back[1].y) * f };
  return (
    <g>
      <polygon points={pts(poly)} fill={fill} stroke="#111" strokeWidth={0.1} />
      {kind !== 'animale' && part !== 'rimorchio' && <line x1={w0.x} y1={w0.y} x2={w1.x} y2={w1.y} stroke="#1d2a35" strokeWidth={0.35} />}
    </g>
  );
}

interface Props {
  sim: SimResult;
  clock: Clock;
  params: SimParams;
}

export function TopView({ sim, clock, params }: Props) {
  const t = useClockTime(clock);
  const [mode, setMode] = useState<'segui' | 'panoramica'>('segui');
  const [span, setSpan] = useState(110);
  const world = sim.world;
  const f = frameAt(sim, t);
  const urban = world.spec.roads.some((r) => r.style === 'urbano');
  // direzione della mappa: si segue la strada (non la moto che scivola o ruota dopo un urto)
  const hf = sim.frames.filter((q) => q.phase !== 'scivolata' && q.phase !== 'urto' && q.t <= t);
  const heading = hf.length ? hf[hf.length - 1].th : f.th;

  // inquadratura
  let cx: number;
  let cy: number;
  let k: number;
  // in modalità "segui" la mappa ruota per tenere la direzione di marcia verso l'alto
  const rot = mode === 'segui' ? (heading * 180) / Math.PI - 90 : 0;
  const oy = mode === 'segui' ? VH * 0.68 : VH / 2;
  if (mode === 'segui') {
    cx = f.x;
    cy = f.y;
    k = VW / span;
  } else {
    const [x0, y0, x1, y1] = world.bounds;
    cx = (x0 + x1) / 2;
    cy = (y0 + y1) / 2;
    k = Math.min(VW / (x1 - x0), VH / (y1 - y0));
  }
  const tf = `translate(${VW / 2} ${oy}) rotate(${rot}) scale(${k} ${-k}) translate(${-cx} ${-cy})`;
  const toScreen = (p: Vec2) => {
    const sx = (p.x - cx) * k;
    const sy = (cy - p.y) * k;
    const a = (rot * Math.PI) / 180;
    return { x: sx * Math.cos(a) - sy * Math.sin(a) + VW / 2, y: sx * Math.sin(a) + sy * Math.cos(a) + oy };
  };

  const trail = useMemo(() => sim.frames.filter((_, i) => i % 5 === 0), [sim]);
  const past = trail.filter((q) => q.t <= t);
  const future = trail.filter((q) => q.t >= t);

  return (
    <div className="viewport" style={{ background: urban ? MAP.groundUrban : MAP.groundRural }}>
      <div className="view-tabs">
        <div className="seg" role="group" aria-label="Inquadratura della vista dall'alto">
          <button type="button" aria-pressed={mode === 'panoramica'} onClick={() => setMode('panoramica')}>
            Panoramica
          </button>
          <button type="button" aria-pressed={mode === 'segui'} onClick={() => setMode('segui')}>
            Segui la moto
          </button>
          {mode === 'segui' && (
            <>
              <button type="button" aria-label="Avvicina" onClick={() => setSpan((s) => Math.max(30, s / 1.4))}>
                +
              </button>
              <button type="button" aria-label="Allontana" onClick={() => setSpan((s) => Math.min(600, s * 1.4))}>
                −
              </button>
            </>
          )}
        </div>
      </div>
      <svg viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="xMidYMid slice" role="img" aria-label="Vista dall'alto della scena">
        <defs>
          <pattern id="pat-ghiaia" width="0.6" height="0.6" patternUnits="userSpaceOnUse">
            <rect width="0.6" height="0.6" fill="#8b8577" />
            <circle cx="0.15" cy="0.2" r="0.08" fill="#c9c0aa" />
            <circle cx="0.45" cy="0.4" r="0.07" fill="#d8d0bb" />
            <circle cx="0.3" cy="0.5" r="0.05" fill="#a39a85" />
          </pattern>
          <pattern id="pat-gasolio" width="1.2" height="1.2" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
            <rect width="1.2" height="1.2" fill="#2b2e33" />
            <rect width="1.2" height="0.25" fill="#5a4d7a" opacity="0.6" />
            <rect y="0.5" width="1.2" height="0.18" fill="#3d6a6a" opacity="0.55" />
          </pattern>
          <pattern id="pat-lapideo" width="0.24" height="0.24" patternUnits="userSpaceOnUse">
            <rect width="0.24" height="0.24" fill="#55585a" />
            <rect x="0.01" y="0.01" width="0.1" height="0.1" fill="#6c6e6f" />
            <rect x="0.13" y="0.13" width="0.1" height="0.1" fill="#626567" />
          </pattern>
          <pattern id="pat-ormaia" width="1" height="1" patternUnits="userSpaceOnUse">
            <rect width="1" height="1" fill="#3e4a55" />
            <rect y="0.2" width="1" height="0.6" fill="#5f86a8" />
          </pattern>
          <pattern id="pat-dosso" width="0.8" height="0.8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="0.8" height="0.8" fill="#d8d2c4" />
            <rect width="0.4" height="0.8" fill="#2d2f31" />
          </pattern>
          <pattern id="pat-fresato" width="0.5" height="0.5" patternUnits="userSpaceOnUse">
            <rect width="0.5" height="0.5" fill="#3a3c3f" />
            <rect width="0.08" height="0.5" fill="#55585c" />
          </pattern>
          <pattern id="pat-fessure" width="1.5" height="1.5" patternUnits="userSpaceOnUse">
            <path d="M0,0.3 L0.5,0.6 L0.9,0.2 L1.5,0.7 M0.4,1.5 L0.7,1 L1.2,1.2" stroke="#16181a" strokeWidth="0.07" fill="none" />
          </pattern>
        </defs>
        <g transform={tf}>
          <StaticLayer world={world} />
          <DynamicLayer sim={sim} t={t} f={f} params={params} past={past} future={future} />
        </g>
        {/* etichette in coordinate schermo */}
        {sim.events
          .filter((e) => e.t <= t && e.kind !== 'nota')
          .map((e, i) => {
            const s = toScreen(e);
            return (
              <g key={i}>
                <circle cx={s.x} cy={s.y} r={5} fill={e.kind === 'urto' || e.kind === 'caduta' ? '#d03b3b' : e.kind === 'frenata' || e.kind === 'abs' ? '#fab219' : '#ffffff'} stroke="#111" strokeWidth={1.5} />
              </g>
            );
          })}
        <ScaleBar k={k} />
      </svg>
    </div>
  );
}

function ScaleBar({ k }: { k: number }) {
  const choices = [5, 10, 20, 50, 100, 200];
  const m = choices.find((c) => c * k > 70) ?? 200;
  const w = m * k;
  return (
    <g transform={`translate(${VW - w - 16} ${VH - 18})`}>
      <rect x={-6} y={-16} width={w + 12} height={24} rx={4} fill="rgb(14 17 20 / 0.6)" />
      <line x1={0} x2={w} y1={0} y2={0} stroke="#fff" strokeWidth={2} />
      <line x1={0} x2={0} y1={-4} y2={2} stroke="#fff" strokeWidth={2} />
      <line x1={w} x2={w} y1={-4} y2={2} stroke="#fff" strokeWidth={2} />
      <text x={w / 2} y={-5} fill="#fff" fontSize={11} textAnchor="middle" fontFamily="var(--font-mono)">
        {m} m
      </text>
    </g>
  );
}

function DynamicLayer({ sim, t, f, params, past, future }: { sim: SimResult; t: number; f: EgoFrame; params: SimParams; past: EgoFrame[]; future: EgoFrame[] }) {
  const world = sim.world;
  const spec = world.spec;
  const g = world.roads.get(spec.ego.road)!;
  const riding = f.phase === 'marcia' || f.phase === 'reazione' || f.phase === 'frenata' || f.phase === 'velocità adeguata';

  // spazio d'arresto residuo lungo la traiettoria
  let stopBand: Vec2[] | null = null;
  if (riding && f.v > 0.5) {
    const a = sim.metrics.decel;
    const pT = sim.metrics.perceptionT;
    const remainingReaction = f.phase === 'frenata' ? 0 : pT !== undefined ? Math.max(0, pT + params.tau - t) : params.tau;
    const L = f.v * remainingReaction + (f.v * f.v) / (2 * a);
    stopBand = g.polyline(f.d, f.s, f.s + L, 1);
  }

  // fascio dell'anabbagliante (notte)
  const night = params.night && !spec.roads.some((r) => r.style === 'urbano');
  let beam: Vec2[] | null = null;
  if (night && f.phase !== 'scivolata' && f.phase !== 'urto') {
    const half = (14 * Math.PI) / 180;
    const pts: Vec2[] = [{ x: f.x, y: f.y }];
    for (let i = 0; i <= 16; i++) {
      const ang = -half + (2 * half * i) / 16;
      const inside = Math.sign(ang) === Math.sign(f.lean) && Math.abs(f.lean) > 0.02;
      const factor = inside ? Math.max(0.2, 1 - Math.abs(f.lean) / 0.7) : 1;
      const a2 = inside ? ang * factor : ang;
      const r = 55 * factor;
      pts.push({ x: f.x + Math.cos(f.th + a2) * r, y: f.y + Math.sin(f.th + a2) * r });
    }
    beam = pts;
  }

  const blink = Math.floor(t * 3) % 2 === 0;
  const egoPoly = orientedRect({ x: f.x, y: f.y }, f.th, 2.1, f.phase === 'scivolata' || f.phase === 'urto' ? 1.4 : 0.8);
  const headOff = 1.5 * Math.sin(Math.abs(f.lean));

  return (
    <g>
      {beam && <polygon points={pts(beam)} fill="#ffe9a3" opacity={0.28} />}
      {stopBand && stopBand.length > 1 && (
        <g>
          <polyline points={pts(stopBand)} fill="none" stroke="#f2b632" strokeWidth={0.9} opacity={0.55} strokeLinecap="butt" />
          <circle cx={stopBand[stopBand.length - 1].x} cy={stopBand[stopBand.length - 1].y} r={0.7} fill="#f2b632" stroke="#1a1400" strokeWidth={0.15} />
        </g>
      )}
      <polyline points={pts(future)} fill="none" stroke="#ffffff" strokeWidth={0.18} strokeDasharray="0.6 0.8" opacity={0.7} />
      <polyline points={pts(past)} fill="none" stroke="#f2b632" strokeWidth={0.3} />
      {/* linee di vista verso i bersagli sorvegliati */}
      {spec.ego.watch.map((w, i) => {
        if (t < (w.from ?? 0) - 0.01 && !f.seen[i]) return null;
        let target: Vec2 | undefined;
        if (w.actor) {
          const a = spec.actors.find((q) => q.id === w.actor);
          if (a) target = world.actorState(a, t);
        } else if (w.hazard) target = world.hazards.find((h) => h.spec.id === w.hazard)?.center;
        if (!target || f.phase === 'urto' || f.phase === 'scivolata') return null;
        return (
          <line
            key={i}
            x1={f.x}
            y1={f.y}
            x2={target.x}
            y2={target.y}
            stroke={f.seen[i] ? '#38d17a' : '#ff5a4e'}
            strokeWidth={0.22}
            strokeDasharray={f.seen[i] ? undefined : '1 0.7'}
          />
        );
      })}
      {/* veicoli */}
      {spec.actors.map((a) => {
        const st = world.actorState(a, t);
        const ind = a.indicator && t >= a.indicator.from && (a.indicator.to === undefined || t <= a.indicator.to) && blink;
        return (
          <g key={a.id}>
            {a.spray && params.wet && st.v > 8 && <polygon points={pts(sprayFootprint(world, a, t).poly)} fill="#e8eef2" opacity={0.45} />}
            {st.door > 0 && <polygon points={pts(st.polys[st.polys.length - 1])} fill={a.color ?? '#6b7c8f'} stroke="#111" strokeWidth={0.08} />}
            {st.bodies.map((b, bi) => (
              <ActorShape key={bi} kind={a.kind} color={a.color} part={b.part} poly={st.polys[bi]} />
            ))}
            {ind &&
              (() => {
                const b = st.bodies[0];
                const side = a.indicator!.side === 'left' ? 1 : -1;
                const ox = -Math.sin(b.th) * side * (b.w / 2);
                const oy = Math.cos(b.th) * side * (b.w / 2);
                const fx = Math.cos(b.th) * (b.l / 2 - 0.2);
                const fy = Math.sin(b.th) * (b.l / 2 - 0.2);
                return <circle cx={b.x + ox + fx} cy={b.y + oy + fy} r={0.32} fill="#ffb020" />;
              })()}
          </g>
        );
      })}
      {/* moto: ingombro dinamico del pilota in piega */}
      {headOff > 0.05 && riding && (
        <polygon
          points={pts(orientedRect({ x: f.x - Math.sin(f.th) * Math.sign(f.lean) * (headOff / 2 + 0.2), y: f.y + Math.cos(f.th) * Math.sign(f.lean) * (headOff / 2 + 0.2) }, f.th, 0.6, headOff))}
          fill="#f2b632"
          opacity={0.35}
        />
      )}
      <polygon points={pts(egoPoly)} fill={MAP.ego} stroke={MAP.egoBordo} strokeWidth={0.12} />
      <circle cx={f.x - Math.cos(f.th) * 0.2} cy={f.y - Math.sin(f.th) * 0.2} r={0.28} fill="#1a1400" />
    </g>
  );
}
