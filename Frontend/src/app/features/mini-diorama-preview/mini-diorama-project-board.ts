import * as THREE from 'three';
import type { MiniDioramaSceneMaterials } from './mini-diorama-scene-materials';
import { addGroup, addRoundedBox, addSphere } from './mini-diorama-scene-geometry';

export function buildMiniDioramaProjectBoard(
  parent: THREE.Group,
  materials: MiniDioramaSceneMaterials,
): THREE.Group {
  const board = addGroup(parent, [-0.45, 3.03, -2.96]);
  const frame = addRoundedBox(board, 2.74, 1.84, 0.2, materials.oakDark, [0, 0, 0], 0.09);
  frame.castShadow = true;
  addRoundedBox(board, 2.48, 1.58, 0.11, materials.oakLight, [0, 0, 0.12], 0.055);
  addRoundedBox(board, 2.32, 1.42, 0.035, materials.cork, [0, 0, 0.19], 0.025);

  const cardPositions = [-0.72, 0, 0.72];
  const cardMaterials = [materials.linen, materials.linenRose, materials.linenBlue];
  cardPositions.forEach((x, index) => {
    const card = addGroup(board, [x, 0.02, 0.255]);
    card.rotation.z = (index - 1) * 0.035;
    const sheet = addRoundedBox(
      card,
      0.59,
      0.82,
      0.035,
      cardMaterials[index],
      [0, -0.045, 0],
      0.025,
    );
    sheet.castShadow = true;
    addSphere(card, 0.052, materials.brass, [0, 0.33, 0.055], [0.85, 0.85, 0.62]);
    addRoundedBox(card, 0.33, 0.032, 0.018, materials.ink, [0, -0.13, 0.028], 0.012);
    addRoundedBox(card, 0.4, 0.028, 0.018, materials.ink, [0, -0.25, 0.028], 0.012);
    addRoundedBox(card, 0.25, 0.028, 0.018, materials.ink, [0, -0.36, 0.028], 0.012);
  });

  for (const x of [-1.16, 1.16]) {
    for (const y of [-0.72, 0.72]) {
      addSphere(board, 0.03, materials.brass, [x, y, 0.29], [1, 1, 0.65]);
    }
  }

  addRoundedBox(board, 0.86, 0.12, 0.08, materials.oakDark, [0, 0.98, 0.03], 0.035);
  addSphere(board, 0.06, materials.sage, [-0.26, 0.98, 0.09], [1, 1, 0.5]);
  addSphere(board, 0.06, materials.brass, [0, 0.98, 0.09], [1, 1, 0.5]);
  addSphere(board, 0.06, materials.terracotta, [0.26, 0.98, 0.09], [1, 1, 0.5]);
  return board;
}
