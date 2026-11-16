import * as THREE from 'three';
import type { MiniDioramaSceneMaterials } from './mini-diorama-scene-materials';
import { addCuboid, addGroup } from './mini-diorama-scene-geometry';

export function buildMiniDioramaProjectBoard(
  parent: THREE.Group,
  materials: MiniDioramaSceneMaterials,
): THREE.Group {
  const board = addGroup(parent, [-0.45, 3.03, -2.96]);
  addCuboid(board, 2.74, 1.84, 0.2, materials.oakDark, [0, 0, 0], [0, 0, 0], true);
  addCuboid(board, 2.48, 1.58, 0.11, materials.oakLight, [0, 0, 0.12]);
  addCuboid(board, 2.32, 1.42, 0.035, materials.cork, [0, 0, 0.19]);

  const cardXs = [-0.72, 0, 0.72];
  const cardMaterials = [materials.linen, materials.linenRose, materials.linenBlue];
  cardXs.forEach((x, index) => addDecorativeCard(board, x, cardMaterials[index], index, materials));

  for (const x of [-1.16, 1.16]) {
    for (const y of [-0.72, 0.72]) {
      addCuboid(board, 0.075, 0.075, 0.065, materials.brass, [x, y, 0.29]);
    }
  }

  addCuboid(board, 0.86, 0.12, 0.08, materials.oakDark, [0, 0.98, 0.03]);
  for (const [x, material] of [
    [-0.26, materials.sage],
    [0, materials.brass],
    [0.26, materials.terracotta],
  ] as const) {
    addCuboid(board, 0.09, 0.09, 0.04, material, [x, 0.98, 0.09]);
  }
  return board;
}

function addDecorativeCard(
  board: THREE.Group,
  x: number,
  paper: THREE.Material,
  index: number,
  materials: MiniDioramaSceneMaterials,
): void {
  const card = addGroup(board, [x, 0.02, 0.255]);
  card.rotation.z = (index - 1) * 0.035;
  addCuboid(card, 0.59, 0.82, 0.035, paper, [0, -0.045, 0]);
  addCuboid(
    card,
    0.2,
    0.2,
    0.028,
    [materials.sage, materials.linenBlue, materials.terracotta][index],
    [0, 0.17, 0.035],
  );
  addCuboid(card, 0.1, 0.1, 0.028, materials.wallTrim, [-0.16, 0.03, 0.035]);
  addCuboid(card, 0.1, 0.1, 0.028, materials.oakLight, [0.16, 0.03, 0.035]);
  addCuboid(card, 0.07, 0.07, 0.05, materials.brass, [0, 0.33, 0.055]);
}
