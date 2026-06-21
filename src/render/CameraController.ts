import * as THREE from 'three';

export class CameraController {
  private readonly target = new THREE.Vector3(0, 0, 1.5);
  private readonly keys = new Set<string>();
  private yaw = Math.PI * 0.25;
  private distance = 42;
  private dragging = false;
  private dragMoved = false;
  private lastX = 0;
  private lastY = 0;

  constructor(
    private readonly camera: THREE.PerspectiveCamera,
    private readonly canvas: HTMLCanvasElement,
  ) {
    canvas.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    canvas.addEventListener('wheel', this.onWheel, { passive: false });
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    this.applyCamera();
  }

  update(delta: number): void {
    const speed = 16 * delta * (this.distance / 42);
    const forward = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
    const right = new THREE.Vector3(forward.z, 0, -forward.x);
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) this.target.addScaledVector(forward, -speed);
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) this.target.addScaledVector(forward, speed);
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) this.target.addScaledVector(right, -speed);
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) this.target.addScaledVector(right, speed);
    this.target.x = THREE.MathUtils.clamp(this.target.x, -25, 25);
    this.target.z = THREE.MathUtils.clamp(this.target.z, -18, 20);
    this.applyCamera();
  }

  focusOn(x: number, z: number): void {
    this.target.x = x;
    this.target.z = z;
    this.applyCamera();
  }

  consumeDragMoved(): boolean {
    const moved = this.dragMoved;
    this.dragMoved = false;
    return moved;
  }

  dispose(): void {
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    this.canvas.removeEventListener('wheel', this.onWheel);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }

  private applyCamera(): void {
    const height = this.distance * 0.72;
    const radius = this.distance * 0.82;
    this.camera.position.set(
      this.target.x + Math.sin(this.yaw) * radius,
      height,
      this.target.z + Math.cos(this.yaw) * radius,
    );
    this.camera.lookAt(this.target.x, 0, this.target.z);
  }

  private readonly onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0) return;
    this.dragging = true;
    this.dragMoved = false;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
  };

  private readonly onPointerMove = (event: PointerEvent) => {
    if (!this.dragging) return;
    const dx = event.clientX - this.lastX;
    const dy = event.clientY - this.lastY;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    if (Math.abs(dx) + Math.abs(dy) > 2) this.dragMoved = true;
    this.yaw -= dx * 0.006;
    this.distance = THREE.MathUtils.clamp(this.distance + dy * 0.025, 25, 62);
    this.applyCamera();
  };

  private readonly onPointerUp = () => {
    this.dragging = false;
  };

  private readonly onWheel = (event: WheelEvent) => {
    event.preventDefault();
    this.distance = THREE.MathUtils.clamp(this.distance + event.deltaY * 0.018, 25, 62);
    this.applyCamera();
  };

  private readonly onKeyDown = (event: KeyboardEvent) => {
    this.keys.add(event.code);
  };

  private readonly onKeyUp = (event: KeyboardEvent) => {
    this.keys.delete(event.code);
  };
}
