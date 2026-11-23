import { Group, Mesh, MeshBasicMaterial, PerspectiveCamera, PlaneGeometry, Scene } from 'three';
import { describe, expect, it } from 'vitest';
import type { DioramaSceneAssets } from './diorama-scene-assets';
import { DioramaWasherOverlayProjector } from './diorama-washer-overlay-projector';

describe('DioramaWasherOverlayProjector', () => {
  it('sizes the drum preview and name strip from authored washer nodes', () => {
    const { assets } = createFixture();
    const projector = new DioramaWasherOverlayProjector(assets);
    const camera = createCamera();

    const wide = projector.project(camera, 1200, 800);
    camera.position.z = 5;
    camera.updateMatrixWorld(true);
    const closer = projector.project(camera, 1200, 800);

    expect(wide.preview.visible).toBe(true);
    expect(wide.projectName.visible).toBe(true);
    expect(wide.previewDiameter).toBeGreaterThan(0);
    expect(closer.previewDiameter).toBeGreaterThan(wide.previewDiameter);
    expect(closer.projectName.width).toBeGreaterThan(wide.projectName.width);
  });

  it('hides projections when the viewport has no area', () => {
    const { assets } = createFixture();
    const projection = new DioramaWasherOverlayProjector(assets).project(createCamera(), 0, 800);

    expect(projection.preview.visible).toBe(false);
    expect(projection.previewDiameter).toBe(0);
    expect(projection.projectName.visible).toBe(false);
  });
});

function createCamera(): PerspectiveCamera {
  const camera = new PerspectiveCamera(50, 1.5, 0.1, 100);
  camera.position.set(0, 0, 8);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld(true);
  return camera;
}

function createFixture(): { readonly assets: DioramaSceneAssets } {
  const scene = new Scene();
  const washer = new Group();
  scene.add(washer);
  const preview = new Group();
  const projectNameTopLeft = new Group();
  projectNameTopLeft.position.set(-1, 0.7, 0);
  const projectNameBottomRight = new Group();
  projectNameBottomRight.position.set(1, 0.25, 0);
  const previewSurface = new Mesh(new PlaneGeometry(2, 2), new MeshBasicMaterial());
  washer.add(preview, projectNameTopLeft, projectNameBottomRight, previewSurface);
  scene.updateMatrixWorld(true);

  return {
    assets: {
      scene,
      washerDisplayAnchors: {
        preview,
        previewSurface,
        projectNameTopLeft,
        projectNameBottomRight,
      },
    } as unknown as DioramaSceneAssets,
  };
}
