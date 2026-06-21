import { mapEdges } from '../data/mapGraph';
import type { GameState } from './types';

const adjacency = new Map<string, string[]>();

for (const [a, b] of mapEdges) {
  adjacency.set(a, [...(adjacency.get(a) ?? []), b]);
  adjacency.set(b, [...(adjacency.get(b) ?? []), a]);
}

export function neighborsOf(cityId: string): string[] {
  return adjacency.get(cityId) ?? [];
}

export function areAdjacent(a: string, b: string): boolean {
  return neighborsOf(a).includes(b);
}

export function enemyNeighbors(state: GameState, cityId: string): string[] {
  const city = state.cities[cityId];
  if (!city) return [];
  return neighborsOf(cityId).filter((neighborId) => state.cities[neighborId]?.ownerId !== city.ownerId);
}

export function findPath(startId: string, endId: string): string[] {
  if (startId === endId) return [startId];
  const queue = [startId];
  const cameFrom = new Map<string, string | null>([[startId, null]]);

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;
    for (const next of neighborsOf(current)) {
      if (cameFrom.has(next)) continue;
      cameFrom.set(next, current);
      if (next === endId) return unwindPath(cameFrom, endId);
      queue.push(next);
    }
  }

  return [];
}

function unwindPath(cameFrom: Map<string, string | null>, endId: string): string[] {
  const path: string[] = [];
  let current: string | null = endId;
  while (current) {
    path.unshift(current);
    current = cameFrom.get(current) ?? null;
  }
  return path;
}
