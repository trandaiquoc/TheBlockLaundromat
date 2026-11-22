import { describe, expect, it } from 'vitest';
import {
  dioramaTimeStageIndexAtProgress,
  dioramaTimeDirectionBetweenThemes,
  nearestDioramaTimeProgress,
} from './diorama-time-stages';

describe('diorama time cycle', () => {
  it('maps every clock quarter to its matching time stage', () => {
    expect([0, 1, 2, 3].map(dioramaTimeStageIndexAtProgress)).toEqual([0, 1, 2, 3]);
    expect(dioramaTimeStageIndexAtProgress(3.7)).toBe(0);
    expect(dioramaTimeStageIndexAtProgress(-0.3)).toBe(0);
  });

  it('takes the adjacent route through midnight in either direction', () => {
    expect(nearestDioramaTimeProgress(3, 0)).toBe(4);
    expect(nearestDioramaTimeProgress(0, 3)).toBe(-1);
    expect(nearestDioramaTimeProgress(3.8, 1)).toBe(5);
  });

  it('reports the shortest theme transition direction, including midnight', () => {
    expect(dioramaTimeDirectionBetweenThemes('dark', 'light')).toBe('clockwise');
    expect(dioramaTimeDirectionBetweenThemes('light', 'dark')).toBe('counterclockwise');
    expect(dioramaTimeDirectionBetweenThemes('raccoon', 'craft')).toBe('counterclockwise');
  });
});
