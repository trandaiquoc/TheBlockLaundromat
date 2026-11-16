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
  buildPlankFloor(parent, materials);
  addRoundedBox(parent, 8.3, 5.15, 0.22, materials.wall, [0, 2.55, -3.25], 0.06);
  addRoundedBox(parent, 0.2, 4.95, 6.25, materials.wall, [-4.06, 2.4, -0.05], 0.045);
  buildWoodWainscot(parent, materials);
  buildWindow(parent, materials, [2.52, 3.3, -3.02]);
  buildPendant(parent, materials, [-2.4, 4.0, -1.1]);
  buildPendant(parent, materials, [2.1, 4.0, -1.15]);
}

function buildPlankFloor(parent: THREE.Group, materials: MiniDioramaSceneMaterials): void {
  addRoundedBox(parent, 8.4, 0.14, 6.8, materials.floorSeam, [0, -0.12, 0], 0.035);
  const boardDepth = 0.66;
  for (let row = 0; row < 10; row++) {
    const z = -3.0 + row * boardDepth;
    const jointX = row % 2 === 0 ? -0.72 : 0.64;
    const leftWidth = jointX + 4.08;
    const rightWidth = 4.08 - jointX;
    const material = row % 3 === 0 ? materials.floorboardAlt : materials.floorboard;
    addRoundedBox(
      parent,
      leftWidth - 0.025,
      0.075,
      boardDepth - 0.025,
      material,
      [(jointX - 4.08) / 2, -0.025, z],
      0.025,
    );
    addRoundedBox(
      parent,
      rightWidth - 0.025,
      0.075,
      boardDepth - 0.025,
      row % 3 === 1 ? materials.floorboardAlt : materials.floorboard,
      [(jointX + 4.08) / 2, -0.025, z],
      0.025,
    );
  }
}

function buildWoodWainscot(parent: THREE.Group, materials: MiniDioramaSceneMaterials): void {
  addRoundedBox(parent, 8.28, 1.43, 0.17, materials.oakDark, [0, 0.78, -3.09], 0.035);
  for (let index = 0; index < 9; index++) {
    const x = -3.56 + index * 0.89;
    const panel = addRoundedBox(
      parent,
      0.79,
      1.08,
      0.055,
      index % 3 === 0 ? materials.oakLight : materials.oak,
      [x, 0.78, -2.98],
      0.03,
    );
    panel.receiveShadow = true;
  }
  for (let index = 0; index < 10; index++) {
    addRoundedBox(
      parent,
      0.05,
      1.25,
      0.09,
      materials.oakDark,
      [-4.0 + index * 0.89, 0.78, -2.92],
      0.02,
    );
  }
  addRoundedBox(parent, 8.3, 0.15, 0.22, materials.oakLight, [0, 1.51, -3.02], 0.035);
  addRoundedBox(parent, 8.3, 0.12, 0.2, materials.oakDark, [0, 0.12, -3.03], 0.025);
  addRoundedBox(parent, 0.18, 4.15, 0.2, materials.oakDark, [-3.98, 2.08, -3.04], 0.035);
  addRoundedBox(parent, 0.18, 4.15, 0.2, materials.oakDark, [3.98, 2.08, -3.04], 0.035);
  addRoundedBox(parent, 8.12, 0.16, 0.22, materials.oakDark, [0, 4.24, -3.03], 0.035);
}

function buildWindow(
  parent: THREE.Group,
  materials: MiniDioramaSceneMaterials,
  position: readonly [number, number, number],
): void {
  const window = addGroup(parent, position);
  addRoundedBox(window, 1.58, 1.5, 0.15, materials.oakDark, [0, 0, 0], 0.08);
  addRoundedBox(window, 1.28, 1.2, 0.045, materials.linenBlue, [0, 0.04, 0.09], 0.03);
  addRoundedBox(window, 0.06, 1.22, 0.065, materials.oakLight, [0, 0.04, 0.13], 0.015);
  addRoundedBox(window, 1.3, 0.06, 0.065, materials.oakLight, [0, -0.18, 0.13], 0.015);
  addRoundedBox(window, 1.84, 0.16, 0.3, materials.oakLight, [0, -0.75, 0.14], 0.035);
  addRoundedBox(window, 0.24, 1.25, 0.07, materials.linen, [-0.71, -0.02, 0.13], 0.055);
  addRoundedBox(window, 0.24, 1.25, 0.07, materials.linen, [0.71, -0.02, 0.13], 0.055);

  const morningLight = new THREE.Mesh(new THREE.CircleGeometry(0.2, 32), materials.wallTrim);
  morningLight.position.set(0.37, 0.36, 0.12);
  window.add(morningLight);
}

function buildPendant(
  parent: THREE.Group,
  materials: MiniDioramaSceneMaterials,
  position: readonly [number, number, number],
): void {
  const lamp = addGroup(parent, position);
  addCylinder(lamp, 0.018, 0.018, 0.66, materials.brass, [0, 0.18, 0]);
  addCylinder(lamp, 0.2, 0.35, 0.22, materials.sage, [0, -0.16, 0]);
  const shadeRim = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.018, 10, 48), materials.brass);
  shadeRim.rotation.x = Math.PI / 2;
  shadeRim.position.y = -0.27;
  lamp.add(shadeRim);
  addSphere(lamp, 0.16, materials.wallTrim, [0, -0.37, 0], [1, 0.52, 1]);
  const bulb = new THREE.PointLight(0xffd9a3, 3.2, 4.5, 2);
  bulb.position.set(0, -0.37, 0.02);
  lamp.add(bulb);
}

export function buildMiniDioramaRoomAccents(
  parent: THREE.Group,
  materials: MiniDioramaSceneMaterials,
): void {
  buildWickerBasket(parent, materials);
  buildPlant(parent, materials);
  buildLaundryNotice(parent, materials);
  buildSupplyShelves(parent, materials);
}

function buildWickerBasket(parent: THREE.Group, materials: MiniDioramaSceneMaterials): void {
  const basket = addGroup(parent, [2.75, 0.02, 0.45]);
  addRoundedBox(basket, 0.9, 0.08, 0.72, materials.oakDark, [0, 0.08, 0], 0.035);
  for (let x = -0.37; x <= 0.371; x += 0.12) {
    addRoundedBox(basket, 0.045, 0.51, 0.045, materials.oakLight, [x, 0.34, 0.33], 0.018);
    addRoundedBox(basket, 0.045, 0.51, 0.045, materials.oakLight, [x, 0.34, -0.33], 0.018);
  }
  for (const y of [0.18, 0.33, 0.48]) {
    addRoundedBox(basket, 0.88, 0.045, 0.045, materials.oak, [0, y, 0.36], 0.018);
    addRoundedBox(basket, 0.88, 0.045, 0.045, materials.oak, [0, y, -0.36], 0.018);
  }
  addLaundry(basket, materials, [-0.2, 0.63, 0.02], materials.linenBlue);
  addLaundry(basket, materials, [0.04, 0.65, -0.02], materials.linen);
  addLaundry(basket, materials, [0.23, 0.61, 0.06], materials.linenRose);
}

function buildPlant(parent: THREE.Group, materials: MiniDioramaSceneMaterials): void {
  const plant = addGroup(parent, [-3.5, 0.02, -0.65]);
  addCylinder(plant, 0.25, 0.36, 0.55, materials.terracotta, [0, 0.28, 0]);
  addCylinder(plant, 0.38, 0.38, 0.08, materials.terracotta, [0, 0.57, 0]);
  for (let index = 0; index < 5; index++) {
    const angle = (index / 5) * Math.PI * 2;
    const leaf = addSphere(
      plant,
      0.25,
      materials.sage,
      [Math.cos(angle) * 0.2, 1.03 + (index % 2) * 0.16, Math.sin(angle) * 0.18],
      [0.42, 1.24, 0.34],
    );
    leaf.rotation.z = Math.cos(angle) * 0.42;
    leaf.rotation.x = Math.sin(angle) * 0.35;
  }
}

function buildLaundryNotice(parent: THREE.Group, materials: MiniDioramaSceneMaterials): void {
  addRoundedBox(parent, 0.88, 0.64, 0.1, materials.oakDark, [-2.68, 2.35, -3.085], 0.045);
  addRoundedBox(parent, 0.74, 0.5, 0.025, materials.linen, [-2.68, 2.35, -3.02], 0.025);
  addRoundedBox(parent, 0.56, 0.055, 0.03, materials.terracotta, [-2.68, 2.5, -2.99], 0.018);
  addRoundedBox(parent, 0.08, 0.18, 0.025, materials.sage, [-2.86, 2.31, -2.99], 0.018);
  addRoundedBox(parent, 0.08, 0.26, 0.025, materials.oakLight, [-2.68, 2.27, -2.99], 0.018);
  addRoundedBox(parent, 0.08, 0.14, 0.025, materials.sage, [-2.5, 2.33, -2.99], 0.018);
}

function buildSupplyShelves(parent: THREE.Group, materials: MiniDioramaSceneMaterials): void {
  for (const x of [-3.2, 3.2]) {
    addRoundedBox(parent, 0.94, 0.09, 0.28, materials.oakLight, [x, 1.78, -2.9], 0.025);
    addRoundedBox(parent, 0.94, 0.08, 0.28, materials.oak, [x, 2.54, -2.9], 0.025);
  }
  for (const [x, color] of [
    [-3.47, materials.linenBlue],
    [-3.2, materials.sage],
    [-2.93, materials.linenRose],
    [2.93, materials.sage],
    [3.2, materials.linenBlue],
    [3.47, materials.terracotta],
  ] as const) {
    addRoundedBox(parent, 0.16, 0.32, 0.16, color, [x, 1.99, -2.9], 0.045);
    addRoundedBox(parent, 0.08, 0.1, 0.08, materials.wallTrim, [x, 2.2, -2.9], 0.025);
  }
  for (const [x, color] of [
    [-3.34, materials.linen],
    [-3.08, materials.linenBlue],
    [3.08, materials.linenRose],
    [3.34, materials.linen],
  ] as const) {
    addRoundedBox(parent, 0.22, 0.16, 0.18, color, [x, 2.68, -2.9], 0.045);
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
    materials.wallTrim,
    [position[0], position[1] + 0.1, position[2]],
    0.025,
  );
}
