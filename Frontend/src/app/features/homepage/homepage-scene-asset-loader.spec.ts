import { describe, expect, it, vi } from 'vitest';
import type { HomepageSceneAsset } from './homepage-scene-manifest';
import { HomepageSceneAssetLoader } from './homepage-scene-asset-loader';

describe('homepage scene asset loader', () => {
  it('loads only the requested theme layers and reports resource size and duration', async () => {
    const bitmap = createBitmap(10, 20);
    const fetchAsset = vi.fn(async () => responseFor(new Blob(['image bytes'])));
    const decodeImage = vi.fn(async () => bitmap);
    const loader = new HomepageSceneAssetLoader(fetchAsset, decodeImage, () => 25);

    const result = await loader.load(
      [createAsset('washer')],
      (asset) => new URL(asset.file, 'https://example.test/'),
    );

    expect(fetchAsset).toHaveBeenCalledOnce();
    expect(decodeImage).toHaveBeenCalledOnce();
    expect(result.images.get('washer')).toBe(bitmap);
    expect(result.encodedBytes).toBe(11);
    expect(result.decodedBytesEstimate).toBe(800);
    expect(result.loadDurationMs).toBe(0);
    loader.dispose();
    expect(bitmap.close).toHaveBeenCalledOnce();
  });

  it('closes images decoded after the active request has been cancelled', async () => {
    let finishDecode: ((bitmap: ImageBitmap) => void) | undefined;
    const bitmap = createBitmap(10, 20);
    const fetchAsset = vi.fn(async () => responseFor(new Blob(['image'])));
    const decodeImage = vi.fn(
      () =>
        new Promise<ImageBitmap>((resolve) => {
          finishDecode = resolve;
        }),
    );
    const loader = new HomepageSceneAssetLoader(fetchAsset, decodeImage);

    const loading = loader.load(
      [createAsset('washer')],
      (asset) => new URL(asset.file, 'https://example.test/'),
    );
    await vi.waitFor(() => expect(decodeImage).toHaveBeenCalledOnce());
    loader.dispose();
    finishDecode?.(bitmap);

    await expect(loading).rejects.toMatchObject({ name: 'AbortError' });
    expect(bitmap.close).toHaveBeenCalledOnce();
  });
});

function responseFor(blob: Blob): Response {
  return {
    ok: true,
    status: 200,
    blob: async () => blob,
  } as Response;
}

function createAsset(id: string): HomepageSceneAsset {
  return {
    id,
    file: `assets/minecraft/${id}.png`,
    x: 0,
    y: 0,
    width: 10,
    height: 20,
    label: id,
    parent: null,
    kind: 'source-visible',
    interactive: true,
  };
}

function createBitmap(width: number, height: number): ImageBitmap {
  return { width, height, close: vi.fn() } as unknown as ImageBitmap;
}
