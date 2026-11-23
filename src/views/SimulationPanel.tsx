/**
 * Banco di simulazione di uno scenario: vista dall'alto e 3D sincronizzate, linea del tempo,
 * parametri regolabili, esito, confronto tra dispositivi di ritenuta e grafico della velocità.
 */
import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import type { ScenePreset } from '../scene/presets';
import { simulate, type SimResult } from '../scene/simulate';
import { DEFAULT_PARAMS, type BarrierChoice, type SimParams } from '../scene/types';
import { Clock, useClockState } from './clock';
import { TopView } from './TopView';
import { PovView } from './PovView';
import { LineChart } from '../components/LineChart';
import { G } from '../physics/units';

interface RangeDef {
  label: string;
  min: number;
  max: number;
  step: number;
  fmt: (v: number) => string;
}

const RANGES: Partial<Record<keyof SimParams, RangeDef>> = {
  speed: { label: 'Velocità della moto', min: 10, max: 220, step: 5, fmt: (v) => `${v} km/h` },
  tau: { label: 'Tempo di reazione', min: 0.5, max: 2.5, step: 0.1, fmt: (v) => `${v.toFixed(1)} s` },
  effort: { label: 'Quanto forte freni', min: 0.4, max: 1, step: 0.05, fmt: (v) => `${Math.round(v * 100)}% dell’aderenza` },
  maxLean: { label: 'Piega massima che accetti', min: 25, max: 55, step: 1, fmt: (v) => `${v}°` },
  gap: { label: 'Distanza dal veicolo davanti', min: 0.5, max: 4, step: 0.1, fmt: (v) => `${v.toFixed(1)} s` },
  offset: { label: 'Posizione nella corsia', min: -1.5, max: 1.5, step: 0.1, fmt: (v) => (Math.abs(v) < 0.05 ? 'riferimento' : `${Math.abs(v).toFixed(1)} m a ${v > 0 ? 'destra' : 'sinistra'}`) },
  crossAngle: { label: 'Angolo di attraversamento', min: 5, max: 70, step: 1, fmt: (v) => `${v}°` },
  accel: { label: 'Accelerazione nel rettilineo', min: 0.8, max: 3.5, step: 0.1, fmt: (v) => `${v.toFixed(1)} m/s²` },
};

const TOGGLES: Partial<Record<keyof SimParams, string>> = {
  wet: 'Fondo bagnato, pioggia',
  night: 'Notte',
  abs: 'ABS',
  ice: 'Ghiaccio nelle zone in ombra',
};

const BARRIERS: BarrierChoice[] = ['nessuna', 'paletti', 'dsm'];
const BARRIER_DEFAULT: Record<BarrierChoice, string> = {
  nessuna: 'Nessuna barriera',
  paletti: 'Guard-rail a paletti',
  dsm: 'Guard-rail con protezione per motociclisti',
};

export function SimulationPanel({ preset }: { preset: ScenePreset }) {
  const initial = useMemo<SimParams>(() => ({ ...DEFAULT_PARAMS, ...preset.defaults }), [preset]);
  const [params, setParams] = useState<SimParams>(initial);
  useEffect(() => setParams(initial), [initial]);
  const deferred = useDeferredValue(params);
  const spec = useMemo(() => preset.build(deferred), [preset, deferred]);
  const sim = useMemo(() => simulate(spec, deferred), [spec, deferred]);
  const clock = useMemo(() => new Clock(), []);
  const { t, playing, rate } = useClockState(clock);
  const duration = sim.frames[sim.frames.length - 1].t;
  const hasBarrier = preset.controls.includes('barrier');
  const barrierName = (b: BarrierChoice) => preset.barrierLabels?.[b] ?? BARRIER_DEFAULT[b];

  // confronto tra i tre dispositivi a parità di tutti gli altri parametri
  const comparison = useMemo(() => {
    if (!hasBarrier) return null;
    return BARRIERS.map((b) => {
      const p = { ...deferred, barrier: b };
      return { b, sim: b === deferred.barrier ? sim : simulate(preset.build(p), p) };
    });
  }, [hasBarrier, deferred, preset, sim]);

  useEffect(() => {
    clock.setDuration(duration);
  }, [clock, duration]);

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!reduce) {
      const id = window.setTimeout(() => clock.play(), 600);
      return () => window.clearTimeout(id);
    }
  }, [clock, preset]);

  useEffect(() => () => clock.dispose(), [clock]);

  const set = <K extends keyof SimParams>(k: K, v: SimParams[K]) => {
    setParams((p) => ({ ...p, [k]: v }));
  };

  const limit = spec.ego.limit;
  const egoSpeed = preset.controls.includes('speed') && !preset.labels?.speed ? params.speed : spec.ego.speed;
  const over = egoSpeed > limit;
  const speedSeries = useMemo(() => sim.frames.filter((_, i) => i % 5 === 0).map((f) => [f.t, f.v * 3.6] as [number, number]), [sim]);
  const vMax = Math.max(30, ...speedSeries.map((p) => p[1]));
  const markers = sim.events.filter((e) => e.kind !== 'nota' && e.kind !== 'abs').map((e) => ({ x: e.t, label: e.kind }));
  const m = sim.metrics;
  const o = sim.outcome;

  return (
    <section className="stack" aria-label="Simulazione dinamica">
      <div className="sim-layout">
        <TopView sim={sim} clock={clock} params={deferred} />
        <PovView sim={sim} clock={clock} params={deferred} />
      </div>

      <div className="panel panel-tight">
        <div className="timeline">
          <button type="button" className="btn btn-primary" onClick={() => clock.toggle()} aria-label={playing ? 'Pausa' : 'Riproduci'}>
            {playing ? 'Pausa' : 'Riproduci'}
          </button>
          <button type="button" className="btn" onClick={() => clock.set(0)}>
            Dall’inizio
          </button>
          <div className="scrub">
            <input
              id="scrub"
              type="range"
              min={0}
              max={duration}
              step={0.01}
              value={t}
              aria-label="Istante della simulazione"
              onChange={(e) => {
                clock.pause();
                clock.set(Number(e.target.value));
              }}
            />
            {sim.events
              .filter((e) => e.kind !== 'nota')
              .map((e, i) => (
                <span
                  key={i}
                  className="mark"
                  style={{ left: `${(e.t / duration) * 100}%`, background: e.kind === 'urto' || e.kind === 'caduta' ? 'var(--status-critical)' : e.kind === 'percezione' ? 'var(--series-1)' : 'var(--status-warning)' }}
                />
              ))}
          </div>
          <div className="row">
            <span className="num small">
              {t.toFixed(2)} / {duration.toFixed(1)} s
            </span>
            <div className="seg" role="group" aria-label="Velocità di riproduzione">
              {[0.25, 0.5, 1].map((r) => (
                <button key={r} type="button" aria-pressed={rate === r} onClick={() => clock.setRate(r)}>
                  {r}×
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="panel stack">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <h3>Prova a cambiare</h3>
            <button type="button" className="btn" onClick={() => setParams(initial)}>
              Ripristina
            </button>
          </div>
          <p className="small muted">{preset.guida}</p>
          <div className="controls">
            {preset.controls
              .filter((k) => RANGES[k])
              .map((k) => {
                const def = RANGES[k]!;
                const v = params[k] as number;
                const [min, max] = k === 'speed' && preset.speedRange ? preset.speedRange : [def.min, def.max];
                return (
                  <label key={k} className="ctl" htmlFor={`ctl-${k}`}>
                    <span className="ctl-head">
                      <span>{preset.labels?.[k] ?? def.label}</span>
                      <span className="num">{def.fmt(v)}</span>
                    </span>
                    <input id={`ctl-${k}`} type="range" min={min} max={max} step={def.step} value={v} onChange={(e) => set(k, Number(e.target.value) as never)} />
                    {k === 'speed' && !preset.labels?.speed && (
                      <span className="small" style={{ color: over ? 'var(--danger)' : 'var(--muted)' }}>
                        Limite {limit} km/h{over ? ` · ${params.speed - limit} km/h oltre il limite` : ''}
                      </span>
                    )}
                  </label>
                );
              })}
          </div>
          <div className="row" style={{ gap: '1rem' }}>
            {preset.controls
              .filter((k) => TOGGLES[k])
              .map((k) => (
                <label key={k} className="toggle" htmlFor={`tg-${k}`}>
                  <input id={`tg-${k}`} type="checkbox" checked={params[k] as boolean} onChange={(e) => set(k, e.target.checked as never)} />
                  {preset.labels?.[k] ?? TOGGLES[k]}
                </label>
              ))}
          </div>
          {hasBarrier && (
            <div className="stack" style={{ gap: '0.35rem' }}>
              <span className="small">Cosa c’è sul margine della strada</span>
              <div className="seg seg-wrap" role="group" aria-label="Dispositivo sul margine">
                {BARRIERS.map((b) => (
                  <button key={b} type="button" aria-pressed={params.barrier === b} onClick={() => set('barrier', b)}>
                    {barrierName(b)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="stack">
          <div className={`outcome outcome-${o.kind} panel`}>
            <span className="eyebrow">Come va a finire</span>
            <h3>{o.title}</h3>
            <p className="small">{o.detail}</p>
          </div>
          <div className="panel stack">
            <dl className="kv" style={{ margin: 0 }}>
              <div>
                <dt>Vedi il pericolo a</dt>
                <dd>{m.perceptionDist !== undefined ? `${m.perceptionDist.toFixed(0)} m` : '—'}</dd>
              </div>
              <div>
                <dt>Ti servono per fermarti</dt>
                <dd>{m.stopDistance.toFixed(0)} m</dd>
              </div>
              <div>
                <dt>Frenata impostata</dt>
                <dd>{(m.decel / G).toFixed(2)} g</dd>
              </div>
              <div>
                <dt>Aderenza dell’asfalto</dt>
                <dd>μ {m.muBase.toFixed(2)}</dd>
              </div>
            </dl>
            <ul className="events" aria-label="Sequenza degli eventi">
              {sim.events.map((e, i) => (
                <li key={i} onClick={() => clock.set(e.t)} title="Vai a questo istante">
                  <span className="num muted">{e.t.toFixed(2)} s</span>
                  <span>{e.label}</span>
                </li>
              ))}
              {!sim.events.length && <li className="muted">Nessun evento: la moto percorre la scena senza conflitti.</li>}
            </ul>
          </div>
        </div>
      </div>

      {comparison && <BarrierComparison rows={comparison} current={params.barrier} name={barrierName} onPick={(b) => set('barrier', b)} />}

      <div className="panel">
        <LineChart
          title="Velocità della moto nel tempo"
          series={[{ id: 'v', label: 'Velocità della moto', color: 'var(--series-1)', points: speedSeries }]}
          xLabel="tempo"
          xUnit="s"
          yLabel="velocità"
          yUnit="km/h"
          xDomain={[0, duration]}
          yDomain={[0, Math.ceil((vMax * 1.1) / 10) * 10]}
          markers={markers}
          cursor={t}
          height={200}
        />
      </div>
    </section>
  );
}

function BarrierComparison({ rows, current, name, onPick }: { rows: { b: BarrierChoice; sim: SimResult }[]; current: BarrierChoice; name: (b: BarrierChoice) => string; onPick: (b: BarrierChoice) => void }) {
  return (
    <div className="panel stack">
      <div className="stack" style={{ gap: '0.2rem' }}>
        <span className="eyebrow">Stessa caduta, margine diverso</span>
        <h3>Con e senza guard-rail</h3>
        <p className="small muted">
          La caduta è la stessa: cambia solo ciò che il corpo incontra a lato della strada. Le barriere sono progettate per contenere auto e mezzi
          pesanti (44-572 kJ); il motociclista a terra porta pochi kJ e arriva sotto la lama.
        </p>
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Margine</th>
              <th>Esito</th>
              <th style={{ textAlign: 'right' }}>Velocità all’impatto</th>
              <th style={{ textAlign: 'right' }}>Energia del corpo</th>
              <th>Cosa dicono le prove</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ b, sim }) => {
              const im = sim.impact;
              const sev = sim.outcome.kind === 'urto' ? 'critical' : sim.outcome.kind === 'caduta' ? (im ? 'serious' : 'warning') : 'good';
              return (
                <tr key={b} onClick={() => onPick(b)} style={{ cursor: 'pointer', background: b === current ? 'var(--accent-soft)' : undefined }}>
                  <td>
                    <span className={`risk risk-${{ good: 1, warning: 2, serious: 3, critical: 4 }[sev]}`}>{name(b)}</span>
                  </td>
                  <td>{sim.outcome.title}</td>
                  <td className="n">{im ? `${im.vKmh.toFixed(0)} km/h` : '—'}</td>
                  <td className="n">{im ? `${im.energiaKJ.toFixed(1)} kJ` : '—'}</td>
                  <td className="small">{im?.nota ?? (sim.outcome.kind === 'caduta' ? 'Il corpo si ferma prima di raggiungere il margine.' : '—')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
