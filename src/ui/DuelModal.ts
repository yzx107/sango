import * as THREE from 'three';
import type { DuelReport, GameState } from '../game/types';

export class DuelModal {
  private renderer: THREE.WebGLRenderer | null = null;
  private frameId = 0;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(42, 1, 0.1, 20);
  private left: THREE.Group | null = null;
  private right: THREE.Group | null = null;

  constructor(private readonly root: HTMLElement) {}

  show(state: GameState, report: DuelReport, onClose: () => void): void {
    const attacker = state.generals[report.attackerGeneralId];
    const defender = state.generals[report.defenderGeneralId];
    const winner = report.winnerGeneralId ? state.generals[report.winnerGeneralId].name : '未分胜负';
    this.root.hidden = false;
    this.root.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true">
        <h2>阵前单挑</h2>
        <canvas class="duel-canvas"></canvas>
        <div class="result-banner">${attacker.name} 对 ${defender.name}，结果：${winner}</div>
        <div class="battle-log">
          ${report.rounds
            .map(
              (round) =>
                `<div>第${round.round}合：${round.attackerText}；${round.defenderText}。体力 ${round.attackerStamina} / ${round.defenderStamina}</div>`,
            )
            .join('')}
        </div>
        <div class="modal-actions">
          <button type="button" data-close>继续战斗结算</button>
        </div>
      </div>
    `;

    const canvas = this.root.querySelector<HTMLCanvasElement>('.duel-canvas');
    if (canvas) this.startScene(canvas, state.factions[attacker.factionId].color, state.factions[defender.factionId].color);
    this.root.querySelector<HTMLButtonElement>('[data-close]')?.addEventListener('click', () => {
      this.close();
      onClose();
    });
  }

  close(): void {
    cancelAnimationFrame(this.frameId);
    this.renderer?.dispose();
    this.renderer = null;
    this.left = null;
    this.right = null;
    this.scene.clear();
    this.root.hidden = true;
    this.root.innerHTML = '';
  }

  private startScene(canvas: HTMLCanvasElement, leftColor: string, rightColor: string): void {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.scene.background = new THREE.Color('#171b16');
    this.camera.position.set(0, 3.2, 6.2);
    this.camera.lookAt(0, 0.8, 0);
    this.scene.add(new THREE.HemisphereLight('#fff2cc', '#3a2c1e', 1.8));
    const light = new THREE.DirectionalLight('#ffe0a5', 2);
    light.position.set(2, 5, 3);
    this.scene.add(light);

    const arena = new THREE.Mesh(
      new THREE.CylinderGeometry(2.7, 2.9, 0.22, 36),
      new THREE.MeshStandardMaterial({ color: '#6d5b3f', roughness: 0.9 }),
    );
    arena.position.y = -0.12;
    this.scene.add(arena);
    this.left = this.createWarrior(leftColor);
    this.right = this.createWarrior(rightColor);
    this.left.position.set(-1.05, 0.25, 0);
    this.right.position.set(1.05, 0.25, 0);
    this.right.rotation.y = Math.PI;
    this.scene.add(this.left, this.right);
    this.animate();
  }

  private createWarrior(color: string): THREE.Group {
    const group = new THREE.Group();
    const bodyMaterial = new THREE.MeshStandardMaterial({ color, roughness: 0.58 });
    const trimMaterial = new THREE.MeshStandardMaterial({ color: '#e4c16a', roughness: 0.42 });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.7, 4, 8), bodyMaterial);
    body.position.y = 0.78;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 8), trimMaterial);
    head.position.y = 1.38;
    const spear = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.35, 6), trimMaterial);
    spear.position.set(0.32, 0.95, 0);
    spear.rotation.z = -0.45;
    group.add(body, head, spear);
    return group;
  }

  private animate = () => {
    if (!this.renderer) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.renderer.setSize(Math.max(1, rect.width), Math.max(1, rect.height), false);
    this.camera.aspect = rect.width / Math.max(1, rect.height);
    this.camera.updateProjectionMatrix();
    const t = performance.now() / 1000;
    if (this.left) this.left.position.x = -1.05 + Math.sin(t * 2.8) * 0.08;
    if (this.right) this.right.position.x = 1.05 - Math.sin(t * 2.6) * 0.08;
    this.renderer.render(this.scene, this.camera);
    this.frameId = requestAnimationFrame(this.animate);
  };
}
