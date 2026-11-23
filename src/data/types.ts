import type { ContextId, EnvFactor, InfraFactor, Nature, OpFactor, PrincipleId } from './taxonomy';
import type { DistressId } from './distresses';

export type Level = 1 | 2 | 3 | 4 | 5;

export interface SourceRef {
  /** TM = tesi sul degrado delle sovrastrutture · TP = tesi sui criteri progettuali per il motoveicolo */
  doc: 'TM' | 'TP';
  rif: string;
}

export interface Scenario {
  /** codice stabile: contesto + progressivo (U-01, E-05, A-12) */
  id: string;
  titolo: string;
  contesto: ContextId;
  natura: Nature;
  infrastruttura: InfraFactor[];
  esercizio: OpFactor[];
  ambiente?: EnvFactor[];
  /** condotta non ammessa dal Codice della Strada analizzata nello scenario */
  fuoriNorma?: { condotta: string; nota: string };
  /** la situazione in una o due frasi */
  sintesi: string;
  /** il consiglio essenziale per il motociclista */
  inSella?: string;
  /** cosa accade dal punto di vista della dinamica del veicolo e del contatto pneumatico-strada */
  dinamica: string;
  causeInfrastruttura: string[];
  causeEsercizio: string[];
  /** per gli scenari combinati: perché è la combinazione a generare il pericolo */
  interazione?: string;
  /** segnali premonitori che il motociclista può cogliere */
  segnali: string[];
  /** condotta di guida che riduce probabilità e gravità */
  strategia: string[];
  /** interventi del gestore e del progettista */
  contromisure: string[];
  /** tipologia d'incidente attesa */
  esito: string;
  /** stima qualitativa: P probabilità, G gravità (1..5) */
  rischio: { P: Level; G: Level };
  principi: PrincipleId[];
  ammaloramenti?: DistressId[];
  fonti?: SourceRef[];
}
