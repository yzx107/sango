import * as THREE from 'three';
import { createRenderer, resizeRenderer } from '../core/Renderer';

export class SceneManager {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(48, 1, 0.1, 130);

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.renderer = createRenderer(canvas);
    this.renderer.toneMappingExposure = 1.08;
    this.scene.background = new THREE.Color('#18201c');
    this.scene.fog = new THREE.Fog('#18201c', 42, 86);
    this.setupLights();
    this.resize();
  }

  resize(): void {
    resizeRenderer(this.renderer, this.camera, 1.75);
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  diagnostics(frame: number, cityCount: number, marchCount: number): ThreeGameDiagnostics {
    const info = this.renderer.info;
    return {
      frame,
      cityCount,
      marchCount,
      renderer: {
        calls: info.render.calls,
        triangles: info.render.triangles,
        geometries: info.memory.geometries,
        textures: info.memory.textures,
      },
      canvas: {
        clientWidth: this.canvas.clientWidth,
        clientHeight: this.canvas.clientHeight,
        width: this.canvas.width,
        height: this.canvas.height,
        dpr: Math.min(window.devicePixelRatio || 1, 1.75),
      },
    };
  }

  dispose(): void {
    this.renderer.dispose();
  }

  private setupLights(): void {
    const hemi = new THREE.HemisphereLight('#fff1cc', '#3c4939', 1.8);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight('#ffe1a3', 2.8);
    sun.position.set(-18, 26, 14);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -36;
    sun.shadow.camera.right = 36;
    sun.shadow.camera.top = 30;
    sun.shadow.camera.bottom = -30;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 72;
    this.scene.add(sun);

    const rim = new THREE.DirectionalLight('#b9e4ff', 0.7);
    rim.position.set(16, 12, -18);
    this.scene.add(rim);
  }
}
