import { describe, expect, it } from 'vitest';
import {
  miniDioramaTimeStageIndexAtProgress,
  miniDioramaTimeDirectionBetweenThemes,
  nearestMiniDioramaTimeProgress,
} from './mini-diorama-time-stages';

describe('mini-diorama time cycle', () => {
  it('maps every clock quarter to its matching time stage', () => {
    expect([0, 1, 2, 3].map(miniDioramaTimeStageIndexAtProgress)).toEqual([0, 1, 2, 3]);
    expect(miniDioramaTimeStageIndexAtProgress(3.7)).toBe(0);
    expect(miniDioramaTimeStageIndexAtProgress(-0.3)).toBe(0);
  });

  it('takes the adjacent route through midnight in either direction', () => {
    expect(nearestMiniDioramaTimeProgress(3, 0)).toBe(4);
    expect(nearestMiniDioramaTimeProgress(0, 3)).toBe(-1);
    expect(nearestMiniDioramaTimeProgress(3.8, 1)).toBe(5);
  });

  it('reports the shortest theme transition direction, including midnight', () => {
    expect(miniDioramaTimeDirectionBetweenThemes('dark', 'light')).toBe('clockwise');
    expect(miniDioramaTimeDirectionBetweenThemes('light', 'dark')).toBe('counterclockwise');
    expect(miniDioramaTimeDirectionBetweenThemes('raccoon', 'craft')).toBe('counterclockwise');
  });
});
