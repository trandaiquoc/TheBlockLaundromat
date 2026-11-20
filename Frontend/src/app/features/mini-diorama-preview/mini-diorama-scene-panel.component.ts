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
import { I18nService } from '../../core/ui/localization/i18n.service';
import { UiPreferencesService } from '../../core/ui/preferences/ui-preferences.service';
import type { TranslationKey } from '../../core/ui/localization/translation-catalogs';
import { ThemeService } from '../../core/ui/theme/theme.service';
import type { MiniDioramaIntent, MiniDioramaTarget } from './mini-diorama-contracts';
import { intentForSceneTarget } from './mini-diorama-contracts';
import { MiniDioramaSceneRuntime } from './mini-diorama-scene-runtime';
import type { MiniDioramaSceneKind } from './mini-diorama-scene-contract';
import {
  MiniDioramaSceneFocusToolbarComponent,
  type MiniDioramaFocusAction,
} from './mini-diorama-scene-focus-toolbar.component';

type PreviewState = 'loading' | 'ready' | 'fallback';

const focusMessageKeys: Readonly<Record<MiniDioramaTarget, TranslationKey>> = {
  washer: 'miniDioramaWasherSelected',
  'project-board': 'miniDioramaBoardSelected',
  raccoon: 'miniDioramaRaccoonSelected',
};

@Component({
  selector: 'app-mini-diorama-scene-panel',
  imports: [MiniDioramaSceneFocusToolbarComponent],
  templateUrl: './mini-diorama-scene-panel.component.html',
  styleUrl: './mini-diorama-scene-panel.component.scss',
})
export class MiniDioramaScenePanelComponent {
  readonly mode = input<'preview' | 'workspace'>('preview');
  readonly sceneKind = input<MiniDioramaSceneKind>('integration-preview');
  readonly sceneIntent = output<MiniDioramaIntent>();

  protected readonly i18n = inject(I18nService);
  protected readonly previewState = signal<PreviewState>('loading');
  protected readonly fallbackMessageKey = signal<TranslationKey>('miniDioramaFallback');
  protected readonly selectedTarget = signal<MiniDioramaTarget | undefined>(undefined);
  protected readonly sceneMessageKey = signal<TranslationKey>('miniDioramaOverviewSelected');
  protected readonly sceneMessage = computed(() => this.i18n.t(this.sceneMessageKey()));
  protected readonly isSpatialPreview = computed(
    () => this.mode() === 'preview' && this.sceneKind() === 'stage-3-production',
  );

  private readonly themeService = inject(ThemeService);
  private readonly preferences = inject(UiPreferencesService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly sceneHost = viewChild<ElementRef<HTMLElement>>('sceneHost');
  private runtime?: MiniDioramaSceneRuntime;
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

    afterNextRender(() => {
      if (!this.destroyed) this.mountScene();
    });
    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
      this.runtime?.dispose();
      this.runtime = undefined;
    });
  }

  protected focusOverview(): void {
    this.runtime?.focus('overview');
    this.selectedTarget.set(undefined);
    this.sceneMessageKey.set('miniDioramaOverviewSelected');
  }

  protected focusTarget(target: MiniDioramaTarget): void {
    this.handleSceneIntent(intentForSceneTarget(target));
  }

  protected greetRaccoon(): void {
    this.handleSceneIntent({ type: 'greet-raccoon' });
  }

  protected handleFocusAction(action: MiniDioramaFocusAction): void {
    if (action === 'overview') this.focusOverview();
    else if (action === 'raccoon') this.greetRaccoon();
    else this.focusTarget(action);
  }

  private mountScene(): void {
    const host = this.sceneHost()?.nativeElement;
    if (!host) {
      this.fallbackMessageKey.set('miniDioramaSceneLoadUnavailable');
      this.previewState.set('fallback');
      return;
    }

    this.runtime = new MiniDioramaSceneRuntime(
      {
        onIntent: (intent) => this.handleSceneIntent(intent),
        onWebGLUnavailable: (error) => {
          this.fallbackMessageKey.set('miniDioramaWebGLUnavailable');
          if (error) console.error('Mini-diorama could not initialize WebGL 2.', error);
          this.previewState.set('fallback');
          this.runtime?.dispose();
        },
        onSceneLoaded: () => this.previewState.set('ready'),
        onSceneLoadFailed: (error) => {
          console.error('Mini-diorama scene could not be loaded.', error);
          this.fallbackMessageKey.set('miniDioramaSceneLoadUnavailable');
          this.previewState.set('fallback');
        },
      },
      {},
      this.sceneKind(),
    );

    if (!this.runtime.mount(host)) {
      if (this.previewState() === 'loading') {
        this.fallbackMessageKey.set('miniDioramaSceneLoadUnavailable');
      }
      this.previewState.set('fallback');
      return;
    }
    this.runtime.setSceneAnimationsEnabled(
      this.preferences.effectivePreferences().accessibility.sceneAnimationsEnabled,
    );
    this.runtime.setTheme(this.themeService.theme());
  }

  private handleSceneIntent(intent: MiniDioramaIntent): void {
    if (intent.type === 'greet-raccoon') {
      this.runtime?.greetRaccoon();
      this.selectedTarget.set('raccoon');
      this.sceneMessageKey.set('miniDioramaGreeting');
    } else {
      this.runtime?.focus(intent.target);
      this.selectedTarget.set(intent.target);
      this.sceneMessageKey.set(focusMessageKeys[intent.target]);
    }
    this.sceneIntent.emit(intent);
  }
}
