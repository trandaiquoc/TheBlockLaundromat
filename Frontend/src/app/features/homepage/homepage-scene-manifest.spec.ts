import sourceManifest from '../../../../source-assets/homepage/scene-manifest.json';
import { describe, expect, it } from 'vitest';
import { parseHomepageSceneManifest } from './homepage-scene-manifest';

describe('homepage scene manifest', () => {
  it('parses the canonical canvas, themes, layers, and semantic groups', () => {
    const manifest = parseHomepageSceneManifest(sourceManifest);

    expect(manifest.canvas).toEqual({ width: 1672, height: 941 });
    expect(Object.keys(manifest.themes)).toEqual(['minecraft', 'light', 'raccoon', 'dark']);
    expect(
      Object.values(manifest.themes).reduce((sum, theme) => sum + theme.assets.length, 0),
    ).toBe(331);
    expect(manifest.groups).toHaveProperty('washer');
    expect(manifest.themes.minecraft.assets[0]?.id).toBe('room-hidden-fill');
  });

  it('rejects paths that escape the runtime asset root', () => {
    const invalid = structuredClone(sourceManifest);
    invalid.themes.minecraft.assets[0].file = 'assets/minecraft/../../outside.png';

    expect(() => parseHomepageSceneManifest(invalid)).toThrow('unsafe asset path');
  });

  it('rejects a parent cycle before building a scene graph', () => {
    const invalid = structuredClone(sourceManifest);
    invalid.themes.minecraft.assets[0].parent = invalid.themes.minecraft.assets[1].id;
    invalid.themes.minecraft.assets[1].parent = invalid.themes.minecraft.assets[0].id;

    expect(() => parseHomepageSceneManifest(invalid)).toThrow('parent cycle');
  });
});
