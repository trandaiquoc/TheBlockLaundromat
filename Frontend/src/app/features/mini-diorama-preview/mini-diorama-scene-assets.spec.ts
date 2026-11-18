import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { MiniDioramaMaterialVariants } from './mini-diorama-material-variants';
import { buildMiniDioramaScene } from './mini-diorama-scene-assets';
import { applyMiniDioramaTheme, miniDioramaVariantForTheme } from './mini-diorama-scene-theme';
import { disposeMiniDioramaResources } from './mini-diorama-scene-resources';

describe('mini diorama scene assets', () => {
  it('keeps the approved model geometry while switching variants and theme lighting', () => {
    const asset = createSceneAsset();
    const assets = buildMiniDioramaScene(asset);
    const modelGeometry = collectGeometry(assets.model);
    const originalBackground = (assets.scene.background as THREE.Color).getHex();
    const originalLight = assets.themeTargets.keyLight.intensity;

    applyMiniDioramaTheme(assets, 'dark');

    expect(assets.scene.getObjectByName('Washer')).toBeTruthy();
    expect(assets.scene.getObjectByName('Notice_board')).toBeTruthy();
    expect(assets.scene.getObjectByName('Raccoon')).toBeTruthy();
    expect(assets.scene.background).toBeInstanceOf(THREE.Color);
    expect((assets.scene.background as THREE.Color).getHex()).not.toBe(originalBackground);
    expect(assets.themeTargets.keyLight.intensity).not.toBe(originalLight);
    expect(assets.themeTargets.lanternLight.intensity).toBeGreaterThan(0);
    expect(collectGeometry(assets.model)).toEqual(modelGeometry);
    expect(assets.interactionRoots.map(({ target }) => target)).toEqual([
      'washer',
      'project-board',
      'raccoon',
    ]);

    applyMiniDioramaTheme(assets, 'raccoon');
    expect((assets.scene.background as THREE.Color).getHex()).toBe(0x4b3f59);
    applyMiniDioramaTheme(assets, 'light');
    expect((assets.scene.background as THREE.Color).getHex()).toBe(0xe8dcc7);
    disposeMiniDioramaResources(assets.scene, asset.materialVariants.ownedMaterials);
  });

  it('maps the persisted application themes to the exact authored GLB variants', () => {
    expect(miniDioramaVariantForTheme('craft')).toBe('Minecraft');
    expect(miniDioramaVariantForTheme('light')).toBe('Light');
    expect(miniDioramaVariantForTheme('raccoon')).toBe('Raccoon');
    expect(miniDioramaVariantForTheme('dark')).toBe('Dark');
  });
});

function createSceneAsset(): {
  readonly root: THREE.Group;
  readonly materialVariants: MiniDioramaMaterialVariants;
} {
  const root = new THREE.Group();
  addBox(root, 'Platform', new THREE.Vector3(0, 0.2, 0), new THREE.Vector3(6, 0.4, 5));
  addBox(root, 'Washer', new THREE.Vector3(1.2, 1.2, 0), new THREE.Vector3(1.2, 2, 1));
  addBox(root, 'Notice_board', new THREE.Vector3(0, 2.6, -2), new THREE.Vector3(1.8, 1.2, 0.2));
  addBox(root, 'Lantern', new THREE.Vector3(0.7, 3.5, -1.7), new THREE.Vector3(0.3, 0.5, 0.3));
  const raccoon = new THREE.Group();
  raccoon.name = 'Raccoon';
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
    root,
    materialVariants: new MiniDioramaMaterialVariants(targets, [
      baseMaterial,
      ...variants.values(),
    ]),
  };
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
  mesh.name = name;
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
