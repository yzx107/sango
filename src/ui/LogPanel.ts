import type { GameState } from '../game/types';

export class LogPanel {
  constructor(private readonly root: HTMLElement) {}

  render(state: GameState): void {
    this.root.innerHTML = state.logs
      .slice(0, 8)
      .map((log) => `<article class="log-entry ${log.tone}">第${log.turn}回合：${escapeHtml(log.text)}</article>`)
      .join('');
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char] ?? char);
}
