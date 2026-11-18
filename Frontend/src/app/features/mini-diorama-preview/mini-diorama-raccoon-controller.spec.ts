import { Group } from 'three';
import { describe, expect, it } from 'vitest';
import { MiniDioramaRaccoonController } from './mini-diorama-raccoon-controller';

describe('MiniDioramaRaccoonController', () => {
  it('keeps the supplied Raccoon in motion and performs a bounded greeting gesture', () => {
    const { controller, head, leg, tail } = createController();
    const baseLeg = leg.rotation.z;
    const baseHead = head.rotation.x;
    const baseTail = tail.rotation.y;

    controller.update(0.3);
    expect(head.rotation.x).not.toBe(baseHead);
    expect(tail.rotation.y).not.toBe(baseTail);

    controller.greet();
    expect(controller.isGreeting).toBe(true);
    controller.update(0.12);
    expect(leg.rotation.z).not.toBe(baseLeg);
    for (let frame = 0; frame < 20; frame++) controller.update(0.05);

    expect(controller.isGreeting).toBe(false);
    expect(leg.rotation.z).toBe(baseLeg);
  });

  it('holds the approved bind pose while reduced motion is enabled', () => {
    const { controller, head, leg, tail } = createController();
    const base = [head.rotation.x, leg.rotation.z, tail.rotation.y];

    controller.setReducedMotion(true);
    controller.greet();
    controller.update(0.05);

    expect(controller.isGreeting).toBe(false);
    expect([head.rotation.x, leg.rotation.z, tail.rotation.y]).toEqual(base);
  });

  it('rejects a model missing its Raccoon greeting joint', () => {
    const root = new Group();
    root.add(new Group());

    expect(() => new MiniDioramaRaccoonController(root)).toThrow("missing its 'ForelegL'");
  });
});

function createController(): {
  readonly controller: MiniDioramaRaccoonController;
  readonly head: Group;
  readonly leg: Group;
  readonly tail: Group;
} {
  const root = new Group();
  const leg = new Group();
  leg.name = 'ForelegL';
  const head = new Group();
  head.name = 'Head_•_broad_cheek_mask';
  const tail = new Group();
  tail.name = 'Tail_•_banded';
  root.add(leg, head, tail);
  return { controller: new MiniDioramaRaccoonController(root), head, leg, tail };
}
