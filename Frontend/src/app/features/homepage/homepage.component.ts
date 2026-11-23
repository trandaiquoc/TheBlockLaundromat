import {
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { I18nService } from '../../core/ui/localization/i18n.service';
import { UiPreferencesService } from '../../core/ui/preferences/ui-preferences.service';
import type { HomepageMode } from '../../core/ui/preferences/ui-preferences.service';
import { ProjectScreenComponent } from '../projects/project-screen/project-screen.component';
import { SettingsDialogComponent } from '../editor/settings/settings-dialog/settings-dialog.component';
import { DioramaHomeComponent } from './diorama/diorama-home.component';

@Component({
  selector: 'app-homepage',
  imports: [ProjectScreenComponent, DioramaHomeComponent, SettingsDialogComponent],
  templateUrl: './homepage.component.html',
})
export class HomepageComponent {
  protected readonly i18n = inject(I18nService);
  private readonly preferences = inject(UiPreferencesService);
  private readonly injector = inject(Injector);
  private readonly host = inject(ElementRef<HTMLElement>);
  protected readonly mode = computed(() => this.preferences.preferences().appearance.homepageMode);
  protected readonly settingsDialogOpen = signal(false);

  protected setHomepageMode(mode: HomepageMode): void {
    if (mode === this.mode()) return;
    this.preferences.setAppearance({ homepageMode: mode });
    afterNextRender(
      () =>
        (this.host.nativeElement as HTMLElement)
          .querySelector<HTMLButtonElement>('.homepage-account-trigger')
          ?.focus({ preventScroll: true }),
      { injector: this.injector },
    );
  }

  protected openSettings(): void {
    this.settingsDialogOpen.set(true);
  }

  protected closeSettings(): void {
    this.settingsDialogOpen.set(false);
  }
}
