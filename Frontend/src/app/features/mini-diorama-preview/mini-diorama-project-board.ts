import * as THREE from 'three';
import type { MiniDioramaSceneMaterials } from './mini-diorama-scene-materials';
import { addGroup, addRoundedBox, addSphere } from './mini-diorama-scene-geometry';

export function buildMiniDioramaProjectBoard(
  parent: THREE.Group,
  materials: MiniDioramaSceneMaterials,
): THREE.Group {
  const board = addGroup(parent, [-0.45, 3.03, -2.96]);
  const outerFrame = addRoundedBox(board, 2.68, 1.78, 0.2, materials.coral, [0, 0, 0], 0.11);
  outerFrame.castShadow = true;
  addRoundedBox(board, 2.43, 1.52, 0.12, materials.darkTeal, [0, 0, 0.13], 0.07);
  addRoundedBox(board, 2.22, 1.31, 0.025, materials.teal, [0, 0, 0.206], 0.045);

  const cardPositions = [-0.72, 0, 0.72];
  const cardMaterials = [materials.paper, materials.paperPink, materials.paperBlue];
  cardPositions.forEach((x, index) => {
    const card = addGroup(board, [x, 0.03, 0.255]);
    const tilt = index - 1;
    card.rotation.z = tilt * 0.045;
    addRoundedBox(card, 0.58, 0.8, 0.035, cardMaterials[index], [0, -0.05, 0], 0.035);
    addSphere(
      card,
      0.065,
      index === 1 ? materials.butter : materials.coral,
      [0, 0.34, 0.07],
      [1, 0.62, 1],
    );
    addRoundedBox(card, 0.33, 0.045, 0.018, materials.ink, [0, -0.11, 0.03], 0.018);
    addRoundedBox(card, 0.39, 0.035, 0.018, materials.ink, [0, -0.23, 0.03], 0.014);
    addRoundedBox(card, 0.25, 0.035, 0.018, materials.ink, [0, -0.34, 0.03], 0.014);
  });

  for (const x of [-1.16, 1.16]) {
    for (const y of [-0.72, 0.72]) {
      addSphere(board, 0.035, materials.butter, [x, y, 0.29], [1, 1, 0.65]);
    }
  }

  addRoundedBox(board, 0.86, 0.12, 0.08, materials.wallLight, [0, 0.98, 0.03], 0.035);
  addSphere(board, 0.09, materials.mint, [-0.26, 0.98, 0.09], [1, 1, 0.4]);
  addSphere(board, 0.09, materials.butter, [0, 0.98, 0.09], [1, 1, 0.4]);
  addSphere(board, 0.09, materials.coral, [0.26, 0.98, 0.09], [1, 1, 0.4]);
  return board;
}
