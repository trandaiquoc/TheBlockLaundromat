import { describe, expect, it } from 'vitest';
import type { HomepageSceneAsset } from './homepage-scene-manifest';
import { buildHomepageSceneGraph } from './homepage-scene-graph';

describe('homepage scene graph', () => {
  it('retains manifest draw order and resolves nested semantic transforms', () => {
    const assets = [
      createAsset('background', null, 0, 0, 100, 100),
      createAsset('washer-body', 'washer', 20, 30, 40, 40),
      createAsset('washer-label', 'washer-body', 28, 38, 10, 5),
      createAsset('board-body', 'board', 60, 20, 30, 50),
    ];

    const graph = buildHomepageSceneGraph(assets);

    expect(graph.layers.map((layer) => layer.asset.id)).toEqual([
      'background',
      'washer-body',
      'washer-label',
      'board-body',
    ]);
    expect(graph.layers[2]?.transformPath.map((node) => node.id)).toEqual([
      'washer',
      'washer-body',
      'washer-label',
    ]);
    expect(graph.anchors.get('washer')).toEqual({ x: 40, y: 50 });
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
