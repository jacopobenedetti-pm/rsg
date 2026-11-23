/**
 * Scene autostradali (seconda serie): ormaie in corsia di marcia, rampe di svincolo, spray e scia dei mezzi
 * pesanti, angolo cieco, giunti, ghiaccio sui viadotti, immissioni, cantieri, cuspidi, ristagni, corsia d'emergenza.
 */
import type { ScenePreset } from './types';
import type { ActorSpec, ObjectSpec, RoadSpec } from '../types';
import { arc, embankment, geom, guardrail, lanePath, motion, newjersey, roadsideBarrier, route, rutPair, spiral, still, str, treeRow, withLead } from '../builders';

const W = 3.75;
const SL = 0.7;
const MED = 3.0;
const LANE = (i: number) => W * (i - 0.5); // 1 = corsia di sorpasso, 3 = corsia di marcia

function motorway(segments: RoadSpec['segments'], extra: Partial<RoadSpec> = {}): RoadSpec {
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
    ...extra,
  };
}

function margins(g: ReturnType<typeof geom>, L: number, s0 = 0): ObjectSpec[] {
  return [
    newjersey(g, -SL - MED / 2, s0, L),
    guardrail(g, 3 * W + 3.0 + 0.8, s0, L),
    ...treeRow(g, 3 * W + 3.0 + 9, s0, L, 18, 3.6, 3),
    ...treeRow(g, -(SL + MED + 3 * W + 2 * SL + 3.0 + 9), s0, L, 18, 3.6, 3),
  ];
}

const BARRIER_LABELS = { nessuna: 'Nessuna barriera', paletti: 'Guard-rail a paletti', dsm: 'Guard-rail con protezione per motociclisti' };
const colors = ['#5d6d7e', '#a04030', '#2e4a62', '#8c8c8c', '#4a6b48', '#b99b6b', '#3d3d3d', '#d0d0d0'];

/* A-05 — ormaie nella corsia di marcia con pioggia */
const a05: ScenePreset = {
  defaults: { speed: 110, wet: true, offset: 0 },
  controls: ['speed', 'offset', 'wet'],
  labels: { offset: 'Posizione nella corsia (0 = nella traccia sinistra)' },
  guida:
    'Corsia di marcia con ormaie di 12 mm piene d’acqua. A 110 km/h l’altezza critica del velo è circa 4 mm: quasi tutta l’ormaia è oltre la soglia. Il cambio di corsia per superare il camion avviene con la moto in manovra proprio sul bordo dell’ormaia. Provare 80 e 70 km/h.',
  build: (p) => {
    const L = 1300;
    const main = motorway([str(L)]);
    const g = geom(main);
    return {
      id: 'A-05',
      duration: 13,
      roads: [main],
      hazards: [...rutPair('main', 'or3', 2 * W, 150, 1200, 12)],
      objects: margins(g, L),
      actors: [
        { id: 'camion', kind: 'camion', label: 'autoarticolato', color: '#a04030', road: 'main', d: LANE(3), spray: true, lights: true, motion: motion(470, 80).build(30) },
        { id: 'auto2', kind: 'auto', label: 'auto', color: '#5d6d7e', road: 'main', d: LANE(1), lights: true, motion: motion(200, 120).build(30) },
      ],
      ego: {
        road: 'main',
        s0: 220,
        d: [
          [0, 2 * W + 0.85],
          [400, 2 * W + 0.85],
          [520, LANE(2)],
        ],
        speed: p.speed,
        limit: 130,
        watch: [],
      },
      notes: [
        { t: 0.3, text: 'Corsia di marcia con ormaie piene d’acqua: la moto viaggia nella traccia sinistra.' },
        { t: 5.5, text: 'Cambio di corsia per superare il mezzo pesante.' },
      ],
      env: { wet: p.wet, rain: p.wet },
      frame: [-40, 200, 40, 700],
    };
  },
};

/* A-08 — rampa di svincolo a raggio decrescente con gasolio */
const a08: ScenePreset = {
  defaults: { speed: 55, barrier: 'paletti', wet: false },
  controls: ['speed', 'wet', 'abs', 'barrier'],
  speedRange: [25, 80],
  labels: { speed: 'Velocità scelta per l’anello della rampa' },
  barrierLabels: BARRIER_LABELS,
  guida:
    'La moto lascia l’autostrada a 110 km/h, frena nella corsia di decelerazione fino alla velocità scelta e affronta un anello di raggio decrescente fino a 55 m. Sulla traiettoria esterna dell’anello c’è gasolio perso da un mezzo pesante: a 50 km/h l’aderenza richiesta supera quella disponibile. All’esterno dell’anello c’è un rilevato di 5 m: si confrontano le tre barriere.',
  build: (p) => {
    const main = motorway([str(700)]);
    const gm = geom(main);
    const xr = 3 * W + 3.0 + 1.5;
    const ramp: RoadSpec = {
      id: 'rampa',
      style: 'rampa',
      start: { x: xr + 2, y: 120, heading: 90 },
      segments: [str(100), arc(500, -8), spiral(Infinity, 110, 50, -1), spiral(110, 55, 60, -1), arc(55, -170), str(150)],
      lanesRight: 1,
      lanesLeft: 0,
      laneWidth: 4.0,
      shoulderRight: 1.0,
      shoulderLeft: 0.6,
    };
    const g = geom(ramp);
    const loop0 = 100 + (500 * 8 * Math.PI) / 180 + 50 + 60;
    const loop1 = loop0 + (55 * 170 * Math.PI) / 180;
    const objects: ObjectSpec[] = [
      ...margins(gm, 700),
      ...roadsideBarrier(g, -(0.6 + 0.5), loop0 - 80, loop1 + 20, p.barrier, [embankment(g, -(0.6 + 1.2), loop0 - 100, loop1 + 40, 5)]),
      guardrail(g, 4.0 + 1.0 + 0.6, 20, loop1 + 100),
    ];
    return {
      id: 'A-08',
      duration: 16,
      roads: [main, ramp],
      hazards: [
        { id: 'gasolio', kind: 'gasolio', road: 'rampa', s0: loop0 + 20, s1: loop0 + 95, d0: 0.2, d1: 2.4, surface: 'gasolio', label: 'tracce di gasolio' },
        { id: 'gasolio2', kind: 'gasolio', road: 'rampa', s0: loop0 + 110, s1: loop0 + 140, d0: 0.6, d1: 2.0, shape: 'ellisse', surface: 'gasolio', label: 'macchia di gasolio' },
      ],
      objects,
      actors: [
        { id: 'c1', kind: 'camion', label: 'autoarticolato', color: '#d9a441', road: 'main', d: LANE(3), motion: motion(260, 85).build(40) },
        { id: 'c2', kind: 'auto', label: 'auto', color: colors[2], road: 'main', d: LANE(2), motion: motion(80, 125).build(40) },
      ],
      ego: {
        road: 'rampa',
        s0: 60,
        d: 2.0,
        speed: 110,
        limit: 60,
        watch: [],
        plan: [{ s0: 110, toKmh: p.speed, a: 4.0, label: `Frenata nella corsia di decelerazione fino a ${p.speed} km/h` }],
      },
      notes: [
        { t: 0.3, text: 'Uscita dall’autostrada: la moto frena nella corsia di decelerazione.' },
        { t: 7, text: 'Anello a raggio decrescente: il gasolio è invisibile sull’asfalto.' },
      ],
      env: { wet: p.wet, rain: p.wet },
      frame: [-40, 80, 220, 420],
    };
  },
};


/* A-03 — sorpasso di un mezzo pesante sotto la pioggia: spray e scia */
const a03: ScenePreset = {
  defaults: { speed: 110, wet: true },
  controls: ['speed', 'tau', 'effort', 'wet', 'abs'],
  speedRange: [100, 150],
  guida:
    'Sotto la pioggia la moto segue un autoarticolato nella corsia di marcia e si sposta a sinistra per sorpassarlo. La nube d’acqua sollevata dal camion nasconde la corsia centrale: un’auto più lenta (70 km/h) compare solo quando la moto esce dallo spray. Affiancando la motrice, la scia spinge la moto lateralmente. Provare 130 km/h, o il fondo asciutto.',
  build: (p) => {
    const L = 1400;
    const main = motorway([str(L)]);
    const g = geom(main);
    const v = p.speed / 3.6;
    const vT = 85 / 3.6;
    const vC = 70 / 3.6;
    const egoS0 = 200;
    const truckS0 = egoS0 + 1.05 + 45 + 8.25;
    // la moto inizia lo spostamento quando è a 25 m dal retro del camion
    const tp = Math.max(0.5, (truckS0 - 8.25 - 25 - (egoS0 + 1.05)) / Math.max(0.5, v - vT));
    const sPull = egoS0 + v * tp;
    // l'auto lenta è 55 m davanti alla moto quando questa inizia lo spostamento
    const carS0 = sPull + 1.05 + 55 + 2.15 - vC * tp;
    // affiancamento della motrice: scia e onda di pressione
    const tCab = Math.max(tp + 1, (truckS0 + 8.25 - (egoS0 + 1.05)) / Math.max(0.5, v - vT));
    const sCab = egoS0 + v * tCab;
    return {
      id: 'A-03',
      duration: Math.min(16, tCab + 5),
      roads: [main],
      hazards: [],
      objects: margins(g, L),
      actors: [
        { id: 'camion', kind: 'camion', label: 'autoarticolato', color: '#d9a441', road: 'main', d: LANE(3), spray: true, lights: true, motion: motion(truckS0, 85).build(40) },
        { id: 'auto', kind: 'auto', label: 'auto più lenta in corsia centrale', color: '#5d6d7e', road: 'main', d: LANE(2), lights: true, motion: motion(carS0, 70).build(40) },
      ],
      ego: {
        road: 'main',
        s0: egoS0,
        d: withLead(LANE(3), lanePath(sPull, LANE(3), LANE(2), p.speed, 1.5, 8)),
        speed: p.speed,
        limit: 130,
        watch: [{ actor: 'auto', label: 'auto lenta nascosta dallo spray' }],
        gusts: [
          { s0: sCab - 18, s1: sCab - 4, ay: 1.2, label: 'La scia del camion richiama la moto verso destra' },
          { s0: sCab - 4, s1: sCab + 10, ay: -1.6, label: 'L’onda di pressione davanti alla motrice spinge la moto a sinistra' },
        ],
      },
      notes: [{ t: 0.3, text: 'Pioggia: dietro il camion la nube d’acqua nasconde tutto ciò che sta davanti.' }],
      env: { wet: p.wet, rain: p.wet },
      frame: [-30, egoS0 - 20, 40, sCab + 120],
    };
  },
};

/* A-04 — cambio di corsia del mezzo pesante con la moto nell'angolo cieco */
const a04: ScenePreset = {
  defaults: { speed: 90, tau: 1.0 },
  controls: ['speed', 'tau', 'effort'],
  guida:
    'Il camion in corsia centrale si sposta a sinistra per superare un altro mezzo pesante. La moto è affiancata al semirimorchio, nell’angolo cieco, e a sinistra c’è lo spartitraffico: l’unica via d’uscita è frenare per arretrare. A 90 km/h, poco più veloce del camion, la moto resta affiancata troppo a lungo; a 130 km/h ha già superato la motrice quando il camion si sposta.',
  build: (p) => {
    const L = 1400;
    const main = motorway([str(L)]);
    const g = geom(main);
    const v = p.speed / 3.6;
    const vT = 85 / 3.6;
    const t0 = 3;
    const truckS0 = 400;
    const sCh = truckS0 + vT * t0;
    // la moto parte affiancata alla coda del semirimorchio: più è veloce, più avanti si trova al cambio di corsia
    const egoS0 = truckS0 - 8.25 + 1 - 1.05;
    void v;
    return {
      id: 'A-04',
      duration: 12,
      roads: [main],
      hazards: [],
      objects: margins(g, L),
      actors: [
        {
          id: 'camion',
          kind: 'camion',
          label: 'autoarticolato che cambia corsia',
          color: '#b5442f',
          road: 'main',
          d: [
            [sCh, LANE(2)],
            [sCh + 140, LANE(1)],
          ],
          indicator: { side: 'left', from: t0 - 1 },
          lights: true,
          motion: motion(truckS0, 85).build(40),
        },
        { id: 'lento', kind: 'camion', label: 'mezzo pesante più lento', color: '#e8e4dc', road: 'main', d: LANE(2), motion: motion(truckS0 + 110, 70).build(40) },
      ],
      ego: { road: 'main', s0: egoS0, d: LANE(1) - 0.2, speed: p.speed, limit: 130, watch: [{ actor: 'camion', from: t0 + 1.2, response: 'arretra', label: 'camion che invade la corsia' }] },
      notes: [{ t: t0, text: 'Il camion si sposta in corsia di sorpasso: dallo specchio non vede la moto.' }],
      frame: [-30, truckS0 - 60, 40, truckS0 + 220],
    };
  },
};

/* A-06 — giunti di dilatazione di un viadotto in curva */
const a06: ScenePreset = {
  defaults: { speed: 90, wet: true, abs: false },
  controls: ['speed', 'wet', 'abs'],
  speedRange: [60, 130],
  guida:
    'Viadotto in curva (raggio 450 m) con due giunti di dilatazione in acciaio: uno a pettine all’ingresso, uno modulare largo 1 m all’uscita. Bagnato, l’acciaio offre circa 0,15 di aderenza contro 0,6-0,7 dell’asfalto. All’ingresso la piega a 90 km/h richiede 0,14: si passa al limite; più veloce la moto si scompone per un attimo e recupera, perché il giunto dura due centesimi di secondo. In fondo al viadotto il traffico rallenta e si frena in curva proprio sul giunto: senza ABS l’anteriore si blocca sull’acciaio bagnato e la moto cade, con l’ABS la frenata si alleggerisce per quel metro e si prosegue. Sull’asciutto il giunto regge.',
  build: (p) => {
    const L = 1300;
    const main = motorway([str(300), arc(450, 50), str(400)]);
    const g = geom(main);
    const vd0 = 330;
    const vd1 = 530;
    const lanes = 3 * W;
    const egoS0 = 250;
    const v = p.speed / 3.6;
    const sBrake = vd1 - 30;
    const tBrake = (sBrake - egoS0) / v;
    const lead = 45;
    const pts = [g.point(240, 0), g.point(420, 0), g.point(600, 0)];
    const xs = pts.map((q) => q.x);
    const ys = pts.map((q) => q.y);
    return {
      id: 'A-06',
      duration: Math.min(15, tBrake + 5),
      roads: [main],
      hazards: [
        { id: 'giunto1', kind: 'giunto', road: 'main', s0: vd0, s1: vd0 + 0.4, d0: -SL, d1: lanes + 3, surface: 'giunto', label: 'giunto a pettine' },
        { id: 'giunto2', kind: 'giunto', road: 'main', s0: vd1, s1: vd1 + 1.0, d0: -SL, d1: lanes + 3, surface: 'giunto', label: 'giunto modulare' },
      ],
      objects: [...margins(g, L), { kind: 'cartello', at: g.point(vd0 - 90, lanes + 4), text: 'Viadotto' }],
      actors: [
        {
          id: 'auto',
          kind: 'auto',
          label: 'auto che rallenta',
          color: '#5d6d7e',
          road: 'main',
          d: LANE(2),
          lights: true,
          motion: motion(egoS0 + lead, p.speed).until(Math.max(0, tBrake - 0.8)).to(60, 4).build(40),
        },
        { id: 'c2', kind: 'auto', label: 'auto', color: colors[2], road: 'main', d: LANE(1), motion: motion(egoS0 + 60, Math.min(p.speed + 10, 125)).build(40) },
      ],
      ego: {
        road: 'main',
        s0: egoS0,
        d: LANE(2),
        speed: p.speed,
        limit: 130,
        watch: [],
        plan: [{ s0: sBrake, toKmh: 60, a: 4.0, label: 'Il traffico rallenta in fondo al viadotto: frenata in curva, fin sopra il giunto' }],
      },
      notes: [{ t: Math.max(0.3, tBrake - 0.8), text: 'L’auto davanti frena in fondo al viadotto, dove c’è il secondo giunto.' }],
      env: { wet: p.wet, rain: p.wet },
      frame: [Math.min(...xs) - 70, Math.min(...ys) - 30, Math.max(...xs) + 70, Math.max(...ys) + 30],
    };
  },
};

/* A-15 — ghiaccio sul viadotto in curva */
const a15: ScenePreset = {
  defaults: { speed: 110, ice: true },
  controls: ['speed', 'ice'],
  labels: { ice: 'Ghiaccio sull’impalcato in ombra' },
  guida:
    'Mattina d’inverno, asfalto asciutto: il viadotto in curva (raggio 600 m) gela prima della strada in rilevato perché l’aria passa anche sotto l’impalcato, che non riceve il calore del terreno. Fuori dal viadotto l’aderenza è piena; sull’impalcato la brina offre 0,08. A 110 km/h la piega richiede 0,16: la moto scivola appena entra sulla zona ghiacciata. Sotto i 75 km/h la richiesta scende sotto la soglia, ma resta un margine minimo: qualsiasi frenata o correzione lì sopra fa cadere.',
  build: (p) => {
    const L = 1300;
    const main = motorway([str(300), arc(600, 35), str(400)]);
    const g = geom(main);
    const vd0 = 330;
    const vd1 = 640;
    const lanes = 3 * W;
    return {
      id: 'A-15',
      duration: 14,
      roads: [main],
      hazards: p.ice
        ? [{ id: 'ghiaccio', kind: 'ghiaccio' as const, road: 'main', s0: vd0 + 10, s1: vd1 - 10, d0: -SL, d1: lanes + 3, surface: 'ghiaccio' as const, label: 'ghiaccio sul viadotto' }]
        : [],
      objects: [
        ...margins(g, L),
        { kind: 'cartello', at: g.point(vd0 - 120, lanes + 4), text: 'Pericolo di ghiaccio' },
        { kind: 'cartello', at: g.point(vd0 - 60, lanes + 4), text: 'Viadotto' },
      ],
      actors: [{ id: 'auto', kind: 'auto', label: 'auto', color: '#5d6d7e', road: 'main', d: LANE(2), lights: true, motion: motion(260, 100).build(40) }],
      ego: { road: 'main', s0: 180, d: LANE(1), speed: p.speed, limit: 130, watch: [] },
      notes: [{ t: 0.3, text: p.ice ? 'Temperatura vicina a zero: sulla strada in rilevato l’asfalto è asciutto, sull’impalcato del viadotto l’umidità è ghiacciata.' : 'Temperatura sopra lo zero: il viadotto è asciutto come il resto della strada.' }],
      env: { cold: p.ice },
      frame: [-80, 250, 60, 760],
    };
  },
};

/* A-09 — immissione dalla corsia di accelerazione */
const a09: ScenePreset = {
  defaults: { speed: 110 },
  controls: ['speed', 'tau', 'effort', 'wet', 'abs'],
  guida:
    'Una barriera antirumore separa la rampa dalla carreggiata e nasconde l’auto che arriva sulla corsia di accelerazione. Il conducente vede la moto piccola nello specchio e si sposta in corsia di marcia quando è a 22 m. Con 40 km/h di differenza la moto riesce a rallentare, con 60 no.',
  build: (p) => {
    const L = 1300;
    const main: RoadSpec = { ...motorway([str(L)]), lanesRight: 4 };
    const g = geom(main);
    const v = p.speed / 3.6;
    const vc = 70 / 3.6;
    const egoS0 = 120;
    const c0 = 210;
    const tMerge = Math.max(0.8, (c0 - 2.15 - 22 - (egoS0 + 1.05)) / Math.max(0.5, v - vc));
    const sMerge = c0 + vc * tMerge;
    return {
      id: 'A-09',
      duration: Math.min(15, tMerge + 6),
      roads: [main],
      hazards: [],
      objects: [
        newjersey(g, -SL - MED / 2, 0, L),
        guardrail(g, 4 * W + 3.0 + 0.8, 0, L),
        { kind: 'muro', line: g.polyline(3 * W + 0.15, 0, 235, 2), height: 4, thickness: 0.3 },
        ...treeRow(g, 4 * W + 3.0 + 9, 0, L, 18, 3.6, 3),
      ],
      actors: [
        {
          id: 'auto',
          kind: 'auto',
          label: 'auto in immissione',
          color: '#c0392b',
          road: 'main',
          d: [
            [Math.max(sMerge, 240), LANE(4)],
            [Math.max(sMerge, 240) + 45, LANE(3)],
          ],
          indicator: { side: 'left', from: 0 },
          motion: motion(c0, 70).build(40),
        },
        { id: 'c2', kind: 'auto', label: 'auto', color: colors[3], road: 'main', d: LANE(2), motion: motion(egoS0 - 10, 125).build(40) },
      ],
      ego: { road: 'main', s0: egoS0, d: LANE(3), speed: p.speed, limit: 130, watch: [{ actor: 'auto', from: tMerge, label: 'auto che si immette' }] },
      notes: [{ t: tMerge, text: 'L’auto lascia la corsia di accelerazione e si sposta in corsia di marcia.' }],
      frame: [-30, egoS0 - 20, 40, sMerge + 120],
    };
  },
};

/* A-10 — scambio di carreggiata in cantiere */
const a10: ScenePreset = {
  defaults: { speed: 90, wet: true },
  controls: ['speed', 'wet'],
  speedRange: [50, 110],
  labels: { speed: 'Velocità nello scambio (limite 60 km/h)' },
  guida:
    'Lo scambio di carreggiata porta la moto sulla carreggiata opposta con due curve di raggio 160 m tra barriere New Jersey provvisorie. Nella prima curva la vecchia segnaletica bianca e la nuova gialla formano una fascia verniciata da percorrere in piega. Sul bagnato la vernice offre 0,35: a 90 km/h ne servono 0,39 e la moto scivola verso il New Jersey; a 80 km/h passa.',
  build: (p) => {
    const L = 1100;
    const main = motorway([str(L)]);
    const gm = geom(main);
    const st = gm.pose(80, LANE(2));
    const dev: RoadSpec = {
      id: 'deviazione',
      style: 'rampa',
      start: { x: st.x, y: st.y, heading: (st.th * 180) / Math.PI },
      segments: [str(180), arc(160, 12), str(40), arc(160, -12), str(400)],
      lanesRight: 1,
      lanesLeft: 0,
      laneWidth: 3.5,
      shoulderRight: 0.3,
      shoulderLeft: 0.3,
    };
    const g = geom(dev);
    const a0 = 180;
    const a1 = a0 + (160 * 12 * Math.PI) / 180;
    return {
      id: 'A-10',
      duration: 16,
      roads: [main, dev],
      hazards: [
        { id: 'vernice', kind: 'strisce', road: 'deviazione', s0: a0 + 6, s1: a1 - 4, d0: -0.3, d1: 3.8, surface: 'segnaletica', label: 'segnaletica gialla sovrapposta alla bianca' },
        { id: 'fresato', kind: 'fresato', road: 'deviazione', s0: a1 + 5, s1: a1 + 40, d0: -0.3, d1: 3.8, surface: 'fresato', label: 'pavimentazione fresata' },
      ],
      objects: [
        ...margins(gm, L),
        newjersey(g, -0.9, 150, 900),
        newjersey(g, 4.4, 150, 900),
        ...[0, 1, 2, 3, 4, 5].map((i) => ({ kind: 'cono' as const, at: gm.point(60 + i * 10, LANE(2) + 2.2 - i * 0.3) })),
        { kind: 'cartello', at: gm.point(30, 3 * W + 3.5), text: 'Scambio di carreggiata' },
      ],
      actors: [{ id: 'camion', kind: 'camion', label: 'autoarticolato', color: '#d9a441', road: 'deviazione', d: 1.75, lights: true, motion: motion(a1 + 220, 80).build(40) }],
      ego: { road: 'deviazione', s0: 0, d: 1.75, speed: 120, limit: 60, watch: [], plan: [{ s0: 20, toKmh: p.speed, a: 3, label: `Frenata all’ingresso del cantiere fino a ${p.speed} km/h` }] },
      notes: [{ t: 0.3, text: 'Cantiere: la carreggiata è chiusa, si passa su quella opposta.' }],
      env: { wet: p.wet, rain: p.wet },
      frame: [-40, 150, 40, 400],
    };
  },
};

/* A-11 — cambio di direzione all'ultimo verso l'uscita e cuspide */
const a11: ScenePreset = {
  defaults: { speed: 110, wet: true, barrier: 'nessuna' },
  controls: ['speed', 'wet', 'barrier'],
  speedRange: [50, 140],
  barrierLabels: { nessuna: 'Cuspide non protetta (testata di New Jersey)', paletti: 'Terminale di guard-rail', dsm: 'Attenuatore d’urto' },
  guida:
    'All’ultimo momento il motociclista decide di uscire e taglia la zebratura della cuspide. Lo spazio è poco: a 110 km/h la manovra arriva fin dentro la zebratura con oltre 0,5 g di accelerazione laterale e sulla vernice bagnata e la ghiaia accumulata la moto scivola verso la testata. A 60 km/h la stessa manovra si fa con meno di 0,3 g. Confrontare la cuspide nuda con un attenuatore d’urto.',
  build: (p) => {
    const L = 1000;
    const main = motorway([str(L)]);
    const g = geom(main);
    const sx = 300;
    const st = g.pose(sx, 3 * W);
    const ramp: RoadSpec = { id: 'uscita', style: 'rampa', start: { x: st.x, y: st.y, heading: (st.th * 180) / Math.PI }, segments: [arc(500, -12), str(300)], lanesRight: 1, lanesLeft: 0, laneWidth: 3.75, shoulderRight: 1.5, shoulderLeft: 0.5 };
    const gr = geom(ramp);
    const tipo = p.barrier === 'nessuna' ? 'spigolo' : p.barrier === 'paletti' ? 'terminale' : 'attenuatore';
    const v = p.speed;
    const Lman = 45;
    const D = 4.3;
    // il pilota non supera 0,55 g di accelerazione laterale: a velocità elevata la manovra si allunga fino alla cuspide
    const aLat = Math.min(5.5, (4 * D * (v / 3.6) ** 2) / (Lman * Lman));
    return {
      id: 'A-11',
      duration: 10,
      roads: [main, ramp],
      hazards: [
        { id: 'zebratura', kind: 'strisce', road: 'main', s0: sx + 8, s1: sx + 58, d0: 3 * W + 0.1, d1: 3 * W + 2.6, surface: 'segnaletica', label: 'zebratura della cuspide' },
        { id: 'ghiaia', kind: 'ghiaia', road: 'main', s0: sx + 20, s1: sx + 56, d0: 3 * W + 0.3, d1: 3 * W + 2.4, surface: 'ghiaia', label: 'ghiaia accumulata nella cuspide' },
      ],
      objects: [
        newjersey(g, -SL - MED / 2, 0, L),
        ...treeRow(g, 3 * W + 3.0 + 14, 0, L, 18, 3.6, 3),
        { kind: 'terminale', at: g.point(sx + 54, 3 * W + 2.9), th: st.th, tipo },
        guardrail(gr, -0.9, 60, 300),
        guardrail(g, 3 * W + 3.0 + 0.8, sx + 62, L),
        { kind: 'cartello', at: g.point(sx - 150, 3 * W + 3.5), text: 'Uscita' },
      ],
      actors: [{ id: 'auto', kind: 'auto', label: 'auto', color: colors[1], road: 'main', d: LANE(2), motion: motion(sx - 60, 115).build(40) }],
      ego: { road: 'main', s0: sx - 120, d: withLead(LANE(3), lanePath(sx + 5, LANE(3), LANE(3) + D, v, aLat, 25)), speed: p.speed, limit: 130, watch: [] },
      notes: [{ t: 0.3, text: 'Corsia di marcia: l’uscita arriva prima del previsto.' }],
      env: { wet: p.wet, rain: p.wet },
      frame: [-20, sx - 80, 40, sx + 120],
    };
  },
};

/* A-13 — ristagno d'acqua nel flesso tra due curve */
const a13: ScenePreset = {
  defaults: { speed: 130, wet: true },
  controls: ['speed', 'wet'],
  guida:
    'Nel cambio di curvatura la pendenza trasversale si annulla e l’acqua ristagna: 8 mm su tutta la carreggiata. A 130 km/h l’altezza critica è circa 2 mm e la moto, che sta cambiando piega, perde aderenza. A 100 km/h la soglia è 6 mm e non basta; a 90 km/h (8,4 mm) la moto passa.',
  build: (p) => {
    const L = 1500;
    const main = motorway([str(300), arc(900, 10), arc(900, -10), str(500)]);
    const g = geom(main);
    const flex = 300 + (900 * 10 * Math.PI) / 180;
    return {
      id: 'A-13',
      duration: 12,
      roads: [main],
      hazards: [{ id: 'ristagno', kind: 'acqua', road: 'main', s0: flex - 22, s1: flex + 22, d0: -SL, d1: 3 * W + 3, water: 8, label: 'ristagno d’acqua' }],
      objects: margins(g, L),
      actors: [{ id: 'auto', kind: 'auto', label: 'auto', color: colors[0], road: 'main', d: LANE(2), lights: true, motion: motion(260, 110).build(40) }],
      ego: { road: 'main', s0: flex - 330, d: LANE(1), speed: p.speed, limit: 130, watch: [] },
      notes: [{ t: 0.3, text: 'Pioggia intensa: nel flesso tra le due curve l’acqua non defluisce.' }],
      env: { wet: p.wet, rain: p.wet },
      frame: [-60, flex - 200, 60, flex + 160],
    };
  },
};

/* A-14 — corsia d'emergenza percorsa durante la coda */
const a14: ScenePreset = {
  defaults: { speed: 60 },
  controls: ['speed', 'tau', 'effort', 'wet', 'abs'],
  speedRange: [20, 100],
  guida:
    'La coda è ferma su tutte le corsie e la moto la supera in corsia d’emergenza. Più avanti un furgone in panne è fermo sul margine e il conducente gira dietro il veicolo proprio quando la moto è a 28 m: a 60 km/h non c’è spazio per fermarsi, a 40 km/h sì. La corsia d’emergenza è di chi è in difficoltà e dei soccorsi.',
  build: (p) => {
    const L = 1100;
    const main = motorway([str(250), arc(400, 30), str(500)]);
    const g = geom(main);
    const sV = 470;
    const v = p.speed / 3.6;
    const egoS0 = 330;
    const tStep = Math.max(0.5, (sV - 3.5 - 28 - (egoS0 + 1.05)) / v);
    const ps = g.pose(sV - 3.4, 3 * W + 3.4);
    const walk = route('pedone', { x: ps.x, y: ps.y, th: ps.th + Math.PI / 2 }, [str(8)]);
    const queue: ActorSpec[] = [];
    let k = 0;
    for (let s = 300; s < 720; s += 9) {
      for (const lane of [1, 2]) {
        queue.push({ id: `q${k}`, kind: k % 5 === 2 ? 'furgone' : 'auto', label: 'veicolo in coda', color: colors[k % colors.length], road: 'main', d: LANE(lane), lights: true, motion: still(s) });
        k++;
      }
    }
    for (let s = 300; s < 700; s += 18) {
      queue.push({ id: `t${k}`, kind: 'camion', label: 'mezzo pesante in coda', color: colors[k % colors.length], road: 'main', d: LANE(3), lights: true, motion: still(s) });
      k++;
    }
    return {
      id: 'A-14',
      duration: Math.min(18, tStep + 5),
      roads: [main, walk],
      hazards: [],
      objects: margins(g, L),
      actors: [
        { id: 'furgone', kind: 'furgone', label: 'furgone in panne', color: '#e8e4dc', road: 'main', d: 3 * W + 3.4, lights: true, motion: still(sV) },
        { id: 'persona', kind: 'pedone', label: 'persona a piedi', color: '#ff7a00', road: 'pedone', d: 0, motion: motion(0, 0).until(tStep).to(5, 3).build(30) },
        ...queue,
      ],
      ego: { road: 'main', s0: egoS0, d: 3 * W + 1.5, speed: p.speed, limit: 130, watch: [{ actor: 'persona', from: tStep, label: 'persona in corsia d’emergenza' }] },
      notes: [
        { t: 0.3, text: 'Coda ferma: la moto procede nella corsia d’emergenza.' },
        { t: tStep, text: 'Il conducente del furgone in panne gira dietro il veicolo.' },
      ],
      frame: [-60, 300, 60, 520],
    };
  },
};

export const AUTOSTRADALE2_SCENES: Record<string, ScenePreset> = {
  'A-03': a03,
  'A-04': a04,
  'A-05': a05,
  'A-06': a06,
  'A-08': a08,
  'A-09': a09,
  'A-10': a10,
  'A-11': a11,
  'A-13': a13,
  'A-14': a14,
  'A-15': a15,
};
