import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { PRINCIPLES, PRINCIPLE_ORDER } from './principles';
import { href } from '../router';
import { SCENARIOS } from '../data/scenari';
import { LineChart } from '../components/LineChart';
import { G, deg, kmh, rad } from '../physics/units';
import { SURFACES, normFl, normFt, waterFilmFriction, criticalWaterDepth, aquaplaningSpeed, NORM_FT_ADEGUATO_MOTO } from '../physics/friction';
import { loadTransfer, maxDeceleration, normReactionTime, rearShareAtLimit, stoppieLimit, stoppingDistance, MOTO_RIF } from '../physics/braking';
import { effectiveLean, leanOnBankedRoad, remainingLongitudinal } from '../physics/cornering';
import { clearanceForSight, crestSightDistance, curveSightDistance, headlightLateralSpread, headlightReachInCurve, sagHeadlightDistance } from '../physics/visibility';
import { BARRIER_CLASSES, HIC_MISURATI, HIC_SCALE, LC_MOTO_KJ, speedAfterSlide, tangentExit } from '../physics/impact';
import { rutProbability } from '../physics/rutting';
import { A_AUTO_NORMA, A_MOTO, DELTA_V_TABLE, speedAfter } from '../physics/speedProfile';
import type { PrincipleId } from '../data/taxonomy';

/* ----------------------------------------------------------------------------- controlli */

function Slider({ id, label, value, set, min, max, step, fmt }: { id: string; label: string; value: number; set: (v: number) => void; min: number; max: number; step: number; fmt: (v: number) => string }) {
  return (
    <label className="ctl" htmlFor={id}>
      <span className="ctl-head">
        <span>{label}</span>
        <span className="num">{fmt(value)}</span>
      </span>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => set(Number(e.target.value))} />
    </label>
  );
}

function Out({ label, value, tone }: { label: string; value: string; tone?: 'ok' | 'bad' }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd style={{ color: tone === 'bad' ? 'var(--danger)' : tone === 'ok' ? 'var(--ok)' : undefined }}>{value}</dd>
    </div>
  );
}

function Section({ id, children, formula, source }: { id: PrincipleId; children: ReactNode; formula?: string; source?: string }) {
  const related = SCENARIOS.filter((s) => s.principi.includes(id));
  return (
    <section id={`p-${id}`} className="panel stack" style={{ scrollMarginTop: 80 }}>
      <div className="stack" style={{ gap: '0.3rem' }}>
        <span className="eyebrow">Fisica della moto</span>
        <h2>{PRINCIPLES[id].titolo}</h2>
      </div>
      <div className="insella">
        <span className="eyebrow">In sella</span>
        <p>{PRINCIPLES[id].inSella}</p>
      </div>
      {formula && <div className="formula">{formula}</div>}
      {children}
      {source && <p className="small muted">Fonte: {source}</p>}
      {related.length > 0 && (
        <div className="row small">
          <span className="muted">Scenari:</span>
          {related.map((s) => (
            <a key={s.id} className="chip" href={href.scenario(s.id)} title={s.titolo}>
              {s.id}
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

const range = (a: number, b: number, n: number) => Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n);

/* ----------------------------------------------------------------------------- sezioni */

function Aderenza() {
  const [wet, setWet] = useState(true);
  const list = Object.values(SURFACES).sort((a, b) => (wet ? b.wet - a.wet : b.dry - a.dry));
  return (
    <Section id="aderenza" source="Tesi Manutenzione §III.1 e §IV.1.1; valori indicativi di letteratura per confronti relativi.">
      <div className="prose">
        <p>
          L’aderenza nasce da due meccanismi: l’adesione molecolare tra gomma e inerti, governata dalla microtessitura, e l’isteresi,
          cioè l’energia dissipata dalla gomma che si deforma sulle asperità della macrotessitura. Su asciutto conta soprattutto la
          microtessitura; su bagnato e a velocità elevata la macrotessitura serve a drenare il velo d’acqua dall’impronta.
        </p>
        <p>
          La moto poggia su due impronte di pochi centimetri quadrati e in curva lavora sulla spalla dello pneumatico: ogni discontinuità di
          aderenza sotto una delle due ruote si traduce direttamente in una perdita di controllo, senza la ridondanza delle quattro ruote.
        </p>
      </div>
      <div className="row">
        <div className="seg" role="group" aria-label="Condizione del fondo">
          <button type="button" aria-pressed={!wet} onClick={() => setWet(false)}>
            Asciutto
          </button>
          <button type="button" aria-pressed={wet} onClick={() => setWet(true)}>
            Bagnato
          </button>
        </div>
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Superficie</th>
              <th>μ indicativo</th>
              <th style={{ width: '40%' }}>Aderenza disponibile</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {list.map((s) => {
              const v = wet ? s.wet : s.dry;
              return (
                <tr key={s.id}>
                  <td>{s.nome}</td>
                  <td className="n">{v.toFixed(2)}</td>
                  <td>
                    <div style={{ height: 10, borderRadius: 4, background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
                      <div style={{ width: `${(v / 1) * 100}%`, height: '100%', borderRadius: 4, background: v < 0.3 ? 'var(--status-critical)' : v < 0.5 ? 'var(--status-serious)' : 'var(--series-1)' }} />
                    </div>
                  </td>
                  <td className="small muted">{s.nota}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

function Frenata() {
  const [a, setA] = useState(0.6);
  const [mu, setMu] = useState(0.3);
  const lt = loadTransfer(a);
  const series = useMemo(() => {
    const xs = range(0, 1, 50);
    return [
      { id: 'f', label: 'Ruota anteriore', color: 'var(--series-1)', points: xs.map((x) => [x, loadTransfer(x).front * 100] as [number, number]) },
      { id: 'r', label: 'Ruota posteriore', color: 'var(--series-2)', points: xs.map((x) => [x, loadTransfer(x).rear * 100] as [number, number]) },
    ];
  }, []);
  return (
    <Section id="frenata" formula="N_F = m g (b/p + a·h/p)    N_R = m g ((p − b)/p − a·h/p)    con h = 0,70 m, p = 1,40 m, b = 0,70 m" source="Tesi Progettazione, Tav. 02.">
      <div className="prose">
        <p>
          Il baricentro alto rispetto al passo produce un forte trasferimento di carico sull’anteriore: la ripartizione ottimale della frenata
          cambia con l’aderenza. Sul bagnato (μ = 0,3) rinunciare al freno posteriore costa il 35% della forza frenante, sull’asciutto (μ = 0,85)
          solo il 7%. La moto richiede una strategia di frenata diversa per ogni condizione, e gli spazi di frenata dipendono dalla capacità del
          pilota di percepirla.
        </p>
      </div>
      <div className="calc">
        <div className="stack">
          <Slider id="fr-a" label="Decelerazione" value={a} set={setA} min={0} max={1} step={0.01} fmt={(v) => `${v.toFixed(2)} g`} />
          <Slider id="fr-mu" label="Aderenza della pavimentazione μ" value={mu} set={setMu} min={0.1} max={1} step={0.01} fmt={(v) => v.toFixed(2)} />
          <dl className="kv">
            <Out label="Carico anteriore" value={`${(lt.front * 100).toFixed(0)}%`} />
            <Out label="Carico posteriore" value={`${(lt.rear * 100).toFixed(0)}%`} />
            <Out label="Quota del posteriore alla massima frenata" value={`${(rearShareAtLimit(mu) * 100).toFixed(0)}%`} />
            <Out label="Massima decelerazione, due freni" value={`${maxDeceleration(mu, 'combinata').toFixed(2)} g`} />
            <Out label="Solo freno anteriore" value={`${maxDeceleration(mu, 'anteriore').toFixed(2)} g`} />
            <Out label="Solo freno posteriore" value={`${maxDeceleration(mu, 'posteriore').toFixed(2)} g`} />
            <Out label="Limite di ribaltamento in avanti" value={`${stoppieLimit(MOTO_RIF).toFixed(2)} g`} />
          </dl>
        </div>
        <LineChart title="Ripartizione del carico tra le ruote in funzione della decelerazione" series={series} xLabel="decelerazione" xUnit="g" yLabel="carico sulla ruota" yUnit="%" xDomain={[0, 1]} yDomain={[0, 100]} cursor={a} digits={2} />
      </div>
    </Section>
  );
}

function Arresto() {
  const [v, setV] = useState(90);
  const [tau, setTau] = useState(1.0);
  const [f, setF] = useState(0.6);
  const [i, setI] = useState(0);
  const [aut, setAut] = useState(false);
  const moto = stoppingDistance({ v: kmh(v), tau, f, grade: i, full: true });
  const tn = normReactionTime(v);
  const norm = stoppingDistance({ v: kmh(v), tau: tn, f: normFl(v, aut), grade: i });
  const series = useMemo(() => {
    const xs = range(20, aut ? 160 : 130, 28);
    return [
      { id: 'm', label: `Moto: τ ${tau.toFixed(1)} s, f ${f.toFixed(2)}`, color: 'var(--series-1)', points: xs.map((x) => [x, stoppingDistance({ v: kmh(x), tau, f, grade: i, full: true }).total] as [number, number]) },
      { id: 'n', label: 'Norma: τ = 2,8 − 0,01 V, f di normativa', color: 'var(--series-2)', points: xs.map((x) => [x, stoppingDistance({ v: kmh(x), tau: normReactionTime(x), f: normFl(x, aut), grade: i }).total] as [number, number]) },
    ];
  }, [tau, f, i, aut]);
  return (
    <Section id="arresto" formula="d = v·τ + v² / (2 g (f ± i))    (con resistenza aerodinamica e masse rotanti: integrazione numerica, Tav. 06)" source="Tesi Progettazione, Tav. 06; DM 5/11/2001; Tesi Manutenzione nota 27.">
      <div className="prose">
        <p>
          Lo spazio d’arresto somma il tratto percorso durante il tempo di percezione e reazione e lo spazio di frenatura, che cresce con il
          quadrato della velocità. La norma lo calcola con coefficienti di aderenza longitudinale cautelativi e un tempo psicotecnico che decresce
          con la velocità; per la moto la tesi mostra spazi maggiori a parità di condizioni, per la minore inerzia rispetto alla resistenza
          aerodinamica e per la difficoltà di impegnare al limite il freno anteriore.
        </p>
      </div>
      <div className="calc">
        <div className="stack">
          <Slider id="ar-v" label="Velocità" value={v} set={setV} min={20} max={200} step={5} fmt={(x) => `${x} km/h`} />
          <Slider id="ar-t" label="Tempo di percezione e reazione" value={tau} set={setTau} min={0.5} max={2.5} step={0.1} fmt={(x) => `${x.toFixed(1)} s`} />
          <Slider id="ar-f" label="Aderenza impegnata in frenata" value={f} set={setF} min={0.2} max={1} step={0.01} fmt={(x) => x.toFixed(2)} />
          <Slider id="ar-i" label="Pendenza longitudinale" value={i} set={setI} min={-8} max={8} step={0.5} fmt={(x) => `${x > 0 ? '+' : ''}${x}%`} />
          <label className="toggle" htmlFor="ar-aut">
            <input id="ar-aut" type="checkbox" checked={aut} onChange={(e) => setAut(e.target.checked)} />
            Coefficienti di normativa per autostrade
          </label>
          <dl className="kv">
            <Out label="Percorso nella reazione" value={`${moto.reaction.toFixed(1)} m`} />
            <Out label="Spazio di frenatura" value={`${moto.braking.toFixed(1)} m`} />
            <Out label="Spazio d’arresto moto" value={`${moto.total.toFixed(1)} m`} />
            <Out label={`Norma (τ ${tn.toFixed(2)} s, f ${normFl(v, aut).toFixed(2)})`} value={`${norm.total.toFixed(1)} m`} />
          </dl>
        </div>
        <LineChart title="Spazio d'arresto in funzione della velocità" series={series} xLabel="velocità" xUnit="km/h" yLabel="spazio d'arresto" yUnit="m" cursor={v} digits={0} />
      </div>
    </Section>
  );
}

function Percezione() {
  const [v, setV] = useState(60);
  const thr = 0.003; // rad/s
  const wM = 0.8;
  const wA = 1.8;
  const dDet = (w: number, vk: number) => Math.sqrt((w * kmh(vk)) / thr);
  const series = useMemo(() => {
    const xs = range(20, 130, 22);
    return [
      { id: 'm', label: 'Moto (larghezza 0,8 m)', color: 'var(--series-1)', points: xs.map((x) => [x, dDet(wM, x)] as [number, number]) },
      { id: 'a', label: 'Autovettura (larghezza 1,8 m)', color: 'var(--series-2)', points: xs.map((x) => [x, dDet(wA, x)] as [number, number]) },
    ];
  }, []);
  return (
    <Section id="percezione" formula="dθ/dt ≈ w · v / d²   →   distanza alla quale l'avvicinamento diventa percepibile: d = √(w · v / soglia)" source="DM 5/11/2001 per τ; soglia di percezione dell'espansione angolare ≈ 0,003 rad/s, valore indicativo di letteratura.">
      <div className="prose">
        <p>
          Chi deve giudicare se c’è tempo per svoltare o immettersi stima la velocità del veicolo che arriva dall’ingrandimento della sua
          sagoma. La moto è stretta: la sua immagine cresce più lentamente e la sensazione di avvicinamento arriva più tardi, a distanze minori.
          Il risultato è una sistematica sottostima della velocità della moto (scenari U-01, U-18, E-13).
        </p>
      </div>
      <div className="calc">
        <div className="stack">
          <Slider id="pe-v" label="Velocità del veicolo che arriva" value={v} set={setV} min={20} max={130} step={5} fmt={(x) => `${x} km/h`} />
          <dl className="kv">
            <Out label="Avvicinamento percepito: moto" value={`${dDet(wM, v).toFixed(0)} m (${(dDet(wM, v) / kmh(v)).toFixed(1)} s)`} />
            <Out label="Avvicinamento percepito: auto" value={`${dDet(wA, v).toFixed(0)} m (${(dDet(wA, v) / kmh(v)).toFixed(1)} s)`} />
            <Out label="Tempo psicotecnico di norma" value={`${normReactionTime(v).toFixed(2)} s`} />
          </dl>
        </div>
        <LineChart title="Distanza alla quale l'avvicinamento diventa percepibile" series={series} xLabel="velocità" xUnit="km/h" yLabel="distanza" yUnit="m" cursor={v} digits={0} />
      </div>
    </Section>
  );
}

function Piega() {
  const [v, setV] = useState(80);
  const [R, setR] = useState(150);
  const [q, setQ] = useState(5);
  const b = leanOnBankedRoad(kmh(v), R, q / 100);
  const phiT = effectiveLean(b.phi);
  const ftN = normFt(v);
  const series = useMemo(() => {
    const xs = range(20, 160, 28);
    return [60, 150, 400].map((r, k) => ({
      id: `r${r}`,
      label: `R = ${r} m`,
      color: `var(--series-${k + 1})`,
      points: xs.map((x) => [x, deg(Math.atan((kmh(x) ** 2) / (G * r)))] as [number, number]),
    }));
  }, []);
  return (
    <Section id="piega" formula="γ = α + φ = arctan(v²/gR)    tan φ = (v²/gR − tan α) / (1 + v²/gR · tan α)    φ_T = φ + arcsin(t·sin φ / (h − t))" source="Tesi Progettazione, Tav. 03 e 10.">
      <div className="prose">
        <p>
          La moto in curva si inclina finché la risultante di peso e forza centrifuga passa per il punto di contatto: l’angolo di rollio
          rispetto alla verticale dipende solo da velocità e raggio. La sopraelevazione riduce l’angolo rispetto al piano viabile e quindi
          l’aderenza trasversale impegnata. Il punto di contatto si sposta sulla spalla dello pneumatico e aumenta l’inclinazione effettiva.
          L’autovettura non si inclina: lo stesso raggio, dimensionato sulla sua aderenza, impegna la moto in modo diverso.
        </p>
      </div>
      <div className="calc">
        <div className="stack">
          <Slider id="pi-v" label="Velocità" value={v} set={setV} min={20} max={180} step={5} fmt={(x) => `${x} km/h`} />
          <Slider id="pi-r" label="Raggio della curva" value={R} set={setR} min={20} max={1000} step={5} fmt={(x) => `${x} m`} />
          <Slider id="pi-q" label="Sopraelevazione" value={q} set={setQ} min={-2.5} max={7} step={0.5} fmt={(x) => `${x}%`} />
          <dl className="kv">
            <Out label="Rollio rispetto alla verticale γ" value={`${deg(b.gamma).toFixed(1)}°`} />
            <Out label="Rispetto al piano viabile φ" value={`${deg(b.phi).toFixed(1)}°`} />
            <Out label="Effettiva con pneumatico φ_T" value={`${deg(phiT).toFixed(1)}°`} />
            <Out label="Aderenza trasversale impegnata" value={b.ft.toFixed(3)} tone={b.ft > ftN ? 'bad' : 'ok'} />
            <Out label="f_t massima di norma a questa velocità" value={ftN.toFixed(3)} />
          </dl>
          <p className="small muted">La tesi propone, per garantire alla moto lo stesso rischio dell’auto, coefficienti trasversali ridotti: {NORM_FT_ADEGUATO_MOTO.map(([vv, f]) => `${f} a ${vv} km/h`).join(', ')} (Tav. 17).</p>
        </div>
        <LineChart title="Angolo di piega in funzione della velocità" series={series} xLabel="velocità" xUnit="km/h" yLabel="piega" yUnit="°" cursor={v} yDomain={[0, 60]} digits={0} />
      </div>
    </Section>
  );
}

function Ellisse() {
  const [mu, setMu] = useState(0.9);
  const [lean, setLean] = useState(30);
  const fy = Math.tan(rad(lean));
  const fx = remainingLongitudinal(fy, mu, mu);
  const R = 90;
  return (
    <Section id="ellisse" formula="x² / f_t² + y² / f_l² = 1    →    f_l,residua = f_l · √(1 − (f_t,impegnata / f_t)²)" source="Tesi Progettazione, Tav. 11, 14, 15.">
      <div className="prose">
        <p>
          L’aderenza disponibile è unica e va divisa tra direzione trasversale (curva) e longitudinale (frenata, accelerazione). In piega una
          parte è già impegnata: quella residua per frenare si riduce secondo l’ellisse di aderenza. Con μ = 0,9 a 30° di piega resta circa tre quarti
          della frenata possibile in rettilineo, a 40° poco più di un terzo; sul bagnato (μ = 0,65) già a 30° meno della metà. Per questo la frenata in curva (E-01, E-03, A-08) è così critica.
        </p>
      </div>
      <div className="calc">
        <div className="stack">
          <Slider id="el-mu" label="Aderenza disponibile μ" value={mu} set={setMu} min={0.2} max={1.1} step={0.01} fmt={(x) => x.toFixed(2)} />
          <Slider id="el-l" label="Angolo di piega" value={lean} set={setLean} min={0} max={50} step={1} fmt={(x) => `${x}°`} />
          <dl className="kv">
            <Out label="Aderenza trasversale impegnata" value={fy.toFixed(2)} tone={fy > mu ? 'bad' : undefined} />
            <Out label="Frenata ancora disponibile" value={fy > mu ? 'nessuna: scivolata' : `${fx.toFixed(2)} g`} tone={fy > mu ? 'bad' : undefined} />
            <Out label="Rispetto al rettilineo" value={fy > mu ? '0%' : `${((fx / mu) * 100).toFixed(0)}%`} />
          </dl>
        </div>
        <svg viewBox="-120 -120 240 240" style={{ maxWidth: 320, width: '100%', justifySelf: 'center' }} role="img" aria-label="Ellisse di aderenza">
          <circle r={R} fill="var(--surface-2)" stroke="var(--line)" />
          <circle r={R * mu} fill="none" stroke="var(--series-1)" strokeWidth={2} />
          <line x1={-110} x2={110} y1={0} y2={0} stroke="var(--line)" />
          <line y1={-110} y2={110} x1={0} x2={0} stroke="var(--line)" />
          <text x={112} y={14} textAnchor="end" style={{ fill: 'var(--muted)', fontSize: 10 }}>
            trasversale
          </text>
          <text x={4} y={-104} style={{ fill: 'var(--muted)', fontSize: 10 }}>
            frenata
          </text>
          <line x1={Math.min(fy, 1.2) * R} x2={Math.min(fy, 1.2) * R} y1={0} y2={-fx * R} stroke="var(--accent)" strokeWidth={3} />
          <line x1={0} x2={Math.min(fy, 1.2) * R} y1={0} y2={0} stroke={fy > mu ? 'var(--danger)' : 'var(--series-2)'} strokeWidth={3} />
          <circle cx={Math.min(fy, 1.2) * R} cy={-fx * R} r={5} fill="var(--accent)" stroke="var(--surface)" strokeWidth={2} />
        </svg>
      </div>
    </Section>
  );
}

function VisCurva() {
  const [R, setR] = useState(120);
  const [mA, setMA] = useState(2.75);
  const [mM, setMM] = useState(2.0);
  const [v, setV] = useState(70);
  const DA = curveSightDistance(R, mA);
  const DM = curveSightDistance(R, mM);
  const ds = stoppingDistance({ v: kmh(v), tau: 1, f: 0.6 }).total;
  const series = useMemo(() => {
    const xs = range(40, 600, 28);
    return [
      { id: 'a', label: `Auto al centro corsia (m = ${mA} m)`, color: 'var(--series-2)', points: xs.map((x) => [x, curveSightDistance(x, mA)] as [number, number]) },
      { id: 'm', label: `Moto verso il ciglio interno (m = ${mM} m)`, color: 'var(--series-1)', points: xs.map((x) => [x, curveSightDistance(x, mM)] as [number, number]) },
    ];
  }, [mA, mM]);
  return (
    <Section id="visibilita-curva" formula="D = 2R · arccos(1 − m/R)    m = R (1 − cos(D / 2R))" source="Tesi Progettazione, Tav. 06-07.">
      <div className="prose">
        <p>
          In curva la visuale è limitata dall’ostacolo sul lato interno (scarpata, siepe, muro, barriera centrale). La norma verifica la
          visibilità con l’occhio dell’automobilista al centro della corsia; il motociclista in curva percorre una traiettoria più vicina al ciglio
          interno e in piega abbassa il punto di vista: la sua distanza m dall’ostacolo è minore, e con essa la visuale libera.
        </p>
      </div>
      <div className="calc">
        <div className="stack">
          <Slider id="vc-r" label="Raggio" value={R} set={setR} min={30} max={1000} step={5} fmt={(x) => `${x} m`} />
          <Slider id="vc-ma" label="Distanza dall'ostacolo, auto" value={mA} set={setMA} min={0.5} max={8} step={0.05} fmt={(x) => `${x.toFixed(2)} m`} />
          <Slider id="vc-mm" label="Distanza dall'ostacolo, moto" value={mM} set={setMM} min={0.5} max={8} step={0.05} fmt={(x) => `${x.toFixed(2)} m`} />
          <Slider id="vc-v" label="Velocità (per lo spazio d'arresto)" value={v} set={setV} min={30} max={150} step={5} fmt={(x) => `${x} km/h`} />
          <dl className="kv">
            <Out label="Visuale auto" value={`${DA.toFixed(0)} m`} tone={DA < ds ? 'bad' : 'ok'} />
            <Out label="Visuale moto" value={`${DM.toFixed(0)} m`} tone={DM < ds ? 'bad' : 'ok'} />
            <Out label="Spazio d'arresto (τ 1 s, 0,6 g)" value={`${ds.toFixed(0)} m`} />
            <Out label="Franco necessario" value={`${clearanceForSight(R, ds).toFixed(2)} m`} />
          </dl>
        </div>
        <LineChart title="Distanza di visibilità in curva in funzione del raggio" series={series} xLabel="raggio" xUnit="m" yLabel="visuale libera" yUnit="m" cursor={R} digits={0} bands={[{ y0: 0, y1: ds, color: 'var(--status-critical)' }]} />
      </div>
    </Section>
  );
}

function VisVerticale() {
  const [Rv, setRv] = useState(600);
  const [h1, setH1] = useState(1.3);
  const [lean, setLean] = useState(0);
  const [h2, setH2] = useState(0.1);
  const he = h1 * Math.cos(rad(lean));
  const D = crestSightDistance(Rv, he, h2);
  const Dsag = sagHeadlightDistance(Rv, 0.8 * Math.cos(rad(lean)), rad(1));
  const series = useMemo(() => {
    const xs = range(200, 6000, 29);
    return [
      { id: 'b', label: 'Ostacolo basso (0,1 m)', color: 'var(--series-1)', points: xs.map((x) => [x, crestSightDistance(x, he, 0.1)] as [number, number]) },
      { id: 'c', label: 'Tetto di un’auto (1,4 m)', color: 'var(--series-2)', points: xs.map((x) => [x, crestSightDistance(x, he, 1.4)] as [number, number]) },
    ];
  }, [he]);
  return (
    <Section id="visibilita-verticale" formula="dosso: D = √(2 Rv) (√h1 + √h2)    raccordo concavo di notte: Rv = D² / (2 (h_f + D sin θ))" source="Tesi Progettazione, Tav. 07.">
      <div className="prose">
        <p>
          Sui raccordi convessi la visuale dipende dall’altezza dell’occhio e dell’ostacolo. In rettilineo il motociclista siede più in alto
          dell’automobilista, ma in piega il punto di vista si abbassa di h(1 − cos γ): sui raccordi in curva la visuale si riduce. Di notte, nei
          raccordi concavi, la visuale è quella illuminata dal faro.
        </p>
      </div>
      <div className="calc">
        <div className="stack">
          <Slider id="vv-r" label="Raggio verticale" value={Rv} set={setRv} min={200} max={8000} step={50} fmt={(x) => `${x} m`} />
          <Slider id="vv-h1" label="Altezza dell'occhio (in verticale)" value={h1} set={setH1} min={1.0} max={1.6} step={0.05} fmt={(x) => `${x.toFixed(2)} m`} />
          <Slider id="vv-l" label="Piega" value={lean} set={setLean} min={0} max={45} step={1} fmt={(x) => `${x}°`} />
          <Slider id="vv-h2" label="Altezza dell'ostacolo" value={h2} set={setH2} min={0.05} max={1.5} step={0.05} fmt={(x) => `${x.toFixed(2)} m`} />
          <dl className="kv">
            <Out label="Occhio effettivo" value={`${he.toFixed(2)} m`} />
            <Out label="Visuale sul dosso" value={`${D.toFixed(0)} m`} />
            <Out label="Visuale notturna sul concavo" value={`${Dsag.toFixed(0)} m`} />
          </dl>
        </div>
        <LineChart title="Visuale su un raccordo convesso" series={series} xLabel="raggio verticale" xUnit="m" yLabel="visuale" yUnit="m" cursor={Rv} digits={0} />
      </div>
    </Section>
  );
}

function Notte() {
  const [R, setR] = useState(100);
  const [e, setE] = useState(1.75);
  const [v, setV] = useState(70);
  const lean = Math.atan((kmh(v) ** 2) / (G * R));
  const reach = headlightReachInCurve(R, e);
  const ds = stoppingDistance({ v: kmh(v), tau: 1, f: 0.6 }).total;
  const spread = headlightLateralSpread(0.8, rad(40), lean);
  const series = useMemo(() => {
    const xs = range(30, 800, 30);
    return [{ id: 'r', label: 'Portata utile del faro in curva', color: 'var(--series-1)', points: xs.map((x) => [x, headlightReachInCurve(x, e)] as [number, number]) }];
  }, [e]);
  return (
    <Section id="notte" formula="portata lungo la traiettoria ≈ √(2 R e + e²)    illuminazione laterale: x_int = h cos φ · tan(β − φ), x_ext = h cos φ · tan(β + φ)" source="Tesi Progettazione, Tav. 08.">
      <div className="prose">
        <p>
          Il faro è solidale alla moto: punta lungo la tangente e in piega ruota con il veicolo. Il fascio esce presto dalla corsia verso
          l’esterno della curva, mentre l’interno resta al buio; la distribuzione della potenza luminosa sul piano viabile diventa asimmetrica.
          La situazione peggiora quando curva e raccordo verticale coesistono.
        </p>
      </div>
      <div className="calc">
        <div className="stack">
          <Slider id="no-r" label="Raggio" value={R} set={setR} min={30} max={800} step={5} fmt={(x) => `${x} m`} />
          <Slider id="no-e" label="Margine laterale fino al ciglio esterno" value={e} set={setE} min={0.5} max={5} step={0.05} fmt={(x) => `${x.toFixed(2)} m`} />
          <Slider id="no-v" label="Velocità" value={v} set={setV} min={30} max={130} step={5} fmt={(x) => `${x} km/h`} />
          <dl className="kv">
            <Out label="Portata utile del fascio" value={`${reach.toFixed(0)} m`} tone={reach < ds ? 'bad' : 'ok'} />
            <Out label="Spazio d'arresto" value={`${ds.toFixed(0)} m`} />
            <Out label="Piega" value={`${deg(lean).toFixed(0)}°`} />
            <Out label="Illuminazione laterale interna / esterna" value={`${spread.xInt.toFixed(2)} / ${Number.isFinite(spread.xExt) ? spread.xExt.toFixed(2) : '∞'} m`} />
          </dl>
          <p className="small muted">Illuminazione laterale calcolata con faro a 0,8 m e semiapertura β = 40°: in rettilineo {headlightLateralSpread(0.8, rad(40), 0).xInt.toFixed(2)} m per lato.</p>
        </div>
        <LineChart title="Portata utile del faro in funzione del raggio" series={series} xLabel="raggio" xUnit="m" yLabel="distanza" yUnit="m" cursor={R} digits={0} bands={[{ y0: 0, y1: ds, color: 'var(--status-critical)' }]} />
      </div>
    </Section>
  );
}

function Aquaplaning() {
  const [v, setV] = useState(90);
  const [h, setH] = useState(6);
  const [tread, setTread] = useState<'battistrada' | 'liscio'>('battistrada');
  const [rh, setRh] = useState(15);
  const [b, setB] = useState(0.4);
  const [sig, setSig] = useState(0.25);
  const fa = waterFilmFriction(v, h, tread);
  const rut = rutProbability({ hMm: rh, b, vKmh: v, sigma: sig, tread });
  const series = useMemo(() => {
    const xs = range(50, 160, 44);
    const depths = tread === 'battistrada' ? [1, 7, 12] : [0.5, 5.5, 12];
    return depths.map((d, k) => ({ id: `h${d}`, label: `velo ${d} mm`, color: `var(--series-${k + 1})`, points: xs.map((x) => [x, waterFilmFriction(x, d, tread)] as [number, number]) }));
  }, [tread]);
  return (
    <Section id="aquaplaning" formula="h_g(x) = h − (h/b²) x²    x_crit = b √((h − h_crit)/h)    P_h,l = ∫ f(x) dx tra ±x_crit    P = P_h,l · P_dl" source="Tesi Manutenzione, Cap. IV (Fig. IV.1-IV.2 da Ferrari-Giannini; modello di probabilità delle ormaie).">
      <div className="prose">
        <p>
          Il velo d’acqua agisce da lubrificante e riduce l’area di contatto: al crescere della velocità l’acqua non viene più espulsa
          dall’impronta e lo pneumatico galleggia (aderenza ≈ 0,04). Le ormaie raccolgono l’acqua proprio nelle tracce delle ruote: la
          probabilità di aquaplaning è la quota di traiettorie che attraversa la fascia in cui il velo supera l’altezza critica.
        </p>
      </div>
      <div className="calc">
        <div className="stack">
          <div className="seg" role="group" aria-label="Pneumatico">
            <button type="button" aria-pressed={tread === 'battistrada'} onClick={() => setTread('battistrada')}>
              Con battistrada
            </button>
            <button type="button" aria-pressed={tread === 'liscio'} onClick={() => setTread('liscio')}>
              Liscio
            </button>
          </div>
          <Slider id="aq-v" label="Velocità" value={v} set={setV} min={50} max={160} step={5} fmt={(x) => `${x} km/h`} />
          <Slider id="aq-h" label="Spessore del velo idrico" value={h} set={setH} min={0} max={15} step={0.5} fmt={(x) => `${x} mm`} />
          <dl className="kv">
            <Out label="Coefficiente di aderenza f_a" value={fa.toFixed(2)} tone={fa < 0.1 ? 'bad' : undefined} />
            <Out label="Altezza critica a questa velocità" value={`${criticalWaterDepth(v, tread).toFixed(1)} mm`} />
            <Out label="Velocità di innesco per questo velo" value={Number.isFinite(aquaplaningSpeed(h, tread)) ? `${aquaplaningSpeed(h, tread).toFixed(0)} km/h` : '—'} />
          </dl>
          <h3 style={{ fontSize: '1.05rem' }}>Ormaia piena d’acqua</h3>
          <Slider id="aq-rh" label="Profondità dell'ormaia h" value={rh} set={setRh} min={2} max={40} step={1} fmt={(x) => `${x} mm`} />
          <Slider id="aq-b" label="Semilarghezza b" value={b} set={setB} min={0.2} max={0.8} step={0.01} fmt={(x) => `${x.toFixed(2)} m`} />
          <Slider id="aq-s" label="Dispersione delle traiettorie σ" value={sig} set={setSig} min={0.1} max={0.6} step={0.01} fmt={(x) => `${x.toFixed(2)} m`} />
          <dl className="kv">
            <Out label="Fascia critica 2·x_crit" value={`${(2 * rut.xCrit * 100).toFixed(0)} cm`} />
            <Out label="Probabilità P_h,l" value={`${(rut.P * 100).toFixed(0)}%`} tone={rut.P > 0.3 ? 'bad' : undefined} />
          </dl>
        </div>
        <LineChart title="Aderenza in funzione della velocità per diversi spessori del velo idrico" series={series} xLabel="velocità" xUnit="km/h" yLabel="f_a" cursor={v} yDomain={[0, 0.45]} digits={2} />
      </div>
    </Section>
  );
}

function Impatto() {
  const [R, setR] = useState(60);
  const [b, setB] = useState(3);
  const [v, setV] = useState(60);
  const [mu, setMu] = useState(0.55);
  const ex = tangentExit(R, b);
  const vi = speedAfterSlide(kmh(v), mu, ex.length);
  const E = 0.5 * 85 * vi * vi;
  const Et = 0.5 * 85 * (vi * Math.sin(ex.theta)) ** 2;
  return (
    <Section id="impatto" formula="l = √(2Rb + b²)    θ = arccos(R / (R + b))    v_imp = √(v² − 2 μ g l)    L_c = ½ m (v sin θ)²" source="Tesi Progettazione, Tav. 14 e 18; Tesi Manutenzione §IV.2.2.">
      <div className="prose">
        <p>
          Dopo la perdita di aderenza moto e pilota proseguono lungo la tangente fino all’ostacolo esterno. Più il raggio è piccolo, più il
          tratto di dissipazione è breve e l’angolo d’impatto grande. Le barriere sono dimensionate per energie da 44 a 572 kJ, quella del
          motociclista è di circa {LC_MOTO_KJ} kJ: la barriera non si deforma e il corpo, scivolando sotto la lama, incontra i paletti.
        </p>
      </div>
      <div className="calc">
        <div className="stack">
          <Slider id="im-r" label="Raggio della curva" value={R} set={setR} min={20} max={600} step={5} fmt={(x) => `${x} m`} />
          <Slider id="im-b" label="Distanza della barriera dalla traiettoria" value={b} set={setB} min={0.5} max={10} step={0.1} fmt={(x) => `${x.toFixed(1)} m`} />
          <Slider id="im-v" label="Velocità alla perdita di aderenza" value={v} set={setV} min={20} max={160} step={5} fmt={(x) => `${x} km/h`} />
          <Slider id="im-mu" label="Attrito di strisciamento" value={mu} set={setMu} min={0.3} max={0.8} step={0.01} fmt={(x) => x.toFixed(2)} />
          <dl className="kv">
            <Out label="Tratto di scivolamento" value={`${ex.length.toFixed(1)} m`} />
            <Out label="Angolo d'impatto" value={`${deg(ex.theta).toFixed(1)}°`} />
            <Out label="Velocità d'impatto" value={`${(vi * 3.6).toFixed(0)} km/h`} tone={vi > 0.1 ? 'bad' : 'ok'} />
            <Out label="Energia del corpo (85 kg)" value={`${(E / 1000).toFixed(2)} kJ`} />
            <Out label="Componente trasversale L_c" value={`${(Et / 1000).toFixed(2)} kJ`} />
          </dl>
        </div>
        <div className="stack">
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Classe</th>
                  <th>Contenimento</th>
                  <th style={{ textAlign: 'right' }}>L_c</th>
                </tr>
              </thead>
              <tbody>
                {BARRIER_CLASSES.map((c) => (
                  <tr key={c.classe}>
                    <td>{c.classe}</td>
                    <td>{c.tipo}</td>
                    <td className="n">{c.Lc} kJ</td>
                  </tr>
                ))}
                <tr>
                  <td>moto</td>
                  <td>motociclista a terra</td>
                  <td className="n">≈ {LC_MOTO_KJ} kJ</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>HIC</th>
                  <th>Conseguenze</th>
                </tr>
              </thead>
              <tbody>
                {HIC_SCALE.map((h, i) => (
                  <tr key={i}>
                    <td className="num">{i === 0 ? `0-${h.max}` : Number.isFinite(h.max) ? `${HIC_SCALE[i - 1].max}-${h.max}` : `> ${HIC_SCALE[i - 1].max}`}</td>
                    <td>{h.esito}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="clean small">
            {HIC_MISURATI.map((h) => (
              <li key={h.elemento}>
                {h.elemento}: HIC <span className="num">{h.hic}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}

function Velocita() {
  const [v1, setV1] = useState(60);
  const [vp, setVp] = useState(90);
  const [L, setL] = useState(250);
  const vm = speedAfter(kmh(v1), L, A_MOTO) * 3.6;
  const va = Math.min(vp, speedAfter(kmh(v1), L, A_AUTO_NORMA) * 3.6);
  const series = useMemo(() => {
    const xs = range(0, 600, 40);
    return [
      { id: 'm', label: `Moto (a = ${A_MOTO} m/s²)`, color: 'var(--series-1)', points: xs.map((x) => [x, speedAfter(kmh(v1), x, A_MOTO) * 3.6] as [number, number]) },
      { id: 'a', label: `Norma (a = ${A_AUTO_NORMA} m/s², fino a V_p)`, color: 'var(--series-2)', points: xs.map((x) => [x, Math.min(vp, speedAfter(kmh(v1), x, A_AUTO_NORMA) * 3.6)] as [number, number]) },
    ];
  }, [v1, vp]);
  return (
    <Section id="velocita" formula="L = V1 (V2 − V1)/a + ½ (V2 − V1)²/a    a_A = 0,8 m/s² (norma)    a_M ≈ 2,0 m/s² (moto)" source="Tesi Progettazione, Tav. 09.">
      <div className="prose">
        <p>
          La norma costruisce il diagramma delle velocità con accelerazioni e decelerazioni di 0,8 m/s². La moto, grazie al rapporto peso/potenza,
          accelera molto di più: tra due curve raggiunge velocità ben superiori a quella di progetto, e con esse spazi d’arresto per cui la
          strada non è stata verificata.
        </p>
      </div>
      <div className="calc">
        <div className="stack">
          <Slider id="ve-v1" label="Velocità in uscita dalla prima curva" value={v1} set={setV1} min={30} max={120} step={5} fmt={(x) => `${x} km/h`} />
          <Slider id="ve-vp" label="Velocità di progetto del rettifilo" value={vp} set={setVp} min={40} max={140} step={5} fmt={(x) => `${x} km/h`} />
          <Slider id="ve-l" label="Lunghezza del rettifilo" value={L} set={setL} min={50} max={600} step={10} fmt={(x) => `${x} m`} />
          <dl className="kv">
            <Out label="Velocità della moto a fine rettifilo" value={`${vm.toFixed(0)} km/h`} />
            <Out label="Velocità secondo il diagramma" value={`${va.toFixed(0)} km/h`} />
            <Out label="Differenza" value={`+${((vm / va - 1) * 100).toFixed(0)}%`} tone="bad" />
          </dl>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Categoria</th>
                  <th>V progetto</th>
                  <th>ΔV% max</th>
                </tr>
              </thead>
              <tbody>
                {DELTA_V_TABLE.map((r) => (
                  <tr key={r.categoria}>
                    <td>{r.categoria}</td>
                    <td className="num">{r.intervallo}</td>
                    <td className="n">{r.dVmax}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <LineChart title="Velocità lungo un rettifilo tra due curve" series={series} xLabel="distanza" xUnit="m" yLabel="velocità" yUnit="km/h" cursor={L} digits={0} />
      </div>
    </Section>
  );
}

const SECTIONS: Record<PrincipleId, () => JSX.Element> = {
  aderenza: Aderenza,
  frenata: Frenata,
  arresto: Arresto,
  percezione: Percezione,
  piega: Piega,
  ellisse: Ellisse,
  'visibilita-curva': VisCurva,
  'visibilita-verticale': VisVerticale,
  notte: Notte,
  aquaplaning: Aquaplaning,
  impatto: Impatto,
  velocita: Velocita,
};

export function Fondamenti({ anchor }: { anchor?: string }) {
  useEffect(() => {
    if (anchor) document.getElementById(`p-${anchor}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [anchor]);
  return (
    <div className="page">
      <header className="stack">
        <span className="eyebrow">Fisica della moto</span>
        <h1>Perché la moto si comporta così</h1>
        <p className="prose">
          Aderenza, frenata, piega, visibilità: i principi da cui nascono tutte le situazioni di pericolo, ciascuno con un consiglio pratico e un
          calcolatore da provare. Le formule vengono dalle due tesi di riferimento; i valori di letteratura sono indicativi e servono a confrontare
          situazioni.
        </p>
        <nav className="toc" aria-label="Indice dei fondamenti">
          {PRINCIPLE_ORDER.map((p) => (
            <a key={p} className="chip" href={href.fondamenti(p)}>
              {PRINCIPLES[p].titolo}
            </a>
          ))}
        </nav>
      </header>
      {PRINCIPLE_ORDER.map((p) => {
        const C = SECTIONS[p];
        return <C key={p} />;
      })}
    </div>
  );
}
