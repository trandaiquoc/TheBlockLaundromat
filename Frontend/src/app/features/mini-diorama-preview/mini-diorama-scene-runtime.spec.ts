import { AnimationClip, BoxGeometry, DataTexture, Group, Mesh, MeshStandardMaterial } from 'three';
import type { WebGLRenderer } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  MiniDioramaSceneRuntime,
  type MiniDioramaRuntimeAdapters,
  type MiniDioramaRuntimeCallbacks,
} from './mini-diorama-scene-runtime';
import type { MiniDioramaRaccoonAsset } from './mini-diorama-raccoon-asset-loader';

afterEach(() => vi.unstubAllGlobals());

describe('MiniDioramaSceneRuntime', () => {
  it('waits for the authored asset and releases scene, animation, listener, and renderer resources', async () => {
    const host = createHost();
    const renderer = createRenderer();
    const asset = createAsset();
    const assetMaterial = (asset.root.children[0] as Mesh).material as MeshStandardMaterial;
    if (!assetMaterial.map) throw new Error('The test Raccoon texture was not built.');
    const textureDispose = vi.spyOn(assetMaterial.map, 'dispose');
    const removeDocumentListener = vi.spyOn(document, 'removeEventListener');
    vi.stubGlobal('ResizeObserver', TestResizeObserver);
    const frames = new Map<number, FrameRequestCallback>();
    let nextFrameId = 0;
    const requestFrame = vi.fn((callback: FrameRequestCallback) => {
      const id = ++nextFrameId;
      frames.set(id, callback);
      return id;
    });
    const cancelFrame = vi.fn((id: number) => frames.delete(id));
    const onRaccoonLoaded = vi.fn();
    const adapters: Partial<MiniDioramaRuntimeAdapters> = {
      createRenderer: vi.fn(() => renderer),
      requestFrame,
      cancelFrame,
      loadRaccoonAsset: vi.fn(async () => asset),
    };
    const runtime = new MiniDioramaSceneRuntime(createCallbacks({ onRaccoonLoaded }), adapters);

    expect(runtime.mount(host)).toBe(true);
    expect(host.querySelectorAll('canvas')).toHaveLength(1);
    expect(onRaccoonLoaded).not.toHaveBeenCalled();
    const canvas = host.querySelector('canvas');
    expect(canvas).not.toBeNull();
    const removeCanvasListener = vi.spyOn(canvas!, 'removeEventListener');
    expect(renderer.setSize).toHaveBeenCalledWith(480, 300, false);
    expect(requestFrame).toHaveBeenCalledOnce();

    await waitForCallbacks();
    expect(onRaccoonLoaded).toHaveBeenCalledOnce();
    expect(asset.root.parent?.name).toBe('laundromat-raccoon');

    runtime.dispose();
    runtime.dispose();

    expect(host.querySelectorAll('canvas')).toHaveLength(0);
    expect(cancelFrame).toHaveBeenCalledOnce();
    expect(frames.size).toBe(0);
    expect(renderer.dispose).toHaveBeenCalledOnce();
    expect(textureDispose).toHaveBeenCalledOnce();
    expect(removeDocumentListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    expect(removeCanvasListener).toHaveBeenCalledWith('webglcontextlost', expect.any(Function));
    expect(TestResizeObserver.instance?.observe).toHaveBeenCalledWith(host);
    expect(TestResizeObserver.instance?.disconnect).toHaveBeenCalledOnce();
    expect(runtime.mount(host)).toBe(false);
    host.remove();
  });

  it('aborts a pending model request and disposes a late result after route teardown', async () => {
    const host = createHost();
    const renderer = createRenderer();
    const asset = createAsset();
    const geometryDispose = vi.spyOn((asset.root.children[0] as Mesh).geometry, 'dispose');
    let resolveAsset: ((value: MiniDioramaRaccoonAsset) => void) | undefined;
    let requestSignal: AbortSignal | undefined;
    const onRaccoonLoadFailed = vi.fn();
    const adapters: Partial<MiniDioramaRuntimeAdapters> = {
      createRenderer: () => renderer,
      requestFrame: () => 1,
      cancelFrame: vi.fn(),
      loadRaccoonAsset: (_baseURI, signal) => {
        requestSignal = signal;
        return new Promise((resolve) => {
          resolveAsset = resolve;
        });
      },
    };
    const runtime = new MiniDioramaSceneRuntime(createCallbacks({ onRaccoonLoadFailed }), adapters);

    runtime.mount(host);
    await waitForCallbacks();
    runtime.dispose();
    expect(requestSignal?.aborted).toBe(true);

    resolveAsset?.(asset);
    await waitForCallbacks();

    expect(geometryDispose).toHaveBeenCalledOnce();
    expect(onRaccoonLoadFailed).not.toHaveBeenCalled();
    host.remove();
  });

  it('reports asset failures and tears down the mounted preview', async () => {
    const host = createHost();
    const renderer = createRenderer();
    const onRaccoonLoadFailed = vi.fn();
    const runtime = new MiniDioramaSceneRuntime(createCallbacks({ onRaccoonLoadFailed }), {
      createRenderer: () => renderer,
      requestFrame: () => 1,
      cancelFrame: vi.fn(),
      loadRaccoonAsset: async () => {
        throw new Error('missing GLB');
      },
    });

    expect(runtime.mount(host)).toBe(true);
    await vi.waitFor(() => expect(onRaccoonLoadFailed).toHaveBeenCalledOnce());

    expect(onRaccoonLoadFailed).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'missing GLB' }),
    );
    expect(host.querySelector('canvas')).toBeNull();
    expect(renderer.dispose).toHaveBeenCalledOnce();
    host.remove();
  });

  it('reports unavailable WebGL without leaving a canvas or renderer behind', () => {
    const host = createHost();
    const onWebGLUnavailable = vi.fn();
    const runtime = new MiniDioramaSceneRuntime(createCallbacks({ onWebGLUnavailable }), {
      createRenderer: () => {
        throw new Error('WebGL unavailable');
      },
      loadRaccoonAsset: vi.fn(async () => createAsset()),
    });

    expect(runtime.mount(host)).toBe(false);
    expect(onWebGLUnavailable).toHaveBeenCalledOnce();
    expect(host.querySelector('canvas')).toBeNull();
    runtime.dispose();
    host.remove();
  });
});

class TestResizeObserver implements ResizeObserver {
  static instance?: TestResizeObserver;

  readonly observe = vi.fn((_target: Element, _options?: ResizeObserverOptions) => {});
  readonly unobserve = vi.fn((_target: Element) => {});
  readonly disconnect = vi.fn(() => {});

  constructor(_callback: ResizeObserverCallback) {
    TestResizeObserver.instance = this;
  }
}

function createCallbacks(
  overrides: Partial<MiniDioramaRuntimeCallbacks> = {},
): MiniDioramaRuntimeCallbacks {
  return {
    onIntent: vi.fn(),
    onWebGLUnavailable: vi.fn(),
    onRaccoonLoaded: vi.fn(),
    onRaccoonLoadFailed: vi.fn(),
    ...overrides,
  };
}

function createHost(): HTMLElement {
  const host = document.createElement('div');
  Object.defineProperty(host, 'getBoundingClientRect', {
    value: () => ({
      left: 0,
      top: 0,
      right: 480,
      bottom: 300,
      width: 480,
      height: 300,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }),
  });
  document.body.append(host);
  return host;
}

function createRenderer(): WebGLRenderer {
  return {
    shadowMap: { enabled: false, type: 0 },
    outputColorSpace: '',
    toneMapping: 0,
    toneMappingExposure: 1,
    setPixelRatio: vi.fn(),
    setSize: vi.fn(),
    render: vi.fn(),
    dispose: vi.fn(),
  } as unknown as WebGLRenderer;
}

function createAsset(): MiniDioramaRaccoonAsset {
  const root = new Group();
  root.name = 'puddlepaw-raccoon';
  const texture = new DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
  const material = new MeshStandardMaterial({ map: texture });
  root.add(new Mesh(new BoxGeometry(1, 1, 1), material));
  return {
    root,
    animations: [
      new AnimationClip('idle', 1, []),
      new AnimationClip('sit', 0.2, []),
      new AnimationClip('greet', 0.5, []),
    ],
  };
}

function waitForCallbacks(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
