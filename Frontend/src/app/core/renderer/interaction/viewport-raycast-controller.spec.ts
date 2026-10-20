import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { ViewportRaycastController } from './viewport-raycast-controller';
import { faceGeometry } from '../geometry/block-model-geometry';
import { targetFromBlockFace } from '../../editor/placement/placement';

describe('ViewportRaycastController', () => {
  it.each([-1, 1])('picks the approached side of coplanar bars caps with ray Y=%s', (direction) => {
    // Mojang Java 1.21.1 iron_bars_post_ends: two zero-height elements with both faces.
    const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
    const meshes: THREE.Mesh[] = [];
    for (const y of [0.001, 15.999]) {
      const element = { from: [7, y, 7] as const, to: [9, y, 9] as const, faces: {} };
      for (const side of ['down', 'up']) {
        const mesh = new THREE.Mesh(faceGeometry(element, side, { texture: 'bars' }), material);
        mesh.position.set(1, 0, 1);
        mesh.updateMatrixWorld(true);
        meshes.push(mesh);
      }
    }
    const raycaster = new THREE.Raycaster(
      new THREE.Vector3(1.5, direction === -1 ? 3 : -2, 1.5),
      new THREE.Vector3(0, direction, 0),
    );
    const controller = new ViewportRaycastController(raycaster, {
      classify: (p) => (p.x === 1 && p.y === 0 && p.z === 1 ? 'fallback' : 'skip'),
      objectsForVoxel: () => meshes,
      isPreciseHit: () => true,
      record: () => undefined,
    });
    const hit = controller.pick(raycaster.ray, { x: 3, y: 4, z: 3 })!;
    expect(hit.normal.x).toBeCloseTo(0);
    expect(hit.normal.y).toBe(-direction);
    expect(hit.normal.z).toBeCloseTo(0);
    expect(targetFromBlockFace(hit.position, hit.normal)).toEqual({ x: 1, y: -direction, z: 1 });
    raycaster.ray.origin.x = 1.2;
    expect(controller.pick(raycaster.ray, { x: 3, y: 4, z: 3 })).toBeUndefined();
    for (const mesh of meshes) mesh.geometry.dispose();
    material.dispose();
  });
  it('prefers the voxel top face when a narrow model side ties at its upper boundary', () => {
    const voxel = { x: 1, y: 1, z: 1 };
    const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
    const side = new THREE.Mesh(
      quadGeometry([
        [1.5, 1, 1.4375],
        [1.5, 2, 1.4375],
        [1.5, 2, 1.5625],
        [1.5, 1, 1.5625],
      ]),
      material,
    );
    const top = new THREE.Mesh(
      quadGeometry([
        [1.4375, 2, 1.4375],
        [1.4375, 2, 1.5625],
        [1.5625, 2, 1.5625],
        [1.5625, 2, 1.4375],
      ]),
      material,
    );
    const targetPoint = new THREE.Vector3(1.5, 2, 1.5);
    const origin = new THREE.Vector3(3, 3, 3);
    const direction = targetPoint.clone().sub(origin).normalize();
    const raycaster = new THREE.Raycaster(origin, direction);
    const controller = new ViewportRaycastController(raycaster, {
      classify: (position) =>
        position.x === voxel.x && position.y === voxel.y && position.z === voxel.z
          ? 'fallback'
          : 'skip',
      objectsForVoxel: () => [side, top],
      isPreciseHit: () => true,
      record: () => undefined,
    });

    const hit = controller.pick(raycaster.ray, { x: 4, y: 4, z: 4 })!;

    expect(hit.position).toEqual(voxel);
    expect(hit.normal).toEqual({ x: 0, y: 1, z: 0 });
    expect(targetFromBlockFace(hit.position, hit.normal)).toEqual({ x: 1, y: 2, z: 1 });
    side.geometry.dispose();
    top.geometry.dispose();
    material.dispose();
  });
  it('limits precise ownership checks to intersections tied at the nearest hit', () => {
    const voxel = { x: 1, y: 1, z: 1 };
    const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
    const geometry = new THREE.PlaneGeometry(1, 1);
    geometry.rotateX(-Math.PI / 2);
    const nearest = new THREE.Mesh(geometry, material);
    nearest.position.set(1.5, 2, 1.5);
    nearest.updateMatrixWorld(true);
    const farther = new THREE.Mesh(geometry, material);
    farther.position.set(1.5, 1.5, 1.5);
    farther.updateMatrixWorld(true);
    const raycaster = new THREE.Raycaster(
      new THREE.Vector3(1.5, 4, 1.5),
      new THREE.Vector3(0, -1, 0),
    );
    const preciseChecks = vi.fn(
      (intersection: THREE.Intersection) => intersection.object !== farther,
    );
    const controller = new ViewportRaycastController(raycaster, {
      classify: (position) =>
        position.x === voxel.x && position.y === voxel.y && position.z === voxel.z
          ? 'fallback'
          : 'skip',
      objectsForVoxel: () => [nearest, farther],
      isPreciseHit: preciseChecks,
      record: () => undefined,
    });

    const hit = controller.pick(raycaster.ray, { x: 4, y: 4, z: 4 });

    expect(hit?.position).toEqual(voxel);
    expect(hit?.normal.x).toBeCloseTo(0);
    expect(hit?.normal.y).toBeCloseTo(1);
    expect(hit?.normal.z).toBeCloseTo(0);
    expect(targetFromBlockFace(hit!.position, hit!.normal)).toEqual({ x: 1, y: 2, z: 1 });
    expect(preciseChecks.mock.calls.map(([intersection]) => intersection.object)).not.toContain(
      farther,
    );
    geometry.dispose();
    material.dispose();
  });
  it('records bounded DDA work and delegates translucent candidates to precise picking', () => {
    const record = vi.fn();
    const controller = new ViewportRaycastController(new THREE.Raycaster(), {
      classify: () => 'fallback',
      objectsForVoxel: () => [],
      isPreciseHit: () => false,
      record,
    });
    const result = controller.pick(
      new THREE.Ray(new THREE.Vector3(0.5, 0.5, -2), new THREE.Vector3(0, 0, 1)),
      { x: 4, y: 4, z: 4 },
    );
    expect(result).toBeUndefined();
    expect(record).toHaveBeenCalledWith('ddaPickCount');
  });
});

function quadGeometry(
  points: readonly (readonly [number, number, number])[],
): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  geometry.setFromPoints(points.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
  geometry.setIndex([0, 1, 2, 0, 2, 3]);
  geometry.computeVertexNormals();
  return geometry;
}
