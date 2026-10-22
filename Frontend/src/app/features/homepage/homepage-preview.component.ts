import { DOCUMENT } from '@angular/common';
import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { SettingsDialogComponent } from '../editor/settings/settings-dialog/settings-dialog.component';
import { I18nService } from '../../core/ui/localization/i18n.service';
import { ThemeService, type Theme } from '../../core/ui/theme/theme.service';
import { ProjectScreenAccountComponent } from '../projects/project-screen/project-screen-account.component';
import { ProjectScreenControlsComponent } from '../projects/project-screen/project-screen-controls.component';
import { buildHomepageSceneGraph, type HomepageSceneGraph } from './homepage-scene-graph';
import {
  HomepageSceneAssetLoader,
  type LoadedHomepageSceneAssets,
} from './homepage-scene-asset-loader';
import {
  parseHomepageSceneManifest,
  type HomepageArtworkTheme,
  type HomepageSceneManifest,
} from './homepage-scene-manifest';
import { drawHomepageScene } from './homepage-scene-renderer';

interface HomepageSceneMetrics {
  readonly loadDurationMs: number;
  readonly encodedBytes: number;
  readonly decodedBytesEstimate: number;
  readonly renderDurationMs: number;
}

const artworkThemeByApplicationTheme: Readonly<Record<Theme, HomepageArtworkTheme>> = {
  craft: 'minecraft',
  light: 'light',
  raccoon: 'raccoon',
  dark: 'dark',
};

const rasterControlsReplacedByDom = new Set(['navigation', 'account']);

@Component({
  selector: 'app-homepage-preview',
  imports: [ProjectScreenControlsComponent, ProjectScreenAccountComponent, SettingsDialogComponent],
  templateUrl: './homepage-preview.component.html',
  styleUrl: './homepage-preview.component.scss',
})
export class HomepagePreviewComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly settingsDialogOpen = signal(false);
  protected readonly loading = signal(true);
  protected readonly loadFailed = signal(false);
  protected readonly metrics = signal<HomepageSceneMetrics | undefined>(undefined);

  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly themeService = inject(ThemeService);
  private readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('sceneCanvas');
  private readonly sceneWindow = viewChild<ElementRef<HTMLElement>>('sceneWindow');
  private readonly assetLoader = new HomepageSceneAssetLoader();
  private sceneManifest?: HomepageSceneManifest;
  private manifestPromise?: Promise<HomepageSceneManifest>;
  private manifestRequest?: AbortController;
  private sceneGraph?: HomepageSceneGraph;
  private sceneImages?: LoadedHomepageSceneAssets;
  private resizeObserver?: ResizeObserver;
  private requestGeneration = 0;
  private destroyed = false;

  constructor() {
    effect(() => {
      const theme = this.themeService.theme();
      const canvas = this.canvas()?.nativeElement;
      if (canvas) void this.loadTheme(theme, canvas);
    });

    afterNextRender(() => {
      const sceneWindow = this.sceneWindow()?.nativeElement;
      if (!sceneWindow) return;
      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(() => this.renderCurrentTheme());
        this.resizeObserver.observe(sceneWindow);
      }
      this.renderCurrentTheme();
    });

    this.destroyRef.onDestroy(() => this.destroy());
  }

  protected openSettings(): void {
    this.settingsDialogOpen.set(true);
  }

  protected closeSettings(): void {
    this.settingsDialogOpen.set(false);
  }

  protected retryLoading(): void {
    const canvas = this.canvas()?.nativeElement;
    if (canvas) void this.loadTheme(this.themeService.theme(), canvas);
  }

  private async loadTheme(theme: Theme, canvas: HTMLCanvasElement): Promise<void> {
    const generation = ++this.requestGeneration;
    this.assetLoader.dispose();
    this.sceneGraph = undefined;
    this.sceneImages = undefined;
    this.metrics.set(undefined);
    this.loading.set(true);
    this.loadFailed.set(false);
    this.clearCanvas(canvas);

    try {
      const manifest = await this.getManifest();
      if (generation !== this.requestGeneration || this.destroyed) return;

      const artworkTheme = artworkThemeByApplicationTheme[theme];
      const themeManifest = manifest.themes[artworkTheme];
      const graph = buildHomepageSceneGraph(themeManifest.assets);
      const runtimeAssets = themeManifest.assets.filter(
        (asset) => !rasterControlsReplacedByDom.has(asset.id),
      );
      const loaded = await this.assetLoader.load(
        runtimeAssets,
        (asset) => new URL(`assets/homepage/runtime/${asset.file}`, this.document.baseURI),
      );
      if (generation !== this.requestGeneration || this.destroyed) return;

      this.sceneManifest = manifest;
      this.sceneGraph = graph;
      this.sceneImages = loaded;
      this.metrics.set({
        loadDurationMs: loaded.loadDurationMs,
        encodedBytes: loaded.encodedBytes,
        decodedBytesEstimate: loaded.decodedBytesEstimate,
        renderDurationMs: 0,
      });
      this.loading.set(false);
      this.renderCurrentTheme();
    } catch (error) {
      if (generation !== this.requestGeneration || this.destroyed || isAbortError(error)) return;
      this.assetLoader.dispose();
      this.loading.set(false);
      this.loadFailed.set(true);
    }
  }

  private getManifest(): Promise<HomepageSceneManifest> {
    if (this.sceneManifest) return Promise.resolve(this.sceneManifest);
    if (this.manifestPromise) return this.manifestPromise;

    const request = new AbortController();
    this.manifestRequest = request;
    this.manifestPromise = globalThis
      .fetch(new URL('assets/homepage/runtime/scene-manifest.json', this.document.baseURI), {
        signal: request.signal,
      })
      .then((response) => {
        if (!response.ok) throw new Error(`Homepage manifest request failed (${response.status}).`);
        return response.json() as Promise<unknown>;
      })
      .then(parseHomepageSceneManifest)
      .then((manifest) => {
        this.sceneManifest = manifest;
        return manifest;
      })
      .catch((error: unknown) => {
        this.manifestPromise = undefined;
        throw error;
      })
      .finally(() => {
        if (this.manifestRequest === request) this.manifestRequest = undefined;
      });

    return this.manifestPromise;
  }

  private renderCurrentTheme(): void {
    const canvas = this.canvas()?.nativeElement;
    const sceneWindow = this.sceneWindow()?.nativeElement;
    const manifest = this.sceneManifest;
    if (!canvas || !sceneWindow || !manifest) return;

    const bounds = canvas.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0) return;

    const pixelRatio = Math.min(this.document.defaultView?.devicePixelRatio ?? 1, 2);
    const scale = (bounds.width / manifest.canvas.width) * pixelRatio;
    canvas.width = Math.max(1, Math.ceil(manifest.canvas.width * scale));
    canvas.height = Math.max(1, Math.ceil(manifest.canvas.height * scale));
    const context = canvas.getContext('2d');
    if (!context) {
      this.loadFailed.set(true);
      return;
    }

    context.setTransform(scale, 0, 0, scale, 0, 0);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.clearRect(0, 0, manifest.canvas.width, manifest.canvas.height);

    const graph = this.sceneGraph;
    const images = this.sceneImages?.images;
    if (!graph || !images) return;

    const startTime = globalThis.performance.now();
    drawHomepageScene(context, graph, images, new Map(), rasterControlsReplacedByDom);
    const renderDurationMs = globalThis.performance.now() - startTime;
    this.metrics.update((current) => (current ? { ...current, renderDurationMs } : current));
  }

  private clearCanvas(canvas: HTMLCanvasElement): void {
    const context = canvas.getContext('2d');
    if (!context) return;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
  }

  private destroy(): void {
    this.destroyed = true;
    this.requestGeneration++;
    this.manifestRequest?.abort();
    this.manifestRequest = undefined;
    this.assetLoader.dispose();
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    this.sceneGraph = undefined;
    this.sceneImages = undefined;
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}
