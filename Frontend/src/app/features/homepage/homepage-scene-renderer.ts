import type { HomepageSceneGraph, SceneAnchorNode } from './homepage-scene-graph';

export interface SceneTransform {
  readonly translateX?: number;
  readonly translateY?: number;
  readonly scaleX?: number;
  readonly scaleY?: number;
  readonly rotation?: number;
}

export type SceneTransformOverrides = ReadonlyMap<string, SceneTransform>;

export function drawHomepageScene(
  context: CanvasRenderingContext2D,
  scene: HomepageSceneGraph,
  images: ReadonlyMap<string, CanvasImageSource>,
  transforms: SceneTransformOverrides = new Map(),
  hiddenLayerIds: ReadonlySet<string> = new Set(),
): void {
  for (const layer of scene.layers) {
    if (hiddenLayerIds.has(layer.asset.id)) continue;
    const image = images.get(layer.asset.id);
    if (!image) throw new Error(`Homepage scene image is missing: ${layer.asset.id}.`);

    context.save();
    for (const node of layer.transformPath) {
      applyTransform(context, node, transforms.get(node.id));
    }
    context.drawImage(
      image,
      layer.asset.x,
      layer.asset.y,
      layer.asset.width,
      layer.asset.height,
    );
    context.restore();
  }
}

function applyTransform(
  context: CanvasRenderingContext2D,
  node: SceneAnchorNode,
  transform: SceneTransform | undefined,
): void {
  if (!transform) return;
  const translateX = finiteOrDefault(transform.translateX, 0);
  const translateY = finiteOrDefault(transform.translateY, 0);
  const scaleX = finiteOrDefault(transform.scaleX, 1);
  const scaleY = finiteOrDefault(transform.scaleY, 1);
  const rotation = finiteOrDefault(transform.rotation, 0);
  if (scaleX <= 0 || scaleY <= 0) {
    throw new Error(`Homepage scene scale must be positive for ${node.id}.`);
  }

  context.translate(node.x + translateX, node.y + translateY);
  context.rotate(rotation);
  context.scale(scaleX, scaleY);
  context.translate(-node.x, -node.y);
}

function finiteOrDefault(value: number | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  if (!Number.isFinite(value)) throw new Error('Homepage scene transforms must be finite.');
  return value;
}
