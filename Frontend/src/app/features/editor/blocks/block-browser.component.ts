import {
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import {
  LucideLayoutGrid,
  LucideList,
  LucideSearch,
  LucideSettings2,
  LucideX,
} from '@lucide/angular';
import type { PlaceableItemDefinition } from '../../../core/blocks/placement-palette/placeable-item.types';
import { BlockLibraryService } from '../../../core/blocks/catalog/block-library.service';
import { I18nService } from '../../../core/ui/localization/i18n.service';
import { ContentAssetRuntimeService } from '../../../core/assets/content-asset-runtime.service';
import { DecorationService } from '../../../core/decorations/decoration.service';
import { ALL_CONTENT_SOURCE } from '../../../core/content/source-selection/content-source-selection';
import { ThemedSelectComponent } from '../../../shared/ui/themed-select/themed-select.component';
import { BlockCatalogItemComponent } from './block-catalog-item.component';
import {
  catalogColumns,
  catalogKeyboardTarget,
  catalogRowHeight,
  catalogRowIndices,
  BLOCK_CATALOG_ROW_HEIGHT,
  type BlockCatalogView,
} from './block-catalog-layout';

@Component({
  selector: 'app-block-browser',
  imports: [
    LucideLayoutGrid,
    LucideList,
    LucideSearch,
    LucideSettings2,
    LucideX,
    ThemedSelectComponent,
    BlockCatalogItemComponent,
    ScrollingModule,
  ],
  templateUrl: './block-browser.component.html',
  styleUrl: './block-browser.component.scss',
})
export class BlockBrowserComponent {
  readonly assetManagerRequested = output<void>();
  protected readonly i18n = inject(I18nService);
  protected readonly library = inject(BlockLibraryService);
  protected readonly assets = inject(ContentAssetRuntimeService);
  private readonly decorations = inject(DecorationService);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly selectedSource = signal<string>(ALL_CONTENT_SOURCE);
  protected readonly view = signal<BlockCatalogView>('grid');
  protected readonly sources = computed(() => [
    {
      id: ALL_CONTENT_SOURCE,
      label: `${this.i18n.t('allSources')} (${this.library.allPlaceableItems().length.toLocaleString(this.i18n.locale())})`,
    },
    ...this.library.placeableSourceSummaries().map((source) => ({
      id: source.id,
      label: `${source.id === 'vanilla' ? this.i18n.t('vanillaSource') : source.label} (${source.count.toLocaleString(this.i18n.locale())})`,
    })),
  ]);
  protected readonly activeSource = computed(() =>
    this.sources().some((source) => source.id === this.selectedSource())
      ? this.selectedSource()
      : ALL_CONTENT_SOURCE,
  );
  protected readonly results = computed(() => {
    this.library.catalogRevision();
    return this.library.searchPlaceableItems(this.library.query(), this.activeSource());
  });
  protected readonly panelWidth = signal(304);
  private readonly fontSize = signal(16);
  protected readonly columns = computed(() =>
    catalogColumns(this.panelWidth(), this.fontSize(), this.view()),
  );
  protected readonly rowHeight = computed(() => catalogRowHeight(this.fontSize(), this.view()));
  protected readonly rows = computed(() =>
    catalogRowIndices(this.results().length, this.columns()),
  );
  protected readonly columnSlots = computed(() =>
    Array.from({ length: this.columns() }, (_, index) => index),
  );
  protected readonly focusedIndex = signal(0);
  private readonly catalogHost = viewChild<ElementRef<HTMLElement>>('catalogHost');
  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  private readonly catalogViewport = viewChild<CdkVirtualScrollViewport>('catalogViewport');
  private readonly detailsDialog = viewChild<ElementRef<HTMLDialogElement>>('detailsDialog');
  protected readonly detailsItemId = signal<string | undefined>(undefined);
  protected readonly detailsItem = computed(() => {
    this.library.catalogRevision();
    const id = this.detailsItemId();
    return id ? this.library.getItem(id) : undefined;
  });
  private previousResults?: readonly PlaceableItemDefinition[];
  private previousColumns = 1;
  private previousRowHeight = BLOCK_CATALOG_ROW_HEIGHT;
  private focusFrame?: number;

  constructor() {
    this.destroyRef.onDestroy(() => this.cancelFocus());
    effect((onCleanup) => {
      const host = this.catalogHost()?.nativeElement;
      if (!host) return;
      const update = (): void => {
        if (!host.clientWidth || !host.clientHeight) return;
        this.panelWidth.set(host.clientWidth);
        this.fontSize.set(
          Number.parseFloat(
            this.document.defaultView?.getComputedStyle(this.document.documentElement).fontSize ??
              '16',
          ) || 16,
        );
        queueMicrotask(() => {
          if (!this.destroyRef.destroyed) this.catalogViewport()?.checkViewportSize();
        });
      };
      update();
      if (typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver(update);
      observer.observe(host);
      onCleanup(() => observer.disconnect());
    });
    effect(() => {
      const viewport = this.catalogViewport(),
        results = this.results(),
        columns = this.columns(),
        height = this.rowHeight();
      if (!viewport) return;
      this.cancelFocus();
      const focused =
        this.document.activeElement instanceof HTMLElement &&
        viewport.elementRef.nativeElement.contains(this.document.activeElement);
      const anchor =
        this.previousResults === results
          ? Math.floor(viewport.measureScrollOffset() / this.previousRowHeight) *
            this.previousColumns
          : 0;
      if (this.previousResults !== results) this.focusedIndex.set(0);
      this.previousResults = results;
      this.previousColumns = columns;
      this.previousRowHeight = height;
      const focusIndex = untracked(this.focusedIndex);
      queueMicrotask(() => {
        if (this.destroyRef.destroyed) return;
        viewport.checkViewportSize();
        if (viewport.measureScrollOffset() !== Math.floor(anchor / columns) * height)
          viewport.scrollToIndex(Math.floor(anchor / columns), 'auto');
        if (focused) this.focusItem(focusIndex);
      });
    });
    effect(() => {
      if (this.detailsItemId() && !this.detailsItem()) this.closeDetails();
    });
  }
  protected search(event: Event): void {
    this.library.setQuery((event.target as HTMLInputElement).value);
  }
  protected clearSearch(): void {
    this.library.setQuery('');
    this.searchInput()?.nativeElement.focus();
  }
  protected selectSource(id: string): void {
    this.selectedSource.set(id);
  }
  protected setView(view: BlockCatalogView): void {
    this.view.set(view);
  }
  protected select(item: PlaceableItemDefinition): void {
    this.decorations.clearActive();
    this.library.select(item);
    this.assets.requestItemThumbnail(item, 'selected');
  }
  protected openAssetManager(): void {
    this.assetManagerRequested.emit();
  }
  protected retryAssets(): void {
    void this.assets.redownload();
  }
  protected assetsUnavailable(): boolean {
    return !['loading-cache', 'downloading', 'importing', 'ready'].includes(this.assets.status());
  }
  protected trackRow(_index: number, row: number): number {
    return row;
  }
  protected itemFocused(event: FocusEvent, index: number): void {
    if (event.target instanceof HTMLElement && event.target.dataset['focusAction'] === 'select')
      this.focusedIndex.set(index);
  }
  protected navigate(event: KeyboardEvent, index: number): void {
    if (!(event.target instanceof HTMLElement) || event.target.dataset['focusAction'] !== 'select')
      return;
    const next = catalogKeyboardTarget(event.key, index, this.columns(), this.results().length);
    if (next === undefined) return;
    event.preventDefault();
    event.stopPropagation();
    this.focusedIndex.set(next);
    this.focusItem(next);
  }
  private focusItem(index: number): void {
    this.cancelFocus();
    const viewport = this.catalogViewport(),
      item = this.results()[index],
      view = this.document.defaultView;
    if (!viewport || !item || !view) return;
    const row = Math.floor(index / this.columns()),
      offset = viewport.measureScrollOffset(),
      top = row * this.rowHeight();
    if (top < offset || top + this.rowHeight() > offset + viewport.getViewportSize())
      viewport.scrollToIndex(row, 'auto');
    const attempt = (remaining: number): void => {
      if (this.destroyRef.destroyed) return;
      const card = [
        ...viewport.elementRef.nativeElement.querySelectorAll<HTMLElement>(
          'app-block-catalog-item',
        ),
      ].find((e) => e.dataset['itemId'] === item.itemId);
      const button = card?.querySelector<HTMLButtonElement>('[data-focus-action="select"]');
      if (button) {
        button.focus({ preventScroll: true });
        this.focusFrame = undefined;
      } else if (remaining)
        this.focusFrame = view.requestAnimationFrame(() => attempt(remaining - 1));
    };
    this.focusFrame = view.requestAnimationFrame(() => attempt(3));
  }
  private cancelFocus(): void {
    if (this.focusFrame !== undefined)
      this.document.defaultView?.cancelAnimationFrame(this.focusFrame);
    this.focusFrame = undefined;
  }
  protected openDetails(item: PlaceableItemDefinition): void {
    this.detailsItemId.set(item.itemId);
    this.detailsDialog()?.nativeElement.showModal();
  }
  protected closeDetails(): void {
    const dialog = this.detailsDialog()?.nativeElement;
    if (dialog?.open) dialog.close();
    this.detailsItemId.set(undefined);
  }
  protected closeDetailsFromEscape(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.closeDetails();
  }
  protected closeDetailsFromBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.closeDetails();
  }
}
