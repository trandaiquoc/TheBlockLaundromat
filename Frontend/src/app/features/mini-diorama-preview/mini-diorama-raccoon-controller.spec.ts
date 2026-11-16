import { Group, Object3D } from 'three';
import { describe, expect, it } from 'vitest';
import {
  MiniDioramaRaccoonController,
  type MiniDioramaRaccoonRig,
} from './mini-diorama-raccoon-controller';

describe('MiniDioramaRaccoonController', () => {
  it('animates idle pose and a bounded greeting gesture', () => {
    const rig = createRig();
    const controller = new MiniDioramaRaccoonController(rig);
    controller.greet();

    for (let frame = 0; frame < 12; frame++) controller.update(1 / 60);

    expect(rig.body.position.y).not.toBe(0.8);
    expect(controller.isGreeting).toBe(true);
    expect(rig.greetingArm.rotation.z).not.toBe(0);

    for (let frame = 0; frame < 60; frame++) controller.update(1 / 60);

    expect(controller.isGreeting).toBe(false);
    expect(rig.greetingArm.rotation.z).toBe(0);
  });

  it('holds a static pose and keeps interaction usable with reduced motion', () => {
    const rig = createRig();
    const controller = new MiniDioramaRaccoonController(rig);
    controller.setReducedMotion(true);
    controller.greet();
    controller.update(1);

    expect(controller.isGreeting).toBe(false);
    expect(rig.body.position.y).toBe(0.8);
    expect(rig.greetingArm.rotation.z).toBe(0);
  });
});

function createRig(): MiniDioramaRaccoonRig {
  const body = new Group();
  body.position.y = 0.8;
  const head = new Group();
  const tail = new Group();
  const leftEar = new Group();
  const rightEar = new Group();
  const greetingArm = new Group();
  return {
    body,
    head,
    tail,
    leftEar,
    rightEar,
    greetingArm,
    eyeLids: [new Object3D(), new Object3D()],
  };
}
