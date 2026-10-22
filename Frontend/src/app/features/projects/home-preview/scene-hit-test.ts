import { Object3D, Raycaster } from 'three';

export function firstSemanticHit(raycaster: Raycaster, roots: Object3D[]): string | undefined {
  const nearest = raycaster.intersectObjects(roots, true)[0];
  if (!nearest) return undefined;
  let node: Object3D | null = nearest.object;
  while (node) {
    const id = node.userData['semanticId'];
    if (typeof id === 'string') return id;
    node = node.parent;
  }
  return undefined;
}
