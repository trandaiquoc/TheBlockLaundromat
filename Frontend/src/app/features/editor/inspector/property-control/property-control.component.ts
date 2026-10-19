import { Component, computed, inject, input, output } from '@angular/core';
import type { ContentPropertyDescriptor } from '../../../../core/content/content-introspection';
import { I18nService } from '../../../../core/ui/localization/i18n.service';
import { ThemedSelectComponent } from '../../../../shared/ui/themed-select/themed-select.component';

export function propertyControlKind(values: readonly string[]): 'boolean' | 'segments' | 'select' {
  if (values.length === 2 && values.includes('true') && values.includes('false')) return 'boolean';
  return values.length > 1 && values.length <= 4 && values.every((value) => value.length <= 12)
    ? 'segments'
    : 'select';
}

@Component({
  selector: 'app-property-control',
  imports: [ThemedSelectComponent],
  templateUrl: './property-control.component.html',
  styleUrl: './property-control.component.scss',
})
export class PropertyControlComponent {
  readonly property = input.required<ContentPropertyDescriptor>();
  readonly value = input.required<string>();
  readonly locked = input(false);
  readonly valueChange = output<string>();
  protected readonly i18n = inject(I18nService);
  protected readonly disabled = computed(() => this.locked() || this.property().derived);
  protected readonly options = computed(() =>
    this.property().values.map((id) => ({
      id,
      label: this.i18n.stateValue(id),
    })),
  );
  protected readonly kind = computed(() => {
    const kind = propertyControlKind(this.property().values);
    return kind === 'segments' && this.options().some((option) => option.label.length > 16)
      ? 'select'
      : kind;
  });

  protected choose(value: string): void {
    if (!this.disabled() && this.property().values.includes(value)) this.valueChange.emit(value);
  }

  protected navigate(event: KeyboardEvent, index: number): void {
    const values = this.property().values;
    let next: number;
    switch (event.key) {
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = values.length - 1;
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        next = (index + 1) % values.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        next = (index + values.length - 1) % values.length;
        break;
      default:
        return;
    }
    if (next === undefined || this.disabled()) return;
    event.preventDefault();
    event.stopPropagation();
    (event.currentTarget as HTMLElement).parentElement
      ?.querySelectorAll<HTMLButtonElement>('button')
      [next]?.focus();
    this.choose(values[next]);
  }
}
