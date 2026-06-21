import * as THREE from 'three';
import { forestBelts, mapEdges, mountainBelts, rivers } from '../data/mapGraph';
import type { CityState } from '../game/types';

type CityLookup = Record<string, Pick<CityState, 'x' | 'z'>>;

export class TerrainRenderer {
  readonly group = new THREE.Group();

  constructor(private readonly cities: CityLookup) {
    this.group.name = 'terrain-root';
    this.group.add(this.createGround());
    this.group.add(this.createRoads());
    this.group.add(this.createRivers());
    this.group.add(this.createMountains());
    this.group.add(this.createForests());
  }

  private createGround(): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(56, 42, 52, 40);
    const position = geometry.attributes.position as THREE.BufferAttribute;
    const colors: number[] = [];

    for (let i = 0; i < position.count; i += 1) {
      const x = position.getX(i);
      const z = position.getY(i);
      const height =
        Math.sin(x * 0.22) * 0.24 +
        Math.cos(z * 0.2) * 0.18 +
        Math.sin((x + z) * 0.12) * 0.15 +
        (x < -13 && z > 0 ? 0.55 : 0) +
        (x < -15 && z < 0 ? 0.45 : 0);
      position.setXYZ(i, x, height, z);

      const color = new THREE.Color(x > 11 ? '#284f42' : z < -8 ? '#3d4634' : z > 13 ? '#244735' : '#344b35');
      if (x < -13) color.lerp(new THREE.Color('#6d5a35'), 0.35);
      colors.push(color.r, color.g, color.b);
    }

    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.92,
        metalness: 0,
      }),
    );
    mesh.receiveShadow = true;
    return mesh;
  }

  private createRoads(): THREE.Group {
    const group = new THREE.Group();
    const material = new THREE.MeshStandardMaterial({ color: '#c69b43', roughness: 0.92 });
    for (const [a, b] of mapEdges) {
      const start = this.cities[a];
      const end = this.cities[b];
      if (!start || !end) continue;
      const mid = new THREE.Vector3((start.x + end.x) / 2, 0.16, (start.z + end.z) / 2);
      mid.x += Math.sin((start.x + end.z) * 1.7) * 0.35;
      mid.z += Math.cos((start.z + end.x) * 1.3) * 0.35;
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(start.x, 0.14, start.z),
        mid,
        new THREE.Vector3(end.x, 0.14, end.z),
      ]);
      const road = new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.08, 6, false), material);
      road.receiveShadow = true;
      group.add(road);
    }
    return group;
  }

  private createRivers(): THREE.Group {
    const group = new THREE.Group();
    const material = new THREE.MeshStandardMaterial({
      color: '#346e75',
      roughness: 0.38,
      metalness: 0,
      transparent: true,
      opacity: 0.82,
    });
    for (const river of rivers) {
      const points = river
        .map((id) => this.cities[id])
        .filter((city): city is Pick<CityState, 'x' | 'z'> => Boolean(city))
        .map((city) => new THREE.Vector3(city.x, 0.2, city.z));
      const curve = new THREE.CatmullRomCurve3(points);
      const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 80, 0.22, 10, false), material);
      mesh.receiveShadow = true;
      group.add(mesh);
    }
    return group;
  }

  private createMountains(): THREE.Group {
    const group = new THREE.Group();
    const geometry = new THREE.ConeGeometry(0.75, 2.2, 5);
    const material = new THREE.MeshStandardMaterial({ color: '#6a5a3d', roughness: 0.95 });
    const total = mountainBelts.reduce((sum, belt) => sum + belt.count, 0);
    const mesh = new THREE.InstancedMesh(geometry, material, total);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    const matrix = new THREE.Matrix4();
    let index = 0;
    for (const belt of mountainBelts) {
      for (let i = 0; i < belt.count; i += 1) {
        const seed = index + belt.x * 13 + belt.z * 7;
        const scale = 0.75 + seeded(seed) * 0.8;
        matrix.compose(
          new THREE.Vector3(
            belt.x + (seeded(seed + 1) - 0.5) * belt.spreadX,
            0.95 * scale,
            belt.z + (seeded(seed + 2) - 0.5) * belt.spreadZ,
          ),
          new THREE.Quaternion().setFromEuler(new THREE.Euler(0, seeded(seed + 3) * Math.PI, 0)),
          new THREE.Vector3(scale, scale, scale),
        );
        mesh.setMatrixAt(index, matrix);
        index += 1;
      }
    }
    group.add(mesh);
    return group;
  }

  private createForests(): THREE.Group {
    const group = new THREE.Group();
    const foliage = new THREE.InstancedMesh(
      new THREE.ConeGeometry(0.34, 1.15, 6),
      new THREE.MeshStandardMaterial({ color: '#1f4d35', roughness: 0.9 }),
      forestBelts.reduce((sum, belt) => sum + belt.count, 0),
    );
    const trunks = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(0.06, 0.08, 0.45, 5),
      new THREE.MeshStandardMaterial({ color: '#4a3323', roughness: 0.95 }),
      foliage.count,
    );
    const matrix = new THREE.Matrix4();
    let index = 0;
    for (const belt of forestBelts) {
      for (let i = 0; i < belt.count; i += 1) {
        const seed = index + belt.x * 19 + belt.z * 11;
        const x = belt.x + (seeded(seed) - 0.5) * belt.spreadX;
        const z = belt.z + (seeded(seed + 1) - 0.5) * belt.spreadZ;
        const scale = 0.75 + seeded(seed + 2) * 0.5;
        matrix.compose(new THREE.Vector3(x, 0.85 * scale, z), new THREE.Quaternion(), new THREE.Vector3(scale, scale, scale));
        foliage.setMatrixAt(index, matrix);
        matrix.compose(new THREE.Vector3(x, 0.22, z), new THREE.Quaternion(), new THREE.Vector3(scale, scale, scale));
        trunks.setMatrixAt(index, matrix);
        index += 1;
      }
    }
    foliage.castShadow = true;
    trunks.castShadow = true;
    group.add(foliage, trunks);
    return group;
  }
}

function seeded(seed: number): number {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}
