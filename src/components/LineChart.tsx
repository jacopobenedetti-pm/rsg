/**
 * Grafico a linee in SVG: un solo asse y, griglia recessiva, legenda per due o più serie,
 * crosshair con tooltip al passaggio del puntatore, marcatori verticali opzionali.
 */
import { useId, useMemo, useRef, useState } from 'react';

export interface Series {
  id: string;
  label: string;
  /** colore come variabile CSS, es. var(--series-1) */
  color: string;
  points: [number, number][];
  dashed?: boolean;
}

export interface Marker {
  x: number;
  label: string;
  color?: string;
}

export interface Band {
  y0: number;
  y1: number;
  label?: string;
  color: string;
}

interface Props {
  series: Series[];
  xLabel: string;
  yLabel: string;
  xUnit?: string;
  yUnit?: string;
  xDomain?: [number, number];
  yDomain?: [number, number];
  markers?: Marker[];
  bands?: Band[];
  /** posizione corrente (es. tempo di riproduzione) */
  cursor?: number;
  height?: number;
  digits?: number;
  title?: string;
}

const W = 640;

function niceTicks(a: number, b: number, n = 5) {
  const span = b - a || 1;
  const step0 = span / n;
  const mag = 10 ** Math.floor(Math.log10(step0));
  const err = step0 / mag;
  const step = (err >= 7.5 ? 10 : err >= 3.5 ? 5 : err >= 1.5 ? 2 : 1) * mag;
  const ticks: number[] = [];
  for (let v = Math.ceil(a / step) * step; v <= b + 1e-9; v += step) ticks.push(+v.toFixed(10));
  return ticks;
}

export function LineChart({ series, xLabel, yLabel, xUnit = '', yUnit = '', xDomain, yDomain, markers = [], bands = [], cursor, height = 260, digits = 1, title }: Props) {
  const id = useId();
  const H = height;
  const m = { l: 48, r: 16, t: 14, b: 38 };
  const all = series.flatMap((s) => s.points);
  const xd: [number, number] = xDomain ?? [Math.min(...all.map((p) => p[0])), Math.max(...all.map((p) => p[0]))];
  const yd: [number, number] = yDomain ?? [Math.min(0, ...all.map((p) => p[1])), Math.max(...all.map((p) => p[1])) * 1.08 || 1];
  const sx = (x: number) => m.l + ((x - xd[0]) / (xd[1] - xd[0] || 1)) * (W - m.l - m.r);
  const sy = (y: number) => H - m.b - ((y - yd[0]) / (yd[1] - yd[0] || 1)) * (H - m.t - m.b);
  const xt = useMemo(() => niceTicks(xd[0], xd[1], 6), [xd[0], xd[1]]);
  const yt = useMemo(() => niceTicks(yd[0], yd[1], 5), [yd[0], yd[1]]);
  const [hover, setHover] = useState<number | null>(null);
  const ref = useRef<SVGSVGElement>(null);

  const onMove = (e: React.PointerEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const px = ((e.clientX - r.left) / r.width) * W;
    const x = xd[0] + ((px - m.l) / (W - m.l - m.r)) * (xd[1] - xd[0]);
    setHover(Math.max(xd[0], Math.min(xd[1], x)));
  };

  const valueAt = (s: Series, x: number) => {
    const p = s.points;
    if (!p.length) return null;
    if (x <= p[0][0]) return p[0][1];
    for (let i = 1; i < p.length; i++) {
      if (x <= p[i][0]) {
        const u = (x - p[i - 1][0]) / (p[i][0] - p[i - 1][0] || 1);
        return p[i - 1][1] + (p[i][1] - p[i - 1][1]) * u;
      }
    }
    return null;
  };

  const path = (pts: [number, number][]) => pts.map((p, i) => `${i ? 'L' : 'M'}${sx(p[0]).toFixed(1)},${sy(p[1]).toFixed(1)}`).join('');

  return (
    <figure style={{ margin: 0, position: 'relative' }} aria-label={title}>
      {series.length > 1 && (
        <div className="legend" style={{ marginBottom: 6 }}>
          {series.map((s) => (
            <span key={s.id}>
              <i style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      )}
      <svg ref={ref} className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby={`${id}-t`} onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
        <title id={`${id}-t`}>{title ?? `${yLabel} in funzione di ${xLabel}`}</title>
        <clipPath id={`${id}-clip`}>
          <rect x={m.l} y={m.t} width={W - m.l - m.r} height={H - m.t - m.b} />
        </clipPath>
        {bands.map((b, i) => (
          <rect key={i} x={m.l} width={W - m.l - m.r} y={sy(Math.min(yd[1], b.y1))} height={Math.max(0, sy(Math.max(yd[0], b.y0)) - sy(Math.min(yd[1], b.y1)))} fill={b.color} opacity={0.14} />
        ))}
        <g className="grid">
          {yt.map((v) => (
            <line key={v} x1={m.l} x2={W - m.r} y1={sy(v)} y2={sy(v)} />
          ))}
        </g>
        {yt.map((v) => (
          <text key={v} x={m.l - 6} y={sy(v) + 4} textAnchor="end">
            {v}
          </text>
        ))}
        {xt.map((v) => (
          <text key={v} x={sx(v)} y={H - m.b + 16} textAnchor="middle">
            {v}
          </text>
        ))}
        <text x={(m.l + W - m.r) / 2} y={H - 4} textAnchor="middle">
          {xLabel}
          {xUnit ? ` [${xUnit}]` : ''}
        </text>
        <text x={12} y={(m.t + H - m.b) / 2} textAnchor="middle" transform={`rotate(-90 12 ${(m.t + H - m.b) / 2})`}>
          {yLabel}
          {yUnit ? ` [${yUnit}]` : ''}
        </text>
        <line x1={m.l} x2={W - m.r} y1={sy(yd[0])} y2={sy(yd[0])} stroke="var(--muted)" />
        <g clipPath={`url(#${id}-clip)`}>
          {series.map((s) => (
            <path key={s.id} d={path(s.points)} fill="none" stroke={s.color} strokeWidth={2} strokeDasharray={s.dashed ? '6 4' : undefined} strokeLinejoin="round" strokeLinecap="round" />
          ))}
        </g>
        {markers.map((mk, i) =>
          mk.x >= xd[0] && mk.x <= xd[1] ? (
            <g key={i}>
              <line x1={sx(mk.x)} x2={sx(mk.x)} y1={m.t} y2={H - m.b} stroke={mk.color ?? 'var(--muted)'} strokeDasharray="3 3" />
              <text x={sx(mk.x) + 3} y={m.t + 10 + (i % 3) * 12} style={{ fill: 'var(--ink-2)' }}>
                {mk.label}
              </text>
            </g>
          ) : null,
        )}
        {cursor !== undefined && cursor >= xd[0] && cursor <= xd[1] && <line x1={sx(cursor)} x2={sx(cursor)} y1={m.t} y2={H - m.b} stroke="var(--accent)" strokeWidth={2} />}
        {hover !== null && (
          <g>
            <line x1={sx(hover)} x2={sx(hover)} y1={m.t} y2={H - m.b} stroke="var(--ink-2)" strokeWidth={1} />
            {series.map((s) => {
              const v = valueAt(s, hover);
              return v === null ? null : <circle key={s.id} cx={sx(hover)} cy={sy(v)} r={4} fill={s.color} stroke="var(--surface)" strokeWidth={2} />;
            })}
          </g>
        )}
        <rect x={m.l} y={m.t} width={W - m.l - m.r} height={H - m.t - m.b} fill="transparent" />
      </svg>
      {hover !== null && (
        <div className="tooltip" style={{ left: `${(sx(hover) / W) * 100}%`, top: 24, transform: sx(hover) > W * 0.6 ? 'translateX(calc(-100% - 10px))' : 'translateX(10px)' }}>
          <div className="num">
            {xLabel}: {hover.toFixed(digits)} {xUnit}
          </div>
          {series.map((s) => {
            const v = valueAt(s, hover);
            return v === null ? null : (
              <div key={s.id} className="num" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <i style={{ width: 10, height: 3, background: s.color, display: 'inline-block' }} />
                {s.label}: {v.toFixed(digits)} {yUnit}
              </div>
            );
          })}
        </div>
      )}
    </figure>
  );
}
