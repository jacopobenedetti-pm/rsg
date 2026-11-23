import type { ScenePreset } from './types';
import type { ActorSpec, ObjectSpec, RoadSpec } from '../types';
import { arc, geom, guardrail, hedge, motion, newjersey, still, str, treeRow } from '../builders';

const W = 3.75;
const SL = 0.7;
const MED = 3.0;
const LANE = (i: number) => W * (i - 0.5); // 1 = corsia di sorpasso, 3 = corsia di marcia

function motorway(segments: RoadSpec['segments']): RoadSpec {
  return {
    id: 'main',
    style: 'autostrada',
    start: { x: 0, y: 0, heading: 90 },
    segments,
    lanesRight: 3,
    lanesLeft: 0,
    laneWidth: W,
    shoulderRight: 3.0,
    shoulderLeft: SL,
    divided: { median: MED, oppositeLanes: 3, barrier: 'newjersey' },
  };
}

function margins(g: ReturnType<typeof geom>, L: number): ObjectSpec[] {
  return [
    newjersey(g, -SL - MED / 2, 0, L),
    guardrail(g, 3 * W + 3.0 + 0.8, 0, L),
    ...treeRow(g, 3 * W + 3.0 + 9, 0, L, 18, 3.6, 3),
    ...treeRow(g, -(SL + MED + 3 * W + 2 * SL + 3.0 + 9), 0, L, 18, 3.6, 3),
  ];
}

const colors = ['#5d6d7e', '#a04030', '#2e4a62', '#8c8c8c', '#4a6b48', '#b99b6b', '#3d3d3d', '#d0d0d0'];

/* A-01 — fine coda nascosta dalla curva e dallo spartitraffico */
const a01: ScenePreset = {
  defaults: { speed: 130, effort: 0.75 },
  controls: ['speed', 'tau', 'effort', 'wet', 'abs', 'night'],
  guida:
    'Curva sinistrorsa di raggio 700 m con schermo antiabbagliamento nello spartitraffico: dalla corsia di sorpasso la coda ferma è visibile da circa 150 m. A 130 km/h lo spazio basta, a 150 no.',
  build: (p) => {
    const main = motorway([str(300), arc(700, 30), str(300)]);
    const g = geom(main);
    const L = 300 + (700 * 30 * Math.PI) / 180 + 300;
    const q0 = 600;
    const queue: ActorSpec[] = [];
    let k = 0;
    for (let row = 0; row < 6; row++) {
      for (const lane of [1, 2, 3]) {
        const kind = lane === 3 && row % 2 === 0 ? 'camion' : 'auto';
        const len = kind === 'camion' ? 16.5 : 4.3;
        queue.push({
          id: row === 0 && lane === 1 ? 'coda' : `q${k}`,
          kind,
          label: row === 0 && lane === 1 ? 'ultimo veicolo della coda' : 'veicolo in coda',
          color: colors[k % colors.length],
          road: 'main',
          d: LANE(lane),
          lights: true,
          motion: still(q0 + row * 12 + len / 2 + (lane === 3 ? 4 : 0)),
        });
        k++;
      }
    }
    return {
      id: 'A-01',
      duration: 12,
      roads: [main],
      hazards: [],
      objects: [...margins(g, L), hedge(g, -SL - MED / 2, 250, 720, 1.9, 'siepe')],
      actors: queue,
      ego: { road: 'main', s0: 150, d: LANE(1), speed: p.speed, limit: 130, watch: [{ actor: 'coda', label: 'coda ferma' }] },
      notes: [{ t: 0.3, text: 'Corsia di sorpasso in curva sinistrorsa: la visuale è limitata dallo spartitraffico.' }],
      env: { night: p.night },
      frame: [-120, 300, 60, 700],
    };
  },
};

/* A-02 — marcia tra le corsie in coda */
const a02: ScenePreset = {
  defaults: { speed: 60, tau: 0.9 },
  controls: ['speed', 'tau', 'effort', 'wet', 'abs'],
  guida:
    'Coda a 25 km/h su tre corsie; la moto procede sulla linea tra la prima e la seconda corsia. Un’auto della seconda corsia si sposta a sinistra quando la moto è a 12 m. Con 15-20 km/h di differenziale la moto si ferma, con 40 km/h no.',
  build: (p) => {
    const main = motorway([str(700)]);
    const g = geom(main);
    const qv = 25 / 3.6;
    const e0 = 120;
    const cs0 = 200;
    const tChange = Math.max(0.6, (cs0 - 2.15 - (e0 + 1.05) - 12) / Math.max(0.5, p.speed / 3.6 - qv));
    const sChange = cs0 + qv * tChange;
    const queue: ActorSpec[] = [];
    let k = 0;
    for (let s = 100; s < 420; s += 10) {
      for (const lane of [1, 2, 3]) {
        if (lane === 2 && Math.abs(s - cs0) < 5) continue;
        if (lane === 1 && s > cs0 - 3 && s < cs0 + 15) continue;
        const kind = lane === 3 && k % 3 === 0 ? 'camion' : k % 7 === 3 ? 'furgone' : 'auto';
        if (kind === 'camion' && s % 30 !== 10) continue;
        queue.push({ id: `q${k}`, kind, label: 'veicolo in coda', color: colors[k % colors.length], road: 'main', d: LANE(lane) + (lane === 1 ? -0.25 : lane === 2 ? 0.25 : 0), motion: motion(s, 25).build(20) });
        k++;
      }
    }
    return {
      id: 'A-02',
      duration: Math.min(14, tChange + 5),
      roads: [main],
      hazards: [],
      objects: margins(g, 700),
      actors: [
        {
          id: 'cambio',
          kind: 'auto',
          label: 'auto che cambia corsia',
          color: '#c0392b',
          road: 'main',
          d: [
            [sChange, LANE(2) + 0.25],
            [sChange + 20, LANE(1) - 0.25],
          ],
          indicator: { side: 'left', from: Math.max(0, tChange - 0.5) },
          motion: motion(cs0, 25).build(20),
        },
        ...queue,
      ],
      ego: { road: 'main', s0: e0, d: W, speed: p.speed, limit: 130, watch: [{ actor: 'cambio', from: tChange, label: 'auto che si sposta' }] },
      notes: [{ t: tChange, text: 'L’auto si sposta nel varco della corsia di sorpasso.' }],
      frame: [-40, 110, 40, 330],
    };
  },
};

/* A-07 — detriti scoperti dal veicolo che precede */
const a07: ScenePreset = {
  defaults: { speed: 130, gap: 1.0 },
  controls: ['speed', 'gap', 'tau', 'effort', 'wet', 'abs'],
  guida:
    'L’auto davanti evita all’ultimo un battistrada perso da un camion. Con 1 s di distanza la moto lo vede a meno di 60 m; a 130 km/h ne servono 130 per fermarsi. Provare 3 s di distanza e velocità inferiori.',
  build: (p) => {
    const main = motorway([str(900)]);
    const g = geom(main);
    const v = p.speed / 3.6;
    const e0 = 300;
    const c0 = e0 + 3.2 + Math.max(5, p.gap * v);
    const deb = 640;
    return {
      id: 'A-07',
      duration: Math.min(12, (deb + 40 - e0) / v + 2),
      roads: [main],
      hazards: [{ id: 'detrito', kind: 'detrito', road: 'main', s0: deb, s1: deb + 1.2, d0: LANE(2) - 0.5, d1: LANE(2) + 0.4, height: 0.25, label: 'battistrada di camion' }],
      objects: margins(g, 900),
      actors: [
        {
          id: 'auto',
          kind: 'auto',
          label: 'auto che precede',
          color: '#2e4a62',
          road: 'main',
          d: [
            [deb - 28, LANE(2)],
            [deb - 8, LANE(2) + 2.3],
            [deb + 12, LANE(2) + 2.3],
            [deb + 35, LANE(2)],
          ],
          motion: motion(c0, p.speed).build(20),
        },
        { id: 'camion', kind: 'camion', label: 'mezzo pesante', color: '#d9a441', road: 'main', d: LANE(3), motion: motion(e0 + 60, 85).build(20) },
      ],
      ego: { road: 'main', s0: e0, d: LANE(2), speed: p.speed, limit: 130, watch: [{ hazard: 'detrito', range: 160, label: 'oggetto in corsia' }] },
      notes: [{ t: 0.3, text: 'La moto segue un’auto in corsia centrale a distanza ravvicinata.' }],
      frame: [-30, e0 - 20, 30, deb + 60],
    };
  },
};

/* A-12 — velocità molto superiore al limite e cambio di corsia */
const a12: ScenePreset = {
  defaults: { speed: 130, tau: 1.2 },
  controls: ['speed', 'tau', 'effort', 'wet', 'abs'],
  guida:
    'L’auto a 100 km/h in corsia centrale vede la moto nello specchietto a 100 m e due secondi dopo si sposta a sinistra. A 130 km/h il varco basta, a 180-190 km/h la moto raggiunge l’auto prima di riuscire a rallentare.',
  build: (p) => {
    const main = motorway([str(1400)]);
    const g = geom(main);
    const v = p.speed / 3.6;
    const vc = 100 / 3.6;
    const e0 = 100;
    const c0 = e0 + 1.05 + 170 + 2.15;
    // il conducente guarda lo specchietto quando la moto è a 100 m e sposta l'auto 2 s dopo
    const tCheck = Math.max(0, (c0 - 2.15 - (e0 + 1.05) - 100) / Math.max(0.3, v - vc));
    const tChange = tCheck + 2;
    const sChange = c0 + vc * tChange;
    return {
      id: 'A-12',
      duration: Math.min(14, tChange + 7),
      roads: [main],
      hazards: [],
      objects: margins(g, 1400),
      actors: [
        {
          id: 'auto',
          kind: 'auto',
          label: 'auto in sorpasso',
          color: '#c0392b',
          road: 'main',
          d: [
            [sChange, LANE(2)],
            [sChange + 60, LANE(1)],
          ],
          indicator: { side: 'left', from: Math.max(0, tChange - 1) },
          motion: motion(c0, 100).build(20),
        },
        { id: 'lenta', kind: 'furgone', label: 'furgone più lento', color: '#e8e4dc', road: 'main', d: LANE(2), motion: motion(c0 + 45, 80).build(20) },
        { id: 'camion', kind: 'camion', label: 'mezzo pesante', color: '#d9a441', road: 'main', d: LANE(3), motion: motion(c0 + 40, 85).build(20) },
      ],
      ego: { road: 'main', s0: e0, d: LANE(1), speed: p.speed, limit: 130, watch: [{ actor: 'auto', from: tChange, label: 'auto che si sposta in corsia di sorpasso' }] },
      notes: [
        { t: tCheck, text: 'Il conducente guarda lo specchietto: la moto è a 100 m.' },
        { t: tChange, text: 'Due secondi dopo l’auto si sposta in corsia di sorpasso.' },
      ],
      frame: [-40, e0 - 20, 40, sChange + 200],
    };
  },
};

export const AUTOSTRADALE_SCENES: Record<string, ScenePreset> = {
  'A-01': a01,
  'A-02': a02,
  'A-07': a07,
  'A-12': a12,
};
