import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BlockLibraryService } from '../../../core/blocks/catalog/block-library.service';
import { ContentAssetRuntimeService } from '../../../core/assets/content-asset-runtime.service';
import { I18nService } from '../../../core/ui/localization/i18n.service';
import { QuickBlockBarService } from '../../../core/editor/quick-bar/quick-block-bar.service';
import { QuickBlockBarComponent } from './quick-block-bar.component';

describe('QuickBlockBarComponent disclosure', () => {
  afterEach(() => TestBed.resetTestingModule());

  async function create() {
    const collapsed = signal(false);
    const entry = {
      id: 'minecraft:stone',
      itemId: 'minecraft:stone',
      displayName: 'Stone',
      state: {},
      support: 'full',
    } as const;
    const entries = signal([entry]);
    const select = vi.fn();
    const prepareThumbnail = vi.fn();
    await TestBed.configureTestingModule({
      imports: [QuickBlockBarComponent],
      providers: [
        {
          provide: QuickBlockBarService,
          useValue: {
            active: signal(undefined),
            entries,
            collapsed,
            select,
            remove: (index: number) =>
              entries.update((value) => value.filter((_, i) => i !== index)),
            toggleCollapsed: () => collapsed.update((value) => !value),
          },
        },
        {
          provide: BlockLibraryService,
          useValue: { allItems: () => [], getItem: () => undefined, itemForBlock: () => undefined },
        },
        {
          provide: ContentAssetRuntimeService,
          useValue: {
            generation: signal(0),
            thumbnailUrl: () => undefined,
            prepareItemThumbnail: () => undefined,
            prepareThumbnail,
          },
        },
        { provide: I18nService, useValue: { t: (key: string) => key } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(QuickBlockBarComponent);
    fixture.detectChanges();
    return { fixture, entries, entry, collapsed, select, prepareThumbnail };
  }

  it('exposes the expanded state while retaining an actionable button name', async () => {
    const { fixture } = await create();

    const button = fixture.nativeElement.querySelector('.collapse') as HTMLButtonElement;
    expect(button.getAttribute('aria-label')).toBe('collapse');
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(fixture.nativeElement.querySelector('.slots')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.slot-select')?.getAttribute('aria-label')).toBe(
      '1: Stone, minecraft:stone',
    );
    expect(fixture.nativeElement.querySelector('.slot-placeholder')).not.toBeNull();

    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-label')).toBe('expand');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(fixture.nativeElement.querySelector('.slots')).toBeNull();

    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-label')).toBe('collapse');
    expect(button.getAttribute('aria-expanded')).toBe('true');
  });

  it('keeps Quick Bar slots visually quiet while retaining their accessible full names', async () => {
    const { fixture, prepareThumbnail } = await create();
    const slot = fixture.nativeElement.querySelector('.slot-select') as HTMLButtonElement;
    slot.dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="tooltip"]')).toBeNull();
    expect(slot.getAttribute('aria-label')).toBe('1: Stone, minecraft:stone');
    expect(slot.hasAttribute('title')).toBe(false);
    slot.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(prepareThumbnail).toHaveBeenCalledTimes(1);
  });

  it('selects a slot without opening a hover label', async () => {
    const { fixture, entry, select } = await create();
    const slot = fixture.nativeElement.querySelector('.slot-select') as HTMLButtonElement;
    slot.dispatchEvent(new Event('pointerenter'));
    fixture.detectChanges();
    slot.click();
    fixture.detectChanges();
    expect(select).toHaveBeenCalledExactlyOnceWith(expect.objectContaining(entry));
    expect(fixture.nativeElement.querySelector('[role="tooltip"]')).toBeNull();
  });
});
