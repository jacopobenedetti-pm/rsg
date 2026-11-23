/**
 * Vista 3D: soggettiva del motociclista (con rollio in piega e beccheggio in frenata), inseguimento e drone.
 * Il faro anabbagliante è una luce con maschera di taglio che ruota con la moto: in piega lascia in ombra
 * l'interno della curva (Tesi Progettazione, Tav. 08).
 */
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import type { SimResult } from '../scene/simulate';
import { frameAt, sprayFootprint } from '../scene/simulate';
import { sampleMotion } from '../scene/world';
import type { SimParams } from '../scene/types';
import { type Clock, useClockTime } from './clock';
import { buildStatic, makeEgoBike, makeVehicle, headlightCookie, type Static3D, type VehicleMesh } from './pov/build3d';
import { G, deg } from '../physics/units';

type CamMode = 'soggettiva' | 'inseguimento' | 'drone';

class Engine {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(72, 16 / 10, 0.05, 2500);
  hemi = new THREE.HemisphereLight(0xdfeaf5, 0x5b5a4e, 1.1);
  sun = new THREE.DirectionalLight(0xffffff, 1.6);
  head = new THREE.SpotLight(0xfff4dc, 0, 140, 0.55, 0.5, 1.7);
  cookie = headlightCookie();
  lampLights: THREE.PointLight[] = [];
  stat: Static3D | null = null;
  actors = new Map<string, VehicleMesh[]>();
  ego = makeEgoBike();
  rain: THREE.LineSegments | null = null;
  sprays = new Map<string, THREE.Mesh>();
  sunDisc: THREE.Mesh | null = null;
  sim: SimResult | null = null;
  params: SimParams | null = null;
  mode: CamMode = 'soggettiva';

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.shadowMap.enabled = true;
    this.camera.rotation.order = 'YXZ';
    this.sun.position.set(-120, 220, 80);
    this.scene.add(this.hemi, this.sun, this.ego.group);
    this.head.map = this.cookie;
    this.head.castShadow = true;
    this.head.shadow.mapSize.set(256, 256);
    this.scene.add(this.head, this.head.target);
  }

  setSim(sim: SimResult, params: SimParams) {
    const rebuild = !this.sim || this.sim.world !== sim.world || this.params?.night !== params.night || this.params?.wet !== params.wet;
    this.sim = sim;
    this.params = params;
    if (!rebuild) return;
    if (this.stat) {
      this.scene.remove(this.stat.group);
      this.stat.dispose();
    }
    for (const list of this.actors.values())
      for (const v of list) {
        this.scene.remove(v.group);
        v.dispose();
      }
    this.actors.clear();
    for (const m of this.sprays.values()) {
      this.scene.remove(m);
      m.geometry.dispose();
    }
    this.sprays.clear();
    if (this.sunDisc) {
      this.scene.remove(this.sunDisc);
      this.sunDisc.geometry.dispose();
      this.sunDisc = null;
    }
    for (const l of this.lampLights) this.scene.remove(l);
    this.lampLights = [];
    if (this.rain) {
      this.scene.remove(this.rain);
      this.rain.geometry.dispose();
      this.rain = null;
    }

    const world = sim.world;
    const urban = world.spec.roads.some((r) => r.style === 'urbano');
    this.stat = buildStatic(world, { night: params.night, wet: params.wet });
    this.scene.add(this.stat.group);
    for (const a of world.spec.actors) {
      const st = world.actorState(a, 0);
      const list = st.bodies.map((b) => makeVehicle(a.kind, a.color, b.part));
      list.forEach((v) => this.scene.add(v.group));
      this.actors.set(a.id, list);
      if (a.spray && params.wet) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0xdfe6ea, transparent: true, opacity: 0.38, depthWrite: false }));
        this.scene.add(m);
        this.sprays.set(a.id, m);
      }
    }
    // sole basso: dietro la moto (chi arriva di fronte è abbagliato) o davanti (abbaglia il motociclista)
    const sunMode = world.spec.env?.sun;
    const eg = world.roads.get(world.spec.ego.road)!.pose(world.spec.ego.s0, 0);
    if (sunMode && !params.night) {
      const dir = sunMode === 'basso-dietro' ? -1 : 1;
      this.sun.position.set(eg.x + dir * Math.cos(eg.th) * 300, 28, -(eg.y + dir * Math.sin(eg.th) * 300));
      this.sun.target.position.set(eg.x, 0, -eg.y);
      this.scene.add(this.sun.target);
      if (sunMode === 'basso-fronte') {
        this.sunDisc = new THREE.Mesh(new THREE.SphereGeometry(30, 16, 12), new THREE.MeshBasicMaterial({ color: 0xfff6d8, fog: false }));
        this.sunDisc.position.set(eg.x + Math.cos(eg.th) * 1500, 90, -(eg.y + Math.sin(eg.th) * 1500));
        this.scene.add(this.sunDisc);
      }
    } else {
      this.sun.position.set(-120, 220, 80);
      this.sun.target.position.set(0, 0, 0);
    }

    // ambiente
    const night = params.night;
    const rainy = params.wet;
    const sky = night ? new THREE.Color(0x05070b) : rainy ? new THREE.Color(0x9aa3aa) : new THREE.Color(0xb9d3ea);
    this.scene.background = sky;
    this.scene.fog = new THREE.Fog(sky, night ? 25 : rainy ? 40 : 150, night ? 220 : rainy ? 380 : 1400);
    this.hemi.intensity = night ? (urban ? 0.12 : 0.03) : rainy ? 0.9 : 1.1;
    this.sun.intensity = night ? 0 : rainy ? 0.5 : 1.8;
    this.head.intensity = night ? 4200 : 0;
    this.renderer.toneMappingExposure = night ? 1.25 : 1.0;
    if (night && urban && this.stat.lamps.length) {
      const ego0 = world.roads.get(world.spec.ego.road)!.point(world.spec.ego.s0 + 60, 0);
      const lamps = [...this.stat.lamps].sort((a, b) => a.distanceToSquared(new THREE.Vector3(ego0.x, 0, -ego0.y)) - b.distanceToSquared(new THREE.Vector3(ego0.x, 0, -ego0.y))).slice(0, 12);
      for (const p of lamps) {
        const l = new THREE.PointLight(0xffd9a0, 900, 30, 1.8);
        l.position.copy(p);
        this.scene.add(l);
        this.lampLights.push(l);
      }
    }
    if (rainy) {
      const n = 2500;
      const pos = new Float32Array(n * 6);
      for (let i = 0; i < n; i++) {
        const x = (Math.random() - 0.5) * 60;
        const y = Math.random() * 20;
        const z = (Math.random() - 0.5) * 60;
        pos.set([x, y, z, x + 0.05, y - 0.6, z], i * 6);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      this.rain = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: night ? 0x6a7580 : 0xd8dde2, transparent: true, opacity: 0.45 }));
      this.scene.add(this.rain);
    }
  }

  resize(w: number, h: number) {
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  render(t: number) {
    const sim = this.sim;
    const params = this.params;
    if (!sim || !params || !this.stat) return;
    const world = sim.world;
    const gz = this.stat.groundZ;
    const blink = Math.floor(t * 3) % 2 === 0;

    for (const a of world.spec.actors) {
      const list = this.actors.get(a.id);
      if (!list) continue;
      const st = world.actorState(a, t);
      const prev = sampleMotion(a.motion, Math.max(0, t - 0.2));
      const braking = st.v < prev.v - 0.15 || (st.v < 0.05 && a.motion.length > 2 && a.motion[0].v > 0);
      st.bodies.forEach((b, i) => {
        const v = list[i];
        if (!v) return;
        v.group.position.set(b.x, gz(b), -b.y);
        v.group.rotation.set(0, b.th, 0);
        const lightsOn = a.lights || params.night;
        if (v.head) v.head.emissive.setHex(lightsOn ? 0xfff2d0 : 0x000000);
        if (v.tail) v.tail.emissive.setHex(braking ? 0xff1a1a : lightsOn ? 0x6a0000 : 0x000000);
        const ind = a.indicator && t >= a.indicator.from && (a.indicator.to === undefined || t <= a.indicator.to) && blink;
        if (v.indL) v.indL.emissive.setHex(ind && a.indicator!.side === 'left' ? 0xffa000 : 0x000000);
        if (v.indR) v.indR.emissive.setHex(ind && a.indicator!.side === 'right' ? 0xffa000 : 0x000000);
        if (v.door) v.door.rotation.y = -st.door;
      });
      const spray = this.sprays.get(a.id);
      if (spray) {
        const sp = sprayFootprint(world, a, t);
        const c = sp.poly.reduce((acc, p) => ({ x: acc.x + p.x / 4, y: acc.y + p.y / 4 }), { x: 0, y: 0 });
        const L = Math.hypot(sp.poly[0].x - sp.poly[3].x, sp.poly[0].y - sp.poly[3].y);
        const Wd = Math.hypot(sp.poly[0].x - sp.poly[1].x, sp.poly[0].y - sp.poly[1].y);
        const last = st.bodies[st.bodies.length - 1];
        spray.visible = sp.v > 8;
        spray.position.set(c.x, gz(c) + 1.6, -c.y);
        spray.rotation.set(0, last.th, 0);
        spray.scale.set(L, 3.2, Wd);
      }
    }

    const f = frameAt(sim, t);
    const cos = Math.cos(f.th);
    const sin = Math.sin(f.th);
    const right = new THREE.Vector3(sin, 0, cos); // destra in coordinate three: (sin th, 0, cos th)
    const fwd = new THREE.Vector3(cos, 0, -sin);
    const base = new THREE.Vector3(f.x, f.z, -f.y);
    const fallen = f.phase === 'scivolata' || f.phase === 'urto';

    this.ego.group.position.copy(base);
    this.ego.group.rotation.set(0, f.th, 0);
    this.ego.lean.rotation.x = -f.lean;
    this.ego.group.visible = this.mode !== 'soggettiva';

    // faro: posizione sul cupolino, taglio che ruota con il rollio
    const hl = base.clone().addScaledVector(fwd, 0.9).addScaledVector(right, -0.9 * Math.sin(f.lean)).add(new THREE.Vector3(0, 0.9 * Math.cos(f.lean), 0));
    this.head.position.copy(hl);
    this.head.target.position.copy(base.clone().addScaledVector(fwd, 60));
    this.head.shadow.camera.up.set(-Math.sin(f.lean) * right.x, Math.cos(f.lean), -Math.sin(f.lean) * right.z);
    this.head.target.updateMatrixWorld();

    const cam = this.camera;
    if (this.mode === 'soggettiva') {
      const h = fallen ? 0.5 : 1.25;
      const lean = f.lean;
      const eye = base.clone().addScaledVector(right, -h * Math.sin(lean)).add(new THREE.Vector3(0, h * Math.cos(lean) + 0.05, 0));
      cam.position.copy(eye);
      // beccheggio: pendenza della strada + affondamento in frenata
      const ahead = frameAt(sim, Math.min(t + 0.4, sim.frames[sim.frames.length - 1].t));
      const dist = Math.hypot(ahead.x - f.x, ahead.y - f.y);
      const grade = dist > 0.5 ? Math.atan2(ahead.z - f.z, dist) : 0;
      cam.rotation.set(grade - 0.03 - 0.045 * (f.a / G), f.th - Math.PI / 2, lean);
      cam.fov = 72;
    } else if (this.mode === 'inseguimento') {
      cam.position.copy(base.clone().addScaledVector(fwd, -7).add(new THREE.Vector3(0, 2.6, 0)));
      cam.up.set(0, 1, 0);
      cam.lookAt(base.clone().addScaledVector(fwd, 12).add(new THREE.Vector3(0, 0.8, 0)));
      cam.fov = 60;
    } else {
      cam.position.copy(base.clone().addScaledVector(fwd, -24).add(new THREE.Vector3(0, 32, 0)));
      cam.up.set(0, 1, 0);
      cam.lookAt(base.clone().addScaledVector(fwd, 22));
      cam.fov = 55;
    }
    cam.updateProjectionMatrix();

    if (this.rain) {
      this.rain.position.set(cam.position.x, cam.position.y - 6, cam.position.z);
      const off = (t * 14) % 20;
      this.rain.position.y = cam.position.y - 6 - off + 10;
    }

    this.renderer.render(this.scene, cam);
  }

  dispose() {
    this.stat?.dispose();
    for (const list of this.actors.values()) list.forEach((v) => v.dispose());
    this.ego.dispose();
    this.cookie.dispose();
    this.renderer.dispose();
  }
}

interface Props {
  sim: SimResult;
  clock: Clock;
  params: SimParams;
}

export function PovView({ sim, clock, params }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const [mode, setMode] = useState<CamMode>('soggettiva');
  const [error, setError] = useState<string | null>(null);
  const t = useClockTime(clock);

  useEffect(() => {
    if (!canvasRef.current) return;
    let engine: Engine;
    try {
      engine = new Engine(canvasRef.current);
    } catch {
      setError('Il browser non supporta WebGL: la vista 3D non è disponibile.');
      return;
    }
    engineRef.current = engine;
    const ro = new ResizeObserver(() => {
      const r = boxRef.current?.getBoundingClientRect();
      if (r && r.width > 0) {
        engine.resize(r.width, r.height);
        engine.render(clock.t);
      }
    });
    if (boxRef.current) ro.observe(boxRef.current);
    return () => {
      ro.disconnect();
      engine.dispose();
      engineRef.current = null;
    };
  }, [clock]);

  useEffect(() => {
    const e = engineRef.current;
    if (!e) return;
    e.setSim(sim, params);
    e.render(clock.t);
  }, [sim, params, clock]);

  useEffect(() => {
    const e = engineRef.current;
    if (!e) return;
    e.mode = mode;
    e.render(t);
  }, [t, mode]);

  const f = frameAt(sim, t);
  const note = [...(sim.world.spec.notes ?? [])].reverse().find((n) => n.t <= t && t - n.t < 3.5);
  const ev = [...sim.events].reverse().find((e) => e.t <= t && t - e.t < 2.5 && e.kind !== 'nota');

  return (
    <div className="viewport" ref={boxRef}>
      <div className="view-tabs">
        <div className="seg" role="group" aria-label="Punto di vista 3D">
          {(['soggettiva', 'inseguimento', 'drone'] as CamMode[]).map((m) => (
            <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)}>
              {m === 'soggettiva' ? 'Soggettiva' : m === 'inseguimento' ? 'Inseguimento' : 'Drone'}
            </button>
          ))}
        </div>
      </div>
      {error ? <p style={{ color: '#fff', padding: '3rem 1rem' }}>{error}</p> : <canvas ref={canvasRef} aria-label="Vista tridimensionale della scena" />}
      {(note || ev) && (
        <div className="caption">
          {ev ? <strong>{ev.label}</strong> : note?.text}
        </div>
      )}
      <div className="hud">
        <div className="hud-box">
          <span className="hud-phase">{f.phase}</span>
          <span className="hud-big">{(f.v * 3.6).toFixed(0)} km/h</span>
          <span>
            piega <span className="num">{Math.abs(deg(f.lean)).toFixed(0)}°</span> · decelerazione <span className="num">{(f.a / G).toFixed(2)} g</span>
          </span>
        </div>
        <FrictionCircle fx={f.fx} fy={f.fy} mu={f.mu} braking={f.a > 0.1} />
      </div>
    </div>
  );
}

/** cerchio di aderenza: la moto è dentro finché il punto resta nel cerchio dell'aderenza disponibile */
function FrictionCircle({ fx, fy, mu, braking }: { fx: number; fy: number; mu: number; braking: boolean }) {
  const R = 30;
  const scale = R / 1.0;
  const x = Math.min(1.3, fy) * scale;
  const y = Math.min(1.3, braking ? fx : 0) * scale;
  const out = Math.hypot(fy, braking ? fx : 0) > mu + 1e-3;
  return (
    <div className="hud-box" style={{ justifyItems: 'center' }}>
      <svg width={2 * R + 16} height={2 * R + 16} viewBox={`${-R - 8} ${-R - 8} ${2 * R + 16} ${2 * R + 16}`} aria-label="Cerchio di aderenza">
        <circle r={R} fill="none" stroke="#ffffff55" strokeDasharray="2 3" />
        <circle r={mu * scale} fill="#ffffff14" stroke={out ? '#ff5a4e' : '#38d17a'} strokeWidth={1.5} />
        <line x1={-R} x2={R} y1={0} y2={0} stroke="#ffffff33" />
        <line y1={-R} y2={R} x1={0} x2={0} stroke="#ffffff33" />
        <circle cx={x} cy={y} r={4} fill={out ? '#ff5a4e' : '#f2b632'} stroke="#000" />
      </svg>
      <span className="num" style={{ fontSize: '0.7rem' }}>
        μ disp. {mu.toFixed(2)} · impegnata {Math.hypot(fy, braking ? fx : 0).toFixed(2)}
      </span>
    </div>
  );
}
