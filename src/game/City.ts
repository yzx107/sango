import type { CityState, FactionId } from './types';

export function isOwnCity(city: CityState | undefined, factionId: FactionId): boolean {
  return Boolean(city && city.ownerId === factionId);
}

export function cityScale(city: CityState): 'small' | 'medium' | 'large' {
  if (city.population > 65000 || city.commerce + city.agriculture > 120) return 'large';
  if (city.population > 43000) return 'medium';
  return 'small';
}
