import { Raycaster, Vector2 } from 'three';
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

interface PointerPress {
  readonly pointerId: number;
  readonly clientX: number;
  readonly clientY: number;
  readonly button: number;
}

const dragThresholdPixels = 8;

export class MiniDioramaInteractionController {
  private readonly raycaster = new Raycaster();
  private readonly pointer = new Vector2();
  private readonly targetByRoot: ReadonlyMap<Object3D, MiniDioramaTarget>;
  private press?: PointerPress;
  private disposed = false;

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (!event.isPrimary || (event.pointerType !== 'touch' && event.button !== 0)) return;
    this.press = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      button: event.button,
    };
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    const press = this.press;
    this.press = undefined;
    if (!press || press.pointerId !== event.pointerId || press.button !== event.button) return;
    if (
      Math.hypot(event.clientX - press.clientX, event.clientY - press.clientY) > dragThresholdPixels
    ) {
      return;
    }
    const target = this.targetAt(event.clientX, event.clientY);
    if (target) this.onIntent(intentForSceneTarget(target));
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    const target = this.targetAt(event.clientX, event.clientY);
    this.canvas.style.cursor = target ? 'pointer' : '';
    this.onHover(target);
  };

  private readonly onPointerLeave = (): void => {
    this.press = undefined;
    this.canvas.style.cursor = '';
    this.onHover(undefined);
  };

  private readonly onPointerCancel = (): void => {
    this.press = undefined;
  };

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly camera: Camera,
    roots: readonly InteractionRoot[],
    private readonly onIntent: (intent: MiniDioramaIntent) => void,
    private readonly onHover: (target: MiniDioramaTarget | undefined) => void,
  ) {
    this.targetByRoot = new Map(roots.map(({ object, target }) => [object, target]));
    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointerup', this.onPointerUp);
    canvas.addEventListener('pointermove', this.onPointerMove);
    canvas.addEventListener('pointerleave', this.onPointerLeave);
    canvas.addEventListener('pointercancel', this.onPointerCancel);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.press = undefined;
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerleave', this.onPointerLeave);
    this.canvas.removeEventListener('pointercancel', this.onPointerCancel);
    this.canvas.style.cursor = '';
    this.onHover(undefined);
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
