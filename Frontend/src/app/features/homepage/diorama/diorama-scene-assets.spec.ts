import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { DioramaMaterialVariants } from './diorama-material-variants';
import { buildDioramaScene } from './diorama-scene-assets';
import { LAUNDROMAT_DIORAMA_PROFILE, dioramaSceneNodeName } from './diorama-scene-profile';
import { applyDioramaTheme, dioramaVariantForTheme } from './diorama-scene-theme';
import { disposeDioramaResources } from './diorama-scene-resources';
import type { DioramaSceneAsset } from './diorama-scene-loader';

describe('Diorama scene assets', () => {
  it('builds the authored scene, anchors, ground, and focus targets from one profile', () => {
    const asset = createSceneAsset();
    const assets = buildDioramaScene(asset);
    const modelGeometry = collectGeometry(assets.model);

    expect(assets.profile.id).toBe('laundromat-diorama');
    expect(assets.scene.name).toBe('laundromat-diorama-scene');
    expect(assets.scene.getObjectByName('Washer')).toBeTruthy();
    expect(assets.scene.getObjectByName('ProjectBoard')).toBeTruthy();
    expect(assets.scene.getObjectByName('CourierRoot')).toBeTruthy();
    expect(assets.scene.getObjectByName('GuideRoot')).toBeTruthy();
    expect(assets.scene.getObjectByName('DioramaRoomSpinPivot')).toBe(assets.roomSpinPivot);
    expect(assets.scene.getObjectByName('Preview.OutdoorGround')).toBeTruthy();
    expect(assets.scene.getObjectByName('Preview.RoomContactShadow')).toBeTruthy();
    expect(assets.scene.background).toBeNull();
    expect(assets.themeTargets.lanternLights).toHaveLength(2);
    expect(assets.interactionRoots.map(({ target }) => target)).toEqual([
      'washer',
      'project-board',
      'raccoon',
      'raccoon',
    ]);
    expect(assets.focusBounds.raccoon.min.x).toBeLessThan(-1);
    expect(assets.focusBounds.raccoon.max.x).toBeGreaterThan(1);
    expect(assets.cameraFocusTargets.overview?.toArray()).toEqual([0, 1.15, 0]);
    expect(assets.cameraFocusTargets['project-board']?.toArray()).toEqual([-2.7, 2, -2.57]);
    expect(assets.cameraFocusTargets.washer?.toArray()).toEqual([0, 1, -3]);
    expect(assets.cameraFocusYaws.washer).toBeCloseTo(0);
    expect(assets.cameraFocusYaws['project-board']).toBeCloseTo(Math.PI / 4);
    expect(assets.focusBounds['project-board'].getSize(new THREE.Vector3()).x).toBeGreaterThan(2.4);
    expect(assets.raccoonControllerRoot).toBeUndefined();
    expect(assets.model.getObjectByName('LeftCabinet')?.position.z).toBeCloseTo(-1.1);
    expect(assets.model.getObjectByName('WestIvy')?.position.toArray()).toEqual([0.18, 0.25, -1.1]);
    expect(assets.model.getObjectByName('ShelfLantern')?.position.toArray()).toEqual([
      -3, 2, -0.6000000000000001,
    ]);
    expect(
      (assets.scene.getObjectByName('Preview.OutdoorGround') as THREE.Mesh).material,
    ).toBeInstanceOf(THREE.ShaderMaterial);
    expect(assets.outdoorGround).toBe(assets.themeTargets.outdoorGround);
    expect(collectGeometry(assets.model)).toEqual(modelGeometry);

    disposeDioramaResources(assets.scene, asset.materialVariants.ownedMaterials);
  });

  it('maps persisted themes to the authored variants and updates scene lighting', () => {
    expect(dioramaVariantForTheme('craft')).toBe('Minecraft');
    expect(dioramaVariantForTheme('light')).toBe('Light');
    expect(dioramaVariantForTheme('raccoon')).toBe('Raccoon');
    expect(dioramaVariantForTheme('dark')).toBe('Dark');

    const asset = createSceneAsset();
    const assets = buildDioramaScene(asset);
    const geometryBeforeTheme = collectGeometry(assets.model);
    const originalLight = assets.themeTargets.keyLight.intensity;

    applyDioramaTheme(assets, 'dark');
    expect(assets.scene.background).toBeNull();
    expect(asset.materialVariants.targets[0].mesh.material).toBe(
      asset.materialVariants.targets[0].materialsByVariant.get('Dark'),
    );
    expect(assets.themeTargets.keyLight.intensity).not.toBe(originalLight);
    expect(assets.themeTargets.lanternLights.map(({ intensity }) => intensity)).toEqual([7.2, 7.2]);
    applyDioramaTheme(assets, 'raccoon');
    applyDioramaTheme(assets, 'light');
    expect(collectGeometry(assets.model)).toEqual(geometryBeforeTheme);

    disposeDioramaResources(assets.scene, asset.materialVariants.ownedMaterials);
  });
});

function createSceneAsset(): DioramaSceneAsset {
  const root = new THREE.Group();
  addBox(root, 'Floor', [0, 0.2, 0], [8, 0.4, 8]);
  addBox(root, 'Washer', [0, 1, -3], [2, 2, 1]);
  const projectBoard = addBox(root, 'ProjectBoard', [-2.7, 1.3, -2.6], [2.5, 2.2, 0.1]);
  projectBoard.rotation.y = Math.PI / 4;
  addAnchor(root, 'Anchor.NicheLantern.Light', [2, 2.4, -2]);
  const shelfLantern = new THREE.Group();
  shelfLantern.name = dioramaSceneNodeName('ShelfLantern');
  shelfLantern.position.set(-3, 2, 0.5);
  root.add(shelfLantern);
  addAnchor(shelfLantern, 'Anchor.ShelfLantern.Light', [0, 0, 0]);

  for (const { nodeName } of LAUNDROMAT_DIORAMA_PROFILE.placements) {
    if (nodeName === 'ShelfLantern') continue;
    const object = new THREE.Group();
    object.name = dioramaSceneNodeName(nodeName);
    object.position.set(0, 0, 0);
    root.add(object);
  }
  for (const [name, point] of [
    ['Anchor.Camera.Overview', [0, 1.15, 0]],
    ['Anchor.Camera.Portrait', [0, 1.48, -0.24]],
    ['Anchor.Camera.Board', [-2.7, 2, -2.57]],
    ['Anchor.Camera.Washer', [0, 1.05, -3.03]],
    ['Anchor.Camera.Recenter', [0, 1.32, -0.2]],
    ['Anchor.Board.Center', [-2.7, 1.3, -2.56]],
    ['Anchor.Board.BottomLeft', [-3.9, 0.2, -2.56]],
    ['Anchor.Board.BottomRight', [-1.5, 0.2, -2.56]],
    ['Anchor.Board.TopLeft', [-3.9, 2.4, -2.56]],
    ['Anchor.Board.TopRight', [-1.5, 2.4, -2.56]],
    ['Anchor.Washer.Preview', [0, 1, -3.5]],
    ['Anchor.Washer.Open', [0.5, 1, -3.5]],
    ['Anchor.Washer.Delete', [-0.5, 1, -3.5]],
  ] as const) {
    addAnchor(root, name, point);
  }
  addCharacterRoot(root, 'Courier.Root', -1.5);
  addCharacterRoot(root, 'Guide.Root', 1.5);

  const meshes: THREE.Mesh[] = [];
  root.traverse((object) => {
    if (object instanceof THREE.Mesh) meshes.push(object);
  });
  const baseMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const variants = new Map([
    ['Light', new THREE.MeshStandardMaterial({ color: 0xffffff })],
    ['Minecraft', new THREE.MeshStandardMaterial({ color: 0xffffff })],
    ['Raccoon', new THREE.MeshStandardMaterial({ color: 0xffffff })],
    ['Dark', new THREE.MeshStandardMaterial({ color: 0xffffff })],
  ] as const);
  const materialVariants = new DioramaMaterialVariants(
    meshes.map((mesh) => ({ mesh, baseMaterial, materialsByVariant: variants })),
    [baseMaterial, ...variants.values()],
  );
  return {
    root,
    materialVariants,
    exteriorGroundTexture: new THREE.DataTexture(new Uint8Array([215, 190, 154, 255]), 1, 1),
  };
}

function addCharacterRoot(root: THREE.Group, name: string, x: number): void {
  const raccoon = new THREE.Group();
  raccoon.name = dioramaSceneNodeName(name);
  raccoon.position.x = x;
  root.add(raccoon);
  addBox(raccoon, `${name} body`, [0, 0.6, 0], [0.9, 1, 0.8]);
}

function addAnchor(
  root: THREE.Group,
  name: string,
  position: readonly [number, number, number],
): void {
  const anchor = new THREE.Object3D();
  anchor.name = dioramaSceneNodeName(name);
  anchor.position.set(...position);
  root.add(anchor);
}

function addBox(
  root: THREE.Object3D,
  name: string,
  position: readonly [number, number, number],
  size: readonly [number, number, number],
): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(...size),
    new THREE.MeshStandardMaterial({ color: 0xffffff }),
  );
  mesh.name = dioramaSceneNodeName(name);
  mesh.position.set(...position);
  root.add(mesh);
  return mesh;
}

function collectGeometry(root: THREE.Object3D): readonly THREE.BufferGeometry[] {
  const geometries: THREE.BufferGeometry[] = [];
  root.traverse((object) => {
    if (object instanceof THREE.Mesh) geometries.push(object.geometry);
  });
  return geometries;
}
