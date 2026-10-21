import { describe, expect, it } from 'vitest';
import type { HomespaceProjectionSurface } from './homespace-scene-contract';
import {
  cssMatrix3d,
  projectPointThroughMatrix,
  projectiveMatrixForSurface,
} from './homespace-projective-transform';

describe('projectiveMatrixForSurface', () => {
  const surface: HomespaceProjectionSurface = {
    id: 'test-surface',
    width: 100,
    height: 80,
    corners: [
      { x: 70, y: 20 },
      { x: 280, y: 45 },
      { x: 240, y: 210 },
      { x: 45, y: 190 },
    ],
  };

  it('maps each local corner to the matching perspective corner', () => {
    const matrix = projectiveMatrixForSurface(surface);
    const localCorners = [
      { x: 0, y: 0 },
      { x: surface.width, y: 0 },
      { x: surface.width, y: surface.height },
      { x: 0, y: surface.height },
    ] as const;

    for (const [index, localCorner] of localCorners.entries()) {
      expect(projectPointThroughMatrix(matrix, localCorner).x).toBeCloseTo(
        surface.corners[index].x,
        8,
      );
      expect(projectPointThroughMatrix(matrix, localCorner).y).toBeCloseTo(
        surface.corners[index].y,
        8,
      );
    }
  });

  it('serializes a CSS matrix3d for the transformed hit surface', () => {
    const transform = cssMatrix3d(projectiveMatrixForSurface(surface));

    expect(transform).toMatch(/^matrix3d\(/);
    expect(transform.split(',')).toHaveLength(16);
  });

  it('rejects invalid planes rather than creating misplaced UI hitboxes', () => {
    expect(() => projectiveMatrixForSurface({ ...surface, width: 0 })).toThrow(RangeError);
    expect(() =>
      projectiveMatrixForSurface({
        ...surface,
        corners: [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 20, y: 20 },
          { x: 0, y: 100 },
        ],
      }),
    ).toThrow(RangeError);
  });
});
