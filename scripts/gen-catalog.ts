/**
 * Genera docs/catalogo-scenari.md dai dati dell'app (unica fonte di verità).
 * Uso: npm run catalog
 */
import { writeFileSync } from 'node:fs';
import { SCENARIOS } from '../src/data/scenari';
import {
  CONTEXTS,
  ENV_FACTORS,
  INFRA_FACTORS,
  NATURES,
  OP_FACTORS,
  levelLabel,
  riskClass,
} from '../src/data/taxonomy';
import type { Scenario } from '../src/data/types';

const name = <T extends { id: string; nome: string }>(list: T[], id: string) => list.find((x) => x.id === id)?.nome ?? id;
const PLURALE: Record<string, string> = { infrastruttura: 'infrastrutturali', esercizio: 'd\u2019esercizio', combinato: 'combinati' };

const out: string[] = [];
const p = (s = '') => out.push(s);

p('# Catalogo ragionato degli scenari di pericolo per il motociclista');
p();
p('> File generato da `npm run catalog` a partire da `src/data/scenari/*.ts` e `src/data/inSella.ts`. Non modificarlo a mano.');
p();
p('L\u2019app è pensata innanzitutto per i motociclisti: ogni scenario ha un consiglio «In sella» e una simulazione dinamica (vista dall\u2019alto e in soggettiva) in cui si possono cambiare velocità, distanze, pioggia, notte, ABS e, dove serve, il tipo di barriera sul margine.');
p();
p('## Criteri di classificazione');
p();
p('Ogni scenario è letto su tre assi indipendenti:');
p();
p('1. **Contesto** — ' + CONTEXTS.map((c) => `*${c.nome}*`).join(', ') + '.');
p('2. **Cause scatenanti**');
p('   - legate all’infrastruttura: ' + INFRA_FACTORS.map((f) => f.nome.toLowerCase()).join(', ') + ';');
p('   - legate alle condizioni di esercizio: ' + OP_FACTORS.map((f) => f.nome.toLowerCase()).join(', ') + ';');
p('   - da cui la **natura** dello scenario: ' + NATURES.map((n) => `*${n.nome.toLowerCase()}* (${n.descrizione.toLowerCase().replace(/\.$/, '')})`).join('; ') + '.');
p('3. **Aggravanti ambientali** — ' + ENV_FACTORS.map((f) => f.nome.toLowerCase()).join(', ') + '.');
p();
p('Gli scenari marcati **⚠ fuori norma** analizzano condotte non ammesse dal Codice della Strada (velocità oltre il limite, marcia tra le file, corsia d’emergenza, sorpassi vietati) per quantificarne il rischio, non per indicarle come condotte di guida.');
p();
p('La stima del rischio segue l’impostazione dell’analisi di rischio: **R = P · G**, con probabilità P e gravità G su scala 1-5.');
p();

// Matrice di sintesi
p('## Matrice di sintesi');
p();
p('| Codice | Scenario | Natura | Infrastruttura | Esercizio | Ambiente | P | G | R |');
p('|---|---|---|---|---|---|---|---|---|');
for (const s of SCENARIOS) {
  const r = riskClass(s.rischio.P, s.rischio.G);
  p(
    `| ${s.id} | ${s.titolo}${s.fuoriNorma ? ' ⚠' : ''} | ${name(NATURES, s.natura)} | ${s.infrastruttura
      .map((f) => name(INFRA_FACTORS, f))
      .join(', ') || '—'} | ${s.esercizio.map((f) => name(OP_FACTORS, f)).join(', ') || '—'} | ${(s.ambiente ?? [])
      .map((f) => name(ENV_FACTORS, f))
      .join(', ') || '—'} | ${s.rischio.P} | ${s.rischio.G} | ${r.r} ${r.classe} |`,
  );
}
p();

// Conteggi per contesto e natura
p('### Distribuzione');
p();
p('| Contesto | Infrastrutturali | D’esercizio | Combinati | Fuori norma | Totale |');
p('|---|---|---|---|---|---|');
for (const c of CONTEXTS) {
  const list = SCENARIOS.filter((s) => s.contesto === c.id);
  const n = (nat: string) => list.filter((s) => s.natura === nat).length;
  p(`| ${c.nome} | ${n('infrastruttura')} | ${n('esercizio')} | ${n('combinato')} | ${list.filter((s) => s.fuoriNorma).length} | ${list.length} |`);
}
p();

function scenarioBlock(s: Scenario) {
  const r = riskClass(s.rischio.P, s.rischio.G);
  p(`### ${s.id} · ${s.titolo}${s.fuoriNorma ? ' ⚠ fuori norma' : ''}`);
  p();
  p(
    `**Natura:** ${name(NATURES, s.natura)} · **Rischio:** P ${s.rischio.P} (${levelLabel(s.rischio.P)}) × G ${s.rischio.G} (${levelLabel(
      s.rischio.G,
    )}) = ${r.r}, ${r.classe}`,
  );
  p();
  p(s.sintesi);
  p();
  if (s.inSella) {
    p(`> **In sella.** ${s.inSella}`);
    p();
  }
  if (s.fuoriNorma) {
    p(`> ⚠ **${s.fuoriNorma.condotta}.** ${s.fuoriNorma.nota}`);
    p();
  }
  p(`**Dinamica.** ${s.dinamica}`);
  p();
  if (s.causeInfrastruttura.length) {
    p('**Cause infrastrutturali** (' + s.infrastruttura.map((f) => name(INFRA_FACTORS, f).toLowerCase()).join(', ') + ')');
    s.causeInfrastruttura.forEach((c) => p(`- ${c}`));
    p();
  }
  if (s.causeEsercizio.length) {
    p('**Cause d’esercizio** (' + s.esercizio.map((f) => name(OP_FACTORS, f).toLowerCase()).join(', ') + ')');
    s.causeEsercizio.forEach((c) => p(`- ${c}`));
    p();
  }
  if (s.interazione) {
    p(`**Combinazione.** ${s.interazione}`);
    p();
  }
  if (s.ambiente?.length) {
    p('**Aggravanti ambientali:** ' + s.ambiente.map((f) => name(ENV_FACTORS, f).toLowerCase()).join(', '));
    p();
  }
  p('**Segnali premonitori**');
  s.segnali.forEach((c) => p(`- ${c}`));
  p();
  p('**Condotta del motociclista**');
  s.strategia.forEach((c) => p(`- ${c}`));
  p();
  p('**Contromisure per gestore e progettista**');
  s.contromisure.forEach((c) => p(`- ${c}`));
  p();
  p(`**Esito tipico:** ${s.esito}`);
  if (s.ammaloramenti?.length) p(`  \n**Ammaloramenti correlati:** ${s.ammaloramenti.join(', ')}`);
  p();
}

for (const c of CONTEXTS) {
  p(`## Contesto ${c.nome.toLowerCase()}`);
  p();
  p(c.descrizione);
  p();
  for (const nat of NATURES) {
    const list = SCENARIOS.filter((s) => s.contesto === c.id && s.natura === nat.id);
    if (!list.length) continue;
    p(`### Scenari ${PLURALE[nat.id]}`);
    p();
    list.forEach((s) => p(`- [${s.id}](#${s.id.toLowerCase()}--${s.titolo.toLowerCase().replace(/[^a-z0-9àèéìòù ]/g, '').replace(/ /g, '-')}) ${s.titolo}${s.fuoriNorma ? ' ⚠' : ''}`));
    p();
  }
  for (const s of SCENARIOS.filter((x) => x.contesto === c.id)) scenarioBlock(s);
}

writeFileSync(new URL('../docs/catalogo-scenari.md', import.meta.url), out.join('\n'));
console.log(`docs/catalogo-scenari.md: ${SCENARIOS.length} scenari`);
