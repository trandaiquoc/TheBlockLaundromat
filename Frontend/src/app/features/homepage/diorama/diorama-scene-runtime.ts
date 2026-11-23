import {
  ACESFilmicToneMapping,
  PCFShadowMap,
  PerspectiveCamera,
  SRGBColorSpace,
  WebGLRenderer,
} from 'three';
import type { Theme } from '../../../core/ui/theme/theme.service';
import type { DioramaFocus, DioramaIntent, DioramaTarget } from './diorama-contracts';
import type { DioramaTimeDialChange } from './diorama-time-dial.component';
import type { DioramaTimeAnimationUpdate, DioramaTimeTransition } from './diorama-time-transition';
import {
  dioramaTimeStageIndexAtProgress,
  dioramaTimeStageIndexByTheme,
} from './diorama-time-stages';
import { DioramaCameraRig } from './diorama-camera-rig';
import { DioramaInteractionController } from './diorama-interaction';
import { DioramaRaccoonController } from './diorama-raccoon-controller';
import { DioramaSceneAnimation } from './diorama-scene-animation';
import {
  DioramaProjectAnchorProjector,
  type DioramaProjectProjection,
} from './diorama-project-anchor-projector';
import { LAUNDROMAT_DIORAMA_PROFILE } from './diorama-scene-profile';
import {
  loadDioramaSceneAsset,
  type DioramaSceneAssetLoader,
  type DioramaSceneAsset,
} from './diorama-scene-loader';
import { DioramaSceneResources, disposeDioramaResources } from './diorama-scene-resources';
import { dioramaVariantForTheme } from './diorama-scene-theme';
import {
  buildDioramaScene,
  updateDioramaFeedback,
  type DioramaSceneAssets,
} from './diorama-scene-assets';

export interface DioramaRuntimeCallbacks {
  readonly onIntent: (intent: DioramaIntent) => void;
  readonly onTimeChange: (change: DioramaTimeDialChange) => void;
  readonly onTimeAnimationUpdate: (update: DioramaTimeAnimationUpdate) => void;
  readonly currentTimeProgress: () => number;
  readonly onWebGLUnavailable: (error?: unknown) => void;
  readonly onSceneLoaded: () => void;
  readonly onSceneLoadFailed: (error: unknown) => void;
  readonly onProjectProjection?: (projection: DioramaProjectProjection) => void;
}

export interface DioramaRuntimeAdapters {
  readonly createRenderer: (canvas: HTMLCanvasElement) => WebGLRenderer;
  readonly requestFrame: (callback: FrameRequestCallback) => number;
  readonly cancelFrame: (handle: number) => void;
  readonly loadSceneAsset: DioramaSceneAssetLoader;
}

const profile = LAUNDROMAT_DIORAMA_PROFILE;

const browserAdapters: DioramaRuntimeAdapters = {
  createRenderer: (canvas) =>
    new WebGLRenderer({
      canvas,
      alpha: profile.renderer.alpha,
      antialias: profile.renderer.antialias,
      powerPreference: profile.renderer.powerPreference,
    }),
  requestFrame: (callback) => globalThis.requestAnimationFrame(callback),
  cancelFrame: (handle) => globalThis.cancelAnimationFrame(handle),
  loadSceneAsset: loadDioramaSceneAsset,
};

/** Coordinates browser attachment, async loading, scene interaction, and teardown. */
export class DioramaSceneRuntime {
  private readonly adapters: DioramaRuntimeAdapters;
  private readonly resources = new DioramaSceneResources();
  private container?: HTMLElement;
  private canvas?: HTMLCanvasElement;
  private renderer?: WebGLRenderer;
  private assets?: DioramaSceneAssets;
  private camera?: PerspectiveCamera;
  private cameraRig?: DioramaCameraRig;
  private raccoonController?: DioramaRaccoonController;
  private interaction?: DioramaInteractionController;
  private animation?: DioramaSceneAnimation;
  private projectAnchorProjector?: DioramaProjectAnchorProjector;
  private projectionDiagnosticsEnabled = false;
  private sceneProjectionCount = 0;
  private sceneProjectionTotalMs = 0;
  private resizeObserver?: ResizeObserver;
  private window?: Window;
  private document?: Document;
  private motionQuery?: MediaQueryList;
  private sceneLoadAbortController?: AbortController;
  private hoveredTarget?: DioramaTarget;
  private selectedTarget?: DioramaTarget;
  private currentFocus: DioramaFocus = 'overview';
  private theme: Theme = 'craft';
  private timeProgress = dioramaTimeStageIndexByTheme[this.theme];
  private timeTransition: DioramaTimeTransition = {
    id: 0,
    phase: 'idle',
    progress: this.timeProgress,
    targetProgress: this.timeProgress,
    source: 'theme',
  };
  private systemReducedMotion = false;
  private sceneAnimationsEnabled = true;
  private reducedMotion = false;
  private disposed = false;
  private width = 0;
  private height = 0;
  private pixelRatio = 0;

  private readonly onResize = (): void => this.resize();
  private readonly onVisibilityChange = (): void => {
    this.animation?.setVisible(this.document?.visibilityState !== 'hidden');
  };
  private readonly onMotionChange = (event: MediaQueryListEvent): void => {
    this.systemReducedMotion = event.matches;
    this.updateMotionPreference();
  };
  private readonly onContextLost = (event: Event): void => {
    event.preventDefault();
    this.callbacks.onWebGLUnavailable();
  };

  constructor(
    private readonly callbacks: DioramaRuntimeCallbacks,
    adapters: Partial<DioramaRuntimeAdapters> = {},
  ) {
    this.adapters = { ...browserAdapters, ...adapters };
  }

  mount(container: HTMLElement): boolean {
    if (this.disposed || this.renderer) return false;
    const document = container.ownerDocument;
    const window = document.defaultView;
    if (!window) return false;

    const canvas = document.createElement('canvas');
    canvas.className = 'diorama-scene-runtime__canvas';
    canvas.setAttribute('aria-hidden', 'true');

    let renderer: WebGLRenderer;
    try {
      renderer = this.adapters.createRenderer(canvas);
    } catch (error) {
      this.callbacks.onWebGLUnavailable(error);
      return false;
    }

    this.resources.trackRenderer(renderer);
    this.container = container;
    this.canvas = canvas;
    this.renderer = renderer;
    this.camera = new PerspectiveCamera(
      profile.camera.fieldOfView,
      1,
      profile.camera.near,
      profile.camera.far,
    );
    this.window = window;
    this.document = document;
    this.projectionDiagnosticsEnabled = new URLSearchParams(window.location.search).has(
      'dioramaPerf',
    );
    this.motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    this.systemReducedMotion = this.motionQuery?.matches ?? false;
    this.reducedMotion = this.systemReducedMotion || !this.sceneAnimationsEnabled;

    try {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.autoUpdate = false;
      renderer.shadowMap.type = PCFShadowMap;
      renderer.outputColorSpace = SRGBColorSpace;
      renderer.toneMapping = ACESFilmicToneMapping;
      renderer.toneMappingExposure = profile.renderer.toneMappingExposure;
      renderer.setClearColor(0x000000, 0);
      container.appendChild(canvas);
      canvas.addEventListener('webglcontextlost', this.onContextLost);
      this.observeContainer();
      this.attachBrowserListeners();
      this.resize();
      this.loadScene(document.baseURI);
      return true;
    } catch (error) {
      this.dispose();
      throw error;
    }
  }

  focus(view: DioramaFocus): void {
    if (this.disposed) return;
    this.currentFocus = view;
    this.animation?.setRoomRotationEnabled(profile.motion.roomSpinFocuses.includes(view));
    this.selectedTarget = view === 'overview' ? undefined : view;
    if (view === 'overview') this.cameraRig?.recenter();
    else this.cameraRig?.focus(view);
    this.updateFeedback();
    this.animation?.invalidate();
  }

  orbitCamera(yawDelta: number, pitchDelta: number): void {
    if (this.disposed) return;
    this.cameraRig?.orbitBy(yawDelta, pitchDelta);
    this.animation?.invalidate();
  }

  panCamera(deltaX: number, deltaY: number, width: number, height: number): void {
    if (this.disposed) return;
    this.cameraRig?.panBy(deltaX, deltaY, width, height);
    this.animation?.invalidate();
  }

  zoomCamera(distanceScale: number): void {
    if (this.disposed) return;
    this.cameraRig?.zoomBy(distanceScale);
    this.animation?.invalidate();
  }

  setSceneAnimationsEnabled(enabled: boolean): void {
    if (this.disposed || this.sceneAnimationsEnabled === enabled) return;
    this.sceneAnimationsEnabled = enabled;
    this.updateMotionPreference();
  }

  setTheme(theme: Theme): void {
    if (this.disposed || this.theme === theme) return;
    this.theme = theme;
    this.canvas?.setAttribute('data-material-variant', dioramaVariantForTheme(theme));
    this.animation?.setTheme(theme);
  }

  setTimeTransition(transition: DioramaTimeTransition): void {
    if (this.disposed) return;
    this.timeTransition = transition;
    this.timeProgress = transition.progress;
    this.animation?.setTimeTransition(transition);
  }

  greetRaccoon(): void {
    if (this.disposed) return;
    this.currentFocus = 'raccoon';
    this.animation?.setRoomRotationEnabled(profile.motion.roomSpinFocuses.includes('raccoon'));
    this.selectedTarget = 'raccoon';
    this.cameraRig?.focus('raccoon');
    this.raccoonController?.greet();
    this.updateFeedback();
    this.animation?.invalidate();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.sceneLoadAbortController?.abort();
    this.sceneLoadAbortController = undefined;
    this.animation?.dispose();
    this.animation = undefined;
    this.projectAnchorProjector = undefined;
    this.raccoonController?.dispose();
    this.raccoonController = undefined;
    this.interaction?.dispose();
    this.interaction = undefined;

    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    this.window?.removeEventListener('resize', this.onResize);
    this.document?.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.motionQuery?.removeEventListener('change', this.onMotionChange);
    this.canvas?.removeEventListener('webglcontextlost', this.onContextLost);
    this.canvas?.remove();
    this.resources.dispose();

    this.assets = undefined;
    this.renderer = undefined;
    this.canvas = undefined;
    this.camera = undefined;
    this.cameraRig = undefined;
    this.window = undefined;
    this.document = undefined;
    this.motionQuery = undefined;
    this.container = undefined;
    this.hoveredTarget = undefined;
    this.selectedTarget = undefined;
  }

  private observeContainer(): void {
    const container = this.container;
    if (!container) return;
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(this.onResize);
      this.resizeObserver.observe(container);
    } else {
      this.window?.addEventListener('resize', this.onResize);
    }
  }

  private attachBrowserListeners(): void {
    this.document?.addEventListener('visibilitychange', this.onVisibilityChange);
    this.motionQuery?.addEventListener('change', this.onMotionChange);
  }

  private loadScene(baseURI: string): void {
    const abortController = new AbortController();
    this.sceneLoadAbortController = abortController;

    void Promise.resolve()
      .then(() => this.adapters.loadSceneAsset(baseURI, abortController.signal))
      .then((asset) => this.initializeScene(asset, abortController))
      .catch((error: unknown) => {
        if (this.disposed || abortController.signal.aborted) return;
        this.dispose();
        this.callbacks.onSceneLoadFailed(error);
      });
  }

  private initializeScene(asset: DioramaSceneAsset, abortController: AbortController): void {
    if (this.disposed || abortController.signal.aborted) {
      disposeDioramaResources(asset.root, asset.materialVariants.ownedMaterials, [
        asset.exteriorGroundTexture,
      ]);
      return;
    }

    try {
      const camera = this.camera;
      const renderer = this.renderer;
      const canvas = this.canvas;
      if (!camera || !renderer || !canvas) {
        throw new Error('The Diorama renderer was released before the room loaded.');
      }

      this.assets = buildDioramaScene(asset);
      this.projectAnchorProjector = new DioramaProjectAnchorProjector(this.assets);
      this.resources.trackScene(this.assets.scene, asset.materialVariants.ownedMaterials);
      this.cameraRig = new DioramaCameraRig(
        camera,
        this.assets.focusBounds,
        this.assets.cameraFocusTargets,
        this.assets.cameraFocusYaws,
      );
      this.cameraRig.setReducedMotion(this.reducedMotion);
      this.raccoonController = this.assets.raccoonControllerRoot
        ? new DioramaRaccoonController(
            this.assets.raccoonControllerRoot,
            profile.motion.raccoonIdleEnabled,
          )
        : undefined;
      this.raccoonController?.setReducedMotion(this.reducedMotion);
      this.interaction = new DioramaInteractionController(
        canvas,
        camera,
        this.assets.interactionRoots,
        {
          onIntent: this.callbacks.onIntent,
          onHover: (target) => this.setHoveredTarget(target),
          orbitCamera: (yawDelta, pitchDelta) => this.orbitCamera(yawDelta, pitchDelta),
          panCamera: (deltaX, deltaY, width, height) =>
            this.panCamera(deltaX, deltaY, width, height),
          zoomCamera: (distanceScale) => this.zoomCamera(distanceScale),
          onTimeChange: (progress, isDragging) =>
            this.callbacks.onTimeChange({
              index: dioramaTimeStageIndexAtProgress(progress),
              progress,
              isDragging,
              source: 'swipe',
            }),
          currentTimeProgress: () => this.callbacks.currentTimeProgress(),
        },
        () => profile.motion.roomSpinFocuses.includes(this.currentFocus),
        () => this.currentFocus === 'overview',
        this.assets.scene,
      );

      this.animation = new DioramaSceneAnimation(
        this.adapters,
        renderer,
        camera,
        this.assets,
        this.cameraRig,
        this.raccoonController,
        (update) => {
          this.timeProgress = update.progress;
          this.callbacks.onTimeAnimationUpdate(update);
        },
        this.reducedMotion,
        () => this.publishProjectProjection(),
      );
      this.animation.setVisible(this.document?.visibilityState !== 'hidden');
      this.animation.initializeTheme(this.theme);
      this.animation.initializeTimeProgress(
        this.timeProgress,
        profile.motion.roomSpinFocuses.includes(this.currentFocus),
      );
      this.animation.setTimeTransition(this.timeTransition);
      canvas.setAttribute('data-material-variant', dioramaVariantForTheme(this.theme));
      this.cameraRig.focus(this.currentFocus, true);
      this.updateFeedback();
      this.animation.invalidate();
      this.callbacks.onSceneLoaded();
    } catch (error) {
      if (!this.assets) {
        disposeDioramaResources(asset.root, asset.materialVariants.ownedMaterials, [
          asset.exteriorGroundTexture,
        ]);
      }
      throw error;
    }
  }

  private resize(): void {
    const container = this.container;
    const renderer = this.renderer;
    const camera = this.camera;
    if (!container || !renderer || !camera || this.disposed) return;

    const bounds = container.getBoundingClientRect();
    const width = Math.floor(bounds.width || container.clientWidth);
    const height = Math.floor(bounds.height || container.clientHeight);
    if (width <= 0 || height <= 0) return;

    const pixelRatio = Math.min(
      this.window?.devicePixelRatio ?? 1,
      profile.renderer.maximumPixelRatio,
    );
    const ratioChanged = pixelRatio !== this.pixelRatio;
    if (ratioChanged) {
      this.pixelRatio = pixelRatio;
      renderer.setPixelRatio(pixelRatio);
    }
    if (width !== this.width || height !== this.height || ratioChanged) {
      this.width = width;
      this.height = height;
      renderer.setSize(width, height, false);
    }
    if (this.cameraRig) this.cameraRig.resize(width, height);
    else {
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
    this.animation?.invalidate();
  }

  private publishProjectProjection(): void {
    if (
      !this.callbacks.onProjectProjection ||
      !this.camera ||
      this.width <= 0 ||
      this.height <= 0
    ) {
      return;
    }
    const projectionStartedAt = this.projectionDiagnosticsEnabled
      ? this.window?.performance.now()
      : undefined;
    const projection = this.projectAnchorProjector?.project(this.camera, this.width, this.height);
    if (!projection) return;
    if (projectionStartedAt !== undefined) {
      this.recordSceneProjectionDuration(this.window!.performance.now() - projectionStartedAt);
    }
    this.callbacks.onProjectProjection(projection);
  }

  private recordSceneProjectionDuration(durationMs: number): void {
    const canvas = this.canvas;
    if (!canvas) return;
    this.sceneProjectionCount++;
    this.sceneProjectionTotalMs += durationMs;
    canvas.dataset['sceneProjectionCount'] = String(this.sceneProjectionCount);
    canvas.dataset['sceneProjectionTotalMs'] = this.sceneProjectionTotalMs.toFixed(4);
  }

  private updateMotionPreference(): void {
    const reducedMotion = this.systemReducedMotion || !this.sceneAnimationsEnabled;
    if (this.reducedMotion === reducedMotion) return;
    this.reducedMotion = reducedMotion;
    this.cameraRig?.setReducedMotion(reducedMotion);
    this.raccoonController?.setReducedMotion(reducedMotion);
    this.animation?.setReducedMotion(reducedMotion);
  }

  private setHoveredTarget(target: DioramaTarget | undefined): void {
    if (this.hoveredTarget === target) return;
    this.hoveredTarget = target;
    this.updateFeedback();
    this.animation?.invalidate();
  }

  private updateFeedback(): void {
    if (!this.assets) return;
    updateDioramaFeedback(
      this.assets.focusMarkers,
      this.selectedTarget,
      this.hoveredTarget,
      profile,
    );
  }
}
