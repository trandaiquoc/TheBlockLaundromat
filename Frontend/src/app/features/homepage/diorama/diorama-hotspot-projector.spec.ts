import { Group, Mesh, MeshBasicMaterial, PerspectiveCamera, PlaneGeometry, Scene } from 'three';
import { describe, expect, it } from 'vitest';
import type { DioramaSceneAssets } from './diorama-scene-assets';
import { DioramaHotspotProjector } from './diorama-hotspot-projector';

describe('DioramaHotspotProjector', () => {
  it('projects small world anchors to screen coordinates and repositions them with the camera', () => {
    const { assets } = createFixture();
    const projector = new DioramaHotspotProjector(assets);
    const camera = createCamera();
    const front = projector.project(camera, 1200, 800);
    camera.position.set(4, 2, 10);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld(true);
    const orbit = projector.project(camera, 1200, 800);

    expect(front['project-board'].visible).toBe(true);
    expect(front.courier.visible).toBe(true);
    expect(front.washer.visible).toBe(true);
    expect(orbit['project-board'].x).not.toBeCloseTo(front['project-board'].x);
  });

  it('hides an anchor behind an unrelated scene mesh', () => {
    const { assets, scene } = createFixture();
    const wall = new Mesh(new PlaneGeometry(5, 5), new MeshBasicMaterial());
    wall.position.z = 5;
    scene.add(wall);
    scene.updateMatrixWorld(true);

    expect(
      new DioramaHotspotProjector(assets).project(createCamera(), 1200, 800).washer.visible,
    ).toBe(false);
  });

  it('hides all hotspots when the viewport has no area', () => {
    const { assets } = createFixture();
    const projection = new DioramaHotspotProjector(assets).project(createCamera(), 0, 800);
    expect(Object.values(projection).every((point) => !point.visible)).toBe(true);
  });
});

function createCamera(): PerspectiveCamera {
  const camera = new PerspectiveCamera(50, 1.5, 0.1, 100);
  camera.position.set(0, 0, 10);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld(true);
  return camera;
}

function createFixture(): { readonly assets: DioramaSceneAssets; readonly scene: Scene } {
  const scene = new Scene();
  const board = target(scene, 0);
  const washer = target(scene, 3);
  const courier = target(scene, -3);
  const anchor = (parent: Group, x: number, y: number): Group => {
    const object = new Group();
    object.position.set(x, y, 0.2);
    parent.add(object);
    return object;
  };
  const boardCenter = anchor(board, 0, 0);
  const preview = anchor(washer, 0, 0);
  const courierNote = anchor(courier, 0, 1.5);
  scene.updateMatrixWorld(true);

  return {
    scene,
    assets: {
      scene,
      interactionRoots: [
        { object: washer, target: 'washer' },
        { object: board, target: 'project-board' },
        { object: courier, target: 'courier' },
      ],
      projectWorkflowAnchors: {
        boardCenter,
        washerPreview: preview,
        courierNote,
      },
    } as unknown as DioramaSceneAssets,
  };
}

function target(scene: Scene, x: number): Group {
  const root = new Group();
  root.position.x = x;
  root.add(new Mesh(new PlaneGeometry(1.4, 1.4), new MeshBasicMaterial()));
  scene.add(root);
  return root;
}
