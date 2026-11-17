import * as THREE from 'three';
import type { MiniDioramaSceneMaterials } from './mini-diorama-scene-materials';
import { addCuboid, addGroup } from './mini-diorama-scene-geometry';

export interface MiniDioramaRoomThemeTargets {
  readonly pendantLights: readonly THREE.PointLight[];
  readonly window: {
    readonly sky: THREE.MeshBasicMaterial;
    readonly horizon: THREE.MeshBasicMaterial;
    readonly sun: THREE.MeshBasicMaterial;
    readonly duskSun: THREE.MeshBasicMaterial;
    readonly moon: THREE.MeshBasicMaterial;
    readonly clouds: THREE.MeshBasicMaterial;
    readonly nightAccent: THREE.MeshBasicMaterial;
    readonly stars: THREE.Group;
    readonly dayDetails: THREE.Group;
    readonly duskDetails: THREE.Group;
    readonly nightDetails: THREE.Group;
  };
}

export function buildMiniDioramaRoom(
  parent: THREE.Group,
  materials: MiniDioramaSceneMaterials,
): MiniDioramaRoomThemeTargets {
  buildPlankFloor(parent, materials);
  addCuboid(parent, 8.3, 5.15, 0.22, materials.wall, [0, 2.55, -3.25]);
  addCuboid(parent, 0.2, 4.95, 6.25, materials.wall, [-4.06, 2.4, -0.05]);
  buildWoodWainscot(parent, materials);
  const window = buildWindow(parent, materials, [2.52, 3.3, -3.02]);
  const pendantLights = [
    buildPendant(parent, materials, [-2.4, 4.0, -1.1]),
    buildPendant(parent, materials, [2.1, 4.0, -1.15]),
  ];
  buildRoomAccents(parent, materials);
  return { pendantLights, window };
}

function buildPlankFloor(parent: THREE.Group, materials: MiniDioramaSceneMaterials): void {
  addCuboid(parent, 8.4, 0.14, 6.8, materials.floorSeam, [0, -0.12, 0], [0, 0, 0], true);
  const boardDepth = 0.66;
  for (let row = 0; row < 10; row++) {
    const z = -3.0 + row * boardDepth;
    const jointX = row % 2 === 0 ? -0.72 : 0.64;
    const leftWidth = jointX + 4.08;
    const rightWidth = 4.08 - jointX;
    const leftMaterial = row % 3 === 0 ? materials.floorboardAlt : materials.floorboard;
    const rightMaterial = row % 3 === 1 ? materials.floorboardAlt : materials.floorboard;
    addCuboid(parent, leftWidth - 0.025, 0.075, boardDepth - 0.025, leftMaterial, [
      (jointX - 4.08) / 2,
      -0.025,
      z,
    ]);
    addCuboid(parent, rightWidth - 0.025, 0.075, boardDepth - 0.025, rightMaterial, [
      (jointX + 4.08) / 2,
      -0.025,
      z,
    ]);
  }
}

function buildWoodWainscot(parent: THREE.Group, materials: MiniDioramaSceneMaterials): void {
  addCuboid(parent, 8.28, 1.43, 0.17, materials.oakDark, [0, 0.78, -3.09]);
  for (let index = 0; index < 9; index++) {
    const x = -3.56 + index * 0.89;
    addCuboid(parent, 0.79, 1.08, 0.055, index % 3 === 0 ? materials.oakLight : materials.oak, [
      x,
      0.78,
      -2.98,
    ]);
  }
  for (let index = 0; index < 10; index++) {
    addCuboid(parent, 0.05, 1.25, 0.09, materials.oakDark, [-4.0 + index * 0.89, 0.78, -2.92]);
  }
  addCuboid(parent, 8.3, 0.15, 0.22, materials.oakLight, [0, 1.51, -3.02]);
  addCuboid(parent, 8.3, 0.12, 0.2, materials.oakDark, [0, 0.12, -3.03]);
  addCuboid(parent, 0.18, 4.15, 0.2, materials.oakDark, [-3.98, 2.08, -3.04]);
  addCuboid(parent, 0.18, 4.15, 0.2, materials.oakDark, [3.98, 2.08, -3.04]);
  addCuboid(parent, 8.12, 0.16, 0.22, materials.oakDark, [0, 4.24, -3.03]);
}

function buildWindow(
  parent: THREE.Group,
  materials: MiniDioramaSceneMaterials,
  position: readonly [number, number, number],
): MiniDioramaRoomThemeTargets['window'] {
  const window = addGroup(parent, position);
  addCuboid(window, 1.58, 1.5, 0.15, materials.oakDark, [0, 0, 0]);

  const sky = basicMaterial(0x83b5bd);
  const horizon = basicMaterial(0x698a70);
  const sun = basicMaterial(0xffdc8a);
  const duskSun = basicMaterial(0xe9a078);
  const moon = basicMaterial(0xf2e7c0);
  const clouds = basicMaterial(0xd8d8bd);
  const nightAccent = basicMaterial(0x93b9b4);
  addCuboid(window, 1.28, 1.2, 0.035, sky, [0, 0.04, 0.09]);
  addCuboid(window, 1.28, 0.36, 0.025, horizon, [0, -0.39, 0.12]);
  addCuboid(window, 1.28, 0.08, 0.025, materials.sage, [0, -0.12, 0.135]);

  const dayDetails = addGroup(window, [0, 0, 0]);
  addPixelSun(dayDetails, sun, [0.37, 0.36, 0.14]);
  addPixelCloud(dayDetails, clouds, [-0.42, 0.18, 0.15]);
  addDayTrees(dayDetails, materials);

  const duskDetails = addGroup(window, [0, 0, 0]);
  addPixelSun(duskDetails, duskSun, [0.38, -0.1, 0.15]);
  addCuboid(duskDetails, 0.72, 0.07, 0.025, clouds, [-0.36, 0.28, 0.15]);
  addCuboid(duskDetails, 0.48, 0.06, 0.025, clouds, [-0.46, 0.37, 0.15]);
  addDuskSkyline(duskDetails, horizon, duskSun);

  const nightDetails = addGroup(window, [0, 0, 0]);
  const stars = addGroup(nightDetails, [0, 0, 0]);
  addPixelMoon(nightDetails, moon, [0.36, 0.34, 0.15]);
  addNightSkyline(nightDetails, horizon, nightAccent);
  for (const [x, y] of [
    [-0.42, 0.36],
    [-0.14, 0.18],
    [0.06, 0.43],
    [0.58, 0.04],
    [-0.58, -0.08],
  ] as const) {
    addCuboid(stars, 0.055, 0.055, 0.025, moon, [x, y, 0.15]);
  }

  addCuboid(window, 0.06, 1.22, 0.065, materials.oakLight, [0, 0.04, 0.17]);
  addCuboid(window, 1.3, 0.06, 0.065, materials.oakLight, [0, -0.18, 0.17]);
  addCuboid(window, 1.84, 0.16, 0.3, materials.oakLight, [0, -0.75, 0.14]);
  addCuboid(window, 0.24, 1.25, 0.07, materials.linen, [-0.71, -0.02, 0.13]);
  addCuboid(window, 0.24, 1.25, 0.07, materials.linen, [0.71, -0.02, 0.13]);

  return {
    sky,
    horizon,
    sun,
    duskSun,
    moon,
    clouds,
    nightAccent,
    stars,
    dayDetails,
    duskDetails,
    nightDetails,
  };
}

function addDayTrees(parent: THREE.Group, materials: MiniDioramaSceneMaterials): void {
  addWindowTree(parent, materials, -0.46, 0.72);
  addWindowTree(parent, materials, 0.44, 0.58);
}

function addWindowTree(
  parent: THREE.Group,
  materials: MiniDioramaSceneMaterials,
  x: number,
  scale: number,
): void {
  const groundY = -0.42;
  const z = 0.16;
  addCuboid(parent, 0.045 * scale, 0.21 * scale, 0.035, materials.oakDark, [x, groundY, z]);
  addCuboid(parent, 0.2 * scale, 0.13 * scale, 0.045, materials.sage, [
    x,
    groundY + 0.16 * scale,
    z,
  ]);
  addCuboid(parent, 0.14 * scale, 0.12 * scale, 0.045, materials.sage, [
    x - 0.055 * scale,
    groundY + 0.28 * scale,
    z,
  ]);
  addCuboid(parent, 0.14 * scale, 0.12 * scale, 0.045, materials.sage, [
    x + 0.055 * scale,
    groundY + 0.28 * scale,
    z,
  ]);
}

function addDuskSkyline(
  parent: THREE.Group,
  skyline: THREE.Material,
  windowGlow: THREE.Material,
): void {
  for (const [x, width, height] of [
    [-0.43, 0.18, 0.24],
    [-0.14, 0.24, 0.34],
    [0.19, 0.16, 0.2],
    [0.43, 0.22, 0.3],
  ] as const) {
    const baseY = -0.36;
    addCuboid(parent, width, height, 0.035, skyline, [x, baseY + height / 2, 0.16]);
    addCuboid(parent, 0.035, 0.045, 0.025, windowGlow, [x, baseY + height * 0.62, 0.185]);
  }
}

function addNightSkyline(
  parent: THREE.Group,
  skyline: THREE.Material,
  windowGlow: THREE.Material,
): void {
  for (const [x, width, height] of [
    [-0.44, 0.2, 0.18],
    [-0.13, 0.16, 0.28],
    [0.16, 0.24, 0.22],
    [0.45, 0.16, 0.34],
  ] as const) {
    const baseY = -0.37;
    addCuboid(parent, width, height, 0.035, skyline, [x, baseY + height / 2, 0.16]);
    addCuboid(parent, 0.04, 0.045, 0.025, windowGlow, [x, baseY + height * 0.58, 0.185]);
  }
}

function addPixelSun(
  parent: THREE.Group,
  material: THREE.Material,
  position: readonly [number, number, number],
): void {
  const [x, y, z] = position;
  for (const [dx, dy, width, height] of [
    [-0.1, -0.1, 0.2, 0.2],
    [-0.17, -0.035, 0.34, 0.07],
    [-0.035, -0.17, 0.07, 0.34],
  ] as const) {
    addCuboid(parent, width, height, 0.035, material, [x + dx, y + dy, z]);
  }
}

function addPixelMoon(
  parent: THREE.Group,
  material: THREE.Material,
  position: readonly [number, number, number],
): void {
  const [x, y, z] = position;
  for (const [dx, dy, width, height] of [
    [-0.08, -0.22, 0.16, 0.12],
    [-0.16, -0.1, 0.16, 0.28],
    [-0.08, 0.18, 0.16, 0.12],
    [0.08, -0.16, 0.1, 0.24],
  ] as const) {
    addCuboid(parent, width, height, 0.035, material, [x + dx, y + dy, z]);
  }
}

function addPixelCloud(
  parent: THREE.Group,
  material: THREE.Material,
  position: readonly [number, number, number],
): void {
  const [x, y, z] = position;
  addCuboid(parent, 0.5, 0.11, 0.03, material, [x, y, z]);
  addCuboid(parent, 0.18, 0.12, 0.03, material, [x - 0.09, y + 0.08, z]);
  addCuboid(parent, 0.2, 0.16, 0.03, material, [x + 0.12, y + 0.1, z]);
}

function basicMaterial(color: number): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({ color, toneMapped: false });
}

function buildPendant(
  parent: THREE.Group,
  materials: MiniDioramaSceneMaterials,
  position: readonly [number, number, number],
): THREE.PointLight {
  const lamp = addGroup(parent, position);
  addCuboid(lamp, 0.035, 0.68, 0.035, materials.brass, [0, 0.18, 0]);
  addCuboid(lamp, 0.28, 0.1, 0.28, materials.sage, [0, -0.12, 0]);
  addCuboid(lamp, 0.38, 0.11, 0.38, materials.sage, [0, -0.22, 0]);
  addCuboid(lamp, 0.22, 0.08, 0.22, materials.wallTrim, [0, -0.32, 0]);
  const bulb = new THREE.PointLight(0xffd9a3, 1.6, 4.5, 2);
  bulb.position.set(0, -0.37, 0.02);
  lamp.add(bulb);
  addCuboid(lamp, 0.09, 0.09, 0.09, materials.wallTrim, [0, -0.37, 0.02]);
  return bulb;
}

function buildRoomAccents(parent: THREE.Group, materials: MiniDioramaSceneMaterials): void {
  buildWickerBasket(parent, materials);
  buildPlant(parent, materials);
  buildLaundryNotice(parent, materials);
  buildSupplyShelves(parent, materials);
}

function buildWickerBasket(parent: THREE.Group, materials: MiniDioramaSceneMaterials): void {
  const basket = addGroup(parent, [2.75, 0.02, 0.45]);
  addCuboid(basket, 0.9, 0.08, 0.72, materials.oakDark, [0, 0.08, 0]);
  for (let x = -0.36; x <= 0.36; x += 0.12) {
    addCuboid(basket, 0.045, 0.51, 0.045, materials.oakLight, [x, 0.34, 0.33]);
    addCuboid(basket, 0.045, 0.51, 0.045, materials.oakLight, [x, 0.34, -0.33]);
  }
  for (const y of [0.18, 0.33, 0.48]) {
    addCuboid(basket, 0.88, 0.045, 0.045, materials.oak, [0, y, 0.36]);
    addCuboid(basket, 0.88, 0.045, 0.045, materials.oak, [0, y, -0.36]);
  }
  addFoldedLaundry(basket, materials, [-0.2, 0.63, 0.02], materials.linenBlue);
  addFoldedLaundry(basket, materials, [0.04, 0.65, -0.02], materials.linen);
  addFoldedLaundry(basket, materials, [0.23, 0.61, 0.06], materials.linenRose);
}

function buildPlant(parent: THREE.Group, materials: MiniDioramaSceneMaterials): void {
  const plant = addGroup(parent, [-3.5, 0.02, -0.65]);
  addCuboid(plant, 0.58, 0.12, 0.58, materials.terracotta, [0, 0.1, 0]);
  addCuboid(plant, 0.46, 0.26, 0.46, materials.terracotta, [0, 0.29, 0]);
  addCuboid(plant, 0.62, 0.08, 0.62, materials.terracotta, [0, 0.46, 0]);
  addCuboid(plant, 0.07, 0.38, 0.07, materials.oakDark, [0, 0.72, 0]);
  for (const [x, y, z, rotation] of [
    [-0.2, 0.96, 0, -0.48],
    [0.2, 1.02, 0.04, 0.48],
    [0, 1.2, -0.08, 0],
    [-0.08, 1.08, 0.16, -0.2],
    [0.08, 1.08, -0.18, 0.2],
  ] as const) {
    addCuboid(plant, 0.16, 0.42, 0.13, materials.sage, [x, y, z], [0, 0, rotation]);
  }
}

function buildLaundryNotice(parent: THREE.Group, materials: MiniDioramaSceneMaterials): void {
  addCuboid(parent, 0.88, 0.64, 0.1, materials.oakDark, [-2.68, 2.35, -3.085]);
  addCuboid(parent, 0.74, 0.5, 0.025, materials.linen, [-2.68, 2.35, -3.02]);
  addCuboid(parent, 0.16, 0.16, 0.03, materials.terracotta, [-2.86, 2.42, -2.99]);
  addCuboid(parent, 0.16, 0.26, 0.03, materials.sage, [-2.68, 2.37, -2.99]);
  addCuboid(parent, 0.16, 0.14, 0.03, materials.oakLight, [-2.5, 2.43, -2.99]);
}

function buildSupplyShelves(parent: THREE.Group, materials: MiniDioramaSceneMaterials): void {
  for (const x of [-3.2, 3.2]) {
    addCuboid(parent, 0.94, 0.09, 0.28, materials.oakLight, [x, 1.78, -2.9]);
    addCuboid(parent, 0.94, 0.08, 0.28, materials.oak, [x, 2.54, -2.9]);
  }
  for (const [x, color] of [
    [-3.47, materials.linenBlue],
    [-3.2, materials.sage],
    [-2.93, materials.linenRose],
    [2.93, materials.sage],
    [3.2, materials.linenBlue],
    [3.47, materials.terracotta],
  ] as const) {
    addCuboid(parent, 0.16, 0.32, 0.16, color, [x, 1.99, -2.9]);
    addCuboid(parent, 0.08, 0.1, 0.08, materials.wallTrim, [x, 2.2, -2.9]);
  }
  for (const [x, color] of [
    [-3.34, materials.linen],
    [-3.08, materials.linenBlue],
    [3.08, materials.linenRose],
    [3.34, materials.linen],
  ] as const) {
    addCuboid(parent, 0.22, 0.16, 0.18, color, [x, 2.68, -2.9]);
  }
}

function addFoldedLaundry(
  parent: THREE.Group,
  materials: MiniDioramaSceneMaterials,
  position: readonly [number, number, number],
  color: THREE.Material,
): void {
  const [x, y, z] = position;
  addCuboid(parent, 0.3, 0.18, 0.34, color, position, [0, x * 0.4, 0]);
  addCuboid(parent, 0.22, 0.05, 0.37, materials.wallTrim, [x, y + 0.1, z]);
}
