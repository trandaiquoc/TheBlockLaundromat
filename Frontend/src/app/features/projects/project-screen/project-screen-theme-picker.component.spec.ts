import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';
import { ThemeService, type Theme } from '../../../core/ui/theme/theme.service';
import { I18nService } from '../../../core/ui/localization/i18n.service';
import type { TranslationKey } from '../../../core/ui/localization/translation-catalogs';
import { ProjectScreenThemePickerComponent } from './project-screen-theme-picker.component';

describe('ProjectScreenThemePickerComponent', () => {
  it('switches the selected interface theme', async () => {
    const theme = signal<Theme>('craft');
    const themeService = {
      theme,
      setPreset: vi.fn((next: Theme) => theme.set(next)),
    } as unknown as ThemeService;

    await TestBed.configureTestingModule({
      imports: [ProjectScreenThemePickerComponent],
      providers: [
        { provide: I18nService, useValue: { t: (key: TranslationKey) => key } },
        { provide: ThemeService, useValue: themeService },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ProjectScreenThemePickerComponent);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const themeButtons = Array.from(host.querySelectorAll('.theme-button'));

    expect(
      host.querySelector('.theme-button[data-theme-option="craft"]')?.getAttribute('aria-pressed'),
    ).toBe('true');
    expect(themeButtons.map((button) => button.textContent?.trim())).toEqual([
      'themeMinecraft',
      'themeRaccoon',
      'themeLight',
      'themeDark',
    ]);

    (host.querySelector('.theme-button[data-theme-option="raccoon"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(themeService.setPreset).toHaveBeenCalledWith('raccoon');
    expect(
      host
        .querySelector('.theme-button[data-theme-option="raccoon"]')
        ?.getAttribute('aria-pressed'),
    ).toBe('true');
  });
});
