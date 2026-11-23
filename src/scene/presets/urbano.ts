import type { ScenePreset } from './types';
import type { ActorSpec, ObjectSpec, RoadSpec } from '../types';
import { arc, buildings, geom, motion, poles, route, still, str, treeRow } from '../builders';

/* ------------------------------------------------------------------------------------------------
 * U-01 — svolta a sinistra davanti alla moto
 * ------------------------------------------------------------------------------------------------ */
const u01: ScenePreset = {
  defaults: { speed: 50, tau: 1.0, effort: 0.75 },
  controls: ['speed', 'tau', 'effort', 'wet', 'abs', 'night'],
  guida:
    'L’auto inizia la svolta quando la moto, a 50 km/h, è a circa 40 m dal punto di conflitto. Aumentando la velocità la moto è più vicina quando la manovra inizia: lo spazio disponibile non basta più.',
  build: (p) => {
    const main: RoadSpec = {
      id: 'main',
      style: 'urbano',
      start: { x: 0, y: 0, heading: 90 },
      segments: [str(320)],
      lanesRight: 1,
      lanesLeft: 1,
      laneWidth: 3.5,
      sidewalk: 3.5,
    };
    const side: RoadSpec = {
      id: 'lat',
      style: 'urbano',
      start: { x: 0, y: 0, heading: 0 },
      junction: { road: 'main', s: 200, side: 'right' },
      segments: [str(80)],
      lanesRight: 1,
      lanesLeft: 1,
      laneWidth: 3.25,
      sidewalk: 3,
    };
    const g = geom(main);
    // l'auto procede in senso opposto (d = −1,75) e svolta a sinistra verso la laterale di destra
    const R = 9;
    const yArc = 200 - 1.625 + R;
    const L0 = 34;
    const start = g.pose(yArc + L0, -1.75, true);
    const turn = route('svolta', start, [str(L0), arc(R, 90), str(70)]);
    const objects: ObjectSpec[] = [
      ...buildings(g, 7.0, 0, 320, 14, 'right', [[180, 222]]),
      ...buildings(g, -7.0, 0, 320, 14, 'left'),
      ...treeRow(g, -5.2, 10, 310, 12, 2.6),
      ...poles(g, 4.6, 15, 310, 30, 'luce'),
    ];
    // l'auto in attesa parte quando la moto è a 42 m dal punto di conflitto (y ≈ 201)
    const egoS0 = 85;
    const tTurn = Math.max(0.8, (201 - 42 - (egoS0 + 1.05)) / (p.speed / 3.6));
    // colonna ferma dietro l'auto che svolta
    const column = [0, 1].map((i) => ({
      id: `col${i}`,
      kind: 'auto' as const,
      label: 'auto in coda',
      color: i ? '#6b7c8f' : '#8a6f5a',
      road: 'main',
      d: -1.75,
      reverse: true,
      motion: still(yArc + L0 + 6.5 + i * 6.5),
    }));
    return {
      id: 'U-01',
      duration: Math.min(16, tTurn + 5),
      roads: [main, side, turn],
      hazards: [],
      objects,
      actors: [
        {
          id: 'auto',
          kind: 'auto',
          label: 'auto in svolta',
          color: '#c0392b',
          road: 'svolta',
          d: 0,
          lights: p.night,
          indicator: { side: 'left', from: 0 },
          motion: motion(L0 - 0.5, 0).until(tTurn).to(22, 2.6).build(20),
        },
        ...column,
      ],
      ego: {
        road: 'main',
        s0: egoS0,
        d: 1.75,
        speed: p.speed,
        limit: 50,
        watch: [{ actor: 'auto', from: tTurn, label: 'auto che svolta a sinistra' }],
      },
      notes: [
        { t: 0.2, text: 'L’auto è ferma con l’indicatore a sinistra, in attesa di svoltare.' },
        { t: tTurn, text: 'La moto è a 42 m: il conducente giudica sufficiente l’intervallo e parte.' },
      ],
      frame: [-60, 60, 70, 250],
    };
  },
};

/* ------------------------------------------------------------------------------------------------
 * U-02 — immissione da laterale con visibilità ostruita
 * ------------------------------------------------------------------------------------------------ */
const u02: ScenePreset = {
  defaults: { speed: 50 },
  controls: ['speed', 'tau', 'effort', 'wet', 'abs'],
  guida:
    'Il furgone in sosta e l’edificio d’angolo nascondono l’auto fino a quando il suo muso supera la linea della sosta. Provare a ridurre la velocità a 30-40 km/h.',
  build: (p) => {
    const W = 3.25;
    const main: RoadSpec = {
      id: 'main',
      style: 'urbano',
      start: { x: 0, y: 0, heading: 90 },
      segments: [str(300)],
      lanesRight: 1,
      lanesLeft: 1,
      laneWidth: W,
      shoulderRight: 2.2,
      shoulderLeft: 2.2,
      sidewalk: 3,
    };
    const side: RoadSpec = {
      id: 'lat',
      style: 'urbano',
      start: { x: 0, y: 0, heading: 0 },
      junction: { road: 'main', s: 160, side: 'right' },
      segments: [str(80)],
      lanesRight: 1,
      lanesLeft: 1,
      laneWidth: 3,
      sidewalk: 2.5,
    };
    const g = geom(main);
    const xEdge = W + 2.2;
    const R = 7;
    const yLane = 160 + 1.5;
    // l'auto esce dalla laterale (verso ovest) e svolta a sinistra attraversando la corsia della moto
    const xStart = xEdge + 9;
    // il conducente, che non può vedere la moto, avanza quando questa è a 55 m dall'incrocio
    const egoS0 = 85;
    const tGo = Math.max(0.5, (160 - 55 - (egoS0 + 1.05)) / (p.speed / 3.6));
    const xs = -1.625 + R;
    const turn = route('esce', { x: xStart, y: yLane, th: Math.PI }, [str(xStart - xs), arc(R, 90), str(120)]);
    const parked = [96, 104, 112, 128, 136, 144].map((s, i) => ({
      id: `p${i}`,
      kind: (s === 144 ? 'furgone' : 'auto') as 'furgone' | 'auto',
      label: s === 144 ? 'furgone in sosta' : 'auto in sosta',
      color: s === 144 ? '#e8e4dc' : ['#4d6a8a', '#7a7a7a', '#a33a2c', '#2f4f4f', '#b8a07a'][i % 5],
      road: 'main',
      d: W + 1.1,
      motion: still(s),
    }));
    const objects: ObjectSpec[] = [
      ...buildings(g, xEdge + 3, 0, 300, 14, 'right', [[146, 175]]),
      ...buildings(g, -(W + 2.2 + 3), 0, 300, 14, 'left'),
      // edificio d'angolo a filo del marciapiede della laterale
      { kind: 'edificio', poly: [{ x: xEdge + 3, y: 150.5 }, { x: xEdge + 26, y: 150.5 }, { x: xEdge + 26, y: 131 }, { x: xEdge + 3, y: 131 }], height: 14, color: '#bfae9a' },
      { kind: 'edificio', poly: [{ x: xEdge + 3, y: 169.5 }, { x: xEdge + 26, y: 169.5 }, { x: xEdge + 26, y: 190 }, { x: xEdge + 3, y: 190 }], height: 12, color: '#d8cbbd' },
      ...poles(g, -(W + 2.6), 10, 290, 28),
    ];
    return {
      id: 'U-02',
      duration: Math.min(14, tGo + 6),
      roads: [main, side, turn],
      hazards: [],
      objects,
      actors: [
        {
          id: 'auto',
          kind: 'auto',
          label: 'auto in immissione',
          color: '#c0392b',
          road: 'esce',
          d: 0,
          lights: p.night,
          motion: motion(0, 0).until(tGo).to(18, 2.5).build(20),
        },
        ...parked,
      ],
      ego: {
        road: 'main',
        s0: egoS0,
        d: 1.6,
        speed: p.speed,
        limit: 50,
        watch: [{ actor: 'auto', from: 0, label: 'auto che esce dalla laterale' }],
      },
      notes: [{ t: tGo, text: 'L’auto riparte dallo stop senza vedere la moto, nascosta dal furgone.' }],
      frame: [-40, 70, 60, 210],
    };
  },
};

/* ------------------------------------------------------------------------------------------------
 * U-05 — frenata d'emergenza su strisce bagnate
 * ------------------------------------------------------------------------------------------------ */
const u05: ScenePreset = {
  defaults: { speed: 50, wet: true, abs: false, effort: 0.75, gap: 1.5 },
  controls: ['speed', 'gap', 'tau', 'effort', 'wet', 'abs'],
  guida:
    'L’auto che precede supera le strisce e si ferma di colpo. La moto inizia la frenata sull’asfalto e la prosegue sulla vernice bagnata: senza ABS l’anteriore si blocca. Confrontare con ABS attivo o con fondo asciutto.',
  build: (p) => {
    const main: RoadSpec = {
      id: 'main',
      style: 'urbano',
      start: { x: 0, y: 0, heading: 90 },
      segments: [str(260)],
      lanesRight: 1,
      lanesLeft: 1,
      laneWidth: 3.5,
      sidewalk: 3.5,
    };
    const g = geom(main);
    const zebraS = 150;
    const v = p.speed / 3.6;
    const egoS0 = 60;
    const carS0 = egoS0 + 1.05 + 2.15 + Math.max(4, p.gap * v);
    const tBrake = (zebraS + 6 - carS0) / v; // l'auto frena appena superate le strisce
    return {
      id: 'U-05',
      duration: 9,
      roads: [main],
      hazards: [
        { id: 'strisce', kind: 'strisce', road: 'main', s0: zebraS - 3, s1: zebraS + 3, d0: -3.5, d1: 3.5, surface: 'segnaletica', label: 'strisce pedonali' },
        { id: 'arresto', kind: 'strisce', road: 'main', s0: zebraS - 5.5, s1: zebraS - 4.9, d0: 0, d1: 3.5, surface: 'segnaletica', label: 'linea di arresto' },
      ],
      objects: [
        { kind: 'zebra', road: 'main', s: zebraS, width: 6, d0: -3.5, d1: 3.5 },
        ...buildings(g, 7, 0, 260, 14, 'right'),
        ...buildings(g, -7, 0, 260, 14, 'left'),
        ...poles(g, 4.4, 10, 250, 26),
      ],
      actors: [
        {
          id: 'auto',
          kind: 'auto',
          label: 'auto che precede',
          color: '#3b5b7a',
          road: 'main',
          d: 1.75,
          lights: true,
          motion: motion(carS0, p.speed).until(tBrake).to(0, p.wet ? 6.5 : 8.5).wait(10).build(12),
        },
        { id: 'ped', kind: 'pedone', label: 'pedone', road: 'main', d: -3.2, motion: motion(zebraS + 9, 0).build(12) },
      ],
      ego: {
        road: 'main',
        s0: egoS0,
        d: 1.75,
        speed: p.speed,
        limit: 50,
        watch: [{ actor: 'auto', from: tBrake, label: 'luci di arresto dell’auto' }],
      },
      notes: [{ t: Math.max(0.2, tBrake), text: 'L’auto frena a fondo subito dopo l’attraversamento.' }],
      env: { wet: p.wet, rain: p.wet },
      frame: [-35, 70, 45, 200],
    };
  },
};

/* ------------------------------------------------------------------------------------------------
 * U-09 — buca nascosta dal veicolo che precede
 * ------------------------------------------------------------------------------------------------ */
const u09: ScenePreset = {
  defaults: { speed: 50, gap: 1.0 },
  controls: ['speed', 'gap', 'tau', 'effort', 'wet', 'abs'],
  guida:
    'L’auto passa sopra la buca tenendola tra le ruote. La moto la vede solo quando il retro dell’auto la scopre: la distanza di sicurezza decide se c’è spazio per fermarsi. Provare con 2,5 s di distanza.',
  build: (p) => {
    const main: RoadSpec = {
      id: 'main',
      style: 'urbano',
      start: { x: 0, y: 0, heading: 90 },
      segments: [str(300)],
      lanesRight: 1,
      lanesLeft: 1,
      laneWidth: 3.5,
      sidewalk: 3,
    };
    const g = geom(main);
    const v = p.speed / 3.6;
    const egoS0 = 50;
    const carS0 = egoS0 + 3.2 + Math.max(4, p.gap * v);
    return {
      id: 'U-09',
      duration: 11,
      roads: [main],
      hazards: [
        { id: 'buca', kind: 'buca', road: 'main', s0: 180, s1: 181.4, d0: 1.35, d1: 2.15, shape: 'ellisse', height: 0.02, label: 'buca' },
        { id: 'rapp1', kind: 'sigillature', road: 'main', s0: 172, s1: 178, d0: 0.8, d1: 2.6, label: 'fessure a pelle di coccodrillo' },
      ],
      objects: [...buildings(g, 6.5, 0, 300, 14, 'right'), ...buildings(g, -6.5, 0, 300, 14, 'left'), ...treeRow(g, 4.6, 8, 290, 14, 2.4)],
      actors: [
        {
          id: 'auto',
          kind: 'auto',
          label: 'auto che precede',
          color: '#5b6d4f',
          road: 'main',
          d: 1.75,
          motion: motion(carS0, p.speed).build(14),
        },
      ],
      ego: {
        road: 'main',
        s0: egoS0,
        d: 1.75,
        speed: p.speed,
        limit: 50,
        watch: [{ hazard: 'buca', range: 45, label: 'buca in corsia' }],
      },
      notes: [{ t: 0.3, text: 'L’auto davanti ha carreggiata di 1,5 m: la buca passa tra le sue ruote.' }],
      frame: [-30, 100, 40, 210],
    };
  },
};

/* ------------------------------------------------------------------------------------------------
 * U-10 — gasolio in rotatoria
 * ------------------------------------------------------------------------------------------------ */
const u10: ScenePreset = {
  defaults: { speed: 30 },
  controls: ['speed', 'wet', 'maxLean'],
  guida:
    'In rotatoria la moto è in piega costante: la richiesta di aderenza trasversale vale v²/(gR). Sulla macchia di gasolio l’aderenza disponibile scende a circa 0,2: sotto i 20 km/h la moto passa, sopra scivola.',
  build: (p) => {
    const Ri = 14;
    const ring: RoadSpec = {
      id: 'ring',
      style: 'urbano',
      ring: true,
      start: { x: Ri, y: 0, heading: 90 },
      segments: [arc(Ri, 360)],
      lanesRight: 1,
      lanesLeft: 0,
      laneWidth: 6.5,
      sidewalk: 3,
    };
    const L = 2 * Math.PI * Ri;
    const arms: RoadSpec[] = [0.125, 0.375, 0.625, 0.875].map((f, i) => ({
      id: `ramo${i}`,
      style: 'urbano',
      start: { x: 0, y: 0, heading: 0 },
      junction: { road: 'ring', s: f * L, side: 'right' },
      segments: [str(70)],
      lanesRight: 1,
      lanesLeft: 1,
      laneWidth: 3.5,
      sidewalk: 3,
    }));
    const g = geom(ring);
    return {
      id: 'U-10',
      duration: 7,
      roads: [ring, ...arms],
      hazards: [
        { id: 'gasolio', kind: 'gasolio', road: 'ring', s0: 4, s1: 12, d0: 1.6, d1: 4.6, shape: 'ellisse', surface: 'gasolio', label: 'macchia di gasolio' },
        { id: 'sabbia', kind: 'ghiaia', road: 'ring', s0: 30, s1: 36, d0: 4.5, d1: 6.3, surface: 'ghiaia', label: 'sabbia assorbente' },
      ],
      objects: [
        { kind: 'isola', center: { x: 0, y: 0 }, r: Ri - 0.3 },
        ...poles(g, 9.8, 2, L - 2, 11),
        { kind: 'albero', at: { x: 0, y: 0 }, r: 4 },
      ],
      actors: [
        { id: 'camion', kind: 'camion', label: 'mezzo pesante', color: '#d9a441', road: 'ring', d: 3.3, motion: motion(40, 18).build(10) },
      ],
      ego: {
        road: 'ring',
        s0: 0.75 * L - 6,
        d: 3.0,
        speed: p.speed,
        limit: 50,
        // il gasolio sull'asfalto non è riconoscibile in tempo utile
        watch: [],
      },
      notes: [{ t: 0.2, text: 'La moto percorre la corona in piega; il gasolio è stato perso da un mezzo pesante.' }],
      frame: [-38, -38, 38, 38],
    };
  },
};

/* ------------------------------------------------------------------------------------------------
 * U-12 — filtraggio tra le file
 * ------------------------------------------------------------------------------------------------ */
const u12: ScenePreset = {
  defaults: { speed: 40, tau: 0.9 },
  controls: ['speed', 'tau', 'effort', 'wet', 'abs'],
  guida:
    'La coda procede a 10 km/h. L’auto grigia nella corsia di destra si sposta a sinistra in un varco. Il rischio dipende dal differenziale di velocità: provare 20 km/h contro 50 km/h.',
  build: (p) => {
    const W = 3.25;
    const main: RoadSpec = {
      id: 'main',
      style: 'urbano',
      start: { x: 0, y: 0, heading: 90 },
      segments: [str(300)],
      lanesRight: 2,
      lanesLeft: 1,
      laneWidth: W,
      sidewalk: 3,
    };
    const g = geom(main);
    const colors = ['#5d6d7e', '#a04030', '#2e4a62', '#8c8c8c', '#4a6b48', '#b99b6b', '#3d3d3d'];
    const queue: ActorSpec[] = [];
    let k = 0;
    const qv = 10 / 3.6;
    const egoS0 = 80;
    const cs0 = 130;
    // l'auto si sposta quando la moto è a 12 m dal suo retro
    const tChange = Math.max(0.6, (cs0 - 2.15 - (egoS0 + 1.05) - 12) / Math.max(0.5, p.speed / 3.6 - qv));
    const sChange = cs0 + qv * tChange;
    for (let s = 60; s < 260; s += 7.2) {
      for (const lane of [0, 1]) {
        if (lane === 1 && Math.abs(s + 2.5 - cs0) < 4) continue; // posto dell'auto che cambierà corsia
        if (lane === 0 && s > cs0 - 4 && s < cs0 + 13) continue; // varco nella corsia di sinistra
        queue.push({
          id: `q${k}`,
          kind: k % 9 === 4 ? 'furgone' : 'auto',
          label: 'veicolo in coda',
          color: colors[k % colors.length],
          road: 'main',
          d: lane === 0 ? W / 2 : W * 1.5,
          motion: motion(s + (lane ? 2.5 : 0), 10).build(12),
        });
        k++;
      }
    }
    return {
      id: 'U-12',
      duration: Math.min(16, tChange + 5),
      roads: [main],
      hazards: [],
      objects: [...buildings(g, 9.5, 0, 300, 14, 'right'), ...buildings(g, -6.25, 0, 300, 14, 'left')],
      actors: [
        {
          id: 'cambio',
          kind: 'auto',
          label: 'auto che cambia corsia',
          color: '#c0392b',
          road: 'main',
          d: [
            [sChange, W * 1.5],
            [sChange + 7, W * 0.5],
          ],
          indicator: { side: 'left', from: Math.max(0, tChange - 0.6) },
          motion: motion(cs0, 10).build(20),
        },
        ...queue,
      ],
      ego: {
        road: 'main',
        s0: egoS0,
        d: W,
        speed: p.speed,
        limit: 50,
        watch: [{ actor: 'cambio', from: tChange, label: 'auto che si sposta nel varco' }],
      },
      notes: [{ t: tChange, text: 'L’auto vede il varco nella corsia di sinistra e si sposta senza controllare lo specchietto.' }],
      frame: [-25, 40, 40, 200],
    };
  },
};

/* ------------------------------------------------------------------------------------------------
 * U-18 — viale a scorrimento oltre il limite
 * ------------------------------------------------------------------------------------------------ */
const u18: ScenePreset = {
  defaults: { speed: 80 },
  controls: ['speed', 'tau', 'effort', 'wet', 'abs', 'night'],
  guida:
    'Il conducente allo stop parte quando la moto è a 58 m: a 50 km/h sarebbero più di 4 secondi, un intervallo sufficiente. Provare 50, 70 e 90 km/h.',
  build: (p) => {
    const W = 3.5;
    const main: RoadSpec = {
      id: 'main',
      style: 'urbano',
      start: { x: 0, y: 0, heading: 90 },
      segments: [str(420)],
      lanesRight: 2,
      lanesLeft: 2,
      laneWidth: W,
      centerLine: 'doppia',
      sidewalk: 4,
    };
    const side: RoadSpec = {
      id: 'lat',
      style: 'urbano',
      start: { x: 0, y: 0, heading: 0 },
      junction: { road: 'main', s: 300, side: 'right' },
      segments: [str(60)],
      lanesRight: 1,
      lanesLeft: 1,
      laneWidth: 3.25,
      sidewalk: 2.5,
    };
    const g = geom(main);
    const xEdge = 2 * W;
    const R = 8;
    const yIn = 300 + 1.625;
    const xs = W * 1.5 + R;
    const xStart = xEdge + 22;
    const turn = route('immissione', { x: xStart, y: yIn, th: Math.PI }, [str(xStart - xs), arc(R, -90), str(200)]);
    // il conducente parte quando la moto è a 58 m dal punto di conflitto (4,2 s se viaggiasse a 50 km/h)
    const egoS0 = 170;
    const tPull = Math.max(1.5, (300 - 58 - egoS0) / (p.speed / 3.6));
    return {
      id: 'U-18',
      duration: Math.min(14, tPull + 6),
      roads: [main, side, turn],
      hazards: [],
      objects: [
        ...buildings(g, xEdge + 4, 0, 420, 16, 'right', [[288, 315]]),
        ...buildings(g, -(xEdge + 4), 0, 420, 16, 'left'),
        ...treeRow(g, xEdge + 1.2, 8, 410, 10, 2.8),
        ...treeRow(g, -(xEdge + 1.2), 8, 410, 10, 2.8),
        { kind: 'edificio', poly: [{ x: xEdge + 4, y: 297 }, { x: xEdge + 30, y: 297 }, { x: xEdge + 30, y: 270 }, { x: xEdge + 4, y: 270 }], height: 15, color: '#c9b8a6' },
      ],
      actors: [
        {
          id: 'auto',
          kind: 'auto',
          label: 'auto in immissione',
          color: '#c0392b',
          road: 'immissione',
          d: 0,
          lights: p.night,
          motion: motion(xStart - xEdge - 4.6, 0).until(tPull).to(50, 2.4).build(20),
        },
      ],
      ego: {
        road: 'main',
        s0: egoS0,
        d: W * 1.5,
        speed: p.speed,
        limit: 50,
        watch: [{ actor: 'auto', from: tPull, label: 'auto che si immette' }],
      },
      notes: [{ t: tPull, text: 'L’auto parte dallo stop: ha giudicato l’intervallo come se la moto andasse a 50 km/h.' }],
      frame: [-30, 130, 60, 340],
    };
  },
};

export const URBANO_SCENES: Record<string, ScenePreset> = {
  'U-01': u01,
  'U-02': u02,
  'U-05': u05,
  'U-09': u09,
  'U-10': u10,
  'U-12': u12,
  'U-18': u18,
};
