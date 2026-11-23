import { Component, computed, inject, output, signal, viewChild } from '@angular/core';
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
import type { DioramaTarget } from './diorama-contracts';
import type { DioramaWasherOverlayProjection } from './diorama-washer-overlay-projector';
import { DioramaSpatialNavigation } from './diorama-spatial-navigation';
import type { DioramaTimeAnimationUpdate } from './diorama-time-transition';

const hiddenWasherOverlay: DioramaWasherOverlayProjection = {
  preview: { x: 0, y: 0, visible: false },
  previewDiameter: 0,
  projectName: { x: 0, y: 0, width: 0, height: 0, visible: false },
};

@Component({
  selector: 'app-diorama-home',
  imports: [
    HomepageAccountMenuComponent,
    DioramaHomeHeaderComponent,
    DioramaSceneComponent,
    DioramaProjectWorkspaceComponent,
    DioramaTimeDialComponent,
  ],
  providers: [DioramaTimeController],
  templateUrl: './diorama-home.component.html',
  styleUrl: './diorama-home.component.scss',
})
export class DioramaHomeComponent {
  protected readonly themeService = inject(ThemeService);
  protected readonly time = inject(DioramaTimeController);
  protected readonly navigation = new DioramaSpatialNavigation();
  protected readonly cameraRequest = computed(() => this.navigation.cameraRequest());
  protected readonly focusedTarget = computed(() => {
    const state = this.navigation.state();
    return state.phase === 'focused' ? state.target : undefined;
  });
  protected readonly hotspotsEnabled = computed(() => this.navigation.state().phase === 'overview');
  protected readonly washerOverlayProjection = signal(hiddenWasherOverlay);
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

  protected handleTargetActivated(target: DioramaTarget): void {
    this.navigation.focus(target);
  }

  protected handleCameraSettled(requestId: number): void {
    const state = this.navigation.state();
    if (!this.navigation.cameraSettled(requestId)) return;
    if (state.phase === 'returning') {
      queueMicrotask(() => this.scene()?.focusHotspot(state.target));
    } else if (state.phase === 'focusing' && state.target !== 'courier') {
      queueMicrotask(() => this.projectWorkspace()?.focusPanel(state.target));
    }
  }

  protected handleBackRequested(): void {
    this.navigation.back();
  }

  protected handleTargetRequested(target: DioramaTarget): void {
    this.navigation.focus(target);
  }

  protected handleWasherOverlayProjection(projection: DioramaWasherOverlayProjection): void {
    this.washerOverlayProjection.set(projection);
  }

  protected handleEscape(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLElement && target.closest('[role="dialog"], .project-import-dialog'))
      return;
    if (!this.navigation.back()) return;
    event.preventDefault();
  }
}
