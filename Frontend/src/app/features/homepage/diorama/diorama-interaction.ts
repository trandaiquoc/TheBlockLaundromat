import { MathUtils, Raycaster, Vector2 } from 'three';
import type { Camera, Object3D } from 'three';
import { intentForSceneTarget, type DioramaIntent, type DioramaTarget } from './diorama-contracts';

interface InteractionRoot {
  readonly object: Object3D;
  readonly target: DioramaTarget;
}

interface PointerContact {
  readonly clientX: number;
  readonly clientY: number;
  readonly pointerType: string;
  readonly button: number;
}

type PointerGesture = 'pending' | 'orbit' | 'pan' | 'time-swipe' | 'locked';

interface PointerPress {
  readonly pointerId: number;
  readonly clientX: number;
  readonly clientY: number;
  readonly button: number;
  moved: boolean;
  gesture: PointerGesture;
  timeStartProgress?: number;
  timeProgress?: number;
}

interface PinchCenter {
  readonly clientX: number;
  readonly clientY: number;
}

export interface DioramaInteractionCallbacks {
  readonly onIntent: (intent: DioramaIntent) => void;
  readonly onHover: (target: DioramaTarget | undefined) => void;
  readonly orbitCamera: (yawDelta: number, pitchDelta: number) => void;
  readonly panCamera: (deltaX: number, deltaY: number, width: number, height: number) => void;
  readonly zoomCamera: (distanceScale: number) => void;
  readonly onTimeChange: (progress: number, isDragging: boolean) => void;
  readonly currentTimeProgress: () => number;
}

const dragThresholdPixels = 8;
const orbitRadiansPerPixel = 0.004;
const swipePixelsPerStage = 240;
const pinchDistanceScaleLimit = 1.8;
const wheelDeltaLimit = 180;
const wheelZoomSensitivity = 0.00045;

export class DioramaInteractionController {
  private readonly raycaster = new Raycaster();
  private readonly pointer = new Vector2();
  private readonly targetByRoot: ReadonlyMap<Object3D, DioramaTarget>;
  private readonly pointers = new Map<number, PointerContact>();
  private press?: PointerPress;
  private pinchDistance?: number;
  private pinchCenter?: PinchCenter;
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

    if (this.pointers.size === 1) this.finishTimeSwipe();
    this.pointers.set(event.pointerId, pointerContact(event));
    if (this.pointers.size === 1) {
      this.press = {
        pointerId: event.pointerId,
        clientX: event.clientX,
        clientY: event.clientY,
        button: event.button,
        moved: false,
        gesture: 'pending',
      };
    } else if (this.pointers.size === 2) {
      this.press = undefined;
      this.pinchDistance = distanceBetweenPointers(this.pointers);
      this.pinchCenter = centerOfPointers(this.pointers);
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
    if (this.pointers.size < 2) {
      this.pinchDistance = undefined;
      this.pinchCenter = undefined;
    }

    if (press?.pointerId === event.pointerId && press.gesture === 'time-swipe') {
      this.finishTimeSwipe(press);
    }
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
        gesture: 'locked',
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
    const totalX = event.clientX - press.clientX;
    const totalY = event.clientY - press.clientY;
    if (!press.moved) {
      press.moved = Math.hypot(totalX, totalY) > dragThresholdPixels;
      if (!press.moved) return;
      this.classifyGesture(press, totalX, totalY);
    }

    this.callbacks.onHover(undefined);
    if (press.gesture === 'time-swipe') {
      const startProgress = press.timeStartProgress ?? this.callbacks.currentTimeProgress();
      const progress = startProgress + totalX / swipePixelsPerStage;
      press.timeProgress = progress;
      this.callbacks.onTimeChange(progress, true);
      event.preventDefault();
    } else if (press.gesture === 'pan') {
      const bounds = this.canvas.getBoundingClientRect();
      this.callbacks.panCamera(deltaX, deltaY, bounds.width, bounds.height);
    } else if (press.gesture === 'orbit') {
      this.callbacks.orbitCamera(-deltaX * orbitRadiansPerPixel, deltaY * orbitRadiansPerPixel);
    }
    if (press.gesture === 'time-swipe' || press.gesture === 'orbit' || press.gesture === 'pan') {
      this.canvas.style.cursor = 'grabbing';
    }
  };

  private readonly onPointerLeave = (): void => {
    if (this.pointers.size > 0) return;
    this.canvas.style.cursor = '';
    this.callbacks.onHover(undefined);
  };

  private readonly onPointerCancel = (event: PointerEvent): void => {
    if (this.press?.pointerId === event.pointerId && this.press.gesture === 'time-swipe') {
      this.finishTimeSwipe(this.press);
    }
    this.pointers.delete(event.pointerId);
    this.press = undefined;
    this.pinchDistance = undefined;
    this.pinchCenter = undefined;
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
    private readonly callbacks: DioramaInteractionCallbacks,
    private readonly cameraGesturesEnabled: boolean | (() => boolean) = true,
    private readonly timeSwipeEnabled: boolean | (() => boolean) = true,
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
    this.finishTimeSwipe();
    this.press = undefined;
    this.pinchDistance = undefined;
    this.pinchCenter = undefined;
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

  private classifyGesture(press: PointerPress, deltaX: number, deltaY: number): void {
    if (press.button === 1) {
      press.gesture = this.cameraGesturesAllowed() ? 'pan' : 'locked';
      return;
    }
    if (this.timeSwipeAllowed() && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
      press.gesture = 'time-swipe';
      press.timeStartProgress = this.callbacks.currentTimeProgress();
      press.timeProgress = press.timeStartProgress;
      return;
    }
    press.gesture = this.cameraGesturesAllowed() ? 'orbit' : 'locked';
  }

  private finishTimeSwipe(press = this.press): void {
    if (!press || press.gesture !== 'time-swipe') return;
    press.gesture = 'locked';
    this.callbacks.onTimeChange(press.timeProgress ?? this.callbacks.currentTimeProgress(), false);
  }

  private updatePinch(): void {
    const distance = distanceBetweenPointers(this.pointers);
    const center = centerOfPointers(this.pointers);
    if (distance === undefined || distance <= 0 || !center) return;
    if (this.pinchDistance !== undefined && this.pinchDistance > 0) {
      const scale = MathUtils.clamp(
        this.pinchDistance / distance,
        1 / pinchDistanceScaleLimit,
        pinchDistanceScaleLimit,
      );
      if (Math.abs(scale - 1) > 0.001) this.callbacks.zoomCamera(scale);
      if (this.pinchCenter) {
        const bounds = this.canvas.getBoundingClientRect();
        this.callbacks.panCamera(
          center.clientX - this.pinchCenter.clientX,
          center.clientY - this.pinchCenter.clientY,
          bounds.width,
          bounds.height,
        );
      }
    }
    this.pinchDistance = distance;
    this.pinchCenter = center;
  }

  private cameraGesturesAllowed(): boolean {
    return typeof this.cameraGesturesEnabled === 'function'
      ? this.cameraGesturesEnabled()
      : this.cameraGesturesEnabled;
  }

  private timeSwipeAllowed(): boolean {
    return typeof this.timeSwipeEnabled === 'function'
      ? this.timeSwipeEnabled()
      : this.timeSwipeEnabled;
  }

  private updateHover(clientX: number, clientY: number): void {
    const target = this.targetAt(clientX, clientY);
    this.canvas.style.cursor = target ? 'pointer' : '';
    this.callbacks.onHover(target);
  }

  private targetAt(clientX: number, clientY: number): DioramaTarget | undefined {
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

function centerOfPointers(pointers: ReadonlyMap<number, PointerContact>): PinchCenter | undefined {
  const [first, second] = [...pointers.values()];
  if (!first || !second) return undefined;
  return {
    clientX: (first.clientX + second.clientX) / 2,
    clientY: (first.clientY + second.clientY) / 2,
  };
}
