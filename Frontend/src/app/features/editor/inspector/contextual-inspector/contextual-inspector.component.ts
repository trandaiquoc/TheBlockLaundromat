import { Component, computed, inject, linkedSignal, output } from '@angular/core';
import { I18nService } from '../../../../core/ui/localization/i18n.service';
import { EditorToolService } from '../../../../core/editor/state/tool.service';
import { ActiveBlockService } from '../../../../core/blocks/placement-palette/active-block.service';
import { DecorationService } from '../../../../core/decorations/decoration.service';
import { SelectionInspectorComponent } from '../selection-inspector/selection-inspector.component';
import { InspectorBlockIdentityComponent } from '../block-identity/inspector-block-identity.component';

type InspectorContext = 'placement' | 'selection';

@Component({
  selector: 'app-contextual-inspector',
  imports: [SelectionInspectorComponent, InspectorBlockIdentityComponent],
  templateUrl: './contextual-inspector.component.html',
  styleUrl: './contextual-inspector.component.scss',
})
export class ContextualInspectorComponent {
  readonly selectAllRequested = output<void>();
  readonly clearSelectionRequested = output<void>();
  protected readonly i18n = inject(I18nService);
  private readonly tool = inject(EditorToolService);
  protected readonly active = inject(ActiveBlockService);
  protected readonly decorations = inject(DecorationService);
  protected readonly context = linkedSignal<InspectorContext>(() =>
    this.tool.active() === 'place' ? 'placement' : 'selection',
  );
  protected readonly stateEntries = computed(() =>
    Object.entries(this.active.active()?.state ?? {}),
  );
}
