import { BoxGeometry, Group, Mesh, MeshBasicMaterial, PerspectiveCamera } from 'three';
import { describe, expect, it, vi } from 'vitest';
import {
  DioramaInteractionController,
  type DioramaInteractionCallbacks,
} from './diorama-interaction';

describe('DioramaInteractionController', () => {
  it('raycasts the nearest target and emits its semantic intent after a tap', () => {
    const canvas = createCanvas();
    const callbacks = createCallbacks();
    const washer = createTarget();
    const board = createTarget();
    board.position.z = -1;
    board.updateMatrixWorld(true);
    const controller = new DioramaInteractionController(
      canvas,
      createCamera(),
      [
        { object: washer, target: 'washer' },
        { object: board, target: 'project-board' },
      ],
      callbacks,
    );

    pointer(canvas, 'pointerdown', 50, 50);
    pointer(canvas, 'pointerup', 50, 50);

    expect(callbacks.onIntent).toHaveBeenCalledWith({ type: 'focus-target', target: 'washer' });
    controller.dispose();
  });

  it('uses vertical drag for camera orbit without activating the scene target', () => {
    const canvas = createCanvas();
    const callbacks = createCallbacks();
    const controller = new DioramaInteractionController(
      canvas,
      createCamera(),
      [{ object: createTarget(), target: 'raccoon' }],
      callbacks,
    );

    pointer(canvas, 'pointerdown', 50, 50);
    pointer(canvas, 'pointermove', 60, 80);
    pointer(canvas, 'pointerup', 60, 80);

    expect(callbacks.orbitCamera).toHaveBeenCalledWith(-0.04, 0.12);
    expect(callbacks.onIntent).not.toHaveBeenCalled();
    controller.dispose();
  });

  it('arbitrates Overview horizontal drags as continuous time changes and settles on release', () => {
    const canvas = createCanvas();
    const callbacks = createCallbacks();
    const controller = new DioramaInteractionController(
      canvas,
      createCamera(),
      [],
      callbacks,
      true,
      true,
    );

    pointer(canvas, 'pointerdown', 60, 50);
    pointer(canvas, 'pointermove', 0, 52);
    pointer(canvas, 'pointermove', 20, 52);
    pointer(canvas, 'pointerup', 20, 52);

    expect(callbacks.onTimeChange).toHaveBeenNthCalledWith(1, 0.75, true);
    expect(callbacks.onTimeChange).toHaveBeenNthCalledWith(2, 0.8333333333333334, true);
    expect(callbacks.onTimeChange).toHaveBeenLastCalledWith(0.8333333333333334, false);
    expect(callbacks.orbitCamera).not.toHaveBeenCalled();
    controller.dispose();
  });

  it('advances from Light to Minecraft when swiping left to right', () => {
    const canvas = createCanvas();
    const callbacks = createCallbacks(0);
    const controller = new DioramaInteractionController(
      canvas,
      createCamera(),
      [],
      callbacks,
      true,
      true,
    );

    pointer(canvas, 'pointerdown', 10, 50);
    pointer(canvas, 'pointermove', 160, 50);
    pointer(canvas, 'pointerup', 160, 50);

    expect(callbacks.onTimeChange).toHaveBeenNthCalledWith(1, 0.625, true);
    expect(callbacks.onTimeChange).toHaveBeenLastCalledWith(0.625, false);
    controller.dispose();
  });

  it('pans the camera with a middle-button drag without picking scene objects', () => {
    const canvas = createCanvas();
    const callbacks = createCallbacks();
    const controller = new DioramaInteractionController(
      canvas,
      createCamera(),
      [{ object: createTarget(), target: 'washer' }],
      callbacks,
    );

    pointer(canvas, 'pointerdown', 50, 50, 'mouse', 1, 1);
    pointer(canvas, 'pointermove', 66, 42, 'mouse', 1, 1);
    pointer(canvas, 'pointerup', 66, 42, 'mouse', 1, 1);

    expect(callbacks.panCamera).toHaveBeenCalledWith(16, -8, 100, 100);
    expect(callbacks.orbitCamera).not.toHaveBeenCalled();
    expect(callbacks.onIntent).not.toHaveBeenCalled();
    controller.dispose();
  });

  it('preserves shared scene consumers when camera gestures are not enabled', () => {
    const canvas = createCanvas();
    canvas.style.touchAction = 'pan-y';
    const callbacks = createCallbacks();
    const controller = new DioramaInteractionController(
      canvas,
      createCamera(),
      [{ object: createTarget(), target: 'washer' }],
      callbacks,
      false,
    );

    pointer(canvas, 'pointerdown', 50, 50, 'mouse', 1, 1);
    pointer(canvas, 'pointermove', 66, 42, 'mouse', 1, 1);
    pointer(canvas, 'pointerup', 66, 42, 'mouse', 1, 1);
    pointer(canvas, 'pointerdown', 50, 50);
    pointer(canvas, 'pointermove', 66, 42);
    pointer(canvas, 'pointerup', 66, 42);
    const wheel = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: 100 });
    canvas.dispatchEvent(wheel);

    expect(callbacks.panCamera).not.toHaveBeenCalled();
    expect(callbacks.orbitCamera).not.toHaveBeenCalled();
    expect(callbacks.zoomCamera).not.toHaveBeenCalled();
    expect(wheel.defaultPrevented).toBe(false);
    expect(canvas.style.touchAction).toBe('pan-y');
    controller.dispose();
    expect(canvas.style.touchAction).toBe('pan-y');
  });

  it('locks camera gestures when the focused target disables them', () => {
    const canvas = createCanvas();
    const callbacks = createCallbacks();
    let cameraGesturesAllowed = true;
    const controller = new DioramaInteractionController(
      canvas,
      createCamera(),
      [{ object: createTarget(), target: 'washer' }],
      callbacks,
      () => cameraGesturesAllowed,
      () => false,
    );

    cameraGesturesAllowed = false;
    pointer(canvas, 'pointerdown', 50, 50);
    pointer(canvas, 'pointermove', 70, 60);
    pointer(canvas, 'pointerup', 70, 60);
    const wheel = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: 100 });
    canvas.dispatchEvent(wheel);

    expect(callbacks.orbitCamera).not.toHaveBeenCalled();
    expect(callbacks.panCamera).not.toHaveBeenCalled();
    expect(callbacks.zoomCamera).not.toHaveBeenCalled();
    expect(wheel.defaultPrevented).toBe(false);
    controller.dispose();
  });

  it('zooms and pans with a pinch gesture while keeping touch action owned by the scene', () => {
    const canvas = createCanvas();
    const callbacks = createCallbacks();
    const controller = new DioramaInteractionController(canvas, createCamera(), [], callbacks);

    const wheel = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: 100 });
    canvas.dispatchEvent(wheel);
    pointer(canvas, 'pointerdown', 40, 50, 'touch', 1);
    pointer(canvas, 'pointerdown', 60, 50, 'touch', 2);
    pointer(canvas, 'pointermove', 75, 50, 'touch', 2);

    expect(wheel.defaultPrevented).toBe(true);
    expect(callbacks.zoomCamera).toHaveBeenNthCalledWith(1, Math.exp(0.045));
    expect(callbacks.zoomCamera).toHaveBeenNthCalledWith(2, 20 / 35);
    expect(callbacks.panCamera).toHaveBeenCalledWith(7.5, 0, 100, 100);
    expect(canvas.style.touchAction).toBe('none');
    controller.dispose();
    expect(canvas.style.touchAction).toBe('');
  });

  it('clears hover and removes pointer and wheel listeners on disposal', () => {
    const canvas = createCanvas();
    const callbacks = createCallbacks();
    const controller = new DioramaInteractionController(
      canvas,
      createCamera(),
      [{ object: createTarget(), target: 'raccoon' }],
      callbacks,
    );
    const removeListener = vi.spyOn(canvas, 'removeEventListener');

    pointer(canvas, 'pointermove', 50, 50);
    controller.dispose();
    controller.dispose();

    expect(callbacks.onHover).toHaveBeenLastCalledWith(undefined);
    expect(removeListener).toHaveBeenCalledTimes(7);
    expect(canvas.style.cursor).toBe('');
  });
});

function createCallbacks(startProgress = 1): DioramaInteractionCallbacks {
  return {
    onIntent: vi.fn(),
    onHover: vi.fn(),
    orbitCamera: vi.fn(),
    panCamera: vi.fn(),
    zoomCamera: vi.fn(),
    onTimeChange: vi.fn(),
    currentTimeProgress: vi.fn(() => startProgress),
  };
}

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

function pointer(
  canvas: HTMLCanvasElement,
  type: string,
  clientX: number,
  clientY: number,
  pointerType = 'mouse',
  pointerId = 1,
  button = 0,
): void {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientX, clientY, button });
  Object.defineProperties(event, {
    pointerId: { value: pointerId },
    pointerType: { value: pointerType },
    isPrimary: { value: pointerId === 1 },
  });
  canvas.dispatchEvent(event);
}
