/**
 * Costruzione della scena three.js a partire dal modello di scena condiviso.
 * Mappatura delle coordinate: mondo (x est, y nord, z quota) → three (X = x, Y = z, Z = −y).
 */
import * as THREE from 'three';
import type { World } from '../../scene/world';
import type { RoadGeom } from '../../scene/road';
import { roadBands, roadLines, dashSpans, type BandKind } from '../../scene/road';
import type { ActorKind, HazardKind, Vec2 } from '../../scene/types';

export const toV3 = (x: number, y: number, z = 0) => new THREE.Vector3(x, z, -y);

export interface Env {
  night: boolean;
  wet: boolean;
}

export interface Static3D {
  group: THREE.Group;
  lamps: THREE.Vector3[];
  groundZ: (p: Vec2) => number;
  dispose: () => void;
}

/* ----------------------------------------------------------------------------- texture procedurali */

function canvasTexture(size: number, draw: (c: CanvasRenderingContext2D, s: number) => void, repeat = 1) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const c = cv.getContext('2d')!;
  draw(c, size);
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function rand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

const speckle = (base: string, dots: string[], n: number, rmax: number) =>
  canvasTexture(256, (c, s) => {
    c.fillStyle = base;
    c.fillRect(0, 0, s, s);
    const r = rand(7);
    for (let i = 0; i < n; i++) {
      c.fillStyle = dots[i % dots.length];
      c.beginPath();
      c.arc(r() * s, r() * s, 0.6 + r() * rmax, 0, Math.PI * 2);
      c.fill();
    }
  });

/** maschera del fascio anabbagliante: taglio orizzontale netto, gradino asimmetrico a destra */
export function headlightCookie() {
  return canvasTexture(256, (c, s) => {
    c.fillStyle = '#000';
    c.fillRect(0, 0, s, s);
    const cut = s * 0.5;
    const grd = c.createRadialGradient(s / 2, cut + s * 0.08, 4, s / 2, cut + s * 0.08, s * 0.55);
    grd.addColorStop(0, '#ffffff');
    grd.addColorStop(0.45, '#d8d8d8');
    grd.addColorStop(1, '#000000');
    c.fillStyle = grd;
    c.beginPath();
    c.moveTo(0, cut);
    c.lineTo(s * 0.52, cut);
    c.lineTo(s * 0.64, cut - s * 0.07);
    c.lineTo(s, cut - s * 0.07);
    c.lineTo(s, s);
    c.lineTo(0, s);
    c.closePath();
    c.fill();
  });
}

/* ----------------------------------------------------------------------------- geometrie di base */

/** nastro lungo la strada tra le distanze d0 e d1, alla quota stradale + dz */
function ribbon(g: RoadGeom, d0: number, d1: number, s0: number, s1: number, step = 1, dz = 0, uvScale = 0.25) {
  const n = Math.max(1, Math.ceil((s1 - s0) / step));
  const pos: number[] = [];
  const nor: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= n; i++) {
    const s = s0 + ((s1 - s0) * i) / n;
    const a = g.pose(s, d0);
    const b = g.pose(s, d1);
    pos.push(a.x, a.z + dz, -a.y, b.x, b.z + dz, -b.y);
    nor.push(0, 1, 0, 0, 1, 0);
    uv.push(d0 * uvScale, s * uvScale, d1 * uvScale, s * uvScale);
    if (i < n) {
      const k = i * 2;
      idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  return geo;
}

/** parete verticale lungo una polilinea, tra le quote zb+h0 e zb+h1 */
function wall(line: Vec2[], h0: number, h1: number, zAt: (p: Vec2) => number) {
  const pos: number[] = [];
  const idx: number[] = [];
  line.forEach((p, i) => {
    const z = zAt(p);
    pos.push(p.x, z + h0, -p.y, p.x, z + h1, -p.y);
    if (i < line.length - 1) {
      const k = i * 2;
      idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3);
    }
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

/** superficie inclinata tra due polilinee (scarpate) */
function slope(a: Vec2[], b: Vec2[], hb: number, zAt: (p: Vec2) => number) {
  const pos: number[] = [];
  const idx: number[] = [];
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    pos.push(a[i].x, zAt(a[i]), -a[i].y, b[i].x, zAt(a[i]) + hb, -b[i].y);
    if (i < n - 1) {
      const k = i * 2;
      idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

function offsetLine(line: Vec2[], off: number): Vec2[] {
  return line.map((p, i) => {
    const a = line[Math.max(0, i - 1)];
    const b = line[Math.min(line.length - 1, i + 1)];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const l = Math.hypot(dx, dy) || 1;
    return { x: p.x + (dy / l) * off, y: p.y - (dx / l) * off };
  });
}

/* ----------------------------------------------------------------------------- scena statica */

export function buildStatic(world: World, env: Env): Static3D {
  const group = new THREE.Group();
  const disposables: { dispose: () => void }[] = [];
  const track = <T extends { dispose: () => void }>(x: T) => {
    disposables.push(x);
    return x;
  };
  const egoRoad = world.roads.get(world.spec.ego.road)!;
  const elevated = !!egoRoad.spec.elevation;
  const groundZ = (p: Vec2) => (elevated ? egoRoad.at(egoRoad.project(p).s).z : 0);
  const urban = world.spec.roads.some((r) => r.style === 'urbano');

  const wet = env.wet;
  const mat = {
    // superfici opache (Lambert): senza riflesso speculare radente l'asfalto resta leggibile in soggettiva
    asfalto: track(wet ? new THREE.MeshStandardMaterial({ color: 0x2a2d31, roughness: 0.32, metalness: 0.1 }) : new THREE.MeshLambertMaterial({ color: 0x3c4045 })),
    banchina: track(new THREE.MeshLambertMaterial({ color: 0x8a8475 })),
    marciapiede: track(new THREE.MeshLambertMaterial({ color: 0xb2ada3 })),
    spartitraffico: track(new THREE.MeshLambertMaterial({ color: 0x6f7b55 })),
    sterrato: track(new THREE.MeshLambertMaterial({ color: 0x9b8462 })),
    verde: track(new THREE.MeshLambertMaterial({ color: 0x6f8048 })),
    line: track(new THREE.MeshLambertMaterial({ color: 0xf2f2ee, emissive: 0x1a1a1a })),
    cordolo: track(new THREE.MeshStandardMaterial({ color: 0x9a968f, roughness: 0.9, side: THREE.DoubleSide })),
    guardrail: track(new THREE.MeshStandardMaterial({ color: 0xb8bec4, roughness: 0.35, metalness: 0.7, side: THREE.DoubleSide })),
    dsm: track(new THREE.MeshStandardMaterial({ color: 0xc9a227, roughness: 0.5, metalness: 0.3, side: THREE.DoubleSide })),
    paletto: track(new THREE.MeshStandardMaterial({ color: 0x8d949b, roughness: 0.4, metalness: 0.6 })),
    nj: track(new THREE.MeshStandardMaterial({ color: 0xcfd1cd, roughness: 0.9, side: THREE.DoubleSide })),
    siepe: track(new THREE.MeshStandardMaterial({ color: 0x3f5b2e, roughness: 1, side: THREE.DoubleSide })),
    muro: track(new THREE.MeshStandardMaterial({ color: 0x9a948a, roughness: 1, side: THREE.DoubleSide })),
    scarpata: track(new THREE.MeshStandardMaterial({ color: 0x7c6e4c, roughness: 1, side: THREE.DoubleSide })),
    tronco: track(new THREE.MeshStandardMaterial({ color: 0x5a4632, roughness: 1 })),
    chioma: track(new THREE.MeshStandardMaterial({ color: 0x4d6b35, roughness: 1, flatShading: true })),
    palo: track(new THREE.MeshStandardMaterial({ color: 0x55595e, roughness: 0.6, metalness: 0.4 })),
    lampada: track(new THREE.MeshStandardMaterial({ color: 0xfff3d0, emissive: env.night ? 0xffe2a0 : 0x000000, emissiveIntensity: 2 })),
    delineatore: track(new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.7 })),
    catarifrangente: track(new THREE.MeshStandardMaterial({ color: 0xff9a1a, emissive: env.night ? 0x7a3a00 : 0x000000, roughness: 0.3 })),
  };
  const bandMat: Record<BandKind, THREE.Material> = {
    asfalto: mat.asfalto,
    banchina: mat.banchina,
    marciapiede: mat.marciapiede,
    spartitraffico: mat.spartitraffico,
    sterrato: mat.sterrato,
    verde: mat.verde,
  };

  // sampietrini: texture a blocchi, lucida sul bagnato
  const lapideoTex = track(
    canvasTexture(256, (c, sz) => {
      c.fillStyle = '#3e4143';
      c.fillRect(0, 0, sz, sz);
      const r = rand(11);
      const n = 21;
      const cell = sz / n;
      for (let i = 0; i < n; i++)
        for (let j = 0; j < n; j++) {
          const v = 80 + Math.floor(r() * 40);
          c.fillStyle = `rgb(${v},${v + 2},${v + 4})`;
          c.fillRect(i * cell + 1.5, j * cell + 1.5 + ((i % 2) * cell) / 2, cell - 3, cell - 3);
        }
    }),
  );
  lapideoTex.repeat.set(0.35, 0.35);
  const lapideoMat = track(new THREE.MeshStandardMaterial({ map: lapideoTex, roughness: wet ? 0.25 : 0.75, metalness: wet ? 0.2 : 0 }));

  // terreno
  const groundColor = urban ? 0x8f8c86 : 0x66763f;
  const ground = new THREE.Mesh(track(new THREE.PlaneGeometry(6000, 6000)), track(new THREE.MeshLambertMaterial({ color: groundColor })));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.06;
  group.add(ground);

  for (const g of world.roads.values()) {
    if (g.spec.hidden) continue;
    // fascia di terreno che segue la quota della strada (raccordi altimetrici)
    if (g.spec.elevation) {
      group.add(new THREE.Mesh(track(ribbon(g, -g.left - 60, g.right + 60, 0, g.length, 2, -0.05)), track(new THREE.MeshLambertMaterial({ color: groundColor, side: THREE.DoubleSide }))));
    }
    for (const b of roadBands(g)) {
      const raise = b.kind === 'marciapiede' ? 0.15 : b.kind === 'spartitraffico' ? 0.02 : 0;
      const spans: [number, number][] = b.side ? g.spansOutsideGaps(b.side) : [[0, g.length]];
      for (const [s0, s1] of spans) {
        const bm = b.kind === 'asfalto' && g.spec.paving === 'lapideo' ? lapideoMat : bandMat[b.kind];
        const m = new THREE.Mesh(track(ribbon(g, b.d0, b.d1, s0, s1, 1, raise + (b.kind === 'asfalto' ? 0 : -0.005), 1)), bm);
        group.add(m);
        if (b.kind === 'marciapiede') {
          const edge = b.side === 'right' ? b.d0 : b.d1;
          group.add(new THREE.Mesh(track(wall(g.polyline(edge, s0, s1, 1), 0, 0.15, (p) => groundZ(p))), mat.cordolo));
        }
      }
    }
    for (const l of roadLines(g)) {
      const w = l.kind === 'margine' ? 0.15 : 0.12;
      const spans: [number, number][] = l.side ? g.spansOutsideGaps(l.side) : [[0, g.length]];
      for (const [s0, s1] of spans) {
        const pieces: [number, number][] = l.kind === 'tratteggiata' && l.dash ? dashSpans(s1 - s0, l.dash).map(([a, b]) => [s0 + a, s0 + b]) : [[s0, s1]];
        for (const [a, b] of pieces) group.add(new THREE.Mesh(track(ribbon(g, l.d - w / 2, l.d + w / 2, a, b, 1.5, 0.012)), mat.line));
      }
    }
  }

  // pericoli
  const hazTex = {
    ghiaia: track(speckle('#7d786c', ['#c8bfa8', '#a39a85', '#5d584e', '#dcd3bd'], 2600, 2.2)),
    foglie: track(speckle('#5a4a2c', ['#b5651d', '#8c3d10', '#d29a2a'], 900, 5)),
    fessure: track(
      canvasTexture(256, (c, s) => {
        c.fillStyle = '#45494d';
        c.fillRect(0, 0, s, s);
        c.strokeStyle = '#111';
        c.lineWidth = 3;
        const r = rand(3);
        for (let i = 0; i < 18; i++) {
          c.beginPath();
          let x = r() * s;
          let y = r() * s;
          c.moveTo(x, y);
          for (let k = 0; k < 5; k++) {
            x += (r() - 0.5) * 60;
            y += (r() - 0.5) * 60;
            c.lineTo(x, y);
          }
          c.stroke();
        }
      }),
    ),
  } as Record<string, THREE.Texture>;
  const hazTex2 = {
    fresato: track(
      canvasTexture(128, (c, sz) => {
        c.fillStyle = '#3b3d40';
        c.fillRect(0, 0, sz, sz);
        c.fillStyle = '#5a5d61';
        for (let i = 0; i < sz; i += 8) c.fillRect(i, 0, 3, sz);
      }),
    ),
    dosso: track(
      canvasTexture(128, (c, sz) => {
        c.fillStyle = '#f2c230';
        c.fillRect(0, 0, sz, sz);
        c.fillStyle = '#1d1d1d';
        for (let i = -sz; i < sz; i += 32) {
          c.beginPath();
          c.moveTo(i, 0);
          c.lineTo(i + 16, 0);
          c.lineTo(i + 16 + sz, sz);
          c.lineTo(i + sz, sz);
          c.fill();
        }
      }),
    ),
  };
  Object.assign(hazTex, hazTex2);
  const hazMat = (kind: HazardKind): THREE.Material => {
    switch (kind) {
      case 'buca':
        return new THREE.MeshStandardMaterial({ color: 0x141312, roughness: 1 });
      case 'gasolio':
        return new THREE.MeshStandardMaterial({ color: 0x23262c, roughness: 0.08, metalness: 0.65, transparent: true, opacity: 0.88, emissive: 0x150f22 });
      case 'ghiaia':
        return new THREE.MeshStandardMaterial({ map: hazTex.ghiaia, roughness: 1 });
      case 'foglie':
        return new THREE.MeshStandardMaterial({ map: hazTex.foglie, roughness: 1 });
      case 'sigillature':
        return new THREE.MeshStandardMaterial({ map: hazTex.fessure, roughness: 0.6 });
      case 'acqua':
        return env.wet ? new THREE.MeshStandardMaterial({ color: 0x3a4a56, roughness: 0.03, metalness: 0.9 }) : new THREE.MeshLambertMaterial({ color: 0x33363a });
      case 'ormaie':
        return env.wet ? new THREE.MeshStandardMaterial({ color: 0x3a4a56, roughness: 0.03, metalness: 0.9, transparent: true, opacity: 0.9 }) : new THREE.MeshLambertMaterial({ color: 0x2f3236 });
      case 'chiusino':
      case 'giunto':
      case 'rotaie':
        return new THREE.MeshStandardMaterial({ color: 0x8a9096, roughness: 0.25, metalness: 0.9 });
      case 'gradino':
        return new THREE.MeshLambertMaterial({ color: 0x1c1d1f });
      case 'fresato':
        return new THREE.MeshLambertMaterial({ map: hazTex.fresato });
      case 'dosso':
        return new THREE.MeshLambertMaterial({ map: hazTex.dosso });
      case 'cordolo':
        return new THREE.MeshLambertMaterial({ color: 0xbdb8ae });
      case 'ghiaccio':
        return new THREE.MeshStandardMaterial({ color: 0xdbeef8, roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.55 });
      case 'fango':
        return new THREE.MeshLambertMaterial({ color: 0x5e4630 });
      case 'lucidato':
        return new THREE.MeshStandardMaterial({ color: 0x4a4e53, roughness: 0.12, metalness: 0.2, transparent: true, opacity: 0.6 });
      case 'strisce':
        return new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
      default:
        return new THREE.MeshStandardMaterial({ color: 0x55534f, roughness: 0.5 });
    }
  };
  for (const h of world.hazards) {
    if (h.spec.kind === 'strisce') continue;
    const z = groundZ(h.center);
    if (h.spec.kind === 'detrito') {
      // battistrada di camion: striscia di gomma arcuata
      const m = new THREE.Mesh(track(new THREE.TorusGeometry(0.45, 0.09, 6, 12, Math.PI * 1.2)), track(new THREE.MeshStandardMaterial({ color: 0x0d0d0d, roughness: 0.8 })));
      m.position.copy(toV3(h.center.x, h.center.y, z + 0.1));
      m.rotation.set(-Math.PI / 2 + 0.3, 0, 0.4);
      m.scale.set(1.4, 1, 1.5);
      group.add(m);
      continue;
    }
    const shape = new THREE.Shape(h.poly.map((p) => new THREE.Vector2(p.x, p.y)));
    if (h.spec.kind === 'dosso' || h.spec.kind === 'cordolo') {
      // elementi in rilievo
      const hh = h.spec.height ?? (h.spec.kind === 'dosso' ? 0.07 : 0.15);
      const eg = track(new THREE.ExtrudeGeometry(shape, { depth: hh, bevelEnabled: false }));
      const uvE = eg.getAttribute('uv') as THREE.BufferAttribute;
      for (let i = 0; i < uvE.count; i++) uvE.setXY(i, uvE.getX(i) / 1.5, uvE.getY(i) / 1.5);
      const me = new THREE.Mesh(eg, track(hazMat(h.spec.kind)));
      me.rotation.x = -Math.PI / 2;
      me.position.y = z;
      group.add(me);
      continue;
    }
    const geo = track(new THREE.ShapeGeometry(shape));
    // coordinate uv in metri
    const uv = geo.getAttribute('uv') as THREE.BufferAttribute;
    const pos = geo.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / 3, pos.getY(i) / 3);
    const m = new THREE.Mesh(geo, track(hazMat(h.spec.kind)));
    m.rotation.x = -Math.PI / 2;
    m.position.y = z + (h.spec.kind === 'buca' ? 0.006 : 0.014);
    group.add(m);
  }

  // arredo
  const trees: { p: Vec2; r: number }[] = [];
  const lamps: THREE.Vector3[] = [];
  const postsGeo = track(new THREE.BoxGeometry(0.12, 0.8, 0.12));
  const postPos: THREE.Vector3[] = [];
  const delPos: THREE.Vector3[] = [];
  for (const o of world.spec.objects) {
    switch (o.kind) {
      case 'edificio': {
        const shape = new THREE.Shape(o.poly.map((p) => new THREE.Vector2(p.x, p.y)));
        const geo = track(new THREE.ExtrudeGeometry(shape, { depth: o.height, bevelEnabled: false }));
        const m = new THREE.Mesh(geo, track(new THREE.MeshStandardMaterial({ color: new THREE.Color(o.color ?? '#b9ad9e'), roughness: 0.95 })));
        m.rotation.x = -Math.PI / 2;
        m.position.y = groundZ(o.poly[0]) + 0.15;
        group.add(m);
        break;
      }
      case 'albero':
        trees.push({ p: o.at, r: o.r });
        break;
      case 'siepe':
      case 'muro': {
        const m0 = o.kind === 'siepe' ? mat.siepe : mat.muro;
        const half = o.thickness / 2;
        const a = offsetLine(o.line, -half);
        const b = offsetLine(o.line, half);
        group.add(new THREE.Mesh(track(wall(a, 0, o.height, groundZ)), m0));
        group.add(new THREE.Mesh(track(wall(b, 0, o.height, groundZ)), m0));
        group.add(new THREE.Mesh(track(slope(a, b, 0, (p) => groundZ(p) + o.height)), m0));
        break;
      }
      case 'scarpata': {
        // scarpata di trincea: sale dal ciglio verso l'esterno; l'esterno è il lato lontano dall'asse della strada
        const probe = egoRoad.project(o.line[Math.floor(o.line.length / 2)]);
        const out = Math.sign(probe.d) || 1;
        const top = offsetLine(o.line, out * o.thickness);
        group.add(new THREE.Mesh(track(slope(o.line, top, o.height, groundZ)), mat.scarpata));
        const far = offsetLine(o.line, out * (o.thickness + 25));
        group.add(new THREE.Mesh(track(slope(top, far, 0, (p) => groundZ(p) + o.height)), track(new THREE.MeshStandardMaterial({ color: 0x5e6e38, roughness: 1, side: THREE.DoubleSide }))));
        break;
      }
      case 'guardrail': {
        group.add(new THREE.Mesh(track(wall(o.line, 0.45, 0.78, groundZ)), mat.guardrail));
        if (o.dsm) group.add(new THREE.Mesh(track(wall(o.line, 0.02, 0.45, groundZ)), mat.dsm));
        for (let i = 0; i < o.line.length; i += 2) {
          const p = o.line[i];
          postPos.push(toV3(p.x, p.y, groundZ(p) + 0.4));
        }
        break;
      }
      case 'newjersey': {
        const a = offsetLine(o.line, -0.3);
        const b = offsetLine(o.line, 0.3);
        const at = offsetLine(o.line, -0.08);
        const bt = offsetLine(o.line, 0.08);
        group.add(new THREE.Mesh(track(slope(a, at, 0.9, groundZ)), mat.nj));
        group.add(new THREE.Mesh(track(slope(b, bt, 0.9, groundZ)), mat.nj));
        group.add(new THREE.Mesh(track(slope(at, bt, 0, (p) => groundZ(p) + 0.9)), mat.nj));
        break;
      }
      case 'palo': {
        const z = groundZ(o.at);
        const h = o.tipo === 'luce' ? 8 : o.tipo === 'linea' ? 9 : 2.6;
        const m = new THREE.Mesh(track(new THREE.CylinderGeometry(0.08, 0.12, h, 8)), mat.palo);
        m.position.copy(toV3(o.at.x, o.at.y, z + h / 2));
        group.add(m);
        if (o.tipo === 'luce') {
          const head = new THREE.Mesh(track(new THREE.BoxGeometry(0.7, 0.15, 0.35)), mat.lampada);
          head.position.copy(toV3(o.at.x, o.at.y, z + h));
          group.add(head);
          lamps.push(toV3(o.at.x, o.at.y, z + h - 0.3));
        }
        break;
      }
      case 'delineatore':
        delPos.push(toV3(o.at.x, o.at.y, groundZ(o.at) + 0.52));
        break;
      case 'isola': {
        const m = new THREE.Mesh(track(new THREE.CylinderGeometry(o.r, o.r, 0.25, 48)), mat.verde);
        m.position.copy(toV3(o.center.x, o.center.y, 0.12));
        group.add(m);
        break;
      }
      case 'cartello': {
        const z = groundZ(o.at);
        const pole = new THREE.Mesh(track(new THREE.CylinderGeometry(0.04, 0.04, 2.2, 6)), mat.palo);
        pole.position.copy(toV3(o.at.x, o.at.y, z + 1.1));
        group.add(pole);
        const tri = new THREE.Mesh(track(new THREE.CircleGeometry(0.55, 3)), track(new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x220000, side: THREE.DoubleSide })));
        tri.position.copy(toV3(o.at.x, o.at.y, z + 2.4));
        tri.rotation.z = Math.PI / 2;
        group.add(tri);
        break;
      }
      case 'rilevato': {
        const probe = egoRoad.project(o.line[Math.floor(o.line.length / 2)]);
        const out = Math.sign(probe.d) || 1;
        const foot = offsetLine(o.line, out * o.height * 1.5);
        group.add(new THREE.Mesh(track(slope(o.line, foot, -o.height, groundZ)), track(new THREE.MeshLambertMaterial({ color: 0x6a7840, side: THREE.DoubleSide }))));
        const far = offsetLine(o.line, out * (o.height * 1.5 + 60));
        group.add(new THREE.Mesh(track(slope(foot, far, 0, (p) => groundZ(p) - o.height)), track(new THREE.MeshLambertMaterial({ color: 0x5f6e3a, side: THREE.DoubleSide }))));
        break;
      }
      case 'galleria': {
        const g = world.roads.get(o.road)!;
        const wallMat = track(new THREE.MeshLambertMaterial({ color: 0x5c5f62, side: THREE.DoubleSide }));
        const left = g.polyline(o.d0 - 0.5, o.s0, o.s1, 2);
        const right = g.polyline(o.d1 + 0.5, o.s0, o.s1, 2);
        group.add(new THREE.Mesh(track(wall(left, 0, o.height, groundZ)), wallMat));
        group.add(new THREE.Mesh(track(wall(right, 0, o.height, groundZ)), wallMat));
        group.add(new THREE.Mesh(track(slope(left, right, 0, (p) => groundZ(p) + o.height)), track(new THREE.MeshLambertMaterial({ color: 0x2a2c2e, side: THREE.DoubleSide }))));
        // penombra interna sulla pavimentazione e corpi illuminanti
        group.add(new THREE.Mesh(track(ribbon(g, o.d0, o.d1, o.s0 + 4, o.s1, 2, 0.02)), track(new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.55 }))));
        const lampGeo = track(new THREE.BoxGeometry(1.2, 0.08, 0.25));
        const lampMat = track(new THREE.MeshBasicMaterial({ color: 0xffe7b0 }));
        for (let ss = o.s0 + 6; ss < o.s1; ss += 12) {
          const p = g.pose(ss, (o.d0 + o.d1) / 2);
          const lm = new THREE.Mesh(lampGeo, lampMat);
          lm.position.set(p.x, p.z + o.height - 0.1, -p.y);
          lm.rotation.y = p.th;
          group.add(lm);
        }
        // portale
        const pp = g.pose(o.s0, (o.d0 + o.d1) / 2);
        const portal = new THREE.Mesh(track(new THREE.BoxGeometry(1.5, 3, o.d1 - o.d0 + 6)), wallMat);
        portal.position.set(pp.x, pp.z + o.height + 1.5, -pp.y);
        portal.rotation.y = pp.th;
        group.add(portal);
        break;
      }
      case 'cono': {
        const m = new THREE.Mesh(track(new THREE.ConeGeometry(0.18, 0.75, 10)), track(new THREE.MeshLambertMaterial({ color: 0xff5a00, emissive: env.night ? 0x331000 : 0x000000 })));
        m.position.copy(toV3(o.at.x, o.at.y, groundZ(o.at) + 0.37));
        group.add(m);
        break;
      }
      case 'terminale': {
        const color = o.tipo === 'attenuatore' ? 0xf2b632 : o.tipo === 'spigolo' ? 0xcfd1cd : 0xb8bec4;
        const len = o.tipo === 'attenuatore' ? 3.2 : 0.8;
        const m = new THREE.Mesh(track(new THREE.BoxGeometry(len, o.tipo === 'spigolo' ? 0.9 : 0.8, 0.8)), track(new THREE.MeshLambertMaterial({ color })));
        m.position.copy(toV3(o.at.x, o.at.y, groundZ(o.at) + 0.45));
        m.rotation.y = o.th;
        group.add(m);
        break;
      }
      case 'spartitraffico': {
        const shape = new THREE.Shape(o.poly.map((p) => new THREE.Vector2(p.x, p.y)));
        const m = new THREE.Mesh(track(new THREE.ExtrudeGeometry(shape, { depth: 0.15, bevelEnabled: false })), track(new THREE.MeshLambertMaterial({ color: 0xc9c4ba })));
        m.rotation.x = -Math.PI / 2;
        m.position.y = groundZ(o.poly[0]);
        group.add(m);
        break;
      }
      case 'zebra': {
        const g = world.roads.get(o.road)!;
        for (let d = o.d0 + 0.25; d < o.d1 - 0.2; d += 1.0) group.add(new THREE.Mesh(track(ribbon(g, d, d + 0.5, o.s - o.width / 2, o.s + o.width / 2, o.width, 0.014)), mat.line));
        break;
      }
    }
  }
  if (postPos.length) {
    const inst = new THREE.InstancedMesh(postsGeo, mat.paletto, postPos.length);
    const m4 = new THREE.Matrix4();
    postPos.forEach((p, i) => inst.setMatrixAt(i, m4.makeTranslation(p.x, p.y, p.z)));
    group.add(inst);
  }
  if (delPos.length) {
    const geo = track(new THREE.BoxGeometry(0.12, 1.05, 0.1));
    const inst = new THREE.InstancedMesh(geo, mat.delineatore, delPos.length);
    const refl = new THREE.InstancedMesh(track(new THREE.BoxGeometry(0.13, 0.12, 0.11)), mat.catarifrangente, delPos.length);
    const m4 = new THREE.Matrix4();
    delPos.forEach((p, i) => {
      inst.setMatrixAt(i, m4.makeTranslation(p.x, p.y, p.z));
      refl.setMatrixAt(i, m4.makeTranslation(p.x, p.y + 0.35, p.z));
    });
    group.add(inst, refl);
  }
  if (trees.length) {
    const trunk = new THREE.InstancedMesh(track(new THREE.CylinderGeometry(0.15, 0.22, 3, 6)), mat.tronco, trees.length);
    const crown = new THREE.InstancedMesh(track(new THREE.IcosahedronGeometry(1, 1)), mat.chioma, trees.length);
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    trees.forEach((t, i) => {
      const z = groundZ(t.p);
      trunk.setMatrixAt(i, m4.makeTranslation(t.p.x, z + 1.5, -t.p.y));
      m4.compose(new THREE.Vector3(t.p.x, z + 2.6 + t.r * 0.8, -t.p.y), q, new THREE.Vector3(t.r, t.r * 1.15, t.r));
      crown.setMatrixAt(i, m4);
    });
    group.add(trunk, crown);
  }

  return {
    group,
    lamps,
    groundZ,
    dispose: () => disposables.forEach((d) => d.dispose()),
  };
}

/* ----------------------------------------------------------------------------- veicoli */

export interface VehicleMesh {
  group: THREE.Group;
  head?: THREE.MeshStandardMaterial;
  tail?: THREE.MeshStandardMaterial;
  indL?: THREE.MeshStandardMaterial;
  indR?: THREE.MeshStandardMaterial;
  /** perno della portiera anteriore sinistra (solo autovetture) */
  door?: THREE.Object3D;
  dispose: () => void;
}

/** veicolo con asse longitudinale lungo +X, origine al centro a quota strada */
export function makeVehicle(kind: ActorKind, color = '#6b7c8f', part: 'intero' | 'motrice' | 'rimorchio' = 'intero'): VehicleMesh {
  const grp = new THREE.Group();
  const disp: { dispose: () => void }[] = [];
  const mk = (geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number) => {
    disp.push(geo);
    const mesh = new THREE.Mesh(geo, m);
    mesh.position.set(x, y, z);
    grp.add(mesh);
    return mesh;
  };
  const body = new THREE.MeshStandardMaterial({ color: new THREE.Color(color), roughness: 0.45, metalness: 0.35 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x1b2630, roughness: 0.1, metalness: 0.6 });
  const tyre = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.9 });
  const head = new THREE.MeshStandardMaterial({ color: 0xfff7e0, emissive: 0x000000 });
  const tail = new THREE.MeshStandardMaterial({ color: 0x5a0a0a, emissive: 0x000000 });
  const indL = new THREE.MeshStandardMaterial({ color: 0x6a4a10, emissive: 0x000000 });
  const indR = new THREE.MeshStandardMaterial({ color: 0x6a4a10, emissive: 0x000000 });
  disp.push(body, glass, tyre, head, tail, indL, indR);
  let doorPivot: THREE.Object3D | undefined;
  const wheels = (l: number, w: number, r: number, xs: number[]) => {
    const geo = new THREE.CylinderGeometry(r, r, 0.25, 14);
    disp.push(geo);
    for (const x of xs)
      for (const s of [-1, 1]) {
        const m = new THREE.Mesh(geo, tyre);
        m.rotation.x = Math.PI / 2;
        m.position.set(x, r, (s * w) / 2);
        grp.add(m);
      }
    void l;
  };
  const lights = (l: number, w: number, y: number, front = true, rear = true) => {
    if (front) {
      for (const s of [-1, 1]) mk(new THREE.BoxGeometry(0.05, 0.14, 0.3), head, l / 2 + 0.01, y, (s * (w - 0.5)) / 2);
      mk(new THREE.BoxGeometry(0.05, 0.1, 0.12), indL, l / 2 + 0.01, y, -(w / 2 - 0.08));
      mk(new THREE.BoxGeometry(0.05, 0.1, 0.12), indR, l / 2 + 0.01, y, w / 2 - 0.08);
    }
    if (rear) {
      for (const s of [-1, 1]) mk(new THREE.BoxGeometry(0.05, 0.18, 0.34), tail, -l / 2 - 0.01, y, (s * (w - 0.5)) / 2);
      mk(new THREE.BoxGeometry(0.05, 0.1, 0.12), indL, -l / 2 - 0.01, y + 0.18, -(w / 2 - 0.1));
      mk(new THREE.BoxGeometry(0.05, 0.1, 0.12), indR, -l / 2 - 0.01, y + 0.18, w / 2 - 0.1);
    }
  };
  switch (kind) {
    case 'auto': {
      mk(new THREE.BoxGeometry(4.3, 0.72, 1.8), body, 0, 0.62, 0);
      mk(new THREE.BoxGeometry(2.3, 0.55, 1.6), glass, -0.25, 1.25, 0);
      mk(new THREE.BoxGeometry(2.0, 0.05, 1.55), body, -0.3, 1.53, 0);
      wheels(4.3, 1.62, 0.32, [1.35, -1.35]);
      lights(4.3, 1.8, 0.75);
      const pivot = new THREE.Object3D();
      pivot.position.set(0.6, 0, -0.9);
      const dg = new THREE.BoxGeometry(1.05, 0.75, 0.06);
      disp.push(dg);
      const dm = new THREE.Mesh(dg, body);
      dm.position.set(-0.525, 0.65, -0.03);
      pivot.add(dm);
      grp.add(pivot);
      doorPivot = pivot;
      break;
    }
    case 'furgone': {
      mk(new THREE.BoxGeometry(5.4, 1.95, 2.0), body, 0, 1.3, 0);
      mk(new THREE.BoxGeometry(0.06, 0.7, 1.8), glass, 2.71, 1.75, 0);
      wheels(5.4, 1.8, 0.36, [1.8, -1.8]);
      lights(5.4, 2.0, 0.85);
      break;
    }
    case 'camion': {
      if (part === 'motrice') {
        mk(new THREE.BoxGeometry(2.4, 2.9, 2.5), body, 1.9, 2.0, 0);
        mk(new THREE.BoxGeometry(0.06, 1.0, 2.2), glass, 3.11, 2.6, 0);
        mk(new THREE.BoxGeometry(3.6, 0.6, 2.4), tyre, -1.2, 0.9, 0);
        wheels(6.2, 2.1, 0.52, [2.0, -1.2, -2.5]);
        lights(6.2, 2.5, 0.9, true, false);
      } else {
        mk(new THREE.BoxGeometry(13.6, 2.75, 2.55), new THREE.MeshStandardMaterial({ color: 0xe9e7e2, roughness: 0.7 }), 0, 2.55, 0);
        wheels(13.6, 2.1, 0.5, [-4.6, -5.9]);
        lights(13.6, 2.5, 1.0, false, true);
      }
      break;
    }
    case 'autobus': {
      mk(new THREE.BoxGeometry(12, 2.8, 2.55), body, 0, 1.75, 0);
      mk(new THREE.BoxGeometry(11.6, 0.9, 2.57), glass, 0, 2.2, 0);
      wheels(12, 2.2, 0.5, [3.9, -3.3]);
      lights(12, 2.55, 0.8);
      break;
    }
    case 'trattore': {
      mk(new THREE.BoxGeometry(3.4, 1.2, 1.4), body, 0.2, 1.3, 0);
      mk(new THREE.BoxGeometry(1.3, 1.4, 1.5), glass, -0.7, 2.4, 0);
      wheels(4, 2.0, 0.8, [-1.2]);
      wheels(4, 1.7, 0.5, [1.3]);
      lights(4, 1.6, 1.4);
      break;
    }
    case 'moto': {
      mk(new THREE.BoxGeometry(2.0, 0.6, 0.4), body, 0, 0.7, 0);
      mk(new THREE.BoxGeometry(0.5, 0.7, 0.45), new THREE.MeshStandardMaterial({ color: 0x222222 }), -0.2, 1.35, 0);
      wheels(2, 0.01, 0.32, [0.75, -0.75]);
      lights(2, 0.5, 0.9);
      break;
    }
    case 'pedone': {
      mk(new THREE.CylinderGeometry(0.22, 0.2, 1.4, 10), body, 0, 0.7, 0);
      mk(new THREE.SphereGeometry(0.13, 10, 8), new THREE.MeshStandardMaterial({ color: 0xd2a884 }), 0, 1.55, 0);
      break;
    }
    case 'animale': {
      const fur = new THREE.MeshStandardMaterial({ color: new THREE.Color(color), roughness: 1 });
      mk(new THREE.BoxGeometry(1.1, 0.45, 0.38), fur, 0, 0.85, 0);
      mk(new THREE.BoxGeometry(0.3, 0.3, 0.22), fur, 0.65, 1.15, 0);
      for (const x of [-0.4, 0.4]) for (const z of [-0.13, 0.13]) mk(new THREE.BoxGeometry(0.08, 0.65, 0.08), fur, x, 0.32, z);
      // occhi riflettenti
      const eye = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0x000000 });
      mk(new THREE.SphereGeometry(0.035, 6, 6), eye, 0.81, 1.2, -0.07);
      mk(new THREE.SphereGeometry(0.035, 6, 6), eye, 0.81, 1.2, 0.07);
      break;
    }
  }
  return { group: grp, head, tail, indL, indR, door: doorPivot, dispose: () => disp.forEach((d) => d.dispose()) };
}

/** moto e pilota dell'ego (visibili nelle viste in terza persona) */
export function makeEgoBike() {
  const grp = new THREE.Group();
  const lean = new THREE.Group();
  grp.add(lean);
  const disp: { dispose: () => void }[] = [];
  const add = (geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number) => {
    disp.push(geo, m);
    const mesh = new THREE.Mesh(geo, m);
    mesh.position.set(x, y, z);
    lean.add(mesh);
    return mesh;
  };
  const tyre = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
  for (const x of [0.72, -0.72]) {
    const w = add(new THREE.TorusGeometry(0.3, 0.07, 8, 18), tyre, x, 0.32, 0);
    w.rotation.y = 0;
  }
  add(new THREE.BoxGeometry(1.25, 0.42, 0.34), new THREE.MeshStandardMaterial({ color: 0xf2b632, roughness: 0.4, metalness: 0.3 }), 0.05, 0.72, 0);
  add(new THREE.BoxGeometry(0.42, 0.62, 0.42), new THREE.MeshStandardMaterial({ color: 0x23272b, roughness: 0.8 }), -0.25, 1.28, 0);
  add(new THREE.SphereGeometry(0.16, 12, 10), new THREE.MeshStandardMaterial({ color: 0xe8e8e8, roughness: 0.3 }), -0.12, 1.72, 0);
  return { group: grp, lean, dispose: () => disp.forEach((d) => d.dispose()) };
}
