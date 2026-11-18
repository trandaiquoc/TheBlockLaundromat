import type { Object3D } from 'three';

const greetingDurationSeconds = 0.72;
const greetingAmplitude = 0.62;
const maximumMotionDeltaSeconds = 0.05;
const tailIdleAmplitude = 0.035;
const headIdleAmplitude = 0.012;

export class MiniDioramaRaccoonController {
  private readonly wavingLeg: Object3D;
  private readonly head: Object3D;
  private readonly tail: Object3D;
  private readonly baseLegRotation: number;
  private readonly baseHeadRotation: number;
  private readonly baseTailRotation: number;
  private elapsed = 0;
  private greetingElapsed?: number;
  private reducedMotion = false;
  private disposed = false;

  constructor(private readonly root: Object3D) {
    const wavingLeg = root.getObjectByName('ForelegL');
    if (!wavingLeg) {
      throw new Error("The laundromat Raccoon is missing its 'ForelegL' greeting joint.");
    }
    const head = findNamedPart(root, 'Head_');
    const tail = findNamedPart(root, 'Tail_');
    if (!head || !tail) {
      throw new Error('The laundromat Raccoon is missing its head or tail motion joint.');
    }
    this.wavingLeg = wavingLeg;
    this.head = head;
    this.tail = tail;
    this.baseLegRotation = wavingLeg.rotation.z;
    this.baseHeadRotation = head.rotation.x;
    this.baseTailRotation = tail.rotation.y;
  }

  get isGreeting(): boolean {
    return this.greetingElapsed !== undefined;
  }

  greet(): void {
    if (this.disposed || this.reducedMotion) return;
    this.greetingElapsed = 0;
  }

  setReducedMotion(reducedMotion: boolean): void {
    if (this.disposed || this.reducedMotion === reducedMotion) return;
    this.reducedMotion = reducedMotion;
    if (reducedMotion) this.resetGreeting();
  }

  update(deltaSeconds: number): void {
    if (this.disposed || this.reducedMotion) return;
    const delta = Math.max(0, Math.min(deltaSeconds, maximumMotionDeltaSeconds));
    this.elapsed += delta;
    this.head.rotation.x = this.baseHeadRotation + Math.sin(this.elapsed * 1.4) * headIdleAmplitude;
    this.tail.rotation.y = this.baseTailRotation + Math.sin(this.elapsed * 0.9) * tailIdleAmplitude;

    if (this.greetingElapsed === undefined) return;
    this.greetingElapsed += delta;

    const progress = this.greetingElapsed / greetingDurationSeconds;
    if (progress >= 1) {
      this.resetGreeting();
      return;
    }

    const envelope = Math.sin(Math.PI * progress);
    const wave = Math.sin(Math.PI * progress * 4);
    this.wavingLeg.rotation.z = this.baseLegRotation + envelope * wave * greetingAmplitude;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.resetGreeting();
  }

  private resetGreeting(): void {
    this.greetingElapsed = undefined;
    this.wavingLeg.rotation.z = this.baseLegRotation;
    this.head.rotation.x = this.baseHeadRotation;
    this.tail.rotation.y = this.baseTailRotation;
  }
}

function findNamedPart(root: Object3D, prefix: string): Object3D | undefined {
  let match: Object3D | undefined;
  root.traverse((object) => {
    if (!match && object.name.startsWith(prefix)) match = object;
  });
  return match;
}
