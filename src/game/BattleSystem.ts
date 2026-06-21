import { battleConfig } from '../data/battleConfig';
import { addLog, strongestGeneral, updateOutcome } from './GameState';
import { areAdjacent, neighborsOf } from './Pathfinding';
import { maybeResolveDuel } from './DuelSystem';
import type { BattleReport, GameState, MarchOrder } from './types';

export function createMarchOrder(
  state: GameState,
  sourceId: string,
  targetId: string,
  generalIds: string[],
  troops: number,
  playerOwned: boolean,
): MarchOrder | string {
  const source = state.cities[sourceId];
  const target = state.cities[targetId];
  if (!source || !target) return '城池不存在。';
  if (!areAdjacent(sourceId, targetId)) return '目标不在相邻道路上。';
  if (source.ownerId === target.ownerId) return '不能向己方城池出征。';
  if (generalIds.length === 0) return '至少选择一名武将。';
  if (troops < 500) return '出征兵力至少 500。';
  if (troops > source.troops - 300) return '需为本城留下至少 300 守军。';
  if (generalIds.some((id) => !source.generalIds.includes(id))) return '所选武将不在本城。';

  const grainCost = Math.ceil(troops * 0.16);
  if (source.grain < grainCost) return '粮草不足，无法出征。';

  source.troops -= troops;
  source.grain -= grainCost;
  source.acted = true;
  for (const generalId of generalIds) {
    removeGeneralFromCity(state, sourceId, generalId);
    state.generals[generalId].available = false;
    state.generals[generalId].cityId = `march:${sourceId}:${targetId}`;
  }

  const distance = Math.hypot(source.x - target.x, source.z - target.z);
  return {
    id: `${Date.now()}-${sourceId}-${targetId}-${Math.floor(Math.random() * 9999)}`,
    sourceId,
    targetId,
    factionId: source.ownerId,
    generalIds,
    troops,
    progress: 0,
    duration: Math.max(2.2, distance * 0.16),
    playerOwned,
  };
}

export function resolveBattle(state: GameState, order: MarchOrder): BattleReport {
  const source = state.cities[order.sourceId];
  const target = state.cities[order.targetId];
  if (!source || !target) throw new Error('Invalid battle order.');
  const defenderFactionId = target.ownerId;

  if (target.ownerId === order.factionId) {
    for (const generalId of order.generalIds) addGeneralToCity(state, order.targetId, generalId, order.factionId);
    target.troops += order.troops;
    const report = makeNoBattleReport(order, defenderFactionId, '目标已归入同势力，行军队列就地整编。');
    state.reports.unshift(report);
    return report;
  }

  const attackerLead = state.generals[order.generalIds[0]];
  const attackerDeputy = state.generals[order.generalIds[1]] ?? attackerLead;
  const defenderLead = strongestGeneral(state, order.targetId, 'leadership');
  const defenderDuelist = strongestGeneral(state, order.targetId, 'force');
  const defenderIds = target.generalIds.slice();
  const originalDefenderTroops = target.troops;
  const duel = maybeResolveDuel(state, attackerDeputy?.id, defenderDuelist?.id);
  const moraleShift = duel?.moraleSwing ?? 0;

  const attackerScore =
    order.troops * battleConfig.troopWeight +
    (attackerLead?.leadership ?? 45) * battleConfig.leadershipWeight +
    (attackerDeputy?.force ?? 45) * battleConfig.forceWeight +
    source.morale * battleConfig.moraleWeight +
    source.grain * battleConfig.grainWeight +
    source.technology * battleConfig.technologyWeight +
    moraleShift * 90;

  const defenderScore =
    target.troops * battleConfig.troopWeight +
    (defenderLead?.leadership ?? 45) * battleConfig.leadershipWeight +
    (defenderDuelist?.force ?? 45) * battleConfig.forceWeight +
    target.defense * battleConfig.defenseWeight +
    target.morale * battleConfig.moraleWeight +
    target.grain * battleConfig.grainWeight +
    target.technology * battleConfig.technologyWeight +
    battleConfig.terrainBonus[target.terrain];

  const attackerRoll = attackerScore * randomFactor();
  const defenderRoll = defenderScore * randomFactor();
  const attackerWon = attackerRoll > defenderRoll;
  const attackerLosses = attackerWon
    ? Math.min(order.troops, Math.round(target.troops * (0.3 + defenderRoll / attackerRoll * 0.2)))
    : Math.min(order.troops, Math.round(order.troops * (0.58 + Math.random() * 0.24)));
  const defenderLosses = attackerWon
    ? Math.min(target.troops, Math.round(target.troops * (0.66 + Math.random() * 0.18)))
    : Math.min(target.troops, Math.round(order.troops * (0.24 + attackerRoll / defenderRoll * 0.16)));

  const attackerSurvivors = Math.max(0, order.troops - attackerLosses);
  const defenderSurvivors = Math.max(0, target.troops - defenderLosses);
  const report = buildReport(order, defenderFactionId, defenderIds, originalDefenderTroops, attackerLosses, defenderLosses, attackerWon, duel);

  if (attackerWon) {
    target.ownerId = order.factionId;
    target.troops = Math.max(300, attackerSurvivors);
    target.morale = Math.max(45, source.morale - 4);
    target.loyalty = Math.max(35, target.loyalty - 8);
    target.defense = Math.max(12, target.defense - Math.floor(6 + Math.random() * 8));
    target.generalIds = [];
    for (const generalId of order.generalIds) addGeneralToCity(state, order.targetId, generalId, order.factionId);
    handleDefenderRetreat(state, order.targetId, defenderFactionId, defenderIds, order.factionId);
    target.governorId = order.generalIds[0];
    addLog(state, `${state.factions[order.factionId].name}攻取${target.name}。`, 'battle');
  } else {
    target.troops = Math.max(200, defenderSurvivors);
    target.morale = Math.min(100, target.morale + 4);
    returnAttackers(state, order, attackerSurvivors);
    addLog(state, `${state.factions[order.factionId].name}进攻${target.name}受挫。`, 'warn');
  }

  state.reports.unshift(report);
  state.reports = state.reports.slice(0, 24);
  updateOutcome(state);
  return report;
}

function buildReport(
  order: MarchOrder,
  defenderFactionId: string,
  defenderGeneralIds: string[],
  defenderTroops: number,
  attackerLosses: number,
  defenderLosses: number,
  attackerWon: boolean,
  duel: BattleReport['duel'],
): BattleReport {
  return {
    id: `battle-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    sourceId: order.sourceId,
    targetId: order.targetId,
    attackerFactionId: order.factionId,
    defenderFactionId: defenderFactionId as BattleReport['defenderFactionId'],
    attackerGeneralIds: order.generalIds.slice(),
    defenderGeneralIds,
    attackerTroops: order.troops,
    defenderTroops,
    attackerLosses,
    defenderLosses,
    attackerWon,
    duel,
    logs: [
      '前军接阵，双方旗列在沙盘道路上展开。',
      duel ? '两军阵前响起挑战鼓，单挑牵动全军士气。' : '主将压住阵脚，未让挑战扰乱军列。',
      attackerWon ? '侧翼夺得高地，攻城器械推至门前。' : '守军反击得势，城门前尘土倒卷。',
      attackerWon ? '城上旗色更换，新太守开始收拢府库。' : '鸣金收队，残部沿来路撤回。',
    ],
  };
}

function makeNoBattleReport(order: MarchOrder, defenderFactionId: BattleReport['defenderFactionId'], text: string): BattleReport {
  return {
    id: `battle-${Date.now()}-none`,
    sourceId: order.sourceId,
    targetId: order.targetId,
    attackerFactionId: order.factionId,
    defenderFactionId,
    attackerGeneralIds: order.generalIds,
    defenderGeneralIds: [],
    attackerTroops: order.troops,
    defenderTroops: 0,
    attackerLosses: 0,
    defenderLosses: 0,
    attackerWon: false,
    logs: [text],
  };
}

function returnAttackers(state: GameState, order: MarchOrder, survivors: number): void {
  const retreatId = state.cities[order.sourceId]?.ownerId === order.factionId ? order.sourceId : findRetreatCity(state, order.targetId, order.factionId);
  if (!retreatId) return;
  state.cities[retreatId].troops += survivors;
  for (const generalId of order.generalIds) addGeneralToCity(state, retreatId, generalId, order.factionId);
}

function handleDefenderRetreat(
  state: GameState,
  lostCityId: string,
  oldFactionId: BattleReport['defenderFactionId'],
  defenderIds: string[],
  newFactionId: BattleReport['attackerFactionId'],
): void {
  const retreatId = findRetreatCity(state, lostCityId, oldFactionId);
  for (const generalId of defenderIds) {
    const captured = !retreatId || Math.random() < 0.28;
    if (captured) {
      state.generals[generalId].loyalty = Math.max(38, state.generals[generalId].loyalty - 28);
      addGeneralToCity(state, lostCityId, generalId, newFactionId);
    } else {
      addGeneralToCity(state, retreatId, generalId, oldFactionId);
    }
  }
}

function findRetreatCity(state: GameState, fromCityId: string, factionId: BattleReport['defenderFactionId']): string | null {
  return neighborsOf(fromCityId).find((neighborId) => state.cities[neighborId]?.ownerId === factionId) ?? null;
}

function addGeneralToCity(state: GameState, cityId: string, generalId: string, factionId: BattleReport['attackerFactionId']): void {
  const city = state.cities[cityId];
  const general = state.generals[generalId];
  if (!city || !general) return;
  if (!city.generalIds.includes(generalId)) city.generalIds.push(generalId);
  general.cityId = cityId;
  general.factionId = factionId;
  general.available = true;
  if (!city.governorId) city.governorId = generalId;
}

function removeGeneralFromCity(state: GameState, cityId: string, generalId: string): void {
  const city = state.cities[cityId];
  if (!city) return;
  city.generalIds = city.generalIds.filter((id) => id !== generalId);
  if (city.governorId === generalId) city.governorId = city.generalIds[0] ?? '';
}

function randomFactor(): number {
  return 1 + (Math.random() * 2 - 1) * battleConfig.randomRange;
}
