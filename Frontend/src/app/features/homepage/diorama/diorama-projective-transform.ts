export interface ProjectedCorner {
  readonly x: number;
  readonly y: number;
}

/** Maps a CSS plane onto four viewport points using a projective CSS matrix. */
export function projectiveMatrix3dFromQuad(
  corners: readonly [ProjectedCorner, ProjectedCorner, ProjectedCorner, ProjectedCorner],
  sourceWidth: number,
  sourceHeight: number,
): readonly number[] | undefined {
  if (
    !Number.isFinite(sourceWidth) ||
    !Number.isFinite(sourceHeight) ||
    sourceWidth <= 0 ||
    sourceHeight <= 0
  ) {
    return undefined;
  }

  const [topLeft, topRight, bottomRight, bottomLeft] = corners;
  const deltaX1 = topRight.x - bottomRight.x;
  const deltaX2 = bottomLeft.x - bottomRight.x;
  const deltaX3 = topLeft.x - topRight.x + bottomRight.x - bottomLeft.x;
  const deltaY1 = topRight.y - bottomRight.y;
  const deltaY2 = bottomLeft.y - bottomRight.y;
  const deltaY3 = topLeft.y - topRight.y + bottomRight.y - bottomLeft.y;
  const determinant = deltaX1 * deltaY2 - deltaX2 * deltaY1;
  if (!Number.isFinite(determinant) || Math.abs(determinant) < 1e-8) return undefined;

  const perspectiveX = (deltaX3 * deltaY2 - deltaX2 * deltaY3) / determinant;
  const perspectiveY = (deltaX1 * deltaY3 - deltaX3 * deltaY1) / determinant;
  const xAcross = topRight.x - topLeft.x + perspectiveX * topRight.x;
  const xDown = bottomLeft.x - topLeft.x + perspectiveY * bottomLeft.x;
  const yAcross = topRight.y - topLeft.y + perspectiveX * topRight.y;
  const yDown = bottomLeft.y - topLeft.y + perspectiveY * bottomLeft.y;
  const values = [
    xAcross / sourceWidth,
    yAcross / sourceWidth,
    0,
    perspectiveX / sourceWidth,
    xDown / sourceHeight,
    yDown / sourceHeight,
    0,
    perspectiveY / sourceHeight,
    0,
    0,
    1,
    0,
    topLeft.x,
    topLeft.y,
    0,
    1,
  ];
  if (values.some((value) => !Number.isFinite(value))) return undefined;
  return values;
}

export function cssMatrix3d(values: readonly number[]): string {
  return `matrix3d(${values.map((value) => Number(value.toFixed(7))).join(',')})`;
}
