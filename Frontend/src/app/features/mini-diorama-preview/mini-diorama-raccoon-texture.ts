import * as THREE from 'three';

const atlasSize = 64;

export type MiniDioramaRaccoonTextureRegion =
  | 'face'
  | 'muzzle'
  | 'fur'
  | 'tail'
  | 'limb'
  | 'paw'
  | 'ear'
  | 'eye'
  | 'nose'
  | 'chest'
  | 'cream'
  | 'faceSide';

interface TextureRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

const textureRegions: Readonly<Record<MiniDioramaRaccoonTextureRegion, TextureRect>> = {
  face: { x: 0, y: 0, width: 16, height: 12 },
  muzzle: { x: 16, y: 0, width: 8, height: 8 },
  fur: { x: 24, y: 0, width: 16, height: 16 },
  tail: { x: 40, y: 0, width: 24, height: 8 },
  limb: { x: 0, y: 16, width: 8, height: 16 },
  paw: { x: 8, y: 16, width: 8, height: 8 },
  ear: { x: 16, y: 16, width: 8, height: 8 },
  eye: { x: 24, y: 16, width: 4, height: 4 },
  nose: { x: 28, y: 16, width: 4, height: 4 },
  chest: { x: 32, y: 16, width: 16, height: 16 },
  cream: { x: 48, y: 16, width: 8, height: 8 },
  faceSide: { x: 56, y: 16, width: 8, height: 12 },
};

const colors = {
  fur: [130, 121, 111],
  furLight: [162, 151, 138],
  furShade: [102, 94, 87],
  cream: [231, 220, 200],
  creamShade: [202, 187, 164],
  mask: [58, 52, 48],
  maskLight: [88, 78, 71],
  ink: [28, 27, 26],
  glint: [248, 240, 224],
  paw: [92, 73, 60],
  tail: [130, 118, 106],
  tailBand: [61, 55, 51],
  chest: [65, 59, 55],
} as const;

type ColorName = keyof typeof colors;

export function createMiniDioramaRaccoonTexture(): THREE.DataTexture {
  const pixels = new Uint8Array(atlasSize * atlasSize * 4);
  for (let pixel = 0; pixel < atlasSize * atlasSize; pixel++) pixels[pixel * 4 + 3] = 255;

  drawFur(pixels);
  drawFace(pixels);
  drawFaceSide(pixels);
  drawMuzzle(pixels);
  drawTail(pixels);
  drawLimbs(pixels);
  drawPaw(pixels);
  drawEar(pixels);
  drawSolidRegion(pixels, 'eye', 'ink');
  setPixel(pixels, 'eye', 0, 0, 'glint');
  drawSolidRegion(pixels, 'nose', 'ink');
  drawChest(pixels);
  drawSolidRegion(pixels, 'cream', 'cream');

  const texture = new THREE.DataTexture(pixels, atlasSize, atlasSize, THREE.RGBAFormat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

export function raccoonTextureRegionUv(
  regionName: MiniDioramaRaccoonTextureRegion,
): readonly [number, number, number, number] {
  const region = textureRegions[regionName];
  const inset = 0.5;
  const uMin = (region.x + inset) / atlasSize;
  const uMax = (region.x + region.width - inset) / atlasSize;
  const vMin = (region.y + inset) / atlasSize;
  const vMax = (region.y + region.height - inset) / atlasSize;
  return [uMin, vMin, uMax, vMax];
}

function drawFace(pixels: Uint8Array): void {
  fillRect(pixels, 'face', 0, 0, 16, 12, 'fur');
  fillRect(pixels, 'face', 3, 0, 10, 4, 'cream');
  setRect(pixels, 'face', 4, 0, 2, 1, 'creamShade');
  setRect(pixels, 'face', 10, 1, 1, 1, 'furLight');
  setRect(pixels, 'face', 2, 2, 1, 1, 'furShade');
  setRect(pixels, 'face', 13, 3, 1, 1, 'furShade');

  fillRect(pixels, 'face', 2, 4, 12, 1, 'maskLight');
  fillRect(pixels, 'face', 1, 5, 6, 2, 'mask');
  fillRect(pixels, 'face', 9, 5, 6, 2, 'mask');
  fillRect(pixels, 'face', 2, 7, 4, 1, 'mask');
  fillRect(pixels, 'face', 10, 7, 4, 1, 'mask');
  fillRect(pixels, 'face', 3, 8, 2, 1, 'maskLight');
  fillRect(pixels, 'face', 11, 8, 2, 1, 'maskLight');
  fillRect(pixels, 'face', 7, 4, 2, 6, 'cream');
  fillRect(pixels, 'face', 3, 5, 2, 2, 'creamShade');
  fillRect(pixels, 'face', 11, 5, 2, 2, 'creamShade');
  fillRect(pixels, 'face', 0, 8, 4, 3, 'cream');
  fillRect(pixels, 'face', 12, 8, 4, 3, 'cream');
  fillRect(pixels, 'face', 4, 10, 8, 2, 'creamShade');
  setRect(pixels, 'face', 1, 9, 2, 1, 'creamShade');
  setRect(pixels, 'face', 13, 9, 2, 1, 'creamShade');
  setPixel(pixels, 'face', 5, 2, 'creamShade');
  setPixel(pixels, 'face', 10, 3, 'creamShade');
}

function drawFur(pixels: Uint8Array): void {
  fillRect(pixels, 'fur', 0, 0, 16, 16, 'fur');
  for (const [x, y] of [
    [2, 2],
    [7, 1],
    [11, 4],
    [4, 7],
    [13, 8],
    [1, 12],
    [8, 11],
    [14, 14],
  ] as const) {
    setPixel(pixels, 'fur', x, y, (x + y) % 2 === 0 ? 'furLight' : 'furShade');
  }
}

function drawFaceSide(pixels: Uint8Array): void {
  fillRect(pixels, 'faceSide', 0, 0, 8, 12, 'fur');
  fillRect(pixels, 'faceSide', 5, 0, 3, 4, 'creamShade');
  fillRect(pixels, 'faceSide', 3, 4, 5, 3, 'mask');
  fillRect(pixels, 'faceSide', 5, 7, 3, 3, 'cream');
  setPixel(pixels, 'faceSide', 6, 3, 'furLight');
  setRect(pixels, 'faceSide', 4, 5, 2, 1, 'maskLight');
  setPixel(pixels, 'faceSide', 7, 8, 'creamShade');
}

function drawMuzzle(pixels: Uint8Array): void {
  fillRect(pixels, 'muzzle', 0, 0, 8, 8, 'cream');
  fillRect(pixels, 'muzzle', 0, 6, 8, 2, 'creamShade');
  setRect(pixels, 'muzzle', 0, 2, 1, 3, 'creamShade');
  setRect(pixels, 'muzzle', 7, 2, 1, 3, 'creamShade');
}

function drawTail(pixels: Uint8Array): void {
  const bandWidth = [4, 5, 4, 5, 6] as const;
  let x = 0;
  for (let band = 0; x < 24; band++) {
    const width = Math.min(bandWidth[band % bandWidth.length], 24 - x);
    const color: ColorName = band % 2 === 0 ? 'tail' : 'tailBand';
    fillRect(pixels, 'tail', x, 0, width, 8, color);
    if (band % 2 === 0) setRect(pixels, 'tail', x, 0, width, 1, 'furLight');
    x += width;
  }
}

function drawLimbs(pixels: Uint8Array): void {
  fillRect(pixels, 'limb', 0, 0, 8, 16, 'fur');
  fillRect(pixels, 'limb', 0, 11, 8, 5, 'paw');
  setRect(pixels, 'limb', 1, 2, 2, 1, 'furLight');
  setRect(pixels, 'limb', 5, 6, 2, 1, 'furShade');
  setPixel(pixels, 'limb', 3, 11, 'creamShade');
  setPixel(pixels, 'limb', 4, 12, 'creamShade');
}

function drawPaw(pixels: Uint8Array): void {
  fillRect(pixels, 'paw', 0, 0, 8, 8, 'paw');
  setRect(pixels, 'paw', 2, 1, 4, 1, 'furShade');
  setRect(pixels, 'paw', 2, 6, 4, 1, 'ink');
}

function drawEar(pixels: Uint8Array): void {
  fillRect(pixels, 'ear', 0, 0, 8, 8, 'fur');
  fillRect(pixels, 'ear', 2, 2, 4, 4, 'maskLight');
  fillRect(pixels, 'ear', 3, 3, 2, 2, 'paw');
  setRect(pixels, 'ear', 0, 0, 8, 1, 'furLight');
}

function drawChest(pixels: Uint8Array): void {
  fillRect(pixels, 'chest', 0, 0, 16, 16, 'chest');
  for (const [x, y] of [
    [3, 2],
    [11, 4],
    [6, 7],
    [13, 9],
    [2, 12],
    [9, 14],
  ] as const) {
    setPixel(pixels, 'chest', x, y, 'maskLight');
  }
  fillRect(pixels, 'chest', 0, 15, 16, 1, 'ink');
}

function drawSolidRegion(
  pixels: Uint8Array,
  region: MiniDioramaRaccoonTextureRegion,
  color: ColorName,
): void {
  const { width, height } = textureRegions[region];
  fillRect(pixels, region, 0, 0, width, height, color);
}

function fillRect(
  pixels: Uint8Array,
  regionName: MiniDioramaRaccoonTextureRegion,
  x: number,
  y: number,
  width: number,
  height: number,
  color: ColorName,
): void {
  for (let row = y; row < y + height; row++) {
    for (let column = x; column < x + width; column++) {
      setPixel(pixels, regionName, column, row, color);
    }
  }
}

function setRect(
  pixels: Uint8Array,
  regionName: MiniDioramaRaccoonTextureRegion,
  x: number,
  y: number,
  width: number,
  height: number,
  color: ColorName,
): void {
  fillRect(pixels, regionName, x, y, width, height, color);
}

function setPixel(
  pixels: Uint8Array,
  regionName: MiniDioramaRaccoonTextureRegion,
  x: number,
  y: number,
  color: ColorName,
): void {
  const region = textureRegions[regionName];
  const pixelX = region.x + x;
  const pixelY = region.y + y;
  const pixelIndex = (pixelY * atlasSize + pixelX) * 4;
  const [red, green, blue] = colors[color];
  pixels[pixelIndex] = red;
  pixels[pixelIndex + 1] = green;
  pixels[pixelIndex + 2] = blue;
  pixels[pixelIndex + 3] = 255;
}
