import * as THREE from 'three';
import type { MiniDioramaSceneMaterials } from './mini-diorama-scene-materials';
import type { MiniDioramaRaccoonRig } from './mini-diorama-raccoon-controller';
import { addGroup } from './mini-diorama-scene-geometry';
import {
  raccoonTextureRegionUv,
  type MiniDioramaRaccoonTextureRegion,
} from './mini-diorama-raccoon-texture';

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
  root.rotation.y = Math.PI;
  root.scale.setScalar(1.05);
  addGroundShadow(root, materials);

  const body = addGroup(root, [0, 0.82, 0]);
  body.name = 'raccoon-body';
  const torso = createCuboidMesh([0.92, 1.25, 0.68], 'raccoon-torso', materials.raccoonSkin, {
    front: 'chest',
    back: 'fur',
    right: 'fur',
    left: 'fur',
    top: 'fur',
    bottom: 'fur',
  });
  torso.castShadow = true;
  torso.receiveShadow = true;
  body.add(torso);

  const legs: THREE.Group[] = [];
  let greetingArm: THREE.Group | undefined;
  for (const side of [-1, 1] as const) {
    const frontLeg = addFrontLeg(body, side, materials.raccoonSkin);
    legs.push(frontLeg);
    if (side === 1) greetingArm = frontLeg;
    legs.push(addHindLeg(body, side, materials.raccoonSkin));
  }

  const tail = addGroup(body, [0, -0.14, 0.3]);
  tail.name = 'raccoon-tail';
  tail.rotation.x = 0.3;
  const tailMesh = createCuboidMesh(
    [0.42, 0.42, 1.58],
    'raccoon-banded-tail',
    materials.raccoonSkin,
    { front: 'tail', back: 'tail', right: 'tail', left: 'tail', top: 'tail', bottom: 'tail' },
  );
  tailMesh.position.z = 0.79;
  tailMesh.castShadow = true;
  tailMesh.receiveShadow = true;
  tail.add(tailMesh);

  const head = addGroup(body, [0, 0.89, -0.15]);
  head.name = 'raccoon-head';
  head.rotation.z = -0.055;
  const headMesh = createCuboidMesh(
    [0.75, 0.58, 0.42],
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
  headMesh.castShadow = true;
  headMesh.receiveShadow = true;
  head.add(headMesh);

  const muzzle = addGroup(head, [0, -0.14, -0.3]);
  muzzle.name = 'raccoon-muzzle';
  const muzzleMesh = createCuboidMesh(
    [0.34, 0.25, 0.25],
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
  muzzleMesh.castShadow = true;
  muzzleMesh.receiveShadow = true;
  muzzle.add(muzzleMesh);

  const nose = createCuboidMesh([0.075, 0.055, 0.03], 'raccoon-nose-pixel', materials.raccoonSkin, {
    front: 'nose',
    back: 'nose',
    right: 'nose',
    left: 'nose',
    top: 'nose',
    bottom: 'nose',
  });
  nose.position.set(0, 0.04, -0.14);
  nose.castShadow = true;
  muzzle.add(nose);

  const eyeLids: THREE.Group[] = [];
  for (const side of [-1, 1] as const) {
    const eye = addGroup(head, [side * 0.17, 0.025, -0.205]);
    eye.name = side < 0 ? 'raccoon-left-eye' : 'raccoon-right-eye';
    const eyePixel = createCuboidMesh(
      [0.085, 0.075, 0.014],
      'raccoon-eye-pixel',
      materials.raccoonSkin,
      { front: 'eye', back: 'eye', right: 'eye', left: 'eye', top: 'eye', bottom: 'eye' },
    );
    eyePixel.castShadow = false;
    eye.add(eyePixel);
    eyeLids.push(eye);
  }

  const leftEar = createEar(head, -1, materials.raccoonSkin);
  const rightEar = createEar(head, 1, materials.raccoonSkin);
  if (!greetingArm) throw new Error('The Raccoon greeting leg was not built.');

  return { root, body, head, tail, leftEar, rightEar, greetingArm, eyeLids, legs };
}

function addFrontLeg(body: THREE.Group, side: -1 | 1, skin: THREE.Material): THREE.Group {
  const arm = addGroup(body, [side * 0.31, 0.38, -0.31]);
  arm.name = `raccoon-front-leg-${side < 0 ? 'left' : 'right'}`;
  arm.rotation.z = side < 0 ? 0.38 : -0.38;

  const forearm = createCuboidMesh([0.17, 0.58, 0.17], `${arm.name}-cuboid`, skin, {
    front: 'limb',
    back: 'limb',
    right: 'limb',
    left: 'limb',
    top: 'fur',
    bottom: 'paw',
  });
  forearm.position.set(0, -0.27, -0.02);
  forearm.castShadow = true;
  forearm.receiveShadow = true;
  arm.add(forearm);

  const paw = createCuboidMesh([0.21, 0.16, 0.22], `${arm.name}-paw`, skin, {
    front: 'paw',
    back: 'paw',
    right: 'paw',
    left: 'paw',
    top: 'paw',
    bottom: 'paw',
  });
  paw.position.set(-side * 0.02, -0.4, -0.06);
  paw.castShadow = true;
  paw.receiveShadow = true;
  arm.add(paw);
  return arm;
}

function addHindLeg(body: THREE.Group, side: -1 | 1, skin: THREE.Material): THREE.Group {
  const leg = addGroup(body, [side * 0.23, -0.28, 0.1]);
  leg.name = `raccoon-hind-leg-${side < 0 ? 'left' : 'right'}`;

  const shin = createCuboidMesh([0.17, 0.58, 0.17], `${leg.name}-cuboid`, skin, {
    front: 'limb',
    back: 'limb',
    right: 'limb',
    left: 'limb',
    top: 'fur',
    bottom: 'paw',
  });
  shin.position.y = -0.2;
  shin.castShadow = true;
  shin.receiveShadow = true;
  leg.add(shin);

  const paw = createCuboidMesh([0.22, 0.16, 0.28], `${leg.name}-paw`, skin, {
    front: 'paw',
    back: 'paw',
    right: 'paw',
    left: 'paw',
    top: 'paw',
    bottom: 'paw',
  });
  paw.position.set(0, -0.46, -0.055);
  paw.castShadow = true;
  paw.receiveShadow = true;
  leg.add(paw);
  return leg;
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
  const ear = addGroup(head, [side * 0.29, 0.29, -0.035]);
  ear.name = side < 0 ? 'raccoon-left-ear' : 'raccoon-right-ear';
  const cuboid = createCuboidMesh([0.17, 0.17, 0.09], `${ear.name}-cuboid`, skin, {
    front: 'ear',
    back: 'fur',
    right: 'fur',
    left: 'fur',
    top: 'fur',
    bottom: 'fur',
  });
  cuboid.position.set(0, 0.04, 0);
  cuboid.castShadow = true;
  ear.add(cuboid);
  return ear;
}

function addGroundShadow(root: THREE.Group, materials: MiniDioramaSceneMaterials): void {
  const shadow = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.02, 1.8), materials.shadow);
  shadow.name = 'raccoon-ground-shadow';
  shadow.position.set(0, 0.025, 0.18);
  root.add(shadow);
}
