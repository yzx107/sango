import { expect, test } from '@playwright/test';
import { cities } from '../src/data/cities';
import { factions, selectableFactionIds } from '../src/data/factions';
import { generals } from '../src/data/generals';
import { mapEdges } from '../src/data/mapGraph';

test('historical scenario data is complete and connected', () => {
  expect(selectableFactionIds).toHaveLength(7);
  expect(cities.length).toBeGreaterThanOrEqual(30);
  expect(generals.length).toBeGreaterThanOrEqual(60);

  const cityIds = new Set(cities.map((city) => city.id));
  const cityNames = new Set(cities.map((city) => city.name));
  const generalIds = new Set(generals.map((general) => general.id));
  expect(cityIds.size).toBe(cities.length);
  expect(cityNames.size).toBe(cities.length);
  expect(generalIds.size).toBe(generals.length);

  for (const factionId of selectableFactionIds) {
    const faction = factions[factionId];
    expect(cityIds.has(faction.capitalId), `${faction.name} capital`).toBe(true);
    expect(generalIds.has(faction.rulerId), `${faction.name} ruler`).toBe(true);
    const capital = cities.find((city) => city.id === faction.capitalId);
    const ruler = generals.find((general) => general.id === faction.rulerId);
    expect(capital?.ownerId, `${faction.name} capital owner`).toBe(factionId);
    expect(ruler?.factionId, `${faction.name} ruler faction`).toBe(factionId);
    expect(ruler?.cityId, `${faction.name} ruler city`).toBe(faction.capitalId);
    expect(cities.some((city) => city.ownerId === factionId), `${faction.name} city count`).toBe(true);
  }

  for (const city of cities) {
    expect(factions[city.ownerId], `${city.name} owner`).toBeTruthy();
    expect(generalIds.has(city.governorId), `${city.name} governor`).toBe(true);
    for (const generalId of city.generalIds) expect(generalIds.has(generalId), `${city.name} general ${generalId}`).toBe(true);
  }

  for (const general of generals) {
    expect(cityIds.has(general.cityId), `${general.name} city`).toBe(true);
    const city = cities.find((candidate) => candidate.id === general.cityId);
    expect(city?.ownerId, `${general.name} city faction`).toBe(general.factionId);
    expect(city?.generalIds.includes(general.id), `${general.name} listed in city`).toBe(true);
  }

  const seenEdges = new Set<string>();
  const graph = new Map<string, string[]>();
  for (const [a, b] of mapEdges) {
    expect(a, 'edge self loop').not.toBe(b);
    expect(cityIds.has(a), `edge start ${a}`).toBe(true);
    expect(cityIds.has(b), `edge end ${b}`).toBe(true);
    const key = [a, b].sort().join(':');
    expect(seenEdges.has(key), `duplicate edge ${key}`).toBe(false);
    seenEdges.add(key);
    graph.set(a, [...(graph.get(a) ?? []), b]);
    graph.set(b, [...(graph.get(b) ?? []), a]);
  }

  const visited = new Set<string>();
  const queue = [cities[0].id];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || visited.has(current)) continue;
    visited.add(current);
    for (const next of graph.get(current) ?? []) queue.push(next);
  }
  expect(visited.size).toBe(cities.length);
});
