import { addLog } from './GameState';
import { applyDomesticAction, applyMilitaryAction } from './EconomySystem';
import { createMarchOrder, resolveBattle } from './BattleSystem';
import { enemyNeighbors } from './Pathfinding';
import type { BattleReport, FactionId, GameState } from './types';

export function runAiTurn(state: GameState): BattleReport[] {
  const reports: BattleReport[] = [];
  const factionIds = Object.keys(state.factions).filter((id) => id !== state.playerFactionId) as FactionId[];

  for (const factionId of factionIds) {
    let actions = 0;
    const cities = Object.values(state.cities)
      .filter((city) => city.ownerId === factionId)
      .sort((a, b) => b.troops - a.troops);

    for (const city of cities) {
      if (actions >= 3) break;
      if (city.acted) continue;

      const weakTarget = enemyNeighbors(state, city.id)
        .map((id) => state.cities[id])
        .filter((target) => target.ownerId !== factionId)
        .sort((a, b) => a.troops + a.defense * 45 - (b.troops + b.defense * 45))[0];

      if (weakTarget && city.troops > weakTarget.troops * 1.35 + weakTarget.defense * 35 && Math.random() < 0.46) {
        const generalIds = city.generalIds.slice(0, 2);
        const troops = Math.min(Math.floor(city.troops * 0.46), city.troops - 350);
        const order = createMarchOrder(state, city.id, weakTarget.id, generalIds, troops, false);
        if (typeof order !== 'string') {
          console.log(`[AI] ${state.factions[factionId].name} attacks ${weakTarget.name} from ${city.name}`);
          reports.push(resolveBattle(state, order));
          actions += 1;
          continue;
        }
      }

      if (city.grain < city.troops * 0.55) {
        console.log(`[AI] ${state.factions[factionId].name} improves agriculture at ${city.name}`);
        applyDomesticAction(state, city.id, 'agriculture');
      } else if (city.gold < 850) {
        console.log(`[AI] ${state.factions[factionId].name} improves commerce at ${city.name}`);
        applyDomesticAction(state, city.id, 'commerce');
      } else if (weakTarget && weakTarget.troops > city.troops * 0.92) {
        console.log(`[AI] ${state.factions[factionId].name} reinforces ${city.name}`);
        if (city.gold > 500 && city.population > 12000) applyMilitaryAction(state, city.id, 'recruit');
        else applyDomesticAction(state, city.id, 'defense');
      } else {
        const action = city.technology < 40 ? 'technology' : 'commerce';
        console.log(`[AI] ${state.factions[factionId].name} develops ${action} at ${city.name}`);
        applyDomesticAction(state, city.id, action);
      }
      actions += 1;
    }
  }

  addLog(state, '各方势力完成本旬军政。', 'info');
  return reports;
}
