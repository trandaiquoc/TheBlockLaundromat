import type { HomepageSceneAsset } from './homepage-scene-manifest';

export interface SceneAnchor {
  readonly x: number;
  readonly y: number;
}

export interface HomepageSceneLayer {
  readonly asset: HomepageSceneAsset;
  readonly transformPath: readonly SceneAnchorNode[];
}

export interface SceneAnchorNode extends SceneAnchor {
  readonly id: string;
}

export interface HomepageSceneGraph {
  readonly layers: readonly HomepageSceneLayer[];
  readonly anchors: ReadonlyMap<string, SceneAnchor>;
}

interface SceneBounds {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

export function buildHomepageSceneGraph(assets: readonly HomepageSceneAsset[]): HomepageSceneGraph {
  const assetsById = new Map(assets.map((asset) => [asset.id, asset]));
  const boundsById = new Map<string, SceneBounds>();

  for (const asset of assets) {
    const bounds = assetBounds(asset);
    boundsById.set(asset.id, unionBounds(boundsById.get(asset.id), bounds));
    let parentId = asset.parent;
    while (parentId !== null) {
      boundsById.set(parentId, unionBounds(boundsById.get(parentId), bounds));
      parentId = assetsById.get(parentId)?.parent ?? null;
    }
  }

  const layers = assets.map((asset) => ({
    asset,
    transformPath: buildTransformPath(asset, assetsById, boundsById),
  }));

  return {
    layers,
    anchors: new Map([...boundsById].map(([id, bounds]) => [id, center(bounds)])),
  };
}

function buildTransformPath(
  asset: HomepageSceneAsset,
  assetsById: ReadonlyMap<string, HomepageSceneAsset>,
  boundsById: ReadonlyMap<string, SceneBounds>,
): readonly SceneAnchorNode[] {
  const ancestors: string[] = [];
  let parentId = asset.parent;
  while (parentId !== null) {
    ancestors.unshift(parentId);
    parentId = assetsById.get(parentId)?.parent ?? null;
  }

  return [
    ...ancestors.map((id) => ({ id, ...center(boundsById.get(id)!) })),
    { id: asset.id, ...center(assetBounds(asset)) },
  ];
}

function assetBounds(asset: HomepageSceneAsset): SceneBounds {
  return {
    left: asset.x,
    top: asset.y,
    right: asset.x + asset.width,
    bottom: asset.y + asset.height,
  };
}

function unionBounds(existing: SceneBounds | undefined, next: SceneBounds): SceneBounds {
  if (!existing) return next;
  return {
    left: Math.min(existing.left, next.left),
    top: Math.min(existing.top, next.top),
    right: Math.max(existing.right, next.right),
    bottom: Math.max(existing.bottom, next.bottom),
  };
}

function center(bounds: SceneBounds): SceneAnchor {
  return {
    x: (bounds.left + bounds.right) / 2,
    y: (bounds.top + bounds.bottom) / 2,
  };
}
