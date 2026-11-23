/**
 * Scene extraurbane (seconda serie): ormaie e aquaplaning, discesa in curva, barriere, alberi,
 * inerti lucidati, sigillature, immissioni, vento, galleria, cantiere, percorso misto.
 */
import type { ScenePreset } from './types';
import type { ObjectSpec, RoadSpec } from '../types';
import { arc, delineators, embankment, geom, gradeProfile, guardrail, hedge, lanePath, motion, roadsideBarrier, route, rutPair, still, str, treeRow, withLead } from '../builders';

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

const BARRIER_LABELS = { nessuna: 'Nessuna barriera', paletti: 'Guard-rail a paletti', dsm: 'Guard-rail con protezione per motociclisti' };

/* E-03 — curva in discesa con frenata in piega */
const e03: ScenePreset = {
  defaults: { speed: 70, wet: true, abs: false, barrier: 'paletti' },
  controls: ['speed', 'tau', 'effort', 'wet', 'abs', 'barrier'],
  barrierLabels: BARRIER_LABELS,
  guida:
    'Discesa al 7% che termina in una curva destrorsa di raggio 90 m; dietro la curva un trattore procede a 20 km/h. In discesa la gravità sottrae 0,07 g alla frenata e in piega l’aderenza residua per frenare è ridotta. Sul bagnato senza ABS la ruota si blocca; cambiando la barriera si confrontano le conseguenze della caduta.',
  build: (p) => {
    const L = 600;
    const main = rural('main', [str(240), arc(90, -70), str(250)], { elevation: gradeProfile(60, 420, -0.07, L, 30) });
    const g = geom(main);
    const c0 = 240;
    const c1 = 240 + (90 * 70 * Math.PI) / 180;
    const objects: ObjectSpec[] = [
      hedge(g, EDGE + 1.0, 150, c1 + 10, 6, 'scarpata'),
      hedge(g, EDGE + 0.6, 150, c0 + 10, 3, 'siepe'),
      ...roadsideBarrier(g, -(EDGE + 0.7), 150, c1 + 80, p.barrier, [embankment(g, -(EDGE + 2.2), 120, c1 + 120, 5)]),
      ...delineators(g, EDGE + 0.4, -(EDGE + 0.4), 0, L, 25),
      ...treeRow(g, EDGE + 10, 0, L, 11, 3.3, 2),
      { kind: 'cartello', at: g.point(100, EDGE + 1.2), text: 'Discesa pericolosa 7%' },
    ];
    return {
      id: 'E-03',
      duration: 12,
      roads: [main],
      hazards: [],
      objects,
      actors: [{ id: 'trattore', kind: 'trattore', label: 'trattore', color: '#3f7a3a', road: 'main', d: 1.9, lights: true, motion: motion(c0 + 40, 20).build(30) }],
      ego: {
        road: 'main',
        s0: 110,
        d: [
          [0, 1.75],
          [c0 - 10, 1.75],
          [c0 + 20, 2.3],
          [c1, 2.3],
          [c1 + 25, 1.75],
        ],
        speed: p.speed,
        limit: 70,
        watch: [{ actor: 'trattore', label: 'trattore lento in curva' }],
      },
      notes: [{ t: 0.3, text: 'Lunga discesa al 7%: per mantenere la velocità il motociclista sta già frenando.' }],
      env: { wet: p.wet, rain: p.wet },
      frame: [-80, 120, 120, 420],
    };
  },
};

/* E-08 — ormaie con pioggia: aquaplaning e marcia a binario */
const e08: ScenePreset = {
  defaults: { speed: 90, wet: true, offset: 0 },
  controls: ['speed', 'offset', 'wet'],
  labels: { offset: 'Posizione nella corsia (0 = nella traccia sinistra)' },
  guida:
    'Ormaie profonde 15 mm piene d’acqua nelle tracce dei mezzi pesanti. A 90 km/h l’altezza critica del velo è circa 8 mm: nel fondo dell’ormaia lo pneumatico galleggia. In rettilineo si prosegue, ma il sorpasso del camion obbliga ad attraversare le ormaie in manovra. Sotto i 75 km/h l’altezza critica supera la profondità; spostandosi sul dorso tra le ormaie (offset +0,9 m) si evita l’acqua in rettilineo.',
  build: (p) => {
    const L = 900;
    const main = rural('main', [str(L)]);
    const g = geom(main);
    const hazards = [...rutPair('main', 'or1', 0, 120, 800, 15), ...rutPair('main', 'or2', -W, 120, 800, 15)];
    return {
      id: 'E-08',
      duration: 13,
      roads: [main],
      hazards,
      objects: [...delineators(g, EDGE + 0.4, -(EDGE + 0.4), 0, L, 50), ...treeRow(g, EDGE + 7, 0, L, 16, 3.4, 2), ...treeRow(g, -(EDGE + 7), 0, L, 16, 3.4, 2)],
      actors: [{ id: 'camion', kind: 'camion', label: 'autoarticolato', color: '#2f5d8a', road: 'main', d: 1.75, spray: true, lights: true, motion: motion(360, 60).build(30) }],
      ego: {
        road: 'main',
        s0: 150,
        d: [
          [0, 0.85],
          [330, 0.85],
          [430, -1.75],
        ],
        speed: p.speed,
        limit: 90,
        watch: [],
      },
      notes: [
        { t: 0.3, text: 'Pioggia battente: le ormaie lasciate dai mezzi pesanti sono piene d’acqua.' },
        { t: 6, text: 'La moto si sposta a sinistra per sorpassare il camion e attraversa le ormaie.' },
      ],
      env: { wet: p.wet, rain: p.wet },
      frame: [-30, 140, 30, 560],
    };
  },
};


/* E-06 — caduta in curva e impatto con la barriera */
const e06: ScenePreset = {
  defaults: { speed: 60, wet: true, barrier: 'paletti' },
  controls: ['speed', 'wet', 'barrier'],
  barrierLabels: BARRIER_LABELS,
  guida:
    'Fango portato da un accesso agricolo dentro una curva sinistrorsa di raggio 70 m: a 60 km/h servono 0,39 di aderenza trasversale, il fango bagnato ne offre 0,25. Dopo la caduta moto e pilota proseguono verso l’esterno della curva: confrontare guard-rail a paletti, protezione per motociclisti e assenza di barriera (oltre c’è un rilevato di 4 m).',
  build: (p) => {
    const main = rural('main', [str(140), arc(70, 80), str(160)]);
    const g = geom(main);
    const c0 = 140;
    const c1 = c0 + (70 * 80 * Math.PI) / 180;
    const access: RoadSpec = { id: 'accesso', style: 'sterrato', start: { x: 0, y: 0, heading: 0 }, junction: { road: 'main', s: c0 + 22, side: 'left' }, segments: [str(40)], lanesRight: 1, lanesLeft: 0, laneWidth: 4 };
    return {
      id: 'E-06',
      duration: 9,
      roads: [main, access],
      hazards: [{ id: 'fango', kind: 'fango', road: 'main', s0: c0 + 25, s1: c0 + 55, d0: 0.3, d1: 3.2, surface: 'fango', label: 'fango' }],
      objects: [
        ...roadsideBarrier(g, EDGE + 0.6, c0 - 30, c1 + 40, p.barrier, [embankment(g, EDGE + 1.6, c0 - 40, c1 + 50, 4)]),
        ...delineators(g, EDGE + 0.4, -(EDGE + 0.4), 0, 420, 20),
        ...treeRow(g, -(EDGE + 7), c0 + 40, 420, 10, 3, 2),
      ],
      actors: [],
      ego: { road: 'main', s0: 80, d: 1.75, speed: p.speed, limit: 90, watch: [{ hazard: 'fango', range: 15, label: 'fango sulla carreggiata' }] },
      notes: [{ t: 0.3, text: 'Curva sinistrorsa: dall’accesso agricolo è uscito fango.' }],
      env: { wet: p.wet, rain: p.wet },
      frame: [-60, 100, 40, 230],
    };
  },
};

/* E-07 — alberi al margine */
const e07: ScenePreset = {
  defaults: { speed: 85, maxLean: 27, barrier: 'nessuna' },
  controls: ['speed', 'maxLean', 'wet', 'barrier'],
  barrierLabels: { nessuna: 'Filare di alberi senza protezione', paletti: 'Guard-rail a paletti davanti agli alberi', dsm: 'Guard-rail con protezione per motociclisti' },
  guida:
    'Statale con filare di platani a 1,6 m dal ciglio, curva sinistrorsa di raggio 90 m. A 85 km/h servono circa 32° di piega: un pilota che non va oltre i 27° allarga la traiettoria ed esce verso gli alberi. Confrontare con una barriera davanti al filare.',
  build: (p) => {
    const main = rural('main', [str(160), arc(90, 60), str(200)]);
    const g = geom(main);
    const c0 = 160;
    const c1 = c0 + (90 * 60 * Math.PI) / 180;
    return {
      id: 'E-07',
      duration: 13,
      roads: [main],
      hazards: [],
      objects: [
        ...roadsideBarrier(g, EDGE + 0.6, c0 - 40, c1 + 80, p.barrier, treeRow(g, EDGE + 1.6, 0, 460, 8, 2.6)),
        ...treeRow(g, -(EDGE + 1.6), 0, 460, 8, 2.6),
        ...delineators(g, EDGE + 0.3, -(EDGE + 0.3), 0, 460, 25),
      ],
      actors: [],
      ego: { road: 'main', s0: 100, d: 1.75, speed: p.speed, limit: 90, watch: [] },
      notes: [{ t: 0.3, text: 'Viale alberato: nessuno spazio di recupero oltre il ciglio.' }],
      env: { wet: p.wet, rain: p.wet },
      frame: [-60, 120, 50, 290],
    };
  },
};

/* E-09 — inerti lucidati e prima pioggia */
const e09: ScenePreset = {
  defaults: { speed: 70, wet: true, abs: false, gap: 2.0, effort: 0.7 },
  controls: ['speed', 'gap', 'effort', 'wet', 'abs'],
  labels: { wet: 'Primi minuti di pioggia' },
  guida:
    'Nel tratto prima dell’incrocio gli inerti sono lucidati dalle frenate. Con la prima pioggia l’aderenza scende a circa 0,35 mentre il motociclista frena come su asfalto normale bagnato: senza ABS l’anteriore si blocca, con ABS la frenata si allunga. Sull’asciutto la stessa frenata basta.',
  build: (p) => {
    const main = rural('main', [str(520)]);
    const g = geom(main);
    const v = p.speed / 3.6;
    const egoS0 = 120;
    const carS0 = egoS0 + 3.2 + Math.max(5, p.gap * v);
    const tBrake = (300 - carS0) / v;
    const side: RoadSpec = { id: 'lat', style: 'extraurbano', start: { x: 0, y: 0, heading: 0 }, junction: { road: 'main', s: 330, side: 'left' }, segments: [str(80)], lanesRight: 1, lanesLeft: 1, laneWidth: 3.25, shoulderRight: 0.3, shoulderLeft: 0.3 };
    return {
      id: 'E-09',
      duration: Math.min(14, tBrake + 5),
      roads: [main, side],
      hazards: [{ id: 'lucido', kind: 'lucidato', road: 'main', s0: 220, s1: 330, d0: 0.3, d1: 3.3, surface: 'lucidato', label: 'inerti lucidati' }],
      objects: [...delineators(g, EDGE + 0.4, -(EDGE + 0.4), 0, 520, 40), ...treeRow(g, EDGE + 7, 0, 520, 15, 3.3, 2), ...treeRow(g, -(EDGE + 7), 0, 300, 15, 3.3, 2)],
      actors: [{ id: 'auto', kind: 'auto', label: 'auto che precede', color: '#4a6b48', road: 'main', d: 1.75, lights: true, motion: motion(carS0, p.speed).until(tBrake).to(0, p.wet ? 6 : 8).wait(10).build(20) }],
      ego: { road: 'main', s0: egoS0, d: 1.75, speed: p.speed, limit: 90, watch: [{ actor: 'auto', from: tBrake, label: 'auto che frena per svoltare' }] },
      notes: [{ t: Math.max(0.2, tBrake), text: 'L’auto frena di colpo per svoltare a sinistra.' }],
      env: { wet: p.wet, rain: p.wet },
      frame: [-25, 180, 30, 360],
    };
  },
};

/* E-10 — sigillature bituminose in curva */
const e10: ScenePreset = {
  defaults: { speed: 85, barrier: 'paletti' },
  controls: ['speed', 'wet', 'barrier'],
  barrierLabels: BARRIER_LABELS,
  guida:
    'Una curva destrorsa di raggio 110 m è piena di sigillature bituminose. D’estate il mastice è morbido e offre circa 0,5 di aderenza: a 85 km/h ne servono 0,53. Un pilota abituato a percorrere la curva a quella velocità su asfalto integro cade; a 75-80 km/h passa.',
  build: (p) => {
    const main = rural('main', [str(160), arc(110, -60), str(200)]);
    const g = geom(main);
    const c0 = 160;
    const c1 = c0 + (110 * 60 * Math.PI) / 180;
    return {
      id: 'E-10',
      duration: 9,
      roads: [main],
      hazards: [{ id: 'sigill', kind: 'sigillature', road: 'main', s0: c0 + 20, s1: c0 + 75, d0: 0.2, d1: 3.4, surface: 'sigillatura', label: 'sigillature bituminose' }],
      objects: [
        ...roadsideBarrier(g, -(EDGE + 0.7), c0 - 20, c1 + 60, p.barrier, treeRow(g, -(EDGE + 4), c0 - 20, c1 + 60, 7, 3, 0.5)),
        ...delineators(g, EDGE + 0.4, -(EDGE + 0.4), 0, 480, 25),
        ...treeRow(g, EDGE + 7, 0, 480, 13, 3.3, 2),
      ],
      actors: [],
      ego: { road: 'main', s0: 100, d: 1.75, speed: p.speed, limit: 90, watch: [] },
      notes: [{ t: 0.3, text: 'Pomeriggio d’estate: asfalto a 50 °C, fessure sigillate con mastice.' }],
      env: { wet: p.wet, rain: p.wet },
      frame: [-20, 120, 150, 300],
    };
  },
};

/* E-13 — immissione da accesso privato */
const e13: ScenePreset = {
  defaults: { speed: 90 },
  controls: ['speed', 'tau', 'effort', 'wet', 'abs'],
  guida:
    'Un’auto esce da un accesso nascosto dalla siepe quando la moto è a 70 m: il conducente la vede piccola e lontana e sottostima la sua velocità. A 70 km/h la moto adegua la velocità senza problemi, a 90 km/h la distanza non basta.',
  build: (p) => {
    const main = rural('main', [str(520)]);
    const g = geom(main);
    const sJ = 300;
    const access: RoadSpec = { id: 'accesso', style: 'sterrato', start: { x: 0, y: 0, heading: 0 }, junction: { road: 'main', s: sJ, side: 'right' }, segments: [str(40)], lanesRight: 1, lanesLeft: 0, laneWidth: 4 };
    const R = 8;
    const xStart = EDGE + 9;
    const yIn = sJ - 2.0;
    const xs = 1.75 + R;
    const turn = route('esce', { x: xStart, y: yIn, th: Math.PI }, [str(xStart - xs), arc(R, -90), str(200)]);
    const egoS0 = 100;
    const tPull = Math.max(1, (sJ - 70 - (egoS0 + 1.05)) / (p.speed / 3.6));
    return {
      id: 'E-13',
      duration: Math.min(14, tPull + 6),
      roads: [main, access, turn],
      hazards: [],
      objects: [
        { kind: 'siepe', line: g.polyline(EDGE + 1.0, 120, sJ - 4, 1), height: 2.4, thickness: 1.2 },
        { kind: 'siepe', line: g.polyline(EDGE + 1.0, sJ + 4, 480, 1), height: 2.4, thickness: 1.2 },
        ...delineators(g, EDGE + 0.4, -(EDGE + 0.4), 0, 520, 50),
        ...treeRow(g, -(EDGE + 7), 0, 520, 16, 3.3, 2),
      ],
      actors: [{ id: 'auto', kind: 'auto', label: 'auto che esce dall’accesso', color: '#c0392b', road: 'esce', d: 0, motion: motion(2, 0).until(tPull).to(50, 2.5).build(30) }],
      ego: { road: 'main', s0: egoS0, d: 1.75, speed: p.speed, limit: 90, watch: [{ actor: 'auto', from: tPull, label: 'auto che si immette' }] },
      notes: [{ t: tPull, text: 'L’auto esce dall’accesso: ha visto la moto a 70 m e ha giudicato di avere tempo.' }],
      frame: [-25, 180, 40, 340],
    };
  },
};

/* E-15 — vento laterale e scia del mezzo pesante incrociato */
const e15: ScenePreset = {
  defaults: { speed: 90, offset: 0 },
  controls: ['speed', 'offset'],
  labels: { offset: 'Posizione nella corsia (positivo = più a destra)' },
  guida:
    'All’uscita dalla trincea, sul viadotto, una raffica spinge la moto verso l’asse proprio mentre incrocia un autoarticolato: prima l’onda di pressione la respinge, poi la scia la richiama. Il pilota corregge dopo mezzo secondo. Marciando vicino all’asse il margine laterale si annulla; spostandosi a destra (offset +0,8 m) resta.',
  build: (p) => {
    const main = rural('main', [str(600)]);
    const g = geom(main);
    const egoS0 = 120;
    const sMeet = 320;
    const v = p.speed / 3.6;
    const tMeet = (sMeet - egoS0) / v;
    const vt = 80 / 3.6;
    return {
      id: 'E-15',
      duration: Math.min(12, tMeet + 3),
      roads: [main],
      hazards: [],
      objects: [
        hedge(g, EDGE + 1.0, 100, 255, 5, 'scarpata'),
        hedge(g, -(EDGE + 1.0), 100, 255, 5, 'scarpata'),
        guardrail(g, EDGE + 0.5, 255, 450),
        guardrail(g, -(EDGE + 0.5), 255, 450),
        ...delineators(g, EDGE + 0.4, -(EDGE + 0.4), 0, 600, 50),
        { kind: 'cartello', at: g.point(230, EDGE + 1.2), text: 'Vento laterale' },
      ],
      actors: [{ id: 'camion', kind: 'camion', label: 'autoarticolato incrociato', color: '#2f5d8a', road: 'main', d: -1.45, reverse: true, lights: true, motion: motion(sMeet + vt * tMeet, 80).build(30) }],
      ego: {
        road: 'main',
        s0: egoS0,
        d: 0.8,
        speed: p.speed,
        limit: 90,
        watch: [],
        gusts: [
          { s0: 288, s1: 330, ay: -4.2, label: 'Raffica di vento laterale all’uscita dalla trincea' },
          { s0: sMeet - 14, s1: sMeet - 2, ay: 1.6, label: 'Onda di pressione davanti al mezzo pesante' },
          { s0: sMeet - 2, s1: sMeet + 12, ay: -3.0, label: 'Scia del mezzo pesante che richiama la moto' },
        ],
      },
      notes: [{ t: 0.3, text: 'Strada a due corsie, viadotto esposto al vento dopo la trincea.' }],
      frame: [-25, 220, 25, 360],
    };
  },
};

/* E-16 — galleria: adattamento visivo all'ingresso */
const e16: ScenePreset = {
  defaults: { speed: 90 },
  controls: ['speed', 'tau', 'effort', 'night'],
  guida:
    'Di giorno, entrando in galleria, l’occhio impiega qualche secondo ad adattarsi: nei primi metri si distingue solo ciò che è vicino (qui 35 m). Una coda ferma 120 m dopo l’imbocco compare troppo tardi a 90 km/h; a 70 km/h si riesce a evitarla. Di notte l’effetto buco nero non c’è.',
  build: (p) => {
    const main = rural('main', [str(800)]);
    const g = geom(main);
    const s0 = 300;
    return {
      id: 'E-16',
      duration: 12,
      roads: [main],
      hazards: [],
      objects: [
        { kind: 'galleria', road: 'main', s0, s1: 700, d0: -(EDGE + 0.3), d1: EDGE + 0.3, height: 6 },
        ...delineators(g, EDGE + 0.4, -(EDGE + 0.4), 0, s0 - 5, 25),
        ...treeRow(g, EDGE + 6, 0, s0 - 10, 12, 3.4, 2),
        ...treeRow(g, -(EDGE + 6), 0, s0 - 10, 12, 3.4, 2),
      ],
      actors: [
        { id: 'coda', kind: 'auto', label: 'coda ferma in galleria', color: '#8c8c8c', road: 'main', d: 1.75, lights: true, motion: still(s0 + 120) },
        { id: 'coda2', kind: 'furgone', label: 'veicolo in coda', color: '#e8e4dc', road: 'main', d: 1.75, lights: true, motion: still(s0 + 127) },
      ],
      ego: {
        road: 'main',
        s0: 150,
        d: 1.75,
        speed: p.speed,
        limit: 90,
        watch: [{ actor: 'coda', label: 'veicoli fermi in galleria' }],
        visibility: p.night ? undefined : [{ s0: 0, s1: s0 + 85, range: 35, label: 'adattamento alla luminanza della galleria' }],
      },
      notes: [{ t: 0.3, text: 'Giornata di sole: l’imbocco della galleria appare come un buco nero.' }],
      env: { night: p.night },
      frame: [-25, 230, 25, 460],
    };
  },
};

/* E-17 — cantiere: gradino del fresato attraversato con angolo radente */
const e17: ScenePreset = {
  defaults: { speed: 50 },
  controls: ['speed', 'wet'],
  speedRange: [20, 70],
  guida:
    'La corsia è fresata e più bassa di 4 cm; i coni obbligano a spostarsi sulla corsia opposta (senso unico alternato). Nello spazio di una corsia, a 50 km/h il motociclista attraversa il gradino con circa 11°: lo pneumatico non sale e l’anteriore viene deviato. A 30 km/h l’angolo raggiungibile supera i 15° e la ruota sale.',
  build: (p) => {
    const main = rural('main', [str(600)]);
    const g = geom(main);
    const cones: ObjectSpec[] = [];
    for (let s = 300; s <= 340; s += 4) cones.push({ kind: 'cono', at: g.point(s, 3.5 - ((s - 300) / 40) * 3.2) });
    for (let s = 344; s <= 480; s += 8) cones.push({ kind: 'cono', at: g.point(s, 0.3) });
    return {
      id: 'E-17',
      duration: 12,
      roads: [main],
      hazards: [
        { id: 'fresato', kind: 'fresato', road: 'main', s0: 120, s1: 480, d0: 0.35, d1: 3.5, surface: 'fresato', label: 'superficie fresata' },
        { id: 'gradino', kind: 'gradino', road: 'main', s0: 120, s1: 480, d0: 0.25, d1: 0.35, label: 'gradino del fresato' },
      ],
      objects: [...cones, { kind: 'cartello', at: g.point(200, EDGE + 1.2), text: 'Lavori' }, ...delineators(g, EDGE + 0.4, -(EDGE + 0.4), 0, 600, 50)],
      actors: [],
      ego: { road: 'main', s0: 160, d: withLead(1.75, lanePath(250, 1.75, -1.75, p.speed, 2.5, 25)), speed: p.speed, limit: 50, watch: [] },
      notes: [{ t: 0.3, text: 'Cantiere: la corsia è stata fresata e lasciata aperta al traffico.' }],
      env: { wet: p.wet, rain: p.wet },
      frame: [-25, 200, 25, 360],
    };
  },
};

/* E-18 — accelerazione tra due curve */
const e18: ScenePreset = {
  defaults: { accel: 2.0, maxLean: 38 },
  controls: ['accel', 'maxLean', 'tau', 'wet'],
  guida:
    'Uscita da una curva a 60 km/h, rettilineo di 350 m, poi una curva destrorsa cieca di raggio 110 m. Il pilota inizia a frenare sempre 60 m prima della curva. Con l’accelerazione assunta dalla norma (0,8 m/s²) arriva alla curva a 65 km/h; con quella tipica della moto (2 m/s²) a oltre 110 km/h e l’aderenza non basta. Con 1,4 m/s² arriva a 93 km/h.',
  build: (p) => {
    const main = rural('main', [arc(120, 40), str(350), arc(110, -70), str(220)]);
    const g = geom(main);
    const c1 = (120 * 40 * Math.PI) / 180;
    const c2 = c1 + 350;
    const c3 = c2 + (110 * 70 * Math.PI) / 180;
    return {
      id: 'E-18',
      duration: 16,
      roads: [main],
      hazards: [],
      objects: [
        hedge(g, EDGE + 1.0, c2 - 20, c3, 4, 'scarpata'),
        ...roadsideBarrier(g, -(EDGE + 0.7), c2 - 10, c3 + 40, 'paletti'),
        ...delineators(g, EDGE + 0.4, -(EDGE + 0.4), 0, c3 + 220, 25),
        ...treeRow(g, -(EDGE + 8), 0, c2, 14, 3.4, 2),
      ],
      actors: [{ id: 'trattore', kind: 'trattore', label: 'trattore', color: '#3f7a3a', road: 'main', d: 1.9, lights: true, motion: motion(c2 + 42, 20).build(40) }],
      ego: {
        road: 'main',
        s0: c1,
        d: 1.75,
        speed: 60,
        limit: 90,
        watch: [{ actor: 'trattore', label: 'trattore oltre la curva' }],
        accel: { from: c1, to: c2 - 60, a: p.accel, vMax: 160 },
        plan: [{ s0: c2 - 60, toKmh: 80, a: 3.5, label: 'Frenata prima della curva' }],
      },
      notes: [{ t: 0.3, text: 'Uscita di curva: la moto accelera nel rettilineo.' }],
      env: { wet: p.wet, rain: p.wet },
      frame: [-60, 40, 180, 520],
    };
  },
};

export const EXTRAURBANO2_SCENES: Record<string, ScenePreset> = {
  'E-03': e03,
  'E-06': e06,
  'E-07': e07,
  'E-08': e08,
  'E-09': e09,
  'E-10': e10,
  'E-13': e13,
  'E-15': e15,
  'E-16': e16,
  'E-17': e17,
  'E-18': e18,
};

