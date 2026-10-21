import { Component, computed, input } from '@angular/core';
import type { HomespaceProjectionSurface } from './homespace-scene-contract';
import { cssMatrix3d, projectiveMatrixForSurface } from './homespace-projective-transform';

@Component({
  selector: 'app-homespace-projective-surface',
  template: `
    <div
      class="projective-surface"
      [style.width.px]="plane().width"
      [style.height.px]="plane().height"
      [style.transform]="transform()"
    >
      <ng-content />
    </div>
  `,
  styles: `
    .projective-surface {
      position: absolute;
      top: 0;
      left: 0;
      transform-origin: top left;
      pointer-events: auto;
    }
  `,
})
export class HomespaceProjectiveSurfaceComponent {
  readonly plane = input.required<HomespaceProjectionSurface>();
  protected readonly transform = computed(() =>
    cssMatrix3d(projectiveMatrixForSurface(this.plane())),
  );
}
