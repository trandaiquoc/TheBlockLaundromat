import type { HomespaceSceneDefinition } from './homespace-scene-contract';

export interface HomespaceViewportSize {
  readonly width: number;
  readonly height: number;
}

export interface HomespaceSceneViewportLayout {
  readonly stageWidth: number;
  readonly stageHeight: number;
  readonly scale: number;
  readonly horizontalOverflow: number;
  readonly canPanHorizontally: boolean;
}

const PAN_THRESHOLD_PX = 2;

export function homespaceSceneViewportLayout(
  viewport: HomespaceViewportSize,
  scene: Pick<HomespaceSceneDefinition, 'artboard'>,
): HomespaceSceneViewportLayout {
  const width = Math.max(0, viewport.width);
  const height = Math.max(0, viewport.height);
  if (scene.artboard.width <= 0 || scene.artboard.height <= 0) {
    throw new RangeError('Homespace artboard dimensions must be positive.');
  }

  const scale = height / scene.artboard.height;
  const stageWidth = scene.artboard.width * scale;
  const horizontalOverflow = Math.max(0, stageWidth - width);

  return {
    stageWidth,
    stageHeight: height,
    scale,
    horizontalOverflow,
    canPanHorizontally: horizontalOverflow >= PAN_THRESHOLD_PX,
  };
}
