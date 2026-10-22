import { describe, expect, it } from 'vitest';
import { BoxGeometry, Group, Mesh, MeshBasicMaterial, Object3D } from 'three';
import { modelBounds, replaceSemanticModel } from './scene-attachment';

function model(anchorX: number): { model: Group; anchor: Object3D } {
  const result = new Group();
  result.userData['semanticId'] = 'washer';
  result.add(new Mesh(new BoxGeometry(2, 3, 1), new MeshBasicMaterial()));
  const anchor = new Object3D();
  anchor.name = 'washer.top.surface';
  anchor.position.set(anchorX, 1.5, 0);
  result.add(anchor);
  return { model: result, anchor };
}

describe('semantic model attachments', () => {
  it('moves attached children with a replacement surface rather than a mesh name', () => {
    const scene = new Group();
    const first = model(0);
    scene.add(first.model);
    const towel = new Object3D();
    towel.position.set(0.2, 0.1, 0);
    first.anchor.add(towel);
    const replacement = model(0.8);

    replaceSemanticModel(first.model, replacement.model, ['washer.top.surface']);

    expect(scene.children).toEqual([replacement.model]);
    expect(towel.parent).toBe(replacement.anchor);
    expect(towel.getWorldPosition(towel.position.clone()).x).toBeCloseTo(1);
    expect(modelBounds(replacement.model)).toEqual({ width: 2, height: 3, depth: 1 });
  });

  it('rejects a missing anchor without changing the scene', () => {
    const scene = new Group();
    const first = model(0);
    scene.add(first.model);
    const replacement = model(0);
    replacement.anchor.name = 'different.anchor';

    expect(() =>
      replaceSemanticModel(first.model, replacement.model, ['washer.top.surface']),
    ).toThrow('Missing attachment anchor');
    expect(scene.children).toEqual([first.model]);
  });
});
