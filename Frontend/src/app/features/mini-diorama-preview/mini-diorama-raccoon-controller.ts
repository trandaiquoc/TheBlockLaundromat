import {
  AnimationMixer,
  LoopOnce,
  LoopRepeat,
  type AnimationAction,
  type AnimationClip,
  type Object3D,
} from 'three';

const requiredAnimationNames = ['idle', 'sit', 'greet'] as const;
const crossFadeSeconds = 0.14;
const maximumAnimationDeltaSeconds = 0.05;

export class MiniDioramaRaccoonController {
  private readonly mixer: AnimationMixer;
  private readonly actions: ReadonlyMap<string, AnimationAction>;
  private activeAction?: AnimationAction;
  private reducedMotion = false;
  private disposed = false;

  private readonly onAnimationFinished = (event: { action: AnimationAction }): void => {
    if (event.action !== this.activeAction || this.reducedMotion || this.disposed) return;
    if (event.action.getClip().name !== 'idle') this.play('idle');
  };

  constructor(
    private readonly root: Object3D,
    animations: readonly AnimationClip[],
  ) {
    const clipsByName = new Map(animations.map((clip) => [clip.name, clip]));
    for (const name of requiredAnimationNames) {
      if (!clipsByName.has(name)) {
        throw new Error(`The Raccoon GLB is missing the required '${name}' animation.`);
      }
    }

    this.mixer = new AnimationMixer(root);
    this.actions = new Map(
      [...clipsByName].map(([name, clip]) => [name, this.mixer.clipAction(clip)]),
    );
    this.mixer.addEventListener('finished', this.onAnimationFinished);
    this.play('idle');
  }

  get currentAnimation(): string | undefined {
    return this.activeAction?.getClip().name;
  }

  get isGreeting(): boolean {
    return this.currentAnimation === 'greet';
  }

  greet(): void {
    this.play('greet');
  }

  sit(): void {
    this.play('sit');
  }

  setReducedMotion(reducedMotion: boolean): void {
    if (this.disposed || this.reducedMotion === reducedMotion) return;
    this.reducedMotion = reducedMotion;
    if (reducedMotion) {
      this.mixer.stopAllAction();
      this.activeAction = undefined;
    } else {
      this.play('idle');
    }
  }

  update(deltaSeconds: number): void {
    if (this.disposed || this.reducedMotion) return;
    this.mixer.update(Math.max(0, Math.min(deltaSeconds, maximumAnimationDeltaSeconds)));
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.mixer.removeEventListener('finished', this.onAnimationFinished);
    this.mixer.stopAllAction();
    this.mixer.uncacheRoot(this.root);
    this.activeAction = undefined;
  }

  private play(name: string): void {
    if (this.disposed || this.reducedMotion) return;
    const action = this.actions.get(name);
    if (!action) throw new Error(`The Raccoon GLB has no '${name}' animation action.`);
    if (action === this.activeAction) {
      action.reset().play();
      return;
    }

    const previousAction = this.activeAction;
    action.reset();
    action.setLoop(name === 'idle' ? LoopRepeat : LoopOnce, name === 'idle' ? Infinity : 1);
    action.clampWhenFinished = name !== 'idle';
    action.play();
    if (previousAction) action.crossFadeFrom(previousAction, crossFadeSeconds, true);
    this.activeAction = action;
  }
}
