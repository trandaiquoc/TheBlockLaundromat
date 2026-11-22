import { Component, DestroyRef, ElementRef, inject, signal } from '@angular/core';
import { UiPreferencesService } from '../../../core/ui/preferences/ui-preferences.service';
import { ThemeService } from '../../../core/ui/theme/theme.service';
import { SettingsDialogComponent } from '../../editor/settings/settings-dialog/settings-dialog.component';
import { DioramaHomeAccountComponent } from './diorama-home-account.component';
import { DioramaHomeHeaderComponent } from './diorama-home-header.component';
import { DioramaSceneComponent } from './diorama-scene.component';
import {
  DioramaTimeDialComponent,
  type DioramaTimeDialChange,
} from './diorama-time-dial.component';
import { DioramaThemeSwipeInput } from './diorama-theme-swipe-input';
import { DioramaTimeController } from './diorama-time-controller';

@Component({
  selector: 'app-diorama-home',
  imports: [
    SettingsDialogComponent,
    DioramaHomeAccountComponent,
    DioramaHomeHeaderComponent,
    DioramaSceneComponent,
    DioramaTimeDialComponent,
  ],
  providers: [DioramaTimeController],
  templateUrl: './diorama-home.component.html',
  styleUrl: './diorama-home.component.scss',
})
export class DioramaHomeComponent {
  protected readonly themeService = inject(ThemeService);
  protected readonly preferences = inject(UiPreferencesService);
  protected readonly time = inject(DioramaTimeController);
  protected readonly settingsDialogOpen = signal(false);
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = inject(ElementRef<HTMLElement>);

  constructor() {
    const swipeInput = new DioramaThemeSwipeInput(this.host.nativeElement, (direction) =>
      this.time.advanceTheme(direction),
    );
    this.destroyRef.onDestroy(() => swipeInput.dispose());
  }

  protected openProjects(): void {
    this.preferences.setAppearance({ homepageMode: 'simple' });
  }

  protected handleTimeDialChange(change: DioramaTimeDialChange): void {
    this.time.handleDialChange(change);
  }

  protected openSettings(): void {
    this.settingsDialogOpen.set(true);
  }

  protected closeSettings(): void {
    this.settingsDialogOpen.set(false);
  }
}
