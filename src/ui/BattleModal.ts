import type { BattleReport, GameState } from '../game/types';

export class BattleModal {
  constructor(private readonly root: HTMLElement) {}

  show(state: GameState, report: BattleReport, onClose: () => void): void {
    const target = state.cities[report.targetId];
    const attacker = state.factions[report.attackerFactionId];
    const defender = state.factions[report.defenderFactionId];
    const result = report.attackerWon ? `${attacker.name}夺取${target.name}` : `${defender.name}守住${target.name}`;

    this.root.hidden = false;
    this.root.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true">
        <h2>战斗结算</h2>
        <div class="result-banner">${result}</div>
        <div class="stat-grid">
          <div class="stat"><span>进攻兵力</span><strong>${report.attackerTroops.toLocaleString()}</strong></div>
          <div class="stat"><span>守军兵力</span><strong>${report.defenderTroops.toLocaleString()}</strong></div>
          <div class="stat"><span>进攻损失</span><strong>${report.attackerLosses.toLocaleString()}</strong></div>
          <div class="stat"><span>守军损失</span><strong>${report.defenderLosses.toLocaleString()}</strong></div>
        </div>
        <div class="battle-log">
          ${report.logs.map((line) => `<div>${escapeHtml(line)}</div>`).join('')}
        </div>
        <div class="modal-actions">
          <button type="button" data-close>确认</button>
        </div>
      </div>
    `;
    this.root.querySelector<HTMLButtonElement>('[data-close]')?.addEventListener('click', () => {
      this.close();
      onClose();
    });
  }

  close(): void {
    this.root.hidden = true;
    this.root.innerHTML = '';
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char] ?? char);
}
