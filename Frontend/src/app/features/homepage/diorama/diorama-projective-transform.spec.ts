import { describe, expect, it } from 'vitest';
import { projectiveMatrix3dFromQuad } from './diorama-projective-transform';

describe('projectiveMatrix3dFromQuad', () => {
  it('maps a CSS plane to a perspective quadrilateral', () => {
    const corners = [
      { x: 31, y: 42 },
      { x: 410, y: 75 },
      { x: 365, y: 330 },
      { x: 12, y: 291 },
    ] as const;
    const width = 720;
    const height = 600;
    const matrix = projectiveMatrix3dFromQuad(corners, width, height);

    expect(matrix).toHaveLength(16);
    const projected = [
      transformPoint(matrix!, 0, 0),
      transformPoint(matrix!, width, 0),
      transformPoint(matrix!, width, height),
      transformPoint(matrix!, 0, height),
    ];
    projected.forEach((point, index) => {
      expect(point.x).toBeCloseTo(corners[index]!.x, 6);
      expect(point.y).toBeCloseTo(corners[index]!.y, 6);
    });
  });

  it('rejects invalid plane sizes and edge-on quadrilaterals', () => {
    const collapsed = [
      { x: 10, y: 10 },
      { x: 20, y: 20 },
      { x: 30, y: 30 },
      { x: 40, y: 40 },
    ] as const;
    expect(projectiveMatrix3dFromQuad(collapsed, 720, 600)).toBeUndefined();
    expect(projectiveMatrix3dFromQuad(collapsed, 0, 600)).toBeUndefined();
  });
});

function transformPoint(matrix: readonly number[], x: number, y: number) {
  const divisor = matrix[3]! * x + matrix[7]! * y + matrix[15]!;
  return {
    x: (matrix[0]! * x + matrix[4]! * y + matrix[12]!) / divisor,
    y: (matrix[1]! * x + matrix[5]! * y + matrix[13]!) / divisor,
  };
}
