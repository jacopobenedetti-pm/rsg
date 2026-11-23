import { URBANO } from './urbano';
import { EXTRAURBANO } from './extraurbano';
import { AUTOSTRADALE } from './autostradale';
import { IN_SELLA } from '../inSella';
import type { Scenario } from '../types';

export const SCENARIOS: Scenario[] = [...URBANO, ...EXTRAURBANO, ...AUTOSTRADALE].map((s) => ({ ...s, inSella: IN_SELLA[s.id] }));

export const scenarioById = (id: string) => SCENARIOS.find((s) => s.id === id);
