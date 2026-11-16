import * as THREE from 'three';
import type { MiniDioramaSceneMaterials } from './mini-diorama-scene-materials';
import { addCuboid, addGroup } from './mini-diorama-scene-geometry';

export function buildMiniDioramaWasher(
  parent: THREE.Group,
  materials: MiniDioramaSceneMaterials,
): THREE.Group {
  const washer = addGroup(parent, [1.48, 0, -0.36]);
  addCuboid(washer, 1.84, 0.28, 1.34, materials.oakDark, [0, 0.15, 0], [0, 0, 0], true);
  addCuboid(washer, 1.72, 2.0, 1.27, materials.washerEnamel, [0, 1.22, 0], [0, 0, 0], true);
  addCuboid(washer, 1.74, 0.12, 1.3, materials.wallTrim, [0, 2.24, 0]);
  addCuboid(washer, 1.7, 0.25, 0.12, materials.oak, [0, 0.31, 0.65]);
  addCuboid(washer, 1.42, 0.32, 0.12, materials.washerShade, [0, 2.0, 0.655]);

  addControls(washer, materials);
  addSquareDoor(washer, materials);
  addSideVent(washer, materials);
  return washer;
}

function addControls(parent: THREE.Group, materials: MiniDioramaSceneMaterials): void {
  addCuboid(parent, 0.42, 0.18, 0.045, materials.oakDark, [-0.3, 2.0, 0.73]);
  addCuboid(parent, 0.34, 0.1, 0.025, materials.sage, [-0.3, 2.0, 0.77]);

  addCuboid(parent, 0.34, 0.34, 0.09, materials.brass, [0.48, 2.0, 0.72]);
  addCuboid(parent, 0.23, 0.23, 0.045, materials.oakDark, [0.48, 2.0, 0.79]);
  addCuboid(parent, 0.11, 0.11, 0.03, materials.washerShade, [0.48, 2.0, 0.83]);

  for (let index = 0; index < 3; index++) {
    addCuboid(parent, 0.055, 0.055, 0.025, index === 1 ? materials.terracotta : materials.sage, [
      -0.68 + index * 0.18,
      2.0,
      0.73,
    ]);
  }

  addCuboid(parent, 0.08, 0.08, 0.04, materials.brass, [-0.62, 1.61, 0.66]);
  addCuboid(parent, 0.3, 0.055, 0.025, materials.wallTrim, [0.56, 1.6, 0.68]);
}

function addSquareDoor(parent: THREE.Group, materials: MiniDioramaSceneMaterials): void {
  const centerY = 1.16;
  const centerZ = 0.7;
  addCuboid(parent, 1.18, 1.18, 0.08, materials.brass, [0, centerY, centerZ]);
  addCuboid(parent, 1.02, 1.02, 0.07, materials.washerGasket, [0, centerY, centerZ + 0.07]);
  addCuboid(parent, 0.82, 0.82, 0.065, materials.drum, [0, centerY, centerZ + 0.13]);
  addCuboid(parent, 0.68, 0.68, 0.055, materials.glass, [0, centerY, centerZ + 0.19]);

  addCuboid(
    parent,
    0.25,
    0.16,
    0.025,
    materials.linenBlue,
    [-0.12, centerY - 0.11, centerZ + 0.23],
    [0, 0, -0.16],
  );
  addCuboid(
    parent,
    0.23,
    0.2,
    0.025,
    materials.linen,
    [0.12, centerY + 0.08, centerZ + 0.24],
    [0, 0, 0.12],
  );
  addCuboid(parent, 0.12, 0.12, 0.06, materials.brass, [0.5, centerY + 0.05, centerZ + 0.12]);

  addCuboid(parent, 0.92, 0.08, 0.055, materials.washerShade, [0, centerY + 0.55, centerZ + 0.08]);
  addCuboid(parent, 0.92, 0.08, 0.055, materials.washerShade, [0, centerY - 0.55, centerZ + 0.08]);
  addCuboid(parent, 0.08, 0.92, 0.055, materials.washerShade, [-0.55, centerY, centerZ + 0.08]);
  addCuboid(parent, 0.08, 0.92, 0.055, materials.washerShade, [0.55, centerY, centerZ + 0.08]);
}

function addSideVent(parent: THREE.Group, materials: MiniDioramaSceneMaterials): void {
  for (let index = 0; index < 5; index++) {
    addCuboid(parent, 0.025, 0.035, 0.46, materials.washerShade, [0.87, 1.81 - index * 0.09, 0]);
  }
}
