import { Component, computed, inject } from '@angular/core';
import { I18nService } from '../../core/ui/localization/i18n.service';
import { UiPreferencesService } from '../../core/ui/preferences/ui-preferences.service';
import { ProjectScreenComponent } from '../projects/project-screen/project-screen.component';
import { DioramaHomeComponent } from './diorama/diorama-home.component';

@Component({
  selector: 'app-homepage',
  imports: [ProjectScreenComponent, DioramaHomeComponent],
  templateUrl: './homepage.component.html',
})
export class HomepageComponent {
  protected readonly i18n = inject(I18nService);
  private readonly preferences = inject(UiPreferencesService);
  protected readonly mode = computed(() => this.preferences.preferences().appearance.homepageMode);
}
