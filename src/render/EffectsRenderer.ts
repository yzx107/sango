import * as THREE from 'three';
import type { GameState } from '../game/types';

type Burst = {
  group: THREE.Group;
  life: number;
  maxLife: number;
};

export class EffectsRenderer {
  readonly group = new THREE.Group();
  private readonly routeLine = new THREE.Line(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color: '#ffe08a', transparent: true, opacity: 0.9 }),
  );
  private readonly bursts: Burst[] = [];

  constructor(private readonly state: GameState) {
    this.group.name = 'effects-root';
    this.routeLine.visible = false;
    this.group.add(this.routeLine);
  }

  setRoute(cityIds: string[]): void {
    if (cityIds.length < 2) {
      this.routeLine.visible = false;
      return;
    }
    const points = cityIds.map((id) => {
      const city = this.state.cities[id];
      return new THREE.Vector3(city.x, 0.52, city.z);
    });
    this.routeLine.geometry.dispose();
    this.routeLine.geometry = new THREE.BufferGeometry().setFromPoints(points);
    this.routeLine.visible = true;
  }

  clearRoute(): void {
    this.routeLine.visible = false;
  }

  spawnConflict(cityId: string): void {
    const city = this.state.cities[cityId];
    const group = new THREE.Group();
    group.position.set(city.x, 0.55, city.z);
    const ringMaterial = new THREE.MeshBasicMaterial({ color: '#d9c18a', transparent: true, opacity: 0.85, side: THREE.DoubleSide });
    const smokeMaterial = new THREE.MeshBasicMaterial({ color: '#6c6254', transparent: true, opacity: 0.55 });
    for (let i = 0; i < 3; i += 1) {
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.25 + i * 0.18, 0.3 + i * 0.18, 28), ringMaterial.clone());
      ring.rotation.x = -Math.PI / 2;
      group.add(ring);
    }
    for (let i = 0; i < 5; i += 1) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), smokeMaterial.clone());
      puff.position.set(Math.cos(i * 1.4) * 0.35, 0.1 + i * 0.03, Math.sin(i * 1.4) * 0.35);
      group.add(puff);
    }
    this.group.add(group);
    this.bursts.push({ group, life: 0, maxLife: 1.4 });
  }

  update(delta: number): void {
    for (let i = this.bursts.length - 1; i >= 0; i -= 1) {
      const burst = this.bursts[i];
      burst.life += delta;
      const t = burst.life / burst.maxLife;
      burst.group.scale.setScalar(1 + t * 1.8);
      for (const child of burst.group.children) {
        const material = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
        material.opacity = Math.max(0, 0.85 * (1 - t));
      }
      if (burst.life >= burst.maxLife) {
        this.group.remove(burst.group);
        this.bursts.splice(i, 1);
      }
    }
  }
}
