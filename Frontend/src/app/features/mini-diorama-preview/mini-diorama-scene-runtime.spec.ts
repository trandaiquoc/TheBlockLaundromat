import type { WebGLRenderer } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  MiniDioramaSceneRuntime,
  type MiniDioramaRuntimeAdapters,
} from './mini-diorama-scene-runtime';

afterEach(() => vi.unstubAllGlobals());

describe('MiniDioramaSceneRuntime', () => {
  it('mounts one canvas and releases animation, listeners, scene, and renderer on disposal', () => {
    const host = createHost();
    const renderer = createRenderer();
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
    const adapters: Partial<MiniDioramaRuntimeAdapters> = {
      createRenderer: vi.fn(() => renderer),
      requestFrame,
      cancelFrame,
    };
    const runtime = new MiniDioramaSceneRuntime(
      { onIntent: vi.fn(), onWebGLUnavailable: vi.fn() },
      adapters,
    );

    expect(runtime.mount(host)).toBe(true);
    expect(host.querySelectorAll('canvas')).toHaveLength(1);
    const canvas = host.querySelector('canvas');
    expect(canvas).not.toBeNull();
    const removeCanvasListener = vi.spyOn(canvas!, 'removeEventListener');
    expect(renderer.setSize).toHaveBeenCalledWith(480, 300, false);
    expect(requestFrame).toHaveBeenCalledOnce();

    runtime.dispose();
    runtime.dispose();

    expect(host.querySelectorAll('canvas')).toHaveLength(0);
    expect(cancelFrame).toHaveBeenCalledOnce();
    expect(frames.size).toBe(0);
    expect(renderer.dispose).toHaveBeenCalledOnce();
    expect(removeDocumentListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    expect(removeCanvasListener).toHaveBeenCalledWith('webglcontextlost', expect.any(Function));
    expect(TestResizeObserver.instance?.observe).toHaveBeenCalledWith(host);
    expect(TestResizeObserver.instance?.disconnect).toHaveBeenCalledOnce();
    expect(runtime.mount(host)).toBe(false);
    host.remove();
  });

  it('reports unavailable WebGL without leaving a canvas or renderer behind', () => {
    const host = createHost();
    const onWebGLUnavailable = vi.fn();
    const runtime = new MiniDioramaSceneRuntime(
      { onIntent: vi.fn(), onWebGLUnavailable },
      {
        createRenderer: () => {
          throw new Error('WebGL unavailable');
        },
      },
    );

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
