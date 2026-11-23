import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { UiPreferencesService } from '../../../core/ui/preferences/ui-preferences.service';
import { ThemeService, type Theme } from '../../../core/ui/theme/theme.service';
import type { DioramaTimeDialChange } from './diorama-time-dial.component';
import type {
  DioramaTimeAnimationUpdate,
  DioramaTimeTransition,
  DioramaTimeTransitionSource,
} from './diorama-time-transition';
import {
  dioramaTimeStageIndexAtProgress,
  dioramaTimeStageIndexByTheme,
  dioramaTimeStages,
  nearestDioramaTimeProgress,
} from './diorama-time-stages';

@Injectable()
export class DioramaTimeController {
  private readonly themeService = inject(ThemeService);
  private readonly preferences = inject(UiPreferencesService);
  readonly cycleProgress = signal(dioramaTimeStageIndexByTheme[this.themeService.theme()]);
  readonly timeStageIndex = computed(() => dioramaTimeStageIndexAtProgress(this.cycleProgress()));
  readonly timeTransition = signal<DioramaTimeTransition>({
    id: 0,
    phase: 'idle',
    progress: this.cycleProgress(),
    targetProgress: this.cycleProgress(),
    source: 'theme',
  });
  readonly clockDragging = computed(() => this.timeTransition().phase === 'dragging');
  readonly skyOrbitDirection = signal<'right' | 'left' | undefined>(undefined);
  readonly sceneAnimationsEnabled = computed(
    () => this.preferences.effectivePreferences().accessibility.sceneAnimationsEnabled,
  );
  readonly skyGlowPercent = computed(() => skyPositionAtProgress(this.cycleProgress()));

  private lastSynchronizedTheme: Theme = this.themeService.theme();
  private transitionSequence = 0;
  private gestureStartProgress?: number;

  constructor() {
    effect(() => {
      const theme = this.themeService.theme();
      if (theme === this.lastSynchronizedTheme) return;
      this.lastSynchronizedTheme = theme;
      const start = this.cycleProgress();
      const target = nearestDioramaTimeProgress(start, dioramaTimeStageIndexByTheme[theme]);
      this.beginSettle(start, target, 'theme');
    });
  }

  handleDialChange(change: DioramaTimeDialChange): void {
    const stage = dioramaTimeStages[change.index];
    if (!stage || !Number.isFinite(change.progress)) return;
    const source = change.source ?? 'clock';

    if (change.isDragging) {
      if (this.gestureStartProgress === undefined) this.gestureStartProgress = this.cycleProgress();
      const previousTransition = this.timeTransition();
      const id =
        previousTransition.phase === 'dragging' ? previousTransition.id : ++this.transitionSequence;
      this.cycleProgress.set(change.progress);
      this.timeTransition.set({
        id,
        phase: 'dragging',
        progress: change.progress,
        targetProgress: change.progress,
        source,
      });
      this.synchronizeTheme(change.progress);
      return;
    }

    const gestureStart = this.gestureStartProgress;
    const start = gestureStart === undefined ? this.cycleProgress() : change.progress;
    this.gestureStartProgress = undefined;
    const target = nearestDioramaTimeProgress(change.progress, change.index);
    this.cycleProgress.set(start);
    this.skyOrbitDirection.set(
      this.sceneAnimationsEnabled()
        ? orbitDirectionAcrossMidnight(gestureStart ?? start, target)
        : undefined,
    );
    this.synchronizeTheme(target);
    this.beginSettle(start, target, source);
  }

  advanceTheme(direction: -1 | 1): void {
    const current = this.cycleProgress();
    const nextIndex =
      (dioramaTimeStageIndexAtProgress(current) + direction + dioramaTimeStages.length) %
      dioramaTimeStages.length;
    const target = nearestDioramaTimeProgress(current, nextIndex);
    this.skyOrbitDirection.set(
      this.sceneAnimationsEnabled() ? orbitDirectionAcrossMidnight(current, target) : undefined,
    );
    this.synchronizeTheme(target);
    this.beginSettle(current, target, 'swipe');
  }

  handleAnimationUpdate(update: DioramaTimeAnimationUpdate): void {
    const transition = this.timeTransition();
    if (transition.id !== update.id || transition.phase !== 'settling') return;
    if (Number.isFinite(update.progress)) this.cycleProgress.set(update.progress);
    if (!update.finished) return;
    this.cycleProgress.set(transition.targetProgress);
    this.timeTransition.set({
      ...transition,
      phase: 'idle',
      progress: transition.targetProgress,
    });
  }

  completeSkyOrbit(event: AnimationEvent): void {
    if (
      event.target === event.currentTarget &&
      (event.animationName === 'sky-orbit-right' || event.animationName === 'sky-orbit-left')
    ) {
      this.skyOrbitDirection.set(undefined);
    }
  }

  private beginSettle(
    startProgress: number,
    targetProgress: number,
    source: DioramaTimeTransitionSource,
  ): void {
    const id = ++this.transitionSequence;
    if (Math.abs(targetProgress - startProgress) < 0.0001) {
      this.cycleProgress.set(targetProgress);
      this.timeTransition.set({
        id,
        phase: 'idle',
        progress: targetProgress,
        targetProgress,
        source,
      });
      return;
    }
    this.timeTransition.set({
      id,
      phase: 'settling',
      progress: startProgress,
      targetProgress,
      source,
    });
  }

  private synchronizeTheme(progress: number): void {
    const stage = dioramaTimeStages[dioramaTimeStageIndexAtProgress(progress)];
    if (!stage || stage.theme === this.themeService.theme()) return;
    this.lastSynchronizedTheme = stage.theme;
    this.themeService.setPreset(stage.theme);
  }
}

const skyGlowPositions = [14, 38, 63, 87] as const;

function skyPositionAtProgress(progress: number): number {
  const stageCount = dioramaTimeStages.length;
  const phase = ((progress % stageCount) + stageCount) % stageCount;
  const stageIndex = Math.floor(phase);
  const fraction = phase - stageIndex;
  const nextIndex = (stageIndex + 1) % stageCount;
  const nextPosition =
    stageIndex === stageCount - 1 ? skyGlowPositions[0] + 100 : skyGlowPositions[nextIndex];
  return skyGlowPositions[stageIndex] + (nextPosition - skyGlowPositions[stageIndex]) * fraction;
}

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
