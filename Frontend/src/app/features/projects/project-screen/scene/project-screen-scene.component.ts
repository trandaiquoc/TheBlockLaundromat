import { NgOptimizedImage } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import type { Theme } from '../../../../core/ui/theme/theme.service';
import { PROJECT_SCREEN_SCENE_ASSETS } from './project-screen-scene-assets';

@Component({
  selector: 'app-project-screen-scene',
  imports: [NgOptimizedImage],
  templateUrl: './project-screen-scene.component.html',
  styleUrl: './project-screen-scene.component.scss',
})
export class ProjectScreenSceneComponent {
  readonly theme = input.required<Theme>();
  protected readonly scene = computed(() => PROJECT_SCREEN_SCENE_ASSETS[this.theme()]);
}
