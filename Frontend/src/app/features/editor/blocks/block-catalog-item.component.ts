import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import {
  LucideBox,
  LucideCircleHelp,
  LucideInfo,
  LucidePlus,
  LucideCheck,
  LucideCopy,
} from '@lucide/angular';
import type { PlaceableItemDefinition } from '../../../core/blocks/placement-palette/placeable-item.types';
import { BlockLibraryService } from '../../../core/blocks/catalog/block-library.service';
import { ContentAssetRuntimeService } from '../../../core/assets/content-asset-runtime.service';
import { QuickBlockBarService } from '../../../core/editor/quick-bar/quick-block-bar.service';
import { I18nService } from '../../../core/ui/localization/i18n.service';
import {
  ThumbnailVisibilityDirective,
  type VisibilityEvent,
} from '../../../shared/ui/thumbnail-visibility/thumbnail-visibility.directive';
import { UiTooltipDirective } from '../../../shared/ui/tooltip/ui-tooltip.directive';
import type { BlockCatalogView } from './block-catalog-layout';

export function registryIdDisplayParts(registryId: string): readonly string[] {
  return registryId.match(/[^:_]*[:_]|[^:_]+$/g) ?? [registryId];
}

@Component({
  selector: 'app-block-catalog-item',
  imports: [
    LucideBox,
    LucideCircleHelp,
    LucideInfo,
    LucidePlus,
    LucideCheck,
    LucideCopy,
    ThumbnailVisibilityDirective,
    UiTooltipDirective,
  ],
  templateUrl: './block-catalog-item.component.html',
  styleUrl: './block-catalog-item.component.scss',
  host: {
    '[attr.data-item-id]': 'item().itemId',
    '[class.grid-item]': 'layout() === "grid"',
    '[class.list-item]': 'layout() === "list"',
    '[class.detail-item]': 'layout() === "details"',
    '[class.active]': 'active()',
  },
})
export class BlockCatalogItemComponent {
  readonly item = input.required<PlaceableItemDefinition>();
  readonly layout = input<BlockCatalogView | 'details'>('grid');
  readonly tabStop = input(true);
  readonly selected = output<PlaceableItemDefinition>();
  readonly detailsRequested = output<PlaceableItemDefinition>();
  protected readonly i18n = inject(I18nService);
  protected readonly assets = inject(ContentAssetRuntimeService);
  private readonly library = inject(BlockLibraryService);
  private readonly quick = inject(QuickBlockBarService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly thumbnail = computed(() => this.assets.thumbnailUrlForItem(this.item()));
  protected readonly idParts = computed(() => registryIdDisplayParts(this.item().displayBlockId));
  protected readonly active = computed(() => {
    const active = this.library.activeBlock.active();
    return (active?.itemId ?? active?.id) === this.item().itemId;
  });
  private readonly quickEntry = computed(() => {
    const item = this.item();
    return {
      id: item.displayBlockId,
      itemId: item.itemId,
      placementKind: item.placementKind,
      state: item.defaultState,
      support: item.support,
      displayName: item.displayName,
    };
  });
  protected readonly added = computed(() => this.quick.has(this.quickEntry()));
  protected readonly canAdd = computed(() => !this.added() && this.quick.canAdd(this.quickEntry()));
  protected readonly quickLabel = computed(() =>
    this.i18n.t(
      this.added() ? 'alreadyInQuickBar' : this.quick.isFull() ? 'quickBarFull' : 'addToQuickBar',
    ),
  );
  private readonly copyFeedback = linkedSignal<'' | 'catalogIdCopied' | 'catalogCopyUnavailable'>(
    () => {
      this.item();
      return '';
    },
  );
  protected readonly copyMessage = computed(() =>
    this.i18n.t(this.copyFeedback() || 'catalogDetailsHint'),
  );

  protected requestThumbnail(event: VisibilityEvent): void {
    this.assets.requestItemThumbnail(
      this.item(),
      this.layout() === 'details' ? 'selected' : event.priority,
    );
  }
  protected add(): void {
    if (this.canAdd())
      this.quick.add({ ...this.quickEntry(), state: { ...this.item().defaultState } });
  }
  protected async copyId(): Promise<void> {
    const item = this.item();
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(item.itemId);
      if (!this.destroyRef.destroyed && this.item() === item)
        this.copyFeedback.set('catalogIdCopied');
    } catch {
      if (!this.destroyRef.destroyed && this.item() === item)
        this.copyFeedback.set('catalogCopyUnavailable');
    }
  }
}
