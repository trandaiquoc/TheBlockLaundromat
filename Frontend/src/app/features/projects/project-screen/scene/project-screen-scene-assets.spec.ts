// @ts-expect-error Vitest checks the public asset contract in Node.
import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  PROJECT_SCREEN_SCENE_ASSETS,
  PROJECT_SCREEN_WASHER_MASCOT_STATES,
} from './project-screen-scene-assets';

describe('Project Screen scene asset contract', () => {
  it('uses independent room, exterior, washer, board, mascot, and foreground layers per theme', () => {
    const themes = Object.entries(PROJECT_SCREEN_SCENE_ASSETS);

    expect(themes).toHaveLength(4);
    for (const [themeName, theme] of themes) {
      expect(theme.background.src).toMatch(new RegExp(`layers/ref4/scene-${themeName}\\.jpg$`));
      expect(theme.background.width / theme.background.height).toBeGreaterThan(2);
      expect(theme.exterior.src).toMatch(new RegExp(`layers/exterior-${themeName}\\.webp$`));
      expect(theme.exterior.width / theme.exterior.height).toBeCloseTo(1672 / 941, 3);
      expect(theme.washer.src).toMatch(new RegExp(`layers/ref4/washer-${themeName}\\.png$`));
      expect(theme.board.src).toMatch(new RegExp(`layers/ref4/board-${themeName}\\.png$`));
      expect(theme.washerMascot.src).toMatch(
        new RegExp(`layers/ref4/washer-mascot-${themeName}\\.png$`),
      );
      expect(theme.mapMascot.src).toMatch(new RegExp(`layers/ref4/map-mascot-${themeName}\\.png$`));
      expect(theme.foreground.src).toMatch(/layers\/laundry-foreground\.webp$/);
      expect(theme.foreground.width / theme.foreground.height).toBeCloseTo(1672 / 941, 3);
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

  it('provides an image for each intentional washer mascot state', () => {
    expect(Object.keys(PROJECT_SCREEN_WASHER_MASCOT_STATES)).toEqual([
      'idle',
      'create',
      'selected',
      'opening',
    ]);
    for (const asset of Object.values(PROJECT_SCREEN_WASHER_MASCOT_STATES)) {
      expect(asset.src).toMatch(/layers\/raccoon-washer-.*\.webp$/);
      expect(existsSync(asset.src.replace(/^assets\//, 'public/assets/'))).toBe(true);
      expect(asset.width).toBe(1254);
      expect(asset.height).toBe(1254);
    }
  });
});
