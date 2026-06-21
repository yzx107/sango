import * as THREE from 'three';
import { Loop } from '../core/Loop';
import { ArmyRenderer } from '../render/ArmyRenderer';
import { CameraController } from '../render/CameraController';
import { CityRenderer } from '../render/CityRenderer';
import { EffectsRenderer } from '../render/EffectsRenderer';
import { SceneManager } from '../render/SceneManager';
import { TerrainRenderer } from '../render/TerrainRenderer';
import { UIManager, type ExpeditionPayload } from '../ui/UIManager';
import { createMarchOrder, resolveBattle } from './BattleSystem';
import { isOwnCity } from './City';
import { applyDomesticAction, applyMilitaryAction } from './EconomySystem';
import { addLog, clearSave, createInitialState, loadGame, saveGame, updateOutcome } from './GameState';
import { findPath } from './Pathfinding';
import { TurnManager } from './TurnManager';
import type { DomesticAction, GameOutcome, GameState, MilitaryAction } from './types';

export class Game {
  private state: GameState = createInitialState();
  private turnManager = new TurnManager(this.state);
  private readonly sceneManager: SceneManager;
  private readonly cameraController: CameraController;
  private readonly ui: UIManager;
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly loop = new Loop(
    (delta, elapsed) => this.update(delta, elapsed),
    () => this.sceneManager.render(),
  );

  private terrainRenderer: TerrainRenderer | null = null;
  private cityRenderer: CityRenderer | null = null;
  private armyRenderer: ArmyRenderer | null = null;
  private effectsRenderer: EffectsRenderer | null = null;
  private hoveredCityId: string | null = null;
  private frame = 0;
  private dirtyUi = true;
  private lastOutcome: GameOutcome = 'playing';

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.sceneManager = new SceneManager(canvas);
    this.cameraController = new CameraController(this.sceneManager.camera, canvas);
    this.ui = new UIManager({
      domestic: (cityId, action) => this.handleDomestic(cityId, action),
      military: (cityId, action) => this.handleMilitary(cityId, action),
      expedition: (payload) => this.handleExpedition(payload),
      previewRoute: (cityIds) => this.effectsRenderer?.setRoute(cityIds),
      clearRoute: () => this.effectsRenderer?.clearRoute(),
      endTurn: () => this.endTurn(),
      save: () => this.save(),
      load: () => this.load(),
      restart: () => this.restart(),
      setMode: (mode) => this.setMode(mode),
    });

    this.buildWorld();
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('click', this.onClick);
    this.markDirty();
  }

  start(): void {
    this.loop.start();
  }

  dispose(): void {
    this.loop.stop();
    this.cameraController.dispose();
    this.ui.dispose();
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('click', this.onClick);
    this.sceneManager.dispose();
    window.__THREE_GAME_DIAGNOSTICS__ = undefined;
  }

  private buildWorld(): void {
    if (this.terrainRenderer) this.sceneManager.scene.remove(this.terrainRenderer.group);
    if (this.cityRenderer) this.sceneManager.scene.remove(this.cityRenderer.group);
    if (this.armyRenderer) this.sceneManager.scene.remove(this.armyRenderer.group);
    if (this.effectsRenderer) this.sceneManager.scene.remove(this.effectsRenderer.group);

    this.terrainRenderer = new TerrainRenderer(this.state.cities);
    this.cityRenderer = new CityRenderer(this.state);
    this.armyRenderer = new ArmyRenderer(this.state);
    this.effectsRenderer = new EffectsRenderer(this.state);
    this.sceneManager.scene.add(
      this.terrainRenderer.group,
      this.cityRenderer.group,
      this.armyRenderer.group,
      this.effectsRenderer.group,
    );
    const selected = this.state.selectedCityId ? this.state.cities[this.state.selectedCityId] : null;
    if (selected) this.cameraController.focusOn(selected.x, selected.z);
  }

  private update(delta: number, elapsed: number): void {
    this.frame += 1;
    this.sceneManager.resize();
    this.cameraController.update(delta);
    this.updateMarches(delta);
    this.cityRenderer?.update(this.state.selectedCityId, this.hoveredCityId, elapsed);
    this.armyRenderer?.update(elapsed);
    this.effectsRenderer?.update(delta);

    if (this.dirtyUi) {
      this.ui.render(this.state);
      this.dirtyUi = false;
    }

    if (this.state.outcome !== this.lastOutcome) {
      this.lastOutcome = this.state.outcome;
      this.ui.showOutcome(this.state);
    }

    window.__THREE_GAME_DIAGNOSTICS__ = {
      ...this.sceneManager.diagnostics(this.frame, Object.keys(this.state.cities).length, this.state.marches.length),
      turn: this.state.turn,
      selectedCityId: this.state.selectedCityId,
      outcome: this.state.outcome,
    };
  }

  private updateMarches(delta: number): void {
    for (const march of [...this.state.marches]) {
      march.progress += delta / march.duration;
      if (march.progress < 1) continue;
      this.state.marches = this.state.marches.filter((item) => item.id !== march.id);
      const report = resolveBattle(this.state, march);
      this.effectsRenderer?.spawnConflict(march.targetId);
      this.effectsRenderer?.clearRoute();
      this.markDirty();
      saveGame(this.state);
      if (march.playerOwned) this.ui.showBattle(this.state, report);
    }
  }

  private handleDomestic(cityId: string, action: DomesticAction): void {
    if (!this.canActOnCity(cityId)) return;
    applyDomesticAction(this.state, cityId, action);
    this.afterStateChange();
  }

  private handleMilitary(cityId: string, action: MilitaryAction): void {
    if (!this.canActOnCity(cityId)) return;
    applyMilitaryAction(this.state, cityId, action);
    this.afterStateChange();
  }

  private handleExpedition(payload: ExpeditionPayload): void {
    if (!this.canActOnCity(payload.sourceId)) return;
    const order = createMarchOrder(
      this.state,
      payload.sourceId,
      payload.targetId,
      payload.generalIds,
      payload.troops,
      true,
    );
    if (typeof order === 'string') {
      addLog(this.state, order, 'warn');
      this.markDirty();
      return;
    }
    this.state.marches.push(order);
    this.effectsRenderer?.setRoute([payload.sourceId, payload.targetId]);
    addLog(this.state, `${this.state.cities[payload.sourceId].name}发兵${this.state.cities[payload.targetId].name}。`, 'battle');
    this.afterStateChange();
  }

  private endTurn(): void {
    if (this.state.marches.some((march) => march.playerOwned)) {
      addLog(this.state, '己方军队尚在行军，待抵达后再结束回合。', 'warn');
      this.markDirty();
      return;
    }
    const reports = this.turnManager.endPlayerTurn();
    for (const report of reports) {
      if (report.attackerFactionId === this.state.playerFactionId || report.defenderFactionId === this.state.playerFactionId) {
        this.effectsRenderer?.spawnConflict(report.targetId);
      }
    }
    this.afterStateChange();
  }

  private save(): void {
    saveGame(this.state);
    addLog(this.state, '存档已写入本机浏览器。', 'good');
    this.markDirty();
  }

  private load(): void {
    const loaded = loadGame();
    if (!loaded) {
      addLog(this.state, '没有找到可读取的存档。', 'warn');
      this.markDirty();
      return;
    }
    this.state = loaded;
    this.turnManager = new TurnManager(this.state);
    this.buildWorld();
    addLog(this.state, '存档已读取。', 'good');
    this.markDirty();
  }

  private restart(): void {
    clearSave();
    this.state = createInitialState();
    this.turnManager = new TurnManager(this.state);
    this.lastOutcome = 'playing';
    this.buildWorld();
    this.markDirty();
  }

  private setMode(mode: GameState['mode']): void {
    this.state.mode = mode;
    addLog(this.state, mode === 'classic' ? '经典模式占位已启用。' : '沙盘模式占位已启用。', 'info');
    this.afterStateChange();
  }

  private canActOnCity(cityId: string): boolean {
    const city = this.state.cities[cityId];
    if (!city || this.state.outcome !== 'playing' || !isOwnCity(city, this.state.playerFactionId)) return false;
    return !city.acted;
  }

  private afterStateChange(): void {
    updateOutcome(this.state);
    saveGame(this.state);
    this.markDirty();
  }

  private markDirty(): void {
    this.dirtyUi = true;
  }

  private readonly onPointerMove = (event: PointerEvent) => {
    const cityId = this.pickCity(event);
    if (cityId === this.hoveredCityId) return;
    this.hoveredCityId = cityId;
    const selected = this.state.selectedCityId;
    if (selected && cityId && this.state.cities[selected]?.ownerId === this.state.playerFactionId) {
      const path = findPath(selected, cityId);
      if (path.length === 2 && this.state.cities[cityId].ownerId !== this.state.playerFactionId) this.effectsRenderer?.setRoute(path);
    }
  };

  private readonly onClick = (event: MouseEvent) => {
    if (this.cameraController.consumeDragMoved()) return;
    const cityId = this.pickCity(event);
    if (!cityId) return;
    this.state.selectedCityId = cityId;
    const city = this.state.cities[cityId];
    this.cameraController.focusOn(city.x, city.z);
    this.markDirty();
  };

  private pickCity(event: MouseEvent | PointerEvent): string | null {
    if (!this.cityRenderer) return null;
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -(((event.clientY - rect.top) / rect.height) * 2 - 1));
    this.raycaster.setFromCamera(this.pointer, this.sceneManager.camera);
    const hit = this.raycaster.intersectObjects(this.cityRenderer.pickingObjects(), true)[0];
    if (!hit) return null;
    let object: THREE.Object3D | null = hit.object;
    while (object) {
      if (typeof object.userData.cityId === 'string') return object.userData.cityId;
      object = object.parent;
    }
    return null;
  }
}
