import { MathUtils, Raycaster, Vector2 } from 'three';
import type { Camera, Object3D } from 'three';
import {
  intentForSceneTarget,
  type MiniDioramaIntent,
  type MiniDioramaTarget,
} from './mini-diorama-contracts';

interface InteractionRoot {
  readonly object: Object3D;
  readonly target: MiniDioramaTarget;
}

interface PointerContact {
  readonly clientX: number;
  readonly clientY: number;
  readonly pointerType: string;
  readonly button: number;
}

interface PointerPress {
  readonly pointerId: number;
  readonly clientX: number;
  readonly clientY: number;
  readonly button: number;
  moved: boolean;
}

export interface MiniDioramaInteractionCallbacks {
  readonly onIntent: (intent: MiniDioramaIntent) => void;
  readonly onHover: (target: MiniDioramaTarget | undefined) => void;
  readonly orbitCamera: (yawDelta: number, pitchDelta: number) => void;
  readonly panCamera: (deltaX: number, deltaY: number, width: number, height: number) => void;
  readonly zoomCamera: (distanceScale: number) => void;
}

const dragThresholdPixels = 8;
const orbitRadiansPerPixel = 0.004;
const pinchDistanceScaleLimit = 1.8;
const wheelDeltaLimit = 180;
const wheelZoomSensitivity = 0.00045;

export class MiniDioramaInteractionController {
  private readonly raycaster = new Raycaster();
  private readonly pointer = new Vector2();
  private readonly targetByRoot: ReadonlyMap<Object3D, MiniDioramaTarget>;
  private readonly pointers = new Map<number, PointerContact>();
  private press?: PointerPress;
  private pinchDistance?: number;
  private disposed = false;
  private readonly originalTouchAction: string;
  private readonly cameraGestureListenersAttached: boolean;

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (
      this.disposed ||
      (event.pointerType === 'mouse' &&
        event.button !== 0 &&
        (!this.cameraGesturesAllowed() || event.button !== 1))
    ) {
      return;
    }
    if (this.cameraGesturesAllowed() && event.pointerType === 'mouse' && event.button === 1) {
      event.preventDefault();
    }

    this.pointers.set(event.pointerId, pointerContact(event));
    if (this.pointers.size === 1) {
      this.press = {
        pointerId: event.pointerId,
        clientX: event.clientX,
        clientY: event.clientY,
        button: event.button,
        moved: false,
      };
    } else if (this.pointers.size === 2) {
      this.press = undefined;
      this.pinchDistance = distanceBetweenPointers(this.pointers);
    }

    if (this.canvas.setPointerCapture) {
      try {
        this.canvas.setPointerCapture(event.pointerId);
      } catch {
        // Pointer capture is optional in test and embedded browser environments.
      }
    }
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    const contact = this.pointers.get(event.pointerId);
    if (!contact) return;

    const press = this.press;
    this.pointers.delete(event.pointerId);
    if (this.pointers.size < 2) this.pinchDistance = undefined;

    if (this.pointers.size === 1) {
      const [pointerId, remaining] = this.pointers.entries().next().value as [
        number,
        PointerContact,
      ];
      this.press = {
        pointerId,
        clientX: remaining.clientX,
        clientY: remaining.clientY,
        button: remaining.button,
        moved: true,
      };
    } else {
      this.press = undefined;
    }

    if (
      press &&
      press.pointerId === event.pointerId &&
      !press.moved &&
      press.button === 0 &&
      (contact.pointerType !== 'mouse' || press.button === event.button)
    ) {
      const target = this.targetAt(event.clientX, event.clientY);
      if (target) this.callbacks.onIntent(intentForSceneTarget(target));
    }

    if (this.pointers.size === 0) this.updateHover(event.clientX, event.clientY);
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    const previous = this.pointers.get(event.pointerId);
    if (!previous) {
      if (event.pointerType === 'mouse') this.updateHover(event.clientX, event.clientY);
      return;
    }

    this.pointers.set(event.pointerId, pointerContact(event));
    if (this.pointers.size >= 2) {
      if (this.cameraGesturesAllowed()) {
        this.updatePinch();
        this.canvas.style.cursor = 'grabbing';
      }
      return;
    }

    const press = this.press;
    if (!press || press.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - previous.clientX;
    const deltaY = event.clientY - previous.clientY;
    if (!press.moved) {
      press.moved =
        Math.hypot(event.clientX - press.clientX, event.clientY - press.clientY) >
        dragThresholdPixels;
    }
    if (!press.moved) return;
    if (!this.cameraGesturesAllowed()) return;

    this.callbacks.onHover(undefined);
    if (press.button === 1) {
      const bounds = this.canvas.getBoundingClientRect();
      this.callbacks.panCamera(deltaX, deltaY, bounds.width, bounds.height);
    } else {
      this.callbacks.orbitCamera(-deltaX * orbitRadiansPerPixel, deltaY * orbitRadiansPerPixel);
    }
    this.canvas.style.cursor = 'grabbing';
  };

  private readonly onPointerLeave = (): void => {
    if (this.pointers.size > 0) return;
    this.canvas.style.cursor = '';
    this.callbacks.onHover(undefined);
  };

  private readonly onPointerCancel = (event: PointerEvent): void => {
    this.pointers.delete(event.pointerId);
    this.press = undefined;
    this.pinchDistance = undefined;
    if (this.pointers.size === 0) {
      this.canvas.style.cursor = '';
      this.callbacks.onHover(undefined);
    }
  };

  private readonly onWheel = (event: WheelEvent): void => {
    if (this.disposed || !this.cameraGesturesAllowed()) return;
    event.preventDefault();
    const delta = MathUtils.clamp(event.deltaY, -wheelDeltaLimit, wheelDeltaLimit);
    this.callbacks.zoomCamera(Math.exp(delta * wheelZoomSensitivity));
  };

  private readonly onAuxClick = (event: MouseEvent): void => {
    if (event.button === 1) event.preventDefault();
  };

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly camera: Camera,
    roots: readonly InteractionRoot[],
    private readonly callbacks: MiniDioramaInteractionCallbacks,
    private readonly cameraGesturesEnabled: boolean | (() => boolean) = true,
  ) {
    this.targetByRoot = new Map(roots.map(({ object, target }) => [object, target]));
    this.originalTouchAction = canvas.style.touchAction;
    this.cameraGestureListenersAttached = this.cameraGesturesAllowed();
    if (this.cameraGestureListenersAttached) canvas.style.touchAction = 'none';
    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointerup', this.onPointerUp);
    canvas.addEventListener('pointermove', this.onPointerMove);
    canvas.addEventListener('pointerleave', this.onPointerLeave);
    canvas.addEventListener('pointercancel', this.onPointerCancel);
    if (this.cameraGestureListenersAttached) {
      canvas.addEventListener('wheel', this.onWheel, { passive: false });
      canvas.addEventListener('auxclick', this.onAuxClick);
    }
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.press = undefined;
    this.pinchDistance = undefined;
    this.pointers.clear();
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerleave', this.onPointerLeave);
    this.canvas.removeEventListener('pointercancel', this.onPointerCancel);
    if (this.cameraGestureListenersAttached) {
      this.canvas.removeEventListener('wheel', this.onWheel);
      this.canvas.removeEventListener('auxclick', this.onAuxClick);
    }
    this.canvas.style.cursor = '';
    this.canvas.style.touchAction = this.originalTouchAction;
    this.callbacks.onHover(undefined);
  }

  private updatePinch(): void {
    const distance = distanceBetweenPointers(this.pointers);
    if (distance === undefined || distance <= 0) return;
    if (this.pinchDistance !== undefined && this.pinchDistance > 0) {
      const scale = MathUtils.clamp(
        this.pinchDistance / distance,
        1 / pinchDistanceScaleLimit,
        pinchDistanceScaleLimit,
      );
      if (Math.abs(scale - 1) > 0.001) this.callbacks.zoomCamera(scale);
    }
    this.pinchDistance = distance;
  }

  private cameraGesturesAllowed(): boolean {
    return typeof this.cameraGesturesEnabled === 'function'
      ? this.cameraGesturesEnabled()
      : this.cameraGesturesEnabled;
  }

  private updateHover(clientX: number, clientY: number): void {
    const target = this.targetAt(clientX, clientY);
    this.canvas.style.cursor = target ? 'pointer' : '';
    this.callbacks.onHover(target);
  }

  private targetAt(clientX: number, clientY: number): MiniDioramaTarget | undefined {
    if (this.disposed) return undefined;
    const bounds = this.canvas.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0) return undefined;
    this.pointer.set(
      ((clientX - bounds.left) / bounds.width) * 2 - 1,
      -((clientY - bounds.top) / bounds.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersection = this.raycaster.intersectObjects([...this.targetByRoot.keys()], true)[0];
    let object: Object3D | undefined = intersection?.object;
    while (object) {
      const target = this.targetByRoot.get(object);
      if (target) return target;
      object = object.parent ?? undefined;
    }
    return undefined;
  }
}

function pointerContact(event: PointerEvent): PointerContact {
  return {
    clientX: event.clientX,
    clientY: event.clientY,
    pointerType: event.pointerType,
    button: event.button,
  };
}

function distanceBetweenPointers(
  pointers: ReadonlyMap<number, PointerContact>,
): number | undefined {
  const [first, second] = [...pointers.values()];
  if (!first || !second) return undefined;
  return Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);
}
