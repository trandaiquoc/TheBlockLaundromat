import { Box3, MathUtils, PerspectiveCamera, Vector3 } from 'three';
import type { DioramaFocus } from './diorama-contracts';

const portraitAspectLimit = 0.82;
const transitionRate = 7.5;
const landscapeFramePadding = 1.36;
const portraitFramePadding = 1.16;
const landscapeBoardFramePadding = 1.08;
const portraitBoardFramePadding = 1.04;
const landscapeWasherFramePadding = 1.42;
const portraitWasherFramePadding = 1.52;
const landscapeRaccoonFramePadding = 1.05;
const portraitRaccoonFramePadding = 1.05;
const courierLeftCompositionOffset = 0.24;
const defaultCameraYaw = Math.atan2(0.62, 1);
const defaultCameraElevation = Math.atan2(0.72, Math.hypot(0.62, 1));
const frontCameraElevation = 0.035;
const characterCameraElevation = 0.12;
const minimumOrbitYaw = -0.34;
const maximumOrbitYaw = 0.34;
const minimumOrbitPitch = -0.13;
const maximumOrbitPitch = 0.14;
const minimumZoom = 0.88;
const maximumZoom = 1.34;
export class DioramaCameraRig {
  private readonly lookAt = new Vector3();
  private readonly targetLookAt = new Vector3();
  private readonly focusLookAt = new Vector3();
  private readonly targetPosition = new Vector3();
  private readonly cameraDirection = new Vector3();
  private readonly cameraRight = new Vector3();
  private readonly cameraUp = new Vector3();
  private readonly panOffset = new Vector3();
  private aspect = 1;
  private reducedMotion = false;
  private moving = false;
  private view: DioramaFocus = 'overview';
  private orbitYaw = 0;
  private orbitPitch = 0;
  private zoom = 1;
  private motionSettled?: () => void;

  constructor(
    private readonly camera: PerspectiveCamera,
    private readonly focusBounds: Readonly<Record<DioramaFocus, Box3>>,
    private readonly focusTargets: Readonly<Partial<Record<DioramaFocus, Vector3>>> = {},
    private readonly focusYaws: Readonly<Partial<Record<DioramaFocus, number>>> = {},
  ) {
    this.focus('overview', true);
  }

  get currentView(): DioramaFocus {
    return this.view;
  }

  get isMoving(): boolean {
    return this.moving;
  }

  resize(width: number, height: number): void {
    if (width <= 0 || height <= 0) return;
    this.aspect = width / height;
    this.camera.aspect = this.aspect;
    this.camera.fov = this.aspect < portraitAspectLimit ? 47 : 39;
    this.camera.updateProjectionMatrix();
    this.updateDestination();
    this.moveToDestination();
  }

  focus(view: DioramaFocus, immediately = false, onSettled?: () => void): void {
    this.view = view;
    this.orbitYaw = 0;
    this.orbitPitch = 0;
    this.zoom = 1;
    this.panOffset.set(0, 0, 0);
    this.motionSettled = onSettled;
    this.updateDestination();
    if (immediately || this.reducedMotion) this.applyDestination();
    else this.moving = true;
  }

  orbitBy(yawDelta: number, pitchDelta: number): void {
    if (!Number.isFinite(yawDelta) || !Number.isFinite(pitchDelta)) return;
    this.orbitYaw = MathUtils.clamp(this.orbitYaw + yawDelta, minimumOrbitYaw, maximumOrbitYaw);
    this.orbitPitch = MathUtils.clamp(
      this.orbitPitch + pitchDelta,
      minimumOrbitPitch,
      maximumOrbitPitch,
    );
    this.updateDestination();
    this.applyDestination();
  }

  zoomBy(distanceScale: number): void {
    if (!Number.isFinite(distanceScale) || distanceScale <= 0) return;
    this.zoom = MathUtils.clamp(this.zoom * distanceScale, minimumZoom, maximumZoom);
    this.updateDestination();
    if (this.reducedMotion) this.applyDestination();
    else this.moving = true;
  }

  panBy(deltaX: number, deltaY: number, width: number, height: number): void {
    if (
      !Number.isFinite(deltaX) ||
      !Number.isFinite(deltaY) ||
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      width <= 0 ||
      height <= 0
    ) {
      return;
    }

    const distance = this.camera.position.distanceTo(this.lookAt);
    const verticalSpan = 2 * distance * Math.tan(MathUtils.degToRad(this.camera.fov) / 2);
    const horizontalSpan = verticalSpan * this.aspect;
    this.panOffset.addScaledVector(this.cameraRight, (-deltaX * horizontalSpan) / width);
    this.panOffset.addScaledVector(this.cameraUp, (deltaY * verticalSpan) / height);

    const boundsSize = this.focusBounds.overview.getSize(new Vector3());
    this.panOffset.x = MathUtils.clamp(this.panOffset.x, -boundsSize.x * 0.28, boundsSize.x * 0.28);
    this.panOffset.y = MathUtils.clamp(this.panOffset.y, -boundsSize.y * 0.2, boundsSize.y * 0.2);
    this.panOffset.z = MathUtils.clamp(this.panOffset.z, -boundsSize.z * 0.28, boundsSize.z * 0.28);
    this.updateDestination();
    this.applyDestination();
  }

  recenter(): void {
    this.orbitYaw = 0;
    this.orbitPitch = 0;
    this.zoom = 1;
    this.panOffset.set(0, 0, 0);
    this.focus('overview');
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

    if (
      this.camera.position.distanceToSquared(this.targetPosition) < 0.0004 &&
      this.lookAt.distanceToSquared(this.targetLookAt) < 0.0004
    ) {
      this.applyDestination();
    }
    return this.moving;
  }

  private moveToDestination(): void {
    if (this.reducedMotion) this.applyDestination();
    else this.moving = true;
  }

  private updateDestination(): void {
    const bounds = this.focusBounds[this.view];
    this.focusLookAt.copy(this.focusTargets[this.view] ?? bounds.getCenter(new Vector3()));
    this.targetLookAt.copy(this.focusLookAt).add(this.panOffset);

    const yaw = (this.focusYaws[this.view] ?? defaultCameraYaw) + this.orbitYaw;
    const baseElevation =
      this.focusYaws[this.view] !== undefined
        ? frontCameraElevation
        : this.view === 'courier' && this.focusYaws.washer !== undefined
          ? characterCameraElevation
          : defaultCameraElevation;
    const elevation = MathUtils.clamp(
      baseElevation + this.orbitPitch,
      minimumOrbitPitch + frontCameraElevation,
      maximumOrbitPitch + defaultCameraElevation,
    );
    const horizontal = Math.cos(elevation);
    this.cameraDirection.set(
      Math.sin(yaw) * horizontal,
      Math.sin(elevation),
      Math.cos(yaw) * horizontal,
    );
    this.cameraDirection.normalize();
    this.cameraRight.set(Math.cos(yaw), 0, -Math.sin(yaw)).normalize();
    this.cameraUp.crossVectors(this.cameraDirection, this.cameraRight).normalize();

    const verticalFov = MathUtils.degToRad(this.camera.fov);
    const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * this.aspect);
    const horizontalLimit = Math.tan(horizontalFov / 2);
    const verticalLimit = Math.tan(verticalFov / 2);
    const responsiveFramePadding =
      this.aspect < portraitAspectLimit ? portraitFramePadding : landscapeFramePadding;
    const focusFramePadding =
      this.view === 'project-board'
        ? this.aspect < portraitAspectLimit
          ? portraitBoardFramePadding
          : landscapeBoardFramePadding
        : this.view === 'washer'
          ? this.aspect < portraitAspectLimit
            ? portraitWasherFramePadding
            : landscapeWasherFramePadding
          : this.view === 'courier'
            ? this.aspect < portraitAspectLimit
              ? portraitRaccoonFramePadding
              : landscapeRaccoonFramePadding
            : responsiveFramePadding;
    let distance = 0;

    for (const x of [bounds.min.x, bounds.max.x]) {
      for (const y of [bounds.min.y, bounds.max.y]) {
        for (const z of [bounds.min.z, bounds.max.z]) {
          const offset = new Vector3(x, y, z).sub(this.focusLookAt);
          const towardCamera = offset.dot(this.cameraDirection);
          distance = Math.max(
            distance,
            Math.abs(offset.dot(this.cameraRight)) / horizontalLimit + towardCamera,
            Math.abs(offset.dot(this.cameraUp)) / verticalLimit + towardCamera,
          );
        }
      }
    }

    const compositionOffset =
      this.view === 'courier' && this.aspect >= portraitAspectLimit
        ? courierLeftCompositionOffset
        : 0;
    if (compositionOffset > 0) distance /= 1 - compositionOffset;
    const framedDistance = Math.max(distance * focusFramePadding * this.zoom, 0.1);
    this.targetLookAt
      .copy(this.focusLookAt)
      .add(this.panOffset)
      .addScaledVector(
        this.cameraRight,
        Math.tan(horizontalFov / 2) * framedDistance * compositionOffset,
      );

    this.targetPosition
      .copy(this.targetLookAt)
      .addScaledVector(this.cameraDirection, framedDistance);
  }

  private applyDestination(): void {
    this.camera.position.copy(this.targetPosition);
    this.lookAt.copy(this.targetLookAt);
    this.camera.lookAt(this.lookAt);
    this.moving = false;
    const onSettled = this.motionSettled;
    this.motionSettled = undefined;
    onSettled?.();
  }
}
