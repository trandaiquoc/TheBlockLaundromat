import { Box3, MathUtils, PerspectiveCamera, Vector3 } from 'three';
import type { MiniDioramaFocus } from './mini-diorama-contracts';

const portraitAspectLimit = 0.82;
const transitionRate = 7.5;
const framePadding = 1.14;
const cameraDirection = new Vector3(0.5, 0.58, 1).normalize();
const worldUp = new Vector3(0, 1, 0);
const cameraRight = new Vector3().crossVectors(worldUp, cameraDirection).normalize();
const cameraUp = new Vector3().crossVectors(cameraDirection, cameraRight).normalize();

export class MiniDioramaCameraRig {
  private readonly lookAt = new Vector3();
  private readonly targetLookAt = new Vector3();
  private readonly targetPosition = new Vector3();
  private aspect = 1;
  private reducedMotion = false;
  private moving = false;
  private view: MiniDioramaFocus = 'overview';

  constructor(
    private readonly camera: PerspectiveCamera,
    private readonly focusBounds: Readonly<Record<MiniDioramaFocus, Box3>>,
    private readonly focusTargets: Readonly<Partial<Record<MiniDioramaFocus, Vector3>>> = {},
  ) {
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
    const bounds = this.focusBounds[this.view];
    this.targetLookAt.copy(this.focusTargets[this.view] ?? bounds.getCenter(new Vector3()));

    const verticalFov = MathUtils.degToRad(this.camera.fov);
    const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * this.aspect);
    const horizontalLimit = Math.tan(horizontalFov / 2);
    const verticalLimit = Math.tan(verticalFov / 2);
    let distance = 0;

    for (const x of [bounds.min.x, bounds.max.x]) {
      for (const y of [bounds.min.y, bounds.max.y]) {
        for (const z of [bounds.min.z, bounds.max.z]) {
          const offset = new Vector3(x, y, z).sub(this.targetLookAt);
          const towardCamera = offset.dot(cameraDirection);
          distance = Math.max(
            distance,
            Math.abs(offset.dot(cameraRight)) / horizontalLimit + towardCamera,
            Math.abs(offset.dot(cameraUp)) / verticalLimit + towardCamera,
          );
        }
      }
    }

    this.targetPosition
      .copy(this.targetLookAt)
      .addScaledVector(cameraDirection, Math.max(distance * framePadding, 0.1));
  }

  private applyDestination(): void {
    this.camera.position.copy(this.targetPosition);
    this.lookAt.copy(this.targetLookAt);
    this.camera.lookAt(this.lookAt);
    this.moving = false;
  }
}
