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
import { intentForSceneTarget } from './diorama-contracts';
import { DioramaSceneRuntime } from './diorama-scene-runtime';
import type { DioramaTimeDialChange } from './diorama-time-dial.component';
import type { DioramaTimeAnimationUpdate, DioramaTimeTransition } from './diorama-time-transition';
import {
  DioramaSceneFocusToolbarComponent,
  type DioramaFocusAction,
} from './diorama-scene-focus-toolbar.component';

type DioramaState = 'loading' | 'ready' | 'fallback';

const focusMessageKeys: Readonly<Record<DioramaTarget, TranslationKey>> = {
  washer: 'dioramaWasherSelected',
  'project-board': 'dioramaBoardSelected',
  raccoon: 'dioramaRaccoonSelected',
};

@Component({
  selector: 'app-diorama-scene',
  imports: [DioramaSceneFocusToolbarComponent],
  templateUrl: './diorama-scene.component.html',
  styleUrl: './diorama-scene.component.scss',
})
export class DioramaSceneComponent {
  readonly timeTransition = input.required<DioramaTimeTransition>();
  readonly timeProgress = input.required<number>();
  readonly timeChanged = output<DioramaTimeDialChange>();
  readonly timeAnimationUpdate = output<DioramaTimeAnimationUpdate>();

  protected readonly i18n = inject(I18nService);
  protected readonly state = signal<DioramaState>('loading');
  protected readonly fallbackMessageKey = signal<TranslationKey>('dioramaFallback');
  protected readonly selectedTarget = signal<DioramaTarget | undefined>(undefined);
  protected readonly sceneMessageKey = signal<TranslationKey>('dioramaOverviewSelected');
  protected readonly sceneMessage = computed(() => this.i18n.t(this.sceneMessageKey()));

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
      const sceneAnimationsEnabled =
        this.preferences.effectivePreferences().accessibility.sceneAnimationsEnabled;
      this.runtime?.setSceneAnimationsEnabled(sceneAnimationsEnabled);
    });
    effect(() => {
      const transition = this.timeTransition();
      this.runtime?.setTimeTransition(transition);
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

  protected handleFocusAction(action: DioramaFocusAction): void {
    if (action === 'overview') this.focusOverview();
    else if (action === 'raccoon') this.greetRaccoon();
    else this.focusTarget(action);
  }

  private focusOverview(): void {
    this.runtime?.focus('overview');
    this.selectedTarget.set(undefined);
    this.sceneMessageKey.set('dioramaOverviewSelected');
  }

  private focusTarget(target: DioramaTarget): void {
    this.handleSceneIntent(intentForSceneTarget(target));
  }

  private greetRaccoon(): void {
    this.handleSceneIntent({ type: 'greet-raccoon' });
  }

  private mountScene(): void {
    const host = this.sceneHost()?.nativeElement;
    if (!host) {
      this.fallbackMessageKey.set('dioramaSceneLoadUnavailable');
      this.state.set('fallback');
      return;
    }

    this.runtime = new DioramaSceneRuntime({
      onIntent: (intent) => this.handleSceneIntent(intent),
      onTimeChange: (change) => this.timeChanged.emit(change),
      onTimeAnimationUpdate: (update) => this.timeAnimationUpdate.emit(update),
      currentTimeProgress: () => this.timeProgress(),
      onWebGLUnavailable: (error) => {
        this.fallbackMessageKey.set('dioramaWebGLUnavailable');
        if (error) console.error('Diorama could not initialize WebGL 2.', error);
        this.state.set('fallback');
        this.runtime?.dispose();
      },
      onSceneLoaded: () => this.state.set('ready'),
      onSceneLoadFailed: (error) => {
        console.error('Diorama scene could not be loaded.', error);
        this.fallbackMessageKey.set('dioramaSceneLoadUnavailable');
        this.state.set('fallback');
      },
    });

    if (!this.runtime.mount(host)) {
      if (this.state() === 'loading') {
        this.fallbackMessageKey.set('dioramaSceneLoadUnavailable');
      }
      this.state.set('fallback');
      return;
    }
    this.runtime.setSceneAnimationsEnabled(
      this.preferences.effectivePreferences().accessibility.sceneAnimationsEnabled,
    );
    this.runtime.setTheme(this.themeService.theme());
    this.runtime.setTimeTransition(this.timeTransition());
  }

  private handleSceneIntent(intent: DioramaIntent): void {
    if (intent.type === 'greet-raccoon') {
      this.runtime?.greetRaccoon();
      this.selectedTarget.set('raccoon');
      this.sceneMessageKey.set('dioramaGreeting');
      return;
    }
    this.runtime?.focus(intent.target);
    this.selectedTarget.set(intent.target);
    this.sceneMessageKey.set(focusMessageKeys[intent.target]);
  }
}
