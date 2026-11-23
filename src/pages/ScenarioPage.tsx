import { useEffect } from 'react';
import { scenarioById, SCENARIOS } from '../data/scenari';
import { SCENES } from '../scene/presets';
import { href } from '../router';
import { FuoriNormaChip, NatureChip, RiskBadge, contextName, envName, infraName, opName } from '../components/Badges';
import { SimulationPanel } from '../views/SimulationPanel';
import { distressById } from '../data/distresses';
import { PRINCIPLES } from './principles';
import { levelLabel } from '../data/taxonomy';

const SRC = { TM: 'Tesi sul degrado delle sovrastrutture', TP: 'Tesi sui criteri progettuali per il motoveicolo' } as const;

export function ScenarioPage({ id }: { id: string }) {
  const s = scenarioById(id);
  useEffect(() => {
    if (s) document.title = `${s.id} ${s.titolo} · Atlante Pericoli Moto`;
    return () => {
      document.title = 'Atlante Pericoli Moto';
    };
  }, [s]);
  if (!s) {
    return (
      <div className="page">
        <h1>Scenario non trovato</h1>
        <p>
          Il codice «{id}» non corrisponde a nessuno scenario. <a href={href.catalogo}>Torna al catalogo</a>.
        </p>
      </div>
    );
  }
  const preset = SCENES[s.id];
  const idx = SCENARIOS.findIndex((x) => x.id === s.id);
  const prev = SCENARIOS[idx - 1];
  const next = SCENARIOS[idx + 1];

  return (
    <div className="page">
      <nav className="row small" aria-label="Percorso">
        <a href={href.catalogo}>Catalogo</a>
        <span className="muted">/</span>
        <span className="muted">{contextName(s.contesto)}</span>
        <span style={{ marginLeft: 'auto' }} className="row">
          {prev && <a href={href.scenario(prev.id)}>← {prev.id}</a>}
          {next && <a href={href.scenario(next.id)}>{next.id} →</a>}
        </span>
      </nav>

      <header className="scn-head">
        <div className="row">
          <span className="chip chip-code">{s.id}</span>
          <span className="chip">{contextName(s.contesto)}</span>
          <NatureChip natura={s.natura} />
          <RiskBadge P={s.rischio.P} G={s.rischio.G} long />
          {s.fuoriNorma && <FuoriNormaChip />}
        </div>
        <h1>{s.titolo}</h1>
        <p className="prose" style={{ fontSize: '1.08rem' }}>
          {s.sintesi}
        </p>
        <div className="row small">
          <span className="muted">Cause:</span>
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
          {s.ambiente?.map((f) => (
            <span key={f} className="chip">
              {envName(f)}
            </span>
          ))}
        </div>
        {s.fuoriNorma && (
          <div className="fuori-norma">
            <strong>Condotta fuori norma: {s.fuoriNorma.condotta}</strong>
            <span className="small">{s.fuoriNorma.nota} Lo scenario quantifica il rischio della condotta: non è un’indicazione di guida.</span>
          </div>
        )}
      </header>

      {preset ? (
        <SimulationPanel preset={preset} />
      ) : (
        <div className="panel stack">
          <h3>Simulazione non ancora disponibile</h3>
          <p className="small muted">
            La scena dinamica di questo scenario è in preparazione. I principi fisici che lo governano si possono esplorare nei calcolatori dei
            fondamenti indicati più sotto.
          </p>
        </div>
      )}

      <section className="analysis" aria-label="Analisi dello scenario">
        <div className="panel">
          <h3>Dinamica</h3>
          <p>{s.dinamica}</p>
        </div>
        {s.interazione && (
          <div className="panel">
            <h3>Perché è la combinazione a generare il pericolo</h3>
            <p>{s.interazione}</p>
          </div>
        )}
        {s.causeInfrastruttura.length > 0 && (
          <div className="panel">
            <h3>Cause legate all’infrastruttura</h3>
            <ul className="clean">
              {s.causeInfrastruttura.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        )}
        {s.causeEsercizio.length > 0 && (
          <div className="panel">
            <h3>Cause legate all’esercizio</h3>
            <ul className="clean">
              {s.causeEsercizio.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="panel">
          <h3>Segnali premonitori</h3>
          <ul className="clean">
            {s.segnali.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
        <div className="panel">
          <h3>Condotta del motociclista</h3>
          <ul className="clean">
            {s.strategia.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
        <div className="panel">
          <h3>Contromisure per gestore e progettista</h3>
          <ul className="clean">
            {s.contromisure.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
        <div className="panel stack">
          <h3>Esito e rischio</h3>
          <p>{s.esito}</p>
          <p className="small muted">
            Probabilità {levelLabel(s.rischio.P)} ({s.rischio.P}/5) × gravità {levelLabel(s.rischio.G)} ({s.rischio.G}/5): stima qualitativa secondo
            l’impostazione R = P · G.
          </p>
        </div>
        <div className="panel stack">
          <h3>Fondamenti e riferimenti</h3>
          <div className="row">
            {s.principi.map((p) => (
              <a key={p} className="chip" href={href.fondamenti(p)}>
                {PRINCIPLES[p]?.titolo ?? p}
              </a>
            ))}
          </div>
          {s.ammaloramenti?.length ? (
            <p className="small">
              Ammaloramenti correlati:{' '}
              {s.ammaloramenti.map((d, i) => (
                <span key={d}>
                  {i ? ', ' : ''}
                  <a href={href.ammaloramenti}>
                    {d} {distressById(d).nome.toLowerCase()}
                  </a>
                </span>
              ))}
            </p>
          ) : null}
          {s.fonti?.length ? (
            <ul className="clean small">
              {s.fonti.map((f) => (
                <li key={f.rif}>
                  {SRC[f.doc]}, {f.rif}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>
    </div>
  );
}
