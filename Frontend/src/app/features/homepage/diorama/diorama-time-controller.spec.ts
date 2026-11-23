import { signal } from '@angular/core';
import type { WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UiPreferencesService } from '../../../core/ui/preferences/ui-preferences.service';
import { ThemeService, type Theme } from '../../../core/ui/theme/theme.service';
import { DioramaTimeController } from './diorama-time-controller';

describe('DioramaTimeController', () => {
  afterEach(() => {
    localStorage.removeItem('the-block-laundromat.ui-preferences');
    TestBed.resetTestingModule();
  });

  it('starts on the active theme and crosses from Minecraft to Morning by one stage', () => {
    const { controller, theme } = createController();

    expect(controller.cycleProgress()).toBe(1);
    expect(controller.timeStageIndex()).toBe(1);

    theme.theme.set('light');
    TestBed.flushEffects();

    expect(controller.timeTransition()).toMatchObject({
      id: 1,
      phase: 'settling',
      progress: 1,
      targetProgress: 0,
      source: 'theme',
    });
  });

  it('publishes continuous clock progress and synchronizes the semantic theme', () => {
    const { controller, theme } = createController();

    controller.handleDialChange({ index: 2, progress: 1.6, isDragging: true, source: 'clock' });

    expect(controller.cycleProgress()).toBe(1.6);
    expect(controller.timeTransition()).toMatchObject({
      id: 1,
      phase: 'dragging',
      progress: 1.6,
      targetProgress: 1.6,
      source: 'clock',
    });
    expect(theme.theme()).toBe('raccoon');
  });

  it('animates a direct clock stage selection from the current stage', () => {
    const { controller, theme } = createController();

    controller.handleDialChange({ index: 0, progress: 0, isDragging: false, source: 'clock' });

    expect(controller.cycleProgress()).toBe(1);
    expect(controller.timeTransition()).toMatchObject({
      id: 1,
      phase: 'settling',
      progress: 1,
      targetProgress: 0,
      source: 'clock',
    });
    expect(theme.theme()).toBe('light');
  });

  it('settles released gestures to a stage and ignores updates from an interrupted transition', () => {
    const { controller } = createController();
    controller.handleDialChange({ index: 2, progress: 1.6, isDragging: true, source: 'clock' });
    controller.handleDialChange({ index: 2, progress: 1.6, isDragging: false, source: 'clock' });

    const transition = controller.timeTransition();
    expect(transition.id).toBe(2);
    expect(transition.phase).toBe('settling');
    expect(transition.progress).toBe(1.6);
    expect(transition.targetProgress).toBeCloseTo(2);
    controller.handleAnimationUpdate({ id: 1, progress: 1.8, finished: true });
    expect(controller.cycleProgress()).toBe(1.6);

    controller.handleAnimationUpdate({ id: 2, progress: 1.8, finished: false });
    expect(controller.cycleProgress()).toBe(1.8);
    controller.handleAnimationUpdate({ id: 2, progress: 2, finished: true });
    expect(controller.cycleProgress()).toBeCloseTo(2);
    expect(controller.timeTransition()).toMatchObject({ id: 2, phase: 'idle' });
    expect(controller.timeTransition().progress).toBeCloseTo(2);
  });

  it('turns an external theme change into the same semantic settle transition', () => {
    const { controller, theme } = createController();

    theme.theme.set('dark');
    TestBed.flushEffects();

    expect(controller.timeTransition()).toMatchObject({
      id: 1,
      phase: 'settling',
      progress: 1,
      targetProgress: 3,
      source: 'theme',
    });
  });

  it('advances a stage through the shared semantic transition', () => {
    const { controller, theme } = createController();

    controller.advanceTheme(1);

    expect(controller.timeTransition()).toMatchObject({
      id: 1,
      phase: 'settling',
      progress: 1,
      targetProgress: 2,
      source: 'swipe',
    });
    expect(theme.theme()).toBe('raccoon');
  });
});

function createController(): {
  readonly controller: DioramaTimeController;
  readonly theme: {
    readonly theme: WritableSignal<Theme>;
    readonly setPreset: ReturnType<typeof vi.fn>;
  };
} {
  const themeState = signal<Theme>('craft');
  const theme = {
    theme: themeState,
    setPreset: vi.fn((next: Theme) => themeState.set(next)),
  };
  TestBed.configureTestingModule({
    providers: [
      DioramaTimeController,
      { provide: ThemeService, useValue: theme as unknown as ThemeService },
      {
        provide: UiPreferencesService,
        useValue: {
          effectivePreferences: () => ({ accessibility: { sceneAnimationsEnabled: true } }),
        },
      },
    ],
  });
  return { controller: TestBed.inject(DioramaTimeController), theme };
}
