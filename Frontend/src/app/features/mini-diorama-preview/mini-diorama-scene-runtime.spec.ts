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
import { miniDioramaSceneNodeName } from './mini-diorama-scene-contract';

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
    expect(asset.root.parent?.name).toBe('integration-preview-scene');
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

  it('loads the Stage 3 production scene without requiring animation joints', async () => {
    const host = createHost();
    const renderer = createRenderer();
    const asset = createAsset('stage-3-production');
    const onSceneLoaded = vi.fn();
    const loadSceneAsset = vi.fn(async () => asset);
    const runtime = new MiniDioramaSceneRuntime(
      createCallbacks({ onSceneLoaded }),
      {
        createRenderer: () => renderer,
        requestFrame: () => 1,
        cancelFrame: vi.fn(),
        loadSceneAsset,
      },
      'stage-3-production',
    );

    expect(runtime.mount(host)).toBe(true);
    await waitForCallbacks();

    expect(onSceneLoaded).toHaveBeenCalledOnce();
    expect(loadSceneAsset).toHaveBeenCalledWith(
      document.baseURI,
      expect.any(AbortSignal),
      'stage-3-production',
    );
    expect(asset.root.parent?.name).toBe('stage-3-production-scene');
    runtime.greetRaccoon();
    runtime.dispose();
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

function createAsset(
  kind: MiniDioramaSceneAsset['kind'] = 'integration-preview',
): MiniDioramaSceneAsset {
  const root = new Group();
  const geometry = new BoxGeometry(1, 1, 1);
  const texture = new DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
  const material = new MeshStandardMaterial({ map: texture });
  const inactiveVariantMaterial = new MeshStandardMaterial({
    map: new DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1),
  });

  if (kind === 'integration-preview') {
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
    addNamedGroup(raccoon, 'Head_BroadCheekMask', geometry, material, [-1, 1.1, 0.7]);
    addNamedGroup(raccoon, 'Tail_Banded', geometry, material, [-1.6, 0.35, 0.2]);
  } else {
    addNamedGroup(root, 'Floor', geometry, material, [0, 0, 0]);
    addNamedGroup(root, 'Washer', geometry, material, [0, 1, -3]);
    addNamedGroup(root, 'ProjectBoard', geometry, material, [-2.7, 1.3, -2.6]);
    addNamedGroup(root, 'Courier.Root', geometry, material, [-1.5, 0.5, 0]);
    addNamedGroup(root, 'Guide.Root', geometry, material, [1.5, 0.5, 0]);
    addAnchor(root, 'Anchor.NicheLantern.Light', [2, 2, -2]);
    addAnchor(root, 'Anchor.Camera.Overview', [0, 1.15, 0]);
    addAnchor(root, 'Anchor.Camera.Portrait', [0, 1.48, -0.24]);
    addAnchor(root, 'Anchor.Camera.Board', [-2.7, 2, -2.57]);
    addAnchor(root, 'Anchor.Camera.Washer', [0, 1.05, -3.03]);
    addAnchor(root, 'Anchor.Camera.Recenter', [0, 1.32, -0.2]);
    addAnchor(root, 'Anchor.Board.Center', [-2.7, 1.3, -2.56]);
    addAnchor(root, 'Anchor.Board.BottomLeft', [-3.9, 0.2, -2.56]);
    addAnchor(root, 'Anchor.Board.BottomRight', [-1.5, 0.2, -2.56]);
    addAnchor(root, 'Anchor.Board.TopLeft', [-3.9, 2.4, -2.56]);
    addAnchor(root, 'Anchor.Board.TopRight', [-1.5, 2.4, -2.56]);
    addAnchor(root, 'Anchor.Washer.Preview', [0, 1, -3.5]);
    addAnchor(root, 'Anchor.Washer.Open', [0.5, 1, -3.5]);
    addAnchor(root, 'Anchor.Washer.Delete', [-0.5, 1, -3.5]);
  }

  return {
    kind,
    root,
    materialVariants: new MiniDioramaMaterialVariants([], [material, inactiveVariantMaterial]),
  };
}

function addAnchor(parent: Group, name: string, position: readonly [number, number, number]): void {
  const anchor = new Group();
  anchor.name = miniDioramaSceneNodeName(name);
  anchor.position.set(...position);
  parent.add(anchor);
}

function addNamedGroup(
  parent: Group,
  name: string,
  geometry: BoxGeometry,
  material: MeshStandardMaterial,
  position: readonly [number, number, number],
): Group {
  const group = new Group();
  group.name = miniDioramaSceneNodeName(name);
  group.position.set(...position);
  group.add(new Mesh(geometry, material));
  parent.add(group);
  return group;
}

function waitForCallbacks(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
