import { addLog, resetPlayerOrders, updateOutcome } from './GameState';
import { runAiTurn } from './AISystem';
import { settleEconomy } from './EconomySystem';
import type { BattleReport, GameState } from './types';

export class TurnManager {
  constructor(private readonly state: GameState) {}

  endPlayerTurn(): BattleReport[] {
    if (this.state.outcome !== 'playing') return [];
    this.state.phase = 'ai';
    addLog(this.state, '玩家阶段结束，诸侯开始行动。', 'info');
    const reports = runAiTurn(this.state);
    this.state.phase = 'settlement';
    settleEconomy(this.state);
    this.advanceDate();
    resetPlayerOrders(this.state);
    updateOutcome(this.state);
    this.state.phase = 'player';
    addLog(this.state, `进入 ${this.state.year} 年 ${this.state.month} 月。`, 'info');
    return reports;
  }

  private advanceDate(): void {
    this.state.turn += 1;
    this.state.month += 1;
    if (this.state.month > 12) {
      this.state.month = 1;
      this.state.year += 1;
    }
  }
}
