import type { FactionId, GameState } from './types';

export function factionName(state: GameState, factionId: FactionId): string {
  return state.factions[factionId]?.name ?? factionId;
}

export function factionColor(state: GameState, factionId: FactionId): string {
  return state.factions[factionId]?.color ?? '#ffffff';
}
