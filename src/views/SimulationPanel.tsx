/**
 * Banco di simulazione di uno scenario: vista dall'alto e 3D sincronizzate, linea del tempo,
 * parametri regolabili, esito e grafico della velocità.
 */
import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import type { ScenePreset } from '../scene/presets';
import { simulate } from '../scene/simulate';
import { DEFAULT_PARAMS, type SimParams } from '../scene/types';
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
  help: string;
}

const RANGES: Partial<Record<keyof SimParams, RangeDef>> = {
  speed: { label: 'Velocità della moto', min: 10, max: 220, step: 5, fmt: (v) => `${v} km/h`, help: 'Velocità costante fino alla reazione.' },
  tau: { label: 'Tempo di percezione e reazione', min: 0.5, max: 2.5, step: 0.1, fmt: (v) => `${v.toFixed(1)} s`, help: 'Da quando il pericolo è visibile all’inizio della frenata.' },
  effort: { label: 'Intensità della frenata', min: 0.4, max: 1, step: 0.05, fmt: (v) => `${Math.round(v * 100)}% dell’aderenza`, help: 'Un motociclista medio raramente supera il 70-80%.' },
  maxLean: { label: 'Piega massima accettata dal pilota', min: 25, max: 55, step: 1, fmt: (v) => `${v}°`, help: 'Oltre questo angolo il pilota non segue più la curva.' },
  gap: { label: 'Distanza dal veicolo che precede', min: 0.5, max: 4, step: 0.1, fmt: (v) => `${v.toFixed(1)} s`, help: 'Intervallo temporale rispetto al veicolo davanti.' },
  offset: { label: 'Posizione nella corsia', min: -1.5, max: 1.5, step: 0.1, fmt: (v) => (Math.abs(v) < 0.05 ? 'riferimento' : `${Math.abs(v).toFixed(1)} m a ${v > 0 ? 'destra' : 'sinistra'}`), help: 'Spostamento rispetto alla traiettoria di riferimento.' },
};

const TOGGLES: Partial<Record<keyof SimParams, string>> = {
  wet: 'Fondo bagnato, pioggia',
  night: 'Notte',
  abs: 'ABS',
};

export function SimulationPanel({ preset, limitHint }: { preset: ScenePreset; limitHint?: string }) {
  const initial = useMemo<SimParams>(() => ({ ...DEFAULT_PARAMS, ...preset.defaults }), [preset]);
  const [params, setParams] = useState<SimParams>(initial);
  useEffect(() => setParams(initial), [initial]);
  const deferred = useDeferredValue(params);
  const spec = useMemo(() => preset.build(deferred), [preset, deferred]);
  const sim = useMemo(() => simulate(spec, deferred), [spec, deferred]);
  const clock = useMemo(() => new Clock(), []);
  const { t, playing, rate } = useClockState(clock);
  const duration = sim.frames[sim.frames.length - 1].t;

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
  const over = params.speed > limit;
  const speedSeries = useMemo(() => sim.frames.filter((_, i) => i % 5 === 0).map((f) => [f.t, f.v * 3.6] as [number, number]), [sim]);
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
                <span key={i} className="mark" style={{ left: `${(e.t / duration) * 100}%`, background: e.kind === 'urto' || e.kind === 'caduta' ? 'var(--status-critical)' : e.kind === 'percezione' ? 'var(--series-1)' : 'var(--status-warning)' }} />
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
            <h3>Parametri</h3>
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
                return (
                  <label key={k} className="ctl" htmlFor={`ctl-${k}`}>
                    <span className="ctl-head">
                      <span>{def.label}</span>
                      <span className="num">{def.fmt(v)}</span>
                    </span>
                    <input id={`ctl-${k}`} type="range" min={def.min} max={def.max} step={def.step} value={v} onChange={(e) => set(k, Number(e.target.value) as never)} />
                    {k === 'speed' && (
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
                  {TOGGLES[k]}
                </label>
              ))}
          </div>
          {limitHint && <p className="small muted">{limitHint}</p>}
        </div>

        <div className="stack">
          <div className={`outcome outcome-${o.kind} panel`}>
            <span className="eyebrow">Esito della simulazione</span>
            <h3>{o.title}</h3>
            <p className="small">{o.detail}</p>
          </div>
          <div className="panel stack">
            <dl className="kv" style={{ margin: 0 }}>
              <div>
                <dt>Pericolo percepito a</dt>
                <dd>{m.perceptionDist !== undefined ? `${m.perceptionDist.toFixed(0)} m` : '—'}</dd>
              </div>
              <div>
                <dt>Spazio d’arresto teorico</dt>
                <dd>{m.stopDistance.toFixed(0)} m</dd>
              </div>
              <div>
                <dt>Decelerazione impostata</dt>
                <dd>{(m.decel / G).toFixed(2)} g</dd>
              </div>
              <div>
                <dt>Aderenza della pavimentazione</dt>
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

      <div className="panel">
        <LineChart
          title="Velocità della moto nel tempo"
          series={[{ id: 'v', label: 'Velocità della moto', color: 'var(--series-1)', points: speedSeries }]}
          xLabel="tempo"
          xUnit="s"
          yLabel="velocità"
          yUnit="km/h"
          xDomain={[0, duration]}
          yDomain={[0, Math.max(30, Math.ceil((params.speed * 1.1) / 10) * 10)]}
          markers={markers}
          cursor={t}
          height={200}
        />
      </div>
    </section>
  );
}
