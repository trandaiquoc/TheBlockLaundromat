import * as THREE from 'three';
import type { MiniDioramaSceneMaterials } from './mini-diorama-scene-materials';
import {
  addCylinder,
  addGroup,
  addMesh,
  addRoundedBox,
  addSphere,
} from './mini-diorama-scene-geometry';

export function buildMiniDioramaRoom(
  parent: THREE.Group,
  materials: MiniDioramaSceneMaterials,
): void {
  addRoundedBox(parent, 8.4, 0.22, 6.8, materials.floor, [0, -0.12, 0], 0.09);
  const grout = addRoundedBox(parent, 8.2, 0.018, 6.6, materials.grout, [0, 0.006, 0], 0.005);
  grout.receiveShadow = false;

  const tileLine = new THREE.BoxGeometry(0.018, 0.012, 6.45);
  for (let x = -3.5; x <= 3.51; x += 1) {
    addMesh(parent, tileLine, materials.floor, [x, 0.018, 0], [0, 0, 0], false, false);
  }
  const crossLine = new THREE.BoxGeometry(8.05, 0.012, 0.018);
  for (let z = -2.5; z <= 2.51; z += 1) {
    addMesh(parent, crossLine, materials.floor, [0, 0.018, z], [0, 0, 0], false, false);
  }

  addRoundedBox(parent, 8.3, 5.15, 0.22, materials.wall, [0, 2.55, -3.25], 0.06);
  addRoundedBox(parent, 8.28, 1.12, 0.13, materials.teal, [0, 0.69, -3.105], 0.035);
  addRoundedBox(parent, 8.25, 0.1, 0.18, materials.wallLight, [0, 1.32, -3.08], 0.025);
  addRoundedBox(parent, 8.26, 0.11, 0.2, materials.darkTeal, [0, 0.05, -3.06], 0.02);
  addRoundedBox(parent, 0.2, 4.95, 6.25, materials.wallLight, [-4.06, 2.4, -0.05], 0.045);

  for (let x = -3.65; x <= 3.66; x += 0.72) {
    addRoundedBox(parent, 0.018, 1.02, 0.035, materials.darkTeal, [x, 0.7, -3.01], 0.009);
  }
  addWindow(parent, materials, [2.5, 3.9, -3.02]);
  addPendant(parent, materials, [-2.4, 5.05, -1.1], 0xffdc9a);
  addPendant(parent, materials, [2.1, 5.05, -1.15], 0xffe4ae);
}

function addWindow(
  parent: THREE.Group,
  materials: MiniDioramaSceneMaterials,
  position: readonly [number, number, number],
): void {
  const frame = addGroup(parent, position);
  addRoundedBox(frame, 1.55, 1.45, 0.12, materials.darkTeal, [0, 0, 0], 0.1);
  addRoundedBox(frame, 1.32, 1.2, 0.05, materials.paperBlue, [0, 0.05, 0.07], 0.06);
  addRoundedBox(frame, 0.065, 1.24, 0.08, materials.wallLight, [0, 0.04, 0.12], 0.018);
  addRoundedBox(frame, 1.34, 0.06, 0.08, materials.wallLight, [0, -0.2, 0.12], 0.018);
  const sill = addRoundedBox(frame, 1.8, 0.14, 0.3, materials.wallLight, [0, -0.73, 0.13], 0.035);
  sill.castShadow = true;

  const sun = new THREE.Mesh(new THREE.CircleGeometry(0.23, 32), materials.butter);
  sun.position.set(0.38, 0.36, 0.115);
  frame.add(sun);
  for (let index = 0; index < 4; index++) {
    addRoundedBox(
      frame,
      0.1,
      0.22,
      0.045,
      materials.mint,
      [-0.42 + index * 0.28, -0.44, 0.15],
      0.045,
    );
  }
}

function addPendant(
  parent: THREE.Group,
  materials: MiniDioramaSceneMaterials,
  position: readonly [number, number, number],
  color: number,
): void {
  const lamp = addGroup(parent, position);
  addCylinder(lamp, 0.018, 0.018, 0.66, materials.metal, [0, 0.18, 0]);
  addRoundedBox(lamp, 0.64, 0.16, 0.48, materials.coral, [0, -0.18, 0], 0.075);
  addSphere(lamp, 0.19, materials.butter, [0, -0.36, 0], [1, 0.48, 1]);
  const bulb = new THREE.PointLight(color, 7, 5.5, 2);
  bulb.position.set(0, -0.35, 0.02);
  lamp.add(bulb);
}

export function buildMiniDioramaRoomAccents(
  parent: THREE.Group,
  materials: MiniDioramaSceneMaterials,
): void {
  const basket = addGroup(parent, [2.75, 0.02, 1.0]);
  const basketBody = addRoundedBox(basket, 0.92, 0.58, 0.74, materials.coral, [0, 0.29, 0], 0.13);
  basketBody.castShadow = true;
  addRoundedBox(basket, 0.78, 0.48, 0.62, materials.darkTeal, [0, 0.33, 0.055], 0.1);
  for (let x = -0.3; x <= 0.31; x += 0.2) {
    addRoundedBox(basket, 0.045, 0.38, 0.026, materials.coral, [x, 0.32, 0.38], 0.018);
  }
  addLaundry(basket, materials, [-0.2, 0.63, 0.02], materials.paperBlue);
  addLaundry(basket, materials, [0.04, 0.65, -0.02], materials.paper);
  addLaundry(basket, materials, [0.23, 0.61, 0.06], materials.peach);

  const plant = addGroup(parent, [-3.25, 0.02, -0.55]);
  addRoundedBox(plant, 0.7, 0.62, 0.7, materials.coral, [0, 0.31, 0], 0.09);
  addRoundedBox(plant, 0.76, 0.11, 0.76, materials.peach, [0, 0.63, 0], 0.04);
  for (let index = 0; index < 5; index++) {
    const angle = (index / 5) * Math.PI * 2;
    const leaf = addSphere(
      plant,
      0.25,
      index % 2 === 0 ? materials.mint : materials.teal,
      [Math.cos(angle) * 0.2, 1.03 + (index % 2) * 0.16, Math.sin(angle) * 0.18],
      [0.52, 1.28, 0.38],
    );
    leaf.rotation.z = Math.cos(angle) * 0.42;
    leaf.rotation.x = Math.sin(angle) * 0.35;
  }

  addRoundedBox(parent, 0.82, 0.58, 0.08, materials.paper, [-2.68, 2.35, -3.085], 0.045);
  addRoundedBox(parent, 0.62, 0.08, 0.025, materials.coral, [-2.68, 2.52, -3.02], 0.02);
  addRoundedBox(parent, 0.08, 0.22, 0.025, materials.teal, [-2.88, 2.32, -3.02], 0.02);
  addRoundedBox(parent, 0.08, 0.3, 0.025, materials.mint, [-2.67, 2.28, -3.02], 0.02);
  addRoundedBox(parent, 0.08, 0.16, 0.025, materials.butter, [-2.46, 2.35, -3.02], 0.02);

  addRoundedBox(parent, 0.76, 0.08, 0.24, materials.wallLight, [-3.2, 1.58, -2.88], 0.04);
  addRoundedBox(parent, 0.76, 0.08, 0.24, materials.wallLight, [3.22, 1.58, -2.88], 0.04);
  for (const x of [-3.42, -3.18, -2.94, 3.0, 3.24, 3.48]) {
    const bottle = addRoundedBox(
      parent,
      0.16,
      0.38,
      0.15,
      x < 0 ? materials.paperBlue : materials.mint,
      [x, 1.81, -2.9],
      0.05,
    );
    addRoundedBox(parent, 0.08, 0.12, 0.085, materials.wallLight, [x, 2.06, -2.9], 0.03);
  }
}

function addLaundry(
  parent: THREE.Group,
  materials: MiniDioramaSceneMaterials,
  position: readonly [number, number, number],
  color: THREE.Material,
): void {
  const cloth = addRoundedBox(parent, 0.3, 0.18, 0.34, color, position, 0.09);
  cloth.rotation.y = position[0] * 0.4;
  addRoundedBox(
    parent,
    0.22,
    0.05,
    0.37,
    materials.wallLight,
    [position[0], position[1] + 0.1, position[2]],
    0.025,
  );
}
