import {
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { UiPreferencesService } from '../../core/ui/preferences/ui-preferences.service';
import { ThemeService, type Theme } from '../../core/ui/theme/theme.service';
import { SettingsDialogComponent } from '../editor/settings/settings-dialog/settings-dialog.component';
import { MiniDioramaPreviewAccountComponent } from './mini-diorama-preview-account.component';
import { MiniDioramaPreviewHeaderComponent } from './mini-diorama-preview-header.component';
import { MiniDioramaScenePanelComponent } from './mini-diorama-scene-panel.component';
import {
  MiniDioramaTimeDialComponent,
  type MiniDioramaTimeDialChange,
} from './mini-diorama-time-dial.component';
import {
  miniDioramaTimeStageIndexByTheme,
  miniDioramaTimeStages,
  nearestMiniDioramaTimeProgress,
} from './mini-diorama-time-stages';

@Component({
  selector: 'app-mini-diorama-preview',
  imports: [
    SettingsDialogComponent,
    MiniDioramaPreviewAccountComponent,
    MiniDioramaPreviewHeaderComponent,
    MiniDioramaScenePanelComponent,
    MiniDioramaTimeDialComponent,
  ],
  templateUrl: './mini-diorama-preview.component.html',
  styleUrl: './mini-diorama-preview.component.scss',
})
export class MiniDioramaPreviewComponent {
  protected readonly themeService = inject(ThemeService);
  private readonly preferences = inject(UiPreferencesService);
  protected readonly timeStageIndex = computed(
    () => miniDioramaTimeStageIndexByTheme[this.themeService.theme()],
  );
  protected readonly cycleProgress = signal(this.timeStageIndex());
  protected readonly clockDragging = signal(false);
  protected readonly skyOrbitDirection = signal<'right' | 'left' | undefined>(undefined);
  protected readonly skyGlowPercent = computed(() => {
    if (!this.clockDragging()) return skyGlowPositions[this.timeStageIndex()];
    const stageCount = miniDioramaTimeStages.length;
    const phase = ((this.cycleProgress() % stageCount) + stageCount) % stageCount;
    const stageIndex = Math.floor(phase);
    const fraction = phase - stageIndex;
    if (stageIndex === 3) {
      const darkSide = this.cycleProgress() < 0 ? skyGlowPositions[3] - 100 : skyGlowPositions[3];
      const lightSide = this.cycleProgress() < 0 ? skyGlowPositions[0] : skyGlowPositions[0] + 100;
      return darkSide + (lightSide - darkSide) * fraction;
    }
    return (
      skyGlowPositions[stageIndex] +
      (skyGlowPositions[stageIndex + 1] - skyGlowPositions[stageIndex]) * fraction
    );
  });
  protected readonly sceneAnimationsEnabled = computed(
    () => this.preferences.effectivePreferences().accessibility.sceneAnimationsEnabled,
  );
  protected readonly settingsDialogOpen = signal(false);
  private lastSynchronizedTheme: Theme = this.themeService.theme();
  private clockGestureStartProgress: number | undefined;
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);
  private activeThemeSwipe?: { readonly pointerId: number; readonly startX: number; readonly startY: number; currentX: number; consumed: boolean };
  private cancellingCanvasPointerId?: number;
  private suppressSwipeClickUntil = 0;
  private readonly onThemeSwipePointerDown = (event: PointerEvent): void => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (!this.isOverviewFocused()) return;
    if (
      event.target instanceof Element &&
      event.target.closest(
        'button, input, select, textarea, [role="dialog"], .mini-diorama-time-dial',
      )
    ) return;
    this.activeThemeSwipe = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      currentX: event.clientX,
      consumed: false,
    };
  };
  private readonly onThemeSwipePointerMove = (event: PointerEvent): void => {
    const swipe = this.activeThemeSwipe;
    if (!swipe || swipe.pointerId !== event.pointerId) return;
    swipe.currentX = event.clientX;
    const deltaX = event.clientX - swipe.startX;
    const deltaY = event.clientY - swipe.startY;
    const windowWidth = this.host.nativeElement.ownerDocument.defaultView?.innerWidth ?? 800;
    if (Math.abs(deltaX) < Math.max(68, windowWidth * 0.12) || Math.abs(deltaX) < Math.abs(deltaY) * 1.35) return;
    swipe.consumed = true;
    event.preventDefault();
    event.stopPropagation();
    const canvas = this.host.nativeElement.querySelector('canvas');
    if (canvas) {
      this.cancellingCanvasPointerId = event.pointerId;
      canvas.dispatchEvent(
        new PointerEvent('pointercancel', {
          bubbles: true,
          pointerId: event.pointerId,
          pointerType: event.pointerType,
          isPrimary: event.isPrimary,
          button: event.button,
          clientX: event.clientX,
          clientY: event.clientY,
        }),
      );
      this.cancellingCanvasPointerId = undefined;
    }
  };
  private readonly onThemeSwipePointerUp = (event: PointerEvent): void => {
    this.finishThemeSwipe(event, true);
  };
  private readonly onThemeSwipePointerCancel = (event: PointerEvent): void => {
    if (this.cancellingCanvasPointerId === event.pointerId) return;
    this.finishThemeSwipe(event, false);
  };
  private readonly onThemeSwipeClick = (event: MouseEvent): void => {
    if (performance.now() > this.suppressSwipeClickUntil) return;
    this.suppressSwipeClickUntil = 0;
    event.preventDefault();
    event.stopPropagation();
  };

  constructor() {
    effect(() => {
      const theme = this.themeService.theme();
      if (theme === this.lastSynchronizedTheme) return;
      this.lastSynchronizedTheme = theme;
      const progress = untracked(this.cycleProgress);
      untracked(() =>
        this.cycleProgress.set(
          nearestMiniDioramaTimeProgress(progress, miniDioramaTimeStageIndexByTheme[theme]),
        ),
      );
    });

    const host = this.host.nativeElement;
    host.addEventListener('pointerdown', this.onThemeSwipePointerDown, true);
    host.addEventListener('pointermove', this.onThemeSwipePointerMove, true);
    host.addEventListener('pointerup', this.onThemeSwipePointerUp, true);
    host.addEventListener('pointercancel', this.onThemeSwipePointerCancel, true);
    host.addEventListener('click', this.onThemeSwipeClick, true);
    this.destroyRef.onDestroy(() => {
      host.removeEventListener('pointerdown', this.onThemeSwipePointerDown, true);
      host.removeEventListener('pointermove', this.onThemeSwipePointerMove, true);
      host.removeEventListener('pointerup', this.onThemeSwipePointerUp, true);
      host.removeEventListener('pointercancel', this.onThemeSwipePointerCancel, true);
      host.removeEventListener('click', this.onThemeSwipeClick, true);
    });
  }

  protected openSettings(): void {
    this.settingsDialogOpen.set(true);
  }

  protected closeSettings(): void {
    this.settingsDialogOpen.set(false);
  }

  protected handleTimeDialChange(change: MiniDioramaTimeDialChange): void {
    const stage = miniDioramaTimeStages[change.index];
    if (!stage) return;
    const startProgress = this.clockGestureStartProgress ?? this.cycleProgress();
    if (change.isDragging && this.clockGestureStartProgress === undefined) {
      this.clockGestureStartProgress = this.cycleProgress();
    }
    if (!change.isDragging) {
      const direction = orbitDirectionAcrossMidnight(startProgress, change.progress);
      this.skyOrbitDirection.set(this.sceneAnimationsEnabled() ? direction : undefined);
      this.clockGestureStartProgress = undefined;
    }
    this.cycleProgress.set(change.progress);
    this.clockDragging.set(change.isDragging);
    if (stage.theme === this.themeService.theme()) return;
    this.lastSynchronizedTheme = stage.theme;
    this.themeService.setPreset(stage.theme);
  }

  protected completeSkyOrbit(event: AnimationEvent): void {
    if (
      event.target === event.currentTarget &&
      (event.animationName === 'sky-orbit-right' || event.animationName === 'sky-orbit-left')
    ) {
      this.skyOrbitDirection.set(undefined);
    }
  }

  private finishThemeSwipe(event: PointerEvent, commit: boolean): void {
    const swipe = this.activeThemeSwipe;
    if (!swipe || swipe.pointerId !== event.pointerId) return;
    this.activeThemeSwipe = undefined;
    if (!swipe.consumed) return;
    event.preventDefault();
    event.stopPropagation();
    if (!commit) return;

    const direction = swipe.currentX < swipe.startX ? 1 : -1;
    const nextIndex = (this.timeStageIndex() + direction + miniDioramaTimeStages.length) % miniDioramaTimeStages.length;
    const progress = nearestMiniDioramaTimeProgress(this.cycleProgress(), nextIndex);
    this.suppressSwipeClickUntil = performance.now() + 250;
    this.handleTimeDialChange({ index: nextIndex, progress, isDragging: false });
  }

  private isOverviewFocused(): boolean {
    return (
      this.host.nativeElement
        .querySelector('[data-focus-target="overview"]')
        ?.getAttribute('aria-pressed') === 'true'
    );
  }
}

const skyGlowPositions = [14, 38, 63, 87, 14] as const;

function orbitDirectionAcrossMidnight(
  startProgress: number,
  endProgress: number,
): 'right' | 'left' | undefined {
  const stageCount = miniDioramaTimeStages.length;
  if (endProgress > startProgress && Math.floor(endProgress / stageCount) > Math.floor(startProgress / stageCount)) {
    return 'right';
  }
  if (endProgress < startProgress && Math.floor(endProgress / stageCount) < Math.floor(startProgress / stageCount)) {
    return 'left';
  }
  return undefined;
}
