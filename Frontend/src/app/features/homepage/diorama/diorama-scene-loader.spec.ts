import { describe, expect, it, vi } from 'vitest';
import { loadDioramaSceneAsset } from './diorama-scene-loader';
import { LAUNDROMAT_DIORAMA_PROFILE } from './diorama-scene-profile';

describe('loadDioramaSceneAsset', () => {
  it('loads the room and replacement washer contract and reports HTTP failures clearly', async () => {
    const fetchAsset = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) => new Response(null, { status: 503 }),
    );

    await expect(
      loadDioramaSceneAsset('https://example.test/app/', new AbortController().signal, fetchAsset),
    ).rejects.toThrow('Diorama room (HTTP 503)');
    expect(fetchAsset).toHaveBeenCalledTimes(2);
    const requestedAssets = fetchAsset.mock.calls.map(([input]) => String(input));
    expect(requestedAssets).toContain(
      new URL(LAUNDROMAT_DIORAMA_PROFILE.roomAssetPath, 'https://example.test/app/').href,
    );
    expect(requestedAssets).toContain(
      new URL(LAUNDROMAT_DIORAMA_PROFILE.washerAssetPath, 'https://example.test/app/').href,
    );
    expect(fetchAsset.mock.calls.every(([, init]) => init?.signal instanceof AbortSignal)).toBe(
      true,
    );
  });

  it('passes cancellation to both model requests and stops before parsing', async () => {
    const controller = new AbortController();
    const fetchAsset = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.signal).toBe(controller.signal);
      controller.abort();
      return new Response(new ArrayBuffer(0));
    });

    await expect(
      loadDioramaSceneAsset('https://example.test/app/', controller.signal, fetchAsset),
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetchAsset).toHaveBeenCalledTimes(2);
    expect(fetchAsset.mock.calls.every(([, init]) => init?.signal === controller.signal)).toBe(
      true,
    );
  });
});
