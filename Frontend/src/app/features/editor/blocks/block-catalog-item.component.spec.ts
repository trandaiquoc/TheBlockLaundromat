import { TestBed } from '@angular/core/testing';
// @ts-expect-error Vitest executes this style contract test in Node.
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { signal } from '@angular/core';
import { BlockCatalogItemComponent, registryIdDisplayParts } from './block-catalog-item.component';
import { BlockLibraryService } from '../../../core/blocks/catalog/block-library.service';
import { ContentAssetRuntimeService } from '../../../core/assets/content-asset-runtime.service';
import { QuickBlockBarService } from '../../../core/editor/quick-bar/quick-block-bar.service';

describe('BlockCatalogItemComponent', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.unstubAllGlobals();
  });
  function create() {
    const assets = {
      thumbnailEpoch: signal(0),
      thumbnailUrlForItem: vi.fn(() => undefined),
      requestItemThumbnail: vi.fn(),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: ContentAssetRuntimeService, useValue: assets }],
    });
    const library = TestBed.inject(BlockLibraryService),
      item = library.allItems()[0];
    const fixture = TestBed.createComponent(BlockCatalogItemComponent);
    fixture.componentRef.setInput('item', item);
    fixture.detectChanges();
    return { fixture, library, item, assets, quick: TestBed.inject(QuickBlockBarService) };
  }
  it('preserves delimiter-rich IDs exactly', () => {
    for (const id of [
      'mod:very_long__id',
      'mod:item',
      'mod:path/with_long_name',
      'mod:x_',
      'mod::x',
    ])
      expect(registryIdDisplayParts(id).join('')).toBe(id);
  });
  it('balances grid action placement while retaining centered detail actions', () => {
    const styles = String(
      readFileSync('src/app/features/editor/blocks/block-catalog-item.component.scss', 'utf8'),
    ).replace(/\r\n/g, '\n');
    expect(styles).toContain(
      '.item-actions {\n  display: flex;\n  justify-content: space-between;',
    );
    expect(styles).toContain(':host(.detail-item) .item-actions {\n  justify-content: center;');
  });
  it('keeps catalog actions compact inside independent 44 px targets', () => {
    const styles = String(
      readFileSync('src/app/features/editor/blocks/block-catalog-item.component.scss', 'utf8'),
    ).replace(/\r\n/g, '\n');
    const targetStyle = styles.match(
      /:host\(:not\(\.detail-item\)\) \.item-actions button \{([\s\S]*?)\n\}/,
    )?.[1];
    const surfaceStyle = styles.match(
      /:host\(:not\(\.detail-item\)\) \.item-actions button::before \{([\s\S]*?)\n\}/,
    )?.[1];

    expect(targetStyle).toContain('width: max(44px, 2.75rem)');
    expect(targetStyle).toContain('height: max(44px, 2.75rem)');
    expect(surfaceStyle).toContain('width: 1.375rem');
    expect(surfaceStyle).toContain('height: 1.375rem');
    expect(surfaceStyle).toContain('border-radius: var(--radius-md)');
    expect(surfaceStyle).toContain('inset: 0');
    expect(styles).toContain('background: color-mix(in srgb, var(--text) 3%, transparent)');
    expect(styles).not.toContain('border-color: var(--border-strong)');
  });
  it('shares canonical selection, fallback and Quick Add across layouts without selecting on add/details', () => {
    const { fixture, library, item, quick } = create();
    const selected = vi.fn(),
      details = vi.fn();
    fixture.componentInstance.selected.subscribe(selected);
    fixture.componentInstance.detailsRequested.subscribe(details);
    fixture.nativeElement.querySelector('.quick-add-action').click();
    fixture.detectChanges();
    expect(quick.entries()[0]).toMatchObject({
      itemId: item.itemId,
      id: item.displayBlockId,
      state: item.defaultState,
    });
    expect(library.activeBlock.active()).toBeUndefined();
    expect(selected).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('.quick-add-action').disabled).toBe(true);
    fixture.nativeElement.querySelector('.details-action').click();
    expect(details).toHaveBeenCalledExactlyOnceWith(item);
    fixture.componentRef.setInput('layout', 'list');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.block-copy-id').textContent).toBe(
      item.displayBlockId,
    );
    expect(fixture.nativeElement.querySelector('.preview img')).toBeNull();
    fixture.nativeElement.querySelector('.block-select-action').click();
    expect(selected).toHaveBeenCalledExactlyOnceWith(item);
    library.select(item);
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('.block-select-action').getAttribute('aria-pressed'),
    ).toBe('true');
    expect(fixture.nativeElement.querySelector('.active-marker')).not.toBeNull();
    fixture.componentRef.setInput('layout', 'grid');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.active-marker')).not.toBeNull();
    expect(quick.entries()).toHaveLength(1);
  });
  it('disables a new Quick Add when the existing capacity is full', () => {
    const { fixture, library, quick } = create();
    for (const item of library.allItems().slice(0, quick.capacity))
      quick.add({
        id: item.displayBlockId,
        itemId: item.itemId,
        state: item.defaultState,
        support: item.support,
        displayName: item.displayName,
      });
    fixture.componentRef.setInput('item', library.allItems()[quick.capacity]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.quick-add-action').disabled).toBe(true);
    expect(
      fixture.nativeElement.querySelector('.quick-add-action').getAttribute('aria-label'),
    ).toContain('full');
  });
  it('copies the actual mod item identity and exposes a separate mapped block ID', async () => {
    const { fixture, item } = create();
    const writeText = vi.fn(async () => undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    fixture.componentRef.setInput('item', {
      ...item,
      itemId: 'mod:item_with_a_very_long_identity',
      displayBlockId: 'other_namespace:mapped_block',
    });
    fixture.componentRef.setInput('layout', 'details');
    fixture.detectChanges();
    const fields = fixture.nativeElement.querySelectorAll('.id-field input');
    expect(fields[0].value).toBe('mod:item_with_a_very_long_identity');
    expect(fields[1].value).toBe('other_namespace:mapped_block');
    fixture.nativeElement.querySelector('.copy-action').click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(writeText).toHaveBeenCalledExactlyOnceWith(fields[0].value);
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain('copied');
  });
  it('gives a manual copy recovery and ignores late clipboard results on recycled items', async () => {
    const { fixture, item, library } = create();
    fixture.componentRef.setInput('layout', 'details');
    let resolve: () => void = () => {};
    vi.stubGlobal('navigator', {
      clipboard: { writeText: vi.fn(() => new Promise<void>((r) => (resolve = r))) },
    });
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.copy-action').click();
    fixture.componentRef.setInput('item', library.allItems()[1]);
    fixture.detectChanges();
    resolve();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).not.toContain(
      'copied',
    );
    vi.stubGlobal('navigator', {});
    fixture.nativeElement.querySelector('.copy-action').click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain(
      'manually',
    );
    expect(item.itemId).not.toBe(library.allItems()[1].itemId);
  });
});
