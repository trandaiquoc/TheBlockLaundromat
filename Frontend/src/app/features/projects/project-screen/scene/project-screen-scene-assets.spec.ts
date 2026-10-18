// @ts-expect-error Vitest checks the public asset contract in Node.
import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PROJECT_SCREEN_SCENE_ASSETS } from './project-screen-scene-assets';

describe('Project Screen scene asset contract', () => {
  it('uses independent room, washer, board, and mascot layers for every theme', () => {
    const themes = Object.values(PROJECT_SCREEN_SCENE_ASSETS);

    expect(themes).toHaveLength(4);
    for (const theme of themes) {
      expect(theme.background.src).toMatch(/layers\/ref4\/scene-.*\.jpg$/);
      expect(theme.background.width / theme.background.height).toBeGreaterThan(2);
      expect(theme.washer.src).toMatch(/layers\/ref4\/washer-.*\.png$/);
      expect(theme.board.src).toMatch(/layers\/ref4\/board-.*\.png$/);
      expect(theme.washerMascot.src).toMatch(/layers\/ref4\/washer-mascot-.*\.png$/);
      expect(theme.mapMascot.src).toMatch(/layers\/ref4\/map-mascot-.*\.png$/);
    }
  });

  it('points every theme layer at an existing public asset with valid dimensions', () => {
    const assets = Object.values(PROJECT_SCREEN_SCENE_ASSETS).flatMap((theme) =>
      Object.values(theme),
    );

    for (const asset of assets) {
      expect(existsSync(asset.src.replace(/^assets\//, 'public/assets/'))).toBe(true);
      expect(asset.width).toBeGreaterThan(0);
      expect(asset.height).toBeGreaterThan(0);
    }
  });
});
