import * as THREE from 'three';

const READBACK_POLL_INTERVAL_MS = 4;
export const PROJECT_PREVIEW_READBACK_TIMEOUT_MS = 5000;

/** Uses a cancellable WebGL2 PBO readback so preview teardown can release GPU handles. */
export function readProjectPreviewPixels(
  renderer: THREE.WebGLRenderer,
  target: THREE.WebGLRenderTarget,
  pixels: Uint8Array,
  signal: AbortSignal,
  timeoutMs = PROJECT_PREVIEW_READBACK_TIMEOUT_MS,
): Promise<void> {
  if (target.texture.format !== THREE.RGBAFormat || target.texture.type !== THREE.UnsignedByteType)
    throw new Error('Project preview target must use RGBA unsigned-byte pixels');

  const gl = renderer.getContext() as WebGL2RenderingContext;
  if (gl.isContextLost()) throw new Error('WebGL context is unavailable for project preview');

  const previousPixelPackBuffer = gl.getParameter(
    gl.PIXEL_PACK_BUFFER_BINDING,
  ) as WebGLBuffer | null;
  const pixelPackBuffer = gl.createBuffer();
  if (!pixelPackBuffer) throw new Error('Unable to allocate project preview readback buffer');

  return new Promise<void>((resolve, reject) => {
    let fence: WebGLSync | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let settled = false;

    const cleanup = (): void => {
      if (timer !== undefined) clearTimeout(timer);
      signal.removeEventListener('abort', abort);
      try {
        gl.bindBuffer(gl.PIXEL_PACK_BUFFER, previousPixelPackBuffer);
      } catch {
        /* A lost context releases the binding with the rest of its WebGL state. */
      }
      if (fence) {
        try {
          gl.deleteSync(fence);
        } catch {
          /* The sync may already have been released with a lost context. */
        }
      }
      try {
        gl.deleteBuffer(pixelPackBuffer);
      } catch {
        /* The buffer may already have been released with a lost context. */
      }
    };

    const finish = (error?: unknown): void => {
      if (settled) return;
      settled = true;
      cleanup();
      if (error === undefined) resolve();
      else reject(error);
    };

    const abort = (): void => finish(new Error('Project preview readback was cancelled'));
    const deadline = Date.now() + timeoutMs;

    const probe = (): void => {
      timer = undefined;
      if (signal.aborted) {
        abort();
        return;
      }
      if (gl.isContextLost()) {
        finish(new Error('WebGL context was lost during project preview readback'));
        return;
      }

      let status: GLenum;
      try {
        if (!fence) throw new Error('Project preview readback fence was not created');
        status = gl.clientWaitSync(fence, gl.SYNC_FLUSH_COMMANDS_BIT, 0);
      } catch (error) {
        finish(error);
        return;
      }

      if (status === gl.WAIT_FAILED) {
        finish(new Error('GPU rejected project preview readback'));
        return;
      }
      if (status === gl.TIMEOUT_EXPIRED) {
        if (Date.now() >= deadline) {
          finish(new Error('Project preview GPU readback timed out'));
          return;
        }
        timer = setTimeout(probe, READBACK_POLL_INTERVAL_MS);
        return;
      }

      try {
        gl.bindBuffer(gl.PIXEL_PACK_BUFFER, pixelPackBuffer);
        gl.getBufferSubData(gl.PIXEL_PACK_BUFFER, 0, pixels);
        finish();
      } catch (error) {
        finish(error);
      }
    };

    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) {
      abort();
      return;
    }

    try {
      renderer.setRenderTarget(target);
      gl.bindBuffer(gl.PIXEL_PACK_BUFFER, pixelPackBuffer);
      gl.bufferData(gl.PIXEL_PACK_BUFFER, pixels.byteLength, gl.STREAM_READ);
      gl.readPixels(0, 0, target.width, target.height, gl.RGBA, gl.UNSIGNED_BYTE, 0);
      gl.bindBuffer(gl.PIXEL_PACK_BUFFER, previousPixelPackBuffer);
      fence = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      if (!fence) throw new Error('Unable to create project preview readback fence');
      gl.flush();
      timer = setTimeout(probe, READBACK_POLL_INTERVAL_MS);
    } catch (error) {
      finish(error);
    }
  });
}
