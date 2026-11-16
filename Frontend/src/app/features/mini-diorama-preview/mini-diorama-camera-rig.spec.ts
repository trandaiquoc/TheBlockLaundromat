import { PerspectiveCamera } from 'three';
import { describe, expect, it } from 'vitest';
import { MiniDioramaCameraRig } from './mini-diorama-camera-rig';

describe('MiniDioramaCameraRig', () => {
  it('frames overview and named objects without exposing free camera movement', () => {
    const camera = new PerspectiveCamera();
    const rig = new MiniDioramaCameraRig(camera);
    rig.resize(1440, 900);
    rig.focus('overview', true);
    const overview = camera.position.clone();

    rig.focus('washer', true);

    expect(rig.currentView).toBe('washer');
    expect(camera.position.distanceTo(overview)).toBeGreaterThan(0.1);
    expect(rig.isMoving).toBe(false);
  });

  it('uses a more open portrait frame and snaps when reduced motion is active', () => {
    const camera = new PerspectiveCamera();
    const rig = new MiniDioramaCameraRig(camera);
    rig.resize(1440, 900);
    rig.focus('overview', true);
    const widePosition = camera.position.clone();

    rig.resize(390, 844);
    rig.setReducedMotion(true);

    expect(camera.fov).toBeGreaterThan(35);
    expect(camera.position.distanceTo(widePosition)).toBeGreaterThan(0.1);
    expect(rig.isMoving).toBe(false);
  });

  it('smooths focus transitions and completes them at the target', () => {
    const camera = new PerspectiveCamera();
    const rig = new MiniDioramaCameraRig(camera);
    rig.resize(1440, 900);
    rig.focus('overview', true);
    rig.focus('project-board');

    expect(rig.isMoving).toBe(true);
    for (let frame = 0; frame < 240; frame++) rig.update(1 / 60);

    expect(rig.currentView).toBe('project-board');
    expect(rig.isMoving).toBe(false);
  });
});
