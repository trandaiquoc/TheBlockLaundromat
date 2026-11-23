import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UiPreferencesService } from '../../../core/ui/preferences/ui-preferences.service';
import { ThemeService } from '../../../core/ui/theme/theme.service';
import type { DioramaIntent } from './diorama-contracts';
import { DioramaSceneRuntime } from './diorama-scene-runtime';
import { DioramaSceneComponent } from './diorama-scene.component';

afterEach(() => vi.restoreAllMocks());

describe('DioramaSceneComponent', () => {
  it('forwards theme and scene-motion preference changes after the runtime mounts', async () => {
    vi.spyOn(DioramaSceneRuntime.prototype, 'mount').mockReturnValue(true);
    const setTheme = vi.spyOn(DioramaSceneRuntime.prototype, 'setTheme');
    const setSceneAnimationsEnabled = vi.spyOn(
      DioramaSceneRuntime.prototype,
      'setSceneAnimationsEnabled',
    );
    const setTimeTransition = vi.spyOn(DioramaSceneRuntime.prototype, 'setTimeTransition');
    vi.spyOn(DioramaSceneRuntime.prototype, 'dispose').mockImplementation(() => {});

    const fixture = TestBed.createComponent(DioramaSceneComponent);
    const initialTransition = {
      id: 0,
      phase: 'idle',
      progress: 1,
      targetProgress: 1,
      source: 'theme',
    } as const;
    fixture.componentRef.setInput('timeTransition', initialTransition);
    fixture.componentRef.setInput('timeProgress', 1);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(setTheme).toHaveBeenCalledWith('craft');
    expect(setSceneAnimationsEnabled).toHaveBeenCalledWith(true);
    expect(setTimeTransition).toHaveBeenCalledWith(initialTransition);

    const nextTransition = {
      id: 1,
      phase: 'settling',
      progress: 1,
      targetProgress: 2,
      source: 'swipe',
    } as const;
    fixture.componentRef.setInput('timeTransition', nextTransition);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(setTimeTransition).toHaveBeenCalledWith(nextTransition);

    TestBed.inject(ThemeService).setPreset('raccoon');
    TestBed.inject(UiPreferencesService).setAccessibility({ sceneAnimationsEnabled: false });
    await fixture.whenStable();

    expect(setTheme).toHaveBeenCalledWith('raccoon');
    expect(setSceneAnimationsEnabled).toHaveBeenCalledWith(false);
    fixture.destroy();
  });

  it('opens the Courier project flow for a scene click without changing toolbar-only focus', async () => {
    vi.spyOn(DioramaSceneRuntime.prototype, 'mount').mockReturnValue(true);
    vi.spyOn(DioramaSceneRuntime.prototype, 'greetRaccoon').mockImplementation(() => undefined);
    vi.spyOn(DioramaSceneRuntime.prototype, 'dispose').mockImplementation(() => undefined);

    const fixture = TestBed.createComponent(DioramaSceneComponent);
    fixture.componentRef.setInput('timeTransition', {
      id: 0,
      phase: 'idle',
      progress: 0,
      targetProgress: 0,
      source: 'theme',
    });
    fixture.componentRef.setInput('timeProgress', 0);
    fixture.detectChanges();
    await fixture.whenStable();
    const activation = vi.fn();
    fixture.componentInstance.courierActivated.subscribe(activation);

    const scene = fixture.componentInstance as unknown as {
      handleSceneIntent(intent: DioramaIntent): void;
    };
    scene.handleSceneIntent({ type: 'greet-raccoon' });
    expect(activation).toHaveBeenCalledOnce();

    const toolbar = fixture.componentInstance as unknown as {
      handleFocusAction(action: 'raccoon'): void;
    };
    toolbar.handleFocusAction('raccoon');
    expect(activation).toHaveBeenCalledOnce();
    fixture.destroy();
  });
});
