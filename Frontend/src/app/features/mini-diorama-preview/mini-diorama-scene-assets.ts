import * as THREE from 'three';
import type { MiniDioramaTarget } from './mini-diorama-contracts';
import type { MiniDioramaRaccoonRig } from './mini-diorama-raccoon-controller';
import {
  createMiniDioramaSceneMaterials,
  type MiniDioramaSceneMaterials,
} from './mini-diorama-scene-materials';
import { addFocusMarker } from './mini-diorama-scene-geometry';
import { buildMiniDioramaProjectBoard } from './mini-diorama-project-board';
import { buildMiniDioramaRaccoon } from './mini-diorama-raccoon-asset';
import { buildMiniDioramaRoom, buildMiniDioramaRoomAccents } from './mini-diorama-room-assets';
import { buildMiniDioramaWasher } from './mini-diorama-washer-asset';

export interface MiniDioramaSceneAssets {
  readonly scene: THREE.Scene;
  readonly materials: MiniDioramaSceneMaterials;
  readonly interactionRoots: readonly {
    readonly object: THREE.Object3D;
    readonly target: MiniDioramaTarget;
  }[];
  readonly raccoon: MiniDioramaRaccoonRig;
  readonly focusMarkers: Readonly<Record<MiniDioramaTarget, THREE.Mesh>>;
}

export function buildMiniDioramaScene(): MiniDioramaSceneAssets {
  const materials = createMiniDioramaSceneMaterials();
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xb9d7d2);
  scene.fog = new THREE.Fog(0xb9d7d2, 15, 28);

  const hemisphere = new THREE.HemisphereLight(0xfff3df, 0x435d61, 2.15);
  scene.add(hemisphere);

  const keyLight = new THREE.DirectionalLight(0xfff0d9, 3.2);
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

  const fillLight = new THREE.DirectionalLight(0xb8dcff, 1.15);
  fillLight.position.set(5, 4, -4);
  scene.add(fillLight);

  const warmBounce = new THREE.PointLight(0xffb986, 16, 9, 2);
  warmBounce.position.set(-2.2, 4.3, 1.4);
  scene.add(warmBounce);

  const room = new THREE.Group();
  room.name = 'laundromat-room';
  scene.add(room);
  buildMiniDioramaRoom(room, materials);

  const board = buildMiniDioramaProjectBoard(room, materials);
  const washer = buildMiniDioramaWasher(room, materials);
  const raccoon = buildMiniDioramaRaccoon(room, materials);
  buildMiniDioramaRoomAccents(room, materials);

  const focusMarkers = {
    washer: addFocusMarker(scene, materials.coral, [1.45, 0.035, -0.28]),
    'project-board': addFocusMarker(scene, materials.butter, [-0.42, 0.035, -1.55]),
    raccoon: addFocusMarker(scene, materials.mint, [-1.28, 0.035, 0.72]),
  };

  return {
    scene,
    materials,
    raccoon,
    focusMarkers,
    interactionRoots: [
      { object: washer, target: 'washer' },
      { object: board, target: 'project-board' },
      { object: raccoon.root, target: 'raccoon' },
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
    material.opacity = target === selected ? 0.76 : target === hovered ? 0.48 : 0.11;
    markers[target].scale.setScalar(target === selected ? 1.15 : target === hovered ? 1.06 : 1);
  }
}
