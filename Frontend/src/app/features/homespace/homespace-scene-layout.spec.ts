import { describe, expect, it } from 'vitest';
import { HOMESPACE_ARTBOARD, MINECRAFT_HOMESPACE_SCENE } from './homespace-scene-contract';
import { homespaceSceneViewportLayout } from './homespace-scene-layout';

describe('homespaceSceneViewportLayout', () => {
  it.each([
    { width: 1920, height: 1080, canPanHorizontally: false },
    { width: 1920, height: 895, canPanHorizontally: false },
    { width: 1440, height: 900, canPanHorizontally: true },
    { width: 1366, height: 768, canPanHorizontally: false },
    { width: 1024, height: 768, canPanHorizontally: true },
    { width: 390, height: 844, canPanHorizontally: true },
  ])('fits the height and sets the horizontal pan contract for $width×$height', (size) => {
    const layout = homespaceSceneViewportLayout(size, MINECRAFT_HOMESPACE_SCENE);

    expect(layout.stageHeight).toBe(size.height);
    expect(layout.scale).toBe(size.height / HOMESPACE_ARTBOARD.height);
    expect(layout.stageWidth).toBeCloseTo(
      (size.height / HOMESPACE_ARTBOARD.height) * HOMESPACE_ARTBOARD.width,
    );
    expect(layout.horizontalOverflow).toBeCloseTo(Math.max(0, layout.stageWidth - size.width));
    expect(layout.canPanHorizontally).toBe(size.canPanHorizontally);
  });

  it('does not create a vertical overflow dimension', () => {
    const layout = homespaceSceneViewportLayout(
      { width: 390, height: 640 },
      MINECRAFT_HOMESPACE_SCENE,
    );

    expect(layout.stageHeight).toBe(640);
    expect(layout).not.toHaveProperty('verticalOverflow');
  });

  it('returns an empty layout before the viewport has measurable height', () => {
    expect(
      homespaceSceneViewportLayout({ width: 1920, height: 0 }, MINECRAFT_HOMESPACE_SCENE),
    ).toEqual({
      stageWidth: 0,
      stageHeight: 0,
      scale: 0,
      horizontalOverflow: 0,
      canPanHorizontally: false,
    });
  });
});
