import { mapEdges } from '../data/mapGraph';
import { playerTotals } from '../game/GameState';
import { enemyNeighbors } from '../game/Pathfinding';
import type { BattleReport, DomesticAction, GameState, MilitaryAction } from '../game/types';
import { BattleModal } from './BattleModal';
import { CityPanel } from './CityPanel';
import { DuelModal } from './DuelModal';
import { LogPanel } from './LogPanel';

export interface ExpeditionPayload {
  sourceId: string;
  targetId: string;
  generalIds: string[];
  troops: number;
}

export interface UIEvents {
  domestic(cityId: string, action: DomesticAction): void;
  military(cityId: string, action: MilitaryAction): void;
  expedition(payload: ExpeditionPayload): void;
  previewRoute(cityIds: string[]): void;
  clearRoute(): void;
  endTurn(): void;
  save(): void;
  load(): void;
  restart(): void;
  setMode(mode: GameState['mode']): void;
}

export class UIManager {
  private readonly top = getElement('top-bar');
  private readonly left = getElement('left-panel');
  private readonly overview = getElement('overview-panel');
  private readonly modalRoot = getElement('modal-root');
  private readonly logPanel = new LogPanel(getElement('log-panel'));
  private readonly battleModal = new BattleModal(this.modalRoot);
  private readonly duelModal = new DuelModal(this.modalRoot);
  private readonly cityPanel: CityPanel;
  private overviewOpen = false;
  private state: GameState | null = null;

  constructor(private readonly events: UIEvents) {
    this.cityPanel = new CityPanel(getElement('city-panel'), {
      domestic: events.domestic,
      military: events.military,
      expedition: (cityId) => this.showExpedition(cityId),
    });
    window.addEventListener('keydown', this.onKeyDown);
  }

  render(state: GameState): void {
    this.state = state;
    this.renderTop(state);
    this.renderLeft(state);
    this.cityPanel.render(state);
    this.logPanel.render(state);
    this.renderOverview(state);
  }

  showBattle(state: GameState, report: BattleReport): void {
    if (report.duel) {
      this.duelModal.show(state, report.duel, () => this.battleModal.show(state, report, () => this.render(state)));
    } else {
      this.battleModal.show(state, report, () => this.render(state));
    }
  }

  showOutcome(state: GameState): void {
    if (state.outcome === 'playing') return;
    const victory = state.outcome === 'victory';
    this.modalRoot.hidden = false;
    this.modalRoot.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true">
        <h2>${victory ? '统一完成' : '势力覆灭'}</h2>
        <div class="result-banner">${victory ? `${state.factions[state.playerFactionId].name}旗帜遍布全境。` : '最后一座城池失守，沙盘归于他人。'}</div>
        <div class="modal-actions">
          <button type="button" data-restart>重新开局</button>
        </div>
      </div>
    `;
    this.modalRoot.querySelector<HTMLButtonElement>('[data-restart]')?.addEventListener('click', () => {
      this.closeModal();
      this.events.restart();
    });
  }

  closeModal(): void {
    this.duelModal.close();
    this.battleModal.close();
    this.modalRoot.hidden = true;
    this.modalRoot.innerHTML = '';
    this.events.clearRoute();
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
  }

  private renderTop(state: GameState): void {
    const totals = playerTotals(state);
    const faction = state.factions[state.playerFactionId];
    this.top.innerHTML = `
      <div class="era">${state.year}年 ${state.month}月 · 第${state.turn}回合 · ${faction.name}</div>
      <div class="resource-strip">
        ${metric('命令书', `${state.ordersRemaining}/${state.ordersMax}`)}
        ${metric('城池', totals.cities)}
        ${metric('金钱', totals.gold)}
        ${metric('粮草', totals.grain)}
        ${metric('总兵力', totals.troops)}
        ${metric('阶段', state.phase === 'player' ? '玩家' : state.phase === 'ai' ? 'AI' : '结算')}
      </div>
      <div class="top-actions">
        <button type="button" data-action="save">存档</button>
        <button type="button" data-action="load">读档</button>
        <button type="button" data-action="restart">重新开局</button>
        <button type="button" data-action="end">结束回合</button>
      </div>
    `;
    this.top.querySelector<HTMLButtonElement>('[data-action="save"]')?.addEventListener('click', this.events.save);
    this.top.querySelector<HTMLButtonElement>('[data-action="load"]')?.addEventListener('click', this.events.load);
    this.top.querySelector<HTMLButtonElement>('[data-action="restart"]')?.addEventListener('click', this.events.restart);
    this.top.querySelector<HTMLButtonElement>('[data-action="end"]')?.addEventListener('click', this.events.endTurn);
  }

  private renderLeft(state: GameState): void {
    this.left.innerHTML = `
      <div class="mode-row">
        <button type="button" data-mode="classic" class="${state.mode === 'classic' ? 'active' : ''}">经典模式</button>
        <button type="button" data-mode="sandbox" class="${state.mode === 'sandbox' ? 'active' : ''}">沙盘模式</button>
      </div>
      <ul class="hint-list">
        <li>左键选择城池</li>
        <li>拖拽旋转，滚轮缩放</li>
        <li>WASD / 方向键平移</li>
        <li>空格结束回合，Tab 总览</li>
      </ul>
      ${this.renderMiniMap(state)}
    `;
    this.left.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((button) => {
      button.addEventListener('click', () => this.events.setMode(button.dataset.mode as GameState['mode']));
    });
  }

  private renderOverview(state: GameState): void {
    this.overview.hidden = !this.overviewOpen;
    if (!this.overviewOpen) return;
    const rows = Object.values(state.factions)
      .map((faction) => {
        const cities = Object.values(state.cities).filter((city) => city.ownerId === faction.id);
        const troops = cities.reduce((sum, city) => sum + city.troops, 0);
        const gold = cities.reduce((sum, city) => sum + city.gold, 0);
        const grain = cities.reduce((sum, city) => sum + city.grain, 0);
        return `<tr><td style="color:${faction.color}">${faction.name}</td><td>${cities.length}</td><td>${troops.toLocaleString()}</td><td>${gold.toLocaleString()}</td><td>${grain.toLocaleString()}</td><td>${faction.style}</td></tr>`;
      })
      .join('');
    this.overview.innerHTML = `
      <table class="overview-table">
        <thead><tr><th>势力</th><th>城</th><th>兵力</th><th>金钱</th><th>粮草</th><th>倾向</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  private renderMiniMap(state: GameState): string {
    const points = Object.values(state.cities);
    const minX = Math.min(...points.map((city) => city.x));
    const maxX = Math.max(...points.map((city) => city.x));
    const minZ = Math.min(...points.map((city) => city.z));
    const maxZ = Math.max(...points.map((city) => city.z));
    const mapX = (x: number) => 12 + ((x - minX) / (maxX - minX)) * 196;
    const mapY = (z: number) => 12 + ((z - minZ) / (maxZ - minZ)) * 120;
    const roads = mapEdges
      .map(([a, b]) => {
        const ca = state.cities[a];
        const cb = state.cities[b];
        return `<line x1="${mapX(ca.x)}" y1="${mapY(ca.z)}" x2="${mapX(cb.x)}" y2="${mapY(cb.z)}" stroke="rgba(245,236,212,.22)" />`;
      })
      .join('');
    const cities = points
      .map((city) => `<circle cx="${mapX(city.x)}" cy="${mapY(city.z)}" r="${city.id === state.selectedCityId ? 4.8 : 3.4}" fill="${state.factions[city.ownerId].color}" />`)
      .join('');
    return `<svg class="mini-map" viewBox="0 0 220 144" aria-label="势力小地图">${roads}${cities}</svg>`;
  }

  private showExpedition(sourceId: string): void {
    const state = this.state;
    if (!state) return;
    const source = state.cities[sourceId];
    if (state.ordersRemaining <= 0) {
      this.modalRoot.hidden = false;
      this.modalRoot.innerHTML = `
        <div class="modal" role="dialog" aria-modal="true">
          <h2>${source.name} 出征</h2>
          <div class="result-banner">命令书已尽，请结束回合。</div>
          <div class="modal-actions"><button type="button" data-cancel>确认</button></div>
        </div>
      `;
      this.modalRoot.querySelector<HTMLButtonElement>('[data-cancel]')?.addEventListener('click', () => this.closeModal());
      return;
    }
    const targets = enemyNeighbors(state, sourceId);
    const generals = source.generalIds.map((id) => state.generals[id]).filter((general) => general.available);

    this.modalRoot.hidden = false;
    this.modalRoot.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true">
        <h2>${source.name} 出征</h2>
        ${
          targets.length === 0
            ? '<div class="result-banner">相邻道路暂无敌城。</div>'
            : `<div class="modal-grid">
                <div class="modal-field">
                  <label for="target-city">目标城池</label>
                  <select id="target-city">${targets.map((id) => `<option value="${id}">${state.cities[id].name}</option>`).join('')}</select>
                </div>
                <div class="modal-field">
                  <label for="troop-count">出征兵力</label>
                  <input id="troop-count" type="number" min="500" max="${Math.max(500, source.troops - 300)}" value="${Math.min(1800, Math.max(500, source.troops - 300))}" />
                </div>
                <div class="modal-field">
                  <label for="main-general">主将</label>
                  <select id="main-general">${generals.map((general) => `<option value="${general.id}">${general.name}</option>`).join('')}</select>
                </div>
                <div class="modal-field">
                  <label for="deputy-general">副将</label>
                  <select id="deputy-general"><option value="">无</option>${generals.map((general) => `<option value="${general.id}">${general.name}</option>`).join('')}</select>
                </div>
              </div>`
        }
        <div class="modal-actions">
          <button type="button" data-cancel>取消</button>
          <button type="button" data-confirm ${targets.length === 0 || generals.length === 0 ? 'disabled' : ''}>出征</button>
        </div>
      </div>
    `;

    const targetSelect = this.modalRoot.querySelector<HTMLSelectElement>('#target-city');
    const preview = () => targetSelect && this.events.previewRoute([sourceId, targetSelect.value]);
    preview();
    targetSelect?.addEventListener('change', preview);
    this.modalRoot.querySelector<HTMLButtonElement>('[data-cancel]')?.addEventListener('click', () => this.closeModal());
    this.modalRoot.querySelector<HTMLButtonElement>('[data-confirm]')?.addEventListener('click', () => {
      const troopInput = this.modalRoot.querySelector<HTMLInputElement>('#troop-count');
      const main = this.modalRoot.querySelector<HTMLSelectElement>('#main-general');
      const deputy = this.modalRoot.querySelector<HTMLSelectElement>('#deputy-general');
      if (!targetSelect || !troopInput || !main) return;
      const generalIds = [main.value, deputy?.value ?? ''].filter((id, index, ids) => id && ids.indexOf(id) === index);
      this.closeModal();
      this.events.expedition({
        sourceId,
        targetId: targetSelect.value,
        generalIds,
        troops: Number(troopInput.value),
      });
    });
  }

  private readonly onKeyDown = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null;
    if (target && ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) return;
    if (event.code === 'Escape') this.closeModal();
    if (event.code === 'Tab') {
      event.preventDefault();
      this.overviewOpen = !this.overviewOpen;
      if (this.state) this.renderOverview(this.state);
    }
    if (event.code === 'Space' && this.modalRoot.hidden) {
      event.preventDefault();
      this.events.endTurn();
    }
  };
}

function metric(label: string, value: string | number): string {
  const display = typeof value === 'number' ? Math.round(value).toLocaleString() : value;
  return `<div class="metric"><span>${label}</span><strong>${display}</strong></div>`;
}

function getElement(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing #${id}`);
  return element;
}
