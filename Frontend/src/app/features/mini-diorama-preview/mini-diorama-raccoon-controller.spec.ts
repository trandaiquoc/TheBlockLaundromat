import { AnimationClip, Group } from 'three';
import { describe, expect, it } from 'vitest';
import { MiniDioramaRaccoonController } from './mini-diorama-raccoon-controller';

describe('MiniDioramaRaccoonController', () => {
  it('plays the authored clips and returns one-shot gestures to idle', () => {
    const controller = new MiniDioramaRaccoonController(createRoot(), createClips());

    expect(controller.currentAnimation).toBe('idle');
    controller.greet();
    expect(controller.isGreeting).toBe(true);
    advance(controller, 0.6);
    expect(controller.currentAnimation).toBe('idle');

    controller.sit();
    expect(controller.currentAnimation).toBe('sit');
    advance(controller, 0.3);
    expect(controller.currentAnimation).toBe('idle');

    controller.dispose();
  });

  it('holds the bind pose while reduced motion is enabled', () => {
    const controller = new MiniDioramaRaccoonController(createRoot(), createClips());
    controller.setReducedMotion(true);
    controller.greet();
    controller.sit();
    advance(controller, 1);

    expect(controller.currentAnimation).toBeUndefined();
    expect(controller.isGreeting).toBe(false);

    controller.setReducedMotion(false);
    expect(controller.currentAnimation).toBe('idle');
    controller.dispose();
  });

  it('rejects an authored model that omits a required clip', () => {
    expect(
      () => new MiniDioramaRaccoonController(createRoot(), [new AnimationClip('idle', 1, [])]),
    ).toThrow("missing the required 'sit' animation");
  });
});

function createRoot(): Group {
  const root = new Group();
  for (const name of ['body_pivot', 'head_pivot', 'foreleg_left', 'tail_base']) {
    const pivot = new Group();
    pivot.name = name;
    root.add(pivot);
  }
  return root;
}

function createClips(): AnimationClip[] {
  return [
    new AnimationClip('idle', 1, []),
    new AnimationClip('sit', 0.2, []),
    new AnimationClip('greet', 0.5, []),
  ];
}

function advance(controller: MiniDioramaRaccoonController, seconds: number): void {
  const steps = Math.ceil(seconds / 0.05);
  for (let index = 0; index < steps; index++) controller.update(0.05);
}
