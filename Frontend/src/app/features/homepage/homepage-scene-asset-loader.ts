import type { HomepageSceneAsset } from './homepage-scene-manifest';

export interface LoadedHomepageSceneAssets {
  readonly images: ReadonlyMap<string, ImageBitmap>;
  readonly encodedBytes: number;
  readonly decodedBytesEstimate: number;
  readonly loadDurationMs: number;
}

type FetchAsset = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
type DecodeImage = (image: ImageBitmapSource) => Promise<ImageBitmap>;

export class HomepageSceneAssetLoader {
  private request?: AbortController;
  private bitmaps: ImageBitmap[] = [];

  constructor(
    private readonly fetchAsset: FetchAsset = globalThis.fetch.bind(globalThis),
    private readonly decodeImage: DecodeImage = globalThis.createImageBitmap.bind(globalThis),
    private readonly now: () => number = () => globalThis.performance.now(),
  ) {}

  async load(
    assets: readonly HomepageSceneAsset[],
    assetUrl: (asset: HomepageSceneAsset) => URL,
  ): Promise<LoadedHomepageSceneAssets> {
    this.dispose();
    const request = new AbortController();
    this.request = request;
    const startTime = this.now();
    const results = await Promise.allSettled(
      assets.map(async (asset) => {
        const response = await this.fetchAsset(assetUrl(asset), { signal: request.signal });
        if (!response.ok) {
          throw new Error(`Homepage image request failed (${response.status}): ${asset.id}.`);
        }
        const blob = await response.blob();
        const bitmap = await this.decodeImage(blob);
        if (request.signal.aborted) {
          bitmap.close();
          throw abortError();
        }
        return { asset, bitmap, encodedBytes: blob.size };
      }),
    );

    const fulfilled = results.flatMap((result) =>
      result.status === 'fulfilled' ? [result.value] : [],
    );
    const failure = results.find((result) => result.status === 'rejected');
    if (request.signal.aborted || failure) {
      for (const entry of fulfilled) entry.bitmap.close();
      if (this.request === request) this.request = undefined;
      if (request.signal.aborted) throw abortError();
      const reason = failure?.status === 'rejected' ? failure.reason : undefined;
      throw reason instanceof Error ? reason : new Error('Homepage images could not be loaded.');
    }

    this.bitmaps = fulfilled.map((entry) => entry.bitmap);
    const images = new Map(fulfilled.map(({ asset, bitmap }) => [asset.id, bitmap]));
    return {
      images,
      encodedBytes: fulfilled.reduce((total, entry) => total + entry.encodedBytes, 0),
      decodedBytesEstimate: fulfilled.reduce(
        (total, entry) => total + entry.bitmap.width * entry.bitmap.height * 4,
        0,
      ),
      loadDurationMs: this.now() - startTime,
    };
  }

  dispose(): void {
    this.request?.abort();
    this.request = undefined;
    for (const bitmap of this.bitmaps) bitmap.close();
    this.bitmaps = [];
  }
}

function abortError(): DOMException {
  return new DOMException('Homepage theme loading was cancelled.', 'AbortError');
}
