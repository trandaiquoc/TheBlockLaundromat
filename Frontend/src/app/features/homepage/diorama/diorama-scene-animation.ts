import type { PerspectiveCamera, WebGLRenderer } from 'three';
import type { Theme } from '../../../core/ui/theme/theme.service';
import { DioramaCameraRig } from './diorama-camera-rig';
import { DioramaRaccoonController } from './diorama-raccoon-controller';
import type { DioramaSceneAssets } from './diorama-scene-assets';
import {
  applyDioramaTheme,
  createDioramaThemeTransition,
  dioramaVariantForTheme,
} from './diorama-scene-theme';
import { dioramaTimeDirectionBetweenThemes } from './diorama-time-stages';

export interface DioramaAnimationScheduler {
  readonly requestFrame: (callback: FrameRequestCallback) => number;
  readonly cancelFrame: (handle: number) => void;
}

const maximumFrameDeltaSeconds = 0.05;

/** Owns scene frames, theme transitions, room rotation, and motion scheduling. */
export class DioramaSceneAnimation {
  private animationFrame?: number;
  private lastFrameTime?: number;
  private theme: Theme = 'craft';
  private themeTransition?: (progress: number) => void;
  private themeTransitionElapsed = 0;
  private roomSpinElapsed = 0;
  private roomSpinStartRotation = 0;
  private roomSpinOriginRotation = 0;
  private roomSpinTargetRotation = 0;
  private roomSpinInitialDirection = 1;
  private roomSpinActive = false;
  private reducedMotion: boolean;
  private disposed = false;
  private visible = true;

  constructor(
    private readonly scheduler: DioramaAnimationScheduler,
    private readonly renderer: WebGLRenderer,
    private readonly camera: PerspectiveCamera,
    private readonly assets: DioramaSceneAssets,
    private readonly cameraRig: DioramaCameraRig,
    private readonly raccoonController: DioramaRaccoonController | undefined,
    reducedMotion: boolean,
  ) {
    this.reducedMotion = reducedMotion;
  }

  get isAnimating(): boolean {
    return this.animationFrame !== undefined;
  }

  setTheme(theme: Theme, spinRoom: boolean): void {
    if (this.disposed || this.theme === theme) return;
    const previousTheme = this.theme;
    this.theme = theme;
    this.assets.materialVariants.apply(dioramaVariantForTheme(theme));
    if (spinRoom) this.startRoomSpin(dioramaTimeDirectionBetweenThemes(previousTheme, theme));
    this.themeTransition = createDioramaThemeTransition(this.assets, theme);
    this.themeTransitionElapsed = 0;
    if (this.reducedMotion) this.finishThemeTransition();
    this.render();
    this.startAnimation();
  }

  setReducedMotion(reducedMotion: boolean): void {
    if (this.disposed || this.reducedMotion === reducedMotion) return;
    this.reducedMotion = reducedMotion;
    if (reducedMotion) {
      this.finishThemeTransition();
      this.finishRoomSpin();
      this.stopAnimation();
    } else {
      this.startAnimation();
    }
    this.render();
  }

  setVisible(visible: boolean): void {
    if (this.disposed || this.visible === visible) return;
    this.visible = visible;
    if (visible) {
      this.render();
      this.startAnimation();
    } else {
      this.stopAnimation();
    }
  }

  invalidate(): void {
    if (this.disposed) return;
    this.render();
    this.startAnimation();
  }

  initializeTheme(theme: Theme): void {
    this.theme = theme;
    applyDioramaTheme(this.assets, theme);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.stopAnimation();
    this.themeTransition = undefined;
    this.roomSpinActive = false;
  }

  private startAnimation(): void {
    if (this.disposed || this.reducedMotion || !this.visible) return;
    if (!this.hasActiveMotion() || this.animationFrame !== undefined) return;
    this.animationFrame = this.scheduler.requestFrame(this.onAnimationFrame);
  }

  private hasActiveMotion(): boolean {
    return Boolean(
      this.themeTransition ||
      this.roomSpinActive ||
      this.cameraRig.isMoving ||
      this.raccoonController?.isAnimating,
    );
  }

  private stopAnimation(): void {
    if (this.animationFrame === undefined) return;
    this.scheduler.cancelFrame(this.animationFrame);
    this.animationFrame = undefined;
    this.lastFrameTime = undefined;
  }

  private readonly onAnimationFrame: FrameRequestCallback = (timestamp): void => {
    this.animationFrame = undefined;
    if (this.disposed || this.reducedMotion || !this.visible) return;
    const elapsedSeconds =
      this.lastFrameTime === undefined ? 0 : Math.max((timestamp - this.lastFrameTime) / 1000, 0);
    const deltaSeconds = Math.min(elapsedSeconds, maximumFrameDeltaSeconds);
    this.lastFrameTime = timestamp;
    this.updateThemeTransition(deltaSeconds);
    this.updateRoomSpin(elapsedSeconds);
    this.raccoonController?.update(deltaSeconds);
    this.cameraRig.update(deltaSeconds);
    this.render();
    this.startAnimation();
  };

  private render(): void {
    if (this.disposed) return;
    this.renderer.render(this.assets.scene, this.camera);
  }

  private updateThemeTransition(deltaSeconds: number): void {
    if (!this.themeTransition) return;
    this.themeTransitionElapsed += deltaSeconds;
    const progress = Math.min(
      this.themeTransitionElapsed / this.assets.profile.motion.themeTransitionDurationSeconds,
      1,
    );
    const easedProgress = 1 - (1 - progress) ** 3;
    this.themeTransition(easedProgress);
    if (progress >= 1) this.finishThemeTransition();
  }

  private finishThemeTransition(): void {
    this.themeTransition?.(1);
    this.themeTransition = undefined;
    this.themeTransitionElapsed = 0;
  }

  private startRoomSpin(direction: 'clockwise' | 'counterclockwise'): void {
    const pivot = this.assets.roomSpinPivot;
    if (this.reducedMotion) return;
    const requestedDirection = direction === 'clockwise' ? 1 : -1;
    if (!this.roomSpinActive) {
      this.roomSpinOriginRotation = pivot.rotation.y;
      this.roomSpinInitialDirection = requestedDirection;
      this.roomSpinStartRotation = this.roomSpinOriginRotation;
      this.roomSpinTargetRotation =
        this.roomSpinOriginRotation +
        requestedDirection * this.assets.profile.motion.roomSpinRadians;
      this.roomSpinElapsed = 0;
      this.roomSpinActive = true;
      return;
    }

    const requestedTarget =
      requestedDirection === this.roomSpinInitialDirection
        ? this.roomSpinOriginRotation +
          this.roomSpinInitialDirection * this.assets.profile.motion.roomSpinRadians
        : this.roomSpinOriginRotation;
    if (requestedTarget === this.roomSpinTargetRotation) return;
    this.roomSpinStartRotation = pivot.rotation.y;
    this.roomSpinTargetRotation = requestedTarget;
    this.roomSpinElapsed = 0;
  }

  private updateRoomSpin(deltaSeconds: number): void {
    const pivot = this.assets.roomSpinPivot;
    if (!this.roomSpinActive) return;
    this.roomSpinElapsed += deltaSeconds;
    const progress = Math.min(
      this.roomSpinElapsed / this.assets.profile.motion.roomSpinDurationSeconds,
      1,
    );
    const easedProgress = progress ** 3 * (progress * (progress * 6 - 15) + 10);
    pivot.rotation.y =
      this.roomSpinStartRotation +
      (this.roomSpinTargetRotation - this.roomSpinStartRotation) * easedProgress;
    if (progress >= 1) this.finishRoomSpin();
  }

  private finishRoomSpin(): void {
    this.assets.roomSpinPivot.rotation.y = this.roomSpinOriginRotation;
    this.roomSpinTargetRotation = this.roomSpinOriginRotation;
    this.roomSpinElapsed = 0;
    this.roomSpinActive = false;
  }
}
