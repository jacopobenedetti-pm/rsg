import type { ScenePreset } from './types';
import { URBANO_SCENES } from './urbano';
import { EXTRAURBANO_SCENES } from './extraurbano';
import { AUTOSTRADALE_SCENES } from './autostradale';
import { EXTRAURBANO2_SCENES } from './extraurbano2';
import { AUTOSTRADALE2_SCENES } from './autostradale2';
import { URBANO2_SCENES } from './urbano2';

export const SCENES: Record<string, ScenePreset> = {
  ...URBANO_SCENES,
  ...EXTRAURBANO_SCENES,
  ...AUTOSTRADALE_SCENES,
  ...EXTRAURBANO2_SCENES,
  ...AUTOSTRADALE2_SCENES,
  ...URBANO2_SCENES,
};

export type { ScenePreset };
