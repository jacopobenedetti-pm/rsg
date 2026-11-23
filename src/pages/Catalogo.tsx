import { useMemo, useState } from 'react';
import { SCENARIOS } from '../data/scenari';
import { CONTEXTS, INFRA_FACTORS, NATURES, OP_FACTORS, riskClass, type ContextId, type InfraFactor, type Nature, type OpFactor } from '../data/taxonomy';
import { SCENES } from '../scene/presets';
import { href } from '../router';
import { FuoriNormaChip, NatureChip, RiskBadge, infraName, opName } from '../components/Badges';
import type { Scenario } from '../data/types';

type Factor = { kind: 'infra'; id: InfraFactor } | { kind: 'op'; id: OpFactor } | { kind: 'fn' };

function readFilters() {
  try {
    return JSON.parse(localStorage.getItem('catalogo-filtri') ?? 'null') as { ctx: ContextId | 'tutti'; nat: Nature | 'tutte'; sim: boolean } | null;
  } catch {
    return null;
  }
}

export function Catalogo() {
  const saved = readFilters();
  const [ctx, setCtx] = useState<ContextId | 'tutti'>(saved?.ctx ?? 'tutti');
  const [nat, setNat] = useState<Nature | 'tutte'>(saved?.nat ?? 'tutte');
  const [factor, setFactor] = useState<Factor | null>(null);
  const [onlySim, setOnlySim] = useState(saved?.sim ?? false);
  const [sort, setSort] = useState<'codice' | 'rischio'>('codice');

  const persist = (next: { ctx?: ContextId | 'tutti'; nat?: Nature | 'tutte'; sim?: boolean }) => {
    try {
      localStorage.setItem('catalogo-filtri', JSON.stringify({ ctx, nat, sim: onlySim, ...next }));
    } catch {
      /* preferenza non salvata */
    }
  };

  const matches = (s: Scenario, f: Factor | null) => {
    if (!f) return true;
    if (f.kind === 'fn') return !!s.fuoriNorma;
    return f.kind === 'infra' ? s.infrastruttura.includes(f.id) : s.esercizio.includes(f.id);
  };

  const list = useMemo(() => {
    const l = SCENARIOS.filter(
      (s) => (ctx === 'tutti' || s.contesto === ctx) && (nat === 'tutte' || s.natura === nat) && matches(s, factor) && (!onlySim || SCENES[s.id]),
    );
    if (sort === 'rischio') l.sort((a, b) => b.rischio.P * b.rischio.G - a.rischio.P * a.rischio.G);
    return l;
  }, [ctx, nat, factor, onlySim, sort]);

  const count = (c: ContextId, f: Factor) => SCENARIOS.filter((s) => s.contesto === c && matches(s, f)).length;
  const maxCell = Math.max(
    ...CONTEXTS.flatMap((c) => [...INFRA_FACTORS.map((f) => count(c.id, { kind: 'infra', id: f.id })), ...OP_FACTORS.map((f) => count(c.id, { kind: 'op', id: f.id }))]),
  );
  const same = (a: Factor | null, b: Factor) => !!a && a.kind === b.kind && (a.kind === 'fn' || (b.kind !== 'fn' && a.id === b.id));
  const pick = (c: ContextId, f: Factor) => {
    if (ctx === c && same(factor, f)) {
      setFactor(null);
      setCtx('tutti');
      return;
    }
    setCtx(c);
    setFactor(f);
  };
  const nSim = Object.keys(SCENES).length;

  return (
    <div className="page">
      <header className="stack">
        <span className="eyebrow">Atlante dei pericoli per il motociclista</span>
        <h1>Dove, perché e come la strada mette in pericolo chi va in moto</h1>
        <div className="prose">
          <p>
            {SCENARIOS.length} scenari organizzati per contesto (urbano, extraurbano, autostradale) e per causa scatenante: l’infrastruttura in sé
            (visibilità, stato della pavimentazione, geometria d’asse, arredo e margini), le condizioni di esercizio (traffico, rallentamenti, mezzi
            pesanti) e la loro combinazione. Ogni scheda parte dalla dinamica del veicolo e dal contatto pneumatico-strada; {nSim} scenari hanno una
            simulazione con vista dall’alto e in soggettiva.
          </p>
        </div>
      </header>

      <section className="panel stack" aria-labelledby="matrice-t">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2 id="matrice-t">Matrice contesto × causa</h2>
          <span className="small muted">Selezionare una cella per filtrare il catalogo</span>
        </div>
        <div className="matrix-wrap">
          <table className="matrix">
            <thead>
              <tr>
                <th rowSpan={2}>Contesto</th>
                <th className="group" colSpan={4}>
                  Infrastruttura
                </th>
                <th className="group" colSpan={3}>
                  Esercizio
                </th>
                <th className="group" rowSpan={2}>
                  Fuori norma
                </th>
                <th className="group" rowSpan={2}>
                  Totale
                </th>
              </tr>
              <tr>
                {INFRA_FACTORS.map((f) => (
                  <th key={f.id} title={f.descrizione}>
                    {f.nome}
                  </th>
                ))}
                {OP_FACTORS.map((f) => (
                  <th key={f.id} title={f.descrizione}>
                    {f.nome}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CONTEXTS.map((c) => (
                <tr key={c.id}>
                  <th scope="row">{c.nome}</th>
                  {[...INFRA_FACTORS.map((f) => ({ kind: 'infra', id: f.id }) as Factor), ...OP_FACTORS.map((f) => ({ kind: 'op', id: f.id }) as Factor), { kind: 'fn' } as Factor].map((f, i) => {
                    const n = count(c.id, f);
                    const pressed = ctx === c.id && same(factor, f);
                    return (
                      <td key={i}>
                        <button
                          type="button"
                          className="cell-btn"
                          style={{ ['--w' as string]: f.kind === 'fn' ? 0.15 : (n / maxCell) * 0.85 }}
                          aria-pressed={pressed}
                          aria-label={`${c.nome}: ${n} scenari`}
                          onClick={() => pick(c.id, f)}
                        >
                          {n}
                        </button>
                      </td>
                    );
                  })}
                  <td className="num">{SCENARIOS.filter((s) => s.contesto === c.id).length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="stack" aria-label="Elenco degli scenari">
        <div className="filters">
          <div className="seg" role="group" aria-label="Contesto">
            {(['tutti', ...CONTEXTS.map((c) => c.id)] as (ContextId | 'tutti')[]).map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={ctx === c}
                onClick={() => {
                  setCtx(c);
                  persist({ ctx: c });
                }}
              >
                {c === 'tutti' ? 'Tutti i contesti' : CONTEXTS.find((x) => x.id === c)!.nome}
              </button>
            ))}
          </div>
          <div className="seg" role="group" aria-label="Natura">
            {(['tutte', ...NATURES.map((n) => n.id)] as (Nature | 'tutte')[]).map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={nat === n}
                onClick={() => {
                  setNat(n);
                  persist({ nat: n });
                }}
              >
                {n === 'tutte' ? 'Ogni natura' : NATURES.find((x) => x.id === n)!.nome}
              </button>
            ))}
          </div>
          <label className="toggle" htmlFor="only-sim">
            <input
              id="only-sim"
              type="checkbox"
              checked={onlySim}
              onChange={(e) => {
                setOnlySim(e.target.checked);
                persist({ sim: e.target.checked });
              }}
            />
            Solo con simulazione
          </label>
          <div className="seg" role="group" aria-label="Ordinamento">
            <button type="button" aria-pressed={sort === 'codice'} onClick={() => setSort('codice')}>
              Per codice
            </button>
            <button type="button" aria-pressed={sort === 'rischio'} onClick={() => setSort('rischio')}>
              Per rischio
            </button>
          </div>
          {factor && (
            <button type="button" className="chip chip-warn" onClick={() => setFactor(null)}>
              {factor.kind === 'fn' ? 'Fuori norma' : factor.kind === 'infra' ? infraName(factor.id) : opName(factor.id)} ✕
            </button>
          )}
        </div>

        {CONTEXTS.filter((c) => ctx === 'tutti' || ctx === c.id).map((c) => {
          const items = list.filter((s) => s.contesto === c.id);
          if (!items.length) return null;
          return (
            <div key={c.id} className="stack">
              <div className="section-title">
                <h2>{c.nome}</h2>
                <span className="count">{items.length}</span>
              </div>
              <p className="small muted prose">{c.descrizione}</p>
              <div className="cards">
                {items.map((s) => (
                  <ScenarioCard key={s.id} s={s} />
                ))}
              </div>
            </div>
          );
        })}
        {!list.length && <p className="muted">Nessuno scenario corrisponde ai filtri selezionati.</p>}
      </section>
    </div>
  );
}

function ScenarioCard({ s }: { s: Scenario }) {
  const r = riskClass(s.rischio.P, s.rischio.G);
  return (
    <a className="card" href={href.scenario(s.id)} style={{ borderTop: `3px solid var(--status-${['good', 'warning', 'serious', 'critical'][r.livello - 1]})` }}>
      <div className="row">
        <span className="chip chip-code">{s.id}</span>
        <NatureChip natura={s.natura} />
        {s.fuoriNorma && <FuoriNormaChip />}
      </div>
      <h3>{s.titolo}</h3>
      <p className="sintesi">{s.sintesi}</p>
      <div className="card-foot">
        <RiskBadge P={s.rischio.P} G={s.rischio.G} />
        {s.infrastruttura.map((f) => (
          <span key={f} className="chip">
            {infraName(f)}
          </span>
        ))}
        {s.esercizio.map((f) => (
          <span key={f} className="chip">
            {opName(f)}
          </span>
        ))}
        {SCENES[s.id] && <span className="sim-flag">▶ simulazione</span>}
      </div>
    </a>
  );
}
