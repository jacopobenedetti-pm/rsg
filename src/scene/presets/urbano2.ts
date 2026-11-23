/**
 * Scene urbane (seconda serie): portiera, pedone dietro il bus, chiusino in curva, binari del tram, lapidei,
 * isola spartitraffico, svolta a destra, angolo cieco del camion, dosso in curva, sole radente, olio al semaforo.
 */
import type { ScenePreset } from './types';
import type { ActorSpec, ObjectSpec, RoadSpec } from '../types';
import { arc, buildings, geom, lanePath, motion, poles, route, still, str, treeRow, withLead } from '../builders';

function urban(id: string, segments: RoadSpec['segments'], extra: Partial<RoadSpec> = {}): RoadSpec {
  return {
    id,
    style: 'urbano',
    start: { x: 0, y: 0, heading: 90 },
    segments,
    lanesRight: 1,
    lanesLeft: 1,
    laneWidth: 3.5,
    sidewalk: 3,
    ...extra,
  };
}

const parkedColors = ['#4d6a8a', '#7a7a7a', '#a33a2c', '#2f4f4f', '#b8a07a', '#5b6d4f', '#d0d0d0'];

/* U-03 — apertura della portiera */
const u03: ScenePreset = {
  defaults: { speed: 40, offset: 0 },
  controls: ['speed', 'offset', 'tau', 'effort', 'wet', 'abs'],
  labels: { offset: 'Distanza dalle auto in sosta (negativo = più lontano)' },
  guida:
    'La moto procede a mezzo metro dalle auto in sosta. Quando è a 11 m, una portiera si apre di colpo: a 40 km/h in un secondo di reazione si percorrono 11 m. Provare a ridurre la velocità o a spostarsi di un metro verso il centro (offset −1).',
  build: (p) => {
    const W = 3.25;
    const main = urban('main', [str(340)], { laneWidth: W, shoulderRight: 2.2 });
    const g = geom(main);
    const egoS0 = 140;
    const v = p.speed / 3.6;
    const sDoor = 200;
    const tDoor = Math.max(0.5, (sDoor + 0.6 - 11 - (egoS0 + 1.05)) / v);
    const parked: ActorSpec[] = [];
    let k = 0;
    for (let s = 60; s < 300; s += 6.3) {
      if (Math.abs(s - sDoor) < 3) continue;
      if (k % 7 === 3) {
        k++;
        continue;
      }
      parked.push({ id: `p${k}`, kind: 'auto', label: 'auto in sosta', color: parkedColors[k % parkedColors.length], road: 'main', d: W + 1.1, motion: still(s) });
      k++;
    }
    return {
      id: 'U-03',
      duration: Math.min(18, tDoor + 4),
      roads: [main],
      hazards: [],
      objects: [...buildings(g, W + 2.2 + 3, 0, 340, 14, 'right'), ...buildings(g, -(W + 3), 0, 340, 14, 'left'), ...poles(g, -(W + 0.6), 10, 330, 28)],
      actors: [
        { id: 'portiera', kind: 'auto', label: 'auto con la portiera che si apre', color: '#c0392b', road: 'main', d: W + 1.1, doorOpenAt: tDoor, motion: still(sDoor) },
        { id: 'opposta', kind: 'auto', label: 'auto in senso opposto', color: '#2e4a62', road: 'main', d: -W / 2, reverse: true, lights: true, motion: motion(sDoor + 40 + 11 * tDoor, 40).build(30) },
        ...parked,
      ],
      ego: { road: 'main', s0: egoS0, d: 2.55, speed: p.speed, limit: 50, watch: [{ actor: 'portiera', from: tDoor, label: 'portiera che si apre' }] },
      notes: [{ t: tDoor, text: 'Il conducente apre la portiera senza guardare nello specchietto.' }],
      env: { wet: p.wet },
      frame: [-30, 130, 40, 230],
    };
  },
};

/* U-04 — pedone che sbuca davanti all'autobus fermo */
const u04: ScenePreset = {
  defaults: { speed: 40 },
  controls: ['speed', 'tau', 'effort', 'wet', 'abs'],
  guida:
    'L’autobus è fermo prima delle strisce per far attraversare un pedone; la moto lo supera sulla corsia opposta. Il pedone esce dalla sagoma del bus solo 1,7 s prima del punto di conflitto: a 40 km/h non c’è spazio per fermarsi, a 25 km/h sì. La vera difesa è non superare un veicolo fermo davanti alle strisce.',
  build: (p) => {
    const main = urban('main', [str(320)]);
    const g = geom(main);
    const zebra = 210;
    const v = p.speed / 3.6;
    const egoS0 = 90;
    const tArrive = (zebra - (egoS0 + 1.05)) / v;
    // il pedone esce dalla sagoma del bus 1,7 s prima che la moto arrivi sulle strisce
    const tWalk = Math.max(0.5, tArrive - 1.7 - (5 - 0.47) / 1.39);
    const tEmerge = tWalk + (5 - 0.47) / 1.39 + 0.4;
    const p0 = g.pose(zebra, 5);
    const cross = route('attraversamento', { x: p0.x, y: p0.y, th: p0.th + Math.PI / 2 }, [str(14)]);
    return {
      id: 'U-04',
      duration: Math.min(16, tArrive + 4),
      roads: [main, cross],
      hazards: [{ id: 'strisce', kind: 'strisce', road: 'main', s0: zebra - 2, s1: zebra + 2, d0: -3.5, d1: 3.5, surface: 'segnaletica', label: 'strisce pedonali' }],
      objects: [
        { kind: 'zebra', road: 'main', s: zebra, width: 4, d0: -3.5, d1: 3.5 },
        ...buildings(g, 6.5, 0, 320, 14, 'right'),
        ...buildings(g, -6.5, 0, 320, 14, 'left'),
        { kind: 'palo', at: g.point(zebra - 14, 4.2), tipo: 'segnale' },
      ],
      actors: [
        { id: 'bus', kind: 'autobus', label: 'autobus fermo', color: '#2a78d6', road: 'main', d: 1.75, lights: true, motion: still(zebra - 8) },
        { id: 'pedone', kind: 'pedone', label: 'pedone', color: '#7a3b8c', road: 'attraversamento', d: 0, motion: motion(0, 0).until(tWalk).to(5, 3).build(30) },
      ],
      ego: {
        road: 'main',
        s0: egoS0,
        d: [
          [0, 1.75],
          [zebra - 70, 1.75],
          [zebra - 35, -1.75],
        ],
        speed: p.speed,
        limit: 50,
        watch: [{ actor: 'pedone', from: tEmerge, label: 'pedone che sbuca davanti al bus' }],
      },
      notes: [{ t: 0.3, text: 'L’autobus è fermo prima delle strisce; la moto lo supera.' }],
      env: { wet: p.wet },
      frame: [-30, 120, 40, 250],
    };
  },
};

/* U-06 — chiusino in curva */
const u06: ScenePreset = {
  defaults: { speed: 25, wet: true, offset: 0 },
  controls: ['speed', 'offset', 'wet'],
  speedRange: [10, 45],
  labels: { offset: 'Traiettoria di svolta (positivo = più larga)' },
  guida:
    'Svolta a destra stretta (raggio 12 m) con un chiusino metallico sulla traiettoria. A 25 km/h l’aderenza trasversale richiesta è circa 0,4: il metallo bagnato ne offre 0,15. Sull’asciutto si passa. Provare 15 km/h o una traiettoria più larga che eviti il chiusino.',
  build: (p) => {
    const main = urban('main', [str(260)]);
    const side: RoadSpec = { ...urban('lat', [str(80)]), start: { x: 0, y: 0, heading: 0 }, junction: { road: 'main', s: 153.6, side: 'right' }, laneWidth: 3.5 };
    const g = geom(main);
    const R = 12;
    const L0 = 60;
    const start = g.pose(140 - L0, 1.75);
    const turn = route('svolta', start, [str(L0), arc(R, -90), str(80)]);
    const arcLen = (Math.PI / 2) * R;
    return {
      id: 'U-06',
      duration: 9,
      roads: [main, side, turn],
      hazards: [
        { id: 'chiusino', kind: 'chiusino', road: 'svolta', s0: L0 + arcLen * 0.45 - 0.4, s1: L0 + arcLen * 0.45 + 0.4, d0: -0.4, d1: 0.4, shape: 'ellisse', surface: 'chiusino', label: 'chiusino' },
        { id: 'griglia', kind: 'chiusino', road: 'svolta', s0: L0 + arcLen * 0.75 - 0.25, s1: L0 + arcLen * 0.75 + 0.25, d0: -1.5, d1: -0.8, surface: 'chiusino', label: 'caditoia' },
      ],
      objects: [
        ...buildings(g, 6.5, 0, 140, 14, 'right'),
        ...buildings(g, 6.5, 172, 260, 14, 'right'),
        ...buildings(g, -6.5, 0, 260, 14, 'left'),
        ...poles(g, 4.6, 10, 250, 26),
      ],
      actors: [{ id: 'auto', kind: 'auto', label: 'auto in senso opposto', color: '#5d6d7e', road: 'main', d: -1.75, reverse: true, lights: true, motion: motion(240, 30).build(20) }],
      ego: { road: 'svolta', s0: L0 - 30, d: 0, speed: p.speed, limit: 50, watch: [] },
      notes: [{ t: 0.3, text: 'Svolta a destra: il chiusino è proprio sulla traiettoria della moto in piega.' }],
      env: { wet: p.wet, rain: p.wet },
      frame: [-25, 110, 45, 175],
    };
  },
};

/* U-07 — binari del tram attraversati con angolo radente */
const u07: ScenePreset = {
  defaults: { speed: 30, crossAngle: 0, wet: false },
  controls: ['speed', 'crossAngle', 'wet'],
  speedRange: [10, 50],
  labels: { crossAngle: 'Correzione di traiettoria per attraversare i binari' },
  guida:
    'I binari del tram attraversano la carreggiata in diagonale, a 18° rispetto alla corsia. Proseguendo diritti la ruota anteriore entra nella gola della rotaia. Con una correzione di traiettoria l’angolo cresce: oltre 20° sull’asciutto la ruota supera la rotaia, sul bagnato servono circa 35°, raggiungibili solo a velocità ridotta.',
  build: (p) => {
    const W = 3.25;
    const main = urban('main', [str(300)], { laneWidth: W, lanesRight: 2, lanesLeft: 1 });
    const g = geom(main);
    // binari in diagonale: da destra verso sinistra, inclinati di 18° rispetto all'asse stradale
    const sR = 150;
    const startR = g.pose(sR, 2 * W + 3);
    const railTh = startR.th + (18 * Math.PI) / 180;
    const rails = route('binari', { x: startR.x, y: startR.y, th: railTh }, [str(60)]);
    const gr = geom(rails);
    // punto in cui la rotaia interna incrocia la traiettoria di riferimento (d = 1,0 nella corsia di sinistra)
    let sCross = sR;
    for (let u = 0; u < 60; u += 0.1) {
      const q = gr.point(u, 0);
      const pr = g.project(q);
      if (pr.d <= 1.6) {
        sCross = pr.s;
        break;
      }
    }
    const v = p.speed;
    const dPath = p.crossAngle > 0.5 ? withLead(0.6, lanePath(sCross - 14, 0.6, 2.9, v, 4, p.crossAngle, 7)) : 1.0;
    return {
      id: 'U-07',
      duration: 9,
      roads: [main, rails],
      hazards: [
        { id: 'rotaia1', kind: 'rotaie', road: 'binari', s0: 0, s1: 60, d0: -0.05, d1: 0.05, surface: 'rotaia', label: 'rotaia' },
        { id: 'rotaia2', kind: 'rotaie', road: 'binari', s0: 0, s1: 60, d0: 1.385, d1: 1.485, surface: 'rotaia', label: 'rotaia' },
      ],
      objects: [...buildings(g, 2 * W + 3, 0, 300, 14, 'right'), ...buildings(g, -(W + 3), 0, 300, 14, 'left'), ...poles(g, -(W + 0.6), 10, 290, 25)],
      actors: [{ id: 'auto', kind: 'auto', label: 'auto', color: '#5d6d7e', road: 'main', d: W * 1.5, motion: motion(150, 30).build(30) }],
      ego: { road: 'main', s0: sCross - 60, d: dPath, speed: p.speed, limit: 50, watch: [] },
      notes: [{ t: 0.3, text: 'I binari del tram attraversano la corsia in diagonale.' }],
      env: { wet: p.wet, rain: p.wet },
      frame: [-25, sCross - 50, 40, sCross + 40],
    };
  },
};

/* U-08 — sampietrini bagnati e frenata in curva */
const u08: ScenePreset = {
  defaults: { speed: 40, wet: true, abs: false, gap: 1.5 },
  controls: ['speed', 'gap', 'wet', 'abs'],
  guida:
    'Strada in sampietrini lucidati, curva a sinistra di raggio 60 m. L’auto che precede frena per un pedone all’uscita della curva. Sui lapidei bagnati l’aderenza è 0,3: in piega quella residua per frenare è minima e senza ABS l’anteriore si blocca.',
  build: (p) => {
    const main = urban('main', [str(130), arc(60, 70), str(150)], { paving: 'lapideo' });
    const g = geom(main);
    const c1 = 130 + (60 * 70 * Math.PI) / 180;
    const v = p.speed / 3.6;
    const egoS0 = 70;
    const carS0 = egoS0 + 3.2 + Math.max(4, p.gap * v);
    const tBrake = (c1 - 12 - carS0) / v;
    return {
      id: 'U-08',
      duration: Math.min(14, tBrake + 5),
      roads: [main],
      hazards: [],
      objects: [...buildings(g, 6.5, 0, 340, 12, 'right'), ...buildings(g, -6.5, 0, 340, 12, 'left'), ...poles(g, 4.5, 10, 330, 22)],
      actors: [
        { id: 'auto', kind: 'auto', label: 'auto che precede', color: '#7a5b3a', road: 'main', d: 1.75, lights: true, motion: motion(carS0, p.speed).until(tBrake).to(0, p.wet ? 5 : 7).wait(10).build(20) },
        { id: 'ped', kind: 'pedone', label: 'pedone', road: 'main', d: 2.5, motion: still(c1 + 2) },
      ],
      ego: { road: 'main', s0: egoS0, d: 1.75, speed: p.speed, limit: 50, watch: [{ actor: 'auto', from: tBrake, label: 'luci di arresto dell’auto' }] },
      notes: [{ t: Math.max(0.2, tBrake), text: 'L’auto frena all’uscita della curva per un pedone.' }],
      env: { wet: p.wet, rain: p.wet },
      baseSurface: 'lapideo',
      frame: [-80, 60, 30, 230],
    };
  },
};

/* U-11 — isola spartitraffico poco visibile di notte */
const u11: ScenePreset = {
  defaults: { speed: 50, night: true },
  controls: ['speed', 'night', 'tau', 'effort', 'abs'],
  guida:
    'Di notte un’isola spartitraffico con cordolo compare all’improvviso: è poco illuminata e l’auto davanti, che devia per tempo, la nasconde. La moto, che procede vicino all’asse, la vede a 20 m. Sopra i 15 km/h l’urto contro il cordolo fa cadere. La simulazione considera solo la frenata, non la sterzata.',
  build: (p) => {
    const main = urban('main', [str(300)], { shoulderRight: 1.5, shoulderLeft: 1.5, centerLine: 'continua' });
    const g = geom(main);
    const s0 = 160;
    const island = [g.point(s0, 0), ...g.polyline(0.7, s0 + 3, s0 + 45, 3), ...g.polyline(-0.7, s0 + 3, s0 + 45, 3).reverse()];
    return {
      id: 'U-11',
      duration: 11,
      roads: [main],
      hazards: [{ id: 'cordolo', kind: 'cordolo', road: 'main', s0: s0, s1: s0 + 6, d0: -0.7, d1: 0.9, height: 0.15, label: 'cordolo dell’isola' }],
      objects: [
        { kind: 'spartitraffico', poly: island },
        { kind: 'palo', at: g.point(s0 + 2.5, 0), tipo: 'segnale' },
        ...buildings(g, 8, 0, 300, 14, 'right'),
        ...buildings(g, -8, 0, 300, 14, 'left'),
        ...poles(g, 5.2, 20, 120, 40),
        ...poles(g, 5.2, 220, 300, 40),
      ],
      actors: [
        {
          id: 'auto',
          kind: 'auto',
          label: 'auto che precede',
          color: '#3d3d3d',
          road: 'main',
          d: [
            [0, 1.2],
            [s0 - 40, 1.2],
            [s0 - 10, 2.4],
          ],
          lights: true,
          motion: motion(118, p.speed).build(30),
        },
      ],
      ego: {
        road: 'main',
        s0: 90,
        d: 0.8,
        speed: p.speed,
        limit: 50,
        watch: [{ hazard: 'cordolo', range: 60, label: 'isola spartitraffico' }],
        visibility: p.night ? [{ s0: 100, s1: s0 + 2, range: 20, label: 'isola non illuminata' }] : undefined,
      },
      notes: [{ t: 0.3, text: 'L’auto davanti devia a destra per tempo; la moto procede vicino all’asse.' }],
      env: { night: p.night },
      frame: [-25, 90, 30, 220],
    };
  },
};

/* U-13 — svolta a destra che taglia la moto nella corsia riservata */
const u13: ScenePreset = {
  defaults: { speed: 40 },
  controls: ['speed', 'tau', 'effort', 'wet', 'abs'],
  guida:
    'La moto percorre la corsia riservata superando a destra la colonna che avanza a 15 km/h. Un’auto della colonna svolta a destra in una laterale quando la moto è a 9 m: chi svolta non si aspetta un veicolo veloce sulla destra. A 25 km/h la moto si ferma, a 40 km/h no.',
  build: (p) => {
    const W = 3.5;
    const main = urban('main', [str(340)], { lanesRight: 2, lanesLeft: 1 });
    const g = geom(main);
    const vc = 15 / 3.6;
    const v = p.speed / 3.6;
    const c0 = 175;
    const egoS0 = 125;
    const tTurn = Math.max(0.8, (c0 - 2.15 - 9 - (egoS0 + 1.05)) / Math.max(0.5, v - vc));
    const yArc = c0 + vc * tTurn;
    const R = 9;
    const side: RoadSpec = { ...urban('lat', [str(70)]), start: { x: 0, y: 0, heading: 0 }, junction: { road: 'main', s: yArc + R + 1.6, side: 'right' } };
    const turn = route('svolta', g.pose(0, W / 2), [str(yArc), arc(R, -90), str(60)]);
    const column: ActorSpec[] = [];
    let k = 0;
    for (let s = 60; s < 320; s += 7.5) {
      if (Math.abs(s - c0) < 5) continue;
      column.push({ id: `c${k}`, kind: k % 6 === 2 ? 'furgone' : 'auto', label: 'auto in colonna', color: parkedColors[k % parkedColors.length], road: 'main', d: W / 2, motion: motion(s, 15).build(30) });
      k++;
    }
    return {
      id: 'U-13',
      duration: Math.min(18, tTurn + 6),
      roads: [main, side, turn],
      hazards: [],
      objects: [...buildings(g, 2 * W + 3, 0, 340, 14, 'right', [[yArc - 5, yArc + 25]]), ...buildings(g, -(W + 3), 0, 340, 14, 'left')],
      actors: [
        { id: 'svolta', kind: 'auto', label: 'auto che svolta a destra', color: '#c0392b', road: 'svolta', d: 0, indicator: { side: 'right', from: Math.max(0, tTurn - 1.5) }, motion: motion(c0, 15).untilS(yArc).hold(0.2).to(12, 1).build(30) },
        ...column,
      ],
      ego: { road: 'main', s0: egoS0, d: W * 1.5, speed: p.speed, limit: 50, watch: [{ actor: 'svolta', from: tTurn, label: 'auto che svolta a destra' }] },
      notes: [{ t: tTurn, text: 'L’auto svolta a destra attraversando la corsia riservata.' }],
      frame: [-25, 100, 45, 260],
    };
  },
};

/* U-14 — angolo cieco del mezzo pesante in svolta a destra */
const u14: ScenePreset = {
  defaults: { speed: 15 },
  controls: ['speed', 'tau'],
  speedRange: [5, 30],
  guida:
    'Al verde l’autoarticolato svolta a destra. La moto avanza alla sua destra per portarsi in testa: è nell’angolo cieco e nella zona spazzata dal semirimorchio, che in curva taglia verso l’interno. Anche fermandosi si può essere schiacciati. A 5 km/h la moto resta dietro il camion e la svolta avviene davanti a lei.',
  build: (p) => {
    const W = 4.5;
    const main = urban('main', [str(260)], { laneWidth: W });
    const g = geom(main);
    const yArc = 166;
    const R = 13;
    const side: RoadSpec = { ...urban('lat', [str(80)]), start: { x: 0, y: 0, heading: 0 }, junction: { road: 'main', s: yArc + R + 1.6, side: 'right' } };
    const turn = route('svolta', g.pose(0, 1.9), [str(yArc), arc(R, -90), str(80)]);
    const truckS0 = 150 - 5.15;
    return {
      id: 'U-14',
      duration: 10,
      roads: [main, side, turn],
      hazards: [],
      objects: [
        ...buildings(g, W + 3, 0, yArc - 2, 14, 'right'),
        ...buildings(g, W + 3, yArc + 22, 260, 14, 'right'),
        ...buildings(g, -(W + 3), 0, 260, 14, 'left'),
        { kind: 'palo', at: g.point(160, W + 0.6), tipo: 'segnale' },
      ],
      actors: [
        { id: 'camion', kind: 'camion', label: 'autoarticolato in svolta', color: '#b5442f', road: 'svolta', d: 0, lights: true, indicator: { side: 'right', from: 0 }, motion: motion(truckS0, 0).until(2.5).to(15, 1.2).build(30) },
      ],
      ego: { road: 'main', s0: 150 - 8.25 - 3 - 1.05, d: 3.85, speed: p.speed, limit: 50, watch: [{ actor: 'camion', from: 3.2, label: 'camion che svolta' }] },
      notes: [
        { t: 0.3, text: 'Semaforo rosso: il camion attende con l’indicatore a destra.' },
        { t: 2.5, text: 'Verde: il camion avanza e svolta; il semirimorchio taglia la curva verso l’interno.' },
      ],
      frame: [-25, 110, 45, 200],
    };
  },
};

/* U-15 — dosso artificiale in curva di notte */
const u15: ScenePreset = {
  defaults: { speed: 50, night: true, wet: true },
  controls: ['speed', 'wet', 'night'],
  speedRange: [20, 70],
  guida:
    'Un rallentatore in rilievo è posto dentro una curva a sinistra di raggio 40 m, poco visibile di notte. Sopra i 30 km/h la sospensione si estende e le ruote si scaricano: l’aderenza disponibile si riduce per un istante proprio mentre la moto è in piega. Sul bagnato a 50 km/h non basta, a 40 km/h sì.',
  build: (p) => {
    const main = urban('main', [str(120), arc(40, 75), str(120)]);
    const g = geom(main);
    const c0 = 120;
    const mid = c0 + (40 * 75 * Math.PI) / 180 / 2;
    return {
      id: 'U-15',
      duration: 9,
      roads: [main],
      hazards: [{ id: 'dosso', kind: 'dosso', road: 'main', s0: mid - 2, s1: mid + 2, d0: 0, d1: 3.5, height: 0.07, label: 'rallentatore in rilievo' }],
      objects: [...buildings(g, 6.5, 0, 300, 13, 'right'), ...buildings(g, -6.5, 0, 300, 13, 'left'), ...poles(g, 4.4, 10, 290, 35)],
      actors: [],
      ego: { road: 'main', s0: 60, d: 1.75, speed: p.speed, limit: 50, watch: [] },
      notes: [{ t: 0.3, text: 'Rallentatore non segnalato dentro la curva.' }],
      env: { night: p.night, wet: p.wet, rain: p.wet },
      frame: [-70, 60, 30, 210],
    };
  },
};

/* U-16 — sole radente alle spalle della moto */
const u16: ScenePreset = {
  defaults: { speed: 50 },
  controls: ['speed', 'tau', 'effort', 'wet', 'abs'],
  guida:
    'Il sole è basso alle spalle della moto: il conducente che deve svoltare a sinistra guarda controluce e non la distingue. Parte quando la moto è a soli 25 m dal punto di conflitto. A 40 km/h si riesce a fermarsi, a 50 km/h no.',
  build: (p) => {
    const main = urban('main', [str(320)]);
    const side: RoadSpec = { ...urban('lat', [str(80)]), start: { x: 0, y: 0, heading: 0 }, junction: { road: 'main', s: 200, side: 'right' }, laneWidth: 3.25 };
    const g = geom(main);
    const R = 9;
    const yArc = 200 - 1.625 + R;
    const L0 = 34;
    const turn = route('svolta', g.pose(yArc + L0, -1.75, true), [str(L0), arc(R, 90), str(70)]);
    const egoS0 = 85;
    const tTurn = Math.max(0.8, (201 - 25 - (egoS0 + 1.05)) / (p.speed / 3.6));
    return {
      id: 'U-16',
      duration: Math.min(16, tTurn + 5),
      roads: [main, side, turn],
      hazards: [],
      objects: [...buildings(g, 7, 0, 320, 14, 'right', [[180, 222]]), ...buildings(g, -7, 0, 320, 14, 'left'), ...treeRow(g, -5.2, 10, 310, 12, 2.6)],
      actors: [{ id: 'auto', kind: 'auto', label: 'auto in svolta', color: '#8c8c8c', road: 'svolta', d: 0, indicator: { side: 'left', from: 0 }, motion: motion(L0 - 0.5, 0).until(tTurn).to(22, 2.6).build(30) }],
      ego: { road: 'main', s0: egoS0, d: 1.75, speed: p.speed, limit: 50, watch: [{ actor: 'auto', from: tTurn, label: 'auto che svolta a sinistra' }] },
      notes: [
        { t: 0.2, text: 'Tramonto: il sole è basso alle spalle della moto.' },
        { t: tTurn, text: 'Il conducente, abbagliato, non distingue la moto e parte.' },
      ],
      env: { sun: 'basso-dietro', wet: p.wet },
      frame: [-60, 60, 70, 250],
    };
  },
};

/* U-17 — olio al centro della corsia davanti al semaforo */
const u17: ScenePreset = {
  defaults: { speed: 50, wet: true, abs: false, offset: 0 },
  controls: ['speed', 'offset', 'wet', 'abs'],
  labels: { offset: 'Posizione nella corsia (negativo = nella traccia delle ruote)' },
  guida:
    'La moto rallenta per fermarsi in coda al semaforo con una frenata normale (0,3 g). Al centro della corsia, dove le auto sostano a motore acceso, si accumula una striscia d’olio: bagnata offre 0,12. Senza ABS l’anteriore si blocca. Frenando nella traccia delle ruote (offset −0,85) l’olio si evita.',
  build: (p) => {
    const main = urban('main', [str(300)]);
    const g = geom(main);
    const v = p.speed / 3.6;
    const rear = 200 - 2.15;
    const stopAt = rear - 2;
    const s0Plan = stopAt - 1.05 - (v * v) / (2 * 3);
    const queue: ActorSpec[] = [0, 1, 2].map((i) => ({ id: i ? `q${i}` : 'coda', kind: 'auto', label: 'auto ferma al semaforo', color: parkedColors[i + 2], road: 'main', d: 1.75, lights: true, motion: still(200 + i * 6.5) }));
    return {
      id: 'U-17',
      duration: 12,
      roads: [main],
      hazards: [{ id: 'olio', kind: 'gasolio', road: 'main', s0: s0Plan - 10, s1: rear + 20, d0: 1.35, d1: 2.15, surface: 'gasolio', label: 'striscia d’olio' }],
      objects: [...buildings(g, 6.5, 0, 300, 14, 'right'), ...buildings(g, -6.5, 0, 300, 14, 'left'), { kind: 'palo', at: g.point(222, 4.2), tipo: 'segnale' }, ...poles(g, 4.4, 10, 290, 26)],
      actors: queue,
      ego: { road: 'main', s0: 60, d: 1.75, speed: p.speed, limit: 50, watch: [], plan: [{ s0: s0Plan, toKmh: 0, a: 3, label: 'Frenata per fermarsi in coda al semaforo' }] },
      notes: [{ t: 0.3, text: 'Semaforo rosso, coda di auto ferme.' }],
      env: { wet: p.wet, rain: p.wet },
      frame: [-25, 90, 30, 230],
    };
  },
};

export const URBANO2_SCENES: Record<string, ScenePreset> = {
  'U-03': u03,
  'U-04': u04,
  'U-06': u06,
  'U-07': u07,
  'U-08': u08,
  'U-11': u11,
  'U-13': u13,
  'U-14': u14,
  'U-15': u15,
  'U-16': u16,
  'U-17': u17,
};

export type { ObjectSpec };
