import * as THREE from 'three';
import type { MiniDioramaSceneMaterials } from './mini-diorama-scene-materials';
import type { MiniDioramaRaccoonRig } from './mini-diorama-raccoon-controller';
import { addCapsule, addCurve, addGroup, addSphere } from './mini-diorama-scene-geometry';

export function buildMiniDioramaRaccoon(
  parent: THREE.Group,
  materials: MiniDioramaSceneMaterials,
): {
  root: THREE.Group;
  body: THREE.Group;
  head: THREE.Group;
  tail: THREE.Group;
  leftEar: THREE.Group;
  rightEar: THREE.Group;
  greetingArm: THREE.Group;
  eyeLids: THREE.Object3D[];
} {
  const root = addGroup(parent, [-1.28, 0, 0.72]);
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.83, 48), materials.shadow);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, 0.03, 0);
  shadow.scale.set(1.15, 0.75, 1);
  root.add(shadow);

  const body = addGroup(root, [0, 0.84, 0]);
  const torso = addSphere(body, 0.56, materials.fur, [0, 0, 0], [0.9, 1.18, 0.76]);
  torso.castShadow = true;
  addSphere(body, 0.4, materials.muzzle, [0, 0.02, 0.32], [0.9, 1.02, 0.38]);
  addSphere(body, 0.19, materials.coral, [0, 0.39, 0.42], [1.15, 0.36, 0.2]);

  const leftLeg = addCapsule(body, 0.13, 0.3, materials.fur, [-0.27, -0.57, 0.02]);
  leftLeg.rotation.z = 0.08;
  const rightLeg = addCapsule(body, 0.13, 0.3, materials.fur, [0.27, -0.57, 0.02]);
  rightLeg.rotation.z = -0.08;
  addSphere(body, 0.18, materials.mask, [-0.27, -0.76, 0.18], [1.12, 0.62, 1.24]);
  addSphere(body, 0.18, materials.mask, [0.27, -0.76, 0.18], [1.12, 0.62, 1.24]);

  const leftArm = addGroup(body, [-0.45, 0.24, 0.02]);
  const greetingArm = addGroup(body, [0.45, 0.24, 0.02]);
  const leftSleeve = addCapsule(leftArm, 0.105, 0.45, materials.fur, [0, -0.19, 0]);
  leftSleeve.rotation.z = 0.42;
  const rightSleeve = addCapsule(greetingArm, 0.105, 0.45, materials.fur, [0, -0.19, 0]);
  rightSleeve.rotation.z = -0.42;
  addSphere(leftArm, 0.12, materials.muzzle, [-0.1, -0.42, 0.04], [1, 0.8, 0.75]);
  addSphere(greetingArm, 0.12, materials.muzzle, [0.1, -0.42, 0.04], [1, 0.8, 0.75]);

  const tail = addGroup(root, [-0.36, 0.43, -0.18]);
  const tailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.12, -0.12, 0),
    new THREE.Vector3(-0.22, -0.16, -0.04),
    new THREE.Vector3(-0.55, -0.03, -0.02),
    new THREE.Vector3(-0.8, 0.24, 0.04),
    new THREE.Vector3(-0.88, 0.54, 0.08),
    new THREE.Vector3(-0.72, 0.78, 0.1),
  ]);
  const tailMesh = new THREE.Mesh(
    new THREE.TubeGeometry(tailCurve, 48, 0.23, 16, false),
    materials.furLight,
  );
  tailMesh.castShadow = true;
  tailMesh.receiveShadow = true;
  tail.add(tailMesh);
  for (const t of [0.2, 0.38, 0.56, 0.74, 0.91]) {
    const point = tailCurve.getPointAt(t);
    const tangent = tailCurve.getTangentAt(t).normalize();
    const stripe = new THREE.Mesh(new THREE.TorusGeometry(0.225, 0.047, 12, 32), materials.mask);
    stripe.position.copy(point);
    stripe.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
    tail.add(stripe);
  }
  addSphere(tail, 0.16, materials.mask, [-0.72, 0.78, 0.1], [1, 0.9, 1]);

  const head = addGroup(root, [0, 1.82, 0.04]);
  const headShell = addSphere(head, 0.58, materials.furLight, [0, 0, 0], [1, 0.89, 0.78]);
  headShell.castShadow = true;

  const leftEar = addGroup(head, [-0.42, 0.34, -0.01]);
  const rightEar = addGroup(head, [0.42, 0.34, -0.01]);
  for (const [ear, direction] of [
    [leftEar, -1],
    [rightEar, 1],
  ] as const) {
    const outer = addSphere(
      ear,
      0.22,
      materials.mask,
      [direction * 0.035, 0.02, 0],
      [0.94, 1.12, 0.66],
    );
    outer.rotation.z = direction * -0.18;
    const inner = addSphere(
      ear,
      0.13,
      materials.coral,
      [direction * 0.035, 0.01, 0.095],
      [0.82, 1.08, 0.48],
    );
    inner.rotation.z = direction * -0.18;
  }

  for (const x of [-0.22, 0.22]) {
    const patch = addSphere(head, 0.26, materials.mask, [x, 0.02, 0.34], [1.17, 0.83, 0.46]);
    patch.rotation.z = -Math.sign(x) * 0.15;
  }

  const eyeLids: THREE.Object3D[] = [];
  for (const x of [-0.21, 0.21]) {
    const eyelid = addGroup(head, [x, 0.045, 0.435]);
    addSphere(eyelid, 0.105, materials.eye, [0, 0, 0], [1, 1, 0.6]);
    addSphere(eyelid, 0.066, materials.iris, [0.018, -0.005, 0.045], [1, 1, 0.7]);
    addSphere(eyelid, 0.035, materials.mask, [0.023, -0.005, 0.07], [1, 1, 0.7]);
    addSphere(eyelid, 0.022, materials.highlight, [0.038, 0.035, 0.088], [1, 1, 0.65]);
    eyeLids.push(eyelid);
  }

  for (const x of [-0.13, 0.13]) {
    addSphere(head, 0.18, materials.muzzle, [x, -0.18, 0.4], [1.03, 0.72, 0.66]);
  }
  const noseShape = new THREE.Shape();
  noseShape.moveTo(-0.11, 0.045);
  noseShape.quadraticCurveTo(0, 0.12, 0.11, 0.045);
  noseShape.lineTo(0, -0.11);
  noseShape.quadraticCurveTo(-0.06, -0.13, -0.11, 0.045);
  const nose = new THREE.Mesh(new THREE.ShapeGeometry(noseShape), materials.nose);
  nose.position.set(0, -0.19, 0.56);
  head.add(nose);
  addCurve(
    head,
    [
      [0, -0.29, 0.57],
      [0, -0.37, 0.57],
      [-0.1, -0.4, 0.54],
    ],
    materials.mask,
    0.018,
  );
  addCurve(
    head,
    [
      [0, -0.37, 0.57],
      [0.1, -0.4, 0.54],
    ],
    materials.mask,
    0.018,
  );
  addCurve(
    head,
    [
      [-0.33, 0.2, 0.39],
      [-0.22, 0.24, 0.4],
      [-0.1, 0.21, 0.4],
    ],
    materials.mask,
    0.022,
  );
  addCurve(
    head,
    [
      [0.1, 0.21, 0.4],
      [0.22, 0.24, 0.4],
      [0.33, 0.2, 0.39],
    ],
    materials.mask,
    0.022,
  );

  for (const x of [-0.16, 0, 0.16]) {
    const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.105, 0.24, 6), materials.fur);
    tuft.position.set(x, 0.47 + (x === 0 ? 0.04 : 0), 0.02);
    tuft.rotation.z = -x * 1.2;
    head.add(tuft);
  }

  return { root, body, head, tail, leftEar, rightEar, greetingArm, eyeLids };
}
