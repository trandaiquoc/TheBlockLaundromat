import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OverlayContainer } from '@angular/cdk/overlay';
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
    const overlay = TestBed.inject(OverlayContainer).getContainerElement();
    return { fixture, entries, entry, collapsed, select, prepareThumbnail, overlay };
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

  it('shows the full canonical name and item ID on focus and dismisses it with Escape', async () => {
    const { fixture, overlay, prepareThumbnail } = await create();
    const slot = fixture.nativeElement.querySelector('.slot-select') as HTMLButtonElement;
    slot.dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();
    expect(overlay.querySelector('[role="tooltip"]')?.textContent).toContain('Stone');
    expect(overlay.querySelector('small')?.textContent).toBe('minecraft:stone');
    expect(slot.getAttribute('aria-describedby')).toBe('quick-bar-material-name');
    expect(slot.hasAttribute('title')).toBe(false);
    slot.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(overlay.querySelector('[role="tooltip"]')).toBeNull();
    expect(slot.hasAttribute('aria-describedby')).toBe(false);
    expect(prepareThumbnail).toHaveBeenCalledTimes(1);
  });

  it('keeps selection on tap, closes on pointer leave/blur and invalidates names on removal/collapse', async () => {
    const { fixture, overlay, entries, entry, select, collapsed } = await create();
    const slot = fixture.nativeElement.querySelector('.slot-select') as HTMLButtonElement;
    slot.dispatchEvent(new Event('pointerenter'));
    fixture.detectChanges();
    expect(overlay.querySelector('[role="tooltip"]')).not.toBeNull();
    slot.dispatchEvent(new Event('pointerleave'));
    await new Promise((resolve) => setTimeout(resolve, 170));
    fixture.detectChanges();
    expect(overlay.querySelector('[role="tooltip"]')).toBeNull();
    slot.click();
    fixture.detectChanges();
    expect(select).toHaveBeenCalledExactlyOnceWith(expect.objectContaining(entry));
    expect(overlay.querySelector('[role="tooltip"]')).not.toBeNull();
    slot.dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();
    expect(overlay.querySelector('[role="tooltip"]')).toBeNull();
    slot.click();
    fixture.detectChanges();
    entries.set([]);
    fixture.detectChanges();
    expect(overlay.querySelector('[role="tooltip"]')).toBeNull();
    entries.set([entry]);
    fixture.detectChanges();
    expect(overlay.querySelector('[role="tooltip"]')).toBeNull();
    fixture.nativeElement.querySelector('.slot-select').click();
    fixture.detectChanges();
    collapsed.set(true);
    fixture.detectChanges();
    expect(overlay.querySelector('[role="tooltip"]')).toBeNull();
  });

  it('cleans up the overlay on teardown', async () => {
    const { fixture, overlay } = await create();
    fixture.nativeElement.querySelector('.slot-select').click();
    fixture.detectChanges();
    expect(overlay.querySelector('[role="tooltip"]')).not.toBeNull();
    fixture.destroy();
    expect(overlay.querySelector('[role="tooltip"]')).toBeNull();
  });
});
