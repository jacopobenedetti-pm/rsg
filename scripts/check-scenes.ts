/**
 * Banco di prova delle scene: esegue la simulazione con i parametri di default e con alcune varianti.
 * Uso: npx tsx scripts/check-scenes.ts [ID]
 */
import { SCENES } from '../src/scene/presets';
import { simulate } from '../src/scene/simulate';
import { DEFAULT_PARAMS, type SimParams } from '../src/scene/types';

const only = process.argv[2];
const variants: Record<string, Partial<SimParams>[]> = {
  'U-01': [{ speed: 40 }, { speed: 50 }, { speed: 60 }, { speed: 70 }],
  'U-02': [{ speed: 30 }, { speed: 40 }, { speed: 50 }, { speed: 60 }],
  'U-05': [{}, { abs: true }, { wet: false }, { gap: 2.5 }],
  'U-09': [{ gap: 1 }, { gap: 2 }, { gap: 2.5 }, { gap: 3 }],
  'U-10': [{ speed: 18 }, { speed: 22 }, { speed: 30 }, { speed: 35 }],
  'U-12': [{ speed: 25 }, { speed: 35 }, { speed: 45 }, { speed: 55 }],
  'U-18': [{ speed: 50 }, { speed: 60 }, { speed: 70 }, { speed: 90 }],
  'E-01': [{ speed: 60 }, { speed: 70 }, { speed: 80 }, { speed: 70, offset: -1 }, { speed: 70, night: true }],
  'E-02': [{ speed: 80 }, { speed: 90 }, { speed: 100 }, { speed: 90, wet: true }],
  'E-04': [{ speed: 70 }, { speed: 80 }, { speed: 90 }, { speed: 100 }],
  'E-05': [{ speed: 45 }, { speed: 50 }, { speed: 60 }, { speed: 60, offset: 0.8 }],
  'E-11': [{ speed: 80 }, { speed: 90 }, { speed: 100 }, { speed: 110 }],
  'E-12': [{ speed: 40 }, { speed: 60 }, { speed: 60, offset: 0.5 }, { speed: 60, offset: 0.7 }],
  'E-14': [{ speed: 50 }, { speed: 70 }, { speed: 70, night: false }, { speed: 40 }],
  'A-01': [{ speed: 110 }, { speed: 130 }, { speed: 150 }, { speed: 170 }],
  'A-02': [{ speed: 40 }, { speed: 50 }, { speed: 60 }, { speed: 70 }],
  'A-07': [{ gap: 1 }, { gap: 2 }, { gap: 3 }, { speed: 100, gap: 3 }],
  'A-12': [{ speed: 130 }, { speed: 150 }, { speed: 170 }, { speed: 190 }],
};

for (const [id, preset] of Object.entries(SCENES)) {
  if (only && id !== only) continue;
  console.log(`\n== ${id}`);
  for (const v of variants[id] ?? [{}]) {
    const p: SimParams = { ...DEFAULT_PARAMS, ...preset.defaults, ...v };
    const t0 = performance.now();
    const spec = preset.build(p);
    const r = simulate(spec, p);
    const ms = performance.now() - t0;
    const m = r.metrics;
    const tag = Object.entries(v).map(([k, x]) => `${k}=${x}`).join(' ') || 'default';
    console.log(
      `  [${tag.padEnd(22)}] ${r.outcome.title.padEnd(40)} perc=${m.perceptionT?.toFixed(2) ?? '-'}s dist=${m.perceptionDist?.toFixed(1) ?? '-'}m stop=${m.stopDistance.toFixed(1)}m  (${ms.toFixed(0)} ms)`,
    );
    if (only) for (const e of r.events) console.log(`      t=${e.t.toFixed(2)} ${e.kind}: ${e.label}`);
  }
}
