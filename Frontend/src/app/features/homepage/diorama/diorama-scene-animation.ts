import type { PerspectiveCamera, WebGLRenderer } from 'three';
import type { Theme } from '../../../core/ui/theme/theme.service';
import { DioramaCameraRig } from './diorama-camera-rig';
import { DioramaRaccoonController } from './diorama-raccoon-controller';
import type { DioramaSceneAssets } from './diorama-scene-assets';
import { applyDioramaTheme, createDioramaThemeTransition } from './diorama-scene-theme';
import type { DioramaTimeAnimationUpdate, DioramaTimeTransition } from './diorama-time-transition';

export interface DioramaAnimationScheduler {
  readonly requestFrame: (callback: FrameRequestCallback) => number;
  readonly cancelFrame: (handle: number) => void;
}

const maximumFrameDeltaSeconds = 0.05;

/** Owns scene frames, theme transitions, semantic room motion, and motion scheduling. */
export class DioramaSceneAnimation {
  private animationFrame?: number;
  private lastFrameTime?: number;
  private theme: Theme = 'craft';
  private themeTransition?: (progress: number) => void;
  private themeTransitionElapsed = 0;
  private timeTransitionId?: number;
  private timeTransitionActive = false;
  private timeTransitionElapsed = 0;
  private timeStartProgress = 0;
  private timeProgress = 0;
  private timeTargetProgress = 0;
  private timeTransitionDuration = 0;
  private roomRotationEnabled = true;
  private roomProgressOrigin = 0;
  private roomRotationOrigin = 0;
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
    private readonly onTimeAnimationUpdate: (update: DioramaTimeAnimationUpdate) => void,
    reducedMotion: boolean,
    private readonly onRenderedFrame: () => void = () => {},
  ) {
    this.reducedMotion = reducedMotion;
  }

  get isAnimating(): boolean {
    return this.animationFrame !== undefined;
  }

  setTheme(theme: Theme): void {
    if (this.disposed || this.theme === theme) return;
    this.theme = theme;
    this.themeTransition = createDioramaThemeTransition(this.assets, theme);
    this.themeTransitionElapsed = 0;
    if (this.assets.profile.shadows.materialVariantsChangeCasterSilhouette) {
      this.renderer.shadowMap.needsUpdate = true;
    }
    if (this.reducedMotion) {
      this.finishThemeTransition();
      this.render();
    }
    this.startAnimation();
  }

  initializeTimeProgress(progress: number, roomRotationEnabled: boolean): void {
    this.timeProgress = progress;
    this.timeTargetProgress = progress;
    this.roomRotationEnabled = roomRotationEnabled;
    this.roomProgressOrigin = progress;
    this.roomRotationOrigin = this.assets.roomSpinPivot.rotation.y;
  }

  setRoomRotationEnabled(enabled: boolean): void {
    if (this.disposed || this.roomRotationEnabled === enabled) return;
    this.roomRotationEnabled = enabled;
    this.roomProgressOrigin = this.timeProgress;
    this.roomRotationOrigin = this.assets.roomSpinPivot.rotation.y;
  }

  setTimeTransition(transition: DioramaTimeTransition): void {
    if (this.disposed) return;
    if (transition.phase === 'idle') {
      this.timeTransitionActive = false;
      this.timeProgress = transition.progress;
      this.timeTargetProgress = transition.targetProgress;
      this.stopIfIdle();
      return;
    }

    if (transition.phase === 'dragging') {
      this.timeTransitionId = transition.id;
      this.timeTransitionActive = false;
      this.timeProgress = transition.progress;
      this.timeTargetProgress = transition.progress;
      const previousRotation = this.assets.roomSpinPivot.rotation.y;
      this.applyRoomProgress(transition.progress);
      if (this.assets.roomSpinPivot.rotation.y !== previousRotation)
        this.renderWithUpdatedShadows();
      else this.render();
      this.stopIfIdle();
      return;
    }

    if (this.timeTransitionId === transition.id && this.timeTransitionActive) return;
    this.timeTransitionId = transition.id;
    this.timeStartProgress = this.timeProgress;
    this.timeTargetProgress = transition.targetProgress;
    this.timeTransitionElapsed = 0;
    const secondsPerTheme = this.assets.profile.motion.roomSpinDurationSeconds;
    this.timeTransitionDuration = Math.max(
      0.12,
      Math.abs(this.timeTargetProgress - this.timeStartProgress) * secondsPerTheme,
    );
    this.timeTransitionActive = Math.abs(this.timeTargetProgress - this.timeStartProgress) > 0.0001;

    if (this.reducedMotion || !this.timeTransitionActive) {
      this.finishTimeTransition();
      if (this.roomRotationEnabled) this.renderWithUpdatedShadows();
      else this.render();
      return;
    }
    this.startAnimation();
  }

  setReducedMotion(reducedMotion: boolean): void {
    if (this.disposed || this.reducedMotion === reducedMotion) return;
    this.reducedMotion = reducedMotion;
    if (reducedMotion) {
      this.finishThemeTransition();
      if (this.timeTransitionActive) this.finishTimeTransition();
      this.stopAnimation();
    } else {
      this.startAnimation();
    }
    this.renderWithUpdatedShadows();
  }

  setVisible(visible: boolean): void {
    if (this.disposed || this.visible === visible) return;
    this.visible = visible;
    if (visible) {
      this.renderWithUpdatedShadows();
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
    this.renderer.shadowMap.needsUpdate = true;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.stopAnimation();
    this.themeTransition = undefined;
    this.timeTransitionActive = false;
  }

  private startAnimation(): void {
    if (this.disposed || this.reducedMotion || !this.visible) return;
    if (!this.hasActiveMotion() || this.animationFrame !== undefined) return;
    this.animationFrame = this.scheduler.requestFrame(this.onAnimationFrame);
  }

  private hasActiveMotion(): boolean {
    return Boolean(
      this.themeTransition ||
      this.timeTransitionActive ||
      this.cameraRig.isMoving ||
      this.raccoonController?.isAnimating,
    );
  }

  private stopIfIdle(): void {
    if (!this.hasActiveMotion()) this.stopAnimation();
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
    const roomMoving = this.timeTransitionActive && this.roomRotationEnabled;
    const shadowCastersMoving = roomMoving || Boolean(this.raccoonController?.isGreeting);
    this.updateThemeTransition(deltaSeconds);
    this.updateTimeTransition(deltaSeconds);
    this.raccoonController?.update(deltaSeconds);
    this.cameraRig.update(deltaSeconds);
    if (shadowCastersMoving) this.renderWithUpdatedShadows();
    else this.render();
    this.startAnimation();
  };

  private render(): void {
    if (this.disposed) return;
    this.renderer.render(this.assets.scene, this.camera);
    this.onRenderedFrame();
  }

  private renderWithUpdatedShadows(): void {
    if (this.disposed) return;
    this.renderer.shadowMap.needsUpdate = true;
    this.render();
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

  private updateTimeTransition(deltaSeconds: number): void {
    if (!this.timeTransitionActive) return;
    this.timeTransitionElapsed += deltaSeconds;
    const progress = Math.min(this.timeTransitionElapsed / this.timeTransitionDuration, 1);
    const easedProgress = progress * progress * (3 - 2 * progress);
    this.timeProgress =
      this.timeStartProgress + (this.timeTargetProgress - this.timeStartProgress) * easedProgress;
    this.applyRoomProgress(this.timeProgress);
    const id = this.timeTransitionId;
    if (id !== undefined) {
      this.onTimeAnimationUpdate({ id, progress: this.timeProgress, finished: progress >= 1 });
    }
    if (progress >= 1) this.timeTransitionActive = false;
  }

  private finishTimeTransition(): void {
    this.timeProgress = this.timeTargetProgress;
    this.applyRoomProgress(this.timeProgress);
    this.timeTransitionActive = false;
    this.timeTransitionElapsed = 0;
    const id = this.timeTransitionId;
    if (id !== undefined) {
      this.onTimeAnimationUpdate({ id, progress: this.timeProgress, finished: true });
    }
  }

  private applyRoomProgress(progress: number): void {
    if (!this.roomRotationEnabled) return;
    this.assets.roomSpinPivot.rotation.y =
      this.roomRotationOrigin +
      (progress - this.roomProgressOrigin) * this.assets.profile.motion.roomSpinRadians;
  }
}
