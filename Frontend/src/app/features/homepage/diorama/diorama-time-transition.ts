export type DioramaTimeTransitionPhase = 'idle' | 'dragging' | 'settling';
export type DioramaTimeTransitionSource = 'clock' | 'swipe' | 'theme';

export interface DioramaTimeTransition {
  readonly id: number;
  readonly phase: DioramaTimeTransitionPhase;
  readonly progress: number;
  readonly targetProgress: number;
  readonly source: DioramaTimeTransitionSource;
}

export interface DioramaTimeAnimationUpdate {
  readonly id: number;
  readonly progress: number;
  readonly finished: boolean;
}
