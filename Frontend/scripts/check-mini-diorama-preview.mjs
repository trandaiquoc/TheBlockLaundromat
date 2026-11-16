import { createReadStream, existsSync, statSync } from 'node:fs';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findBrowser, startHeadlessBrowser } from './headless-browser-session.mjs';

const frontend = resolve(fileURLToPath(new URL('..', import.meta.url)));
const webRoot = resolve(frontend, 'dist/TheBlockLaundromat/browser');
const artifacts = resolve(frontend, '.artifacts/mini-diorama-preview');
const screenshots = join(artifacts, 'screenshots');
const browser = findBrowser();
if (!existsSync(join(webRoot, 'index.html'))) {
  throw new Error('Production build is missing. Run npm run build before browser verification.');
}

await mkdir(screenshots, { recursive: true });
const profiles = [];
const server = createStaticServer(webRoot);
let webglSession;
let fallbackSession;

try {
  const address = await listen(server);
  const origin = `http://127.0.0.1:${address.port}`;
  webglSession = await openSession(origin, 'webgl', { webglEnabled: true });
  await webglSession.setViewport(1440, 900);
  await waitFor(
    webglSession,
    "document.querySelector('.mini-diorama__scene')?.dataset.previewState",
    'ready',
  );
  await assertReadyScene(webglSession);
  const frameTiming = await measureFrameTiming(webglSession);

  const screenshotsTaken = [];
  await verifyLayoutAndCapture(webglSession, screenshots, screenshotsTaken, 1440, 900, false);
  await verifyLayoutAndCapture(webglSession, screenshots, screenshotsTaken, 1024, 768, false);
  await verifyLayoutAndCapture(webglSession, screenshots, screenshotsTaken, 390, 844, true);
  await verifyLayoutAndCapture(webglSession, screenshots, screenshotsTaken, 320, 568, true);

  await verifySceneActions(webglSession);
  await verifyThemesAndLocalization(webglSession);
  await verifySettings(webglSession);
  await verifyReducedMotion(webglSession);
  await verifyCanvasPicking(webglSession);
  await verifyMountUnmountCycles(webglSession);
  await verifyProjectScreenRoot(webglSession, screenshots, screenshotsTaken);

  fallbackSession = await openSession(origin, 'fallback');
  await fallbackSession.setViewport(390, 844, 1, true);
  await waitFor(
    fallbackSession,
    "document.querySelector('.mini-diorama__scene')?.dataset.previewState",
    'fallback',
  );
  await assertFallback(fallbackSession);
  await fallbackSession.evaluate(`(() => {
    const button = document.querySelector('.mini-diorama__actions button:nth-child(2)');
    button.click();
  })()`);
  await waitFor(
    fallbackSession,
    "document.querySelector('.mini-diorama__actions button:nth-child(2)')?.getAttribute('aria-pressed')",
    'true',
  );
  const fallbackAction = await fallbackSession.evaluate(`(() => ({
    selected: document.querySelector('.mini-diorama__actions button:nth-child(2)')?.getAttribute('aria-pressed'),
    message: document.querySelector('.mini-diorama__live-message')?.textContent?.trim(),
    canvasCount: document.querySelectorAll('.mini-diorama__scene canvas').length,
  }))()`);
  if (
    fallbackAction.selected !== 'true' ||
    !fallbackAction.message ||
    fallbackAction.canvasCount !== 0
  ) {
    throw new Error(`DOM fallback action failed: ${JSON.stringify(fallbackAction)}.`);
  }
  await fallbackSession.captureScreenshot(join(screenshots, 'fallback-mobile-390x844.png'));
  screenshotsTaken.push('fallback-mobile-390x844.png');

  console.log(
    'Browser verification passed: WebGL scene, four viewport captures, keyboard actions, four themes, EN/VI, Settings, reduced motion, pointer picking, 20 route mount/unmount cycles, root Project Screen, and WebGL fallback.',
  );
  console.log(
    `Headless SwiftShader frame interval: ${JSON.stringify(frameTiming)} (diagnostic only).`,
  );
  console.log(`Screenshots: ${screenshotsTaken.join(', ')}`);
} finally {
  await fallbackSession?.close();
  await webglSession?.close();
  await new Promise((resolveClose) => server.close(resolveClose));
  await Promise.all(profiles.map((profile) => rm(profile, { recursive: true, force: true })));
}

async function openSession(origin, route, options) {
  const profile = await mkdtemp(join(artifacts, `${route}-profile-`));
  if (!resolve(profile).startsWith(artifacts + sep))
    throw new Error('Browser profile escaped artifacts.');
  profiles.push(profile);
  return startHeadlessBrowser(browser, `${origin}/mini-diorama-preview`, profile, options);
}

async function assertReadyScene(session) {
  const state = await session.evaluate(`(() => ({
    previewState: document.querySelector('.mini-diorama__scene')?.dataset.previewState,
    canvasCount: document.querySelectorAll('.mini-diorama__scene canvas').length,
    canvasSize: (() => {
      const canvas = document.querySelector('.mini-diorama__scene canvas');
      return canvas ? [canvas.width, canvas.height] : null;
    })(),
    fallback: document.querySelector('.mini-diorama__fallback')?.textContent?.trim() ?? null,
  }))()`);
  if (
    state.previewState !== 'ready' ||
    state.canvasCount !== 1 ||
    !state.canvasSize?.[0] ||
    !state.canvasSize?.[1]
  ) {
    throw new Error(`WebGL preview did not mount a drawable canvas: ${JSON.stringify(state)}.`);
  }
}

async function measureFrameTiming(session) {
  return session.evaluate(`new Promise(resolve => {
    const timestamps = [];
    const collect = timestamp => {
      timestamps.push(timestamp);
      if (timestamps.length < 121) requestAnimationFrame(collect);
      else {
        const intervals = timestamps.slice(1).map((time, index) => time - timestamps[index]).sort((a, b) => a - b);
        const percentile = value => intervals[Math.min(intervals.length - 1, Math.ceil(intervals.length * value) - 1)];
        resolve({
          samples: intervals.length,
          medianMs: Number(percentile(0.5).toFixed(2)),
          p95Ms: Number(percentile(0.95).toFixed(2)),
        });
      }
    };
    requestAnimationFrame(collect);
  })`);
}

async function verifyLayoutAndCapture(session, directory, captured, width, height, mobile) {
  await session.setViewport(width, height, 1, mobile);
  await session.evaluate(
    'new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))',
  );
  const layout = await session.evaluate(`(() => {
    const rect = selector => {
      const element = document.querySelector(selector);
      const bounds = element?.getBoundingClientRect();
      return bounds ? { left: bounds.left, top: bounds.top, right: bounds.right, bottom: bounds.bottom, width: bounds.width, height: bounds.height } : null;
    };
    return {
      viewport: [innerWidth, innerHeight],
      document: [document.documentElement.scrollWidth, document.documentElement.scrollHeight],
      header: rect('.mini-diorama__header'),
      scene: rect('.mini-diorama__scene'),
      actions: rect('.mini-diorama__actions'),
      controls: rect('.mini-diorama__preferences'),
      buttons: [...document.querySelectorAll('.mini-diorama__actions button')].map(button => {
        const box = button.getBoundingClientRect();
        return [box.left, box.right, box.top, box.bottom];
      }),
    };
  })()`);
  const hasOverflow = layout.document[0] > width || layout.document[1] > height;
  const elementsOutside = [layout.header, layout.scene, layout.actions, layout.controls].some(
    (box) =>
      !box || box.left < -1 || box.right > width + 1 || box.top < -1 || box.bottom > height + 1,
  );
  const actionOutside = layout.buttons.some(
    ([left, right, top, bottom]) =>
      left < -1 || right > width + 1 || top < -1 || bottom > height + 1,
  );
  if (
    layout.viewport[0] !== width ||
    layout.viewport[1] !== height ||
    hasOverflow ||
    elementsOutside ||
    actionOutside ||
    layout.scene.height < 100
  ) {
    throw new Error(
      `${mobile ? 'Mobile' : 'Desktop'} layout failed at ${width}x${height}: ${JSON.stringify(layout)}.`,
    );
  }
  const name = `scene-${width}x${height}.png`;
  await session.captureScreenshot(join(directory, name));
  captured.push(name);
}

async function verifySceneActions(session) {
  const controls = [
    ['Overview', 'undefined'],
    ['Washer', 'washer'],
    ['Project board', 'project-board'],
    ['Greet the Raccoon', 'raccoon'],
  ];
  for (const [label, expectedTarget] of controls) {
    const action = await session.evaluate(`(() => {
      const button = [...document.querySelectorAll('.mini-diorama__actions button')]
        .find(candidate => candidate.textContent.trim() === ${JSON.stringify(label)});
      button?.focus();
      return Boolean(button && document.activeElement === button);
    })()`);
    if (!action) throw new Error(`Could not focus the ${label} scene action.`);
    await session.pressKey('Enter', 'Enter', 13);
    const result = await session.evaluate(`(() => ({
      selected: document.querySelector('.mini-diorama__actions button[aria-pressed="true"]')?.textContent?.trim(),
      message: document.querySelector('.mini-diorama__live-message')?.textContent?.trim(),
    }))()`);
    if (
      !result.selected ||
      !result.message ||
      (expectedTarget === 'undefined' && result.selected !== 'Overview')
    ) {
      throw new Error(
        `Keyboard action ${label} did not update the DOM state: ${JSON.stringify(result)}.`,
      );
    }
  }
}

async function verifyThemesAndLocalization(session) {
  for (const theme of ['craft', 'raccoon', 'light', 'dark']) {
    await session.evaluate(`document.querySelector('[data-theme-option="${theme}"]').click()`);
    const selectedTheme = await waitFor(session, 'document.documentElement.dataset.theme', theme);
    if (selectedTheme !== theme) throw new Error(`The ${theme} theme did not apply.`);
  }
  await session.evaluate("document.querySelector('[data-locale=vi]').click()");
  const vietnamese = await session.evaluate(`({
    lang: document.documentElement.lang,
    title: document.querySelector('.mini-diorama__brand h1')?.textContent?.trim(),
    actions: [...document.querySelectorAll('.mini-diorama__actions button')].map(button => button.textContent.trim()),
  })`);
  if (
    vietnamese.lang !== 'vi' ||
    !vietnamese.title?.includes('tiệm giặt') ||
    !vietnamese.actions.some((label) => label.includes('Máy giặt'))
  ) {
    throw new Error(`Vietnamese preview copy was not applied: ${JSON.stringify(vietnamese)}.`);
  }
  await session.evaluate("document.querySelector('[data-locale=en]').click()");
  const english = await session.evaluate(`({
    lang: document.documentElement.lang,
    title: document.querySelector('.mini-diorama__brand h1')?.textContent?.trim(),
  })`);
  if (english.lang !== 'en' || english.title !== 'A little laundromat in motion') {
    throw new Error(`English preview copy was not restored: ${JSON.stringify(english)}.`);
  }
}

async function verifySettings(session) {
  await session.evaluate("document.querySelector('.settings-button').click()");
  await waitFor(session, "Boolean(document.querySelector('.settings-dialog[role=dialog]'))", true);
  await session.evaluate("document.querySelector('.settings-close').click()");
  await waitFor(session, "Boolean(document.querySelector('.settings-dialog'))", false);
}

async function verifyReducedMotion(session) {
  await session.setReducedMotion(true);
  const reduced = await waitFor(
    session,
    "matchMedia('(prefers-reduced-motion: reduce)').matches",
    true,
  );
  if (!reduced) throw new Error('The browser did not apply the reduced-motion emulation.');
  await session.evaluate(
    "document.querySelector('.mini-diorama__actions button:last-child').click()",
  );
  const greetingStillWorks = await session.evaluate(`({
    selected: document.querySelector('.mini-diorama__actions button:last-child')?.getAttribute('aria-pressed'),
    message: document.querySelector('.mini-diorama__live-message')?.textContent?.trim(),
  })`);
  if (greetingStillWorks.selected !== 'true' || !greetingStillWorks.message) {
    throw new Error(
      `Reduced motion disabled the semantic greeting action: ${JSON.stringify(greetingStillWorks)}.`,
    );
  }
  await session.setReducedMotion(false);
}

async function verifyCanvasPicking(session) {
  await session.evaluate(
    "document.querySelector('.mini-diorama__actions button:first-child').click()",
  );
  await settleCamera(session);
  await tapSceneTarget(session, 'Washer', 0.68, 0.62, 'mouse');

  await session.evaluate(
    "document.querySelector('.mini-diorama__actions button:first-child').click()",
  );
  await settleCamera(session);
  await tapSceneTarget(session, 'Project board', 0.6, 0.18, 'mouse');

  await session.evaluate(
    "document.querySelector('.mini-diorama__actions button:first-child').click()",
  );
  await settleCamera(session);
  await tapSceneTarget(session, 'Greet the Raccoon', 0.26, 0.58, 'mouse');

  await session.evaluate(
    "document.querySelector('.mini-diorama__actions button:first-child').click()",
  );
  await settleCamera(session);
  await tapSceneTarget(session, 'Washer', 0.68, 0.62, 'touch');
}

async function settleCamera(session) {
  await session.evaluate('new Promise(resolve => setTimeout(resolve, 900))');
}

async function tapSceneTarget(session, expectedAction, xRatio, yRatio, pointerType) {
  const hit = await session.evaluate(`(() => {
    const canvas = document.querySelector('.mini-diorama__scene canvas');
    const bounds = canvas.getBoundingClientRect();
    const eventInit = {
      bubbles: true,
      pointerId: 1,
      pointerType: ${JSON.stringify(pointerType)},
      isPrimary: true,
      button: 0,
    };
    const x = bounds.left + bounds.width * ${xRatio};
    const y = bounds.top + bounds.height * ${yRatio};
    canvas.dispatchEvent(new PointerEvent('pointermove', { ...eventInit, clientX: x, clientY: y }));
    canvas.dispatchEvent(new PointerEvent('pointerdown', { ...eventInit, clientX: x, clientY: y }));
    canvas.dispatchEvent(new PointerEvent('pointerup', { ...eventInit, clientX: x, clientY: y }));
    return new Promise(resolve => requestAnimationFrame(() => resolve({
      selected: document.querySelector('.mini-diorama__actions button[aria-pressed="true"]')?.textContent?.trim(),
      cursor: canvas.style.cursor,
    })));
  })()`);
  if (hit.selected !== expectedAction) {
    throw new Error(
      `Expected ${expectedAction} from a ${pointerType} tap, received ${JSON.stringify(hit)}.`,
    );
  }
}

async function verifyMountUnmountCycles(session) {
  await session.evaluate(`(() => {
    const requestFrame = window.requestAnimationFrame.bind(window);
    const cancelFrame = window.cancelAnimationFrame.bind(window);
    window.__miniDioramaPendingFrames = new Set();
    window.requestAnimationFrame = callback => {
      let frameId;
      frameId = requestFrame(timestamp => {
        window.__miniDioramaPendingFrames.delete(frameId);
        callback(timestamp);
      });
      window.__miniDioramaPendingFrames.add(frameId);
      return frameId;
    };
    window.cancelAnimationFrame = frameId => {
      window.__miniDioramaPendingFrames.delete(frameId);
      cancelFrame(frameId);
    };
  })()`);
  await session.evaluate('new Promise(resolve => setTimeout(resolve, 60))');

  for (let cycle = 0; cycle < 20; cycle++) {
    await session.evaluate("document.querySelector('.mini-diorama__back').click()");
    await waitFor(session, "Boolean(document.querySelector('.project-page'))", true);
    const unmounted = await session.evaluate(`({
      canvases: document.querySelectorAll('.mini-diorama__scene canvas').length,
      frames: window.__miniDioramaPendingFrames.size,
    })`);
    if (unmounted.canvases !== 0 || unmounted.frames !== 0) {
      throw new Error(
        `Scene resources remained after route unmount ${cycle + 1}: ${JSON.stringify(unmounted)}.`,
      );
    }
    await session.evaluate('history.back()');
    await waitFor(
      session,
      "document.querySelector('.mini-diorama__scene')?.dataset.previewState",
      'ready',
    );
    const remounted = await session.evaluate(`({
      canvases: document.querySelectorAll('.mini-diorama__scene canvas').length,
      frames: window.__miniDioramaPendingFrames.size,
    })`);
    if (remounted.canvases !== 1 || remounted.frames !== 1) {
      throw new Error(
        `Scene resources did not remount cleanly at cycle ${cycle + 1}: ${JSON.stringify(remounted)}.`,
      );
    }
  }
}

async function verifyProjectScreenRoot(session, directory, captured) {
  await session.evaluate("document.querySelector('.mini-diorama__back')?.click()");
  await waitFor(session, "Boolean(document.querySelector('.project-page'))", true);
  await session.setViewport(1440, 900);
  const rootState = await session.evaluate(`(() => ({
    path: location.pathname,
    projectPage: Boolean(document.querySelector('.project-page')),
    createForm: Boolean(document.querySelector('.project-form .create-action')),
    importActions: document.querySelectorAll('.project-form .structure-json-create-action').length,
    recentProjects: Boolean(document.querySelector('.project-page .recent-projects')),
    diorama: Boolean(document.querySelector('.mini-diorama')),
  }))()`);
  if (
    rootState.path !== '/' ||
    !rootState.projectPage ||
    !rootState.createForm ||
    rootState.importActions !== 2 ||
    !rootState.recentProjects ||
    rootState.diorama
  ) {
    throw new Error(`The root Project Screen changed unexpectedly: ${JSON.stringify(rootState)}.`);
  }
  const name = 'project-screen-root.png';
  await session.captureScreenshot(join(directory, name));
  captured.push(name);
}

async function assertFallback(session) {
  const state = await session.evaluate(`(() => ({
    previewState: document.querySelector('.mini-diorama__scene')?.dataset.previewState,
    fallback: Boolean(document.querySelector('.mini-diorama__fallback')),
    message: document.querySelector('.mini-diorama__fallback')?.textContent?.trim(),
    controls: document.querySelectorAll('.mini-diorama__actions button').length,
    canvasCount: document.querySelectorAll('.mini-diorama__scene canvas').length,
  }))()`);
  if (
    state.previewState !== 'fallback' ||
    !state.fallback ||
    !state.message ||
    state.controls !== 4 ||
    state.canvasCount !== 0
  ) {
    throw new Error(`WebGL fallback was incomplete: ${JSON.stringify(state)}.`);
  }
}

async function waitFor(session, expression, expected, timeoutMs = 10_000) {
  const deadline = Date.now() + timeoutMs;
  let value;
  while (Date.now() < deadline) {
    value = await session.evaluate(expression);
    if (value === expected) return value;
    await new Promise((resolveWait) => setTimeout(resolveWait, 50));
  }
  throw new Error(
    `Browser state did not reach ${JSON.stringify(expected)}; last value was ${JSON.stringify(value)}.`,
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
    response.writeHead(200, { 'content-type': contentType(file), 'cache-control': 'no-store' });
    if (request.method === 'HEAD') {
      response.end();
      return;
    }
    createReadStream(file).pipe(response);
  });
}

function listen(server) {
  return new Promise((resolveListen, rejectListen) => {
    server.once('error', rejectListen);
    server.listen(0, '127.0.0.1', () => resolveListen(server.address()));
  });
}

function contentType(path) {
  return (
    {
      '.css': 'text/css; charset=utf-8',
      '.html': 'text/html; charset=utf-8',
      '.ico': 'image/x-icon',
      '.js': 'text/javascript; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.png': 'image/png',
      '.svg': 'image/svg+xml',
      '.woff2': 'font/woff2',
    }[extname(path)] ?? 'application/octet-stream'
  );
}
