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
  face: { x: 0, y: 0, width: 16, height: 16 },
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
  fur: [137, 128, 117],
  furLight: [172, 160, 145],
  furShade: [105, 96, 88],
  cream: [237, 226, 207],
  creamShade: [207, 190, 166],
  mask: [77, 69, 63],
  maskLight: [108, 96, 85],
  ink: [27, 25, 24],
  glint: [255, 246, 222],
  paw: [90, 69, 57],
  tail: [151, 138, 122],
  tailBand: [60, 55, 53],
  chest: [91, 82, 75],
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
  fillRect(pixels, 'face', 0, 0, 16, 16, 'fur');
  fillRect(pixels, 'face', 3, 0, 10, 1, 'cream');
  fillRect(pixels, 'face', 2, 1, 12, 2, 'cream');
  fillRect(pixels, 'face', 4, 3, 8, 1, 'cream');
  fillRect(pixels, 'face', 4, 0, 2, 1, 'creamShade');
  fillRect(pixels, 'face', 8, 1, 2, 1, 'furLight');
  fillRect(pixels, 'face', 11, 2, 2, 1, 'creamShade');
  setPixel(pixels, 'face', 2, 0, 'furLight');
  setPixel(pixels, 'face', 13, 1, 'furShade');
  setPixel(pixels, 'face', 1, 3, 'furShade');
  setPixel(pixels, 'face', 14, 3, 'furLight');

  fillRect(pixels, 'face', 2, 4, 4, 1, 'maskLight');
  fillRect(pixels, 'face', 10, 4, 4, 1, 'maskLight');
  fillRect(pixels, 'face', 1, 5, 6, 2, 'mask');
  fillRect(pixels, 'face', 9, 5, 6, 2, 'mask');
  fillRect(pixels, 'face', 6, 5, 4, 1, 'maskLight');
  fillRect(pixels, 'face', 2, 7, 4, 1, 'maskLight');
  fillRect(pixels, 'face', 10, 7, 4, 1, 'maskLight');
  setPixel(pixels, 'face', 0, 6, 'maskLight');
  setPixel(pixels, 'face', 15, 6, 'maskLight');

  fillRect(pixels, 'face', 7, 4, 2, 7, 'cream');
  fillRect(pixels, 'face', 4, 8, 3, 2, 'cream');
  fillRect(pixels, 'face', 9, 8, 3, 2, 'cream');
  fillRect(pixels, 'face', 3, 10, 10, 4, 'cream');
  fillRect(pixels, 'face', 4, 14, 8, 2, 'creamShade');
  setPixel(pixels, 'face', 3, 9, 'creamShade');
  setPixel(pixels, 'face', 12, 9, 'creamShade');
  setPixel(pixels, 'face', 4, 12, 'creamShade');
  setPixel(pixels, 'face', 11, 12, 'creamShade');
}

function drawFaceSide(pixels: Uint8Array): void {
  fillRect(pixels, 'faceSide', 0, 0, 8, 12, 'fur');
  fillRect(pixels, 'faceSide', 4, 0, 4, 3, 'cream');
  fillRect(pixels, 'faceSide', 2, 4, 6, 4, 'mask');
  fillRect(pixels, 'faceSide', 5, 8, 3, 3, 'cream');
  setPixel(pixels, 'faceSide', 6, 3, 'furLight');
  setRect(pixels, 'faceSide', 4, 5, 2, 1, 'maskLight');
  setPixel(pixels, 'faceSide', 7, 10, 'creamShade');
}

function drawFur(pixels: Uint8Array): void {
  fillRect(pixels, 'fur', 0, 0, 16, 16, 'fur');
  fillRect(pixels, 'fur', 0, 0, 16, 2, 'furLight');
  fillRect(pixels, 'fur', 0, 14, 16, 2, 'furShade');
  setRect(pixels, 'fur', 2, 4, 3, 1, 'furLight');
  setRect(pixels, 'fur', 10, 6, 2, 1, 'furShade');
  setRect(pixels, 'fur', 5, 10, 2, 1, 'furLight');
  setRect(pixels, 'fur', 12, 12, 2, 1, 'furShade');
}

function drawMuzzle(pixels: Uint8Array): void {
  fillRect(pixels, 'muzzle', 0, 0, 8, 8, 'cream');
  fillRect(pixels, 'muzzle', 0, 6, 8, 2, 'creamShade');
  setRect(pixels, 'muzzle', 0, 2, 1, 3, 'creamShade');
  setRect(pixels, 'muzzle', 7, 2, 1, 3, 'creamShade');
  setPixel(pixels, 'muzzle', 3, 6, 'maskLight');
}

function drawTail(pixels: Uint8Array): void {
  for (let column = 0; column < 24; column++) {
    const band = Math.floor(column / 4);
    const color: ColorName = band % 2 === 0 ? 'tail' : 'tailBand';
    fillRect(pixels, 'tail', column, 0, 1, 8, color);
    if (band % 2 === 0) setPixel(pixels, 'tail', column, 0, 'furLight');
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
  fillRect(pixels, 'chest', 3, 4, 10, 8, 'furShade');
  fillRect(pixels, 'chest', 5, 5, 6, 6, 'fur');
  setRect(pixels, 'chest', 2, 2, 2, 1, 'maskLight');
  setRect(pixels, 'chest', 12, 13, 2, 1, 'maskLight');
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
