import { Component, computed, inject, input, output } from '@angular/core';
import type { CameraPreset, CameraState } from '../../../../core/editor/camera/camera';
import { I18nService } from '../../../../core/ui/localization/i18n.service';
import type { TranslationKey } from '../../../../core/ui/localization/translation-catalogs';

const AXES = [
  { axis: 'X', preset: 'right', label: 'cameraRight', vector: { x: 1, y: 0, z: 0 } },
  { axis: 'X', preset: 'left', label: 'cameraLeft', vector: { x: -1, y: 0, z: 0 } },
  { axis: 'Y', preset: 'top', label: 'cameraTop', vector: { x: 0, y: 1, z: 0 } },
  { axis: 'Y', preset: 'bottom', label: 'cameraBottom', vector: { x: 0, y: -1, z: 0 } },
  { axis: 'Z', preset: 'front', label: 'cameraFront', vector: { x: 0, y: 0, z: 1 } },
  { axis: 'Z', preset: 'back', label: 'cameraBack', vector: { x: 0, y: 0, z: -1 } },
] as const satisfies readonly {
  axis: 'X' | 'Y' | 'Z';
  preset: CameraPreset;
  label: TranslationKey;
  vector: { x: number; y: number; z: number };
}[];

@Component({
  selector: 'app-viewport-axis-gizmo',
  template: `
    <nav class="axis-gizmo" [attr.aria-label]="i18n.t('cameraPresets')">
      <span class="axis-gizmo-center" aria-hidden="true"></span>
      @for (axis of axes(); track axis.preset) {
        @if (axis.preset === 'right' || axis.preset === 'top' || axis.preset === 'front') {
          <span
            class="axis-line"
            [class.axis-line-x]="axis.axis === 'X'"
            [class.axis-line-y]="axis.axis === 'Y'"
            [class.axis-line-z]="axis.axis === 'Z'"
            [style.left.px]="axis.lineLeft"
            [style.top.px]="axis.lineTop"
            [style.width.px]="axis.lineLength"
            [style.transform]="'rotate(' + axis.lineAngle + 'deg)'"
            aria-hidden="true"
          ></span>
        }
        <button
          type="button"
          class="axis-endpoint"
          [class.axis-endpoint-x]="axis.axis === 'X'"
          [class.axis-endpoint-y]="axis.axis === 'Y'"
          [class.axis-endpoint-z]="axis.axis === 'Z'"
          [class.axis-endpoint-back]="axis.back"
          [style.left.px]="axis.left"
          [style.top.px]="axis.top"
          [attr.aria-label]="i18n.t(axis.label)"
          [title]="i18n.t(axis.label)"
          (pointerdown)="$event.stopPropagation()"
          (click)="selectPreset.emit(axis.preset)"
        >
          {{ axis.axis }}
        </button>
      }
    </nav>
  `,
  styles: `
    :host {
      position: absolute;
      z-index: 3;
      top: 1rem;
      left: 1rem;
      pointer-events: none;
    }
    .axis-gizmo {
      position: relative;
      width: 5.25rem;
      height: 5.25rem;
      pointer-events: none;
    }
    .axis-gizmo-center {
      position: absolute;
      z-index: 1;
      left: 2.35rem;
      top: 2.35rem;
      width: 0.55rem;
      height: 0.55rem;
      border: 1px solid var(--border-strong, var(--border));
      border-radius: 50%;
      background: var(--surface-raised);
    }
    .axis-line {
      position: absolute;
      height: 2px;
      transform-origin: left center;
      opacity: 0.82;
    }
    .axis-line-x {
      background: var(--axis-x);
    }
    .axis-line-y {
      background: var(--axis-y);
    }
    .axis-line-z {
      background: var(--axis-z);
    }
    .axis-endpoint {
      position: absolute;
      z-index: 2;
      display: grid;
      place-items: center;
      width: 1.55rem;
      height: 1.55rem;
      padding: 0;
      border: 1px solid color-mix(in srgb, currentColor 48%, transparent);
      border-radius: 50%;
      background: color-mix(in srgb, var(--surface-raised) 88%, transparent);
      color: var(--axis-color);
      font: 700 0.72rem var(--font-ui);
      cursor: pointer;
      pointer-events: auto;
      box-shadow: 0 1px 4px color-mix(in srgb, #000 18%, transparent);
    }
    .axis-endpoint-x {
      --axis-color: var(--axis-x);
    }
    .axis-endpoint-y {
      --axis-color: var(--axis-y);
    }
    .axis-endpoint-z {
      --axis-color: var(--axis-z);
    }
    .axis-endpoint-back {
      opacity: 0.58;
    }
    .axis-endpoint:hover {
      background: var(--surface-hover);
      transform: scale(1.08);
    }
    .axis-endpoint:focus-visible {
      outline: 2px solid var(--focus-color);
      outline-offset: 2px;
    }
    @media (prefers-reduced-motion: no-preference) {
      .axis-endpoint {
        transition:
          left 100ms ease,
          top 100ms ease,
          transform 120ms ease,
          background-color 120ms ease;
      }
    }
  `,
  standalone: true,
})
export class ViewportAxisGizmoComponent {
  protected readonly i18n = inject(I18nService);
  readonly cameraState = input<CameraState | undefined>();
  readonly selectPreset = output<CameraPreset>();
  protected readonly axes = computed(() => {
    const camera = this.cameraState();
    const target = camera?.target ?? { x: 0, y: 0, z: 0 };
    const position = camera?.position ?? { x: 8, y: 7, z: 9 };
    const up = camera?.up ?? { x: 0, y: 1, z: 0 };
    const forward = normalize({
      x: target.x - position.x,
      y: target.y - position.y,
      z: target.z - position.z,
    });
    const right = normalize(cross(forward, up));
    const screenUp = normalize(cross(right, forward));
    const center = 42;
    const radius = 28;

    return AXES.map((axis) => {
      const projectedX = dot(axis.vector, right);
      const projectedY = -dot(axis.vector, screenUp);
      const x = center + projectedX * radius;
      const y = center + projectedY * radius;
      const oppositeX = center - projectedX * radius;
      const oppositeY = center - projectedY * radius;
      return {
        ...axis,
        left: x - 12,
        top: y - 12,
        back: dot(axis.vector, forward) > 0,
        lineLeft: oppositeX,
        lineTop: oppositeY,
        lineLength: Math.hypot(x - oppositeX, y - oppositeY),
        lineAngle: (Math.atan2(y - oppositeY, x - oppositeX) * 180) / Math.PI,
      };
    });
  });
}

function dot(
  a: { x: number; y: number; z: number },
  b: { x: number; y: number; z: number },
): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function cross(
  a: { x: number; y: number; z: number },
  b: { x: number; y: number; z: number },
): { x: number; y: number; z: number } {
  return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x };
}

function normalize(vector: { x: number; y: number; z: number }): {
  x: number;
  y: number;
  z: number;
} {
  const length = Math.hypot(vector.x, vector.y, vector.z) || 1;
  return { x: vector.x / length, y: vector.y / length, z: vector.z / length };
}
