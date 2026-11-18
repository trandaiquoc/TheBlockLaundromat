import { Box3, PerspectiveCamera, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import type { MiniDioramaFocus } from './mini-diorama-contracts';
import { MiniDioramaCameraRig } from './mini-diorama-camera-rig';

describe('MiniDioramaCameraRig', () => {
  it('frames the supplied scene bounds and named targets without free camera movement', () => {
    const camera = new PerspectiveCamera();
    const bounds = createFocusBounds();
    const rig = new MiniDioramaCameraRig(camera, bounds);
    rig.resize(1440, 900);
    rig.focus('overview', true);
    const overview = camera.position.clone();

    rig.focus('washer', true);

    expect(rig.currentView).toBe('washer');
    expect(camera.position.distanceTo(overview)).toBeGreaterThan(0.1);
    expect(rig.isMoving).toBe(false);
    expectBoundsWithinFrustum(camera, bounds.washer);
  });

  it('keeps all scene bounds visible in portrait framing and snaps for reduced motion', () => {
    const camera = new PerspectiveCamera();
    const bounds = createFocusBounds();
    const rig = new MiniDioramaCameraRig(camera, bounds);
    rig.resize(1440, 900);
    rig.focus('overview', true);
    const widePosition = camera.position.clone();

    rig.resize(390, 844);
    rig.setReducedMotion(true);

    expect(camera.fov).toBeGreaterThan(35);
    expect(camera.position.distanceTo(widePosition)).toBeGreaterThan(0.1);
    expect(rig.isMoving).toBe(false);
    expectBoundsWithinFrustum(camera, bounds.overview);
  });

  it('smooths focus transitions and completes them at the target', () => {
    const camera = new PerspectiveCamera();
    const rig = new MiniDioramaCameraRig(camera, createFocusBounds());
    rig.resize(1440, 900);
    rig.focus('overview', true);
    rig.focus('project-board');

    expect(rig.isMoving).toBe(true);
    for (let frame = 0; frame < 240; frame++) rig.update(1 / 60);

    expect(rig.currentView).toBe('project-board');
    expect(rig.isMoving).toBe(false);
  });
});

function createFocusBounds(): Record<MiniDioramaFocus, Box3> {
  return {
    overview: new Box3(new Vector3(-4, 0, -3), new Vector3(4, 6, 3)),
    washer: new Box3(new Vector3(0.6, 0, -0.2), new Vector3(2, 2.4, 1.4)),
    'project-board': new Box3(new Vector3(-1.8, 2.2, -2.8), new Vector3(1, 4.1, -2.3)),
    raccoon: new Box3(new Vector3(-2, 0, 0.3), new Vector3(-0.6, 1.5, 1.7)),
  };
}

function expectBoundsWithinFrustum(camera: PerspectiveCamera, bounds: Box3): void {
  camera.updateMatrixWorld(true);
  for (const x of [bounds.min.x, bounds.max.x]) {
    for (const y of [bounds.min.y, bounds.max.y]) {
      for (const z of [bounds.min.z, bounds.max.z]) {
        const projected = new Vector3(x, y, z).project(camera);
        expect(Math.abs(projected.x)).toBeLessThan(1.001);
        expect(Math.abs(projected.y)).toBeLessThan(1.001);
      }
    }
  }
}
