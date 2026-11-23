import { CONTEXTS, ENV_FACTORS, INFRA_FACTORS, NATURES, OP_FACTORS, riskClass, type Nature } from '../data/taxonomy';

const name = (list: { id: string; nome: string }[], id: string) => list.find((x) => x.id === id)?.nome ?? id;

export const contextName = (id: string) => name(CONTEXTS, id);
export const infraName = (id: string) => name(INFRA_FACTORS, id);
export const opName = (id: string) => name(OP_FACTORS, id);
export const envName = (id: string) => name(ENV_FACTORS, id);
export const natureName = (id: string) => name(NATURES, id);

export function RiskBadge({ P, G, long = false }: { P: number; G: number; long?: boolean }) {
  const r = riskClass(P, G);
  return (
    <span className={`risk risk-${r.livello}`} title={`Probabilità ${P} × gravità ${G} = ${r.r}`}>
      {long ? `Rischio ${r.classe} · P${P} × G${G} = ${r.r}` : `R ${r.r} ${r.classe}`}
    </span>
  );
}

export function NatureChip({ natura }: { natura: Nature }) {
  return <span className={`chip chip-nature-${natura}`}>{natureName(natura)}</span>;
}

export function FuoriNormaChip() {
  return (
    <span className="chip chip-warn" title="Condotta non ammessa dal Codice della Strada, analizzata per quantificarne il rischio">
      ⚠ fuori norma
    </span>
  );
}
