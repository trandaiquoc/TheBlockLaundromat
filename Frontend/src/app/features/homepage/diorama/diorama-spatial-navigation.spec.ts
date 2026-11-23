import { describe, expect, it } from 'vitest';
import { DioramaSpatialNavigation } from './diorama-spatial-navigation';

describe('DioramaSpatialNavigation', () => {
  it('opens a panel only after the matching camera request settles', () => {
    const navigation = new DioramaSpatialNavigation();
    const request = navigation.focus('project-board');

    expect(navigation.state()).toEqual({ phase: 'focusing', ...request });
    expect(navigation.cameraSettled(request.requestId + 1)).toBe(false);
    expect(navigation.state().phase).toBe('focusing');
    expect(navigation.cameraSettled(request.requestId)).toBe(true);
    expect(navigation.state()).toEqual({ phase: 'focused', target: 'project-board' });
  });

  it('ignores stale arrivals after an interrupted focus or return', () => {
    const navigation = new DioramaSpatialNavigation();
    const first = navigation.focus('courier');
    const second = navigation.focus('washer');

    expect(navigation.cameraSettled(first.requestId)).toBe(false);
    expect(navigation.cameraSettled(second.requestId)).toBe(true);
    const returning = navigation.back();
    expect(returning).toMatchObject({ target: 'overview' });
    const third = navigation.focus('project-board');

    expect(navigation.cameraSettled(returning!.requestId)).toBe(false);
    expect(navigation.cameraSettled(third.requestId)).toBe(true);
    expect(navigation.state()).toEqual({ phase: 'focused', target: 'project-board' });
  });

  it('returns to Overview from the active target and ignores Back while already there', () => {
    const navigation = new DioramaSpatialNavigation();
    expect(navigation.back()).toBeUndefined();
    const focus = navigation.focus('courier');
    navigation.cameraSettled(focus.requestId);
    const back = navigation.back();

    expect(back).toMatchObject({ target: 'overview' });
    expect(navigation.cameraSettled(back!.requestId)).toBe(true);
    expect(navigation.state()).toEqual({ phase: 'overview' });
  });
});
