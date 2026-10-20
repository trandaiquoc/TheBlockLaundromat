import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ViewportCameraFramingController } from './viewport-camera-framing-controller';
import type { ProjectDocument } from '../../../domain/project.types';

describe('ViewportCameraFramingController', () => {
  it('frames top and bottom presets along Minecraft Y with stable roll', () => {
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(4, 6, 8);
    const controls = new OrbitControls(camera, document.createElement('canvas'));
    controls.target.set(1, 2, 3);
    const project = {
      id: 'project',
      size: { x: 8, y: 8, z: 8 },
      blocks: [],
      decorations: [],
      groups: [],
    } as unknown as ProjectDocument;
    const controller = new ViewportCameraFramingController(camera, () => controls, {
      project: () => project,
      renderOptions: () => ({}),
      scheduleRender: vi.fn(),
    });

    controller.setCameraPreset('top');
    expect(camera.position.y).toBeGreaterThan(controls.target.y);
    expect(camera.up.toArray()).toEqual([0, 0, -1]);
    controller.setCameraPreset('bottom');
    expect(camera.position.y).toBeLessThan(controls.target.y);
    expect(camera.up.toArray()).toEqual([0, 0, 1]);
    controls.dispose();
  });

  it('round-trips camera state and owns frame identity', () => {
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    const controls = new OrbitControls(camera, document.createElement('canvas'));
    const project = {
      id: 'project',
      size: { x: 8, y: 8, z: 8 },
      blocks: [],
      decorations: [],
      groups: [],
    } as unknown as ProjectDocument;
    const controller = new ViewportCameraFramingController(camera, () => controls, {
      project: () => project,
      renderOptions: () => ({}),
      scheduleRender: vi.fn(),
    });
    controller.restoreCamera(
      { position: { x: 1, y: 2, z: 3 }, target: { x: 0, y: 0, z: 0 }, up: { x: 0, y: 1, z: 0 } },
      project.id,
    );
    expect(controller.hasCameraFrame).toBe(true);
    expect(controller.cameraProjectId).toBe('project');
    expect(controller.cameraState()?.position.x).toBeCloseTo(1);
    expect(controller.cameraState()?.position.y).toBeCloseTo(2);
    expect(controller.cameraState()?.position.z).toBeCloseTo(3);
    controls.dispose();
  });
});
