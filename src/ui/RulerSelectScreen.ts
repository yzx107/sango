import { selectableFactionIds } from '../data/factions';
import type { FactionId, GameState } from '../game/types';

export interface RulerSelectEvents {
  start(factionId: FactionId): void;
  load(): void;
}

export class RulerSelectScreen {
  private selectedFactionId: FactionId = 'liubei';
  private lastMessage = '';

  constructor(
    private readonly root: HTMLElement,
    private readonly events: RulerSelectEvents,
  ) {}

  show(state: GameState, message = ''): void {
    this.lastMessage = message;
    this.root.hidden = false;
    this.render(state);
  }

  hide(): void {
    this.root.hidden = true;
    this.root.innerHTML = '';
  }

  private render(state: GameState): void {
    const cards = selectableFactionIds
      .map((id) => {
        const faction = state.factions[id];
        const capital = state.cities[faction.capitalId];
        const cityCount = Object.values(state.cities).filter((city) => city.ownerId === id).length;
        const active = id === this.selectedFactionId;
        return `
          <button class="ruler-card ${active ? 'selected' : ''}" type="button" data-ruler="${id}" aria-pressed="${active}">
            <img src="${faction.portrait}" alt="${faction.name}原创像素头像" />
            <span class="ruler-name">${faction.name}</span>
            <span class="ruler-meta">本城 ${capital.name} · ${cityCount} 城 · ${faction.difficulty}</span>
            <span class="ruler-style">${faction.style}</span>
            <span class="ruler-desc">${faction.description}</span>
          </button>
        `;
      })
      .join('');

    const selected = state.factions[this.selectedFactionId];
    this.root.innerHTML = `
      <div class="ruler-screen-shell">
        <div class="ruler-screen-heading">
          <div>
            <span class="scenario-kicker">${state.scenarioName}</span>
            <h1>189年 12月 · 选择君主</h1>
          </div>
          <div class="ruler-screen-actions">
            <button type="button" data-load>读取存档</button>
            <button type="button" data-start>以${selected.name}开局</button>
          </div>
        </div>
        ${this.lastMessage ? `<div class="ruler-message">${escapeHtml(this.lastMessage)}</div>` : ''}
        <div class="ruler-card-grid">${cards}</div>
      </div>
    `;

    this.root.querySelectorAll<HTMLButtonElement>('[data-ruler]').forEach((button) => {
      button.addEventListener('click', () => {
        this.selectedFactionId = button.dataset.ruler as FactionId;
        this.render(state);
      });
    });
    this.root.querySelector<HTMLButtonElement>('[data-start]')?.addEventListener('click', () => {
      this.events.start(this.selectedFactionId);
    });
    this.root.querySelector<HTMLButtonElement>('[data-load]')?.addEventListener('click', () => {
      this.events.load();
    });
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char] ?? char);
}
