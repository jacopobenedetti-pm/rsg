import type { PrincipleId } from '../data/taxonomy';

export const PRINCIPLES: Record<PrincipleId, { titolo: string; breve: string; inSella: string }> = {
  aderenza: {
    titolo: 'Aderenza pneumatico-strada',
    breve: 'Adesione e isteresi, micro e macrotessitura, superfici e contaminanti.',
    inSella: 'Su vernice, metallo e lapidei bagnati hai meno della metà dell’aderenza: frena prima e passaci con la moto dritta.',
  },
  frenata: {
    titolo: 'Frenata e trasferimento di carico',
    breve: 'Ripartizione dei carichi, ruolo dei due freni, limite di ribaltamento.',
    inSella: 'Usa sempre entrambi i freni: sul bagnato il posteriore vale più di un terzo della frenata.',
  },
  arresto: {
    titolo: 'Spazio d’arresto',
    breve: 'Tempo di reazione, decelerazione, pendenza; moto e autovettura a confronto.',
    inSella: 'A 90 km/h, con un secondo di reazione, servono circa 70 metri per fermarsi: è la strada libera che devi vedere davanti.',
  },
  piega: {
    titolo: 'Equilibrio in curva e piega',
    breve: 'Angolo di rollio, sopraelevazione, larghezza dello pneumatico.',
    inSella: 'La piega dipende solo da velocità e raggio: se la curva si chiude, l’unico rimedio è rallentare.',
  },
  ellisse: {
    titolo: 'Ellisse di aderenza',
    breve: 'Frenare in piega: aderenza longitudinale residua.',
    inSella: 'In piega l’aderenza per frenare è poca: frena prima della curva, non dentro.',
  },
  'visibilita-curva': {
    titolo: 'Visibilità in curva',
    breve: 'Ostacoli laterali, posizione del motociclista, franco necessario.',
    inSella: 'Nelle curve cieche una traiettoria più esterna allunga la visuale; stringere la corda la accorcia.',
  },
  'visibilita-verticale': {
    titolo: 'Visibilità sui raccordi',
    breve: 'Dossi e raccordi concavi; abbassamento dell’occhio in piega.',
    inSella: 'Prima di un dosso rallenta: quello che c’è oltre lo vedi solo all’ultimo.',
  },
  notte: {
    titolo: 'Faro in curva di notte',
    breve: 'Portata utile del fascio e rotazione del taglio con il rollio.',
    inSella: 'Di notte in curva il faro illumina l’esterno: vai alla velocità di quello che vedi davvero.',
  },
  aquaplaning: {
    titolo: 'Velo idrico, aquaplaning e ormaie',
    breve: 'Aderenza in funzione di velocità e spessore d’acqua; modello delle ormaie.',
    inSella: 'Con l’acqua alta conta la velocità: rallentando alzi la soglia oltre cui lo pneumatico galleggia.',
  },
  impatto: {
    titolo: 'Scivolamento e impatto',
    breve: 'Uscita per la tangente, angolo e velocità d’impatto, barriere, HIC.',
    inSella: 'Un guard-rail a paletti o un filare di alberi non perdonano: dove manca lo spazio di recupero tieni più margine.',
  },
  velocita: {
    titolo: 'Diagramma delle velocità',
    breve: 'Accelerazione della moto e velocità oltre quella di progetto.',
    inSella: 'Tra due curve la moto accelera più di quanto prevede chi ha progettato la strada: pensa già alla curva successiva.',
  },
  percezione: {
    titolo: 'Percezione e reazione',
    breve: 'Tempo psicotecnico e sagoma della moto vista dagli altri.',
    inSella: 'Gli altri ti vedono più lontano e più lento di quanto sei: comportati come se non ti avessero visto.',
  },
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
