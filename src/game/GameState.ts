import { cities as cityData } from '../data/cities';
import { factions as factionData } from '../data/factions';
import { generals as generalData } from '../data/generals';
import type { CityState, FactionId, GameLog, GameOutcome, GameState, GeneralState } from './types';

const SAVE_KEY = 'sango-strategy-demo-save-v1';

export function createInitialState(): GameState {
  const cities = Object.fromEntries(
    cityData.map((city): [string, CityState] => [
      city.id,
      {
        ...city,
        morale: 70,
        acted: false,
      },
    ]),
  );

  const generals = Object.fromEntries(
    generalData.map((general): [string, GeneralState] => [
      general.id,
      {
        ...general,
        available: true,
      },
    ]),
  ) as Record<string, GeneralState>;

  return {
    year: 201,
    month: 1,
    turn: 1,
    phase: 'player',
    mode: 'classic',
    outcome: 'playing',
    playerFactionId: 'xuanqi',
    factions: { ...factionData },
    cities,
    generals,
    diplomacy: createDiplomacy(),
    logs: [
      {
        id: 1,
        turn: 1,
        text: '玄麒盟立于洛原，诸城待令。',
        tone: 'info',
      },
    ],
    reports: [],
    marches: [],
    selectedCityId: 'luoyuan',
  };
}

export function saveGame(state: GameState): void {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

export function loadGame(): GameState | null {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as GameState;
    return normalizeState(parsed);
  } catch {
    return null;
  }
}

export function clearSave(): void {
  localStorage.removeItem(SAVE_KEY);
}

export function addLog(state: GameState, text: string, tone: GameLog['tone'] = 'info'): void {
  const nextId = (state.logs[0]?.id ?? 0) + 1;
  state.logs.unshift({ id: nextId, turn: state.turn, text, tone });
  state.logs = state.logs.slice(0, 80);
}

export function factionCityIds(state: GameState, factionId: FactionId): string[] {
  return Object.values(state.cities)
    .filter((city) => city.ownerId === factionId)
    .map((city) => city.id);
}

export function playerTotals(state: GameState): { gold: number; grain: number; troops: number; cities: number } {
  const cities = factionCityIds(state, state.playerFactionId).map((id) => state.cities[id]);
  return cities.reduce(
    (totals, city) => ({
      gold: totals.gold + city.gold,
      grain: totals.grain + city.grain,
      troops: totals.troops + city.troops,
      cities: totals.cities + 1,
    }),
    { gold: 0, grain: 0, troops: 0, cities: 0 },
  );
}

export function updateOutcome(state: GameState): GameOutcome {
  const playerCities = factionCityIds(state, state.playerFactionId).length;
  if (playerCities === 0) state.outcome = 'defeat';
  else if (playerCities === Object.keys(state.cities).length) state.outcome = 'victory';
  else state.outcome = 'playing';
  return state.outcome;
}

export function cityGovernor(state: GameState, cityId: string): GeneralState | null {
  const city = state.cities[cityId];
  return city?.governorId ? state.generals[city.governorId] ?? null : null;
}

export function strongestGeneral(state: GameState, cityId: string, field: 'force' | 'leadership'): GeneralState | null {
  const city = state.cities[cityId];
  if (!city) return null;
  return city.generalIds
    .map((id) => state.generals[id])
    .filter((general): general is GeneralState => Boolean(general))
    .sort((a, b) => b[field] - a[field])[0] ?? null;
}

function createDiplomacy(): Record<string, number> {
  const ids = Object.keys(factionData) as FactionId[];
  const pairs: Record<string, number> = {};
  for (const a of ids) {
    for (const b of ids) {
      if (a !== b) pairs[`${a}:${b}`] = 35;
    }
  }
  return pairs;
}

function normalizeState(state: GameState): GameState {
  return {
    ...createInitialState(),
    ...state,
    factions: { ...factionData, ...state.factions },
    cities: state.cities,
    generals: state.generals,
    logs: state.logs ?? [],
    reports: state.reports ?? [],
    marches: state.marches ?? [],
    outcome: state.outcome ?? 'playing',
  };
}
