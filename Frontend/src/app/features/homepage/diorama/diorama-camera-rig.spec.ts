import { Box3, PerspectiveCamera, Vector3 } from 'three';
import { describe, expect, it, vi } from 'vitest';
import type { DioramaFocus } from './diorama-contracts';
import { DioramaCameraRig } from './diorama-camera-rig';

describe('DioramaCameraRig', () => {
  it('reports only the latest focus arrival and settles immediately for reduced motion', () => {
    const camera = new PerspectiveCamera();
    const rig = new DioramaCameraRig(camera, createFocusBounds());
    rig.resize(1440, 900);
    const staleArrival = vi.fn();
    const currentArrival = vi.fn();
    rig.focus('project-board', false, staleArrival);
    rig.update(0.05);
    rig.focus('washer', false, currentArrival);
    for (let frame = 0; rig.isMoving && frame < 200; frame++) rig.update(0.05);
    expect(staleArrival).not.toHaveBeenCalled();
    expect(currentArrival).toHaveBeenCalledOnce();

    const reducedArrival = vi.fn();
    rig.setReducedMotion(true);
    rig.focus('courier', false, reducedArrival);
    expect(reducedArrival).toHaveBeenCalledOnce();
    expect(rig.currentView).toBe('courier');
  });

  it('frames the supplied scene bounds and named targets without free camera movement', () => {
    const camera = new PerspectiveCamera();
    const bounds = createFocusBounds();
    const rig = new DioramaCameraRig(camera, bounds);
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
    const rig = new DioramaCameraRig(camera, bounds);
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
    const rig = new DioramaCameraRig(camera, createFocusBounds());
    rig.resize(1440, 900);
    rig.focus('overview', true);
    rig.focus('project-board');

    expect(rig.isMoving).toBe(true);
    for (let frame = 0; frame < 240; frame++) rig.update(1 / 60);

    expect(rig.currentView).toBe('project-board');
    expect(rig.isMoving).toBe(false);
  });

  it('uses authored camera anchors while fitting the named bounds', () => {
    const camera = new PerspectiveCamera();
    const bounds = createFocusBounds();
    const washerTarget = new Vector3(0, 1, -3);
    const rig = new DioramaCameraRig(camera, bounds, { washer: washerTarget });

    rig.resize(1440, 900);
    rig.focus('washer', true);
    camera.updateMatrixWorld(true);

    const projectedTarget = washerTarget.clone().project(camera);
    expect(projectedTarget.x).toBeCloseTo(0);
    expect(projectedTarget.y).toBeCloseTo(0);
    expectBoundsWithinFrustum(camera, bounds.washer);
  });

  it('faces washer and board fronts using their authored scene orientation', () => {
    const camera = new PerspectiveCamera();
    const bounds = createFocusBounds();
    const washerYaw = 0;
    const boardYaw = Math.PI / 4;
    const targets = {
      washer: new Vector3(0, 0, -3),
      'project-board': bounds['project-board'].getCenter(new Vector3()),
    };
    const rig = new DioramaCameraRig(camera, bounds, targets, {
      washer: washerYaw,
      'project-board': boardYaw,
    });
    rig.resize(1440, 900);

    rig.orbitBy(0.24, 0.1);
    rig.zoomBy(1.2);
    rig.focus('washer', true);
    const washerDirection = camera.position.clone().sub(targets.washer).normalize();
    expect(Math.atan2(washerDirection.x, washerDirection.z)).toBeCloseTo(washerYaw);
    expectBoundsWithinFrustum(camera, bounds.washer);

    rig.focus('project-board', true);
    const boardDirection = camera.position
      .clone()
      .sub(bounds['project-board'].getCenter(new Vector3()))
      .normalize();
    expect(Math.atan2(boardDirection.x, boardDirection.z)).toBeCloseTo(boardYaw);
    expectBoundsWithinFrustum(camera, bounds['project-board']);
  });

  it('frames the full board and washer closer without extending the zoom range', () => {
    const camera = new PerspectiveCamera();
    const bounds = createFocusBounds();
    const rig = new DioramaCameraRig(camera, bounds);
    rig.resize(1440, 900);
    rig.focus('overview', true);
    const overviewDistance = camera.position.length();

    rig.focus('project-board', true);
    const boardDistance = camera.position.distanceTo(
      bounds['project-board'].getCenter(new Vector3()),
    );
    expect(boardDistance).toBeLessThan(overviewDistance);
    expectBoundsWithinFrustum(camera, bounds['project-board']);

    rig.focus('washer', true);
    expectBoundsWithinFrustum(camera, bounds.washer);
  });

  it('frames Courier closer on desktop and portrait without clipping it', () => {
    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 390, height: 844 },
    ]) {
      const camera = new PerspectiveCamera();
      const bounds = createFocusBounds();
      const rig = new DioramaCameraRig(camera, bounds);
      rig.resize(viewport.width, viewport.height);
      rig.focus('courier', true);

      expectBoundsWithinFrustum(camera, bounds.courier);
      if (viewport.width / viewport.height >= 0.82) {
        const courierCenter = bounds.courier.getCenter(new Vector3()).project(camera);
        expect(courierCenter.x).toBeLessThan(-0.1);
      } else {
        expect(projectedBoundsCoverage(camera, bounds.courier)).toBeGreaterThan(0.85);
      }
      expect(rig.currentView).toBe('courier');
    }
  });

  it('fills most of the portrait viewport with the focused project board', () => {
    const camera = new PerspectiveCamera();
    const bounds = createFocusBounds();
    const rig = new DioramaCameraRig(camera, bounds);
    rig.resize(390, 844);
    rig.focus('project-board', true);

    expectBoundsWithinFrustum(camera, bounds['project-board']);
    expect(projectedBoundsCoverage(camera, bounds['project-board'])).toBeGreaterThan(0.9);
  });

  it('clamps orbit and zoom, keeps the room in view, and recenters to the original camera', () => {
    const camera = new PerspectiveCamera();
    const bounds = createFocusBounds();
    const rig = new DioramaCameraRig(camera, bounds);
    rig.resize(1440, 900);
    rig.focus('overview', true);
    const startingPosition = camera.position.clone();

    rig.orbitBy(20, -20);
    rig.zoomBy(0.001);
    for (let frame = 0; frame < 240; frame++) rig.update(1 / 60);

    expect(camera.position.distanceTo(startingPosition)).toBeGreaterThan(0.1);
    expectBoundsWithinFrustum(camera, bounds.overview);

    const orbitedPosition = camera.position.clone();

    rig.recenter();
    for (let frame = 0; frame < 240; frame++) rig.update(1 / 60);

    expect(rig.currentView).toBe('overview');
    expect(camera.position.distanceTo(orbitedPosition)).toBeGreaterThan(0.1);
    expectBoundsWithinFrustum(camera, bounds.overview);

    const craftCamera = new PerspectiveCamera();
    const craftRig = new DioramaCameraRig(craftCamera, bounds);
    craftRig.resize(1440, 900);
    craftRig.focus('overview', true);
    expect(camera.position.distanceTo(craftCamera.position)).toBeLessThan(0.001);
  });

  it('eases wheel and pinch zoom toward the new framing instead of jumping there', () => {
    const camera = new PerspectiveCamera();
    const bounds = createFocusBounds();
    const rig = new DioramaCameraRig(camera, bounds);
    rig.resize(1440, 900);
    rig.focus('overview', true);
    const startingPosition = camera.position.clone();

    rig.zoomBy(1.1);

    expect(rig.isMoving).toBe(true);
    expect(camera.position.distanceTo(startingPosition)).toBeLessThan(0.001);
    rig.update(1 / 60);
    expect(camera.position.distanceTo(startingPosition)).toBeGreaterThan(0.001);
    for (let frame = 0; frame < 240; frame++) rig.update(1 / 60);

    expect(rig.isMoving).toBe(false);
    expect(camera.position.distanceTo(startingPosition)).toBeGreaterThan(0.1);
    expectBoundsWithinFrustum(camera, bounds.overview);
  });

  it('pans in the camera plane and returns to the default framing when recentered', () => {
    const camera = new PerspectiveCamera();
    const bounds = createFocusBounds();
    const rig = new DioramaCameraRig(camera, bounds);
    rig.resize(1440, 900);
    rig.focus('overview', true);
    const startingPosition = camera.position.clone();

    rig.panBy(18, 12, 320, 200);

    expect(camera.position.distanceTo(startingPosition)).toBeGreaterThan(0.1);
    expect(rig.isMoving).toBe(false);
    expectBoundsWithinFrustum(camera, bounds.overview);

    rig.panBy(10000, -10000, 320, 200);
    expect(camera.position.length()).toBeLessThan(40);
    rig.recenter();
    for (let frame = 0; frame < 240; frame++) rig.update(1 / 60);
    expect(camera.position.distanceTo(startingPosition)).toBeLessThan(0.001);
  });
});

function createFocusBounds(): Record<DioramaFocus, Box3> {
  return {
    overview: new Box3(new Vector3(-4, 0, -3), new Vector3(4, 6, 3)),
    washer: new Box3(new Vector3(0.6, 0, -0.2), new Vector3(2, 2.4, 1.4)),
    'project-board': new Box3(new Vector3(-1.8, 2.2, -2.8), new Vector3(1, 4.1, -2.3)),
    courier: new Box3(new Vector3(-2, 0, 0.3), new Vector3(-0.6, 1.5, 1.7)),
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

function projectedBoundsCoverage(camera: PerspectiveCamera, bounds: Box3): number {
  camera.updateMatrixWorld(true);
  let coverage = 0;
  for (const x of [bounds.min.x, bounds.max.x]) {
    for (const y of [bounds.min.y, bounds.max.y]) {
      for (const z of [bounds.min.z, bounds.max.z]) {
        const projected = new Vector3(x, y, z).project(camera);
        coverage = Math.max(coverage, Math.abs(projected.x), Math.abs(projected.y));
      }
    }
  }
  return coverage;
}
