import { PerspectiveCamera, Vector3 } from 'three';
import type { MiniDioramaFocus } from './mini-diorama-contracts';

interface CameraPreset {
  readonly lookAt: readonly [number, number, number];
  readonly direction: readonly [number, number, number];
  readonly wideDistance: number;
  readonly portraitDistance: number;
}

const cameraPresets: Readonly<Record<MiniDioramaFocus, CameraPreset>> = {
  overview: {
    lookAt: [0, 1.7, -0.15],
    direction: [0.5, 0.58, 1],
    wideDistance: 9.3,
    portraitDistance: 12.2,
  },
  washer: {
    lookAt: [1.45, 1.12, -0.38],
    direction: [0.34, 0.32, 1],
    wideDistance: 4.5,
    portraitDistance: 6.2,
  },
  'project-board': {
    lookAt: [-0.42, 3.02, -2.15],
    direction: [0.2, 0.25, 1],
    wideDistance: 4.3,
    portraitDistance: 6.1,
  },
  raccoon: {
    lookAt: [-1.28, 1.38, 0.72],
    direction: [0.32, 0.24, 1],
    wideDistance: 4.7,
    portraitDistance: 6.5,
  },
};

const portraitAspectLimit = 0.82;
const transitionRate = 7.5;

export class MiniDioramaCameraRig {
  private readonly lookAt = new Vector3();
  private readonly targetLookAt = new Vector3();
  private readonly targetPosition = new Vector3();
  private aspect = 1;
  private reducedMotion = false;
  private moving = false;
  private view: MiniDioramaFocus = 'overview';

  constructor(private readonly camera: PerspectiveCamera) {
    this.focus('overview', true);
  }

  get currentView(): MiniDioramaFocus {
    return this.view;
  }

  get isMoving(): boolean {
    return this.moving;
  }

  resize(width: number, height: number): void {
    if (width <= 0 || height <= 0) return;
    this.aspect = width / height;
    this.camera.aspect = this.aspect;
    this.camera.fov = this.aspect < portraitAspectLimit ? 43 : 37;
    this.camera.updateProjectionMatrix();
    this.updateDestination();
    if (this.reducedMotion) this.applyDestination();
  }

  focus(view: MiniDioramaFocus, immediately = false): void {
    this.view = view;
    this.updateDestination();
    if (immediately || this.reducedMotion) this.applyDestination();
    else this.moving = true;
  }

  setReducedMotion(reducedMotion: boolean): void {
    this.reducedMotion = reducedMotion;
    if (reducedMotion) this.applyDestination();
  }

  update(deltaSeconds: number): boolean {
    if (!this.moving || this.reducedMotion) return false;
    const delta = Math.max(0, Math.min(deltaSeconds, 0.05));
    const alpha = 1 - Math.exp(-transitionRate * delta);
    this.camera.position.lerp(this.targetPosition, alpha);
    this.lookAt.lerp(this.targetLookAt, alpha);
    this.camera.lookAt(this.lookAt);

    if (this.camera.position.distanceToSquared(this.targetPosition) < 0.0004) {
      this.applyDestination();
    }
    return this.moving;
  }

  private updateDestination(): void {
    const preset = cameraPresets[this.view];
    this.targetLookAt.set(...preset.lookAt);
    const direction = new Vector3(...preset.direction).normalize();
    const portrait = this.aspect < portraitAspectLimit;
    const distance = portrait ? preset.portraitDistance : preset.wideDistance;
    this.targetPosition.copy(this.targetLookAt).addScaledVector(direction, distance);
  }

  private applyDestination(): void {
    this.camera.position.copy(this.targetPosition);
    this.lookAt.copy(this.targetLookAt);
    this.camera.lookAt(this.lookAt);
    this.moving = false;
  }
}
