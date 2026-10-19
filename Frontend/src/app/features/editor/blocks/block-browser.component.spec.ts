import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';
import { ContentAssetRuntimeService } from '../../../core/assets/content-asset-runtime.service';
import { ContentSourceRegistry } from '../../../core/assets/content-source/content-source-registry';
import { I18nService } from '../../../core/ui/localization/i18n.service';
import type {
  ContentRestoreState,
  VanillaAssetStatus,
} from '../../../core/assets/content-asset-runtime.service';
import { BlockBrowserComponent } from './block-browser.component';
import { BLOCK_CATALOG_ROW_HEIGHT } from './block-catalog-layout';
import { registryIdDisplayParts } from './block-catalog-item.component';

function createAssetRuntimeStub() {
  return {
    status: signal<VanillaAssetStatus>('loading-cache'),
    contentRestore: signal<ContentRestoreState>({
      phase: 'vanilla',
      current: 0,
      total: 0,
      failed: 0,
    }),
    message: signal(''),
    thumbnailEpoch: signal(0),
    sources: new ContentSourceRegistry(),
    redownload: vi.fn(async () => undefined),
    requestItemThumbnail: vi.fn(),
    thumbnailUrlForItem: vi.fn(() => undefined),
  };
}

describe('BlockBrowser list sizing', () => {
  it('uses a compact consistent virtual row height for full-width block rows', () => {
    expect(BLOCK_CATALOG_ROW_HEIGHT).toBe(56);
  });

  it('adds registry ID break opportunities without changing its text', () => {
    const registryId = 'minecraft:polished_blackstone_brick_stairs';
    const parts = registryIdDisplayParts(registryId);

    expect(parts).toEqual(['minecraft:', 'polished_', 'blackstone_', 'brick_', 'stairs']);
    expect(parts.join('')).toBe(registryId);
  });
});

describe('BlockBrowserComponent bootstrap presentation', () => {
  it('closes item details on Escape without bubbling to the containing drawer or selecting', () => {
    const assets = createAssetRuntimeStub();
    TestBed.configureTestingModule({
      providers: [{ provide: ContentAssetRuntimeService, useValue: assets }],
    });
    const fixture = TestBed.createComponent(BlockBrowserComponent),
      component = fixture.componentInstance;
    fixture.detectChanges();
    const dialog = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;
    dialog.showModal = vi.fn(() => dialog.setAttribute('open', ''));
    dialog.close = vi.fn(() => dialog.removeAttribute('open'));
    const select = vi.spyOn(component['library'], 'select');
    const bubbled = vi.fn();
    fixture.nativeElement.addEventListener('keydown', bubbled);

    component['openDetails'](component['library'].allItems()[0]);
    fixture.detectChanges();
    expect(dialog.open).toBe(true);
    expect(fixture.nativeElement.querySelectorAll('dialog')).toHaveLength(1);
    const escape = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    dialog.dispatchEvent(escape);

    expect(escape.defaultPrevented).toBe(true);
    expect(bubbled).not.toHaveBeenCalled();
    expect(dialog.open).toBe(false);
    expect(component['detailsItemId']()).toBeUndefined();
    expect(select).not.toHaveBeenCalled();
    fixture.destroy();
  });

  it('keeps query, source, active item and exact source counts across Grid/List and resize', () => {
    const assets = createAssetRuntimeStub();
    TestBed.configureTestingModule({
      providers: [{ provide: ContentAssetRuntimeService, useValue: assets }],
    });
    const fixture = TestBed.createComponent(BlockBrowserComponent),
      component = fixture.componentInstance,
      library = component['library'];
    const vanillaCount = library.allItems().length;
    expect(component['results']()).toHaveLength(vanillaCount);
    library.replaceSource({
      sourceId: 'mod:fixture',
      sourceName: 'Fixture Mod',
      minecraftVersion: '1.21.1',
      blocks: Array.from({ length: 10001 }, (_, index) => ({
        id: `fixture:ore_${index}`,
        displayName: `Ore ${index}`,
        namespace: 'fixture',
        defaultState: {},
        stateDefinitions: [],
        resources: { textures: [] },
        support: 'fallback' as const,
      })),
    });
    expect(component['results']()).toHaveLength(10001 + vanillaCount);
    expect(component['sources']()[0].label).toContain((10001 + vanillaCount).toLocaleString('en'));
    expect(component['sources']().find((s) => s.id === 'mod:fixture')?.label).toBe(
      'Fixture Mod (10,001)',
    );
    component['selectSource']('mod:fixture');
    library.setQuery('fixture:ore_99');
    const results = component['results']();
    component['select'](results[0]);
    const active = library.activeBlock.active();
    component['setView']('list');
    component['panelWidth'].set(450);
    expect(component['columns']()).toBe(1);
    component['setView']('grid');
    expect(component['columns']()).toBe(3);
    const rows = component['rows']();
    component['panelWidth'].set(460);
    expect(component['rows']()).toBe(rows);
    expect(component['results']()).toBe(results);
    expect(library.activeBlock.active()).toBe(active);
    expect(component['activeSource']()).toBe('mod:fixture');
    expect(library.query()).toBe('fixture:ore_99');
    library.removeSource('mod:fixture');
    expect(component['activeSource']()).toBe('__theblocklaundromat_all__');
    fixture.destroy();
  });

  it('materializes only bounded virtual rows for a ten-thousand-item catalog in both views', async () => {
    const assets = createAssetRuntimeStub();
    TestBed.configureTestingModule({
      providers: [{ provide: ContentAssetRuntimeService, useValue: assets }],
    });
    const fixture = TestBed.createComponent(BlockBrowserComponent),
      component = fixture.componentInstance;
    component['library'].replaceSource({
      sourceId: 'mod:large',
      sourceName: 'Large Fixture',
      minecraftVersion: '1.21.1',
      blocks: Array.from({ length: 10001 }, (_, index) => ({
        id: `large:block_${index}`,
        displayName: `Large ${index}`,
        defaultState: {},
        stateDefinitions: [],
        resources: { textures: [] },
        support: 'fallback' as const,
      })),
    });
    component['selectSource']('mod:large');
    fixture.detectChanges();
    const viewport = component['catalogViewport']()!;
    vi.spyOn(viewport, 'getViewportSize').mockReturnValue(384);
    Object.defineProperty(viewport.elementRef.nativeElement, 'clientHeight', {
      configurable: true,
      value: 384,
    });
    viewport.checkViewportSize();
    fixture.detectChanges();
    await fixture.whenStable();
    viewport.setRenderedRange({ start: 0, end: 4 });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const count = () => fixture.nativeElement.querySelectorAll('app-block-catalog-item').length;
    expect(component['rows']()).toHaveLength(5001);
    expect(count()).toBeGreaterThan(0);
    expect(count()).toBeLessThan(40);
    component['setView']('list');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(component['rows']()).toHaveLength(10001);
    expect(count()).toBeGreaterThan(0);
    expect(count()).toBeLessThan(40);
    expect(assets.requestItemThumbnail.mock.calls.length).toBeLessThan(100);
    fixture.destroy();
  });
  it('keeps the block catalog visible while Mods restore and has no loading panel', async () => {
    const assets = createAssetRuntimeStub();
    await TestBed.configureTestingModule({
      imports: [BlockBrowserComponent],
      providers: [{ provide: ContentAssetRuntimeService, useValue: assets }],
    }).compileComponents();
    const fixture = TestBed.createComponent(BlockBrowserComponent);
    assets.status.set('ready');
    assets.contentRestore.set({ phase: 'restoring-mods', current: 0, total: 1, failed: 0 });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.asset-loading-state')).toBeNull();
    // jsdom has no layout engine, so CDK does not calculate a rendered range;
    // the viewport itself is the stable bootstrap contract. Browser coverage
    // verifies that rows are materialized once it has real dimensions.
    expect(
      fixture.nativeElement.querySelector('cdk-virtual-scroll-viewport.results'),
    ).not.toBeNull();
  });

  it('retains the fatal no-assets recovery surface', async () => {
    const assets = createAssetRuntimeStub();
    await TestBed.configureTestingModule({
      imports: [BlockBrowserComponent],
      providers: [{ provide: ContentAssetRuntimeService, useValue: assets }],
    }).compileComponents();
    const fixture = TestBed.createComponent(BlockBrowserComponent);
    assets.status.set('no-assets');
    assets.contentRestore.set({ phase: 'error', current: 0, total: 0, failed: 1 });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.asset-empty-state')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.asset-empty-state p')?.getAttribute('role')).toBe(
      'alert',
    );
    expect(fixture.nativeElement.querySelector('.asset-loading-state')).toBeNull();
  });

  it('keeps All/Vanilla source identities unique and updates Active Block immediately', async () => {
    await TestBed.configureTestingModule({ imports: [BlockBrowserComponent] }).compileComponents();
    const fixture = TestBed.createComponent(BlockBrowserComponent);
    const component = fixture.componentInstance;
    const sources = component['sources']();
    expect(sources.filter((source) => source.id === '__theblocklaundromat_all__')).toHaveLength(1);
    expect(sources.filter((source) => source.id === 'vanilla')).toHaveLength(1);
    const item = component['library'].allItems()[0];
    component['select'](item);
    expect(component['library'].activeBlock.active()?.id).toBe(item.displayBlockId);
    const active = component['library'].activeBlock.active();
    expect(active?.itemId ?? active?.id).toBe(item.itemId);
  });

  it('keeps the search as a single full-width structure without an active preview card', async () => {
    await TestBed.configureTestingModule({ imports: [BlockBrowserComponent] }).compileComponents();
    const fixture = TestBed.createComponent(BlockBrowserComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#block-search')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.search-icon')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('label[for="block-search"]')?.className).toBe(
      'visually-hidden',
    );
    expect(fixture.nativeElement.querySelector('.active-block')).toBeNull();
    expect(fixture.nativeElement.querySelector('.search-active-row')).toBeNull();
    component['library'].setQuery('chain');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.search-icon')).toBeNull();
    component['library'].setQuery('');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.search-icon')).not.toBeNull();
  });

  it('offers a clear-search action for empty results and returns focus to search', async () => {
    await TestBed.configureTestingModule({ imports: [BlockBrowserComponent] }).compileComponents();
    const fixture = TestBed.createComponent(BlockBrowserComponent);
    const component = fixture.componentInstance;
    const search = fixture.nativeElement.querySelector('#block-search') as HTMLInputElement | null;
    if (!search) throw new Error('Block search is missing');
    document.body.append(fixture.nativeElement);

    component['library'].setQuery('zzzzzz-no-such-block');
    fixture.detectChanges();

    const emptyState = fixture.nativeElement.querySelector(
      '.block-empty-state',
    ) as HTMLElement | null;
    const clearButton = emptyState?.querySelector('button') as HTMLButtonElement | null;
    expect(emptyState?.getAttribute('role')).toBe('status');
    expect(clearButton?.textContent?.trim()).toBe(TestBed.inject(I18nService).t('clearSearch'));
    clearButton?.click();
    fixture.detectChanges();

    expect(component['library'].query()).toBe('');
    expect(document.activeElement).toBe(search);
    expect(fixture.nativeElement.querySelector('.block-empty-state')).toBeNull();
    fixture.destroy();
    fixture.nativeElement.remove();
  });
});
