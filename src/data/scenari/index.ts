import { URBANO } from './urbano';
import { EXTRAURBANO } from './extraurbano';
import { AUTOSTRADALE } from './autostradale';
import type { Scenario } from '../types';

export const SCENARIOS: Scenario[] = [...URBANO, ...EXTRAURBANO, ...AUTOSTRADALE];

export const scenarioById = (id: string) => SCENARIOS.find((s) => s.id === id);
