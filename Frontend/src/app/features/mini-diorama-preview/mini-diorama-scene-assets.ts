import * as THREE from 'three';
import type { MiniDioramaFocus, MiniDioramaTarget } from './mini-diorama-contracts';
import { addFocusMarker } from './mini-diorama-scene-geometry';
import type { MiniDioramaSceneAsset } from './mini-diorama-scene-loader';
import { applyMiniDioramaTheme } from './mini-diorama-scene-theme';
import { miniDioramaSceneContract, miniDioramaSceneNodeName } from './mini-diorama-scene-contract';

export interface MiniDioramaSceneAssets {
  readonly scene: THREE.Scene;
  readonly model: THREE.Group;
  readonly bounds: THREE.Box3;
  readonly focusBounds: Readonly<Record<MiniDioramaFocus, THREE.Box3>>;
  readonly cameraFocusTargets: Readonly<Partial<Record<MiniDioramaFocus, THREE.Vector3>>>;
  readonly materialVariants: MiniDioramaSceneAsset['materialVariants'];
  readonly themeTargets: {
    readonly hemisphere: THREE.HemisphereLight;
    readonly keyLight: THREE.DirectionalLight;
    readonly fillLight: THREE.DirectionalLight;
    readonly lanternLight: THREE.PointLight;
  };
  readonly interactionRoots: readonly {
    readonly object: THREE.Object3D;
    readonly target: MiniDioramaTarget;
  }[];
  readonly raccoonControllerRoot?: THREE.Object3D;
  readonly focusMarkers: Readonly<Record<MiniDioramaTarget, THREE.Mesh>>;
}

export function buildMiniDioramaScene(asset: MiniDioramaSceneAsset): MiniDioramaSceneAssets {
  const contract = miniDioramaSceneContract(asset.kind);
  const scene = new THREE.Scene();
  scene.name = `${asset.kind}-scene`;
  scene.background = new THREE.Color(0xd7c4a6);
  scene.add(asset.root);
  scene.updateMatrixWorld(true);

  const targets = {
    washer: requireSceneObject(asset.root, contract.interactionNodes.washer),
    'project-board': requireSceneObject(asset.root, contract.interactionNodes['project-board']),
    raccoon: requireSceneObject(asset.root, contract.raccoonRoots[0]),
  } satisfies Record<MiniDioramaTarget, THREE.Object3D>;
  const raccoonRoots = contract.raccoonRoots.map((name) => requireSceneObject(asset.root, name));
  const bounds = new THREE.Box3().setFromObject(asset.root);
  if (bounds.isEmpty()) throw new Error('The scene GLB has empty scene bounds.');

  const focusBounds = {
    overview: bounds.clone(),
    washer: boundsFor(targets.washer),
    'project-board': contract.boardBoundsAnchors.length
      ? boundsFromAnchors(asset.root, contract.boardBoundsAnchors)
      : boundsFor(targets['project-board']),
    raccoon: boundsForObjects(raccoonRoots),
  } satisfies Record<MiniDioramaFocus, THREE.Box3>;
  const focusMarkers = createFocusMarkers(scene, bounds, focusBounds);
  const cameraFocusTargets: Partial<Record<MiniDioramaFocus, THREE.Vector3>> = {};
  for (const [focus, name] of Object.entries(contract.cameraFocusAnchors)) {
    if (!name) continue;
    cameraFocusTargets[focus as MiniDioramaFocus] = worldPosition(
      requireSceneObject(asset.root, name),
    );
  }
  const lanternNode = requireSceneObject(asset.root, contract.lanternLightNode);
  const lanternBounds = new THREE.Box3().setFromObject(lanternNode);
  const lanternPosition = lanternBounds.isEmpty()
    ? worldPosition(lanternNode)
    : lanternBounds.getCenter(new THREE.Vector3());
  const themeTargets = createThemeLights(scene, bounds, lanternPosition);

  const assets: MiniDioramaSceneAssets = {
    scene,
    model: asset.root,
    bounds,
    focusBounds,
    cameraFocusTargets,
    materialVariants: asset.materialVariants,
    themeTargets,
    interactionRoots: [
      { object: targets.washer, target: 'washer' },
      { object: targets['project-board'], target: 'project-board' },
      ...raccoonRoots.map((object) => ({ object, target: 'raccoon' as const })),
    ],
    raccoonControllerRoot: contract.raccoonControllerRoot
      ? requireSceneObject(asset.root, contract.raccoonControllerRoot)
      : undefined,
    focusMarkers,
  };

  applyMiniDioramaTheme(assets, 'craft');
  return assets;
}

export function updateMiniDioramaFeedback(
  markers: Readonly<Record<MiniDioramaTarget, THREE.Mesh>>,
  selected: MiniDioramaTarget | undefined,
  hovered: MiniDioramaTarget | undefined,
): void {
  for (const target of Object.keys(markers) as MiniDioramaTarget[]) {
    const material = markers[target].material as THREE.MeshBasicMaterial;
    material.opacity = target === selected ? 0.46 : target === hovered ? 0.3 : 0.015;
    markers[target].scale.setScalar(target === selected ? 1.08 : target === hovered ? 1.04 : 1);
  }
}

function requireSceneObject(root: THREE.Object3D, name: string): THREE.Object3D {
  const object = root.getObjectByName(miniDioramaSceneNodeName(name));
  if (!object) throw new Error(`The scene GLB is missing its '${name}' scene object.`);
  return object;
}

function boundsFor(object: THREE.Object3D): THREE.Box3 {
  const bounds = new THREE.Box3().setFromObject(object);
  if (bounds.isEmpty()) throw new Error(`The scene object '${object.name}' has empty bounds.`);
  return bounds;
}

function boundsForObjects(objects: readonly THREE.Object3D[]): THREE.Box3 {
  const bounds = new THREE.Box3();
  for (const object of objects) bounds.union(boundsFor(object));
  if (bounds.isEmpty()) throw new Error('The scene characters have empty bounds.');
  return bounds;
}

function boundsFromAnchors(root: THREE.Object3D, names: readonly string[]): THREE.Box3 {
  const bounds = new THREE.Box3().setFromPoints(
    names.map((name) => worldPosition(requireSceneObject(root, name))),
  );
  if (bounds.isEmpty()) throw new Error('The project board anchors have empty bounds.');
  return bounds.expandByScalar(0.04);
}

function worldPosition(object: THREE.Object3D): THREE.Vector3 {
  object.updateWorldMatrix(true, false);
  return object.getWorldPosition(new THREE.Vector3());
}

function createFocusMarkers(
  scene: THREE.Scene,
  sceneBounds: THREE.Box3,
  focusBounds: Readonly<Record<MiniDioramaFocus, THREE.Box3>>,
): Readonly<Record<MiniDioramaTarget, THREE.Mesh>> {
  return {
    washer: addFocusMarker(
      scene,
      0xe4b56c,
      markerPosition(sceneBounds, focusBounds.washer),
      markerRadius(focusBounds.washer),
    ),
    'project-board': addFocusMarker(
      scene,
      0xe4b56c,
      markerPosition(sceneBounds, focusBounds['project-board']),
      markerRadius(focusBounds['project-board']),
    ),
    raccoon: addFocusMarker(
      scene,
      0xe4b56c,
      markerPosition(sceneBounds, focusBounds.raccoon),
      markerRadius(focusBounds.raccoon),
    ),
  };
}

function markerPosition(sceneBounds: THREE.Box3, targetBounds: THREE.Box3): THREE.Vector3 {
  return new THREE.Vector3(
    (targetBounds.min.x + targetBounds.max.x) / 2,
    sceneBounds.min.y + 0.035,
    (targetBounds.min.z + targetBounds.max.z) / 2,
  );
}

function markerRadius(bounds: THREE.Box3): number {
  const size = bounds.getSize(new THREE.Vector3());
  return Math.max(0.4, Math.max(size.x, size.z) * 0.62);
}

function createThemeLights(
  scene: THREE.Scene,
  bounds: THREE.Box3,
  lanternPosition: THREE.Vector3,
): MiniDioramaSceneAssets['themeTargets'] {
  const size = bounds.getSize(new THREE.Vector3());
  const extent = Math.max(size.x, size.y, size.z, 1);

  const hemisphere = new THREE.HemisphereLight(0xfff0d5, 0x604833, 1.6);
  scene.add(hemisphere);

  const keyLight = new THREE.DirectionalLight(0xffdda7, 2.1);
  keyLight.position.set(bounds.min.x - extent * 0.8, bounds.max.y + extent, bounds.max.z + extent);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(512, 512);
  keyLight.shadow.camera.left = -extent;
  keyLight.shadow.camera.right = extent;
  keyLight.shadow.camera.top = extent;
  keyLight.shadow.camera.bottom = -extent;
  keyLight.shadow.camera.near = 0.1;
  keyLight.shadow.camera.far = extent * 5;
  keyLight.shadow.bias = -0.00025;
  keyLight.shadow.normalBias = 0.035;
  keyLight.shadow.camera.updateProjectionMatrix();
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xc6d9e9, 0.62);
  fillLight.position.set(bounds.max.x + extent, bounds.max.y * 0.6, bounds.min.z - extent);
  scene.add(fillLight);

  const lanternLight = new THREE.PointLight(0xffc486, 3.4, extent * 2, 2);
  lanternLight.position.copy(lanternPosition);
  scene.add(lanternLight);

  return { hemisphere, keyLight, fillLight, lanternLight };
}
