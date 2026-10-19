import * as THREE from 'three';
import type { VoxelCoordinate } from '../../domain/project.types';
import type { SurfaceFaceDirection } from '../visibility/exposed-face-rendering';

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
