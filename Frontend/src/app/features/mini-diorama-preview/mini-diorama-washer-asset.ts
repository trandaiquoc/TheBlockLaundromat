import * as THREE from 'three';
import type { MiniDioramaSceneMaterials } from './mini-diorama-scene-materials';
import {
  addCylinder,
  addGroup,
  addRoundedBox,
  addSphere,
  addTorus,
} from './mini-diorama-scene-geometry';

export function buildMiniDioramaWasher(
  parent: THREE.Group,
  materials: MiniDioramaSceneMaterials,
): THREE.Group {
  const washer = addGroup(parent, [1.48, 0, -0.36]);
  const base = addRoundedBox(washer, 1.84, 0.28, 1.34, materials.oakDark, [0, 0.15, 0], 0.11);
  base.castShadow = true;
  const housing = addRoundedBox(
    washer,
    1.72,
    2.0,
    1.27,
    materials.washerEnamel,
    [0, 1.22, 0],
    0.18,
  );
  housing.castShadow = true;
  addRoundedBox(washer, 1.74, 0.12, 1.3, materials.wallTrim, [0, 2.24, 0], 0.055);
  addRoundedBox(washer, 1.7, 0.25, 0.12, materials.oak, [0, 0.31, 0.65], 0.05);
  addRoundedBox(washer, 1.42, 0.32, 0.12, materials.washerShade, [0, 2.0, 0.655], 0.08);

  addRoundedBox(washer, 0.42, 0.18, 0.025, materials.oakDark, [-0.3, 2.0, 0.73], 0.035);
  addRoundedBox(washer, 0.34, 0.1, 0.02, materials.sage, [-0.3, 2.0, 0.75], 0.018);
  addCylinder(washer, 0.14, 0.14, 0.085, materials.brass, [0.48, 2.0, 0.72], [Math.PI / 2, 0, 0]);
  addCylinder(
    washer,
    0.076,
    0.076,
    0.09,
    materials.oakDark,
    [0.48, 2.0, 0.78],
    [Math.PI / 2, 0, 0],
  );
  for (let index = 0; index < 3; index++) {
    addSphere(washer, 0.032, index === 1 ? materials.terracotta : materials.sage, [
      -0.68 + index * 0.18,
      2.0,
      0.73,
    ]);
  }

  addSphere(washer, 0.055, materials.brass, [-0.62, 1.61, 0.66], [1, 1, 0.58]);
  addRoundedBox(washer, 0.3, 0.055, 0.025, materials.wallTrim, [0.56, 1.6, 0.68], 0.02);
  addDoor(washer, materials);
  addSideVent(washer, materials);
  return washer;
}

function addDoor(parent: THREE.Group, materials: MiniDioramaSceneMaterials): void {
  const centerY = 1.16;
  const centerZ = 0.68;
  addSphere(parent, 0.52, materials.washerGasket, [0, centerY, centerZ], [1, 1, 0.32]);
  addTorus(parent, 0.55, 0.075, materials.brass, [0, centerY, centerZ + 0.03]);
  const drum = addSphere(parent, 0.405, materials.drum, [0, centerY, centerZ + 0.1], [1, 1, 0.32]);
  drum.receiveShadow = true;

  for (let index = 0; index < 6; index++) {
    const angle = (index / 6) * Math.PI * 2;
    const rib = addRoundedBox(
      parent,
      0.035,
      0.17,
      0.025,
      materials.washerShade,
      [Math.cos(angle) * 0.25, centerY + Math.sin(angle) * 0.25, centerZ + 0.16],
      0.012,
    );
    rib.rotation.z = angle;
  }
  addSphere(
    parent,
    0.16,
    materials.linenBlue,
    [-0.11, centerY - 0.08, centerZ + 0.19],
    [1.3, 0.58, 0.26],
  );
  addSphere(
    parent,
    0.18,
    materials.linen,
    [0.12, centerY + 0.06, centerZ + 0.2],
    [1.15, 0.48, 0.24],
  );
  const glass = new THREE.Mesh(new THREE.CircleGeometry(0.42, 56), materials.glass);
  glass.position.set(0, centerY, centerZ + 0.23);
  glass.renderOrder = 2;
  parent.add(glass);

  const latch = addSphere(
    parent,
    0.04,
    materials.brass,
    [0.48, centerY + 0.03, centerZ + 0.12],
    [0.8, 1, 0.5],
  );
  latch.castShadow = false;
}

function addSideVent(parent: THREE.Group, materials: MiniDioramaSceneMaterials): void {
  for (let index = 0; index < 5; index++) {
    addRoundedBox(
      parent,
      0.46,
      0.025,
      0.014,
      materials.washerShade,
      [0, 1.81 - index * 0.09, -0.645],
      0.009,
    );
  }
}
