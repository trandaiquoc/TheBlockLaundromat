import { Component, inject, input, output } from '@angular/core';
import {
  LucideClipboardList,
  LucideCompass,
  LucidePawPrint,
  LucideWashingMachine,
} from '@lucide/angular';
import { I18nService } from '../../core/ui/localization/i18n.service';
import type { MiniDioramaTarget } from './mini-diorama-contracts';

export type MiniDioramaFocusAction = 'overview' | MiniDioramaTarget;

@Component({
  selector: 'app-mini-diorama-scene-focus-toolbar',
  imports: [LucideCompass, LucideClipboardList, LucideWashingMachine, LucidePawPrint],
  templateUrl: './mini-diorama-scene-focus-toolbar.component.html',
  styleUrl: './mini-diorama-scene-focus-toolbar.component.scss',
})
export class MiniDioramaSceneFocusToolbarComponent {
  protected readonly i18n = inject(I18nService);
  readonly selectedTarget = input<MiniDioramaTarget | undefined>(undefined);
  readonly actionRequested = output<MiniDioramaFocusAction>();
}
