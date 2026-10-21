import {
  HOMESPACE_ASSETS,
  type HomespaceAssetDefinition,
  type HomespaceAssetInstance,
  type HomespaceImageSource,
  type HomespacePoint,
  type HomespaceResolvedProjectionSurface,
  type HomespaceSceneDefinition,
  type HomespaceSemanticAnchor,
} from './homespace-scene-contract';
import {
  projectPointThroughMatrix,
  projectiveMatrixForSurface,
} from './homespace-projective-transform';

export type HomespacePlacementIssueReason =
  | 'duplicate-instance-id'
  | 'missing-asset'
  | 'missing-appearance'
  | 'appearance-theme-mismatch'
  | 'missing-parent'
  | 'missing-anchor'
  | 'incompatible-asset'
  | 'outside-anchor-bounds'
  | 'invalid-transform'
  | 'parent-cycle';

export interface HomespacePlacementIssue {
  readonly instanceId: string;
  readonly parentInstanceId: string | null;
  readonly anchorId: string | null;
  readonly reason: HomespacePlacementIssueReason;
}

export interface HomespaceResolvedAssetInstance {
  readonly instance: HomespaceAssetInstance;
  readonly asset: HomespaceAssetDefinition;
  readonly position: HomespacePoint;
  readonly scale: number;
  readonly depth: number;
  readonly sequence: number;
  readonly image: HomespaceImageSource | null;
  readonly projectionSurface: HomespaceResolvedProjectionSurface | null;
}

export interface ResolvedHomespaceScene {
  readonly definition: HomespaceSceneDefinition;
  readonly instances: readonly HomespaceResolvedAssetInstance[];
  readonly imageLayers: readonly HomespaceResolvedAssetInstance[];
  readonly environmentalImage: HomespaceImageSource | null;
  readonly projectedSurfaces: readonly HomespaceResolvedProjectionSurface[];
  readonly unresolved: readonly HomespacePlacementIssue[];
}

export interface HomespaceAssetReplacement {
  readonly scene: HomespaceSceneDefinition;
  readonly unresolved: readonly HomespacePlacementIssue[];
}

const RENDER_PLANE_DEPTH: Readonly<Record<string, number>> = {
  environment: 0,
  'behind-shell': 100,
  'room-shell': 200,
  foreground: 300,
  'projected-ui': 500,
};

const PLACEMENT_EPSILON = 1e-7;

export function resolveHomespaceScene(
  definition: HomespaceSceneDefinition,
  catalog: Readonly<Record<string, HomespaceAssetDefinition>> = HOMESPACE_ASSETS,
): ResolvedHomespaceScene {
  const instanceById = new Map<string, HomespaceAssetInstance>();
  const sequenceById = new Map<string, number>();
  const unresolved: HomespacePlacementIssue[] = [];
  const resolvedById = new Map<string, HomespaceResolvedAssetInstance>();
  const resolvingIds = new Set<string>();

  definition.instances.forEach((instance, sequence) => {
    if (instanceById.has(instance.id)) {
      unresolved.push(issue(instance, 'duplicate-instance-id'));
      return;
    }
    instanceById.set(instance.id, instance);
    sequenceById.set(instance.id, sequence);
  });

  const resolveInstance = (instanceId: string): HomespaceResolvedAssetInstance | null => {
    const alreadyResolved = resolvedById.get(instanceId);
    if (alreadyResolved) return alreadyResolved;

    const instance = instanceById.get(instanceId);
    if (!instance) return null;
    if (resolvingIds.has(instanceId)) {
      unresolved.push(issue(instance, 'parent-cycle'));
      return null;
    }
    resolvingIds.add(instanceId);

    const asset = catalog[instance.assetId];
    if (!asset) {
      unresolved.push(issue(instance, 'missing-asset'));
      resolvingIds.delete(instanceId);
      return null;
    }

    const appearance = asset.appearances.find(({ id }) => id === instance.appearanceId);
    if (!appearance) {
      unresolved.push(issue(instance, 'missing-appearance'));
      resolvingIds.delete(instanceId);
      return null;
    }
    if (appearance.theme !== null && appearance.theme !== definition.theme) {
      unresolved.push(issue(instance, 'appearance-theme-mismatch'));
      resolvingIds.delete(instanceId);
      return null;
    }

    const transform = instance.placement;
    if (!isValidTransform(transform.localPosition, transform.scale, transform.depth)) {
      unresolved.push(issue(instance, 'invalid-transform'));
      resolvingIds.delete(instanceId);
      return null;
    }

    let position = transform.localPosition;
    let scale = transform.scale;
    let depth = planeDepth(asset) + asset.depth + transform.depth;
    let projectionSurface: HomespaceResolvedProjectionSurface | null = null;

    if (transform.parentInstanceId === null) {
      if (transform.anchorId !== null) {
        unresolved.push(issue(instance, 'missing-parent'));
        resolvingIds.delete(instanceId);
        return null;
      }
    } else {
      if (transform.anchorId === null) {
        unresolved.push(issue(instance, 'missing-anchor'));
        resolvingIds.delete(instanceId);
        return null;
      }

      const parentInstance = instanceById.get(transform.parentInstanceId);
      if (!parentInstance) {
        unresolved.push(issue(instance, 'missing-parent'));
        resolvingIds.delete(instanceId);
        return null;
      }
      const parent = resolveInstance(transform.parentInstanceId);
      if (!parent) {
        if (!unresolved.some(({ instanceId: unresolvedId }) => unresolvedId === instance.id)) {
          unresolved.push(issue(instance, 'missing-parent'));
        }
        resolvingIds.delete(instanceId);
        return null;
      }

      const anchor = parent.asset.anchors.find(({ id }) => id === transform.anchorId);
      if (!anchor) {
        unresolved.push(issue(instance, 'missing-anchor'));
        resolvingIds.delete(instanceId);
        return null;
      }
      if (!isCompatible(asset, anchor)) {
        unresolved.push(issue(instance, 'incompatible-asset'));
        resolvingIds.delete(instanceId);
        return null;
      }
      if (!fitsAnchor(asset, anchor, transform.localPosition, transform.scale)) {
        unresolved.push(issue(instance, 'outside-anchor-bounds'));
        resolvingIds.delete(instanceId);
        return null;
      }

      position = {
        x: parent.position.x + (anchor.localPosition.x + transform.localPosition.x) * parent.scale,
        y: parent.position.y + (anchor.localPosition.y + transform.localPosition.y) * parent.scale,
      };
      scale = parent.scale * transform.scale;
      depth = Math.max(
        depth,
        parent.depth + anchor.depth + transform.depth,
        planeDepth(asset) + asset.depth + transform.depth,
      );

      if (anchor.projectedPlane) {
        projectionSurface = resolveProjectedSurface(
          instance,
          asset,
          parent,
          anchor,
          transform.localPosition,
          transform.scale,
        );
      }
    }

    const resolved: HomespaceResolvedAssetInstance = {
      instance,
      asset,
      position,
      scale,
      depth,
      sequence: sequenceById.get(instanceId) ?? 0,
      image: appearance.image,
      projectionSurface,
    };
    resolvedById.set(instanceId, resolved);
    resolvingIds.delete(instanceId);
    return resolved;
  };

  for (const instance of definition.instances) resolveInstance(instance.id);

  const instances = [...resolvedById.values()].sort(
    (first, second) => first.depth - second.depth || first.sequence - second.sequence,
  );
  const imageLayers = instances.filter(
    ({ asset, image }) =>
      image !== null && ['environment', 'room-shell', 'object'].includes(asset.role),
  );
  const environmentalImage =
    imageLayers.find(({ asset }) => asset.role === 'environment')?.image ?? null;
  const projectedSurfaces = instances.flatMap((resolved) =>
    resolved.projectionSurface ? [resolved.projectionSurface] : [],
  );

  return { definition, instances, imageLayers, environmentalImage, projectedSurfaces, unresolved };
}

export function replaceHomespaceInstanceAsset(
  definition: HomespaceSceneDefinition,
  instanceId: string,
  replacementAssetId: string,
  catalog: Readonly<Record<string, HomespaceAssetDefinition>> = HOMESPACE_ASSETS,
): HomespaceAssetReplacement {
  const replacementAsset = catalog[replacementAssetId];
  if (!replacementAsset) throw new RangeError(`Unknown Homespace asset: ${replacementAssetId}`);

  let replaced = false;
  const instances = definition.instances.map((instance) => {
    if (instance.id !== instanceId) return instance;
    replaced = true;
    const appearanceId =
      replacementAsset.appearances.find(({ theme }) => theme === definition.theme)?.id ??
      replacementAsset.appearances.find(({ theme }) => theme === null)?.id ??
      replacementAsset.defaultAppearanceId;
    return {
      ...instance,
      assetId: replacementAsset.id,
      appearanceId,
    };
  });
  if (!replaced) throw new RangeError(`Unknown Homespace instance: ${instanceId}`);

  const scene = { ...definition, instances };
  return {
    scene,
    unresolved: resolveHomespaceScene(scene, catalog).unresolved,
  };
}

function resolveProjectedSurface(
  instance: HomespaceAssetInstance,
  asset: HomespaceAssetDefinition,
  parent: HomespaceResolvedAssetInstance,
  anchor: HomespaceSemanticAnchor,
  localPosition: HomespacePoint,
  localScale: number,
): HomespaceResolvedProjectionSurface | null {
  const projectedPlane = anchor.projectedPlane;
  if (!projectedPlane) return null;

  const anchorMatrix = projectiveMatrixForSurface({
    id: anchor.id,
    width: projectedPlane.width,
    height: projectedPlane.height,
    corners: projectedPlane.corners,
  });

  const assetWidth = asset.bounds.width * localScale;
  const assetHeight = asset.bounds.height * localScale;
  const childCorners = [
    { x: localPosition.x, y: localPosition.y },
    { x: localPosition.x + assetWidth, y: localPosition.y },
    { x: localPosition.x + assetWidth, y: localPosition.y + assetHeight },
    { x: localPosition.x, y: localPosition.y + assetHeight },
  ] as const;
  const worldCorners = childCorners.map((point) => {
    const parentLocal = projectPointThroughMatrix(anchorMatrix, point);
    return {
      x: parent.position.x + (anchor.localPosition.x + parentLocal.x) * parent.scale,
      y: parent.position.y + (anchor.localPosition.y + parentLocal.y) * parent.scale,
    };
  });

  return {
    id: anchor.id,
    instanceId: instance.id,
    width: asset.bounds.width,
    height: asset.bounds.height,
    corners: [worldCorners[0], worldCorners[1], worldCorners[2], worldCorners[3]],
  };
}

function planeDepth(asset: HomespaceAssetDefinition): number {
  return RENDER_PLANE_DEPTH[asset.renderPlane] ?? 0;
}

function isCompatible(asset: HomespaceAssetDefinition, anchor: HomespaceSemanticAnchor): boolean {
  return anchor.acceptsTags.some((tag) => asset.tags.includes(tag));
}

function fitsAnchor(
  asset: HomespaceAssetDefinition,
  anchor: HomespaceSemanticAnchor,
  position: HomespacePoint,
  scale: number,
): boolean {
  const right = position.x + asset.bounds.width * scale;
  const bottom = position.y + asset.bounds.height * scale;
  return (
    position.x >= anchor.bounds.x - PLACEMENT_EPSILON &&
    position.y >= anchor.bounds.y - PLACEMENT_EPSILON &&
    right <= anchor.bounds.x + anchor.bounds.width + PLACEMENT_EPSILON &&
    bottom <= anchor.bounds.y + anchor.bounds.height + PLACEMENT_EPSILON
  );
}

function isValidTransform(position: HomespacePoint, scale: number, depth: number): boolean {
  return (
    Number.isFinite(position.x) &&
    Number.isFinite(position.y) &&
    Number.isFinite(scale) &&
    scale > 0 &&
    Number.isFinite(depth)
  );
}

function issue(
  instance: HomespaceAssetInstance,
  reason: HomespacePlacementIssueReason,
): HomespacePlacementIssue {
  return {
    instanceId: instance.id,
    parentInstanceId: instance.placement.parentInstanceId,
    anchorId: instance.placement.anchorId,
    reason,
  };
}
