import { BoxGeometry, Group, Mesh, MeshBasicMaterial, PerspectiveCamera } from 'three';
import { describe, expect, it, vi } from 'vitest';
import { MiniDioramaInteractionController } from './mini-diorama-interaction';

describe('MiniDioramaInteractionController', () => {
  it('raycasts the nearest target and emits its semantic intent after a tap', () => {
    const canvas = createCanvas();
    const camera = createCamera();
    const washer = createTarget();
    const board = createTarget();
    board.position.z = -1;
    board.updateMatrixWorld(true);
    const onIntent = vi.fn();
    const controller = new MiniDioramaInteractionController(
      canvas,
      camera,
      [
        { object: washer, target: 'washer' },
        { object: board, target: 'project-board' },
      ],
      onIntent,
      vi.fn(),
    );

    pointer(canvas, 'pointerdown', 50, 50);
    pointer(canvas, 'pointerup', 50, 50);

    expect(onIntent).toHaveBeenCalledWith({ type: 'focus-target', target: 'washer' });
    controller.dispose();
  });

  it('does not activate after a drag and clears hover on disposal', () => {
    const canvas = createCanvas();
    const onIntent = vi.fn();
    const onHover = vi.fn();
    const controller = new MiniDioramaInteractionController(
      canvas,
      createCamera(),
      [{ object: createTarget(), target: 'raccoon' }],
      onIntent,
      onHover,
    );
    const removeListener = vi.spyOn(canvas, 'removeEventListener');

    pointer(canvas, 'pointerdown', 50, 50);
    pointer(canvas, 'pointerup', 70, 50);
    controller.dispose();
    controller.dispose();

    expect(onIntent).not.toHaveBeenCalled();
    expect(onHover).toHaveBeenLastCalledWith(undefined);
    expect(removeListener).toHaveBeenCalledTimes(5);
    expect(canvas.style.cursor).toBe('');
  });
});

function createCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  Object.defineProperty(canvas, 'getBoundingClientRect', {
    value: () => ({
      left: 0,
      top: 0,
      right: 100,
      bottom: 100,
      width: 100,
      height: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }),
  });
  return canvas;
}

function createCamera(): PerspectiveCamera {
  const camera = new PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 5);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld(true);
  return camera;
}

function createTarget(): Group {
  const target = new Group();
  target.add(new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial()));
  target.updateMatrixWorld(true);
  return target;
}

function pointer(canvas: HTMLCanvasElement, type: string, clientX: number, clientY: number): void {
  const event = new MouseEvent(type, { bubbles: true, clientX, clientY, button: 0 });
  Object.defineProperties(event, {
    pointerId: { value: 1 },
    pointerType: { value: 'mouse' },
    isPrimary: { value: true },
  });
  canvas.dispatchEvent(event);
}
