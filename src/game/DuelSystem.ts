import type { DuelReport, GameState } from './types';

const attackWords = ['抢得先机', '压步逼近', '横旗试探', '绕身斜击', '沉肩突进'];
const defendWords = ['稳住架势', '拨开锋线', '后撤半步', '借势卸力', '举盾护旗'];

export function maybeResolveDuel(
  state: GameState,
  attackerGeneralId: string | undefined,
  defenderGeneralId: string | undefined,
): DuelReport | undefined {
  if (!attackerGeneralId || !defenderGeneralId) return undefined;
  if (Math.random() > 0.36) return undefined;
  return resolveDuel(state, attackerGeneralId, defenderGeneralId);
}

export function resolveDuel(state: GameState, attackerGeneralId: string, defenderGeneralId: string): DuelReport {
  const attacker = state.generals[attackerGeneralId];
  const defender = state.generals[defenderGeneralId];
  let attackerStamina = attacker.stamina;
  let defenderStamina = defender.stamina;
  const rounds = [];

  for (let round = 1; round <= 5; round += 1) {
    const attackerRoll = attacker.force * 0.72 + attacker.leadership * 0.18 + Math.random() * 32;
    const defenderRoll = defender.force * 0.72 + defender.leadership * 0.18 + Math.random() * 32;
    const attackerHit = Math.max(3, Math.round((attackerRoll - defenderRoll * 0.72) / 7));
    const defenderHit = Math.max(3, Math.round((defenderRoll - attackerRoll * 0.72) / 7));

    if (attackerRoll >= defenderRoll) {
      defenderStamina = Math.max(0, defenderStamina - attackerHit);
      attackerStamina = Math.max(0, attackerStamina - Math.floor(defenderHit / 2));
    } else {
      attackerStamina = Math.max(0, attackerStamina - defenderHit);
      defenderStamina = Math.max(0, defenderStamina - Math.floor(attackerHit / 2));
    }

    rounds.push({
      round,
      attackerText: `${attacker.name}${attackWords[(round + attacker.force) % attackWords.length]}`,
      defenderText: `${defender.name}${defendWords[(round + defender.force) % defendWords.length]}`,
      attackerStamina,
      defenderStamina,
    });

    if (attackerStamina <= 0 || defenderStamina <= 0) break;
  }

  const winnerGeneralId =
    attackerStamina === defenderStamina
      ? null
      : attackerStamina > defenderStamina
        ? attackerGeneralId
        : defenderGeneralId;
  const moraleSwing = winnerGeneralId === attackerGeneralId ? 12 : winnerGeneralId === defenderGeneralId ? -12 : 0;

  return {
    attackerGeneralId,
    defenderGeneralId,
    winnerGeneralId,
    moraleSwing,
    rounds,
  };
}
