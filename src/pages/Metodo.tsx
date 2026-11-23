import { CONTEXTS, ENV_FACTORS, INFRA_FACTORS, NATURES, OP_FACTORS, riskClass } from '../data/taxonomy';
import { SCENARIOS } from '../data/scenari';
import { href } from '../router';

export function Metodo() {
  const cells = [5, 4, 3, 2, 1].map((P) => [1, 2, 3, 4, 5].map((G) => ({ P, G, n: SCENARIOS.filter((s) => s.rischio.P === P && s.rischio.G === G) })));
  return (
    <div className="page">
      <header className="stack">
        <span className="eyebrow">Metodo</span>
        <h1>Come sono organizzati gli scenari</h1>
        <div className="prose">
          <p>
            Ogni situazione di pericolo è descritta su tre assi indipendenti: il contesto in cui avviene, le cause che la scatenano e le condizioni
            ambientali che la aggravano. Le cause sono divise tra infrastruttura e condizioni di esercizio: quando nessuna delle due da sola basterebbe a
            generare il pericolo, lo scenario è combinato.
          </p>
          <p>
            Il rischio è stimato con l’impostazione dell’analisi di rischio adottata nella tesi sulla manutenzione: R = P · G, dove la probabilità
            dipende da diffusione e localizzazione della causa, flussi e condizioni al contorno, e la gravità da velocità d’esercizio,
            caratteristiche della causa e margini della strada. Le stime sono qualitative (scala 1-5) e servono a ordinare le priorità.
          </p>
        </div>
      </header>

      <section className="grid-3">
        <div className="panel stack">
          <h3>Contesti</h3>
          {CONTEXTS.map((c) => (
            <div key={c.id}>
              <strong>{c.nome}.</strong> <span className="small muted">{c.descrizione}</span>
            </div>
          ))}
        </div>
        <div className="panel stack">
          <h3>Cause infrastrutturali</h3>
          {INFRA_FACTORS.map((c) => (
            <div key={c.id}>
              <strong>{c.nome}.</strong> <span className="small muted">{c.descrizione}</span>
            </div>
          ))}
        </div>
        <div className="panel stack">
          <h3>Cause d’esercizio e aggravanti</h3>
          {OP_FACTORS.map((c) => (
            <div key={c.id}>
              <strong>{c.nome}.</strong> <span className="small muted">{c.descrizione}</span>
            </div>
          ))}
          <div className="small muted">Aggravanti ambientali: {ENV_FACTORS.map((e) => e.nome.toLowerCase()).join(', ')}.</div>
        </div>
      </section>

      <section className="panel stack">
        <h2>Natura degli scenari</h2>
        <div className="grid-3">
          {NATURES.map((n) => (
            <div key={n.id} className="stack" style={{ gap: '0.2rem' }}>
              <span className={`chip chip-nature-${n.id}`} style={{ justifySelf: 'start' }}>
                {n.nome}
              </span>
              <span className="small">{n.descrizione}</span>
              <span className="small muted">{SCENARIOS.filter((s) => s.natura === n.id).length} scenari</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel stack">
        <h2>Matrice del rischio P × G</h2>
        <p className="small muted">Ogni cella elenca gli scenari con quella combinazione di probabilità e gravità.</p>
        <div className="table-wrap">
          <table className="matrix" style={{ minWidth: 640 }}>
            <thead>
              <tr>
                <th>Probabilità ↓ · Gravità →</th>
                {[1, 2, 3, 4, 5].map((g) => (
                  <th key={g}>G {g}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cells.map((row) => (
                <tr key={row[0].P}>
                  <th scope="row">P {row[0].P}</th>
                  {row.map((c) => {
                    const r = riskClass(c.P, c.G);
                    return (
                      <td key={c.G} style={{ background: `color-mix(in srgb, var(--status-${['good', 'warning', 'serious', 'critical'][r.livello - 1]}) 22%, transparent)`, verticalAlign: 'top' }}>
                        <div className="row" style={{ justifyContent: 'center', gap: 4 }}>
                          {c.n.map((s) => (
                            <a key={s.id} href={href.scenario(s.id)} className="chip" title={s.titolo} style={{ fontSize: '0.72rem', padding: '0 0.35rem' }}>
                              {s.id}
                            </a>
                          ))}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel stack">
        <h2>Simulazioni</h2>
        <div className="prose small">
          <p>
            Le scene sono descritte in un unico modello (strade con ascissa curvilinea, sezioni trasversali, arredo, ammaloramenti, veicoli con leggi
            del moto) da cui derivano la vista dall’alto e quella 3D. La moto è simulata a passi di 1/100 s: il pericolo viene percepito solo
            quando è una minaccia e la linea di vista dall’occhio del pilota è libera da ostacoli, edifici, veicoli e dal profilo altimetrico; dopo il
            tempo di reazione inizia la frenata, limitata dall’ellisse di aderenza. Se l’aderenza trasversale richiesta supera quella disponibile la
            moto scivola; se supera la piega accettata dal pilota la traiettoria si allarga. Dopo una caduta moto e pilota scivolano fino all’arresto
            o all’urto con barriere, pali e veicoli.
          </p>
          <p>
            Di notte, fuori dai centri abitati, sono visibili solo i veicoli con le luci accese e gli oggetti nel fascio dell’anabbagliante, che in
            piega lascia in ombra l’interno della curva. I modelli sono volutamente semplici e verificati sui valori numerici delle tesi
            (<code>npm test</code>): servono a confrontare situazioni e a mostrare i meccanismi, non a ricostruire incidenti.
          </p>
        </div>
      </section>
    </div>
  );
}
