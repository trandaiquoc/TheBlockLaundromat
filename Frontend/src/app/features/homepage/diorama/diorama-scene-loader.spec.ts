import { describe, expect, it, vi } from 'vitest';
import { loadDioramaSceneAsset } from './diorama-scene-loader';
import { LAUNDROMAT_DIORAMA_PROFILE } from './diorama-scene-profile';

describe('loadDioramaSceneAsset', () => {
  it('loads the room contract once and reports HTTP failures clearly', async () => {
    const fetchAsset = vi.fn(async () => new Response(null, { status: 503 }));

    await expect(
      loadDioramaSceneAsset('https://example.test/app/', new AbortController().signal, fetchAsset),
    ).rejects.toThrow('Diorama room (HTTP 503)');
    expect(fetchAsset).toHaveBeenCalledOnce();
    expect(fetchAsset).toHaveBeenCalledWith(
      new URL(LAUNDROMAT_DIORAMA_PROFILE.roomAssetPath, 'https://example.test/app/'),
      { signal: expect.any(AbortSignal) },
    );
  });

  it('passes cancellation to the room request and stops before parsing', async () => {
    const controller = new AbortController();
    const fetchAsset = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.signal).toBe(controller.signal);
      controller.abort();
      return new Response(new ArrayBuffer(0));
    });

    await expect(
      loadDioramaSceneAsset('https://example.test/app/', controller.signal, fetchAsset),
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetchAsset).toHaveBeenCalledOnce();
  });
});
