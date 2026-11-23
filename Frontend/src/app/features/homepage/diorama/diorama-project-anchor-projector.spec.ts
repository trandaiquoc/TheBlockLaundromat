import {
  Group,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
} from 'three';
import { describe, expect, it } from 'vitest';
import type { DioramaSceneAssets } from './diorama-scene-assets';
import { DioramaProjectAnchorProjector } from './diorama-project-anchor-projector';

describe('DioramaProjectAnchorProjector', () => {
  it('projects the board, washer, and Courier sockets into the viewport', () => {
    const { assets } = createProjectionFixture();
    const projector = new DioramaProjectAnchorProjector(assets);
    const projection = projector.project(createCamera(), 1200, 800);

    expect(projection.board.visible).toBe(true);
    expect(projection.board.topLeft.x).toBeLessThan(projection.board.topRight.x);
    expect(projection.board.topLeft.y).toBeLessThan(projection.board.bottomLeft.y);
    expect(projection.washer.visible).toBe(true);
    expect(projection.washer.preview.visible).toBe(true);
    expect(projection.washer.preview.layoutWidth).toBe(144);
    expect(projection.washer.preview.topLeft.x).not.toBe(projection.washer.preview.topRight.x);
    expect(projection.washer.open.visible).toBe(true);
    expect(projection.washer.delete.visible).toBe(true);
    expect(projection.courierNote.visible).toBe(true);
  });

  it('scales every projected scene surface with camera zoom', () => {
    const { assets } = createProjectionFixture();
    const projector = new DioramaProjectAnchorProjector(assets);
    const camera = createCamera();
    const overview = projector.project(camera, 1200, 800);
    camera.position.z = 5;
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld(true);
    const zoomed = projector.project(camera, 1200, 800);

    expect(screenWidth(zoomed.board)).toBeGreaterThan(screenWidth(overview.board));
    expect(screenWidth(zoomed.washer.preview)).toBeGreaterThan(
      screenWidth(overview.washer.preview),
    );
    expect(screenWidth(zoomed.courierNote)).toBeGreaterThan(screenWidth(overview.courierNote));
    expect(screenWidth(zoomed.washer.open)).toBeGreaterThan(screenWidth(overview.washer.open));
  });

  it('reprojects the Courier, washer, and board surfaces when the camera orbits', () => {
    const { assets } = createProjectionFixture();
    const projector = new DioramaProjectAnchorProjector(assets);
    const camera = createCamera();
    const front = projector.project(camera, 1200, 800);
    camera.position.set(4, 2, 8);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld(true);
    const orbit = projector.project(camera, 1200, 800);

    expect(orbit.board.topLeft.x).not.toBeCloseTo(front.board.topLeft.x);
    expect(orbit.washer.preview.topRight.x).not.toBeCloseTo(front.washer.preview.topRight.x);
    expect(orbit.courierNote.bottomLeft.y).not.toBeCloseTo(front.courierNote.bottomLeft.y);
  });

  it('hides a board whose face is blocked by another scene mesh', () => {
    const { assets, scene } = createProjectionFixture();
    const wall = new Mesh(new PlaneGeometry(4, 4), new MeshBasicMaterial());
    wall.position.z = 5;
    scene.add(wall);
    scene.updateMatrixWorld(true);
    const projector = new DioramaProjectAnchorProjector(assets);

    expect(projector.project(createCamera(), 1200, 800).board.visible).toBe(false);
  });
});

function createCamera(): PerspectiveCamera {
  const camera = new PerspectiveCamera(50, 1.5, 0.1, 100);
  camera.position.set(0, 0, 10);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld(true);
  return camera;
}

function createProjectionFixture(): {
  readonly assets: DioramaSceneAssets;
  readonly scene: Scene;
} {
  const scene = new Scene();
  const board = new Group();
  const washer = new Group();
  const courier = new Group();
  washer.position.x = 3;
  courier.position.x = -3;
  scene.add(board, washer, courier);

  const washerAnchors = {
    preview: anchor(washer, 0, 0, 0),
    open: anchor(washer, 0.8, 0.2, 0),
    delete: anchor(washer, -0.8, 0.2, 0),
    projectName: anchor(washer, 0, 0.95, 0),
    projectNameTopLeft: anchor(washer, -0.35, 1.1, 0),
    projectNameBottomRight: anchor(washer, 0.35, 0.8, 0),
  };
  const washerSurfaces = {
    preview: surface(washer, 'Washer.PreviewGlass', 0, 0, 0, 0.74, 0.74),
    open: groupedSurface(washer, 'Washer.Open.Keycap', 0.8, 0.2, 0, 0.508, 0.379),
    delete: groupedSurface(washer, 'Washer.Delete.Keycap', -0.8, 0.2, 0, 0.508, 0.379),
  };
  const courierNote = anchor(courier, 0, 1.5, 0);
  const courierNoteSurface = new Mesh(new PlaneGeometry(0.504, 0.41), new MeshBasicMaterial());
  courierNote.add(courierNoteSurface);
  const projectWorkflowAnchors = {
    board: {
      center: anchor(board, 0, 0, 0),
      corners: [
        anchor(board, -1.4, -1.2, 0),
        anchor(board, 1.4, -1.2, 0),
        anchor(board, -1.4, 1.2, 0),
        anchor(board, 1.4, 1.2, 0),
      ] as const,
    },
    washer: washerAnchors,
    washerSurfaceMeshes: washerSurfaces,
    courierNote,
    courierNoteSurface,
  };
  scene.updateMatrixWorld(true);

  return {
    scene,
    assets: {
      scene,
      projectWorkflowAnchors,
      interactionRoots: [
        { object: washer, target: 'washer' },
        { object: board, target: 'project-board' },
        { object: courier, target: 'raccoon' },
      ],
    } as unknown as DioramaSceneAssets,
  };
}

function surface(
  parent: Group,
  name: string,
  x: number,
  y: number,
  z: number,
  width: number,
  height: number,
): Mesh {
  const mesh = new Mesh(new PlaneGeometry(width, height), new MeshBasicMaterial());
  mesh.name = name;
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

function groupedSurface(
  parent: Group,
  name: string,
  x: number,
  y: number,
  z: number,
  width: number,
  height: number,
): Group {
  const group = new Group();
  group.name = name;
  group.position.set(x, y, z);
  parent.add(group);
  surface(group, `${name}.Primitive`, 0, 0, 0, width, height);
  return group;
}

function screenWidth(surface: {
  readonly topLeft: { readonly x: number };
  readonly topRight: { readonly x: number };
  readonly bottomRight: { readonly x: number };
  readonly bottomLeft: { readonly x: number };
}): number {
  return Math.max(
    Math.abs(surface.topRight.x - surface.topLeft.x),
    Math.abs(surface.bottomRight.x - surface.bottomLeft.x),
  );
}

function anchor(parent: Group, x: number, y: number, z: number): Object3D {
  const result = new Object3D();
  result.position.set(x, y, z);
  parent.add(result);
  return result;
}
