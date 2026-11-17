import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../core/ui/localization/i18n.service';
import type { TranslationKey } from '../../core/ui/localization/translation-catalogs';
import { ThemeService } from '../../core/ui/theme/theme.service';
import { SettingsDialogComponent } from '../editor/settings/settings-dialog/settings-dialog.component';
import { ProjectScreenControlsComponent } from '../projects/project-screen/project-screen-controls.component';
import type { MiniDioramaIntent, MiniDioramaTarget } from './mini-diorama-contracts';
import { MiniDioramaSceneRuntime } from './mini-diorama-scene-runtime';

type PreviewState = 'loading' | 'ready' | 'fallback';

const focusMessageKeys: Readonly<Record<MiniDioramaTarget, TranslationKey>> = {
  washer: 'miniDioramaWasherSelected',
  'project-board': 'miniDioramaBoardSelected',
  raccoon: 'miniDioramaRaccoonSelected',
};

@Component({
  selector: 'app-mini-diorama-preview',
  imports: [RouterLink, ProjectScreenControlsComponent, SettingsDialogComponent],
  templateUrl: './mini-diorama-preview.component.html',
  styleUrl: './mini-diorama-preview.component.scss',
})
export class MiniDioramaPreviewComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly previewState = signal<PreviewState>('loading');
  protected readonly selectedTarget = signal<MiniDioramaTarget | undefined>(undefined);
  protected readonly settingsDialogOpen = signal(false);
  protected readonly sceneMessageKey = signal<TranslationKey>('miniDioramaOverviewSelected');
  protected readonly sceneMessage = computed(() => this.i18n.t(this.sceneMessageKey()));

  private readonly themeService = inject(ThemeService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly sceneHost = viewChild<ElementRef<HTMLElement>>('sceneHost');
  private runtime?: MiniDioramaSceneRuntime;
  private destroyed = false;

  constructor() {
    effect(() => {
      const theme = this.themeService.theme();
      this.runtime?.setTheme(theme);
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

  protected openSettings(): void {
    this.settingsDialogOpen.set(true);
  }

  protected closeSettings(): void {
    this.settingsDialogOpen.set(false);
  }

  protected focusOverview(): void {
    this.runtime?.focus('overview');
    this.selectedTarget.set(undefined);
    this.sceneMessageKey.set('miniDioramaOverviewSelected');
  }

  protected focusTarget(target: MiniDioramaTarget): void {
    if (target === 'raccoon') {
      this.greetRaccoon();
      return;
    }
    this.runtime?.focus(target);
    this.selectedTarget.set(target);
    this.sceneMessageKey.set(focusMessageKeys[target]);
  }

  protected greetRaccoon(): void {
    this.runtime?.greetRaccoon();
    this.selectedTarget.set('raccoon');
    this.sceneMessageKey.set('miniDioramaGreeting');
  }

  private mountScene(): void {
    const host = this.sceneHost()?.nativeElement;
    if (!host) {
      this.previewState.set('fallback');
      return;
    }

    this.runtime = new MiniDioramaSceneRuntime({
      onIntent: (intent) => this.handleSceneIntent(intent),
      onWebGLUnavailable: () => {
        this.previewState.set('fallback');
        this.runtime?.dispose();
      },
      onRaccoonLoaded: () => this.previewState.set('ready'),
      onRaccoonLoadFailed: () => this.previewState.set('fallback'),
    });

    if (!this.runtime.mount(host)) {
      this.previewState.set('fallback');
      return;
    }
    this.runtime.setTheme(this.themeService.theme());
  }

  private handleSceneIntent(intent: MiniDioramaIntent): void {
    if (intent.type === 'greet-raccoon') {
      this.greetRaccoon();
      return;
    }
    this.runtime?.focus(intent.target);
    this.selectedTarget.set(intent.target);
    this.sceneMessageKey.set(focusMessageKeys[intent.target]);
  }
}
