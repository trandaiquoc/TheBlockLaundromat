import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UiPreferencesService } from '../../../core/ui/preferences/ui-preferences.service';
import { ThemeService } from '../../../core/ui/theme/theme.service';
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
    vi.spyOn(DioramaSceneRuntime.prototype, 'dispose').mockImplementation(() => {});

    const fixture = TestBed.createComponent(DioramaSceneComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(setTheme).toHaveBeenCalledWith('craft');
    expect(setSceneAnimationsEnabled).toHaveBeenCalledWith(true);

    TestBed.inject(ThemeService).setPreset('raccoon');
    TestBed.inject(UiPreferencesService).setAccessibility({ sceneAnimationsEnabled: false });
    await fixture.whenStable();

    expect(setTheme).toHaveBeenCalledWith('raccoon');
    expect(setSceneAnimationsEnabled).toHaveBeenCalledWith(false);
    fixture.destroy();
  });
});
