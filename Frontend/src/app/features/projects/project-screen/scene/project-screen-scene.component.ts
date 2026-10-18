import { NgOptimizedImage } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import type { Theme } from '../../../../core/ui/theme/theme.service';
import {
  PROJECT_SCREEN_SCENE_ASSETS,
  PROJECT_SCREEN_WASHER_MASCOT_STATES,
  type ProjectScreenMascotState,
} from './project-screen-scene-assets';

@Component({
  selector: 'app-project-screen-scene',
  imports: [NgOptimizedImage],
  templateUrl: './project-screen-scene.component.html',
  styleUrl: './project-screen-scene.component.scss',
})
export class ProjectScreenSceneComponent {
  readonly theme = input.required<Theme>();
  readonly mascotState = input<ProjectScreenMascotState>('idle');
  readonly animationsEnabled = input(false);
  protected readonly scene = computed(() => PROJECT_SCREEN_SCENE_ASSETS[this.theme()]);
  protected readonly washerMascotStateAsset = computed(
    () => PROJECT_SCREEN_WASHER_MASCOT_STATES[this.mascotState()],
  );
}
