import * as THREE from 'three';
import type { VoxelCoordinate } from '../../domain/project.types';
import type { SurfaceFaceDirection } from '../visibility/exposed-face-rendering';

const COINCIDENT_HIT_DISTANCE_EPSILON = 1e-6;
const VOXEL_FACE_POSITION_EPSILON = 1e-5;
const VOXEL_AXIS_BITS = { x: 1, y: 2, z: 4 } as const;

/** Double-sided, coplanar model faces must report the side approached by the ray. */
export function preciseFaceNormal(
  hit: THREE.Intersection,
  rayDirection: THREE.Vector3,
): THREE.Vector3 | undefined {
  if (!hit.face) return undefined;
  const normal = hit.face.normal.clone().transformDirection(hit.object.matrixWorld).normalize();
  const material = (hit.object as THREE.Mesh).material;
  const faceMaterial = Array.isArray(material) ? material[hit.face.materialIndex] : material;
  if (faceMaterial?.side === THREE.DoubleSide && normal.dot(rayDirection) > 0) normal.negate();
  return normal;
}

/**
 * Resolves ambiguous model edges without changing the pick volume. If a model
 * face and a voxel boundary face meet at the same nearest point, prefer the
 * face on that actual voxel boundary over an internal model face.
 */
export function preciseVoxelBoundaryIntersection(
  hits: readonly THREE.Intersection[],
  position: VoxelCoordinate,
  rayDirection: THREE.Vector3,
  firstIndex = 0,
  isCandidate?: (hit: THREE.Intersection) => boolean,
): THREE.Intersection | undefined {
  const first = hits[firstIndex];
  if (!first) return undefined;
  let boundaryHit: THREE.Intersection | undefined;
  let boundaryAxisMask = 0;
  for (let index = firstIndex; index < hits.length; index++) {
    const hit = hits[index];
    if (hit.distance - first.distance > COINCIDENT_HIT_DISTANCE_EPSILON) break;
    if (isCandidate && !isCandidate(hit)) continue;
    const hitAxisMask = voxelBoundaryAxisMask(hit, position, rayDirection);
    if (!hitAxisMask) continue;
    boundaryAxisMask |= hitAxisMask;
    if ((boundaryAxisMask & (boundaryAxisMask - 1)) !== 0) return first;
    boundaryHit ??= hit;
  }
  return boundaryAxisMask ? boundaryHit : first;
}

function voxelBoundaryAxisMask(
  hit: THREE.Intersection,
  position: VoxelCoordinate,
  rayDirection: THREE.Vector3,
): number {
  const normal = preciseFaceNormal(hit, rayDirection);
  if (!normal) return 0;
  let axisMask = 0;
  for (const axis of ['x', 'y', 'z'] as const) {
    const component = normal[axis];
    if (
      component > 0.5 &&
      Math.abs(hit.point[axis] - (position[axis] + 1)) < VOXEL_FACE_POSITION_EPSILON
    )
      axisMask |= VOXEL_AXIS_BITS[axis];
    else if (
      component < -0.5 &&
      Math.abs(hit.point[axis] - position[axis]) < VOXEL_FACE_POSITION_EPSILON
    )
      axisMask |= VOXEL_AXIS_BITS[axis];
  }
  return axisMask;
}

export function blockCoordinateFromHit(hit: THREE.Intersection): VoxelCoordinate | undefined {
  const direct = hit.object.userData['voxel'] as VoxelCoordinate | undefined;
  if (direct) return direct;
  const instanceId = hit.instanceId;
  if (instanceId === undefined) return undefined;
  return (hit.object.userData['instanceVoxels'] as VoxelCoordinate[] | undefined)?.[instanceId];
}

export function surfaceFaceDirectionFromHit(
  hit: THREE.Intersection,
): SurfaceFaceDirection | undefined {
  if (hit.instanceId === undefined || hit.object.userData['surfaceFaceBatch'] !== true)
    return undefined;
  return (hit.object.userData['instanceFaceDirections'] as SurfaceFaceDirection[] | undefined)?.[
    hit.instanceId
  ];
}
