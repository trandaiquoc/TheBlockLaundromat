import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { MiniDioramaMaterialVariants } from './mini-diorama-material-variants';
import { buildMiniDioramaScene } from './mini-diorama-scene-assets';
import { applyMiniDioramaTheme, miniDioramaVariantForTheme } from './mini-diorama-scene-theme';
import { disposeMiniDioramaResources } from './mini-diorama-scene-resources';
import type { MiniDioramaSceneAsset } from './mini-diorama-scene-loader';
import type { MiniDioramaSceneKind } from './mini-diorama-scene-contract';
import { miniDioramaSceneContract, miniDioramaSceneNodeName } from './mini-diorama-scene-contract';

describe('mini diorama scene assets', () => {
  it('keeps the approved geometry and transparent CSS atmosphere while switching theme lighting', () => {
    const asset = createSceneAsset();
    const assets = buildMiniDioramaScene(asset);
    const modelGeometry = collectGeometry(assets.model);
    const originalLight = assets.themeTargets.keyLight.intensity;

    applyMiniDioramaTheme(assets, 'dark');

    expect(assets.scene.getObjectByName('Washer')).toBeTruthy();
    expect(assets.scene.getObjectByName('Notice_board')).toBeTruthy();
    expect(assets.scene.getObjectByName('Raccoon')).toBeTruthy();
    expect(assets.scene.background).toBeNull();
    expect(asset.materialVariants.targets[0].mesh.material).toBe(
      asset.materialVariants.targets[0].materialsByVariant.get('Dark'),
    );
    expect(assets.themeTargets.keyLight.intensity).not.toBe(originalLight);
    expect(assets.themeTargets.lanternLights[0]?.intensity).toBeGreaterThan(0);
    expect(collectGeometry(assets.model)).toEqual(modelGeometry);
    expect(assets.interactionRoots.map(({ target }) => target)).toEqual([
      'washer',
      'project-board',
      'raccoon',
    ]);

    applyMiniDioramaTheme(assets, 'raccoon');
    expect(assets.scene.background).toBeNull();
    applyMiniDioramaTheme(assets, 'light');
    expect(assets.scene.background).toBeNull();
    disposeMiniDioramaResources(assets.scene, asset.materialVariants.ownedMaterials);
  });

  it('maps the persisted application themes to the exact authored GLB variants', () => {
    expect(miniDioramaVariantForTheme('craft')).toBe('Minecraft');
    expect(miniDioramaVariantForTheme('light')).toBe('Light');
    expect(miniDioramaVariantForTheme('raccoon')).toBe('Raccoon');
    expect(miniDioramaVariantForTheme('dark')).toBe('Dark');
  });

  it('uses Stage 3 anchors and focuses both assembled characters as one target', () => {
    const asset = createSceneAsset('stage-3-production');
    const assets = buildMiniDioramaScene(asset);
    const profile = miniDioramaSceneContract('stage-3-production').profile;
    const raccoonInteractions = assets.interactionRoots.filter(
      ({ target }) => target === 'raccoon',
    );

    expect(profile?.id).toBe('production-default');
    expect(profile?.sceneAssetPath).toContain('Octagonal-Laundromat.glb');
    expect(profile?.washerAssetPath).toContain('Washer-Alternate/Washer.glb');
    expect(profile?.exteriorGroundTexturePath).toContain('exterior-forest-floor.png');
    expect(profile?.placements.map(({ nodeName }) => nodeName)).toContain('BasketBlueRoll');
    expect(profile?.placements.map(({ nodeName }) => nodeName)).toContain('ShelfLantern');
    expect(profile?.ground.contactStrength).toBe(0.52);
    expect(assets.scene.getObjectByName('ProjectBoard')).toBeTruthy();
    expect(assets.scene.getObjectByName('CourierRoot')).toBeTruthy();
    expect(assets.scene.getObjectByName('GuideRoot')).toBeTruthy();
    expect(assets.roomSpinPivot?.name).toBe('Stage3RoomSpinPivot');
    expect(assets.scene.getObjectByName('Preview.OutdoorGround')).toBeTruthy();
    const ground = assets.scene.getObjectByName('Preview.OutdoorGround') as THREE.Mesh;
    expect(ground.material).toBeInstanceOf(THREE.ShaderMaterial);
    expect((ground.material as THREE.ShaderMaterial).uniforms['uGroundTexture']?.value).toBe(
      asset.exteriorGroundTexture,
    );
    expect((ground.material as THREE.ShaderMaterial).uniforms['uContactStrength']?.value).toBe(
      0.52,
    );
    expect(assets.scene.getObjectByName('Preview.RoomContactShadow')).toBeTruthy();
    expect(
      (assets.scene.getObjectByName('Preview.RoomContactShadow') as THREE.Mesh).material,
    ).toBeInstanceOf(THREE.ShadowMaterial);
    expect(assets.themeTargets.lanternLights).toHaveLength(2);
    expect(assets.themeTargets.lanternLights.map(({ name }) => name)).toEqual([
      'Anchor.NicheLantern.Light.PreviewLight',
      'Anchor.ShelfLantern.Light.PreviewLight',
    ]);
    expect(assets.model.getObjectByName('LeftCabinet')?.position.x).toBeCloseTo(0);
    expect(assets.model.getObjectByName('LeftCabinet')?.position.z).toBeCloseTo(-1.1);
    expect(assets.model.getObjectByName('ShelfFern')?.position.x).toBeCloseTo(0);
    expect(assets.model.getObjectByName('ShelfFern')?.position.z).toBeCloseTo(-1.1);
    expect(assets.model.getObjectByName('WestIvy')?.position.x).toBeCloseTo(0.18);
    expect(assets.model.getObjectByName('WestIvy')?.position.y).toBeCloseTo(0.25);
    expect(assets.model.getObjectByName('WestIvy')?.position.z).toBeCloseTo(-1.1);
    expect(assets.model.getObjectByName('Marigold')?.position.z).toBeCloseTo(-1.1);
    expect(assets.model.getObjectByName('ShelfLantern')?.position.x).toBeCloseTo(-3);
    expect(assets.model.getObjectByName('ShelfLantern')?.position.z).toBeCloseTo(-0.6);
    expect(assets.model.getObjectByName('LinenBasket')?.position.z).toBeCloseTo(-1.1);
    expect(assets.model.getObjectByName('BasketBlueRoll')?.position.z).toBeCloseTo(-1.1);
    expect(assets.outdoorGround).toBe(assets.themeTargets.outdoorGround);
    expect(raccoonInteractions).toHaveLength(2);
    expect(assets.focusBounds.raccoon.min.x).toBeLessThan(-1);
    expect(assets.focusBounds.raccoon.max.x).toBeGreaterThan(1);
    expect(assets.cameraFocusTargets.overview?.toArray()).toEqual([0, 1.15, 0]);
    expect(assets.cameraFocusTargets['project-board']?.toArray()).toEqual([-2.7, 2, -2.57]);
    expect(assets.cameraFocusTargets.washer?.toArray()).toEqual([0, 1, -3]);
    expect(assets.cameraFocusYaws.washer).toBeCloseTo(0);
    expect(assets.cameraFocusYaws['project-board']).toBeCloseTo(Math.PI / 4);
    expect(assets.focusBounds['project-board'].getSize(new THREE.Vector3()).x).toBeGreaterThan(2.4);
    expect(assets.raccoonControllerRoot).toBeUndefined();
    applyMiniDioramaTheme(assets, 'dark');
    expect(assets.themeTargets.lanternLights.map(({ intensity }) => intensity)).toEqual([7.2, 7.2]);

    disposeMiniDioramaResources(assets.scene, asset.materialVariants.ownedMaterials);
  });
});

function createSceneAsset(
  kind: MiniDioramaSceneKind = 'integration-preview',
): MiniDioramaSceneAsset {
  const root = new THREE.Group();
  if (kind === 'integration-preview') addIntegrationSceneFixture(root);
  else addStageThreeSceneFixture(root);

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
  const targets = meshes.map((mesh) => ({
    mesh,
    baseMaterial,
    materialsByVariant: variants,
  }));
  return {
    kind,
    root,
    exteriorGroundTexture:
      kind === 'stage-3-production'
        ? new THREE.DataTexture(new Uint8Array([215, 190, 154, 255]), 1, 1)
        : undefined,
    materialVariants: new MiniDioramaMaterialVariants(targets, [
      baseMaterial,
      ...variants.values(),
    ]),
  };
}

function addIntegrationSceneFixture(root: THREE.Group): void {
  addBox(root, 'Platform', new THREE.Vector3(0, 0.2, 0), new THREE.Vector3(6, 0.4, 5));
  addBox(root, 'Washer', new THREE.Vector3(1.2, 1.2, 0), new THREE.Vector3(1.2, 2, 1));
  addBox(root, 'Notice_board', new THREE.Vector3(0, 2.6, -2), new THREE.Vector3(1.8, 1.2, 0.2));
  addBox(root, 'Lantern', new THREE.Vector3(0.7, 3.5, -1.7), new THREE.Vector3(0.3, 0.5, 0.3));
  const raccoon = new THREE.Group();
  raccoon.name = miniDioramaSceneNodeName('Raccoon');
  root.add(raccoon);
  addBox(raccoon, 'Raccoon body', new THREE.Vector3(-1, 0.5, 0.5), new THREE.Vector3(0.9, 1, 0.8));
  addBox(raccoon, 'ForelegL', new THREE.Vector3(-0.8, 0.6, 0.9), new THREE.Vector3(0.2, 0.5, 0.2));
  addBox(
    raccoon,
    'Head_•_broad_cheek_mask',
    new THREE.Vector3(-1, 1.1, 0.7),
    new THREE.Vector3(0.8, 0.6, 0.6),
  );
  addBox(
    raccoon,
    'Tail_•_banded',
    new THREE.Vector3(-1.6, 0.35, 0.2),
    new THREE.Vector3(0.8, 0.3, 0.4),
  );
}

function addStageThreeSceneFixture(root: THREE.Group): void {
  addBox(root, 'Floor', new THREE.Vector3(0, 0.05, 0), new THREE.Vector3(8, 0.2, 8));
  addBox(root, 'Washer', new THREE.Vector3(0, 1, -3), new THREE.Vector3(2, 2, 1));
  const projectBoard = addBox(
    root,
    'ProjectBoard',
    new THREE.Vector3(-2.7, 1.3, -2.6),
    new THREE.Vector3(2.5, 2.2, 0.1),
  );
  projectBoard.rotation.y = Math.PI / 4;
  addAnchor(root, 'Anchor.NicheLantern.Light', new THREE.Vector3(2, 2.4, -2));
  const shelfLantern = new THREE.Group();
  shelfLantern.name = miniDioramaSceneNodeName('ShelfLantern');
  shelfLantern.position.set(-3, 2, 0.5);
  root.add(shelfLantern);
  addAnchor(shelfLantern, 'Anchor.ShelfLantern.Light', new THREE.Vector3(0, 0, 0));
  for (const nodeName of [
    'LeftCabinet',
    'WestIvy',
    'ShelfFern',
    'CabinetTowel1',
    'CabinetTowel2',
    'CabinetTowel3',
    'LinenBasket',
    'BasketBlueRoll',
    'BasketIvoryRoll',
    'SageWashBox',
    'OchreWashBox',
    'SeafoamPitcher',
    'CabinetBlueTin',
    'ApothecaryBottle',
    'CeramicPump',
    'LaundryLedger',
    'WrappedSoap',
    'CreamWashBox',
    'Marigold',
  ]) {
    const object = new THREE.Group();
    object.name = miniDioramaSceneNodeName(nodeName);
    object.position.z = 0;
    root.add(object);
  }
  addAnchor(root, 'Anchor.Camera.Overview', new THREE.Vector3(0, 1.15, 0));
  addAnchor(root, 'Anchor.Camera.Portrait', new THREE.Vector3(0, 1.48, -0.24));
  addAnchor(root, 'Anchor.Camera.Board', new THREE.Vector3(-2.7, 2, -2.57));
  addAnchor(root, 'Anchor.Camera.Washer', new THREE.Vector3(0, 1.05, -3.03));
  addAnchor(root, 'Anchor.Camera.Recenter', new THREE.Vector3(0, 1.32, -0.2));
  addAnchor(root, 'Anchor.Board.Center', new THREE.Vector3(-2.7, 1.3, -2.56));
  addAnchor(root, 'Anchor.Board.BottomLeft', new THREE.Vector3(-3.9, 0.2, -2.56));
  addAnchor(root, 'Anchor.Board.BottomRight', new THREE.Vector3(-1.5, 0.2, -2.56));
  addAnchor(root, 'Anchor.Board.TopLeft', new THREE.Vector3(-3.9, 2.4, -2.56));
  addAnchor(root, 'Anchor.Board.TopRight', new THREE.Vector3(-1.5, 2.4, -2.56));
  addAnchor(root, 'Anchor.Washer.Preview', new THREE.Vector3(0, 1, -3.5));
  addAnchor(root, 'Anchor.Washer.Open', new THREE.Vector3(0.5, 1, -3.5));
  addAnchor(root, 'Anchor.Washer.Delete', new THREE.Vector3(-0.5, 1, -3.5));

  addCharacterRoot(root, 'Courier.Root', -1.5);
  addCharacterRoot(root, 'Guide.Root', 1.5);
}

function addCharacterRoot(parent: THREE.Group, name: string, x: number): void {
  const raccoon = new THREE.Group();
  raccoon.name = miniDioramaSceneNodeName(name);
  raccoon.position.x = x;
  parent.add(raccoon);
  addBox(raccoon, `${name} body`, new THREE.Vector3(0, 0.6, 0), new THREE.Vector3(0.9, 1, 0.8));
}

function addAnchor(parent: THREE.Group, name: string, position: THREE.Vector3): void {
  const anchor = new THREE.Object3D();
  anchor.name = miniDioramaSceneNodeName(name);
  anchor.position.copy(position);
  parent.add(anchor);
}

function addBox(
  parent: THREE.Object3D,
  name: string,
  position: THREE.Vector3,
  size: THREE.Vector3,
): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(size.x, size.y, size.z),
    new THREE.MeshStandardMaterial(),
  );
  mesh.name = miniDioramaSceneNodeName(name);
  mesh.position.copy(position);
  parent.add(mesh);
  return mesh;
}

function collectGeometry(root: THREE.Object3D): readonly THREE.BufferGeometry[] {
  const geometries: THREE.BufferGeometry[] = [];
  root.traverse((object) => {
    if (object instanceof THREE.Mesh) geometries.push(object.geometry);
  });
  return geometries;
}
