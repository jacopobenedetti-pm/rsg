import type { SceneSpec, SimParams } from '../types';

export interface ScenePreset {
  /** valori iniziali dei parametri della simulazione */
  defaults: Partial<SimParams>;
  /** parametri regolabili dall'utente */
  controls: (keyof SimParams)[];
  /** descrizione della scena in funzione dei parametri (alcuni attori dipendono da velocità e distanza) */
  build: (p: SimParams) => SceneSpec;
  /** cosa osservare nella simulazione */
  guida: string;
}
