import { Component, computed, effect, inject, input } from '@angular/core';
import { ContentAssetRuntimeService } from '../../../../core/assets/content-asset-runtime.service';
import { BlockLibraryService } from '../../../../core/blocks/catalog/block-library.service';
import { LucideBox } from '@lucide/angular';

@Component({
  selector: 'app-inspector-block-identity',
  imports: [LucideBox],
  templateUrl: './inspector-block-identity.component.html',
  styleUrl: './inspector-block-identity.component.scss',
})
export class InspectorBlockIdentityComponent {
  readonly blockId = input.required<string>();
  readonly itemId = input<string>();
  private readonly library = inject(BlockLibraryService);
  private readonly assets = inject(ContentAssetRuntimeService);
  private readonly item = computed(() => {
    this.library.catalogRevision();
    return this.library.getItem(this.itemId() ?? this.blockId());
  });
  protected readonly name = computed(
    () =>
      this.item()?.displayName ?? this.library.get(this.blockId())?.displayName ?? this.blockId(),
  );
  protected readonly thumbnail = computed(() =>
    this.item() ? this.assets.thumbnailUrlForItem(this.item()!) : undefined,
  );
  constructor() {
    effect(() => {
      const item = this.item();
      if (item) this.assets.requestItemThumbnail(item, 'selected');
    });
  }
}
