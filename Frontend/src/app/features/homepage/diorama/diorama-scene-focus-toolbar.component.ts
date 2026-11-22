import { Component, inject, input, output } from '@angular/core';
import {
  LucideClipboardList,
  LucideCompass,
  LucidePawPrint,
  LucideWashingMachine,
} from '@lucide/angular';
import { I18nService } from '../../../core/ui/localization/i18n.service';
import type { DioramaTarget } from './diorama-contracts';

export type DioramaFocusAction = 'overview' | DioramaTarget;

@Component({
  selector: 'app-diorama-scene-focus-toolbar',
  imports: [LucideCompass, LucideClipboardList, LucideWashingMachine, LucidePawPrint],
  templateUrl: './diorama-scene-focus-toolbar.component.html',
  styleUrl: './diorama-scene-focus-toolbar.component.scss',
})
export class DioramaSceneFocusToolbarComponent {
  protected readonly i18n = inject(I18nService);
  readonly selectedTarget = input<DioramaTarget | undefined>(undefined);
  readonly actionRequested = output<DioramaFocusAction>();
}
