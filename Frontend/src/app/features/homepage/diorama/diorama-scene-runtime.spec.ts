import {
  BoxGeometry,
  DataTexture,
  Group,
  Mesh,
  MeshStandardMaterial,
  type WebGLRenderer,
} from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DioramaMaterialVariants } from './diorama-material-variants';
import {
  DioramaSceneRuntime,
  type DioramaRuntimeAdapters,
  type DioramaRuntimeCallbacks,
} from './diorama-scene-runtime';
import type { DioramaSceneAsset } from './diorama-scene-loader';
import { dioramaSceneNodeName, LAUNDROMAT_DIORAMA_PROFILE } from './diorama-scene-profile';

afterEach(() => vi.unstubAllGlobals());

describe('DioramaSceneRuntime', () => {
  it('renders the loaded scene only on demand and releases scene, listeners, and renderer resources', async () => {
    const host = createHost();
    const renderer = createRenderer();
    const shadowUpdateRequests = captureShadowUpdateRequests(renderer);
    const asset = createAsset();
    const body = asset.root.getObjectByName('Washer') as Mesh;
    const textureDispose = vi.spyOn(body.material as MeshStandardMaterial, 'dispose');
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
    const adapters: Partial<DioramaRuntimeAdapters> = {
      createRenderer: vi.fn(() => renderer),
      requestFrame,
      cancelFrame,
      loadSceneAsset: vi.fn(async () => asset),
    };
    const runtime = new DioramaSceneRuntime(createCallbacks({ onSceneLoaded }), adapters);

    expect(runtime.mount(host)).toBe(true);
    expect(host.querySelectorAll('canvas')).toHaveLength(1);
    expect(onSceneLoaded).not.toHaveBeenCalled();
    const canvas = host.querySelector('canvas');
    expect(canvas).not.toBeNull();
    const removeCanvasListener = vi.spyOn(canvas!, 'removeEventListener');
    expect(renderer.setSize).toHaveBeenCalledWith(480, 300, false);

    await waitForCallbacks();
    expect(onSceneLoaded).toHaveBeenCalledOnce();
    expect(asset.root.parent?.name).toBe('DioramaRoomSpinPivot');
    expect(canvas?.getAttribute('data-material-variant')).toBe('Minecraft');
    expect(renderer.render).toHaveBeenCalled();
    expect(renderer.shadowMap.autoUpdate).toBe(false);
    expect(shadowUpdateRequests).toEqual([true]);
    expect(requestFrame).not.toHaveBeenCalled();

    runtime.orbitCamera(0.02, 0.01);
    expect(shadowUpdateRequests.at(-1)).toBe(false);

    runtime.setTheme('dark');
    expect(canvas?.getAttribute('data-material-variant')).toBe('Dark');
    expect(shadowUpdateRequests.at(-1)).toBe(true);
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

  it('cancels a pending room load and disposes its assets when it resolves after teardown', async () => {
    const host = createHost();
    const renderer = createRenderer();
    const asset = createAsset();
    const mesh = asset.root.getObjectByName('Washer') as Mesh;
    const geometryDispose = vi.spyOn(mesh.geometry, 'dispose');
    const groundTextureDispose = vi.spyOn(asset.exteriorGroundTexture, 'dispose');
    let resolveAsset: ((value: DioramaSceneAsset) => void) | undefined;
    let requestSignal: AbortSignal | undefined;
    const onSceneLoadFailed = vi.fn();
    const adapters: Partial<DioramaRuntimeAdapters> = {
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
    const runtime = new DioramaSceneRuntime(createCallbacks({ onSceneLoadFailed }), adapters);

    runtime.mount(host);
    await waitForCallbacks();
    runtime.dispose();
    expect(requestSignal?.aborted).toBe(true);

    resolveAsset?.(asset);
    await waitForCallbacks();

    expect(geometryDispose).toHaveBeenCalledOnce();
    expect(groundTextureDispose).toHaveBeenCalledOnce();
    expect(onSceneLoadFailed).not.toHaveBeenCalled();
    host.remove();
  });

  it('reports room load failures and tears down the mounted renderer', async () => {
    const host = createHost();
    const renderer = createRenderer();
    const onSceneLoadFailed = vi.fn();
    const runtime = new DioramaSceneRuntime(createCallbacks({ onSceneLoadFailed }), {
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

  it('animates theme transitions and room turns while preserving static idle rendering', async () => {
    const host = createHost();
    const renderer = createRenderer();
    const shadowUpdateRequests = captureShadowUpdateRequests(renderer);
    const asset = createAsset();
    const onSceneLoaded = vi.fn();
    const loadSceneAsset = vi.fn(async () => asset);
    const frames = new Map<number, FrameRequestCallback>();
    let nextFrameId = 0;
    const runtime = new DioramaSceneRuntime(createCallbacks({ onSceneLoaded }), {
      createRenderer: () => renderer,
      requestFrame: (callback) => {
        const id = ++nextFrameId;
        frames.set(id, callback);
        return id;
      },
      cancelFrame: (id) => frames.delete(id),
      loadSceneAsset,
    });

    runtime.mount(host);
    await waitForCallbacks();

    expect(onSceneLoaded).toHaveBeenCalledOnce();
    expect(loadSceneAsset).toHaveBeenCalledWith(document.baseURI, expect.any(AbortSignal));
    const roomPivot = asset.root.parent as Group;
    expect(roomPivot.name).toBe('DioramaRoomSpinPivot');
    expect(roomPivot.parent?.name).toBe('laundromat-diorama-scene');
    expect(frames.size).toBe(0);
    expect(shadowUpdateRequests).toEqual([true]);

    runtime.setTheme('raccoon');
    expect(shadowUpdateRequests.at(-1)).toBe(true);
    const firstSpinRender = shadowUpdateRequests.length;
    const firstSpin = advanceFrames(frames, roomPivot, 0, 13, 1000 / 12);
    expect(shadowUpdateRequests.slice(firstSpinRender).every(Boolean)).toBe(true);
    expect(firstSpin.maximumRotation).toBeGreaterThan(Math.PI);
    expect(roomPivot.rotation.y).toBeCloseTo(0, 5);

    runtime.setTheme('dark');
    const partialRotation = advanceFrames(frames, roomPivot, 1000, 6).finalRotation;
    expect(partialRotation).toBeGreaterThan(0);

    runtime.setTheme('raccoon');
    const returnedRotation = advanceFrames(frames, roomPivot, 1100, 60).finalRotation;
    expect(returnedRotation).toBeCloseTo(0, 5);
    runtime.dispose();
    expect(renderer.dispose).toHaveBeenCalledOnce();
    host.remove();
  });

  it('reports unavailable WebGL without leaving a canvas or renderer behind', () => {
    const host = createHost();
    const onWebGLUnavailable = vi.fn();
    const runtime = new DioramaSceneRuntime(createCallbacks({ onWebGLUnavailable }), {
      createRenderer: () => {
        throw new Error('WebGL unavailable');
      },
      loadSceneAsset: vi.fn(async () => createAsset()),
    });

    expect(runtime.mount(host)).toBe(false);
    expect(onWebGLUnavailable).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'WebGL unavailable' }),
    );
    expect(host.querySelector('canvas')).toBeNull();
    runtime.dispose();
    host.remove();
  });

  it('keeps a scene loaded in a hidden tab from scheduling animation frames', async () => {
    const host = createHost();
    const renderer = createRenderer();
    const asset = createAsset();
    const previousVisibilityState = Object.getOwnPropertyDescriptor(document, 'visibilityState');
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'hidden',
    });
    const requestFrame = vi.fn(() => 1);
    const runtime = new DioramaSceneRuntime(createCallbacks(), {
      createRenderer: () => renderer,
      requestFrame,
      cancelFrame: vi.fn(),
      loadSceneAsset: async () => asset,
    });

    try {
      runtime.mount(host);
      await waitForCallbacks();

      expect(renderer.render).toHaveBeenCalled();
      expect(requestFrame).not.toHaveBeenCalled();
    } finally {
      runtime.dispose();
      if (previousVisibilityState) {
        Object.defineProperty(document, 'visibilityState', previousVisibilityState);
      } else {
        Reflect.deleteProperty(document, 'visibilityState');
      }
      host.remove();
    }
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
  overrides: Partial<DioramaRuntimeCallbacks> = {},
): DioramaRuntimeCallbacks {
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
    domElement: document.createElement('canvas'),
    shadowMap: { enabled: false, type: 0, autoUpdate: true, needsUpdate: false },
    outputColorSpace: '',
    toneMapping: 0,
    toneMappingExposure: 1,
    setClearColor: vi.fn(),
    setPixelRatio: vi.fn(),
    setSize: vi.fn(),
    render: vi.fn(),
    dispose: vi.fn(),
  } as unknown as WebGLRenderer;
}

function captureShadowUpdateRequests(renderer: WebGLRenderer): boolean[] {
  const shadowUpdates: boolean[] = [];
  renderer.render = vi.fn(() => {
    shadowUpdates.push(renderer.shadowMap.needsUpdate);
    renderer.shadowMap.needsUpdate = false;
  });
  return shadowUpdates;
}

function createAsset(): DioramaSceneAsset {
  const root = new Group();
  const geometry = new BoxGeometry(1, 1, 1);
  const texture = new DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
  const material = new MeshStandardMaterial({ map: texture });
  const inactiveVariantMaterial = new MeshStandardMaterial({
    map: new DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1),
  });
  addNamedMesh(root, 'Floor', geometry, material, [0, 0, 0]);
  addNamedMesh(root, 'Washer', geometry, material, [0, 1, -3]);
  const board = addNamedMesh(root, 'ProjectBoard', geometry, material, [-2.7, 1.3, -2.6]);
  board.rotation.y = Math.PI / 4;
  addAnchor(root, 'Anchor.NicheLantern.Light', [2, 2, -2]);
  const shelfLantern = new Group();
  shelfLantern.name = dioramaSceneNodeName('ShelfLantern');
  shelfLantern.position.set(-3, 2, 0.5);
  root.add(shelfLantern);
  addAnchor(shelfLantern, 'Anchor.ShelfLantern.Light', [0, 0, 0]);
  for (const { nodeName } of LAUNDROMAT_DIORAMA_PROFILE.placements) {
    if (nodeName === 'ShelfLantern') continue;
    addNamedGroup(root, nodeName, [0, 0, 0]);
  }
  for (const [name, point] of profileAnchors) addAnchor(root, name, point);
  addCharacterRoot(root, 'Courier.Root', -1.5, geometry, material);
  addCharacterRoot(root, 'Guide.Root', 1.5, geometry, material);

  return {
    root,
    materialVariants: new DioramaMaterialVariants([], [material, inactiveVariantMaterial]),
    exteriorGroundTexture: new DataTexture(new Uint8Array([215, 190, 154, 255]), 1, 1),
  };
}

const profileAnchors: readonly [string, readonly [number, number, number]][] = [
  ['Anchor.Camera.Overview', [0, 1.15, 0]],
  ['Anchor.Camera.Portrait', [0, 1.48, -0.24]],
  ['Anchor.Camera.Board', [-2.7, 2, -2.57]],
  ['Anchor.Camera.Washer', [0, 1.05, -3.03]],
  ['Anchor.Camera.Recenter', [0, 1.32, -0.2]],
  ['Anchor.Board.Center', [-2.7, 1.3, -2.56]],
  ['Anchor.Board.BottomLeft', [-3.9, 0.2, -2.56]],
  ['Anchor.Board.BottomRight', [-1.5, 0.2, -2.56]],
  ['Anchor.Board.TopLeft', [-3.9, 2.4, -2.56]],
  ['Anchor.Board.TopRight', [-1.5, 2.4, -2.56]],
  ['Anchor.Washer.Preview', [0, 1, -3.5]],
  ['Anchor.Washer.Open', [0.5, 1, -3.5]],
  ['Anchor.Washer.Delete', [-0.5, 1, -3.5]],
];

function addCharacterRoot(
  root: Group,
  name: string,
  x: number,
  geometry: BoxGeometry,
  material: MeshStandardMaterial,
): void {
  const character = new Group();
  character.name = dioramaSceneNodeName(name);
  character.position.x = x;
  root.add(character);
  addNamedMesh(character, `${name} Body`, geometry, material, [0, 0.6, 0]);
}

function addAnchor(root: Group, name: string, point: readonly [number, number, number]): void {
  const anchor = new Group();
  anchor.name = dioramaSceneNodeName(name);
  anchor.position.set(...point);
  root.add(anchor);
}

function addNamedGroup(root: Group, name: string, point: readonly [number, number, number]): void {
  const group = new Group();
  group.name = dioramaSceneNodeName(name);
  group.position.set(...point);
  root.add(group);
}

function addNamedMesh(
  root: Group,
  name: string,
  geometry: BoxGeometry,
  material: MeshStandardMaterial,
  point: readonly [number, number, number],
): Mesh {
  const mesh = new Mesh(geometry, material);
  mesh.name = dioramaSceneNodeName(name);
  mesh.position.set(...point);
  root.add(mesh);
  return mesh;
}

function advanceFrames(
  frames: Map<number, FrameRequestCallback>,
  roomPivot: Group,
  firstTimestamp: number,
  count: number,
  intervalMs = 1000 / 60,
): { maximumRotation: number; minimumRotation: number; finalRotation: number } {
  let timestamp = firstTimestamp;
  let finalRotation = 0;
  let maximumRotation = 0;
  let minimumRotation = 0;
  for (let index = 0; index < count; index++) {
    const frame = frames.entries().next().value as [number, FrameRequestCallback] | undefined;
    if (!frame) break;
    const [id, callback] = frame;
    frames.delete(id);
    callback(timestamp);
    finalRotation = roomPivot.rotation.y;
    maximumRotation = Math.max(maximumRotation, finalRotation);
    minimumRotation = Math.min(minimumRotation, finalRotation);
    timestamp += intervalMs;
  }
  return { maximumRotation, minimumRotation, finalRotation };
}

function waitForCallbacks(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
