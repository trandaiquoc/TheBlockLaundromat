import * as THREE from 'three';
import type { MiniDioramaTarget } from './mini-diorama-contracts';
import {
  applyMiniDioramaTheme,
  createMiniDioramaSceneMaterials,
  type MiniDioramaSceneMaterials,
  type MiniDioramaSceneThemeTargets,
} from './mini-diorama-scene-materials';
import { addCuboid, addFocusMarker, addGroup } from './mini-diorama-scene-geometry';
import { buildMiniDioramaProjectBoard } from './mini-diorama-project-board';
import { buildMiniDioramaRoom } from './mini-diorama-room-assets';
import { buildMiniDioramaWasher } from './mini-diorama-washer-asset';

export interface MiniDioramaSceneAssets {
  readonly scene: THREE.Scene;
  readonly materials: MiniDioramaSceneMaterials;
  readonly themeTargets: MiniDioramaSceneThemeTargets;
  readonly interactionRoots: readonly {
    readonly object: THREE.Object3D;
    readonly target: MiniDioramaTarget;
  }[];
  readonly raccoonAnchor: THREE.Group;
  readonly focusMarkers: Readonly<Record<MiniDioramaTarget, THREE.Mesh>>;
}

export function buildMiniDioramaScene(): MiniDioramaSceneAssets {
  const materials = createMiniDioramaSceneMaterials();
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xd7c4a6);
  scene.fog = new THREE.Fog(0xd7c4a6, 15, 28);

  const hemisphere = new THREE.HemisphereLight(0xffecd4, 0x604833, 1.9);
  scene.add(hemisphere);

  const keyLight = new THREE.DirectionalLight(0xffe6c7, 2.6);
  keyLight.position.set(-4.5, 8.5, 6.5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(512, 512);
  keyLight.shadow.camera.left = -7;
  keyLight.shadow.camera.right = 7;
  keyLight.shadow.camera.top = 8;
  keyLight.shadow.camera.bottom = -5;
  keyLight.shadow.bias = -0.00025;
  keyLight.shadow.normalBias = 0.035;
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xffd9b2, 0.62);
  fillLight.position.set(5, 4, -4);
  scene.add(fillLight);

  const warmBounce = new THREE.PointLight(0xffc486, 8, 9, 2);
  warmBounce.position.set(-2.2, 4.3, 1.4);
  scene.add(warmBounce);

  const room = new THREE.Group();
  room.name = 'laundromat-room';
  scene.add(room);
  const roomThemeTargets = buildMiniDioramaRoom(room, materials);

  const themeTargets: MiniDioramaSceneThemeTargets = {
    hemisphere,
    keyLight,
    fillLight,
    warmBounce,
    pendantLights: roomThemeTargets.pendantLights,
    window: roomThemeTargets.window,
  };

  const board = buildMiniDioramaProjectBoard(room, materials);
  const washer = buildMiniDioramaWasher(room, materials);
  const raccoonAnchor = addGroup(room, [-1.28, 0, 0.72]);
  raccoonAnchor.name = 'laundromat-raccoon';
  raccoonAnchor.scale.setScalar(2);
  const raccoonShadow = addCuboid(room, 1.15, 0.02, 1.8, materials.shadow, [-1.28, 0.025, 0.72]);
  raccoonShadow.name = 'raccoon-ground-shadow';

  const focusMarkers = {
    washer: addFocusMarker(scene, materials.terracotta, [1.45, 0.035, -0.28]),
    'project-board': addFocusMarker(scene, materials.brass, [-0.42, 0.035, -1.55]),
    raccoon: addFocusMarker(scene, materials.sage, [-1.28, 0.035, 0.72]),
  };

  applyMiniDioramaTheme(scene, materials, 'craft', themeTargets);

  return {
    scene,
    materials,
    themeTargets,
    raccoonAnchor,
    focusMarkers,
    interactionRoots: [
      { object: washer, target: 'washer' },
      { object: board, target: 'project-board' },
      { object: raccoonAnchor, target: 'raccoon' },
    ],
  };
}

export function updateMiniDioramaFeedback(
  markers: Readonly<Record<MiniDioramaTarget, THREE.Mesh>>,
  selected: MiniDioramaTarget | undefined,
  hovered: MiniDioramaTarget | undefined,
): void {
  for (const target of Object.keys(markers) as MiniDioramaTarget[]) {
    const material = markers[target].material as THREE.MeshStandardMaterial;
    material.opacity = target === selected ? 0.46 : target === hovered ? 0.3 : 0.015;
    markers[target].scale.setScalar(target === selected ? 1.08 : target === hovered ? 1.04 : 1);
  }
}
