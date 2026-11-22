import { createReadStream, existsSync, statSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { findBrowser, startHeadlessBrowser } from './headless-browser-session.mjs';

const frontend = resolve(fileURLToPath(new URL('..', import.meta.url)));
const webRoot = resolve(frontend, 'dist/TheBlockLaundromat/browser');
const artifacts = resolve(frontend, '.artifacts/goal-05');
const screenshots = join(artifacts, 'screenshots');
const profileDirectory = join(artifacts, 'profiles');
const browser = findBrowser();
const themes = ['craft', 'light', 'raccoon', 'dark'];
const viewports = [
  { name: 'desktop', width: 1440, height: 900, mobile: false },
  { name: 'mobile', width: 390, height: 844, mobile: true },
];
const profiles = [];
let primarySession;
let fallbackSession;
let migrationSession;
const server = createStaticServer(webRoot);

if (!existsSync(join(webRoot, 'index.html'))) {
  throw new Error('Production build is missing. Run npm run build before Homepage browser checks.');
}

await mkdir(screenshots, { recursive: true });
await mkdir(profileDirectory, { recursive: true });

try {
  const address = await listen(server);
  const origin = `http://127.0.0.1:${address.port}`;

  primarySession = await openSession(origin, 'homepage', { webglEnabled: true });
  await primarySession.setViewport(1440, 900);
  await waitFor(
    primarySession,
    "document.querySelector('[data-scene-state]')?.dataset.sceneState",
    'ready',
  );
  const initialState = await primarySession.evaluate(`(() => ({
    path: location.pathname,
    visibility: document.visibilityState,
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    mode: JSON.parse(localStorage.getItem('the-block-laundromat.ui-preferences') || '{}').appearance?.homepageMode,
    version: JSON.parse(localStorage.getItem('the-block-laundromat.ui-preferences') || '{}').version,
    canvasCount: document.querySelectorAll('.diorama-scene-runtime__canvas').length,
    sceneReadyMs: performance.now(),
    assets: performance.getEntriesByType('resource')
      .filter(entry => /Octagonal-Laundromat\.glb|forest-floor\.png$/.test(new URL(entry.name).pathname))
      .map(entry => ({
        path: new URL(entry.name).pathname,
        transferBytes: entry.transferSize,
        decodedBytes: entry.decodedBodySize,
        durationMs: Math.round(entry.duration),
      })),
    heapBytes: performance.memory?.usedJSHeapSize ?? null,
  }))()`);
  if (
    initialState.path !== '/' ||
    initialState.mode !== 'diorama' ||
    initialState.version !== 2 ||
    initialState.canvasCount !== 1 ||
    initialState.assets.length !== 2
  ) {
    throw new Error(`New-user Diorama startup failed: ${JSON.stringify(initialState)}.`);
  }

  const simpleDefault = await verifyLegacyPreferenceMigration(origin);
  await installRuntimeDiagnostics(primarySession);
  const idleBefore = await primarySession.evaluate('window.__goal05Perf.drawCalls');
  await primarySession.evaluate('new Promise(resolve => setTimeout(resolve, 1000))');
  const idleAfter = await primarySession.evaluate(`({
    drawCalls: window.__goal05Perf.drawCalls,
    pendingFrames: window.__goal05PendingFrames.size,
    heapBytes: performance.memory?.usedJSHeapSize ?? null,
    longTaskMs: window.__goal05LongTasks.reduce((total, duration) => total + duration, 0),
  })`);
  if (idleAfter.drawCalls !== idleBefore || idleAfter.pendingFrames !== 0) {
    throw new Error(`Diorama did not settle to a static idle scene: ${JSON.stringify(idleAfter)}.`);
  }

  const themeAction = await measureThemeTransition(primarySession);
  const cameraActions = await measureCameraActions(primarySession);
  const dioramaCaptures = await captureDioramaScreenshots(primarySession);

  await primarySession.evaluate("document.querySelector('.diorama-header__projects')?.click()");
  await waitFor(
    primarySession,
    "Boolean(document.querySelector('.project-page--simple-home'))",
    true,
  );
  await verifySimpleHomepage(primarySession);
  await verifySimpleLocalization(primarySession);
  const simpleCaptures = await captureSimpleScreenshots(primarySession);

  await primarySession.setViewport(1440, 900);
  await switchHomepageModeInSettings(primarySession, 'diorama');
  await waitFor(
    primarySession,
    "document.querySelector('[data-scene-state]')?.dataset.sceneState",
    'ready',
  );
  await primarySession.evaluate("document.querySelector('.diorama-header__projects')?.click()");
  await waitFor(
    primarySession,
    "Boolean(document.querySelector('.project-page--simple-home'))",
    true,
  );
  const cycles = await verifyInPlaceMountUnmountCycles(primarySession);

  fallbackSession = await openSession(origin, 'fallback', { webglEnabled: false });
  await fallbackSession.setViewport(390, 844, 1, true);
  await waitFor(
    fallbackSession,
    "document.querySelector('[data-scene-state]')?.dataset.sceneState",
    'fallback',
  );
  const fallbackState = await fallbackSession.evaluate(`(() => ({
    projectsButton: Boolean(document.querySelector('.diorama-header__projects')),
    fallback: Boolean(document.querySelector('.diorama-scene__fallback')),
    canvasCount: document.querySelectorAll('.diorama-scene-runtime__canvas').length,
  }))()`);
  if (!fallbackState.projectsButton || !fallbackState.fallback || fallbackState.canvasCount !== 0) {
    throw new Error(`WebGL fallback is missing project access: ${JSON.stringify(fallbackState)}.`);
  }
  await fallbackSession.evaluate("document.querySelector('.diorama-header__projects').click()");
  await waitFor(
    fallbackSession,
    "Boolean(document.querySelector('.project-page--simple-home'))",
    true,
  );

  const report = {
    browser: browser.split(/[\\/]/).at(-1),
    renderer: 'headless Chromium WebGL via SwiftShader; diagnostic only',
    initialState,
    simpleDefault,
    idle: {
      intervalMs: 1000,
      drawCalls: idleAfter.drawCalls - idleBefore,
      pendingFrames: idleAfter.pendingFrames,
      heapBytes: idleAfter.heapBytes,
      observedLongTaskMs: idleAfter.longTaskMs,
    },
    themeAction,
    cameraActions,
    cycles,
    fallbackState,
    screenshotCount: dioramaCaptures.length + simpleCaptures.length,
    screenshots: [...dioramaCaptures, ...simpleCaptures],
  };
  await writeFile(
    join(artifacts, 'browser-performance.json'),
    `${JSON.stringify(report, null, 2)}\n`,
  );

  console.log('Homepage browser verification passed.');
  console.log(JSON.stringify(report, null, 2));
} finally {
  await fallbackSession?.close();
  await migrationSession?.close();
  await primarySession?.close();
  await new Promise((resolveClose) => server.close(resolveClose));
  await Promise.all(profiles.map((profile) => rm(profile, { recursive: true, force: true })));
}

async function verifyLegacyPreferenceMigration(origin) {
  migrationSession = await openSession(origin, 'migration', { webglEnabled: true });
  await migrationSession.setViewport(1280, 800);
  await waitFor(
    migrationSession,
    "document.querySelector('[data-scene-state]')?.dataset.sceneState",
    'ready',
  );
  await migrationSession.evaluate(`(() => {
    localStorage.setItem('the-block-laundromat.ui-preferences', JSON.stringify({
      version: 1,
      locale: 'en',
      appearance: { preset: 'craft' },
    }));
    location.reload();
  })()`);
  await waitFor(
    migrationSession,
    "Boolean(document.querySelector('.project-page--simple-home'))",
    true,
  );
  const result = await migrationSession.evaluate(`(() => {
    const preferences = JSON.parse(localStorage.getItem('the-block-laundromat.ui-preferences') || '{}');
    const sceneRequests = performance.getEntriesByType('resource')
      .map(entry => new URL(entry.name).pathname)
      .filter(path => path.endsWith('.glb') || path.endsWith('.png') && path.includes('/diorama/'));
    return {
      mode: preferences.appearance?.homepageMode,
      version: preferences.version,
      dioramaMounted: Boolean(document.querySelector('.diorama')),
      sceneRequests,
      workflows: Boolean(document.querySelector('.project-form .create-action')) &&
        Boolean(document.querySelector('.project-form .structure-json-create-action')),
    };
  })()`);
  if (
    result.mode !== 'simple' ||
    result.version !== 2 ||
    result.dioramaMounted ||
    result.sceneRequests.length !== 0 ||
    !result.workflows
  ) {
    throw new Error(
      `Legacy preferences did not migrate to the lazy Simple homepage: ${JSON.stringify(result)}.`,
    );
  }
  return result;
}

async function verifySimpleHomepage(session) {
  const state = await session.evaluate(`(() => ({
    path: location.pathname,
    create: Boolean(document.querySelector('.project-form .create-action')),
    importActions: document.querySelectorAll('.project-form .structure-json-create-action').length,
    recent: Boolean(document.querySelector('.recent-projects')),
    settings: Boolean(document.querySelector('.settings-button')),
    themes: document.querySelectorAll('[data-theme-option]').length,
    locales: document.querySelectorAll('[data-locale]').length,
    dioramaMounted: Boolean(document.querySelector('.diorama')),
  }))()`);
  if (
    state.path !== '/' ||
    !state.create ||
    state.importActions !== 2 ||
    !state.recent ||
    !state.settings ||
    state.themes !== 4 ||
    state.locales !== 2 ||
    state.dioramaMounted
  ) {
    throw new Error(`Simple project workflows are incomplete: ${JSON.stringify(state)}.`);
  }
}

async function verifySimpleLocalization(session) {
  await session.evaluate("document.querySelector('[data-locale=vi]')?.click()");
  await waitFor(
    session,
    "document.querySelector('[data-locale=vi]')?.getAttribute('aria-pressed')",
    'true',
  );
  await session.evaluate("document.querySelector('[data-locale=en]')?.click()");
  await waitFor(
    session,
    "document.querySelector('[data-locale=en]')?.getAttribute('aria-pressed')",
    'true',
  );
}

async function captureDioramaScreenshots(session) {
  const captured = [];
  for (const theme of themes) {
    await setDioramaTheme(session, theme);
    for (const viewport of viewports) {
      await assertViewport(session, viewport);
      const filename = `diorama-${viewport.name}-${theme}.png`;
      await session.captureScreenshot(join(screenshots, filename));
      captured.push(filename);
    }
  }
  return captured;
}

async function captureSimpleScreenshots(session) {
  const captured = [];
  for (const theme of themes) {
    await session.evaluate(`document.querySelector('[data-theme-option="${theme}"]')?.click()`);
    await waitFor(
      session,
      `document.querySelector('[data-theme-option="${theme}"]')?.getAttribute('aria-pressed')`,
      'true',
    );
    for (const viewport of viewports) {
      await assertViewport(session, viewport);
      const filename = `simple-${viewport.name}-${theme}.png`;
      await session.captureScreenshot(join(screenshots, filename));
      captured.push(filename);
    }
  }
  return captured;
}

async function setDioramaTheme(session, theme) {
  await session.evaluate(
    `document.querySelector('.diorama-time-dial__quarter[data-time-stage="${theme}"]')?.click()`,
  );
  await waitFor(session, `document.querySelector('.diorama')?.dataset.theme`, theme);
  await session.evaluate('new Promise(resolve => setTimeout(resolve, 1150))');
}

async function assertViewport(session, viewport) {
  await session.setViewport(viewport.width, viewport.height, 1, viewport.mobile);
  await session.evaluate('new Promise(resolve => setTimeout(resolve, 120))');
  const state = await session.evaluate(`({
    width: innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    height: innerHeight,
    hasMode: Boolean(document.querySelector('.diorama') || document.querySelector('.project-page--simple-home')),
  })`);
  if (state.width !== viewport.width || state.scrollWidth > viewport.width + 1 || !state.hasMode) {
    throw new Error(
      `${viewport.name} homepage overflow or missing content: ${JSON.stringify(state)}.`,
    );
  }
}

async function switchHomepageModeInSettings(session, mode) {
  await session.evaluate("document.querySelector('.settings-button')?.click()");
  await waitFor(session, "Boolean(document.querySelector('.settings-dialog[role=dialog]'))", true);
  await session.evaluate(`(() => {
    const navigation = document.querySelector('.settings-nav-select');
    navigation.value = 'appearance';
    navigation.dispatchEvent(new Event('change', { bubbles: true }));
  })()`);
  const experienceSelector = '[role="combobox"][aria-label="Homepage experience"]';
  await waitFor(
    session,
    `Boolean(document.querySelector(${JSON.stringify(experienceSelector)}))`,
    true,
  );
  await session.evaluate(
    'document.querySelector(\'[role=combobox][aria-label="Homepage experience"]\')?.click()',
  );
  await waitFor(session, 'Boolean(document.querySelector(`[role="option"]`))', true);
  await session.evaluate(`Array.from(document.querySelectorAll('[role="option"]'))
    .find(option => option.textContent.toLowerCase().includes('${mode === 'diorama' ? 'diorama' : 'simple'}'))?.click()`);
  await session.evaluate("document.querySelector('.settings-dialog .primary')?.click()");
  if (mode === 'diorama') {
    await waitFor(session, "Boolean(document.querySelector('.diorama'))", true);
  } else {
    await waitFor(session, "Boolean(document.querySelector('.project-page--simple-home'))", true);
  }
}

async function verifyInPlaceMountUnmountCycles(session) {
  await installFrameTracker(session);
  const observations = [];
  for (let cycle = 1; cycle <= 20; cycle++) {
    await switchHomepageModeInSettings(session, 'diorama');
    await waitFor(
      session,
      "document.querySelector('[data-scene-state]')?.dataset.sceneState",
      'ready',
      30_000,
    );
    const mounted = await session.evaluate(`({
      canvases: document.querySelectorAll('.diorama-scene-runtime__canvas').length,
      frames: window.__goal05PendingFrames.size,
    })`);
    await session.evaluate("document.querySelector('.diorama-header__projects')?.click()");
    await waitFor(session, "Boolean(document.querySelector('.project-page--simple-home'))", true);
    await session.evaluate('new Promise(resolve => setTimeout(resolve, 60))');
    const unmounted = await session.evaluate(`({
      canvases: document.querySelectorAll('.diorama-scene-runtime__canvas').length,
      frames: window.__goal05PendingFrames.size,
    })`);
    if (
      mounted.canvases !== 1 ||
      mounted.frames !== 0 ||
      unmounted.canvases !== 0 ||
      unmounted.frames !== 0
    ) {
      throw new Error(
        `Diorama lifecycle cycle ${cycle} leaked a canvas or animation frame: ${JSON.stringify({ mounted, unmounted })}.`,
      );
    }
    observations.push({
      cycle,
      mountedCanvasCount: mounted.canvases,
      unmountedCanvasCount: unmounted.canvases,
      pendingFrames: unmounted.frames,
    });
  }
  return { total: observations.length, passed: observations.length, observations };
}

async function installFrameTracker(session) {
  await session.evaluate(`(() => {
    if (window.__goal05PendingFrames) return;
    const requestFrame = window.requestAnimationFrame.bind(window);
    const cancelFrame = window.cancelAnimationFrame.bind(window);
    window.__goal05PendingFrames = new Set();
    window.__goal05FrameTimestamps = [];
    window.requestAnimationFrame = callback => {
      let frameId;
      frameId = requestFrame(timestamp => {
        window.__goal05PendingFrames.delete(frameId);
        window.__goal05FrameTimestamps.push(timestamp);
        callback(timestamp);
      });
      window.__goal05PendingFrames.add(frameId);
      return frameId;
    };
    window.cancelAnimationFrame = frameId => {
      window.__goal05PendingFrames.delete(frameId);
      cancelFrame(frameId);
    };
  })()`);
}

async function installRuntimeDiagnostics(session) {
  await installFrameTracker(session);
  await session.evaluate(`(() => {
    const counters = { drawCalls: 0, bufferCreates: 0, textureCreates: 0, timestamps: [] };
    const canvas = document.querySelector('.diorama-scene-runtime__canvas');
    const gl = canvas?.getContext('webgl2') || canvas?.getContext('webgl');
    const methods = {
      drawElements: 'drawCalls',
      drawArrays: 'drawCalls',
      drawElementsInstanced: 'drawCalls',
      drawArraysInstanced: 'drawCalls',
      createBuffer: 'bufferCreates',
      createTexture: 'textureCreates',
    };
    if (gl) {
      for (const [name, counter] of Object.entries(methods)) {
        if (typeof gl[name] !== 'function') continue;
        const original = gl[name].bind(gl);
        try {
          Object.defineProperty(gl, name, {
            configurable: true,
            value: (...args) => {
              counters[counter]++;
              if (counter === 'drawCalls') counters.timestamps.push(performance.now());
              return original(...args);
            },
          });
        } catch {}
      }
    }
    window.__goal05Perf = counters;
    window.__goal05LongTasks = [];
    if ('PerformanceObserver' in window) {
      try {
        new PerformanceObserver(entries => {
          for (const entry of entries.getEntries()) window.__goal05LongTasks.push(entry.duration);
        }).observe({ type: 'longtask' });
      } catch {}
    }
  })()`);
}

async function measureThemeTransition(session) {
  const before = await session.evaluate(`({
    drawCalls: window.__goal05Perf.drawCalls,
    bufferCreates: window.__goal05Perf.bufferCreates,
    textureCreates: window.__goal05Perf.textureCreates,
    timestampIndex: window.__goal05Perf.timestamps.length,
    frameIndex: window.__goal05FrameTimestamps.length,
    longTaskCount: window.__goal05LongTasks.length,
    theme: document.querySelector('.diorama')?.dataset.theme,
    materialVariant:
      document.querySelector('.diorama-scene-runtime__canvas')?.dataset.materialVariant,
  })`);
  await setDioramaTheme(session, 'raccoon');
  const after = await session.evaluate(`({
    drawCalls: window.__goal05Perf.drawCalls,
    bufferCreates: window.__goal05Perf.bufferCreates,
    textureCreates: window.__goal05Perf.textureCreates,
    timestamps: window.__goal05Perf.timestamps.slice(${before.timestampIndex}),
    frameTimestamps: window.__goal05FrameTimestamps.slice(${before.frameIndex}),
    longTasks: window.__goal05LongTasks.slice(${before.longTaskCount}),
    theme: document.querySelector('.diorama')?.dataset.theme,
    materialVariant:
      document.querySelector('.diorama-scene-runtime__canvas')?.dataset.materialVariant,
  })`);
  if (after.theme !== 'raccoon' || after.materialVariant !== 'Raccoon') {
    throw new Error(
      `The theme action did not reach the GLB material variant: ${JSON.stringify(after)}.`,
    );
  }
  return {
    intervalMs: 1150,
    from: before.theme,
    to: after.theme,
    materialVariant: after.materialVariant,
    drawCalls: after.drawCalls - before.drawCalls,
    bufferCreates: after.bufferCreates - before.bufferCreates,
    textureCreates: after.textureCreates - before.textureCreates,
    approximateFrameIntervalsMs: summarizeFrameIntervals(after.frameTimestamps),
    observedLongTaskMs:
      Math.round(after.longTasks.reduce((total, duration) => total + duration, 0) * 10) / 10,
    note: 'RAF intervals, draw calls, and long tasks are Chromium/SwiftShader diagnostics, not hardware GPU timing.',
  };
}

async function measureCameraActions(session) {
  const results = {};
  for (const action of ['orbit', 'pan', 'zoom']) {
    const before = await session.evaluate('window.__goal05Perf.drawCalls');
    if (action === 'zoom') {
      await session.evaluate(`(() => {
        const canvas = document.querySelector('.diorama-scene-runtime__canvas');
        const bounds = canvas.getBoundingClientRect();
        canvas.dispatchEvent(new WheelEvent('wheel', {
          bubbles: true,
          cancelable: true,
          clientX: bounds.left + bounds.width / 2,
          clientY: bounds.top + bounds.height / 2,
          deltaY: -90,
        }));
      })()`);
    } else {
      const state = await session.evaluate(`(() => {
        const bounds = document.querySelector('.diorama-scene-runtime__canvas').getBoundingClientRect();
        return { x: bounds.left + bounds.width * 0.52, y: bounds.top + bounds.height * 0.52 };
      })()`);
      const button = action === 'pan' ? 'middle' : 'left';
      const buttons = action === 'pan' ? 4 : 1;
      await session.dispatchMouseEvent('mouseMoved', state.x, state.y);
      await session.dispatchMouseEvent('mousePressed', state.x, state.y, button, buttons);
      await session.dispatchMouseEvent('mouseMoved', state.x + 36, state.y + 22, button, buttons);
      await session.dispatchMouseEvent('mouseReleased', state.x + 36, state.y + 22, button, 0);
    }
    await session.evaluate('new Promise(resolve => setTimeout(resolve, 650))');
    const after = await session.evaluate('window.__goal05Perf.drawCalls');
    if (after <= before)
      throw new Error(`The Diorama ${action} interaction did not render any frames.`);
    results[action] = { drawCalls: after - before, observationMs: 650 };
  }
  return results;
}

function summarizeFrameIntervals(timestamps) {
  const intervals = timestamps
    .slice(1)
    .map((timestamp, index) => Math.round((timestamp - timestamps[index]) * 10) / 10);
  if (!intervals.length) return { samples: 0, medianMs: null, p95Ms: null };
  const sorted = [...intervals].sort((left, right) => left - right);
  return {
    samples: intervals.length,
    medianMs: sorted[Math.floor(sorted.length / 2)],
    p95Ms: sorted[Math.min(Math.ceil(sorted.length * 0.95) - 1, sorted.length - 1)],
  };
}

async function openSession(origin, name, options) {
  const profile = await mkdtemp(join(profileDirectory, `${name}-`));
  if (!resolve(profile).startsWith(profileDirectory + sep))
    throw new Error('Browser profile escaped artifacts.');
  profiles.push(profile);
  const session = await startHeadlessBrowser(browser, `${origin}/`, profile, options);
  await session.bringToFront();
  return session;
}

async function waitFor(session, expression, expected, timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs;
  let value;
  while (Date.now() < deadline) {
    value = await session.evaluate(expression);
    if (value === expected) return value;
    await delay(75);
  }
  throw new Error(
    `Browser state did not reach ${JSON.stringify(expected)}; last value: ${JSON.stringify(value)}.`,
  );
}

function createStaticServer(root) {
  return createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1');
    const requestPath = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html';
    const requestedFile = resolve(root, requestPath);
    if (!requestedFile.startsWith(root + sep) && requestedFile !== root) {
      response.writeHead(400);
      response.end();
      return;
    }
    const file =
      existsSync(requestedFile) && statSync(requestedFile).isFile()
        ? requestedFile
        : join(root, 'index.html');
    response.writeHead(200, {
      'content-type': contentType(file),
      'cache-control': file.endsWith('index.html') ? 'no-store' : 'public, max-age=3600',
    });
    if (request.method === 'HEAD') return response.end();
    createReadStream(file).pipe(response);
  });
}

function contentType(path) {
  return (
    {
      '.css': 'text/css; charset=utf-8',
      '.html': 'text/html; charset=utf-8',
      '.ico': 'image/x-icon',
      '.js': 'text/javascript; charset=utf-8',
      '.json': 'application/json',
      '.png': 'image/png',
      '.svg': 'image/svg+xml',
      '.woff2': 'font/woff2',
    }[extname(path)] ?? 'application/octet-stream'
  );
}

function listen(httpServer) {
  return new Promise((resolveAddress, reject) => {
    httpServer.once('error', reject);
    httpServer.listen(0, '127.0.0.1', () => resolveAddress(httpServer.address()));
  });
}
