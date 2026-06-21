import type { BattleConfig } from '../game/types';

export const battleConfig: BattleConfig = {
  troopWeight: 1,
  leadershipWeight: 28,
  forceWeight: 13,
  defenseWeight: 32,
  moraleWeight: 9,
  grainWeight: 0.08,
  technologyWeight: 18,
  terrainBonus: {
    plain: 0,
    river: 90,
    forest: 120,
    mountain: 220,
    pass: 260,
    coast: 70,
  },
  randomRange: 0.16,
};
