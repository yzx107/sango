import { addLog, cityGovernor } from './GameState';
import type { DomesticAction, GameState, MilitaryAction } from './types';

const actionNames: Record<DomesticAction | MilitaryAction, string> = {
  agriculture: '开发农业',
  commerce: '开发商业',
  defense: '修筑城防',
  loyalty: '安抚民心',
  technology: '技术研究',
  recruit: '征兵',
  train: '训练',
};

export function applyDomesticAction(state: GameState, cityId: string, action: DomesticAction): string {
  const city = state.cities[cityId];
  if (!city || city.acted) return '本城本回合已行动。';
  const governor = cityGovernor(state, cityId);
  const politics = governor?.politics ?? 50;
  const effect = 2 + Math.floor(politics / 24);
  const cost = action === 'technology' ? 260 : action === 'defense' ? 230 : 180;
  if (city.gold < cost) return '金钱不足，命令未能执行。';

  city.gold -= cost;
  city.acted = true;

  if (action === 'agriculture') {
    city.agriculture = clamp(city.agriculture + effect, 1, 100);
    city.grain += 180 + effect * 42;
  } else if (action === 'commerce') {
    city.commerce = clamp(city.commerce + effect, 1, 100);
    city.gold += 80 + effect * 24;
  } else if (action === 'defense') {
    city.defense = clamp(city.defense + effect + 1, 1, 100);
  } else if (action === 'loyalty') {
    city.loyalty = clamp(city.loyalty + effect + 2, 1, 100);
    city.morale = clamp(city.morale + 3, 1, 100);
  } else {
    city.technology = clamp(city.technology + effect, 1, 100);
  }

  const text = `${city.name}${actionNames[action]}完成。`;
  addLog(state, text, 'good');
  return text;
}

export function applyMilitaryAction(state: GameState, cityId: string, action: MilitaryAction): string {
  const city = state.cities[cityId];
  if (!city || city.acted) return '本城本回合已行动。';

  if (action === 'recruit') {
    const recruits = Math.max(220, Math.floor(city.population * (0.012 + city.loyalty / 12000)));
    const cost = Math.ceil(recruits * 0.42);
    if (city.gold < cost || city.population < recruits * 2) return '金钱或人口不足，无法征兵。';
    city.gold -= cost;
    city.population -= recruits;
    city.troops += recruits;
    city.morale = clamp(city.morale - 3, 1, 100);
    city.acted = true;
    const text = `${city.name}新募兵 ${recruits.toLocaleString()}。`;
    addLog(state, text, 'good');
    return text;
  }

  const costGold = 170;
  const costGrain = 220;
  if (city.gold < costGold || city.grain < costGrain) return '训练所需金粮不足。';
  city.gold -= costGold;
  city.grain -= costGrain;
  city.morale = clamp(city.morale + 8, 1, 100);
  city.acted = true;
  const text = `${city.name}整训军阵，士气提升。`;
  addLog(state, text, 'good');
  return text;
}

export function settleEconomy(state: GameState): void {
  for (const city of Object.values(state.cities)) {
    const tax = Math.floor(city.commerce * (7 + city.loyalty / 20) + city.population / 1800);
    const harvest = Math.floor(city.agriculture * 18 + city.population / 900);
    const upkeep = Math.floor(city.troops * 0.09);
    city.gold += tax;
    city.grain = Math.max(0, city.grain + harvest - upkeep);
    city.population += Math.floor(city.population * 0.002 * (city.loyalty / 70));
    city.loyalty = clamp(city.loyalty + (city.grain > upkeep * 3 ? 1 : -2), 1, 100);
    city.morale = clamp(city.morale + (city.grain > upkeep * 2 ? 1 : -3), 1, 100);
    city.acted = false;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
