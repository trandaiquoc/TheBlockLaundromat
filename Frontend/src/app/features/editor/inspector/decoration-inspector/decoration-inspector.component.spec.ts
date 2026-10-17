import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { ContentAssetRuntimeService } from '../../../../core/assets/content-asset-runtime.service';
import { DecorationService } from '../../../../core/decorations/decoration.service';
import { PaintingVariantCatalogService } from '../../../../core/decorations/catalog/painting-variant-catalog.service';
import { ItemCatalogService } from '../../../../core/items/catalog/item-catalog.service';
import { I18nService } from '../../../../core/ui/localization/i18n.service';
import { DecorationInspectorComponent } from './decoration-inspector.component';

describe('DecorationInspectorComponent painting summary', () => {
  it('keeps the painting preview decorative beside its visible name', async () => {
    const selected = signal({
      instanceId: 'painting-1',
      kind: 'painting' as const,
      entityTypeId: 'minecraft:painting' as const,
      anchor: { x: 0, y: 0, z: 0 },
      facing: 'north' as const,
      variantId: 'minecraft:kebab',
    });

    TestBed.configureTestingModule({
      imports: [DecorationInspectorComponent],
      providers: [
        { provide: DecorationService, useValue: { selected } },
        {
          provide: I18nService,
          useValue: { t: (key: string) => key, stateValue: (value: string) => value },
        },
        { provide: ItemCatalogService, useValue: { all: () => [] } },
        {
          provide: ContentAssetRuntimeService,
          useValue: {
            generation: signal(0),
            sources: { resources: { textureUrl: vi.fn(() => 'blob:painting-preview') } },
          },
        },
        {
          provide: PaintingVariantCatalogService,
          useValue: {
            get: () => ({
              id: 'minecraft:kebab',
              assetPath: 'minecraft:painting/kebab',
              width: 1,
              height: 1,
            }),
          },
        },
      ],
    });
    TestBed.overrideComponent(DecorationInspectorComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    });
    await TestBed.compileComponents();

    const fixture = TestBed.createComponent(DecorationInspectorComponent);
    fixture.detectChanges();

    const summary = fixture.nativeElement.querySelector('.painting-summary');
    const preview = summary.querySelector('img') as HTMLImageElement;

    expect(preview.getAttribute('alt')).toBe('');
    expect(summary.querySelector('strong')?.textContent?.trim()).toBe('Kebab');
    fixture.destroy();
  });
});
