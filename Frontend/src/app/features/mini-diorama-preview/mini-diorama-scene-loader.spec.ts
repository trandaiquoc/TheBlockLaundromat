import { describe, expect, it, vi } from 'vitest';
import { loadMiniDioramaSceneAsset } from './mini-diorama-scene-loader';

describe('loadMiniDioramaSceneAsset', () => {
  it('reports an HTTP failure instead of returning an empty scene', async () => {
    const fetchAsset = vi.fn(async () => new Response(null, { status: 503 }));

    await expect(
      loadMiniDioramaSceneAsset(
        'https://example.test/app/',
        new AbortController().signal,
        fetchAsset,
      ),
    ).rejects.toThrow('HTTP 503');
    expect(fetchAsset).toHaveBeenCalledWith(
      new URL(
        'assets/homepage/runtime/models/laundromat/Laundromat.glb',
        'https://example.test/app/',
      ),
      { signal: expect.any(AbortSignal) },
    );
  });

  it('passes route cancellation to the asset request and stops before parsing', async () => {
    const controller = new AbortController();
    const fetchAsset = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.signal).toBe(controller.signal);
      controller.abort();
      return new Response(new ArrayBuffer(0));
    });

    await expect(
      loadMiniDioramaSceneAsset('https://example.test/app/', controller.signal, fetchAsset),
    ).rejects.toMatchObject({ name: 'AbortError' });
  });
});
