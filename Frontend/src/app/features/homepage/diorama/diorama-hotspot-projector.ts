import { Quaternion, Raycaster, Vector3 } from 'three';
import type { Camera, Mesh, Object3D } from 'three';
import type { DioramaSceneAssets } from './diorama-scene-assets';
import type { DioramaTarget } from './diorama-contracts';

export interface DioramaHotspotPoint {
  readonly x: number;
  readonly y: number;
  readonly visible: boolean;
}

export type DioramaHotspotProjection = Readonly<Record<DioramaTarget, DioramaHotspotPoint>>;

const occlusionGap = 0.035;

/** Projects only small scene actions and applies the same mesh-occlusion rule as picking. */
export class DioramaHotspotProjector {
  private readonly raycaster = new Raycaster();
  private readonly cameraPosition = new Vector3();
  private readonly point = new Vector3();
  private readonly roots: Readonly<Record<DioramaTarget, Object3D>>;
  private readonly anchors: Readonly<Record<DioramaTarget, Object3D>>;
  private readonly occluders: Readonly<Record<DioramaTarget, readonly Mesh[]>>;

  constructor(private readonly assets: DioramaSceneAssets) {
    this.roots = {
      washer: requireTarget(assets, 'washer'),
      'project-board': requireTarget(assets, 'project-board'),
      courier: requireTarget(assets, 'courier'),
    };
    this.anchors = {
      washer: assets.projectWorkflowAnchors.washerPreview,
      'project-board': assets.projectWorkflowAnchors.boardCenter,
      courier: assets.projectWorkflowAnchors.courierNote,
    };
    this.occluders = {
      washer: visibleMeshesOutside(assets.scene, this.roots.washer),
      'project-board': visibleMeshesOutside(assets.scene, this.roots['project-board']),
      courier: visibleMeshesOutside(assets.scene, this.roots.courier),
    };
  }

  project(camera: Camera, width: number, height: number): DioramaHotspotProjection {
    if (width <= 0 || height <= 0) return hiddenProjection();
    camera.updateMatrixWorld(true);
    this.assets.scene.updateMatrixWorld(true);
    this.cameraPosition.setFromMatrixPosition(camera.matrixWorld);
    return {
      washer: this.projectTarget('washer', camera, width, height),
      'project-board': this.projectTarget('project-board', camera, width, height),
      courier: this.projectTarget('courier', camera, width, height),
    };
  }

  private projectTarget(
    target: DioramaTarget,
    camera: Camera,
    width: number,
    height: number,
  ): DioramaHotspotPoint {
    const root = this.roots[target];
    const anchor = this.anchors[target];
    const world = anchor.getWorldPosition(this.point);
    const projected = world.clone().project(camera);
    const screenX = ((projected.x + 1) * width) / 2;
    const screenY = ((1 - projected.y) * height) / 2;
    const visible =
      projected.z >= -1 &&
      projected.z <= 1 &&
      screenX >= 0 &&
      screenX <= width &&
      screenY >= 0 &&
      screenY <= height &&
      facesCamera(root, anchor, this.cameraPosition) &&
      !this.isOccluded(world, target);
    const horizontalInset = Math.max(0, Math.min(96, width / 2 - 8));
    const verticalInset = Math.max(0, Math.min(24, height / 2 - 8));
    const safeX = Math.max(horizontalInset, Math.min(width - horizontalInset, screenX));
    const safeY = Math.max(verticalInset, Math.min(height - verticalInset, screenY));
    return {
      x: safeX,
      y: safeY,
      visible,
    };
  }

  private isOccluded(point: Vector3, target: DioramaTarget): boolean {
    const distance = this.cameraPosition.distanceTo(point);
    if (distance <= occlusionGap) return false;
    const direction = point.clone().sub(this.cameraPosition).normalize();
    this.raycaster.set(this.cameraPosition, direction);
    this.raycaster.near = 0;
    this.raycaster.far = distance - occlusionGap;
    return this.raycaster.intersectObjects([...this.occluders[target]], false).length > 0;
  }
}

function requireTarget(assets: DioramaSceneAssets, target: DioramaTarget): Object3D {
  const object = assets.interactionRoots.find((entry) => entry.target === target)?.object;
  if (!object) throw new Error(`The Diorama scene has no '${target}' interaction root.`);
  return object;
}

function visibleMeshesOutside(scene: Object3D, targetRoot: Object3D): Mesh[] {
  const meshes: Mesh[] = [];
  scene.traverse((object) => {
    if (!object.visible || !('isMesh' in object) || object.isMesh !== true) return;
    if (isWithin(object, targetRoot)) return;
    meshes.push(object as Mesh);
  });
  return meshes;
}

function facesCamera(root: Object3D, anchor: Object3D, cameraPosition: Vector3): boolean {
  const normal = new Vector3(0, 0, 1).applyQuaternion(root.getWorldQuaternion(new Quaternion()));
  const position = anchor.getWorldPosition(new Vector3());
  return normal.dot(cameraPosition.clone().sub(position).normalize()) > 0.08;
}

function isWithin(object: Object3D, root: Object3D): boolean {
  for (let current: Object3D | null = object; current; current = current.parent) {
    if (current === root) return true;
  }
  return false;
}

function hiddenProjection(): DioramaHotspotProjection {
  const hidden = { x: 0, y: 0, visible: false };
  return { washer: hidden, 'project-board': hidden, courier: hidden };
}
