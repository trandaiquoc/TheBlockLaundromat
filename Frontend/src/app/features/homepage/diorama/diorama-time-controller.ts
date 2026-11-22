import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { UiPreferencesService } from '../../../core/ui/preferences/ui-preferences.service';
import { ThemeService, type Theme } from '../../../core/ui/theme/theme.service';
import type { DioramaTimeDialChange } from './diorama-time-dial.component';
import {
  dioramaTimeStageIndexByTheme,
  dioramaTimeStages,
  nearestDioramaTimeProgress,
} from './diorama-time-stages';

@Injectable()
export class DioramaTimeController {
  private readonly themeService = inject(ThemeService);
  private readonly preferences = inject(UiPreferencesService);
  readonly timeStageIndex = computed(() => dioramaTimeStageIndexByTheme[this.themeService.theme()]);
  readonly cycleProgress = signal(this.timeStageIndex());
  readonly clockDragging = signal(false);
  readonly skyOrbitDirection = signal<'right' | 'left' | undefined>(undefined);
  readonly sceneAnimationsEnabled = computed(
    () => this.preferences.effectivePreferences().accessibility.sceneAnimationsEnabled,
  );
  readonly skyGlowPercent = computed(() => {
    if (!this.clockDragging()) return skyGlowPositions[this.timeStageIndex()];
    const stageCount = dioramaTimeStages.length;
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

  private lastSynchronizedTheme: Theme = this.themeService.theme();
  private clockGestureStartProgress?: number;

  constructor() {
    effect(() => {
      const theme = this.themeService.theme();
      if (theme === this.lastSynchronizedTheme) return;
      this.lastSynchronizedTheme = theme;
      const progress = untracked(this.cycleProgress);
      untracked(() =>
        this.cycleProgress.set(
          nearestDioramaTimeProgress(progress, dioramaTimeStageIndexByTheme[theme]),
        ),
      );
    });
  }

  handleDialChange(change: DioramaTimeDialChange): void {
    const stage = dioramaTimeStages[change.index];
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

  advanceTheme(direction: -1 | 1): void {
    const nextIndex =
      (this.timeStageIndex() + direction + dioramaTimeStages.length) % dioramaTimeStages.length;
    const progress = nearestDioramaTimeProgress(this.cycleProgress(), nextIndex);
    this.handleDialChange({ index: nextIndex, progress, isDragging: false });
  }

  completeSkyOrbit(event: AnimationEvent): void {
    if (
      event.target === event.currentTarget &&
      (event.animationName === 'sky-orbit-right' || event.animationName === 'sky-orbit-left')
    ) {
      this.skyOrbitDirection.set(undefined);
    }
  }
}

const skyGlowPositions = [14, 38, 63, 87, 14] as const;

function orbitDirectionAcrossMidnight(
  startProgress: number,
  endProgress: number,
): 'right' | 'left' | undefined {
  const stageCount = dioramaTimeStages.length;
  if (
    endProgress > startProgress &&
    Math.floor(endProgress / stageCount) > Math.floor(startProgress / stageCount)
  ) {
    return 'right';
  }
  if (
    endProgress < startProgress &&
    Math.floor(endProgress / stageCount) < Math.floor(startProgress / stageCount)
  ) {
    return 'left';
  }
  return undefined;
}
