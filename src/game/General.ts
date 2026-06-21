import type { GeneralState } from './types';

export function generalLine(general: GeneralState): string {
  return `${general.name} 武${general.force} 智${general.intelligence} 政${general.politics} 统${general.leadership}`;
}

export function commandScore(general: GeneralState): number {
  return general.leadership * 1.5 + general.force + general.intelligence * 0.5;
}
