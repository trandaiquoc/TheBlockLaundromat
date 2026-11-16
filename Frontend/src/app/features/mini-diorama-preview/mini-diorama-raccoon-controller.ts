import type { Group, Object3D } from 'three';

export interface MiniDioramaRaccoonRig {
  readonly body: Group;
  readonly head: Group;
  readonly tail: Group;
  readonly leftEar: Group;
  readonly rightEar: Group;
  readonly greetingArm: Group;
  readonly eyeLids: readonly Object3D[];
}

const greetingDurationSeconds = 0.9;

export class MiniDioramaRaccoonController {
  private elapsedSeconds = 0;
  private greetingRemainingSeconds = 0;
  private reducedMotion = false;
  private readonly bodyRestY: number;
  private readonly bodyRestScaleY: number;
  private readonly headRestRotationZ: number;
  private readonly tailRestRotationZ: number;
  private readonly leftEarRestRotationZ: number;
  private readonly rightEarRestRotationZ: number;
  private readonly armRestRotationZ: number;

  constructor(private readonly rig: MiniDioramaRaccoonRig) {
    this.bodyRestY = rig.body.position.y;
    this.bodyRestScaleY = rig.body.scale.y;
    this.headRestRotationZ = rig.head.rotation.z;
    this.tailRestRotationZ = rig.tail.rotation.z;
    this.leftEarRestRotationZ = rig.leftEar.rotation.z;
    this.rightEarRestRotationZ = rig.rightEar.rotation.z;
    this.armRestRotationZ = rig.greetingArm.rotation.z;
  }

  get isGreeting(): boolean {
    return this.greetingRemainingSeconds > 0;
  }

  greet(): void {
    this.greetingRemainingSeconds = this.reducedMotion ? 0 : greetingDurationSeconds;
  }

  setReducedMotion(reducedMotion: boolean): void {
    this.reducedMotion = reducedMotion;
    if (reducedMotion) {
      this.greetingRemainingSeconds = 0;
      this.applyRestPose();
    }
  }

  update(deltaSeconds: number): void {
    if (this.reducedMotion) return;
    const delta = Math.max(0, Math.min(deltaSeconds, 0.05));
    this.elapsedSeconds += delta;
    this.greetingRemainingSeconds = Math.max(0, this.greetingRemainingSeconds - delta);

    const breathe = Math.sin(this.elapsedSeconds * 1.9);
    this.rig.body.position.y = this.bodyRestY + breathe * 0.018;
    this.rig.body.scale.y = this.bodyRestScaleY + breathe * 0.008;
    this.rig.head.rotation.z = this.headRestRotationZ + Math.sin(this.elapsedSeconds * 0.8) * 0.025;
    this.rig.tail.rotation.z = this.tailRestRotationZ + Math.sin(this.elapsedSeconds * 1.35) * 0.11;
    this.rig.leftEar.rotation.z =
      this.leftEarRestRotationZ + Math.sin(this.elapsedSeconds * 1.7) * 0.045;
    this.rig.rightEar.rotation.z =
      this.rightEarRestRotationZ - Math.sin(this.elapsedSeconds * 1.7) * 0.04;

    const greetingProgress = 1 - this.greetingRemainingSeconds / greetingDurationSeconds;
    const greetingWeight =
      this.greetingRemainingSeconds > 0
        ? smoothStep(0, 0.16, greetingProgress) * (1 - smoothStep(0.74, 1, greetingProgress))
        : 0;
    const wave = Math.sin(greetingProgress * Math.PI * 8) * 0.08;
    this.rig.greetingArm.rotation.z = this.armRestRotationZ + greetingWeight * (2.05 + wave);

    const blinkPhase = this.elapsedSeconds % 4.7;
    const blinkScale = blinkPhase > 4.48 && blinkPhase < 4.62 ? 0.12 : 1;
    for (const eyelid of this.rig.eyeLids) eyelid.scale.y = blinkScale;
  }

  private applyRestPose(): void {
    this.rig.body.position.y = this.bodyRestY;
    this.rig.body.scale.y = this.bodyRestScaleY;
    this.rig.head.rotation.z = this.headRestRotationZ;
    this.rig.tail.rotation.z = this.tailRestRotationZ;
    this.rig.leftEar.rotation.z = this.leftEarRestRotationZ;
    this.rig.rightEar.rotation.z = this.rightEarRestRotationZ;
    this.rig.greetingArm.rotation.z = this.armRestRotationZ;
    for (const eyelid of this.rig.eyeLids) eyelid.scale.y = 1;
  }
}

function smoothStep(start: number, end: number, value: number): number {
  const amount = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return amount * amount * (3 - 2 * amount);
}
