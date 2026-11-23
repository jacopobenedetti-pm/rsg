import type { BarrierChoice, SceneSpec, SimParams } from '../types';

export interface ScenePreset {
  /** valori iniziali dei parametri della simulazione */
  defaults: Partial<SimParams>;
  /** parametri regolabili dall'utente */
  controls: (keyof SimParams)[];
  /** descrizione della scena in funzione dei parametri (alcuni attori dipendono da velocità e distanza) */
  build: (p: SimParams) => SceneSpec;
  /** cosa osservare nella simulazione */
  guida: string;
  /** etichette dei controlli specifiche della scena */
  labels?: Partial<Record<keyof SimParams, string>>;
  /** nomi delle tre opzioni di barriera, se diversi da quelli standard */
  barrierLabels?: Partial<Record<BarrierChoice, string>>;
  /** intervallo della velocità, se diverso da quello standard */
  speedRange?: [number, number];
}
