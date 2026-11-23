import { DISTRESSES } from '../data/distresses';
import { SCENARIOS } from '../data/scenari';
import { href } from '../router';

const FUNZ: Record<string, string> = { aderenza: 'Aderenza', regolarità: 'Regolarità', portanza: 'Portanza' };

export function Ammaloramenti() {
  return (
    <div className="page">
      <header className="stack">
        <span className="eyebrow">Stato della pavimentazione</span>
        <h1>Gli ammaloramenti letti dal punto di vista della moto</h1>
        <div className="prose">
          <p>
            Il catalogo riprende i circa venti degradi comuni ai cataloghi CNR, SETRA, RDDHD e SHRP, sintetizzati nella tesi sulla programmazione
            della manutenzione. Per ciascuno si indica la caratteristica funzionale compromessa (aderenza, regolarità, portanza) e l’effetto
            specifico sul motoveicolo, che a differenza dell’autovettura poggia su due impronte e si inclina in curva.
          </p>
          <p>
            La soglia di degrado fisico non coincide con la soglia di rischio: per la moto molti degradi diventano critici ben prima di raggiungere
            la severità massima dei cataloghi. Da qui il criterio di programmazione degli interventi basato su R = P · G.
          </p>
        </div>
      </header>
      <div className="cards">
        {DISTRESSES.map((d) => {
          const related = SCENARIOS.filter((s) => s.ammaloramenti?.includes(d.id));
          return (
            <article key={d.id} className="card" style={{ borderTop: `3px solid var(--status-${['good', 'good', 'warning', 'serious', 'critical'][d.gravitaMoto - 1]})` }}>
              <div className="row">
                <span className="chip chip-code">{d.id}</span>
                {d.funzione.map((f) => (
                  <span key={f} className="chip">
                    {FUNZ[f]}
                  </span>
                ))}
                <span className="chip" title="Gravità per il motoveicolo, scala 1-5">
                  gravità moto {d.gravitaMoto}/5
                </span>
              </div>
              <h3>{d.nome}</h3>
              <p className="small muted">{d.descrizione}</p>
              <p className="sintesi">{d.effettoMoto}</p>
              {related.length > 0 && (
                <div className="row small">
                  <span className="muted">Scenari:</span>
                  {related.map((s) => (
                    <a key={s.id} className="chip" href={href.scenario(s.id)}>
                      {s.id}
                    </a>
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </div>
      <p className="small muted">Fonte: tesi sull’analisi del degrado delle sovrastrutture stradali per la programmazione degli interventi finalizzati alla sicurezza dell’esercizio, §III.2 e Cap. IV.</p>
    </div>
  );
}
