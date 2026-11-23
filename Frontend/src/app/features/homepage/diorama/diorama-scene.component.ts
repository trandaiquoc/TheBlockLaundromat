import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { I18nService } from '../../../core/ui/localization/i18n.service';
import { UiPreferencesService } from '../../../core/ui/preferences/ui-preferences.service';
import type { TranslationKey } from '../../../core/ui/localization/translation-catalogs';
import { ThemeService } from '../../../core/ui/theme/theme.service';
import type { DioramaIntent, DioramaTarget } from './diorama-contracts';
import {
  DioramaHotspotProjector,
  type DioramaHotspotProjection,
} from './diorama-hotspot-projector';
import { DioramaSceneRuntime } from './diorama-scene-runtime';
import type { DioramaCameraRequest } from './diorama-spatial-navigation';
import type { DioramaTimeDialChange } from './diorama-time-dial.component';
import type { DioramaTimeAnimationUpdate, DioramaTimeTransition } from './diorama-time-transition';
import type { DioramaWasherOverlayProjection } from './diorama-washer-overlay-projector';

type DioramaState = 'loading' | 'ready' | 'fallback';

const focusMessageKeys: Readonly<Record<DioramaTarget, TranslationKey>> = {
  washer: 'dioramaWasherSelected',
  'project-board': 'dioramaBoardSelected',
  courier: 'dioramaCourierSelected',
};

@Component({
  selector: 'app-diorama-scene',
  templateUrl: './diorama-scene.component.html',
  styleUrl: './diorama-scene.component.scss',
})
export class DioramaSceneComponent {
  readonly timeTransition = input.required<DioramaTimeTransition>();
  readonly timeProgress = input.required<number>();
  readonly cameraRequest = input<DioramaCameraRequest | undefined>(undefined);
  readonly hotspotsEnabled = input(true);
  readonly timeChanged = output<DioramaTimeDialChange>();
  readonly timeAnimationUpdate = output<DioramaTimeAnimationUpdate>();
  readonly targetActivated = output<DioramaTarget>();
  readonly cameraFocusSettled = output<number>();
  readonly hotspotProjectionChanged = output<DioramaHotspotProjection>();
  readonly washerOverlayProjectionChanged = output<DioramaWasherOverlayProjection>();

  protected readonly i18n = inject(I18nService);
  protected readonly state = signal<DioramaState>('loading');
  protected readonly fallbackMessageKey = signal<TranslationKey>('dioramaFallback');
  protected readonly hotspots = signal<DioramaHotspotProjection>(hiddenHotspots());
  protected readonly sceneMessageKey = signal<TranslationKey>('dioramaOverviewSelected');
  protected readonly sceneMessage = computed(() => this.i18n.t(this.sceneMessageKey()));
  protected readonly targets: readonly DioramaTarget[] = ['project-board', 'washer', 'courier'];

  private readonly themeService = inject(ThemeService);
  private readonly preferences = inject(UiPreferencesService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly sceneHost = viewChild<ElementRef<HTMLElement>>('sceneHost');
  private runtime?: DioramaSceneRuntime;
  private destroyed = false;

  constructor() {
    effect(() => {
      const theme = this.themeService.theme();
      this.runtime?.setTheme(theme);
    });
    effect(() => {
      const enabled = this.preferences.effectivePreferences().accessibility.sceneAnimationsEnabled;
      this.runtime?.setSceneAnimationsEnabled(enabled);
    });
    effect(() => {
      const transition = this.timeTransition();
      this.runtime?.setTimeTransition(transition);
    });
    effect(() => {
      const request = this.cameraRequest();
      if (!request) return;
      if (this.state() === 'fallback') this.cameraFocusSettled.emit(request.requestId);
      else this.runtime?.requestFocus(request);
    });

    afterNextRender(() => {
      if (!this.destroyed) this.mountScene();
    });
    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
      this.runtime?.dispose();
      this.runtime = undefined;
    });
  }

  protected activateTarget(target: DioramaTarget): void {
    this.sceneMessageKey.set(focusMessageKeys[target]);
    this.targetActivated.emit(target);
  }

  focusHotspot(target: DioramaTarget): void {
    queueMicrotask(() => {
      this.sceneHost()
        ?.nativeElement.parentElement?.querySelector<HTMLButtonElement>(
          `[data-hotspot-target="${target}"]`,
        )
        ?.focus({ preventScroll: true });
    });
  }

  protected hotspotLabel(target: DioramaTarget): string {
    const key =
      target === 'courier'
        ? 'dioramaHotspotCourier'
        : target === 'project-board'
          ? 'dioramaHotspotBoard'
          : 'dioramaHotspotWasher';
    return this.i18n.t(key);
  }

  private mountScene(): void {
    const host = this.sceneHost()?.nativeElement;
    if (!host) {
      this.fallbackMessageKey.set('dioramaSceneLoadUnavailable');
      this.state.set('fallback');
      this.settlePendingCameraRequest();
      return;
    }

    this.runtime = new DioramaSceneRuntime({
      onIntent: (intent) => this.handleSceneIntent(intent),
      onTimeChange: (change) => this.timeChanged.emit(change),
      onTimeAnimationUpdate: (update) => this.timeAnimationUpdate.emit(update),
      currentTimeProgress: () => this.timeProgress(),
      onCameraFocusSettled: (requestId) => this.cameraFocusSettled.emit(requestId),
      onHotspotProjection: (projection) => {
        this.hotspots.set(projection);
        this.hotspotProjectionChanged.emit(projection);
      },
      onWasherOverlayProjection: (projection) =>
        this.washerOverlayProjectionChanged.emit(projection),
      onWebGLUnavailable: (error) => {
        this.fallbackMessageKey.set('dioramaWebGLUnavailable');
        if (error) console.error('Diorama could not initialize WebGL 2.', error);
        this.state.set('fallback');
        this.runtime?.dispose();
        this.settlePendingCameraRequest();
      },
      onSceneLoaded: () => this.state.set('ready'),
      onSceneLoadFailed: (error) => {
        console.error('Diorama scene could not be loaded.', error);
        this.fallbackMessageKey.set('dioramaSceneLoadUnavailable');
        this.state.set('fallback');
        this.settlePendingCameraRequest();
      },
    });

    if (!this.runtime.mount(host)) {
      if (this.state() === 'loading') this.fallbackMessageKey.set('dioramaSceneLoadUnavailable');
      this.state.set('fallback');
      this.settlePendingCameraRequest();
      return;
    }
    this.runtime.setSceneAnimationsEnabled(
      this.preferences.effectivePreferences().accessibility.sceneAnimationsEnabled,
    );
    this.runtime.setTheme(this.themeService.theme());
    this.runtime.setTimeTransition(this.timeTransition());
    const request = this.cameraRequest();
    if (request) this.runtime.requestFocus(request);
  }

  private handleSceneIntent(intent: DioramaIntent): void {
    this.activateTarget(intent.target);
  }

  private settlePendingCameraRequest(): void {
    const request = this.cameraRequest();
    if (request) this.cameraFocusSettled.emit(request.requestId);
  }
}

function hiddenHotspots(): DioramaHotspotProjection {
  const hidden = { x: 0, y: 0, visible: false };
  return { washer: hidden, 'project-board': hidden, courier: hidden };
}
