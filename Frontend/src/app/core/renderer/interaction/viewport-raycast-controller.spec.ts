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
