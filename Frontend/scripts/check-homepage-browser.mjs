import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { findBrowser, startHeadlessBrowser } from './headless-browser-session.mjs';

const frontend = resolve(fileURLToPath(new URL('..', import.meta.url)));
const webRoot = resolve(frontend, 'dist/TheBlockLaundromat/browser');
const artifacts = resolve(frontend, '.artifacts/goal-06');
const screenshots = join(artifacts, 'screenshots');
const traces = join(artifacts, 'traces');
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
await mkdir(traces, { recursive: true });
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

  const modeMigration = await verifyLegacyPreferenceMigration(origin);
  await installRuntimeDiagnostics(primarySession);
  const idleBefore = await primarySession.evaluate('window.__goal06Perf.drawCalls');
  await primarySession.evaluate('new Promise(resolve => setTimeout(resolve, 1000))');
  const idleAfter = await primarySession.evaluate(`({
    drawCalls: window.__goal06Perf.drawCalls,
    pendingFrames: window.__goal06PendingFrames.size,
    heapBytes: performance.memory?.usedJSHeapSize ?? null,
    longTaskMs: window.__goal06LongTasks.reduce((total, duration) => total + duration, 0),
  })`);
  if (idleAfter.drawCalls !== idleBefore || idleAfter.pendingFrames !== 0) {
    throw new Error(`Diorama did not settle to a static idle scene: ${JSON.stringify(idleAfter)}.`);
  }

  const themeAction = await measureThemeTransition(primarySession);
  const cameraActions = await measureCameraActions(primarySession);
  let timeSwipe;
  await primarySession.captureTrace(join(traces, 'diorama-time-swipe-trace.json'), async () => {
    timeSwipe = await measureTimeSwipe(primarySession);
  });
  const clockActions = await measureClockInteractions(primarySession);
  const { diorama: dioramaCaptures, dioramaAccount: dioramaAccountCaptures } =
    await captureDioramaScreenshots(primarySession);

  await switchHomepageMode(primarySession, 'simple');
  await waitFor(
    primarySession,
    "document.querySelector('.recent-projects')?.dataset.projectListState",
    'ready',
  );
  await verifySimpleHomepage(primarySession);
  await verifySimpleLocalization(primarySession);
  const simpleCaptures = await captureSimpleScreenshots(primarySession);
  const accountCaptures = await captureAccountScreenshots(primarySession);

  await primarySession.setViewport(1440, 900);
  await switchHomepageMode(primarySession, 'diorama');
  await waitFor(
    primarySession,
    "document.querySelector('[data-scene-state]')?.dataset.sceneState",
    'ready',
  );
  await switchHomepageMode(primarySession, 'simple');
  const cycles = await verifyInPlaceMountUnmountCycles(primarySession);

  fallbackSession = await openSession(origin, 'fallback', { webglEnabled: false });
  await fallbackSession.setViewport(390, 844, 1, true);
  await waitFor(
    fallbackSession,
    "document.querySelector('[data-scene-state]')?.dataset.sceneState",
    'fallback',
  );
  const fallbackState = await fallbackSession.evaluate(`(() => ({
    accountMenu: Boolean(document.querySelector('.homepage-account-trigger')),
    fallback: Boolean(document.querySelector('.diorama-scene__fallback')),
    canvasCount: document.querySelectorAll('.diorama-scene-runtime__canvas').length,
  }))()`);
  if (!fallbackState.accountMenu || !fallbackState.fallback || fallbackState.canvasCount !== 0) {
    throw new Error(
      `WebGL fallback is missing the shared account menu: ${JSON.stringify(fallbackState)}.`,
    );
  }
  await switchHomepageMode(fallbackSession, 'simple');

  const report = {
    browser: browser.split(/[\\/]/).at(-1),
    renderer: 'headless Chromium WebGL via SwiftShader; diagnostic only',
    initialState,
    modeMigration,
    idle: {
      intervalMs: 1000,
      drawCalls: idleAfter.drawCalls - idleBefore,
      pendingFrames: idleAfter.pendingFrames,
      heapBytes: idleAfter.heapBytes,
      observedLongTaskMs: idleAfter.longTaskMs,
    },
    themeAction,
    cameraActions,
    timeSwipe,
    clockActions,
    motionTrace: 'traces/diorama-time-swipe-trace.json',
    baselineComparison: readBaselineComparison({
      themeAction,
      cameraActions,
      timeSwipe,
      clockActions,
    }),
    cycles,
    fallbackState,
    screenshotCount:
      dioramaCaptures.length +
      dioramaAccountCaptures.length +
      simpleCaptures.length +
      accountCaptures.length,
    screenshots: [
      ...dioramaCaptures,
      ...dioramaAccountCaptures,
      ...simpleCaptures,
      ...accountCaptures,
    ],
  };
  await writeFile(
    join(artifacts, 'browser-performance.json'),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  const visualReviewIndex = [
    '# Goal 06 visual review',
    '',
    'Review is pending; these captures do not imply Gate G approval.',
    '',
    'Motion evidence: [Diorama time swipe trace](traces/diorama-time-swipe-trace.json).',
    '',
    ...report.screenshots.map((filename) => `- [${filename}](screenshots/${filename})`),
    '',
  ].join('\n');
  await writeFile(join(artifacts, 'VISUAL-REVIEW.md'), visualReviewIndex);

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
    "document.querySelector('[data-scene-state]')?.dataset.sceneState",
    'ready',
  );
  const modeLessResult = await migrationSession.evaluate(`(() => {
    const preferences = JSON.parse(localStorage.getItem('the-block-laundromat.ui-preferences') || '{}');
    const sceneRequests = performance.getEntriesByType('resource')
      .map(entry => new URL(entry.name).pathname)
      .filter(path => path.endsWith('.glb') || path.endsWith('.png') && path.includes('/diorama/'));
    return {
      mode: preferences.appearance?.homepageMode,
      version: preferences.version,
      dioramaMounted: Boolean(document.querySelector('.diorama')),
      sceneRequests,
      simpleMounted: Boolean(document.querySelector('.project-page--simple-home')),
    };
  })()`);
  if (
    modeLessResult.mode !== 'diorama' ||
    modeLessResult.version !== 2 ||
    !modeLessResult.dioramaMounted ||
    modeLessResult.simpleMounted ||
    modeLessResult.sceneRequests.length !== 2
  ) {
    throw new Error(
      `Mode-less legacy preferences did not migrate to Diorama: ${JSON.stringify(modeLessResult)}.`,
    );
  }

  await migrationSession.evaluate(`(() => {
    localStorage.setItem('the-block-laundromat.ui-preferences', JSON.stringify({
      version: 1,
      locale: 'en',
      appearance: { homepageMode: 'simple', preset: 'craft' },
    }));
    location.reload();
  })()`);
  await waitFor(
    migrationSession,
    "document.querySelector('.project-page--simple-home')?.className",
    'project-page project-page--simple-home',
  );
  await waitFor(
    migrationSession,
    "document.querySelector('.recent-projects')?.dataset.projectListState",
    'ready',
  );
  const explicitSimple = await migrationSession.evaluate(`(() => ({
    mode: JSON.parse(localStorage.getItem('the-block-laundromat.ui-preferences') || '{}').appearance?.homepageMode,
    dioramaMounted: Boolean(document.querySelector('.diorama')),
    projectMounted: Boolean(document.querySelector('.project-page--simple-home')),
  }))()`);
  if (
    explicitSimple.mode !== 'simple' ||
    explicitSimple.dioramaMounted ||
    !explicitSimple.projectMounted
  ) {
    throw new Error(
      `An explicitly saved Simple mode was not preserved: ${JSON.stringify(explicitSimple)}.`,
    );
  }
  return { modeLess: modeLessResult, explicitSimple };
}

async function verifySimpleHomepage(session) {
  const state = await session.evaluate(`(() => ({
    path: location.pathname,
    create: Boolean(document.querySelector('.project-form .create-action')),
    importActions: document.querySelectorAll('.project-form .structure-json-create-action').length,
    recent: Boolean(document.querySelector('.recent-projects')),
    account: Boolean(document.querySelector('.homepage-account-trigger')),
    themes: document.querySelectorAll('[data-theme-option]').length,
    locales: document.querySelectorAll('[data-locale]').length,
    dioramaMounted: Boolean(document.querySelector('.diorama')),
  }))()`);
  if (
    state.path !== '/' ||
    !state.create ||
    state.importActions !== 2 ||
    !state.recent ||
    !state.account ||
    state.themes !== 4 ||
    state.locales !== 0 ||
    state.dioramaMounted
  ) {
    throw new Error(`Simple project workflows are incomplete: ${JSON.stringify(state)}.`);
  }

  await session.evaluate("document.querySelector('.homepage-account-trigger')?.click()");
  await waitFor(session, "Boolean(document.querySelector('.homepage-account-menu.is-open'))", true);
  const menu = await session.evaluate(`(() => ({
    simpleSelected: document.querySelector('[data-homepage-mode="simple"]')?.getAttribute('aria-checked'),
    dioramaAvailable: Boolean(document.querySelector('[data-homepage-mode="diorama"]')),
    settingsAvailable: Boolean(document.querySelector('.homepage-account-menu-action--settings')),
    languageSelector: Boolean(document.querySelector('[data-locale]')),
  }))()`);
  if (
    menu.simpleSelected !== 'true' ||
    !menu.dioramaAvailable ||
    !menu.settingsAvailable ||
    menu.languageSelector
  ) {
    throw new Error(`The shared account menu is incomplete: ${JSON.stringify(menu)}.`);
  }
  await session.evaluate("document.querySelector('.homepage-account-trigger')?.click()");
}

async function verifySimpleLocalization(session) {
  await setLanguageThroughSettings(session, 'vi');
  await waitFor(session, 'document.documentElement.lang', 'vi');
  await setLanguageThroughSettings(session, 'en');
  await waitFor(session, 'document.documentElement.lang', 'en');
}

async function captureDioramaScreenshots(session) {
  const captured = [];
  const accountCaptured = [];
  for (const theme of themes) {
    await setDioramaTheme(session, theme);
    for (const viewport of viewports) {
      await assertViewport(session, viewport);
      await session.evaluate(
        'document.activeElement instanceof HTMLElement && document.activeElement.blur()',
      );
      const filename = `diorama-${viewport.name}-${theme}.png`;
      await session.captureScreenshot(join(screenshots, filename));
      captured.push(filename);
      await session.evaluate("document.querySelector('.homepage-account-trigger')?.click()");
      await waitFor(
        session,
        "Boolean(document.querySelector('.homepage-account-menu.is-open'))",
        true,
      );
      await session.evaluate('new Promise(resolve => setTimeout(resolve, 350))');
      const accountFilename = `account-diorama-${viewport.name}-${theme}.png`;
      await session.captureScreenshot(join(screenshots, accountFilename));
      accountCaptured.push(accountFilename);
      await session.pressKey('Escape', 'Escape', 27);
      await waitFor(
        session,
        "Boolean(document.querySelector('.homepage-account-menu.is-open'))",
        false,
      );
    }
  }
  return { diorama: captured, dioramaAccount: accountCaptured };
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
    await session.evaluate('new Promise(resolve => setTimeout(resolve, 350))');
    for (const viewport of viewports) {
      await assertViewport(session, viewport);
      await waitFor(
        session,
        "document.querySelector('.recent-projects')?.dataset.projectListState",
        'ready',
      );
      const filename = `simple-${viewport.name}-${theme}.png`;
      await session.captureScreenshot(join(screenshots, filename));
      captured.push(filename);
    }
  }
  return captured;
}

async function captureAccountScreenshots(session) {
  const captured = [];
  for (const theme of themes) {
    await session.evaluate(`document.querySelector('[data-theme-option="${theme}"]')?.click()`);
    await waitFor(
      session,
      `document.querySelector('[data-theme-option="${theme}"]')?.getAttribute('aria-pressed')`,
      'true',
    );
    await session.evaluate('new Promise(resolve => setTimeout(resolve, 350))');
    for (const viewport of viewports) {
      await assertViewport(session, viewport);
      await session.evaluate("document.querySelector('.homepage-account-trigger')?.click()");
      await waitFor(
        session,
        "Boolean(document.querySelector('.homepage-account-menu.is-open'))",
        true,
      );
      await session.evaluate('new Promise(resolve => setTimeout(resolve, 350))');
      const filename = `account-${viewport.name}-${theme}.png`;
      await session.captureScreenshot(join(screenshots, filename));
      captured.push(filename);
      await session.pressKey('Escape', 'Escape', 27);
      await waitFor(
        session,
        "Boolean(document.querySelector('.homepage-account-menu.is-open'))",
        false,
      );
    }
  }
  return captured;
}

async function setDioramaTheme(session, theme) {
  const progressByTheme = { light: 0, craft: 25, raccoon: 50, dark: 75 };
  await session.evaluate(
    `document.querySelector('.diorama-time-dial__quarter[data-time-stage="${theme}"]')?.click()`,
  );
  await waitFor(session, `document.querySelector('.diorama')?.dataset.theme`, theme);
  await waitFor(session, "document.querySelector('.diorama')?.dataset.timeTransition", 'idle');
  await session.evaluate('new Promise(resolve => setTimeout(resolve, 1150))');
  const progress = await session.evaluate(
    `Number(document.querySelector('[style*="--time-progress"]')?.style.getPropertyValue('--time-progress').replace('%', ''))`,
  );
  if (Math.abs(progress - progressByTheme[theme]) > 0.01) {
    throw new Error(
      `Diorama theme ${theme} did not synchronize the time dial: ${JSON.stringify({ progress, expected: progressByTheme[theme] })}.`,
    );
  }
}

async function assertViewport(session, viewport) {
  await session.setViewport(viewport.width, viewport.height, 1, viewport.mobile);
  await session.evaluate('new Promise(resolve => setTimeout(resolve, 120))');
  const state = await session.evaluate(`({
    width: innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    height: innerHeight,
    hasMode: Boolean(document.querySelector('.diorama') || document.querySelector('.project-page--simple-home')),
    focusToolbar: (() => {
      const toolbar = document.querySelector('app-diorama-scene-focus-toolbar')?.getBoundingClientRect();
      const clock = document.querySelector('.diorama-time-dial')?.getBoundingClientRect();
      if (!toolbar || !clock) return null;
      return {
        left: toolbar.left,
        right: toolbar.right,
        top: toolbar.top,
        bottom: toolbar.bottom,
        overlapsClock: toolbar.right > clock.left && toolbar.left < clock.right &&
          toolbar.bottom > clock.top && toolbar.top < clock.bottom,
      };
    })(),
  })`);
  if (state.width !== viewport.width || state.scrollWidth > viewport.width + 1 || !state.hasMode) {
    throw new Error(
      `${viewport.name} homepage overflow or missing content: ${JSON.stringify(state)}.`,
    );
  }
  if (
    state.focusToolbar &&
    (state.focusToolbar.left > state.width * 0.2 ||
      state.focusToolbar.bottom < state.height * 0.75 ||
      state.focusToolbar.overlapsClock)
  ) {
    throw new Error(
      `${viewport.name} Diorama toolbar is not bottom-left or overlaps the clock: ${JSON.stringify(state.focusToolbar)}.`,
    );
  }
}

async function switchHomepageMode(session, mode) {
  await session.evaluate("document.querySelector('.homepage-account-trigger')?.click()");
  await waitFor(session, "Boolean(document.querySelector('.homepage-account-menu.is-open'))", true);
  await session.evaluate(`document.querySelector('[data-homepage-mode="${mode}"]')?.click()`);
  if (mode === 'diorama') {
    await waitFor(
      session,
      "document.querySelector('[data-scene-state]')?.dataset.sceneState",
      'ready',
      30_000,
    );
  } else {
    await waitFor(session, "Boolean(document.querySelector('.project-page--simple-home'))", true);
    await waitFor(
      session,
      "document.querySelector('.recent-projects')?.dataset.projectListState",
      'ready',
    );
  }
  const savedMode = await session.evaluate(
    "JSON.parse(localStorage.getItem('the-block-laundromat.ui-preferences') || '{}').appearance?.homepageMode",
  );
  if (savedMode !== mode) {
    throw new Error(
      `Homepage mode did not persist immediately: ${JSON.stringify({ mode, savedMode })}.`,
    );
  }
}

async function setLanguageThroughSettings(session, locale) {
  await session.evaluate("document.querySelector('.homepage-account-trigger')?.click()");
  await waitFor(session, "Boolean(document.querySelector('.homepage-account-menu.is-open'))", true);
  await session.evaluate(
    "document.querySelector('.homepage-account-menu-action--settings')?.click()",
  );
  await waitFor(session, "Boolean(document.querySelector('.settings-dialog[role=dialog]'))", true);
  const selector = '.settings-dialog [role="combobox"]';
  const selectorJson = JSON.stringify(selector);
  await waitFor(session, `Boolean(document.querySelector(${selectorJson}))`, true);
  await session.evaluate(`document.querySelector(${selectorJson})?.click()`);
  await waitFor(session, "Boolean(document.querySelector('[role=option]'))", true);
  await session.evaluate(
    "document.querySelectorAll('[role=option]')[" + (locale === 'vi' ? 1 : 0) + ']?.click()',
  );
  await session.evaluate("document.querySelector('.settings-dialog .primary')?.click()");
  await waitFor(session, "Boolean(document.querySelector('.settings-dialog[role=dialog]'))", false);
}

async function verifyInPlaceMountUnmountCycles(session) {
  await installFrameTracker(session);
  await installWebGLResourceTracker(session);
  const observations = [];
  const resourceTotals = { created: {}, deleted: {}, contextReleased: {} };
  for (let cycle = 1; cycle <= 20; cycle++) {
    const resourcesBefore = await session.evaluate('window.__goal06GlResources.snapshot()');
    await switchHomepageMode(session, 'diorama');
    await waitFor(
      session,
      "document.querySelector('[data-scene-state]')?.dataset.sceneState",
      'ready',
      30_000,
    );
    const mounted = await session.evaluate(`(() => {
      const canvas = document.querySelector('.diorama-scene-runtime__canvas');
      window.__goal06GlResources.trackCanvas(canvas);
      return {
        canvases: document.querySelectorAll('.diorama-scene-runtime__canvas').length,
        frames: window.__goal06PendingFrames.size,
      };
    })()`);
    await switchHomepageMode(session, 'simple');
    await session.evaluate('new Promise(resolve => setTimeout(resolve, 60))');
    await waitFor(session, 'window.__goal06GlResources.snapshot().contextLostEvents', cycle, 3_000);
    const unmounted = await session.evaluate(`({
      canvases: document.querySelectorAll('.diorama-scene-runtime__canvas').length,
      frames: window.__goal06PendingFrames.size,
      resources: window.__goal06GlResources.snapshot(),
    })`);
    const resourceChanges = summarizeResourceChanges(resourcesBefore, unmounted.resources);
    if (
      mounted.canvases !== 1 ||
      mounted.frames !== 0 ||
      unmounted.canvases !== 0 ||
      unmounted.frames !== 0 ||
      resourceChanges.liveDelta !== 0 ||
      resourceChanges.contextLossRequests !== 1 ||
      resourceChanges.contextLostEvents !== 1 ||
      resourceChanges.unreleased.length > 0
    ) {
      throw new Error(
        `Diorama lifecycle cycle ${cycle} leaked a canvas, animation frame, or WebGL resource: ${JSON.stringify({ mounted, unmounted, resourceChanges })}.`,
      );
    }
    for (const [type, count] of Object.entries(resourceChanges.created)) {
      resourceTotals.created[type] = (resourceTotals.created[type] ?? 0) + count;
    }
    for (const [type, count] of Object.entries(resourceChanges.deleted)) {
      resourceTotals.deleted[type] = (resourceTotals.deleted[type] ?? 0) + count;
    }
    for (const [type, count] of Object.entries(resourceChanges.contextReleased)) {
      resourceTotals.contextReleased[type] = (resourceTotals.contextReleased[type] ?? 0) + count;
    }
    observations.push({
      cycle,
      mountedCanvasCount: mounted.canvases,
      unmountedCanvasCount: unmounted.canvases,
      pendingFrames: unmounted.frames,
      webglObjectsCreated: resourceChanges.created,
      webglObjectsDeleted: resourceChanges.deleted,
      webglObjectsReleasedByContextLoss: resourceChanges.contextReleased,
      contextLossRequests: resourceChanges.contextLossRequests,
      contextLostEvents: resourceChanges.contextLostEvents,
      liveWebglObjectDelta: resourceChanges.liveDelta,
    });
  }
  return {
    total: observations.length,
    passed: observations.length,
    resourceTracking:
      'WebGL2 create/delete API counts and confirmed context loss; not a GPU-memory measurement',
    webglObjectsCreated: resourceTotals.created,
    webglObjectsDeleted: resourceTotals.deleted,
    webglObjectsReleasedByContextLoss: resourceTotals.contextReleased,
    contextLossRequests: observations.reduce((total, item) => total + item.contextLossRequests, 0),
    contextLostEvents: observations.reduce((total, item) => total + item.contextLostEvents, 0),
    liveWebglObjectsAfterEachUnmount: 0,
    observations,
  };
}

async function installWebGLResourceTracker(session) {
  await session.evaluate(`(() => {
    if (window.__goal06GlResources) return;
    const definitions = [
      ['createBuffer', 'deleteBuffer', 'buffers'],
      ['createTexture', 'deleteTexture', 'textures'],
      ['createFramebuffer', 'deleteFramebuffer', 'framebuffers'],
      ['createRenderbuffer', 'deleteRenderbuffer', 'renderbuffers'],
      ['createProgram', 'deleteProgram', 'programs'],
      ['createShader', 'deleteShader', 'shaders'],
      ['createVertexArray', 'deleteVertexArray', 'vertexArrays'],
      ['createSampler', 'deleteSampler', 'samplers'],
      ['createQuery', 'deleteQuery', 'queries'],
      ['createTransformFeedback', 'deleteTransformFeedback', 'transformFeedbacks'],
    ];
    const prototype = globalThis.WebGL2RenderingContext?.prototype;
    if (!prototype) throw new Error('WebGL2 resource instrumentation is unavailable.');
    const contextIds = new WeakMap();
    const contextStates = [];
    const created = Object.create(null);
    const deleted = Object.create(null);
    const contextReleased = Object.create(null);
    let instrumentedResourceTypes = 0;
    let nextContextId = 1;
    const stateFor = context => {
      let state = contextIds.get(context);
      if (!state) {
        state = {
          id: nextContextId++,
          live: new Map(),
          contextLossRequests: 0,
          contextLostEvents: 0,
        };
        contextIds.set(context, state);
        contextStates.push(state);
      }
      return state;
    };
    const markContextLost = state => {
      state.contextLostEvents++;
      for (const [type, objects] of state.live) {
        contextReleased[type] += objects.size;
        objects.clear();
      }
    };
    for (const [createName, deleteName, type] of definitions) {
      const createDescriptor = Object.getOwnPropertyDescriptor(prototype, createName);
      const deleteDescriptor = Object.getOwnPropertyDescriptor(prototype, deleteName);
      if (typeof createDescriptor?.value !== 'function' || typeof deleteDescriptor?.value !== 'function') {
        continue;
      }
      instrumentedResourceTypes++;
      created[type] = 0;
      deleted[type] = 0;
      contextReleased[type] = 0;
      Object.defineProperty(prototype, createName, {
        ...createDescriptor,
        value: function (...args) {
          const resource = createDescriptor.value.apply(this, args);
          const state = stateFor(this);
          let objects = state.live.get(type);
          if (!objects) {
            objects = new Set();
            state.live.set(type, objects);
          }
          if (resource && !objects.has(resource)) {
            objects.add(resource);
            created[type]++;
          }
          return resource;
        },
      });
      Object.defineProperty(prototype, deleteName, {
        ...deleteDescriptor,
        value: function (resource, ...args) {
          const objects = stateFor(this).live.get(type);
          if (objects?.delete(resource)) deleted[type]++;
          return deleteDescriptor.value.call(this, resource, ...args);
        },
      });
    }
    const extensionDescriptor = Object.getOwnPropertyDescriptor(prototype, 'getExtension');
    if (typeof extensionDescriptor?.value !== 'function') {
      throw new Error('WebGL2 extension instrumentation is unavailable.');
    }
    const wrappedExtensions = new WeakSet();
    Object.defineProperty(prototype, 'getExtension', {
      ...extensionDescriptor,
      value: function (name) {
        const extension = extensionDescriptor.value.call(this, name);
        if (name === 'WEBGL_lose_context' && extension && !wrappedExtensions.has(extension)) {
          const loseContext = extension.loseContext;
          if (typeof loseContext !== 'function') {
            throw new Error('WEBGL_lose_context does not expose loseContext().');
          }
          const state = stateFor(this);
          Object.defineProperty(extension, 'loseContext', {
            configurable: true,
            value: function (...args) {
              state.contextLossRequests++;
              return loseContext.apply(this, args);
            },
          });
          wrappedExtensions.add(extension);
        }
        return extension;
      },
    });
    if (instrumentedResourceTypes === 0) {
      throw new Error('No WebGL2 resource APIs could be instrumented.');
    }
    window.__goal06GlResources = {
      trackCanvas(canvas) {
        const context = canvas?.getContext('webgl2');
        if (!context) throw new Error('The mounted Diorama canvas has no WebGL2 context.');
        const state = stateFor(context);
        canvas.addEventListener('webglcontextlost', () => markContextLost(state), { once: true });
      },
      snapshot() {
        const liveCounts = Object.create(null);
        let contextLossRequests = 0;
        let contextLostEvents = 0;
        for (const state of contextStates) {
          contextLossRequests += state.contextLossRequests;
          contextLostEvents += state.contextLostEvents;
          for (const [type, objects] of state.live) {
            liveCounts[type] = (liveCounts[type] ?? 0) + objects.size;
          }
        }
        return {
          created: { ...created },
          deleted: { ...deleted },
          contextReleased: { ...contextReleased },
          live: liveCounts,
          liveTotal: Object.values(liveCounts).reduce((total, count) => total + count, 0),
          contextLossRequests,
          contextLostEvents,
        };
      },
    };
  })()`);
}

function summarizeResourceChanges(before, after) {
  const types = new Set([...Object.keys(before.created), ...Object.keys(after.created)]);
  const created = {};
  const deleted = {};
  const contextReleased = {};
  const unreleased = [];
  for (const type of types) {
    const createdCount = (after.created[type] ?? 0) - (before.created[type] ?? 0);
    const deletedCount = (after.deleted[type] ?? 0) - (before.deleted[type] ?? 0);
    const releasedCount = (after.contextReleased[type] ?? 0) - (before.contextReleased[type] ?? 0);
    const liveDelta = (after.live[type] ?? 0) - (before.live[type] ?? 0);
    created[type] = createdCount;
    deleted[type] = deletedCount;
    contextReleased[type] = releasedCount;
    const unmatchedCount = createdCount - deletedCount - releasedCount;
    if (unmatchedCount !== 0 || liveDelta !== 0) {
      unreleased.push({
        type,
        created: createdCount,
        deleted: deletedCount,
        contextReleased: releasedCount,
        liveDelta,
      });
    }
  }
  return {
    created,
    deleted,
    contextReleased,
    liveDelta: after.liveTotal - before.liveTotal,
    contextLossRequests: after.contextLossRequests - before.contextLossRequests,
    contextLostEvents: after.contextLostEvents - before.contextLostEvents,
    unreleased,
  };
}

async function installFrameTracker(session) {
  await session.evaluate(`(() => {
    if (window.__goal06PendingFrames) return;
    const requestFrame = window.requestAnimationFrame.bind(window);
    const cancelFrame = window.cancelAnimationFrame.bind(window);
    window.__goal06PendingFrames = new Set();
    window.__goal06FrameTimestamps = [];
    window.requestAnimationFrame = callback => {
      let frameId;
      frameId = requestFrame(timestamp => {
        window.__goal06PendingFrames.delete(frameId);
        window.__goal06FrameTimestamps.push(timestamp);
        callback(timestamp);
      });
      window.__goal06PendingFrames.add(frameId);
      return frameId;
    };
    window.cancelAnimationFrame = frameId => {
      window.__goal06PendingFrames.delete(frameId);
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
    window.__goal06Perf = counters;
    window.__goal06LongTasks = [];
    if ('PerformanceObserver' in window) {
      try {
        new PerformanceObserver(entries => {
          for (const entry of entries.getEntries()) window.__goal06LongTasks.push(entry.duration);
        }).observe({ type: 'longtask' });
      } catch {}
    }
  })()`);
}

async function measureThemeTransition(session) {
  const before = await session.evaluate(`({
    drawCalls: window.__goal06Perf.drawCalls,
    bufferCreates: window.__goal06Perf.bufferCreates,
    textureCreates: window.__goal06Perf.textureCreates,
    timestampIndex: window.__goal06Perf.timestamps.length,
    frameIndex: window.__goal06FrameTimestamps.length,
    longTaskCount: window.__goal06LongTasks.length,
    theme: document.querySelector('.diorama')?.dataset.theme,
    materialVariant:
      document.querySelector('.diorama-scene-runtime__canvas')?.dataset.materialVariant,
  })`);
  await setDioramaTheme(session, 'raccoon');
  const after = await session.evaluate(`({
    drawCalls: window.__goal06Perf.drawCalls,
    bufferCreates: window.__goal06Perf.bufferCreates,
    textureCreates: window.__goal06Perf.textureCreates,
    timestamps: window.__goal06Perf.timestamps.slice(${before.timestampIndex}),
    frameTimestamps: window.__goal06FrameTimestamps.slice(${before.frameIndex}),
    longTasks: window.__goal06LongTasks.slice(${before.longTaskCount}),
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
    const before = await session.evaluate('window.__goal06Perf.drawCalls');
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
      const delta = action === 'orbit' ? { x: 12, y: 36 } : { x: 36, y: 22 };
      await session.dispatchMouseEvent('mouseMoved', state.x, state.y);
      await session.dispatchMouseEvent('mousePressed', state.x, state.y, button, buttons);
      await session.dispatchMouseEvent(
        'mouseMoved',
        state.x + delta.x,
        state.y + delta.y,
        button,
        buttons,
      );
      await session.dispatchMouseEvent(
        'mouseReleased',
        state.x + delta.x,
        state.y + delta.y,
        button,
        0,
      );
    }
    await session.evaluate('new Promise(resolve => setTimeout(resolve, 650))');
    const after = await session.evaluate('window.__goal06Perf.drawCalls');
    if (after <= before)
      throw new Error(`The Diorama ${action} interaction did not render any frames.`);
    results[action] = { drawCalls: after - before, observationMs: 650 };
  }
  return results;
}

async function measureTimeSwipe(session) {
  await setDioramaTheme(session, 'light');
  const before = await session.evaluate(`({
    drawCalls: window.__goal06Perf.drawCalls,
    timestampIndex: window.__goal06Perf.timestamps.length,
    frameIndex: window.__goal06FrameTimestamps.length,
    longTaskCount: window.__goal06LongTasks.length,
    progress: Number(document.querySelector('.diorama')?.querySelector('[style*="--time-progress"]')?.style.getPropertyValue('--time-progress').replace('%', '')),
    theme: document.querySelector('.diorama')?.dataset.theme,
  })`);
  const center = await session.evaluate(`(() => {
    const bounds = document.querySelector('.diorama-scene-runtime__canvas').getBoundingClientRect();
    return { x: bounds.left + bounds.width * 0.54, y: bounds.top + bounds.height * 0.52 };
  })()`);
  await session.evaluate(`(() => {
    const canvas = document.querySelector('.diorama-scene-runtime__canvas');
    const pointerId = 73;
    const dispatch = (type, clientX, clientY) => canvas.dispatchEvent(new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      pointerId,
      pointerType: 'mouse',
      isPrimary: true,
      button: 0,
      clientX,
      clientY,
    }));
    dispatch('pointerdown', ${center.x}, ${center.y});
    dispatch('pointermove', ${center.x + 42}, ${center.y + 1});
    dispatch('pointermove', ${center.x + 140}, ${center.y + 1});
    dispatch('pointerup', ${center.x + 140}, ${center.y + 1});
  })()`);
  await session.evaluate('new Promise(resolve => setTimeout(resolve, 180))');
  const gestureState = await session.evaluate(`({
    theme: document.querySelector('.diorama')?.dataset.theme,
    transition: document.querySelector('.diorama')?.dataset.timeTransition,
    progress: Number(document.querySelector('.diorama')?.querySelector('[style*="--time-progress"]')?.style.getPropertyValue('--time-progress').replace('%', '')),
  })`);
  if (gestureState.theme !== 'craft') {
    throw new Error(
      `Left-to-right Overview swipe did not advance Morning to Minecraft: ${JSON.stringify({ before, gestureState })}.`,
    );
  }
  await waitFor(session, "document.querySelector('.diorama')?.dataset.theme", 'craft');
  try {
    await waitFor(session, "document.querySelector('.diorama')?.dataset.timeTransition", 'idle');
  } catch (error) {
    const finalState = await session.evaluate(`(() => {
      const homepage = document.querySelector('.diorama');
      const progress = document.querySelector('[style*="--time-progress"]')?.style
        .getPropertyValue('--time-progress');
      return {
        theme: homepage?.dataset.theme,
        transition: homepage?.dataset.timeTransition,
        transitionId: homepage?.dataset.timeTransitionId,
        semanticProgress: homepage?.dataset.timeProgress,
        dialProgress: progress,
        sceneAnimationsEnabled: homepage?.dataset.sceneAnimationsEnabled,
        reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
        drawCalls: window.__goal06Perf?.drawCalls,
        pendingFrames: window.__goal06PendingFrames?.size,
      };
    })()`);
    throw new Error(`Time swipe failed to settle: ${JSON.stringify(finalState)}. ${error.message}`);
  }
  await session.evaluate('new Promise(resolve => setTimeout(resolve, 600))');
  const after = await session.evaluate(`({
    drawCalls: window.__goal06Perf.drawCalls,
    timestamps: window.__goal06Perf.timestamps.slice(${before.timestampIndex}),
    frameTimestamps: window.__goal06FrameTimestamps.slice(${before.frameIndex}),
    longTasks: window.__goal06LongTasks.slice(${before.longTaskCount}),
    theme: document.querySelector('.diorama')?.dataset.theme,
    transition: document.querySelector('.diorama')?.dataset.timeTransition,
    progress: Number(document.querySelector('.diorama')?.querySelector('[style*="--time-progress"]')?.style.getPropertyValue('--time-progress').replace('%', '')),
  })`);
  if (
    after.theme !== 'craft' ||
    after.transition !== 'idle' ||
    after.drawCalls <= before.drawCalls
  ) {
    throw new Error(
      `Overview swipe did not continuously settle scene time: ${JSON.stringify({ before, after })}.`,
    );
  }
  return {
    fromTheme: before.theme,
    toTheme: after.theme,
    startProgressPercent: before.progress,
    endProgressPercent: after.progress,
    drawCalls: after.drawCalls - before.drawCalls,
    approximateFrameIntervalsMs: summarizeFrameIntervals(after.frameTimestamps),
    observedLongTaskMs:
      Math.round(after.longTasks.reduce((total, duration) => total + duration, 0) * 10) / 10,
  };
}

async function measureClockInteractions(session) {
  await setDioramaTheme(session, 'dark');
  const before = await session.evaluate(`({
    drawCalls: window.__goal06Perf.drawCalls,
    theme: document.querySelector('.diorama')?.dataset.theme,
    progress: Number(document.querySelector('.diorama')?.dataset.timeProgress),
  })`);
  if (before.theme !== 'dark' || Math.abs(before.progress - 3) > 0.001) {
    throw new Error(`Clock boundary probe expected Dark at progress 3: ${JSON.stringify(before)}.`);
  }

  await dragClockQuarter(session, 'left', 'top');
  const morning = await waitForClockState(session, 'light', 4);
  await dragClockQuarter(session, 'top', 'left');
  const reverse = await waitForClockState(session, 'dark', 3);

  await session.evaluate(
    `document.querySelector('.diorama-time-dial__quarter[data-time-stage="craft"]')?.click()`,
  );
  const directStage = await waitForClockState(session, 'craft', 1);

  for (const theme of ['dark', 'light', 'craft']) {
    await session.evaluate(
      `document.querySelector('.diorama-time-dial__quarter[data-time-stage="${theme}"]')?.click()`,
    );
    await session.evaluate('new Promise(resolve => setTimeout(resolve, 90))');
  }
  await waitFor(session, "document.querySelector('.diorama')?.dataset.timeTransition", 'idle');
  const rapidSelection = await session.evaluate(`({
    theme: document.querySelector('.diorama')?.dataset.theme,
    progress: Number(document.querySelector('.diorama')?.dataset.timeProgress),
    transition: document.querySelector('.diorama')?.dataset.timeTransition,
  })`);
  const rapidSelectionPhase = ((rapidSelection.progress % 4) + 4) % 4;
  if (
    rapidSelection.theme !== 'craft' ||
    Math.abs(rapidSelectionPhase - 1) > 0.001 ||
    rapidSelection.transition !== 'idle'
  ) {
    throw new Error(
      `Rapid clock stage changes lost their semantic state: ${JSON.stringify(rapidSelection)}.`,
    );
  }

  const after = await session.evaluate('window.__goal06Perf.drawCalls');
  return {
    startsAtSelectedTheme: { theme: before.theme, progress: before.progress },
    crossesMinecraftCycleBoundary: { theme: morning.theme, progress: morning.progress, turns: 1 },
    reversesFromCurrentProgress: { theme: reverse.theme, progress: reverse.progress, turns: -1 },
    directStageSelection: directStage,
    rapidStageSelection: rapidSelection,
    drawCalls: after - before.drawCalls,
  };
}

async function dragClockQuarter(session, from, to) {
  const points = await session.evaluate(`(() => {
    const bounds = document.querySelector('.diorama-time-dial__face').getBoundingClientRect();
    const radius = bounds.width * 0.2;
    const center = { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 };
    const quarters = {
      top: { x: center.x, y: center.y - radius },
      left: { x: center.x - radius, y: center.y },
    };
    return { from: quarters['${from}'], to: quarters['${to}'] };
  })()`);
  await session.dispatchMouseEvent('mouseMoved', points.from.x, points.from.y);
  await session.dispatchMouseEvent('mousePressed', points.from.x, points.from.y, 'left', 1);
  await session.dispatchMouseEvent('mouseMoved', points.to.x, points.to.y, 'left', 1);
  await session.dispatchMouseEvent('mouseReleased', points.to.x, points.to.y, 'left', 0);
}

async function waitForClockState(session, theme, progress) {
  await waitFor(session, "document.querySelector('.diorama')?.dataset.theme", theme);
  await waitFor(session, "document.querySelector('.diorama')?.dataset.timeTransition", 'idle');
  const state = await session.evaluate(`({
    theme: document.querySelector('.diorama')?.dataset.theme,
    progress: Number(document.querySelector('.diorama')?.dataset.timeProgress),
    transition: document.querySelector('.diorama')?.dataset.timeTransition,
  })`);
  if (
    state.theme !== theme ||
    Math.abs(state.progress - progress) > 0.001 ||
    state.transition !== 'idle'
  ) {
    throw new Error(
      `Clock did not settle to ${theme} at progress ${progress}: ${JSON.stringify(state)}.`,
    );
  }
  return state;
}

function readBaselineComparison(current) {
  const baselinePath = resolve(frontend, '.artifacts/goal-05/browser-performance.json');
  if (!existsSync(baselinePath)) return { available: false };
  const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));
  return {
    available: true,
    runner: baseline.renderer,
    previous: {
      themeAction: baseline.themeAction,
      cameraActions: baseline.cameraActions,
    },
    current,
    note: 'Goal 05 and Goal 06 browser runs use headless Chromium with SwiftShader on this runner; compare only their diagnostic counters and frame intervals.',
  };
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
