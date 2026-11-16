import * as THREE from 'three';
import type { MiniDioramaSceneMaterials } from './mini-diorama-scene-materials';
import type { MiniDioramaRaccoonRig } from './mini-diorama-raccoon-controller';
import { addGroup } from './mini-diorama-scene-geometry';
import {
  raccoonTextureRegionUv,
  type MiniDioramaRaccoonTextureRegion,
} from './mini-diorama-raccoon-texture';

const modelUnit = 0.075;
const bodyBegAngle = (60 * Math.PI) / 180;
const headCounterAngle = (-60 * Math.PI) / 180;

type CuboidFace = 'right' | 'left' | 'top' | 'bottom' | 'back' | 'front';

const cuboidFaceIndices: Readonly<Record<CuboidFace, number>> = {
  right: 0,
  left: 1,
  top: 2,
  bottom: 3,
  back: 4,
  front: 5,
};

type CuboidUv = Partial<Readonly<Record<CuboidFace, MiniDioramaRaccoonTextureRegion>>>;

export function buildMiniDioramaRaccoon(
  parent: THREE.Group,
  materials: MiniDioramaSceneMaterials,
): MiniDioramaRaccoonRig & { readonly root: THREE.Group } {
  const root = addGroup(parent, [-1.28, 0, 0.72]);
  root.name = 'laundromat-raccoon';
  root.scale.setScalar(1.1);
  root.rotation.y = Math.PI;
  addGroundShadow(root, materials);

  const body = addGroup(root, [0, 16 * modelUnit, 0.5 * modelUnit]);
  body.name = 'raccoon-body';
  body.rotation.x = bodyBegAngle;
  const torso = createCuboidMesh(
    [11 * modelUnit, 8 * modelUnit, 15 * modelUnit],
    'raccoon-torso',
    materials.raccoonSkin,
    { front: 'chest', back: 'fur', right: 'fur', left: 'fur', top: 'fur', bottom: 'fur' },
  );
  torso.castShadow = true;
  torso.receiveShadow = true;
  body.add(torso);

  const legs: THREE.Group[] = [];
  let greetingArm: THREE.Group | undefined;
  for (const z of [-5.5, 6.5] as const) {
    for (const side of [-1, 1] as const) {
      const isFront = z < 0;
      const poseOffset = isFront ? -1 : 2;
      const leg = addGroup(body, [
        side * 3 * modelUnit,
        (-4 + poseOffset) * modelUnit,
        z * modelUnit,
      ]);
      leg.name = `raccoon-${isFront ? 'front' : 'hind'}-leg-${side < 0 ? 'left' : 'right'}`;
      leg.rotation.x = isFront ? 0 : (-60 * Math.PI) / 180;
      const paw = createCuboidMesh(
        [2 * modelUnit, 7 * modelUnit, 2 * modelUnit],
        `${leg.name}-cuboid`,
        materials.raccoonSkin,
        { front: 'limb', back: 'limb', right: 'limb', left: 'limb', top: 'limb', bottom: 'paw' },
      );
      paw.position.y = -3.5 * modelUnit;
      paw.castShadow = true;
      paw.receiveShadow = true;
      leg.add(paw);
      legs.push(leg);
      if (isFront && side === 1) greetingArm = leg;
    }
  }

  const tail = addGroup(body, [0.5 * modelUnit, modelUnit, 7.5 * modelUnit]);
  tail.name = 'raccoon-tail';
  tail.rotation.x = (-80 * Math.PI) / 180;
  const tailMesh = createCuboidMesh(
    [5 * modelUnit, 5 * modelUnit, 19 * modelUnit],
    'raccoon-banded-tail',
    materials.raccoonSkin,
    { front: 'tail', back: 'tail', right: 'tail', left: 'tail', top: 'tail', bottom: 'tail' },
  );
  tailMesh.position.z = 9.5 * modelUnit;
  tailMesh.castShadow = true;
  tailMesh.receiveShadow = true;
  tail.add(tailMesh);

  const head = addGroup(body, [0, -0.5 * modelUnit, -8.5 * modelUnit]);
  head.name = 'raccoon-head';
  head.rotation.x = headCounterAngle;
  head.rotation.z = -0.16;
  const headMesh = createCuboidMesh(
    [9 * modelUnit, 7 * modelUnit, 5 * modelUnit],
    'raccoon-head-cuboid',
    materials.raccoonSkin,
    {
      front: 'face',
      back: 'fur',
      right: 'faceSide',
      left: 'faceSide',
      top: 'fur',
      bottom: 'fur',
    },
  );
  headMesh.position.set(0, 0.5 * modelUnit, -1.5 * modelUnit);
  headMesh.castShadow = true;
  headMesh.receiveShadow = true;
  head.add(headMesh);

  const muzzle = addGroup(head, [0, -1.5 * modelUnit, -5 * modelUnit]);
  muzzle.name = 'raccoon-muzzle';
  const muzzleMesh = createCuboidMesh(
    [4 * modelUnit, 3 * modelUnit, 3 * modelUnit],
    'raccoon-cream-snout',
    materials.raccoonSkin,
    {
      front: 'muzzle',
      back: 'cream',
      right: 'cream',
      left: 'cream',
      top: 'cream',
      bottom: 'cream',
    },
  );
  muzzleMesh.position.z = -0.5 * modelUnit;
  muzzleMesh.castShadow = true;
  muzzleMesh.receiveShadow = true;
  muzzle.add(muzzleMesh);
  const nose = createCuboidMesh(
    [1.1 * modelUnit, 0.75 * modelUnit, 0.35 * modelUnit],
    'raccoon-nose-pixel',
    materials.raccoonSkin,
    { front: 'nose', back: 'nose', right: 'nose', left: 'nose', top: 'nose', bottom: 'nose' },
  );
  nose.position.set(0, 0.45 * modelUnit, -2.17 * modelUnit);
  nose.castShadow = true;
  muzzle.add(nose);

  const eyeLids: THREE.Group[] = [];
  for (const side of [-1, 1] as const) {
    const eye = addGroup(head, [side * 2.05 * modelUnit, 0.6 * modelUnit, -4.08 * modelUnit]);
    eye.name = side < 0 ? 'raccoon-left-eye' : 'raccoon-right-eye';
    const eyePixel = createCuboidMesh(
      [0.8 * modelUnit, 0.65 * modelUnit, 0.2 * modelUnit],
      'raccoon-eye-pixel',
      materials.raccoonSkin,
      { front: 'eye', back: 'eye', right: 'eye', left: 'eye', top: 'eye', bottom: 'eye' },
    );
    eyePixel.castShadow = true;
    eye.add(eyePixel);
    eyeLids.push(eye);
  }

  const leftEar = createEar(head, -1, materials.raccoonSkin);
  const rightEar = createEar(head, 1, materials.raccoonSkin);
  if (!greetingArm) throw new Error('The Raccoon greeting leg was not built.');

  return { root, body, head, tail, leftEar, rightEar, greetingArm, eyeLids, legs };
}

function createCuboidMesh(
  size: readonly [number, number, number],
  name: string,
  material: THREE.Material,
  faceRegions: CuboidUv,
): THREE.Mesh<THREE.BoxGeometry, THREE.Material> {
  const geometry = new THREE.BoxGeometry(...size);
  const uv = geometry.getAttribute('uv');

  for (const [face, region] of Object.entries(faceRegions) as [
    CuboidFace,
    MiniDioramaRaccoonTextureRegion,
  ][]) {
    const groupStart = cuboidFaceIndices[face] * 4;
    const [uMin, vMin, uMax, vMax] = raccoonTextureRegionUv(region);
    for (let vertex = groupStart; vertex < groupStart + 4; vertex++) {
      const u = uv.getX(vertex);
      const v = uv.getY(vertex);
      uv.setXY(vertex, uMin + u * (uMax - uMin), vMax - v * (vMax - vMin));
    }
  }

  uv.needsUpdate = true;
  geometry.clearGroups();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  return mesh;
}

function createEar(head: THREE.Group, side: -1 | 1, skin: THREE.Material): THREE.Group {
  const ear = addGroup(head, [side * 3.5 * modelUnit, 4 * modelUnit, -2 * modelUnit]);
  ear.name = side < 0 ? 'raccoon-left-ear' : 'raccoon-right-ear';
  const cuboid = createCuboidMesh(
    [2 * modelUnit, 2 * modelUnit, 1 * modelUnit],
    'raccoon-ear-cuboid',
    skin,
    { front: 'ear', back: 'fur', right: 'fur', left: 'fur', top: 'fur', bottom: 'fur' },
  );
  cuboid.position.set(0, modelUnit, 0.5 * modelUnit);
  cuboid.castShadow = true;
  ear.add(cuboid);
  return ear;
}

function addGroundShadow(root: THREE.Group, materials: MiniDioramaSceneMaterials): void {
  const shadow = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.02, 1.5), materials.shadow);
  shadow.name = 'raccoon-ground-shadow';
  shadow.position.set(-0.02, 0.025, 0.23);
  root.add(shadow);
}
