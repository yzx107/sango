import * as THREE from 'three';
import { cityScale } from '../game/City';
import type { GameState } from '../game/types';

export class CityRenderer {
  readonly group = new THREE.Group();
  private readonly cityGroups = new Map<string, THREE.Group>();
  private readonly rings = new Map<string, THREE.Mesh>();
  private readonly flags = new Map<string, THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>>();
  private readonly pickables: THREE.Object3D[] = [];

  constructor(private readonly state: GameState) {
    this.group.name = 'city-root';
    for (const city of Object.values(state.cities)) {
      const cityGroup = this.createCity(city.id);
      cityGroup.position.set(city.x, 0.2, city.z);
      this.cityGroups.set(city.id, cityGroup);
      this.group.add(cityGroup);
    }
  }

  update(selectedCityId: string | null, hoveredCityId: string | null, elapsed: number): void {
    for (const [cityId, flag] of this.flags) {
      const city = this.state.cities[cityId];
      flag.material.color.set(this.state.factions[city.ownerId].color);
      flag.rotation.y = Math.sin(elapsed * 2.8 + city.x) * 0.12;
    }
    for (const [cityId, ring] of this.rings) {
      const selected = cityId === selectedCityId;
      const hovered = cityId === hoveredCityId;
      ring.visible = selected || hovered;
      const material = ring.material as THREE.MeshBasicMaterial;
      material.color.set(selected ? '#ffe08a' : '#ffffff');
      material.opacity = selected ? 0.9 : 0.55;
      ring.scale.setScalar(selected ? 1.1 + Math.sin(elapsed * 4) * 0.035 : 1);
    }
  }

  pickingObjects(): THREE.Object3D[] {
    return this.pickables;
  }

  cityWorldPosition(cityId: string): THREE.Vector3 {
    const city = this.state.cities[cityId];
    return new THREE.Vector3(city.x, 0.35, city.z);
  }

  private createCity(cityId: string): THREE.Group {
    const city = this.state.cities[cityId];
    const group = new THREE.Group();
    group.name = `city-${city.name}`;
    this.tagPickable(group, cityId);

    const scale = cityScale(city);
    const radius = scale === 'large' ? 1.18 : scale === 'medium' ? 0.95 : 0.78;
    const wallMaterial = new THREE.MeshStandardMaterial({ color: '#8f7b60', roughness: 0.82 });
    const roofMaterial = new THREE.MeshStandardMaterial({ color: '#5b3b2f', roughness: 0.74 });
    const towerMaterial = new THREE.MeshStandardMaterial({ color: '#b3a078', roughness: 0.78 });

    const base = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 1.08, 0.36, 8), wallMaterial);
    base.castShadow = true;
    base.receiveShadow = true;
    base.position.y = 0.18;
    this.tagPickable(base, cityId);
    group.add(base);

    const wall = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.92, 0.08, 6, 8), wallMaterial);
    wall.rotation.x = Math.PI / 2;
    wall.position.y = 0.48;
    wall.castShadow = true;
    group.add(wall);

    const buildingCount = scale === 'large' ? 6 : scale === 'medium' ? 4 : 3;
    for (let i = 0; i < buildingCount; i += 1) {
      const angle = (i / buildingCount) * Math.PI * 2;
      const distance = i === 0 ? 0 : radius * 0.42;
      const height = i === 0 ? 0.95 : 0.48 + (i % 2) * 0.16;
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.34, height, 0.34), towerMaterial);
      body.position.set(Math.cos(angle) * distance, 0.48 + height / 2, Math.sin(angle) * distance);
      body.castShadow = true;
      body.receiveShadow = true;
      group.add(body);

      const roof = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.24, 4), roofMaterial);
      roof.position.set(body.position.x, body.position.y + height / 2 + 0.13, body.position.z);
      roof.rotation.y = Math.PI / 4;
      roof.castShadow = true;
      group.add(roof);
    }

    if (city.terrain === 'pass') {
      const gate = new THREE.Mesh(new THREE.BoxGeometry(radius * 1.5, 0.45, 0.18), wallMaterial);
      gate.position.set(0, 0.8, -radius * 0.72);
      gate.castShadow = true;
      group.add(gate);
    }

    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 1.25, 6),
      new THREE.MeshStandardMaterial({ color: '#3c3026', roughness: 0.7 }),
    );
    pole.position.set(radius * 0.55, 1.22, 0);
    pole.castShadow = true;
    group.add(pole);

    const flagMaterial = new THREE.MeshStandardMaterial({
      color: this.state.factions[city.ownerId].color,
      roughness: 0.58,
      side: THREE.DoubleSide,
    });
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.34, 3, 1), flagMaterial);
    flag.position.set(radius * 0.83, 1.55, 0.03);
    flag.castShadow = true;
    group.add(flag);
    this.flags.set(cityId, flag);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(radius * 1.22, radius * 1.35, 48),
      new THREE.MeshBasicMaterial({ color: '#ffe08a', transparent: true, opacity: 0.85, side: THREE.DoubleSide }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.05;
    ring.visible = false;
    group.add(ring);
    this.rings.set(cityId, ring);

    return group;
  }

  private tagPickable(object: THREE.Object3D, cityId: string): void {
    object.userData.cityId = cityId;
    this.pickables.push(object);
  }
}
