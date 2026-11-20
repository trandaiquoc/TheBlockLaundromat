import {
  ACESFilmicToneMapping,
  PCFShadowMap,
  SRGBColorSpace,
  PerspectiveCamera,
  WebGLRenderer,
} from 'three';
import type { Theme } from '../../core/ui/theme/theme.service';
import type {
  MiniDioramaFocus,
  MiniDioramaIntent,
  MiniDioramaTarget,
} from './mini-diorama-contracts';
import { MiniDioramaCameraRig } from './mini-diorama-camera-rig';
import { MiniDioramaInteractionController } from './mini-diorama-interaction';
import { MiniDioramaRaccoonController } from './mini-diorama-raccoon-controller';
import {
  loadMiniDioramaSceneAsset,
  type MiniDioramaSceneAssetLoader,
  type MiniDioramaSceneAsset,
} from './mini-diorama-scene-loader';
import { applyMiniDioramaTheme, miniDioramaVariantForTheme } from './mini-diorama-scene-theme';
import { disposeMiniDioramaResources } from './mini-diorama-scene-resources';
import type { MiniDioramaSceneKind } from './mini-diorama-scene-contract';
import {
  buildMiniDioramaScene,
  updateMiniDioramaFeedback,
  type MiniDioramaSceneAssets,
} from './mini-diorama-scene-assets';

export interface MiniDioramaRuntimeCallbacks {
  readonly onIntent: (intent: MiniDioramaIntent) => void;
  readonly onWebGLUnavailable: () => void;
  readonly onSceneLoaded: () => void;
  readonly onSceneLoadFailed: (error: unknown) => void;
}

export interface MiniDioramaRuntimeAdapters {
  readonly createRenderer: (canvas: HTMLCanvasElement) => WebGLRenderer;
  readonly requestFrame: (callback: FrameRequestCallback) => number;
  readonly cancelFrame: (handle: number) => void;
  readonly loadSceneAsset: MiniDioramaSceneAssetLoader;
}

const browserAdapters: MiniDioramaRuntimeAdapters = {
  createRenderer: (canvas) =>
    new WebGLRenderer({ canvas, antialias: true, powerPreference: 'low-power' }),
  requestFrame: (callback) => globalThis.requestAnimationFrame(callback),
  cancelFrame: (handle) => globalThis.cancelAnimationFrame(handle),
  loadSceneAsset: loadMiniDioramaSceneAsset,
};

const maximumPixelRatio = 1.75;
const maximumFrameDeltaSeconds = 0.05;

export class MiniDioramaSceneRuntime {
  private readonly adapters: MiniDioramaRuntimeAdapters;
  private container?: HTMLElement;
  private canvas?: HTMLCanvasElement;
  private renderer?: WebGLRenderer;
  private loadedAsset?: MiniDioramaSceneAsset;
  private assets?: MiniDioramaSceneAssets;
  private camera?: PerspectiveCamera;
  private cameraRig?: MiniDioramaCameraRig;
  private raccoonController?: MiniDioramaRaccoonController;
  private interaction?: MiniDioramaInteractionController;
  private resizeObserver?: ResizeObserver;
  private window?: Window;
  private document?: Document;
  private motionQuery?: MediaQueryList;
  private sceneLoadAbortController?: AbortController;
  private animationFrame?: number;
  private lastFrameTime?: number;
  private hoveredTarget?: MiniDioramaTarget;
  private selectedTarget?: MiniDioramaTarget;
  private currentFocus: MiniDioramaFocus = 'overview';
  private theme: Theme = 'craft';
  private reducedMotion = false;
  private disposed = false;

  private readonly onResize = (): void => this.resize();
  private readonly onVisibilityChange = (): void => {
    if (this.document?.visibilityState === 'hidden') this.stopAnimation();
    else this.startAnimation();
  };
  private readonly onMotionChange = (event: MediaQueryListEvent): void => {
    this.setReducedMotion(event.matches);
  };
  private readonly onContextLost = (event: Event): void => {
    event.preventDefault();
    this.callbacks.onWebGLUnavailable();
  };

  constructor(
    private readonly callbacks: MiniDioramaRuntimeCallbacks,
    adapters: Partial<MiniDioramaRuntimeAdapters> = {},
    private readonly sceneKind: MiniDioramaSceneKind = 'integration-preview',
  ) {
    this.adapters = { ...browserAdapters, ...adapters };
  }

  mount(container: HTMLElement): boolean {
    if (this.disposed || this.renderer) return false;
    const document = container.ownerDocument;
    const window = document.defaultView;
    if (!window) return false;

    const canvas = document.createElement('canvas');
    canvas.className = 'mini-diorama-preview__canvas';
    canvas.setAttribute('aria-hidden', 'true');

    let renderer: WebGLRenderer;
    try {
      renderer = this.adapters.createRenderer(canvas);
    } catch {
      this.callbacks.onWebGLUnavailable();
      return false;
    }

    this.container = container;
    this.canvas = canvas;
    this.renderer = renderer;
    this.camera = new PerspectiveCamera(37, 1, 0.1, 100);
    this.window = window;
    this.document = document;
    this.motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    this.reducedMotion = this.motionQuery?.matches ?? false;

    try {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = PCFShadowMap;
      renderer.outputColorSpace = SRGBColorSpace;
      renderer.toneMapping = ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.08;
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

  focus(view: MiniDioramaFocus): void {
    if (this.disposed) return;
    this.currentFocus = view;
    this.selectedTarget = view === 'overview' ? undefined : view;
    this.cameraRig?.focus(view);
    this.updateFeedback();
    this.render();
    this.startAnimation();
  }

  setTheme(theme: Theme): void {
    if (this.disposed) return;
    this.theme = theme;
    if (!this.assets) return;
    applyMiniDioramaTheme(this.assets, theme);
    this.canvas?.setAttribute('data-material-variant', miniDioramaVariantForTheme(theme));
    this.render();
  }

  greetRaccoon(): void {
    if (this.disposed) return;
    this.currentFocus = 'raccoon';
    this.selectedTarget = 'raccoon';
    this.cameraRig?.focus('raccoon');
    this.raccoonController?.greet();
    this.updateFeedback();
    this.render();
    this.startAnimation();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.stopAnimation();
    this.sceneLoadAbortController?.abort();
    this.sceneLoadAbortController = undefined;
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

    if (this.assets && this.loadedAsset) {
      disposeMiniDioramaResources(
        this.assets.scene,
        this.loadedAsset.materialVariants.ownedMaterials,
      );
    } else if (this.loadedAsset) {
      disposeMiniDioramaResources(
        this.loadedAsset.root,
        this.loadedAsset.materialVariants.ownedMaterials,
      );
    }
    this.assets = undefined;
    this.loadedAsset = undefined;
    this.renderer?.dispose();
    this.renderer = undefined;
    this.canvas?.remove();
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
      .then(() => this.adapters.loadSceneAsset(baseURI, abortController.signal, this.sceneKind))
      .then((asset) => {
        if (this.disposed || abortController.signal.aborted) {
          disposeMiniDioramaResources(asset.root, asset.materialVariants.ownedMaterials);
          return;
        }

        this.loadedAsset = asset;
        this.assets = buildMiniDioramaScene(asset);
        const camera = this.camera;
        if (!camera) throw new Error('The preview camera was released before the scene loaded.');

        this.cameraRig = new MiniDioramaCameraRig(
          camera,
          this.assets.focusBounds,
          this.assets.cameraFocusTargets,
        );
        this.cameraRig.setReducedMotion(this.reducedMotion);
        if (this.assets.raccoonControllerRoot) {
          this.raccoonController = new MiniDioramaRaccoonController(
            this.assets.raccoonControllerRoot,
          );
          this.raccoonController.setReducedMotion(this.reducedMotion);
        }
        this.interaction = new MiniDioramaInteractionController(
          this.canvas!,
          camera,
          this.assets.interactionRoots,
          this.callbacks.onIntent,
          (target) => this.setHoveredTarget(target),
        );

        this.setTheme(this.theme);
        this.resize();
        this.cameraRig.focus(this.currentFocus, true);
        this.updateFeedback();
        this.render();
        this.callbacks.onSceneLoaded();
        this.startAnimation();
      })
      .catch((error: unknown) => {
        if (this.disposed || abortController.signal.aborted) return;
        this.dispose();
        this.callbacks.onSceneLoadFailed(error);
      });
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

    const pixelRatio = Math.min(this.window?.devicePixelRatio ?? 1, maximumPixelRatio);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
    if (this.cameraRig) this.cameraRig.resize(width, height);
    else {
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
    this.render();
  }

  private setReducedMotion(reducedMotion: boolean): void {
    if (this.reducedMotion === reducedMotion) return;
    this.reducedMotion = reducedMotion;
    this.cameraRig?.setReducedMotion(reducedMotion);
    this.raccoonController?.setReducedMotion(reducedMotion);
    this.render();
    if (reducedMotion) this.stopAnimation();
    else this.startAnimation();
  }

  private setHoveredTarget(target: MiniDioramaTarget | undefined): void {
    if (this.hoveredTarget === target) return;
    this.hoveredTarget = target;
    this.updateFeedback();
    this.render();
  }

  private updateFeedback(): void {
    if (!this.assets) return;
    updateMiniDioramaFeedback(this.assets.focusMarkers, this.selectedTarget, this.hoveredTarget);
  }

  private startAnimation(): void {
    if (this.disposed || this.reducedMotion || this.document?.visibilityState === 'hidden') return;
    if (this.animationFrame !== undefined) return;
    this.animationFrame = this.adapters.requestFrame(this.onAnimationFrame);
  }

  private stopAnimation(): void {
    if (this.animationFrame === undefined) return;
    this.adapters.cancelFrame(this.animationFrame);
    this.animationFrame = undefined;
    this.lastFrameTime = undefined;
  }

  private readonly onAnimationFrame: FrameRequestCallback = (timestamp): void => {
    this.animationFrame = undefined;
    if (this.disposed || this.reducedMotion || this.document?.visibilityState === 'hidden') return;

    const deltaSeconds =
      this.lastFrameTime === undefined
        ? 0
        : Math.min((timestamp - this.lastFrameTime) / 1000, maximumFrameDeltaSeconds);
    this.lastFrameTime = timestamp;
    this.raccoonController?.update(deltaSeconds);
    this.cameraRig?.update(deltaSeconds);
    this.render();
    this.startAnimation();
  };

  private render(): void {
    if (!this.renderer || !this.assets || !this.camera || this.disposed) return;
    this.renderer.render(this.assets.scene, this.camera);
  }
}
