import type { PrincipleId } from '../data/taxonomy';

export const PRINCIPLES: Record<PrincipleId, { titolo: string; breve: string }> = {
  aderenza: { titolo: 'Aderenza pneumatico-strada', breve: 'Adesione e isteresi, micro e macrotessitura, superfici e contaminanti.' },
  frenata: { titolo: 'Frenata e trasferimento di carico', breve: 'Ripartizione dei carichi, ruolo dei due freni, limite di ribaltamento.' },
  arresto: { titolo: 'Spazio d’arresto', breve: 'Tempo di reazione, decelerazione, pendenza; moto e autovettura a confronto.' },
  piega: { titolo: 'Equilibrio in curva e piega', breve: 'Angolo di rollio, sopraelevazione, larghezza dello pneumatico.' },
  ellisse: { titolo: 'Ellisse di aderenza', breve: 'Frenare in piega: aderenza longitudinale residua.' },
  'visibilita-curva': { titolo: 'Visibilità in curva', breve: 'Ostacoli laterali, posizione del motociclista, franco necessario.' },
  'visibilita-verticale': { titolo: 'Visibilità sui raccordi', breve: 'Dossi e raccordi concavi; abbassamento dell’occhio in piega.' },
  notte: { titolo: 'Faro in curva di notte', breve: 'Portata utile del fascio e rotazione del taglio con il rollio.' },
  aquaplaning: { titolo: 'Velo idrico, aquaplaning e ormaie', breve: 'Aderenza in funzione di velocità e spessore d’acqua; modello delle ormaie.' },
  impatto: { titolo: 'Scivolamento e impatto', breve: 'Uscita per la tangente, angolo e velocità d’impatto, barriere, HIC.' },
  velocita: { titolo: 'Diagramma delle velocità', breve: 'Accelerazione della moto e velocità oltre quella di progetto.' },
  percezione: { titolo: 'Percezione e reazione', breve: 'Tempo psicotecnico e sagoma della moto vista dagli altri.' },
};

export const PRINCIPLE_ORDER: PrincipleId[] = [
  'aderenza',
  'frenata',
  'arresto',
  'percezione',
  'piega',
  'ellisse',
  'visibilita-curva',
  'visibilita-verticale',
  'notte',
  'aquaplaning',
  'impatto',
  'velocita',
];
