import { describe, expect, it } from 'vitest';
import type {
  HomespaceAssetDefinition,
  HomespaceAssetInstance,
  HomespaceAssetAppearance,
  HomespaceSceneDefinition,
  HomespaceSemanticAnchor,
} from './homespace-scene-contract';
import { DARK_HOMESPACE_SCENE, MINECRAFT_HOMESPACE_SCENE } from './homespace-scene-contract';
import { replaceHomespaceInstanceAsset, resolveHomespaceScene } from './homespace-scene-placement';

describe('Homespace scene placement', () => {
  it('resolves the shared artboard, the mounted projected surface, and their world scale', () => {
    const resolved = resolveHomespaceScene(MINECRAFT_HOMESPACE_SCENE);
    const surface = resolved.projectedSurfaces[0];

    expect(resolved.unresolved).toEqual([]);
    expect(surface.instanceId).toBe('minecraft-project-board-instance');
    expect(surface.width).toBe(547);
    expect(surface.height).toBe(314);
    expect(surface.corners[0]).toEqual({ x: 329.5, y: 205 });
    expect(surface.corners[1]).toEqual({ x: 876.5, y: 196 });
  });

  it('preserves stable child identity and placement when the replacement anchor remains compatible', () => {
    const definition = fixtureScene();
    const originalChild = definition.instances[1];
    const replacement = replaceHomespaceInstanceAsset(definition, 'wall-board', 'wide-board', {
      'base-board': parentAsset('base-board', [displayAnchor()]),
      'wide-board': parentAsset('wide-board', [
        { ...displayAnchor(), bounds: { x: 0, y: 0, width: 190, height: 100 } },
      ]),
      'pinned-label': childAsset(),
    });
    const replacedParent = replacement.scene.instances.find(({ id }) => id === 'wall-board');
    const preservedChild = replacement.scene.instances.find(
      ({ id }) => id === 'pinned-label-instance',
    );

    expect(replacement.unresolved).toEqual([]);
    expect(replacedParent?.assetId).toBe('wide-board');
    expect(replacedParent?.appearanceId).toBe('maple');
    expect(preservedChild).toEqual(originalChild);
  });

  it('reports incompatible children without deleting or rewriting their attachment data', () => {
    const definition = fixtureScene();
    const originalChild = definition.instances[1];
    const replacement = replaceHomespaceInstanceAsset(definition, 'wall-board', 'powered-panel', {
      'base-board': parentAsset('base-board', [displayAnchor()]),
      'powered-panel': parentAsset('powered-panel', [
        { ...displayAnchor(), acceptsTags: ['powered-widget'] },
      ]),
      'pinned-label': childAsset(),
    });

    expect(replacement.unresolved).toContainEqual({
      instanceId: 'pinned-label-instance',
      parentInstanceId: 'wall-board',
      anchorId: 'label-pin',
      reason: 'incompatible-asset',
    });
    expect(replacement.scene.instances).toContainEqual(originalChild);
  });

  it('keeps attachments unresolved when the replacement has removed their semantic anchor', () => {
    const replacement = replaceHomespaceInstanceAsset(fixtureScene(), 'wall-board', 'blank-wall', {
      'base-board': parentAsset('base-board', [displayAnchor()]),
      'blank-wall': parentAsset('blank-wall', []),
      'pinned-label': childAsset(),
    });

    expect(replacement.unresolved[0].reason).toBe('missing-anchor');
    expect(replacement.scene.instances[1].placement).toEqual({
      parentInstanceId: 'wall-board',
      anchorId: 'label-pin',
      localPosition: { x: 12, y: 8 },
      scale: 1,
      depth: 5,
    });
  });

  it('reports child bounds that exceed their compatible anchor bounds', () => {
    const definition = fixtureScene();
    const oversizedChild: HomespaceAssetDefinition = {
      ...childAsset(),
      id: 'oversized-label',
      bounds: { x: 0, y: 0, width: 180, height: 85 },
    };
    const scene = {
      ...definition,
      instances: [
        definition.instances[0],
        { ...definition.instances[1], assetId: oversizedChild.id },
      ],
    };
    const resolved = resolveHomespaceScene(scene, {
      'base-board': parentAsset('base-board', [displayAnchor()]),
      [oversizedChild.id]: oversizedChild,
    });

    expect(resolved.unresolved[0].reason).toBe('outside-anchor-bounds');
    expect(scene.instances[1].id).toBe('pinned-label-instance');
  });

  it('sorts attached children after their parent by resolved depth', () => {
    const resolved = resolveHomespaceScene(fixtureScene(), {
      'base-board': parentAsset('base-board', [displayAnchor()]),
      'pinned-label': childAsset(),
    });

    expect(resolved.instances.map(({ instance }) => instance.id)).toEqual([
      'wall-board',
      'pinned-label-instance',
    ]);
    expect(resolved.instances[1].depth).toBeGreaterThan(resolved.instances[0].depth);
  });

  it('keeps Minecraft and Dark surfaces on one resolved geometry contract', () => {
    const minecraft = resolveHomespaceScene(MINECRAFT_HOMESPACE_SCENE);
    const dark = resolveHomespaceScene(DARK_HOMESPACE_SCENE);

    expect(minecraft.projectedSurfaces).toEqual(dark.projectedSurfaces);
    expect(
      minecraft.imageLayers.map(({ position, scale, asset }) => [asset.id, position, scale]),
    ).toEqual(dark.imageLayers.map(({ position, scale, asset }) => [asset.id, position, scale]));
  });

  it('rejects unknown replacement assets without changing the source scene', () => {
    const definition = fixtureScene();
    const before = structuredClone(definition);

    expect(() => replaceHomespaceInstanceAsset(definition, 'wall-board', 'missing-asset')).toThrow(
      RangeError,
    );
    expect(definition).toEqual(before);
  });
});

function fixtureScene(): HomespaceSceneDefinition {
  return {
    theme: 'craft',
    artboard: { width: 600, height: 400 },
    instances: [
      {
        id: 'wall-board',
        assetId: 'base-board',
        appearanceId: 'maple',
        placement: {
          parentInstanceId: null,
          anchorId: null,
          localPosition: { x: 100, y: 80 },
          scale: 1,
          depth: 0,
        },
      },
      {
        id: 'pinned-label-instance',
        assetId: 'pinned-label',
        appearanceId: 'chalk',
        placement: {
          parentInstanceId: 'wall-board',
          anchorId: 'label-pin',
          localPosition: { x: 12, y: 8 },
          scale: 1,
          depth: 5,
        },
      },
    ],
    lighting: { preset: 'natural', opacity: 0 },
  };
}

function parentAsset(
  id: string,
  anchors: readonly HomespaceSemanticAnchor[],
): HomespaceAssetDefinition {
  return {
    id,
    role: 'object',
    bounds: { x: 0, y: 0, width: 320, height: 240 },
    tags: ['wall-fixture'],
    defaultAppearanceId: 'maple',
    appearances: [appearance('maple')],
    anchors,
    renderPlane: 'foreground',
    depth: 0,
  };
}

function childAsset(): HomespaceAssetDefinition {
  return {
    id: 'pinned-label',
    role: 'object',
    bounds: { x: 0, y: 0, width: 140, height: 60 },
    tags: ['display-decoration'],
    defaultAppearanceId: 'chalk',
    appearances: [appearance('chalk')],
    anchors: [],
    renderPlane: 'foreground',
    depth: 0,
  };
}

function displayAnchor(): HomespaceSemanticAnchor {
  return {
    id: 'label-pin',
    localPosition: { x: 30, y: 40 },
    bounds: { x: 0, y: 0, width: 170, height: 90 },
    acceptsTags: ['display-decoration'],
    depth: 2,
  };
}

function appearance(id: string): HomespaceAssetAppearance {
  return { id, theme: null, image: null };
}
