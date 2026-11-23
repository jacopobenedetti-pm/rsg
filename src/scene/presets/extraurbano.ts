import type { ScenePreset } from './types';
import type { ObjectSpec, RoadSpec } from '../types';
import { arc, delineators, geom, guardrail, hedge, motion, route, spiral, still, str, treeRow } from '../builders';

const W = 3.5;
const SH = 0.5;
const EDGE = W + SH;

function rural(id: string, segments: RoadSpec['segments'], extra: Partial<RoadSpec> = {}): RoadSpec {
  return {
    id,
    style: 'extraurbano',
    start: { x: 0, y: 0, heading: 90 },
    segments,
    lanesRight: 1,
    lanesLeft: 1,
    laneWidth: W,
    shoulderRight: SH,
    shoulderLeft: SH,
    ...extra,
  };
}

/* E-01 — ostacolo oltre una curva cieca in trincea */
const e01: ScenePreset = {
  defaults: { speed: 70, tau: 1.0, offset: 0 },
  controls: ['speed', 'offset', 'tau', 'effort', 'wet', 'abs', 'night'],
  guida:
    'La scarpata sul lato interno chiude la visuale. Spostando la traiettoria verso l’esterno (offset negativo) la visuale si allunga; stringendo la corda si accorcia. Confrontare 60, 70 e 80 km/h.',
  build: (p) => {
    const main = rural('main', [str(150), arc(120, -70), str(220)]);
    const g = geom(main);
    const objects: ObjectSpec[] = [
      hedge(g, EDGE + 1.0, 110, 310, 3.5, 'scarpata'),
      ...treeRow(g, EDGE + 9, 100, 330, 9, 3.2, 1.5),
      guardrail(g, -(EDGE + 0.6), 140, 320),
      ...delineators(g, EDGE + 0.4, -(EDGE + 0.4), 0, 500, 25),
      ...treeRow(g, -(EDGE + 14), 0, 500, 14, 3.5, 3),
    ];
    return {
      id: 'E-01',
      duration: 10,
      roads: [main],
      hazards: [],
      objects,
      actors: [{ id: 'fermo', kind: 'auto', label: 'veicolo in panne', color: '#7d8b99', road: 'main', d: 1.9, lights: true, motion: still(278) }],
      ego: {
        road: 'main',
        s0: 90,
        d: [
          [0, 1.75],
          [140, 1.75],
          [170, 2.5],
          [270, 2.5],
          [300, 1.75],
        ],
        speed: p.speed,
        limit: 90,
        watch: [{ actor: 'fermo', label: 'veicolo fermo in corsia' }],
      },
      notes: [{ t: 0.3, text: 'Curva destrorsa in trincea: il ciglio interno chiude la visuale.' }],
      env: { night: p.night },
      frame: [-40, 90, 190, 330],
    };
  },
};

/* E-02 — curva a raggio decrescente */
const e02: ScenePreset = {
  defaults: { speed: 90, maxLean: 40 },
  controls: ['speed', 'maxLean', 'wet'],
  guida:
    'La curva si chiude da 260 a 80 m di raggio. A 90 km/h la piega richiesta arriva a circa 39°: con fondo bagnato l’aderenza non basta, oltre i 95 km/h il pilota medio non piega abbastanza e la traiettoria si allarga verso la corsia opposta.',
  build: (p) => {
    const main = rural('main', [str(250), arc(260, -15), spiral(260, 80, 60, -1), arc(80, -60), str(200)]);
    const g = geom(main);
    const tight0 = 250 + (260 * 15 * Math.PI) / 180 + 60;
    const tight1 = tight0 + (80 * 60 * Math.PI) / 180;
    const objects: ObjectSpec[] = [
      guardrail(g, -(EDGE + 0.7), 240, tight1 + 190),
      ...delineators(g, EDGE + 0.4, -(EDGE + 0.4), 0, 700, 25),
      ...treeRow(g, EDGE + 8, 0, 650, 12, 3.2, 2),
      ...treeRow(g, -(EDGE + 10), 0, 230, 12, 3.2, 2),
      hedge(g, EDGE + 2.5, tight0 - 40, tight1 + 10, 2.5, 'siepe'),
    ];
    // auto in senso opposto che incrocia la moto nel tratto più stretto
    const tMeet = (tight0 + 15 - 230) / (p.speed / 3.6);
    return {
      id: 'E-02',
      duration: Math.min(12, tMeet + 4),
      roads: [main],
      hazards: [],
      objects,
      actors: [
        {
          id: 'opposta',
          kind: 'auto',
          label: 'auto in senso opposto',
          color: '#2f5d8a',
          road: 'main',
          d: -1.75,
          reverse: true,
          lights: true,
          motion: motion(tight0 + 15 + (70 / 3.6) * tMeet, 70).build(20),
        },
      ],
      ego: { road: 'main', s0: 230, d: 1.6, speed: p.speed, limit: 90, watch: [] },
      notes: [{ t: 0.3, text: 'Ingresso veloce dopo il rettifilo: la curva si chiude progressivamente.' }],
      frame: [-20, 200, 190, 450],
    };
  },
};

/* E-04 — veicolo fermo oltre un dosso */
function crestProfile(s0: number, sc: number, Rv: number, grade: number, s1: number) {
  const L = Rv * 2 * grade; // lunghezza del raccordo
  const a = sc - L / 2;
  const b = sc + L / 2;
  const zA = grade * (a - s0);
  const pts: { s: number; z: number }[] = [];
  for (let s = 0; s <= s1 + 200; s += 4) {
    let z = 0;
    if (s <= s0) z = 0;
    else if (s <= a) z = grade * (s - s0);
    else if (s <= b) z = zA + grade * (s - a) - ((s - a) * (s - a)) / (2 * Rv);
    else {
      const zB = zA + grade * L - (L * L) / (2 * Rv);
      z = Math.max(0, zB - grade * (s - b));
    }
    pts.push({ s, z });
  }
  return pts;
}

const e04: ScenePreset = {
  defaults: { speed: 90 },
  controls: ['speed', 'tau', 'effort', 'wet', 'abs'],
  guida:
    'Il raccordo convesso ha raggio di 300 m: l’auto ferma in attesa di svoltare compare oltre il colmo solo a circa 71 m. A 90 km/h ne servono circa 70 per fermarsi, a 80 km/h 58.',
  build: (p) => {
    const sc = 262;
    const main = rural('main', [str(620)], { elevation: crestProfile(100, sc, 300, 0.06, 420), centerLine: 'continua' });
    const g = geom(main);
    const access: RoadSpec = {
      id: 'accesso',
      style: 'sterrato',
      start: { x: 0, y: 0, heading: 0 },
      junction: { road: 'main', s: sc + 26, side: 'left' },
      segments: [str(40)],
      lanesRight: 1,
      lanesLeft: 0,
      laneWidth: 4,
    };
    return {
      id: 'E-04',
      duration: 9,
      roads: [main, access],
      hazards: [],
      objects: [
        ...delineators(g, EDGE + 0.4, -(EDGE + 0.4), 0, 600, 50),
        ...treeRow(g, EDGE + 7, 0, 600, 18, 3.6, 2),
        ...treeRow(g, -(EDGE + 8), 0, 600, 22, 3.6, 2),
        { kind: 'cartello', at: g.point(sc - 120, EDGE + 1.2), text: 'Dosso' },
      ],
      actors: [
        {
          id: 'fermo',
          kind: 'auto',
          label: 'auto in attesa di svolta',
          color: '#9c3d2e',
          road: 'main',
          d: 1.5,
          lights: true,
          indicator: { side: 'left', from: 0 },
          motion: still(sc + 22),
        },
      ],
      ego: { road: 'main', s0: 120, d: 1.75, speed: p.speed, limit: 90, watch: [{ actor: 'fermo', label: 'auto ferma oltre il dosso' }] },
      notes: [{ t: 0.3, text: 'Il profilo sale al 5% fino al colmo; subito dopo c’è un accesso a sinistra.' }],
      frame: [-30, 100, 40, 330],
    };
  },
};

/* E-05 — ghiaia alla corda di una curva */
const e05: ScenePreset = {
  defaults: { speed: 60 },
  controls: ['speed', 'offset', 'maxLean', 'wet'],
  guida:
    'Alla corda della curva sinistrorsa (R = 60 m) c’è ghiaia trascinata dall’accesso sterrato. Sulla ghiaia l’aderenza scende a 0,4: a 60 km/h ne servono 0,47 e la moto scivola verso il guard-rail. Provare 50 km/h o una traiettoria più esterna (offset positivo).',
  build: (p) => {
    const main = rural('main', [str(120), arc(60, 80), str(160)]);
    const g = geom(main);
    const access: RoadSpec = {
      id: 'accesso',
      style: 'sterrato',
      start: { x: 0, y: 0, heading: 0 },
      junction: { road: 'main', s: 146, side: 'left' },
      segments: [str(40)],
      lanesRight: 1,
      lanesLeft: 0,
      laneWidth: 4,
    };
    return {
      id: 'E-05',
      duration: 7,
      roads: [main, access],
      hazards: [
        { id: 'ghiaia', kind: 'ghiaia', road: 'main', s0: 148, s1: 176, d0: 0.15, d1: 1.55, surface: 'ghiaia', label: 'ghiaia' },
        { id: 'ghiaia2', kind: 'ghiaia', road: 'main', s0: 138, s1: 150, d0: -2.5, d1: 0.4, surface: 'ghiaia', label: 'ghiaia' },
      ],
      objects: [
        guardrail(g, EDGE + 0.6, 100, 240),
        ...delineators(g, EDGE + 0.4, -(EDGE + 0.4), 0, 360, 20),
        ...treeRow(g, -(EDGE + 6), 170, 360, 10, 3, 2),
        ...treeRow(g, EDGE + 7, 0, 360, 12, 3.4, 2),
      ],
      actors: [],
      ego: {
        road: 'main',
        s0: 80,
        d: [
          [0, 1.75],
          [110, 1.75],
          [140, 1.0],
          [190, 1.0],
          [220, 1.75],
        ],
        speed: p.speed,
        limit: 90,
        watch: [{ hazard: 'ghiaia', range: 12, label: 'ghiaia alla corda' }],
      },
      notes: [{ t: 0.3, text: 'Curva sinistrorsa: la moto stringe verso la corda, dove si accumula la ghiaia.' }],
      frame: [-80, 80, 40, 220],
    };
  },
};

/* E-11 — sorpasso della colonna e svolta a sinistra del veicolo in testa */
const e11: ScenePreset = {
  defaults: { speed: 100 },
  controls: ['speed', 'tau', 'effort', 'wet', 'abs'],
  guida:
    'La moto sorpassa una colonna dietro un furgone. Il furgone rallenta e svolta a sinistra in un accesso quando la moto è a circa 30 m: il conducente ha guardato lo specchietto prima, quando la moto era nascosta dalle auto.',
  build: (p) => {
    const v = p.speed / 3.6;
    const vc = 50 / 3.6;
    const h0 = 150;
    const e0 = 40;
    // il furgone rallenta da 50 a 15 km/h (3,47 s, 31,3 m) e svolta quando la moto è a 30 m dal suo retro
    const tTurn = Math.max(3.6, (h0 - e0 - 50.65) / Math.max(0.5, v - vc));
    const sTurn = h0 + vc * (tTurn - 3.47) + 31.3;
    const main = rural('main', [str(Math.max(900, sTurn + 400))]);
    const g = geom(main);
    const R = 10;
    const access: RoadSpec = {
      id: 'accesso',
      style: 'sterrato',
      start: { x: 0, y: 0, heading: 0 },
      junction: { road: 'main', s: sTurn + R - 1.6, side: 'left' },
      segments: [str(50)],
      lanesRight: 1,
      lanesLeft: 0,
      laneWidth: 4,
    };
    const turn = route('svolta', { x: 1.75, y: 0, th: Math.PI / 2 }, [str(sTurn), arc(R, 90), str(60)]);
    const column = [1, 2].map((i) => ({
      id: `c${i}`,
      kind: 'auto' as const,
      label: 'auto in colonna',
      color: i === 1 ? '#5d6d7e' : '#8a6f5a',
      road: 'main',
      d: 1.75,
      motion: motion(h0 - 11.5 * i, 50).until(tTurn - 3.47 + 0.4 * i).to(15, 2.8).hold(2).to(60, 1.5).build(25),
    }));
    return {
      id: 'E-11',
      duration: Math.min(16, tTurn + 4),
      roads: [main, access, turn],
      hazards: [],
      objects: [
        ...delineators(g, EDGE + 0.4, -(EDGE + 0.4), 0, main.segments[0].kind === 'rettifilo' ? main.segments[0].length : 900, 50),
        ...treeRow(g, EDGE + 6, 0, sTurn + 300, 16, 3.4, 2),
        ...treeRow(g, -(EDGE + 6), 0, sTurn - 15, 16, 3.4, 2),
        ...treeRow(g, -(EDGE + 6), sTurn + 25, sTurn + 300, 16, 3.4, 2),
      ],
      actors: [
        {
          id: 'furgone',
          kind: 'furgone',
          label: 'furgone in svolta',
          color: '#e8e4dc',
          road: 'svolta',
          d: 0,
          indicator: { side: 'left', from: tTurn - 3.47 },
          motion: motion(h0, 50).until(tTurn - 3.47).to(15, 2.8).build(25),
        },
        ...column,
      ],
      ego: {
        road: 'main',
        s0: e0,
        d: [
          [0, 1.75],
          [e0 + 15, 1.75],
          [e0 + 45, -1.75],
        ],
        speed: p.speed,
        limit: 90,
        watch: [{ actor: 'furgone', from: tTurn, label: 'furgone che svolta a sinistra' }],
      },
      notes: [
        { t: 0.3, text: 'La moto si sposta sulla corsia opposta per sorpassare la colonna.' },
        { t: tTurn, text: 'Il furgone inizia la svolta verso l’accesso a sinistra.' },
      ],
      frame: [-40, Math.max(0, sTurn - 170), 30, sTurn + 40],
    };
  },
};

/* E-12 — mezzo pesante che taglia la curva sinistrorsa */
const e12: ScenePreset = {
  defaults: { speed: 60, offset: 0 },
  controls: ['speed', 'offset', 'tau', 'wet'],
  guida:
    'Il camion, per l’ingombro del semirimorchio, invade di circa 40 cm la corsia della moto. In piega il capo del motociclista sporge di 1,5·sin γ verso l’interno: con la traiettoria vicina all’asse il contatto avviene anche a velocità moderata. Provare un offset positivo (traiettoria più a destra).',
  build: (p) => {
    const w = 3.25;
    const main: RoadSpec = { ...rural('main', [str(110), arc(45, 100), str(140)]), laneWidth: w, shoulderRight: 0.3, shoulderLeft: 0.3, centerLine: 'continua' };
    const g = geom(main);
    const c0 = 110;
    const c1 = 110 + (45 * 100 * Math.PI) / 180;
    const tMeet = (c0 + 35 - 60) / (p.speed / 3.6);
    const sT0 = c0 + 35 + (40 / 3.6) * tMeet;
    // istante in cui il camion inizia a invadere la corsia della moto
    const tIntr = Math.max(0, (sT0 - (c1 + 5)) / (40 / 3.6));
    return {
      id: 'E-12',
      duration: Math.min(10, tMeet + 3),
      roads: [main],
      hazards: [],
      objects: [
        hedge(g, -(w + 0.3 + 1.6), 0, c1 + 25, 5, 'scarpata'),
        guardrail(g, w + 0.3 + 0.6, 90, c1 + 30),
        ...treeRow(g, -(w + 9), 60, 360, 9, 3.6, 2),
        ...delineators(g, w + 0.6, -(w + 0.6), 0, 360, 20),
      ],
      actors: [
        {
          id: 'camion',
          kind: 'camion',
          label: 'autoarticolato',
          color: '#b5442f',
          road: 'main',
          reverse: true,
          lights: true,
          d: [
            [c0 - 15, -1.65],
            [c0 + 20, -0.9],
            [c1 - 15, -0.9],
            [c1 + 20, -1.65],
          ],
          motion: motion(sT0, 40).build(20),
        },
      ],
      ego: {
        road: 'main',
        s0: 60,
        d: [
          [0, 1.62],
          [c0 - 5, 1.62],
          [c0 + 25, 1.0],
          [c1 - 20, 1.0],
          [c1 + 10, 1.62],
        ],
        speed: p.speed,
        limit: 70,
        watch: [{ actor: 'camion', from: tIntr, label: 'mezzo pesante che invade la corsia' }],
      },
      notes: [{ t: 0.3, text: 'Curva sinistrorsa stretta e cieca: la moto la percorre vicino all’asse.' }],
      frame: [-70, 50, 40, 220],
    };
  },
};

/* E-14 — curva di notte: il faro illumina l'esterno */
const e14: ScenePreset = {
  defaults: { speed: 70, night: true },
  controls: ['speed', 'night', 'tau', 'effort', 'wet', 'abs'],
  guida:
    'Di notte, in curva destrorsa, il faro punta lungo la tangente e in piega lascia al buio l’interno: il capriolo fermo vicino al margine destro entra nel fascio solo a pochi metri. Confrontare con la stessa scena di giorno.',
  build: (p) => {
    const main = rural('main', [str(130), arc(100, -80), str(160)]);
    const g = geom(main);
    return {
      id: 'E-14',
      duration: 9,
      roads: [main],
      hazards: [],
      objects: [
        ...delineators(g, EDGE + 0.4, -(EDGE + 0.4), 0, 430, 20),
        ...treeRow(g, EDGE + 5, 0, 430, 8, 3.4, 2),
        ...treeRow(g, -(EDGE + 5), 0, 430, 8, 3.4, 2),
        guardrail(g, -(EDGE + 0.7), 120, 290),
      ],
      actors: [{ id: 'animale', kind: 'animale', label: 'capriolo', color: '#8b5a2b', road: 'main', d: 2.9, motion: still(130 + 62) }],
      ego: {
        road: 'main',
        s0: 70,
        d: [
          [0, 1.75],
          [120, 1.75],
          [150, 2.1],
          [250, 2.1],
          [280, 1.75],
        ],
        speed: p.speed,
        limit: 90,
        watch: [{ actor: 'animale', label: 'animale sulla carreggiata' }],
      },
      notes: [{ t: 0.3, text: 'Strada extraurbana non illuminata, curva destrorsa di raggio 100 m.' }],
      env: { night: p.night },
      frame: [-20, 60, 160, 260],
    };
  },
};

export const EXTRAURBANO_SCENES: Record<string, ScenePreset> = {
  'E-01': e01,
  'E-02': e02,
  'E-04': e04,
  'E-05': e05,
  'E-11': e11,
  'E-12': e12,
  'E-14': e14,
};
