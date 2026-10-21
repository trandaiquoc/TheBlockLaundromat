import type { HomespaceProjectionSurface, ScenePoint } from './homespace-scene-contract';

export type CssMatrix3d = readonly [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

const EPSILON = 1e-9;

export function projectiveMatrixForSurface(surface: HomespaceProjectionSurface): CssMatrix3d {
  const { width, height, corners } = surface;
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new RangeError('Projected surface dimensions must be positive finite numbers.');
  }
  if (corners.some(({ x, y }) => !Number.isFinite(x) || !Number.isFinite(y))) {
    throw new RangeError('Projected surface corners must contain finite coordinates.');
  }

  const [topLeft, topRight, bottomRight, bottomLeft] = corners;
  assertConvex(corners);

  const dx1 = topRight.x - bottomRight.x;
  const dx2 = bottomLeft.x - bottomRight.x;
  const dx3 = topLeft.x - topRight.x + bottomRight.x - bottomLeft.x;
  const dy1 = topRight.y - bottomRight.y;
  const dy2 = bottomLeft.y - bottomRight.y;
  const dy3 = topLeft.y - topRight.y + bottomRight.y - bottomLeft.y;
  const denominator = dx1 * dy2 - dx2 * dy1;

  if (Math.abs(denominator) < EPSILON) {
    throw new RangeError('Projected surface corners do not define a stable plane.');
  }

  const perspectiveX = (dx3 * dy2 - dx2 * dy3) / denominator;
  const perspectiveY = (dx1 * dy3 - dx3 * dy1) / denominator;
  const horizontalX = topRight.x - topLeft.x + perspectiveX * topRight.x;
  const horizontalY = topRight.y - topLeft.y + perspectiveX * topRight.y;
  const verticalX = bottomLeft.x - topLeft.x + perspectiveY * bottomLeft.x;
  const verticalY = bottomLeft.y - topLeft.y + perspectiveY * bottomLeft.y;

  return [
    horizontalX / width,
    horizontalY / width,
    0,
    perspectiveX / width,
    verticalX / height,
    verticalY / height,
    0,
    perspectiveY / height,
    0,
    0,
    1,
    0,
    topLeft.x,
    topLeft.y,
    0,
    1,
  ];
}

export function projectPointThroughMatrix(matrix: CssMatrix3d, point: ScenePoint): ScenePoint {
  const denominator = matrix[3] * point.x + matrix[7] * point.y + matrix[15];
  if (Math.abs(denominator) < EPSILON) {
    throw new RangeError('Point projects to an undefined position.');
  }

  return {
    x: (matrix[0] * point.x + matrix[4] * point.y + matrix[12]) / denominator,
    y: (matrix[1] * point.x + matrix[5] * point.y + matrix[13]) / denominator,
  };
}

export function cssMatrix3d(matrix: CssMatrix3d): string {
  return `matrix3d(${matrix.join(', ')})`;
}

function assertConvex(corners: HomespaceProjectionSurface['corners']): void {
  let expectedSign = 0;

  for (let index = 0; index < corners.length; index++) {
    const current = corners[index];
    const next = corners[(index + 1) % corners.length];
    const afterNext = corners[(index + 2) % corners.length];
    const crossProduct =
      (next.x - current.x) * (afterNext.y - next.y) - (next.y - current.y) * (afterNext.x - next.x);
    if (Math.abs(crossProduct) < EPSILON) {
      throw new RangeError('Projected surface corners cannot be collinear.');
    }

    const sign = Math.sign(crossProduct);
    if (expectedSign !== 0 && sign !== expectedSign) {
      throw new RangeError('Projected surface corners must form a convex quadrilateral.');
    }
    expectedSign = sign;
  }
}
