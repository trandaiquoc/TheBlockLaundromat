import { Box3, Object3D, Vector3 } from 'three';

export interface ModelBounds {
  readonly width: number;
  readonly height: number;
  readonly depth: number;
}

export function modelBounds(model: Object3D): ModelBounds {
  const size = new Box3().setFromObject(model).getSize(new Vector3());
  return { width: size.x, height: size.y, depth: size.z };
}

export function replaceSemanticModel(
  previous: Object3D,
  replacement: Object3D,
  attachmentIds: readonly string[],
): void {
  const id = previous.userData['semanticId'];
  if (typeof id !== 'string' || replacement.userData['semanticId'] !== id) {
    throw new Error('Replacement must preserve the semantic model ID');
  }
  const parent = previous.parent;
  if (!parent) throw new Error(`Model ${id} is not attached to a scene`);
  const transfers = attachmentIds.map((anchorId) => {
    const from = previous.getObjectByName(anchorId);
    const to = replacement.getObjectByName(anchorId);
    if (!from || !to) throw new Error(`Missing attachment anchor: ${anchorId}`);
    return { from, to };
  });
  replacement.position.copy(previous.position);
  replacement.quaternion.copy(previous.quaternion);
  replacement.scale.copy(previous.scale);
  parent.add(replacement);
  for (const { from, to } of transfers) {
    for (const child of [...from.children]) to.add(child);
  }
  parent.remove(previous);
}
