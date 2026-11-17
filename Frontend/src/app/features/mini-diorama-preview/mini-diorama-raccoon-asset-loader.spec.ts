import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadMiniDioramaRaccoonAsset } from './mini-diorama-raccoon-asset-loader';

afterEach(() => vi.unstubAllGlobals());

describe('loadMiniDioramaRaccoonAsset', () => {
  it('reports an HTTP failure instead of returning an empty model', async () => {
    const fetchAsset = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit): Promise<Response> =>
        ({ ok: false, status: 503 }) as Response,
    );
    vi.stubGlobal('fetch', fetchAsset);

    await expect(
      loadMiniDioramaRaccoonAsset('https://example.test/app/', new AbortController().signal),
    ).rejects.toThrow('HTTP 503');
    expect(fetchAsset).toHaveBeenCalledWith(
      new URL(
        'https://example.test/app/assets/homepage/runtime/models/raccoon/puddlepaw-raccoon.glb',
      ),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('passes route cancellation through to the asset request', async () => {
    let requestSignal: AbortSignal | undefined;
    const fetchAsset = vi.fn(
      (_input: RequestInfo | URL, init?: RequestInit): Promise<Response> =>
        new Promise((_resolve, reject) => {
          requestSignal = init?.signal ?? undefined;
          requestSignal?.addEventListener(
            'abort',
            () => reject(new DOMException('The request was aborted.', 'AbortError')),
            { once: true },
          );
        }),
    );
    vi.stubGlobal('fetch', fetchAsset);
    const abortController = new AbortController();
    const pending = loadMiniDioramaRaccoonAsset(
      'https://example.test/app/',
      abortController.signal,
    );

    abortController.abort();

    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    expect(requestSignal?.aborted).toBe(true);
  });
});
