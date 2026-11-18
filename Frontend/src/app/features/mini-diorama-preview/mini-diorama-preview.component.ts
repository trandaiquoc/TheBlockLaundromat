import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../core/ui/localization/i18n.service';
import { SettingsDialogComponent } from '../editor/settings/settings-dialog/settings-dialog.component';
import { ProjectScreenControlsComponent } from '../projects/project-screen/project-screen-controls.component';
import { MiniDioramaScenePanelComponent } from './mini-diorama-scene-panel.component';

@Component({
  selector: 'app-mini-diorama-preview',
  imports: [
    RouterLink,
    ProjectScreenControlsComponent,
    SettingsDialogComponent,
    MiniDioramaScenePanelComponent,
  ],
  templateUrl: './mini-diorama-preview.component.html',
  styleUrl: './mini-diorama-preview.component.scss',
})
export class MiniDioramaPreviewComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly settingsDialogOpen = signal(false);

  protected openSettings(): void {
    this.settingsDialogOpen.set(true);
  }

  protected closeSettings(): void {
    this.settingsDialogOpen.set(false);
  }
}
