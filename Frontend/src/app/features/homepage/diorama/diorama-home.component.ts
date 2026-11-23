import { Component, inject, output, viewChild } from '@angular/core';
import type { HomepageMode } from '../../../core/ui/preferences/ui-preferences.service';
import { ThemeService } from '../../../core/ui/theme/theme.service';
import { HomepageAccountMenuComponent } from '../account-menu/homepage-account-menu.component';
import { DioramaHomeHeaderComponent } from './diorama-home-header.component';
import { DioramaSceneComponent } from './diorama-scene.component';
import { DioramaProjectWorkspaceComponent } from './diorama-project-workspace.component';
import {
  DioramaTimeDialComponent,
  type DioramaTimeDialChange,
} from './diorama-time-dial.component';
import { DioramaTimeController } from './diorama-time-controller';
import { DioramaProjectProjectionBridge } from './diorama-project-projection-bridge';
import type { DioramaTimeAnimationUpdate } from './diorama-time-transition';

@Component({
  selector: 'app-diorama-home',
  imports: [
    HomepageAccountMenuComponent,
    DioramaHomeHeaderComponent,
    DioramaSceneComponent,
    DioramaProjectWorkspaceComponent,
    DioramaTimeDialComponent,
  ],
  providers: [DioramaTimeController, DioramaProjectProjectionBridge],
  templateUrl: './diorama-home.component.html',
  styleUrl: './diorama-home.component.scss',
})
export class DioramaHomeComponent {
  protected readonly themeService = inject(ThemeService);
  protected readonly time = inject(DioramaTimeController);
  readonly homepageModeRequested = output<HomepageMode>();
  readonly settingsRequested = output<void>();
  private readonly scene = viewChild(DioramaSceneComponent);
  private readonly projectWorkspace = viewChild(DioramaProjectWorkspaceComponent);

  protected handleTimeDialChange(change: DioramaTimeDialChange): void {
    this.time.handleDialChange(change);
  }

  protected handleTimeAnimationUpdate(update: DioramaTimeAnimationUpdate): void {
    this.time.handleAnimationUpdate(update);
  }

  protected handleProjectBoardReturn(): void {
    this.scene()?.focusOverviewFromWorkspace();
  }

  protected handleCourierActivated(): void {
    this.projectWorkspace()?.openCourierProjectDialog();
  }
}
