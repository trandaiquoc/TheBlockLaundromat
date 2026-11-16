import * as THREE from 'three';
import type { MiniDioramaSceneMaterials } from './mini-diorama-scene-materials';
import type { MiniDioramaRaccoonRig } from './mini-diorama-raccoon-controller';
import { addCapsule, addCurve, addGroup, addSphere } from './mini-diorama-scene-geometry';

const headRadii = { x: 0.742, y: 0.634, z: 0.562 };
const bodyRadii = { x: 0.575, y: 0.475, z: 0.43 };

export function buildMiniDioramaRaccoon(
  parent: THREE.Group,
  materials: MiniDioramaSceneMaterials,
): MiniDioramaRaccoonRig & { readonly root: THREE.Group } {
  const root = addGroup(parent, [-1.28, 0, 0.72]);
  root.scale.setScalar(1.1);
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.74, 48), materials.shadow);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(-0.04, 0.025, 0);
  shadow.scale.set(1.2, 0.72, 1);
  root.add(shadow);

  const body = addGroup(root, [0, 0.68, 0]);
  const torso = addSphere(body, 0.5, materials.raccoonFur, [0, 0, 0], [1.15, 0.95, 0.86]);
  torso.name = 'raccoon-body-shell';
  torso.castShadow = true;
  const belly = createRoundedPatch();
  createEllipsoidPatch(body, belly, materials.raccoonCream, bodyRadii, 0.006);

  let greetingArm: THREE.Group | undefined;
  for (const side of [-1, 1] as const) {
    const foot = addSphere(
      body,
      0.16,
      materials.raccoonPatch,
      [side * 0.28, -0.38, 0.14],
      [1.15, 0.7, 1.45],
    );
    foot.rotation.y = side * -0.12;

    const arm = addGroup(body, [side * 0.43, 0.13, 0.2]);
    const sleeve = addCapsule(arm, 0.105, 0.22, materials.raccoonFur, [side * -0.045, -0.15, 0.1]);
    sleeve.rotation.z = side * 0.24;
    addSphere(arm, 0.105, materials.raccoonPatch, [side * -0.05, -0.3, 0.19], [1.04, 0.8, 0.92]);
    if (side === 1) greetingArm = arm;
    else arm.name = 'raccoon-left-arm';
  }

  const tail = addGroup(root, [0, 0.64, -0.04]);
  tail.scale.setScalar(0.88);
  const tailMesh = new THREE.Mesh(createStripedTailGeometry(), materials.raccoonTail);
  tailMesh.name = 'raccoon-soft-striped-tail';
  tailMesh.castShadow = true;
  tailMesh.receiveShadow = true;
  tail.add(tailMesh);

  const head = addGroup(root, [0, 1.34, 0.04]);
  const headShell = addSphere(head, 0.72, materials.raccoonHeadFur, [0, 0, 0], [1.03, 0.88, 0.78]);
  headShell.name = 'raccoon-head-shell';
  headShell.castShadow = true;

  const leftEar = addGroup(head, [-0.43, 0.49, -0.005]);
  const rightEar = addGroup(head, [0.43, 0.49, -0.005]);
  for (const [ear, side] of [
    [leftEar, -1],
    [rightEar, 1],
  ] as const) {
    const outer = addSphere(ear, 0.14, materials.raccoonFur, [0, 0.015, 0], [0.98, 1.1, 0.72]);
    outer.rotation.z = side * -0.12;
    addSphere(ear, 0.078, materials.raccoonPatch, [0, 0.015, 0.07], [0.88, 1.02, 0.3]);
  }

  createEllipsoidPatch(head, createFaceMask(), materials.raccoonFaceMarking, headRadii, 0.02);
  for (const side of [-1, 1] as const) {
    createEllipsoidPatch(head, createEyePatch(side), materials.raccoonEyeMask, headRadii, 0.035);
  }

  const eyeLids: THREE.Group[] = [];
  for (const x of [-0.235, 0.235]) {
    const eye = addGroup(head, [x, 0.072, ellipsoidSurfaceZ(x, 0.072, headRadii) + 0.024]);
    eye.renderOrder = 3;
    const gaze = x < 0 ? 0.012 : -0.012;
    addSphere(eye, 0.096, materials.raccoonEye, [gaze, 0.006, 0], [0.92, 1, 0.14]);
    addSphere(eye, 0.012, materials.raccoonEyeDetail, [-0.024 + gaze, 0.031, 0.023], [1, 1, 0.65]);
    eyeLids.push(eye);
  }

  const nosePosition: readonly [number, number, number] = [
    0,
    -0.145,
    ellipsoidSurfaceZ(0, -0.145, headRadii) + 0.01,
  ];
  addSphere(head, 0.045, materials.raccoonNose, nosePosition, [1.08, 0.74, 0.35]);
  addCurve(
    head,
    [
      [0, -0.185, ellipsoidSurfaceZ(0, -0.185, headRadii) + 0.018],
      [0, -0.235, ellipsoidSurfaceZ(0, -0.235, headRadii) + 0.017],
      [-0.065, -0.26, ellipsoidSurfaceZ(-0.065, -0.26, headRadii) + 0.015],
    ],
    materials.ink,
    0.009,
  );
  addCurve(
    head,
    [
      [0, -0.235, ellipsoidSurfaceZ(0, -0.235, headRadii) + 0.017],
      [0.065, -0.26, ellipsoidSurfaceZ(0.065, -0.26, headRadii) + 0.015],
    ],
    materials.ink,
    0.009,
  );

  if (!greetingArm) throw new Error('The Raccoon greeting arm was not built.');
  return { root, body, head, tail, leftEar, rightEar, greetingArm, eyeLids };
}

function createRoundedPatch(): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(-0.28, 0.2);
  shape.quadraticCurveTo(0, 0.32, 0.28, 0.2);
  shape.quadraticCurveTo(0.32, -0.02, 0.24, -0.22);
  shape.quadraticCurveTo(0, -0.38, -0.24, -0.22);
  shape.quadraticCurveTo(-0.32, -0.02, -0.28, 0.2);
  return shape;
}

function createFaceMask(): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(-0.45, 0.08);
  shape.quadraticCurveTo(-0.44, 0.32, -0.22, 0.31);
  shape.quadraticCurveTo(-0.09, 0.31, 0, 0.21);
  shape.quadraticCurveTo(0.09, 0.31, 0.22, 0.31);
  shape.quadraticCurveTo(0.44, 0.32, 0.45, 0.08);
  shape.quadraticCurveTo(0.44, -0.13, 0.25, -0.28);
  shape.quadraticCurveTo(0.1, -0.39, 0, -0.34);
  shape.quadraticCurveTo(-0.1, -0.39, -0.25, -0.28);
  shape.quadraticCurveTo(-0.44, -0.13, -0.45, 0.08);
  return shape;
}

function createEyePatch(side: -1 | 1): THREE.Shape {
  const x = (value: number) => side * value;
  const shape = new THREE.Shape();
  shape.moveTo(x(0.075), 0.235);
  shape.quadraticCurveTo(x(0.31), 0.365, x(0.425), 0.18);
  shape.quadraticCurveTo(x(0.49), -0.005, x(0.34), -0.16);
  shape.quadraticCurveTo(x(0.19), -0.255, x(0.085), -0.095);
  shape.quadraticCurveTo(x(0.015), 0.065, x(0.075), 0.235);
  return shape;
}

function createEllipsoidPatch(
  parent: THREE.Object3D,
  shape: THREE.Shape,
  material: THREE.Material,
  radii: Readonly<{ x: number; y: number; z: number }>,
  offset: number,
): THREE.Mesh {
  const geometry = new THREE.ShapeGeometry(shape, 16);
  const positions = geometry.getAttribute('position');
  for (let index = 0; index < positions.count; index++) {
    const x = positions.getX(index);
    const y = positions.getY(index);
    positions.setZ(index, ellipsoidSurfaceZ(x, y, radii) + offset);
  }
  positions.needsUpdate = true;
  geometry.computeVertexNormals();

  const patch = new THREE.Mesh(geometry, material);
  patch.renderOrder = 2;
  patch.castShadow = false;
  patch.receiveShadow = true;
  parent.add(patch);
  return patch;
}

function ellipsoidSurfaceZ(
  x: number,
  y: number,
  radii: Readonly<{ x: number; y: number; z: number }>,
): number {
  const surface = 1 - (x / radii.x) ** 2 - (y / radii.y) ** 2;
  return radii.z * Math.sqrt(Math.max(surface, 0.015));
}

function createStripedTailGeometry(): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.3, -0.03, 0),
    new THREE.Vector3(0.57, -0.09, 0.015),
    new THREE.Vector3(0.9, -0.02, 0.025),
    new THREE.Vector3(1.08, 0.18, 0.035),
    new THREE.Vector3(1.04, 0.42, 0.045),
    new THREE.Vector3(0.82, 0.53, 0.05),
  ]);
  const tubeSegments = 64;
  const radialSegments = 20;
  const vertices: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const referenceAxis = new THREE.Vector3(0, 0, 1);

  for (let ring = 0; ring <= tubeSegments; ring++) {
    const progress = ring / tubeSegments;
    const center = curve.getPointAt(progress);
    const tangent = curve.getTangentAt(progress).normalize();
    const axis =
      Math.abs(tangent.dot(referenceAxis)) > 0.92 ? new THREE.Vector3(0, 1, 0) : referenceAxis;
    const normal = tangent.clone().cross(axis).normalize();
    const binormal = tangent.clone().cross(normal).normalize();
    const fullness = Math.pow(Math.sin(Math.PI * progress), 0.58);
    const radius = 0.095 + fullness * 0.205;
    const stripe = stripeWeight(progress);

    for (let segment = 0; segment <= radialSegments; segment++) {
      const angle = (segment / radialSegments) * Math.PI * 2;
      const offset = normal
        .clone()
        .multiplyScalar(Math.cos(angle) * radius * 1.08)
        .add(binormal.clone().multiplyScalar(Math.sin(angle) * radius * 0.82));
      vertices.push(center.x + offset.x, center.y + offset.y, center.z + offset.z);
      const brightness = 1 - stripe * 0.42;
      colors.push(brightness, brightness * 0.96, brightness * 0.9);
    }
  }

  for (let ring = 0; ring < tubeSegments; ring++) {
    for (let segment = 0; segment < radialSegments; segment++) {
      const current = ring * (radialSegments + 1) + segment;
      const next = current + radialSegments + 1;
      indices.push(current, current + 1, next, current + 1, next + 1, next);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function stripeWeight(progress: number): number {
  const stripeRanges: readonly (readonly [number, number])[] = [
    [0.25, 0.36],
    [0.54, 0.66],
    [0.8, 0.9],
  ];
  return Math.max(...stripeRanges.map(([start, end]) => smoothRange(progress, start, end)));
}

function smoothRange(value: number, start: number, end: number): number {
  const softness = 0.025;
  const enter = smoothStep(start - softness, start + softness, value);
  const leave = 1 - smoothStep(end - softness, end + softness, value);
  return enter * leave;
}

function smoothStep(start: number, end: number, value: number): number {
  const amount = THREE.MathUtils.clamp((value - start) / (end - start), 0, 1);
  return amount * amount * (3 - 2 * amount);
}
