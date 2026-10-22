import { describe, expect, it, vi } from 'vitest';
import { buildHomepageSceneGraph } from './homepage-scene-graph';
import type { HomepageSceneAsset } from './homepage-scene-manifest';
import { drawHomepageScene } from './homepage-scene-renderer';

describe('homepage scene renderer', () => {
  it('draws in source order and applies parent transforms to child layers', () => {
    const scene = buildHomepageSceneGraph([
      createAsset('washer-body', 'washer', 20, 30, 40, 40),
      createAsset('washer-label', 'washer-body', 28, 38, 10, 5),
      createAsset('board-body', 'board', 60, 20, 30, 50),
    ]);
    const drawImage = vi.fn();
    const translate = vi.fn();
    const context = {
      save: vi.fn(),
      restore: vi.fn(),
      translate,
      rotate: vi.fn(),
      scale: vi.fn(),
      drawImage,
    } as unknown as CanvasRenderingContext2D;
    const images = new Map<string, CanvasImageSource>([
      ['washer-body', {} as CanvasImageSource],
      ['washer-label', {} as CanvasImageSource],
      ['board-body', {} as CanvasImageSource],
    ]);

    drawHomepageScene(context, scene, images, new Map([['washer', { translateX: 12 }]]));

    expect(drawImage.mock.calls.map((call) => call.slice(1))).toEqual([
      [20, 30, 40, 40],
      [28, 38, 10, 5],
      [60, 20, 30, 50],
    ]);
    expect(translate).toHaveBeenCalledWith(52, 50);
    expect(drawImage).toHaveBeenCalledTimes(3);
  });

  it('skips semantic layers replaced by DOM controls', () => {
    const scene = buildHomepageSceneGraph([
      createAsset('navigation', null, 0, 0, 100, 20),
      createAsset('room-visible', null, 0, 0, 100, 100),
    ]);
    const drawImage = vi.fn();
    const context = {
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      scale: vi.fn(),
      drawImage,
    } as unknown as CanvasRenderingContext2D;

    drawHomepageScene(
      context,
      scene,
      new Map([['room-visible', {} as CanvasImageSource]]),
      new Map(),
      new Set(['navigation']),
    );

    expect(drawImage).toHaveBeenCalledOnce();
    expect(drawImage.mock.calls[0]?.[1]).toBe(0);
  });
});

function createAsset(
  id: string,
  parent: string | null,
  x: number,
  y: number,
  width: number,
  height: number,
): HomepageSceneAsset {
  return {
    id,
    parent,
    file: `assets/minecraft/${id}.png`,
    x,
    y,
    width,
    height,
    label: id,
    kind: 'source-visible',
    interactive: true,
  };
}
