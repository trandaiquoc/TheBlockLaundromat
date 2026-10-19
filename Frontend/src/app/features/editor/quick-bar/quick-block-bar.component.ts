import { Component, computed, DestroyRef, effect, inject, linkedSignal } from '@angular/core';
import {
  CdkConnectedOverlay,
  CdkOverlayOrigin,
  type ConnectedPosition,
} from '@angular/cdk/overlay';
import { CdkScrollable } from '@angular/cdk/scrolling';
import {
  QuickBlockBarService,
  quickEntryMatchesActive,
  quickStateKey,
} from '../../../core/editor/quick-bar/quick-block-bar.service';
import { I18nService } from '../../../core/ui/localization/i18n.service';
import { BlockLibraryService } from '../../../core/blocks/catalog/block-library.service';
import { ContentAssetRuntimeService } from '../../../core/assets/content-asset-runtime.service';
import {
  LucideBox,
  LucideCheck,
  LucideChevronDown,
  LucideChevronUp,
  LucideX,
} from '@lucide/angular';
import { UiTooltipDirective } from '../../../shared/ui/tooltip/ui-tooltip.directive';

@Component({
  selector: 'app-quick-block-bar',
  imports: [
    LucideBox,
    LucideCheck,
    LucideChevronDown,
    LucideChevronUp,
    LucideX,
    UiTooltipDirective,
    CdkOverlayOrigin,
    CdkConnectedOverlay,
    CdkScrollable,
  ],
  templateUrl: './quick-block-bar.component.html',
  styleUrl: './quick-block-bar.component.scss',
})
export class QuickBlockBarComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly quick = inject(QuickBlockBarService);
  private readonly library = inject(BlockLibraryService);
  protected readonly assets = inject(ContentAssetRuntimeService);
  private nameDismissTimer?: ReturnType<typeof setTimeout>;
  private readonly nameTarget = linkedSignal<{ key: string; origin: CdkOverlayOrigin } | null>(
    () => {
      this.quick.entries();
      this.quick.collapsed();
      return null;
    },
  );
  protected readonly namePositions: ConnectedPosition[] = [
    { originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom', offsetY: -10 },
    { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top', offsetY: 10 },
  ];
  protected readonly materialName = computed(() => {
    const target = this.nameTarget();
    const entry = target && this.entries().find((entry) => entry.key === target.key);
    return entry ? { origin: target.origin, entry } : null;
  });
  private readonly thumbnailSync = effect(() => {
    this.assets.generation();
    for (const entry of this.quick.entries()) {
      const item = this.library.getItem(entry.itemId) ?? this.library.itemForBlock(entry.id);
      if (item)
        this.assets.prepareItemThumbnail({
          ...item,
          defaultState: entry.state,
          previewState: entry.state,
        });
      else this.assets.prepareThumbnail(entry.itemId, entry.state);
    }
  });
  protected readonly entries = computed(() => {
    const active = this.quick.active();
    const items = this.library.allItems();
    return this.quick.entries().map((entry) => {
      const state = quickStateKey(entry.state);
      return {
        ...entry,
        key: `${entry.itemId}|${state}`,
        thumbnail: this.assets.thumbnailUrl(entry.itemId, entry.state),
        active: quickEntryMatchesActive(entry, active, !!this.library.getItem(entry.itemId), items),
      };
    });
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.cancelNameDismiss());
  }

  protected showName(key: string, origin: CdkOverlayOrigin, event?: PointerEvent): void {
    if (event?.pointerType === 'touch') return;
    this.cancelNameDismiss();
    this.nameTarget.set({ key, origin });
  }

  protected leaveName(origin: CdkOverlayOrigin): void {
    if (origin.elementRef.nativeElement !== document.activeElement) this.scheduleNameDismiss();
  }

  protected scheduleNameDismiss(): void {
    this.cancelNameDismiss();
    this.nameDismissTimer = setTimeout(() => this.hideName(), 150);
  }

  protected cancelNameDismiss(): void {
    clearTimeout(this.nameDismissTimer);
    this.nameDismissTimer = undefined;
  }

  protected handleNameKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') this.hideName(event);
  }

  protected hideName(event?: Event): void {
    this.cancelNameDismiss();
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.nameTarget.set(null);
  }
}
