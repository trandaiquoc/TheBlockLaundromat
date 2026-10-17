import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';
import { ContentAssetRuntimeService } from '../../../core/assets/content-asset-runtime.service';
import { DecorationBrowserComponent } from './decoration-browser.component';

describe('DecorationBrowserComponent choice labels', () => {
  it('keeps repeated preview images decorative inside named choice buttons', async () => {
    const assets = {
      generation: signal(0),
      provider: signal({ textureUrl: vi.fn(() => 'blob:frame-preview') }),
      sources: {
        decorationSources: () => [],
        itemEvidenceSources: () => [],
        resources: { textureUrl: vi.fn(() => 'blob:painting-preview') },
      },
    };
    await TestBed.configureTestingModule({
      imports: [DecorationBrowserComponent],
      providers: [{ provide: ContentAssetRuntimeService, useValue: assets }],
    }).compileComponents();

    const fixture = TestBed.createComponent(DecorationBrowserComponent);
    fixture.detectChanges();
    const cards = [
      ...fixture.nativeElement.querySelectorAll('.decoration-card'),
    ] as HTMLButtonElement[];

    expect(cards).toHaveLength(3);
    expect(cards.every((card) => !!card.textContent?.trim())).toBe(true);
    expect(cards.map((card) => card.querySelector('img')?.getAttribute('alt'))).toEqual([
      '',
      '',
      '',
    ]);
    fixture.destroy();
  });
});
