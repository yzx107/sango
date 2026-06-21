import * as THREE from 'three';
import type { GameState, MarchOrder } from '../game/types';

export class ArmyRenderer {
  readonly group = new THREE.Group();
  private readonly armies = new Map<string, THREE.Group>();

  constructor(private readonly state: GameState) {
    this.group.name = 'army-root';
  }

  update(elapsed: number): void {
    const activeIds = new Set(this.state.marches.map((march) => march.id));
    for (const march of this.state.marches) {
      let army = this.armies.get(march.id);
      if (!army) {
        army = this.createArmy(march);
        this.armies.set(march.id, army);
        this.group.add(army);
      }
      this.positionArmy(army, march, elapsed);
    }
    for (const [id, army] of this.armies) {
      if (activeIds.has(id)) continue;
      this.group.remove(army);
      this.armies.delete(id);
    }
  }

  private createArmy(march: MarchOrder): THREE.Group {
    const faction = this.state.factions[march.factionId];
    const group = new THREE.Group();
    group.name = `army-${march.id}`;
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: '#5f5546', roughness: 0.75 });
    const flagMaterial = new THREE.MeshStandardMaterial({ color: faction.color, side: THREE.DoubleSide, roughness: 0.5 });
    const poleMaterial = new THREE.MeshStandardMaterial({ color: '#332920', roughness: 0.8 });

    for (let i = 0; i < 6; i += 1) {
      const soldier = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.18, 3, 6), bodyMaterial);
      soldier.position.set((i % 3) * 0.22 - 0.22, 0.22, Math.floor(i / 3) * 0.22 - 0.12);
      soldier.castShadow = true;
      group.add(soldier);
    }

    for (let i = 0; i < 3; i += 1) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.72, 5), poleMaterial);
      pole.position.set(-0.25 + i * 0.24, 0.52, -0.28);
      pole.castShadow = true;
      group.add(pole);
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 0.16), flagMaterial);
      flag.position.set(pole.position.x + 0.13, 0.76, pole.position.z);
      flag.userData.sway = i * 0.7;
      group.add(flag);
    }

    const dustMaterial = new THREE.MeshBasicMaterial({ color: '#c9b185', transparent: true, opacity: 0.32 });
    for (let i = 0; i < 4; i += 1) {
      const dust = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 5), dustMaterial);
      dust.position.set(-0.32 + i * 0.2, 0.05, 0.34 + (i % 2) * 0.1);
      dust.userData.dust = true;
      group.add(dust);
    }

    return group;
  }

  private positionArmy(army: THREE.Group, march: MarchOrder, elapsed: number): void {
    const source = this.state.cities[march.sourceId];
    const target = this.state.cities[march.targetId];
    const t = THREE.MathUtils.clamp(march.progress, 0, 1);
    const x = THREE.MathUtils.lerp(source.x, target.x, t);
    const z = THREE.MathUtils.lerp(source.z, target.z, t);
    army.position.set(x, 0.55 + Math.sin(elapsed * 9) * 0.03, z);
    army.lookAt(target.x, 0.55, target.z);
    for (const child of army.children) {
      if (child instanceof THREE.Mesh && child.geometry instanceof THREE.PlaneGeometry) {
        child.rotation.y = Math.sin(elapsed * 5 + child.userData.sway) * 0.18;
      }
      if (child.userData.dust) {
        child.scale.setScalar(0.8 + Math.sin(elapsed * 8 + child.position.x) * 0.2);
      }
    }
  }
}
