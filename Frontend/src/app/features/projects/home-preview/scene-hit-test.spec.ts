import { describe, expect, it } from 'vitest';
import { BoxGeometry, Group, Mesh, MeshBasicMaterial, Raycaster, Vector3 } from 'three';
import { firstSemanticHit } from './scene-hit-test';

const ray = new Raycaster(new Vector3(0, 0, 5), new Vector3(0, 0, -1));

function object(id: string | undefined, z: number): Group {
  const group = new Group();
  if (id) group.userData['semanticId'] = id;
  group.position.z = z;
  group.add(new Mesh(new BoxGeometry(2, 2, 0.5), new MeshBasicMaterial()));
  group.updateMatrixWorld(true);
  return group;
}

describe('homepage scene hit testing', () => {
  it('returns the nearest semantic object when it covers another object', () => {
    expect(firstSemanticHit(ray, [object('board', -1), object('basket', 1)])).toBe('basket');
  });

  it('does not click through an untagged foreground occluder', () => {
    expect(firstSemanticHit(ray, [object('board', -1), object(undefined, 1)])).toBeUndefined();
  });
});
