import { generalLine } from '../game/General';
import type { DomesticAction, GameState, MilitaryAction } from '../game/types';

export interface CityPanelActions {
  domestic(cityId: string, action: DomesticAction): void;
  military(cityId: string, action: MilitaryAction): void;
  expedition(cityId: string): void;
}

export class CityPanel {
  constructor(
    private readonly root: HTMLElement,
    private readonly actions: CityPanelActions,
  ) {}

  render(state: GameState): void {
    const city = state.selectedCityId ? state.cities[state.selectedCityId] : null;
    if (!city) {
      this.root.innerHTML = '<div class="panel-title"><h2>未选择城池</h2></div>';
      return;
    }

    const faction = state.factions[city.ownerId];
    const own = city.ownerId === state.playerFactionId;
    const governor = state.generals[city.governorId];
    const disabled = !own || city.acted || state.outcome !== 'playing';
    const generals = city.generalIds
      .map((id) => state.generals[id])
      .filter(Boolean)
      .slice(0, 8);

    this.root.innerHTML = `
      <div class="panel-title">
        <h2>${city.name}</h2>
        <span class="faction-pill" style="border-color:${faction.color};color:${faction.color}">${faction.name}</span>
      </div>
      <div class="stat-grid">
        ${stat('人口', city.population)}
        ${stat('金钱', city.gold)}
        ${stat('粮草', city.grain)}
        ${stat('兵力', city.troops)}
        ${stat('城防', city.defense)}
        ${stat('民忠', city.loyalty)}
        ${stat('商业', city.commerce)}
        ${stat('农业', city.agriculture)}
        ${stat('技术', city.technology)}
        ${stat('士气', city.morale)}
      </div>
      <div class="stat"><span>太守</span><strong>${governor ? governor.name : '待任命'}</strong></div>
      <div class="action-grid">
        ${button('开发农业', 'domestic', 'agriculture', disabled)}
        ${button('开发商业', 'domestic', 'commerce', disabled)}
        ${button('修筑城防', 'domestic', 'defense', disabled)}
        ${button('安抚民心', 'domestic', 'loyalty', disabled)}
        ${button('技术研究', 'domestic', 'technology', disabled)}
        ${button('征兵', 'military', 'recruit', disabled)}
        ${button('训练', 'military', 'train', disabled)}
        ${button('出征', 'expedition', 'march', disabled || city.generalIds.length === 0)}
      </div>
      <div class="general-list">
        ${generals
          .map(
            (general) => `
              <div class="general-row">
                <strong>${general.name} ${general.available ? '' : '行军中'}</strong>
                <span>${generalLine(general)}</span><br />
                <span>${general.skills.join(' / ')}</span>
              </div>
            `,
          )
          .join('')}
      </div>
    `;

    this.root.querySelectorAll<HTMLButtonElement>('button[data-kind]').forEach((element) => {
      element.addEventListener('click', () => {
        const kind = element.dataset.kind;
        const action = element.dataset.action;
        if (!action) return;
        if (kind === 'domestic') this.actions.domestic(city.id, action as DomesticAction);
        if (kind === 'military') this.actions.military(city.id, action as MilitaryAction);
        if (kind === 'expedition') this.actions.expedition(city.id);
      });
    });
  }
}

function stat(label: string, value: number): string {
  return `<div class="stat"><span>${label}</span><strong>${Math.round(value).toLocaleString()}</strong></div>`;
}

function button(label: string, kind: string, action: string, disabled: boolean): string {
  return `<button type="button" data-kind="${kind}" data-action="${action}" ${disabled ? 'disabled' : ''}>${label}</button>`;
}
