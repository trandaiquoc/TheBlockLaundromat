import {
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { LucideChevronLeft, LucideChevronRight, LucideSlidersHorizontal } from '@lucide/angular';
import { I18nService } from '../../../../core/ui/localization/i18n.service';
import type { YLayerVisibility } from '../../../../core/editor/viewport/y-layer';
import { ThemedSelectComponent } from '../../../../shared/ui/themed-select/themed-select.component';

export type LayerControlAction =
  | { type: 'preview' | 'commit'; value: string }
  | { type: 'step' | 'adjacent'; direction: -1 | 1 }
  | { type: 'jump'; position: 'first' | 'last' }
  | { type: 'visibility'; value: YLayerVisibility }
  | { type: 'opacity'; value: string };

@Component({
  selector: 'app-layer-controls',
  imports: [ThemedSelectComponent, LucideChevronLeft, LucideChevronRight, LucideSlidersHorizontal],
  templateUrl: './layer-controls.component.html',
  styleUrl: './layer-controls.component.scss',
  host: {
    '(document:click)': 'closeFromOutside($event)',
    '(document:focusin)': 'closeFromOutside($event)',
  },
})
export class LayerControlsComponent {
  readonly currentY = input.required<number>();
  readonly maximumY = input.required<number>();
  readonly busy = input(false);
  readonly updating = input(false);
  readonly active = input(true);
  readonly visibility = input.required<YLayerVisibility>();
  readonly opacity = input.required<number>();
  readonly action = output<LayerControlAction>();
  protected readonly i18n = inject(I18nService);
  private readonly options = viewChild<ElementRef<HTMLDetailsElement>>('options');
  protected readonly visibilityOptions = computed(() => [
    { id: 'current-only', label: this.i18n.t('visibilityCurrent') },
    { id: 'current-previous', label: this.i18n.t('visibilityPrevious') },
    { id: 'current-next', label: this.i18n.t('visibilityNext') },
    { id: 'previous-current-next', label: this.i18n.t('visibilityThree') },
    { id: 'all-below', label: this.i18n.t('visibilityBelow') },
    { id: 'whole-structure', label: this.i18n.t('visibilityWhole') },
  ]);

  constructor() {
    effect(() => {
      if (!this.active()) this.close();
    });
  }
  protected chooseVisibility(value: string): void {
    const option = this.visibilityOptions().find((entry) => entry.id === value);
    if (option) this.action.emit({ type: 'visibility', value: option.id as YLayerVisibility });
  }
  protected closeFromOutside(event: Event): void {
    const options = this.options()?.nativeElement;
    if (event.target instanceof Element && event.target.closest('.cdk-overlay-container')) return;
    if (event.target instanceof Node && !options?.contains(event.target)) this.close();
  }
  protected closeFromEscape(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.close();
    this.options()?.nativeElement.querySelector('summary')?.focus();
  }
  private close(): void {
    const options = this.options()?.nativeElement;
    if (options) options.open = false;
  }
}
