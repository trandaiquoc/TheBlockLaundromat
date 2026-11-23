import { Box3, Quaternion, Raycaster, Vector3 } from 'three';
import type { Camera, Mesh, Object3D } from 'three';
import type { DioramaSceneAssets } from './diorama-scene-assets';
import type { DioramaTarget } from './diorama-contracts';

export interface DioramaScreenPoint {
  readonly x: number;
  readonly y: number;
  readonly visible: boolean;
}

export interface DioramaProjectSurface {
  readonly topLeft: DioramaScreenPoint;
  readonly topRight: DioramaScreenPoint;
  readonly bottomRight: DioramaScreenPoint;
  readonly bottomLeft: DioramaScreenPoint;
  readonly layoutWidth: number;
  readonly layoutHeight: number;
  readonly visible: boolean;
}

export interface DioramaBoardProjection extends DioramaProjectSurface {}

export interface DioramaWasherProjection {
  readonly preview: DioramaProjectSurface;
  readonly open: DioramaProjectSurface;
  readonly delete: DioramaProjectSurface;
  readonly projectName: DioramaProjectSurface;
  readonly visible: boolean;
}

export interface DioramaProjectProjection {
  readonly board: DioramaBoardProjection;
  readonly washer: DioramaWasherProjection;
  readonly courierNote: DioramaProjectSurface;
}

const projectionMargin = 1.04;
const occlusionGap = 0.035;
const maximumBoardLayoutWidth = 720;
const viewportBoardLayoutWidthRatio = 0.72;
const previewLayoutWidth = 144;
const actionLayoutWidth = 52;
const projectNameLayoutWidth = 320;
const courierNoteLayoutWidth = 150;

/** Projects authored UI surfaces only when the scene already draws a frame. */
export class DioramaProjectAnchorProjector {
  private readonly raycaster = new Raycaster();
  private readonly cameraPosition = new Vector3();
  private readonly temporaryPoint = new Vector3();
  private readonly projectBoardRoot: Object3D;
  private readonly washerRoot: Object3D;
  private readonly courierRoot: Object3D;
  private readonly boardAspectRatio: number;
  private readonly occlusionMeshes: Record<DioramaTarget, Mesh[]>;

  constructor(private readonly assets: DioramaSceneAssets) {
    assets.scene.updateMatrixWorld(true);
    this.projectBoardRoot = this.rootForTarget('project-board');
    this.washerRoot = this.rootForTarget('washer');
    this.courierRoot = this.rootForTarget('raccoon');
    this.boardAspectRatio = authoredBoardAspectRatio(assets.projectWorkflowAnchors.board.corners);
    this.occlusionMeshes = {
      'project-board': occludersOutside(assets.scene, [this.projectBoardRoot]),
      washer: occludersOutside(assets.scene, [this.washerRoot]),
      raccoon: occludersOutside(assets.scene, [this.courierRoot]),
    };
  }

  project(camera: Camera, width: number, height: number): DioramaProjectProjection {
    this.cameraPosition.setFromMatrixPosition(camera.matrixWorld);

    const boardAnchors = this.assets.projectWorkflowAnchors.board;
    const boardLayoutWidth = Math.min(
      width * viewportBoardLayoutWidthRatio,
      maximumBoardLayoutWidth,
    );
    const board = projectAnchoredCorners(
      boardAnchors.corners,
      camera,
      width,
      height,
      boardLayoutWidth,
      boardLayoutWidth / this.boardAspectRatio,
    );
    const boardVisible =
      board.visible &&
      projectObject(boardAnchors.center, camera, width, height).visible &&
      facesCamera(this.projectBoardRoot, boardAnchors.center, this.cameraPosition) &&
      !this.isOccluded(boardAnchors.center, 'project-board');

    const washerAnchors = this.assets.projectWorkflowAnchors.washer;
    const washerSurfaces = this.assets.projectWorkflowAnchors.washerSurfaceMeshes;
    const preview = projectMeshSurface(
      washerSurfaces.preview,
      camera,
      width,
      height,
      previewLayoutWidth,
    );
    const open = projectMeshSurface(
      washerSurfaces.open,
      camera,
      width,
      height,
      actionLayoutWidth,
      0.002,
    );
    const remove = projectMeshSurface(
      washerSurfaces.delete,
      camera,
      width,
      height,
      actionLayoutWidth,
      0.002,
    );
    const projectName = projectBetweenAnchors(
      this.washerRoot,
      washerAnchors.projectNameTopLeft,
      washerAnchors.projectNameBottomRight,
      camera,
      width,
      height,
      projectNameLayoutWidth,
    );
    const washerVisible =
      facesCamera(this.washerRoot, washerAnchors.preview, this.cameraPosition) &&
      !this.isOccluded(washerAnchors.preview, 'washer');

    const courierAnchor = this.assets.projectWorkflowAnchors.courierNote;
    const courierNote = projectMeshSurface(
      this.assets.projectWorkflowAnchors.courierNoteSurface,
      camera,
      width,
      height,
      courierNoteLayoutWidth,
      0.001,
    );
    const courierNoteVisible =
      courierNote.visible &&
      facesCamera(
        this.assets.projectWorkflowAnchors.courierNoteSurface,
        courierAnchor,
        this.cameraPosition,
      ) &&
      !this.isOccluded(courierAnchor, 'raccoon');

    return {
      board: { ...board, visible: boardVisible },
      washer: {
        preview: {
          ...preview,
          visible:
            preview.visible && washerVisible && !this.isOccluded(washerAnchors.preview, 'washer'),
        },
        open: {
          ...open,
          visible: open.visible && washerVisible && !this.isOccluded(washerAnchors.open, 'washer'),
        },
        delete: {
          ...remove,
          visible:
            remove.visible && washerVisible && !this.isOccluded(washerAnchors.delete, 'washer'),
        },
        projectName: {
          ...projectName,
          visible:
            projectName.visible &&
            washerVisible &&
            !this.isOccluded(washerAnchors.projectName, 'washer'),
        },
        visible: washerVisible,
      },
      courierNote: { ...courierNote, visible: courierNoteVisible },
    };
  }

  private rootForTarget(target: DioramaTarget): Object3D {
    const root = this.assets.interactionRoots.find((entry) => entry.target === target)?.object;
    if (!root) throw new Error(`The Diorama scene has no '${target}' interaction root.`);
    return root;
  }

  private isOccluded(anchor: Object3D, target: DioramaTarget): boolean {
    const point = anchor.getWorldPosition(this.temporaryPoint);
    const distance = this.cameraPosition.distanceTo(point);
    if (distance <= occlusionGap) return false;
    const direction = point.sub(this.cameraPosition).normalize();
    this.raycaster.set(this.cameraPosition, direction);
    this.raycaster.near = 0;
    this.raycaster.far = distance - occlusionGap;
    return this.raycaster.intersectObjects(this.occlusionMeshes[target], false).length > 0;
  }
}

function authoredBoardAspectRatio(
  corners: DioramaSceneAssets['projectWorkflowAnchors']['board']['corners'],
): number {
  const [bottomLeftAnchor, bottomRightAnchor, topLeftAnchor, topRightAnchor] = corners;
  const bottomLeft = bottomLeftAnchor.getWorldPosition(new Vector3());
  const bottomRight = bottomRightAnchor.getWorldPosition(new Vector3());
  const topLeft = topLeftAnchor.getWorldPosition(new Vector3());
  const topRight = topRightAnchor.getWorldPosition(new Vector3());
  const width = (bottomLeft.distanceTo(bottomRight) + topLeft.distanceTo(topRight)) / 2;
  const height = (bottomLeft.distanceTo(topLeft) + bottomRight.distanceTo(topRight)) / 2;
  return width > 0 && height > 0 ? width / height : 1;
}

function projectAnchoredCorners(
  corners: DioramaSceneAssets['projectWorkflowAnchors']['board']['corners'],
  camera: Camera,
  width: number,
  height: number,
  layoutWidth: number,
  layoutHeight: number,
): DioramaProjectSurface {
  const [bottomLeft, bottomRight, topLeft, topRight] = corners;
  return projectWorldCorners(
    [
      topLeft.getWorldPosition(new Vector3()),
      topRight.getWorldPosition(new Vector3()),
      bottomRight.getWorldPosition(new Vector3()),
      bottomLeft.getWorldPosition(new Vector3()),
    ],
    camera,
    width,
    height,
    layoutWidth,
    layoutHeight,
  );
}

function projectMeshSurface(
  surface: Object3D,
  camera: Camera,
  viewportWidth: number,
  viewportHeight: number,
  layoutWidth: number,
  surfaceOffset = 0,
): DioramaProjectSurface {
  const bounds = boundsInSurfaceSpace(surface);
  if (bounds.isEmpty()) return invisibleSurface(layoutWidth, layoutWidth);

  const physicalWidth = bounds.max.x - bounds.min.x;
  const physicalHeight = bounds.max.y - bounds.min.y;
  if (physicalWidth <= 0 || physicalHeight <= 0) {
    return invisibleSurface(layoutWidth, layoutWidth);
  }
  const layoutHeight = (layoutWidth * physicalHeight) / physicalWidth;
  const front = bounds.max.z + surfaceOffset;
  surface.updateWorldMatrix(true, true);
  const worldPoint = (x: number, y: number) => surface.localToWorld(new Vector3(x, y, front));
  return projectWorldCorners(
    [
      worldPoint(bounds.min.x, bounds.max.y),
      worldPoint(bounds.max.x, bounds.max.y),
      worldPoint(bounds.max.x, bounds.min.y),
      worldPoint(bounds.min.x, bounds.min.y),
    ],
    camera,
    viewportWidth,
    viewportHeight,
    layoutWidth,
    layoutHeight,
  );
}

function boundsInSurfaceSpace(surface: Object3D): Box3 {
  surface.updateWorldMatrix(true, true);
  const inverseWorld = surface.matrixWorld.clone().invert();
  const bounds = new Box3();
  surface.traverse((object) => {
    if (!('isMesh' in object) || object.isMesh !== true || !('geometry' in object)) return;
    const mesh = object as Mesh;
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
    const geometryBounds = mesh.geometry.boundingBox;
    if (!geometryBounds) return;
    for (const x of [geometryBounds.min.x, geometryBounds.max.x]) {
      for (const y of [geometryBounds.min.y, geometryBounds.max.y]) {
        for (const z of [geometryBounds.min.z, geometryBounds.max.z]) {
          bounds.expandByPoint(mesh.localToWorld(new Vector3(x, y, z)).applyMatrix4(inverseWorld));
        }
      }
    }
  });
  return bounds;
}

function projectBetweenAnchors(
  root: Object3D,
  topLeftAnchor: Object3D,
  bottomRightAnchor: Object3D,
  camera: Camera,
  viewportWidth: number,
  viewportHeight: number,
  layoutWidth: number,
): DioramaProjectSurface {
  root.updateWorldMatrix(true, false);
  const topLeftLocal = root.worldToLocal(topLeftAnchor.getWorldPosition(new Vector3()));
  const bottomRightLocal = root.worldToLocal(bottomRightAnchor.getWorldPosition(new Vector3()));
  const left = Math.min(topLeftLocal.x, bottomRightLocal.x);
  const right = Math.max(topLeftLocal.x, bottomRightLocal.x);
  const bottom = Math.min(topLeftLocal.y, bottomRightLocal.y);
  const top = Math.max(topLeftLocal.y, bottomRightLocal.y);
  const depth = (topLeftLocal.z + bottomRightLocal.z) / 2;
  const physicalWidth = right - left;
  const physicalHeight = top - bottom;
  if (physicalWidth <= 0 || physicalHeight <= 0) {
    return invisibleSurface(layoutWidth, layoutWidth);
  }

  const localPoint = (x: number, y: number) => root.localToWorld(new Vector3(x, y, depth));
  return projectWorldCorners(
    [
      localPoint(left, top),
      localPoint(right, top),
      localPoint(right, bottom),
      localPoint(left, bottom),
    ],
    camera,
    viewportWidth,
    viewportHeight,
    layoutWidth,
    (layoutWidth * physicalHeight) / physicalWidth,
  );
}

function projectWorldCorners(
  corners: readonly [Vector3, Vector3, Vector3, Vector3],
  camera: Camera,
  viewportWidth: number,
  viewportHeight: number,
  layoutWidth: number,
  layoutHeight: number,
): DioramaProjectSurface {
  const [topLeftWorld, topRightWorld, bottomRightWorld, bottomLeftWorld] = corners;
  const topLeft = projectWorldPoint(topLeftWorld, camera, viewportWidth, viewportHeight);
  const topRight = projectWorldPoint(topRightWorld, camera, viewportWidth, viewportHeight);
  const bottomRight = projectWorldPoint(bottomRightWorld, camera, viewportWidth, viewportHeight);
  const bottomLeft = projectWorldPoint(bottomLeftWorld, camera, viewportWidth, viewportHeight);
  return {
    topLeft,
    topRight,
    bottomRight,
    bottomLeft,
    layoutWidth,
    layoutHeight,
    visible: [topLeft, topRight, bottomRight, bottomLeft].every(({ visible }) => visible),
  };
}

function projectObject(
  object: Object3D,
  camera: Camera,
  width: number,
  height: number,
): DioramaScreenPoint {
  return projectWorldPoint(object.getWorldPosition(new Vector3()), camera, width, height);
}

function projectWorldPoint(
  point: Vector3,
  camera: Camera,
  width: number,
  height: number,
): DioramaScreenPoint {
  if (width <= 0 || height <= 0) return { x: 0, y: 0, visible: false };
  const projected = point.clone().project(camera);
  const visible =
    projected.z >= -1 &&
    projected.z <= 1 &&
    Math.abs(projected.x) <= projectionMargin &&
    Math.abs(projected.y) <= projectionMargin;
  return {
    x: ((projected.x + 1) * width) / 2,
    y: ((1 - projected.y) * height) / 2,
    visible,
  };
}

function facesCamera(root: Object3D, anchor: Object3D, cameraPosition: Vector3): boolean {
  const normal = new Vector3(0, 0, 1).applyQuaternion(root.getWorldQuaternion(new Quaternion()));
  const position = anchor.getWorldPosition(new Vector3());
  return normal.dot(cameraPosition.clone().sub(position).normalize()) > 0.08;
}

function occludersOutside(scene: Object3D, excludedRoots: readonly Object3D[]): Mesh[] {
  const meshes: Mesh[] = [];
  scene.traverse((object) => {
    if (!object.visible || !('isMesh' in object) || object.isMesh !== true) return;
    if (excludedRoots.some((root) => isWithin(object, root))) return;
    meshes.push(object as Mesh);
  });
  return meshes;
}

function invisibleSurface(layoutWidth: number, layoutHeight: number): DioramaProjectSurface {
  const point = { x: 0, y: 0, visible: false };
  return {
    topLeft: point,
    topRight: point,
    bottomRight: point,
    bottomLeft: point,
    layoutWidth,
    layoutHeight,
    visible: false,
  };
}

function isWithin(object: Object3D, root: Object3D): boolean {
  for (let current: Object3D | null = object; current; current = current.parent) {
    if (current === root) return true;
  }
  return false;
}
