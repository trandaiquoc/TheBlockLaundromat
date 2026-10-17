import { afterEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { readProjectPreviewPixels } from './project-preview-readback';

function createReadbackContext(
  overrides: Partial<WebGL2RenderingContext> = {},
): WebGL2RenderingContext {
  const previousBuffer = {} as WebGLBuffer;
  return {
    PIXEL_PACK_BUFFER_BINDING: 0x88ed,
    PIXEL_PACK_BUFFER: 0x88eb,
    STREAM_READ: 0x88e1,
    RGBA: 0x1908,
    UNSIGNED_BYTE: 0x1401,
    SYNC_GPU_COMMANDS_COMPLETE: 0x9117,
    SYNC_FLUSH_COMMANDS_BIT: 1,
    WAIT_FAILED: 0x911d,
    TIMEOUT_EXPIRED: 0x911b,
    ALREADY_SIGNALED: 0x911a,
    CONDITION_SATISFIED: 0x911c,
    getParameter: vi.fn(() => previousBuffer),
    isContextLost: vi.fn(() => false),
    createBuffer: vi.fn(() => ({}) as WebGLBuffer),
    bindBuffer: vi.fn(),
    bufferData: vi.fn(),
    readPixels: vi.fn(),
    fenceSync: vi.fn(() => ({}) as WebGLSync),
    flush: vi.fn(),
    clientWaitSync: vi.fn(() => 0x911a),
    getBufferSubData: vi.fn((_target, _offset, pixels: Uint8Array) => pixels.fill(42)),
    deleteSync: vi.fn(),
    deleteBuffer: vi.fn(),
    ...overrides,
  } as unknown as WebGL2RenderingContext;
}

function createReadback(rendererContext: WebGL2RenderingContext) {
  const renderer = {
    getContext: () => rendererContext,
    setRenderTarget: vi.fn(),
  } as unknown as THREE.WebGLRenderer;
  const target = {
    width: 2,
    height: 2,
    texture: { format: THREE.RGBAFormat, type: THREE.UnsignedByteType },
  } as THREE.WebGLRenderTarget;
  return { renderer, target };
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('project preview readback', () => {
  it('copies pixels after the GPU fence signals and releases its buffer and sync', async () => {
    const gl = createReadbackContext();
    const { renderer, target } = createReadback(gl);
    const pixels = new Uint8Array(16);

    await readProjectPreviewPixels(renderer, target, pixels, new AbortController().signal);

    expect(pixels).toEqual(new Uint8Array(16).fill(42));
    expect(renderer.setRenderTarget).toHaveBeenCalledWith(target);
    expect(gl.deleteSync).toHaveBeenCalledOnce();
    expect(gl.deleteBuffer).toHaveBeenCalledOnce();
    const bindings = vi.mocked(gl.bindBuffer).mock.calls;
    expect(bindings.at(-1)?.[1]).toBe(bindings[1]?.[1]);
  });

  it('releases readback handles when WebGL reports WAIT_FAILED', async () => {
    const gl = createReadbackContext({ clientWaitSync: vi.fn(() => 0x911d) });
    const { renderer, target } = createReadback(gl);

    await expect(
      readProjectPreviewPixels(renderer, target, new Uint8Array(16), new AbortController().signal),
    ).rejects.toThrow('GPU rejected project preview readback');

    expect(gl.deleteSync).toHaveBeenCalledOnce();
    expect(gl.deleteBuffer).toHaveBeenCalledOnce();
  });

  it('aborts a pending readback and clears its timer immediately', async () => {
    vi.useFakeTimers();
    const timersBeforeReadback = vi.getTimerCount();
    const gl = createReadbackContext({ clientWaitSync: vi.fn(() => 0x911b) });
    const { renderer, target } = createReadback(gl);
    const controller = new AbortController();
    const readback = readProjectPreviewPixels(
      renderer,
      target,
      new Uint8Array(16),
      controller.signal,
    );
    const rejection = expect(readback).rejects.toThrow('cancelled');

    controller.abort();
    await rejection;

    expect(vi.getTimerCount()).toBe(timersBeforeReadback);
    expect(gl.deleteSync).toHaveBeenCalledOnce();
    expect(gl.deleteBuffer).toHaveBeenCalledOnce();
  });

  it('times out a stalled GPU fence and releases its resources', async () => {
    vi.useFakeTimers();
    const timersBeforeReadback = vi.getTimerCount();
    const gl = createReadbackContext({ clientWaitSync: vi.fn(() => 0x911b) });
    const { renderer, target } = createReadback(gl);
    const readback = readProjectPreviewPixels(
      renderer,
      target,
      new Uint8Array(16),
      new AbortController().signal,
      8,
    );
    const rejection = expect(readback).rejects.toThrow('timed out');

    await vi.advanceTimersByTimeAsync(8);
    await rejection;

    expect(vi.getTimerCount()).toBe(timersBeforeReadback);
    expect(gl.deleteSync).toHaveBeenCalledOnce();
    expect(gl.deleteBuffer).toHaveBeenCalledOnce();
  });

  it('stops polling and releases handles after context loss', async () => {
    vi.useFakeTimers();
    const timersBeforeReadback = vi.getTimerCount();
    let contextLost = false;
    const gl = createReadbackContext({ isContextLost: vi.fn(() => contextLost) });
    const { renderer, target } = createReadback(gl);
    const readback = readProjectPreviewPixels(
      renderer,
      target,
      new Uint8Array(16),
      new AbortController().signal,
    );
    const rejection = expect(readback).rejects.toThrow('WebGL context was lost');
    contextLost = true;

    await vi.advanceTimersByTimeAsync(4);
    await rejection;

    expect(vi.getTimerCount()).toBe(timersBeforeReadback);
    expect(gl.deleteSync).toHaveBeenCalledOnce();
    expect(gl.deleteBuffer).toHaveBeenCalledOnce();
  });
});
