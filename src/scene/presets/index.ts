import type { ScenePreset } from './types';
import { URBANO_SCENES } from './urbano';
import { EXTRAURBANO_SCENES } from './extraurbano';
import { AUTOSTRADALE_SCENES } from './autostradale';

export const SCENES: Record<string, ScenePreset> = {
  ...URBANO_SCENES,
  ...EXTRAURBANO_SCENES,
  ...AUTOSTRADALE_SCENES,
};

export type { ScenePreset };
