import { BoxGeometry, DataTexture, Group, Mesh, MeshStandardMaterial } from 'three';
import type { WebGLRenderer } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MiniDioramaMaterialVariants } from './mini-diorama-material-variants';
import {
  MiniDioramaSceneRuntime,
  type MiniDioramaRuntimeAdapters,
  type MiniDioramaRuntimeCallbacks,
} from './mini-diorama-scene-runtime';
import type { MiniDioramaSceneAsset } from './mini-diorama-scene-loader';

afterEach(() => vi.unstubAllGlobals());

describe('MiniDioramaSceneRuntime', () => {
  it('waits for the assembled GLB and releases scene, listener, and renderer resources', async () => {
    const host = createHost();
    const renderer = createRenderer();
    const asset = createAsset();
    const texture = (asset.root.children[0] as Group).children[0] as Mesh;
    const material = texture.material as MeshStandardMaterial;
    if (!material.map) throw new Error('The test scene texture was not built.');
    const textureDispose = vi.spyOn(material.map, 'dispose');
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
    const onSceneLoaded = vi.fn();
    const adapters: Partial<MiniDioramaRuntimeAdapters> = {
      createRenderer: vi.fn(() => renderer),
      requestFrame,
      cancelFrame,
      loadSceneAsset: vi.fn(async () => asset),
    };
    const runtime = new MiniDioramaSceneRuntime(createCallbacks({ onSceneLoaded }), adapters);

    expect(runtime.mount(host)).toBe(true);
    expect(host.querySelectorAll('canvas')).toHaveLength(1);
    expect(onSceneLoaded).not.toHaveBeenCalled();
    const canvas = host.querySelector('canvas');
    expect(canvas).not.toBeNull();
    const removeCanvasListener = vi.spyOn(canvas!, 'removeEventListener');
    expect(renderer.setSize).toHaveBeenCalledWith(480, 300, false);

    await waitForCallbacks();
    expect(onSceneLoaded).toHaveBeenCalledOnce();
    expect(asset.root.parent?.name).toBe('laundromat-preview-scene');
    expect(canvas?.getAttribute('data-material-variant')).toBe('Minecraft');
    expect(requestFrame).toHaveBeenCalledOnce();

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

  it('cancels a pending GLB load and disposes an asset that resolves after route teardown', async () => {
    const host = createHost();
    const renderer = createRenderer();
    const asset = createAsset();
    const geometry = (asset.root.children[0] as Group).children[0] as Mesh;
    const geometryDispose = vi.spyOn(geometry.geometry, 'dispose');
    let resolveAsset: ((value: MiniDioramaSceneAsset) => void) | undefined;
    let requestSignal: AbortSignal | undefined;
    const onSceneLoadFailed = vi.fn();
    const adapters: Partial<MiniDioramaRuntimeAdapters> = {
      createRenderer: () => renderer,
      requestFrame: () => 1,
      cancelFrame: vi.fn(),
      loadSceneAsset: (_baseURI, signal) => {
        requestSignal = signal;
        return new Promise((resolve) => {
          resolveAsset = resolve;
        });
      },
    };
    const runtime = new MiniDioramaSceneRuntime(createCallbacks({ onSceneLoadFailed }), adapters);

    runtime.mount(host);
    await waitForCallbacks();
    runtime.dispose();
    expect(requestSignal?.aborted).toBe(true);

    resolveAsset?.(asset);
    await waitForCallbacks();

    expect(geometryDispose).toHaveBeenCalledOnce();
    expect(onSceneLoadFailed).not.toHaveBeenCalled();
    host.remove();
  });

  it('reports scene load failures and tears down the mounted preview', async () => {
    const host = createHost();
    const renderer = createRenderer();
    const onSceneLoadFailed = vi.fn();
    const runtime = new MiniDioramaSceneRuntime(createCallbacks({ onSceneLoadFailed }), {
      createRenderer: () => renderer,
      requestFrame: () => 1,
      cancelFrame: vi.fn(),
      loadSceneAsset: async () => {
        throw new Error('missing GLB');
      },
    });

    expect(runtime.mount(host)).toBe(true);
    await vi.waitFor(() => expect(onSceneLoadFailed).toHaveBeenCalledOnce());

    expect(onSceneLoadFailed).toHaveBeenCalledWith(
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
      loadSceneAsset: vi.fn(async () => createAsset()),
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
    onSceneLoaded: vi.fn(),
    onSceneLoadFailed: vi.fn(),
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

function createAsset(): MiniDioramaSceneAsset {
  const root = new Group();
  const geometry = new BoxGeometry(1, 1, 1);
  const texture = new DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
  const material = new MeshStandardMaterial({ map: texture });
  const inactiveVariantMaterial = new MeshStandardMaterial({
    map: new DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1),
  });
  const platform = new Group();
  platform.name = 'Platform';
  platform.add(new Mesh(geometry, material));
  root.add(platform);
  addNamedGroup(root, 'Washer', geometry, material, [1, 1, 0]);
  addNamedGroup(root, 'Notice_board', geometry, material, [0, 2, -2]);
  addNamedGroup(root, 'Lantern', geometry, material, [0, 3, -1]);

  const raccoon = new Group();
  raccoon.name = 'Raccoon';
  root.add(raccoon);
  addNamedGroup(raccoon, 'Body', geometry, material, [-1, 0.5, 0.5]);
  addNamedGroup(raccoon, 'ForelegL', geometry, material, [-0.8, 0.6, 0.9]);
  addNamedGroup(raccoon, 'Head_•_broad_cheek_mask', geometry, material, [-1, 1.1, 0.7]);
  addNamedGroup(raccoon, 'Tail_•_banded', geometry, material, [-1.6, 0.35, 0.2]);

  return {
    root,
    materialVariants: new MiniDioramaMaterialVariants([], [material, inactiveVariantMaterial]),
  };
}

function addNamedGroup(
  parent: Group,
  name: string,
  geometry: BoxGeometry,
  material: MeshStandardMaterial,
  position: readonly [number, number, number],
): Group {
  const group = new Group();
  group.name = name;
  group.position.set(...position);
  group.add(new Mesh(geometry, material));
  parent.add(group);
  return group;
}

function waitForCallbacks(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
