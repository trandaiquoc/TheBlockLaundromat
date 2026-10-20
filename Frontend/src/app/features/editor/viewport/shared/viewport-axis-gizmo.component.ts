import { Component, inject, output } from '@angular/core';
import type { CameraPreset } from '../../../../core/editor/camera/camera';
import { I18nService } from '../../../../core/ui/localization/i18n.service';
import type { TranslationKey } from '../../../../core/ui/localization/translation-catalogs';

@Component({
  selector: 'app-viewport-axis-gizmo',
  template: `
    <nav class="axis-gizmo" [attr.aria-label]="i18n.t('cameraPresets')">
      <span class="axis-gizmo-center" aria-hidden="true"></span>
      <span class="axis-line axis-line-x" aria-hidden="true"></span>
      <span class="axis-line axis-line-y" aria-hidden="true"></span>
      <span class="axis-line axis-line-z" aria-hidden="true"></span>
      @for (axis of axes; track axis.preset) {
        <button
          type="button"
          class="axis-endpoint"
          [class.axis-endpoint-x]="axis.axis === 'X'"
          [class.axis-endpoint-y]="axis.axis === 'Y'"
          [class.axis-endpoint-z]="axis.axis === 'Z'"
          [class.axis-endpoint-negative]="axis.negative"
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
      left: 2.63rem;
      top: 2.62rem;
      width: 2rem;
      transform: rotate(-26deg);
      background: var(--axis-x);
    }
    .axis-line-y {
      left: 2.61rem;
      top: 2.42rem;
      width: 1.75rem;
      transform: rotate(-90deg);
      background: var(--axis-y);
    }
    .axis-line-z {
      left: 2.6rem;
      top: 2.65rem;
      width: 1.95rem;
      transform: rotate(25deg);
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
    .axis-endpoint:hover {
      background: var(--surface-hover);
      transform: scale(1.08);
    }
    .axis-endpoint:focus-visible {
      outline: 2px solid var(--focus-color);
      outline-offset: 2px;
    }
    .axis-endpoint-x {
      --axis-color: var(--axis-x);
      left: 3.9rem;
      top: 1.2rem;
    }
    .axis-endpoint-y {
      --axis-color: var(--axis-y);
      left: 1.85rem;
      top: 0.15rem;
    }
    .axis-endpoint-z {
      --axis-color: var(--axis-z);
      left: 3.9rem;
      top: 3.35rem;
    }
    .axis-endpoint-negative {
      opacity: 0.68;
      font-size: 0.65rem;
    }
    .axis-endpoint-x.axis-endpoint-negative {
      left: 0.4rem;
      top: 3.45rem;
    }
    .axis-endpoint-y.axis-endpoint-negative {
      left: 1.85rem;
      top: 3.65rem;
    }
    .axis-endpoint-z.axis-endpoint-negative {
      left: 0.4rem;
      top: 1.05rem;
    }
    @media (prefers-reduced-motion: no-preference) {
      .axis-endpoint {
        transition:
          transform 120ms ease,
          background-color 120ms ease;
      }
    }
  `,
  standalone: true,
})
export class ViewportAxisGizmoComponent {
  protected readonly i18n = inject(I18nService);
  readonly selectPreset = output<CameraPreset>();
  protected readonly axes: readonly {
    readonly axis: 'X' | 'Y' | 'Z';
    readonly preset: CameraPreset;
    readonly label: TranslationKey;
    readonly negative?: boolean;
  }[] = [
    { axis: 'X', preset: 'right', label: 'cameraRight' },
    { axis: 'X', preset: 'left', label: 'cameraLeft', negative: true },
    { axis: 'Y', preset: 'top', label: 'cameraTop' },
    { axis: 'Y', preset: 'bottom', label: 'cameraBottom', negative: true },
    { axis: 'Z', preset: 'front', label: 'cameraFront' },
    { axis: 'Z', preset: 'back', label: 'cameraBack', negative: true },
  ];
}
