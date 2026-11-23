import { signal } from '@angular/core';
import type { DioramaTarget } from './diorama-contracts';

export type DioramaNavigationState =
  | { readonly phase: 'overview' }
  | { readonly phase: 'focusing'; readonly requestId: number; readonly target: DioramaTarget }
  | { readonly phase: 'focused'; readonly target: DioramaTarget }
  | { readonly phase: 'returning'; readonly requestId: number; readonly target: DioramaTarget };

export interface DioramaCameraRequest {
  readonly requestId: number;
  readonly target: 'overview' | DioramaTarget;
}

/** Owns the single UI navigation state and correlates it with camera arrivals. */
export class DioramaSpatialNavigation {
  readonly state = signal<DioramaNavigationState>({ phase: 'overview' });
  private nextRequestId = 0;

  focus(target: DioramaTarget): DioramaCameraRequest {
    const request = { requestId: ++this.nextRequestId, target } as const;
    this.state.set({ phase: 'focusing', ...request });
    return request;
  }

  back(): DioramaCameraRequest | undefined {
    const state = this.state();
    if (state.phase === 'overview') return undefined;
    const target = state.target;
    const request = { requestId: ++this.nextRequestId, target: 'overview' } as const;
    this.state.set({ phase: 'returning', requestId: request.requestId, target });
    return request;
  }

  cameraSettled(requestId: number): boolean {
    const state = this.state();
    if (state.phase === 'focusing' && state.requestId === requestId) {
      this.state.set({ phase: 'focused', target: state.target });
      return true;
    }
    if (state.phase === 'returning' && state.requestId === requestId) {
      this.state.set({ phase: 'overview' });
      return true;
    }
    return false;
  }

  cameraRequest(): DioramaCameraRequest | undefined {
    const state = this.state();
    if (state.phase === 'focusing') {
      return { requestId: state.requestId, target: state.target };
    }
    if (state.phase === 'returning') {
      return { requestId: state.requestId, target: 'overview' };
    }
    return undefined;
  }
}
