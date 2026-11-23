import { Box3, Vector3 } from 'three';
import type { Camera, Object3D } from 'three';
import type { DioramaSceneAssets } from './diorama-scene-assets';

export interface DioramaScreenPoint {
  readonly x: number;
  readonly y: number;
  readonly visible: boolean;
}

export interface DioramaScreenRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly visible: boolean;
}

export interface DioramaWasherOverlayProjection {
  readonly preview: DioramaScreenPoint;
  readonly previewDiameter: number;
  readonly projectName: DioramaScreenRect;
}

const hiddenPoint: DioramaScreenPoint = { x: 0, y: 0, visible: false };
const hiddenRect: DioramaScreenRect = { x: 0, y: 0, width: 0, height: 0, visible: false };

/** Keeps the selected structure preview and title on the authored washer face. */
export class DioramaWasherOverlayProjector {
  private readonly worldPoint = new Vector3();
  private readonly projected = new Vector3();
  private readonly surfaceBounds = new Box3();

  constructor(private readonly assets: DioramaSceneAssets) {}

  project(camera: Camera, width: number, height: number): DioramaWasherOverlayProjection {
    if (width <= 0 || height <= 0) return hiddenProjection();
    camera.updateMatrixWorld(true);
    this.assets.scene.updateMatrixWorld(true);

    const anchors = this.assets.washerDisplayAnchors;
    const preview = this.projectPoint(anchors.preview, camera, width, height);
    const projectName = this.projectRect(
      anchors.projectNameTopLeft,
      anchors.projectNameBottomRight,
      camera,
      width,
      height,
    );
    const previewDiameter = this.projectPreviewDiameter(
      anchors.previewSurface,
      camera,
      width,
      height,
    );

    return { preview, previewDiameter, projectName };
  }

  private projectPreviewDiameter(
    surface: Object3D,
    camera: Camera,
    width: number,
    height: number,
  ): number {
    this.surfaceBounds.setFromObject(surface);
    if (this.surfaceBounds.isEmpty()) return 0;

    const min = this.surfaceBounds.min;
    const max = this.surfaceBounds.max;
    const screen = [
      this.projectWorld(min.x, min.y, max.z, camera, width, height),
      this.projectWorld(max.x, min.y, max.z, camera, width, height),
      this.projectWorld(min.x, max.y, max.z, camera, width, height),
      this.projectWorld(max.x, max.y, max.z, camera, width, height),
    ];
    const screenWidth =
      Math.max(...screen.map(({ x }) => x)) - Math.min(...screen.map(({ x }) => x));
    const screenHeight =
      Math.max(...screen.map(({ y }) => y)) - Math.min(...screen.map(({ y }) => y));
    return Math.min(screenWidth, screenHeight) * 0.68;
  }

  private projectRect(
    topLeft: Object3D,
    bottomRight: Object3D,
    camera: Camera,
    width: number,
    height: number,
  ): DioramaScreenRect {
    const first = this.projectPoint(topLeft, camera, width, height);
    const second = this.projectPoint(bottomRight, camera, width, height);
    const x = Math.min(first.x, second.x);
    const y = Math.min(first.y, second.y);
    const rectWidth = Math.abs(second.x - first.x);
    const rectHeight = Math.abs(second.y - first.y);
    return {
      x,
      y,
      width: rectWidth,
      height: rectHeight,
      visible:
        first.visible &&
        second.visible &&
        rectWidth > 4 &&
        rectHeight > 4 &&
        intersectsViewport(x, y, rectWidth, rectHeight, width, height),
    };
  }

  private projectPoint(
    anchor: Object3D,
    camera: Camera,
    width: number,
    height: number,
  ): DioramaScreenPoint {
    anchor.getWorldPosition(this.worldPoint);
    return this.projectWorld(
      this.worldPoint.x,
      this.worldPoint.y,
      this.worldPoint.z,
      camera,
      width,
      height,
    );
  }

  private projectWorld(
    x: number,
    y: number,
    z: number,
    camera: Camera,
    width: number,
    height: number,
  ): DioramaScreenPoint {
    this.projected.set(x, y, z).project(camera);
    const screenX = ((this.projected.x + 1) * width) / 2;
    const screenY = ((1 - this.projected.y) * height) / 2;
    return {
      x: screenX,
      y: screenY,
      visible:
        this.projected.z >= -1 &&
        this.projected.z <= 1 &&
        screenX >= 0 &&
        screenX <= width &&
        screenY >= 0 &&
        screenY <= height,
    };
  }
}

function intersectsViewport(
  x: number,
  y: number,
  width: number,
  height: number,
  viewportWidth: number,
  viewportHeight: number,
): boolean {
  return x < viewportWidth && y < viewportHeight && x + width > 0 && y + height > 0;
}

function hiddenProjection(): DioramaWasherOverlayProjection {
  return { preview: hiddenPoint, previewDiameter: 0, projectName: hiddenRect };
}
