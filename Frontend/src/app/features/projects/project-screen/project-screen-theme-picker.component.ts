import { Component, inject } from '@angular/core';
import { I18nService } from '../../../core/ui/localization/i18n.service';
import type { TranslationKey } from '../../../core/ui/localization/translation-catalogs';
import { ThemeService, type Theme } from '../../../core/ui/theme/theme.service';

interface ProjectScreenThemeOption {
  readonly id: Theme;
  readonly labelKey: TranslationKey;
}

const themeOptions: readonly ProjectScreenThemeOption[] = [
  { id: 'craft', labelKey: 'themeMinecraft' },
  { id: 'raccoon', labelKey: 'themeRaccoon' },
  { id: 'light', labelKey: 'themeLight' },
  { id: 'dark', labelKey: 'themeDark' },
];

@Component({
  selector: 'app-project-screen-theme-picker',
  templateUrl: './project-screen-theme-picker.component.html',
  styleUrl: './project-screen-theme-picker.component.scss',
})
export class ProjectScreenThemePickerComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly themeService = inject(ThemeService);
  protected readonly themeOptions = themeOptions;

  protected setTheme(theme: Theme): void {
    this.themeService.setPreset(theme);
  }
}
