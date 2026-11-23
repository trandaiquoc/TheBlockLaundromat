import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { findBrowser, startHeadlessBrowser } from './headless-browser-session.mjs';

const frontend = resolve(fileURLToPath(new URL('..', import.meta.url)));
const webRoot = resolve(frontend, 'dist/TheBlockLaundromat/browser');
const artifacts = resolve(frontend, '.artifacts/goal-08');
const screenshots = join(artifacts, 'screenshots');
const traces = join(artifacts, 'traces');
const profileDirectory = join(artifacts, 'profiles');
const browser = findBrowser();
const themes = ['craft', 'light', 'raccoon', 'dark'];
const browserAnimationTimeoutMs = 45_000;
const viewports = [
  { name: 'desktop', width: 1440, height: 900, mobile: false },
  { name: 'mobile', width: 390, height: 844, mobile: true },
];
const profiles = [];
let primarySession;
let fallbackSession;
let migrationSession;
let workspaceSession;
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
      .filter(entry => {
        const path = new URL(entry.name).pathname;
        return path.endsWith('/Octagonal-Laundromat.glb') ||
          path.includes('/washer-alternate/Washer.glb') ||
          path.endsWith('/forest-floor.png');
      })
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
    initialState.assets.length !== 3
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
  let spatialTransition;
  await primarySession.captureTrace(
    join(traces, 'diorama-focus-transition-trace.json'),
    async () => {
      await focusDioramaTarget(primarySession, 'project-board');
      const boardFocused = await primarySession.evaluate(`({
        phase: document.querySelector('.diorama')?.dataset.spatialPhase,
        target: document.querySelector('.diorama')?.dataset.spatialTarget,
        panelVisible: document.querySelector('.board-panel')?.hidden === false,
      })`);
      await focusDioramaTarget(primarySession, 'overview');
      const boardReturned = await primarySession.evaluate(`({
        phase: document.querySelector('.diorama')?.dataset.spatialPhase,
        target: document.querySelector('.diorama')?.dataset.spatialTarget,
      })`);
      await primarySession.evaluate(
        'document.querySelector(\'[data-hotspot-target="courier"]\')?.click()',
      );
      const courierFocusing = await primarySession.evaluate(`(() => ({
        phase: document.querySelector('.diorama')?.dataset.spatialPhase,
        paperHidden: document.querySelector('.paper-backdrop')?.hidden !== false,
      }))()`);
      if (courierFocusing.phase !== 'focusing' || !courierFocusing.paperHidden) {
        throw new Error(
          `Courier opened its paper before camera focus: ${JSON.stringify(courierFocusing)}.`,
        );
      }
      await waitFor(
        primarySession,
        "document.querySelector('.diorama')?.dataset.spatialPhase",
        'focused',
        browserAnimationTimeoutMs,
      );
      await waitFor(
        primarySession,
        "document.querySelector('.diorama')?.dataset.spatialTarget",
        'courier',
        browserAnimationTimeoutMs,
      );
      await waitFor(
        primarySession,
        "document.querySelector('.paper-backdrop')?.hidden === false",
        true,
        browserAnimationTimeoutMs,
      );
      const courierFocused = await primarySession.evaluate(`({
        phase: document.querySelector('.diorama')?.dataset.spatialPhase,
        target: document.querySelector('.diorama')?.dataset.spatialTarget,
        panelVisible: document.querySelector('.paper-backdrop')?.hidden === false,
      })`);
      await focusDioramaTarget(primarySession, 'overview');
      const courierReturned = await primarySession.evaluate(`({
        phase: document.querySelector('.diorama')?.dataset.spatialPhase,
        target: document.querySelector('.diorama')?.dataset.spatialTarget,
      })`);
      if (
        boardFocused.phase !== 'focused' ||
        boardFocused.target !== 'project-board' ||
        !boardFocused.panelVisible ||
        boardReturned.phase !== 'overview' ||
        courierFocused.phase !== 'focused' ||
        courierFocused.target !== 'courier' ||
        !courierFocused.panelVisible ||
        courierReturned.phase !== 'overview'
      ) {
        throw new Error(
          `Board or Courier camera flight did not complete both ways: ${JSON.stringify({ boardFocused, boardReturned, courierFocusing, courierFocused, courierReturned })}.`,
        );
      }
      spatialTransition = {
        boardFocused,
        boardReturned,
        courierFocusing,
        courierFocused,
        courierReturned,
      };
    },
  );
  const cameraActions = await measureCameraActions(primarySession);
  let timeSwipe;
  await primarySession.captureTrace(join(traces, 'diorama-time-swipe-trace.json'), async () => {
    timeSwipe = await measureTimeSwipe(primarySession);
  });
  await primarySession.setReducedMotion(true);
  const reducedMotionEnabled = await primarySession.evaluate(
    "matchMedia('(prefers-reduced-motion: reduce)').matches",
  );
  if (!reducedMotionEnabled) {
    throw new Error('Browser did not enable reduced motion for the remaining screenshot checks.');
  }
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

  workspaceSession = await openSession(origin, 'workspace', { webglEnabled: true });
  await workspaceSession.setReducedMotion(true);
  await workspaceSession.setViewport(1440, 900);
  await waitFor(
    workspaceSession,
    "document.querySelector('[data-scene-state]')?.dataset.sceneState",
    'ready',
  );
  if (
    !(await workspaceSession.evaluate("matchMedia('(prefers-reduced-motion: reduce)').matches"))
  ) {
    throw new Error(
      'Workspace browser session did not enable reduced motion for settled-state checks.',
    );
  }
  await createDioramaSampleProjects(workspaceSession);
  const previewFixture = await seedDioramaSamplePreview(workspaceSession);
  const projectWorkspaceCaptures = await captureProjectWorkspaceScreenshots(workspaceSession);
  const spatialLayout = await verifySpatialPanelLayouts(workspaceSession);
  await switchHomepageMode(workspaceSession, 'simple');
  const cycles = await verifyInPlaceMountUnmountCycles(workspaceSession);

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
    spatialTransition,
    spatialMotionTrace: 'traces/diorama-focus-transition-trace.json',
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
    spatialLayout,
    fallbackState,
    projectPreviewFixture: {
      projectName: 'An Extraordinarily Long Laundry Structure',
      format: 'image/png',
      sizeBytes: previewFixture.size,
      note: 'Generated in-browser and stored only in the isolated test profile.',
    },
    screenshotCount:
      dioramaCaptures.length +
      dioramaAccountCaptures.length +
      simpleCaptures.length +
      accountCaptures.length +
      projectWorkspaceCaptures.length,
    screenshots: [
      ...dioramaCaptures,
      ...dioramaAccountCaptures,
      ...simpleCaptures,
      ...accountCaptures,
      ...projectWorkspaceCaptures,
    ],
  };
  await writeFile(
    join(artifacts, 'browser-performance.json'),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  const visualReviewIndex = [
    '# Goal 08 visual review',
    '',
    'Generated evidence. Review is pending; these captures do not imply Gate G approval.',
    '',
    '## Overview',
    '',
    '| Desktop | Mobile |',
    '| --- | --- |',
    '| ![Diorama overview, desktop](screenshots/diorama-desktop-craft-en.png) | ![Diorama overview, mobile](screenshots/diorama-mobile-craft-en.png) |',
    '',
    '## Create project',
    '',
    '| Desktop | Mobile |',
    '| --- | --- |',
    '| ![Courier and paper form, desktop](screenshots/project-courier-paper-desktop-craft-en.png) | ![Paper form, mobile](screenshots/project-courier-paper-mobile-craft-en.png) |',
    '',
    '## Project Board',
    '',
    '| Desktop | Mobile |',
    '| --- | --- |',
    '| ![Blurred room with floating board, desktop](screenshots/project-board-desktop-craft-en.png) | ![Floating project board, mobile](screenshots/project-board-mobile-craft-en.png) |',
    '',
    '## Washer',
    '',
    '| Desktop | Mobile |',
    '| --- | --- |',
    '| ![Washer with drum preview, desktop](screenshots/project-washer-desktop-craft-en.png) | ![Washer with drum preview, mobile](screenshots/project-washer-mobile-craft-en.png) |',
    '',
    'The washer screenshot uses a browser-generated PNG fixture stored in the isolated test profile; no preview image was added to product assets or user projects.',
    '',
    'Camera focus/return trace: [diorama-focus-transition-trace.json](traces/diorama-focus-transition-trace.json). Time swipe trace: [diorama-time-swipe-trace.json](traces/diorama-time-swipe-trace.json). Browser report: [browser-performance.json](browser-performance.json).',
    '',
    'The complete capture set contains 176 screenshots across desktop/mobile, four themes, and English/Vietnamese. Responsive bounds were measured at 320, 390, 760, 1024, and 1440 px.',
    '',
    '## Complete capture index',
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
  await workspaceSession?.close();
  await new Promise((resolveClose) => server.close(resolveClose));
  await Promise.all(
    profiles.map((profile) =>
      rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 500 }).catch(
        (error) => {
          console.error(`Could not clean browser profile ${profile}:`, error);
          process.exitCode = 1;
        },
      ),
    ),
  );
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
    modeLessResult.sceneRequests.length !== 3
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
  for (const locale of ['en', 'vi']) {
    if ((await session.evaluate('document.documentElement.lang')) !== locale) {
      await setLanguageThroughSettings(session, locale);
    }
    for (const theme of themes) {
      await setDioramaTheme(session, theme);
      for (const viewport of viewports) {
        await assertViewport(session, viewport);
        await session.evaluate(
          'document.activeElement instanceof HTMLElement && document.activeElement.blur()',
        );
        const filename = `diorama-${viewport.name}-${theme}-${locale}.png`;
        await session.captureScreenshot(join(screenshots, filename));
        captured.push(filename);
        await session.evaluate("document.querySelector('.homepage-account-trigger')?.click()");
        await waitFor(
          session,
          "Boolean(document.querySelector('.homepage-account-menu.is-open'))",
          true,
        );
        await session.evaluate('new Promise(resolve => setTimeout(resolve, 350))');
        const accountFilename = `account-diorama-${viewport.name}-${theme}-${locale}.png`;
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
  }
  await setLanguageThroughSettings(session, 'en');
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

async function createDioramaSampleProjects(session) {
  const names = [
    'Project Note 01',
    'Project Note 02',
    'Project Note 03',
    'Project Note 04',
    'An Extraordinarily Long Laundry Structure',
  ];
  for (const name of names) {
    await focusDioramaTarget(session, 'courier');
    const serializedName = JSON.stringify(name);
    await session.evaluate(`(() => {
      const input = document.querySelector('.paper-panel__form input:not([type="number"])');
      if (!input) throw new Error('Diorama project name input is missing.');
      input.value = ${serializedName};
      input.dispatchEvent(new Event('input', { bubbles: true }));
      document.querySelector('.paper-panel__form button[type="submit"]')?.click();
    })()`);
    await waitFor(session, 'location.pathname', '/editor', 30_000);
    await session.evaluate('new Promise(resolve => setTimeout(resolve, 450))');
    await session.evaluate(
      "document.querySelector('.app-menus .menu-entry > .app-menu-trigger')?.click()",
    );
    await waitFor(session, 'Boolean(document.querySelector(\'.menu-popover[role="menu"]\'))', true);
    await session.evaluate(`(() => {
      const projects = document.querySelector(
        '.menu-entry .menu-popover[role="menu"] [role="menuitem"]',
      );
      if (!projects) throw new Error('The editor Projects command is missing.');
      projects.click();
    })()`);
    await waitFor(
      session,
      `location.pathname === '/' || Boolean(document.querySelector('.ui-alert-dialog'))`,
      true,
      10_000,
    );
    const leavePrompt = await session.evaluate(`(() => ({
      pathname: location.pathname,
      title: document.querySelector('.ui-alert-dialog h2')?.textContent?.trim() ?? '',
    }))()`);
    if (leavePrompt.pathname !== '/') {
      if (
        !/unsaved changes|thay đổi chưa lưu|assets are still being prepared|tài nguyên vẫn đang được chuẩn bị/i.test(
          leavePrompt.title,
        )
      ) {
        throw new Error(`Unexpected Editor leave prompt: ${JSON.stringify(leavePrompt)}.`);
      }
      await session.evaluate(
        "document.querySelector('.ui-alert-dialog__actions button:last-child')?.click()",
      );
    }
    await waitFor(session, 'location.pathname', '/', 30_000);
    await waitFor(
      session,
      "document.querySelector('[data-scene-state]')?.dataset.sceneState",
      'ready',
      30_000,
    );
  }
}

async function seedDioramaSamplePreview(session) {
  return session.evaluate(`(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not create the browser-only preview fixture.');
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        context.fillStyle = (x + y) % 2 ? '#d6bc87' : '#b88a55';
        context.fillRect(x * 8, y * 8, 8, 8);
      }
    }
    context.fillStyle = '#557444';
    context.fillRect(12, 16, 18, 19);
    context.fillStyle = '#879e59';
    context.fillRect(10, 11, 22, 10);
    context.fillStyle = '#75462f';
    context.fillRect(38, 29, 15, 23);
    context.fillStyle = '#d3ad6f';
    context.fillRect(36, 25, 19, 7);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('Could not encode the browser-only preview fixture.');
    const database = await new Promise((resolve, reject) => {
      const request = indexedDB.open('minecraft-builder', 8);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('Could not open the preview fixture database.'));
    });
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(['project-summaries', 'project-previews'], 'readwrite');
      const summaries = transaction.objectStore('project-summaries').getAll();
      let result;
      summaries.onsuccess = () => {
        const project = summaries.result.find(item => item.name === 'An Extraordinarily Long Laundry Structure');
        if (!project) {
          transaction.abort();
          reject(new Error('The long-name project preview fixture is missing.'));
          return;
        }
        transaction.objectStore('project-previews').put({ id: project.id, updatedAt: project.updatedAt, blob });
        result = { projectId: project.id, updatedAt: project.updatedAt, size: blob.size };
      };
      transaction.oncomplete = () => { database.close(); resolve(result); };
      transaction.onerror = () => { database.close(); reject(transaction.error ?? new Error('Could not save the browser-only preview fixture.')); };
      transaction.onabort = () => { database.close(); reject(transaction.error ?? new Error('Preview fixture transaction was aborted.')); };
    });
  })()`);
}

async function captureProjectWorkspaceScreenshots(session) {
  const captured = [];
  await focusDioramaTarget(session, 'overview');
  await waitFor(
    session,
    'document.querySelector(\'[data-hotspot-target="project-board"]\')?.hidden === false',
    true,
  );
  await session.evaluate(
    'document.querySelector(\'[data-hotspot-target="project-board"]\')?.focus()',
  );
  await session.pressKey('Enter', 'Enter', 13);
  await waitFor(session, "document.querySelector('.diorama')?.dataset.spatialPhase", 'focused');
  await waitFor(
    session,
    "document.querySelector('.diorama')?.dataset.spatialTarget",
    'project-board',
  );
  await waitFor(
    session,
    "document.activeElement === document.querySelector('.board-panel h2')",
    true,
  );
  await session.pressKey('Escape', 'Escape', 27);
  await waitFor(
    session,
    "['returning', 'overview'].includes(document.querySelector('.diorama')?.dataset.spatialPhase)",
    true,
  );
  await waitFor(session, "document.querySelector('.diorama')?.dataset.spatialPhase", 'overview');
  const focusRestored = await session.evaluate(`(() =>
    document.activeElement?.getAttribute('data-hotspot-target') === 'project-board'
  )()`);
  if (!focusRestored)
    throw new Error('Returning from the board did not restore focus to its hotspot.');

  for (const locale of ['en', 'vi']) {
    if ((await session.evaluate('document.documentElement.lang')) !== locale) {
      await setLanguageThroughSettings(session, locale);
    }
    for (const theme of themes) {
      await setDioramaTheme(session, theme);
      for (const viewport of viewports) {
        await assertViewport(session, viewport);
        await focusDioramaTarget(session, 'project-board');
        const boardState = await session.evaluate(`(() => ({
        visible: document.querySelector('.board-panel')?.hidden === false,
        phase: document.querySelector('.diorama')?.dataset.spatialPhase,
        target: document.querySelector('.diorama')?.dataset.spatialTarget,
        transform: getComputedStyle(document.querySelector('.board-panel')).transform,
        bounds: (() => {
          const rect = document.querySelector('.board-panel').getBoundingClientRect();
          return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
        })(),
        notes: document.querySelectorAll('.project-note').length,
        noteColors: new Set(Array.from(document.querySelectorAll('.project-note'), note => note.getAttribute('data-note-color'))).size,
        nextDisabled: document.querySelector('.board-panel__pagination button:last-child')?.disabled,
        backdropFilter: getComputedStyle(document.querySelector('.board-panel')).backdropFilter,
        timeBounds: (() => { const rect = document.querySelector('.diorama-time-dial').getBoundingClientRect(); return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom }; })(),
        accountBounds: (() => { const rect = document.querySelector('.homepage-account-trigger').getBoundingClientRect(); return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom }; })(),
      }))()`);
        if (
          !boardState.visible ||
          boardState.phase !== 'focused' ||
          boardState.target !== 'project-board' ||
          boardState.transform.startsWith('matrix3d(') ||
          boardState.bounds.left < 0 ||
          boardState.bounds.right > viewport.width + 1 ||
          boardState.bounds.top < 0 ||
          boardState.bounds.bottom > viewport.height + 1 ||
          boardState.notes !== 4 ||
          boardState.noteColors !== 4 ||
          boardState.nextDisabled ||
          !boardState.backdropFilter.includes('blur') ||
          overlaps(boardState.bounds, boardState.timeBounds) ||
          overlaps(boardState.bounds, boardState.accountBounds)
        ) {
          throw new Error(
            `The screen-space Diorama project board is incomplete: ${JSON.stringify(boardState)}.`,
          );
        }
        await captureProjectScreenshot(
          session,
          captured,
          `project-board-${viewport.name}-${theme}-${locale}.png`,
        );

        await session.evaluate(`(() => {
        const input = document.querySelector('.board-panel__search input');
        input.value = 'Project Note 01';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      })()`);
        await waitFor(session, 'document.querySelectorAll(".project-note").length', 1);
        await session.evaluate(`(() => {
        const input = document.querySelector('.board-panel__search input');
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        const sort = document.querySelector('.board-panel__sort');
        sort.value = 'name';
        sort.dispatchEvent(new Event('change', { bubbles: true }));
      })()`);
        await waitFor(session, 'document.querySelectorAll(".project-note").length', 4);
        await session.evaluate(
          "document.querySelector('.board-panel__pagination button:last-child')?.click()",
        );
        await session.evaluate('new Promise(resolve => setTimeout(resolve, 80))');
        await captureProjectScreenshot(
          session,
          captured,
          `project-board-page-2-${viewport.name}-${theme}-${locale}.png`,
        );
        await session.evaluate(
          "document.querySelector('.board-panel__pagination button:first-child')?.click()",
        );
        await session.evaluate("document.querySelector('.project-note__select')?.click()");

        await waitFor(
          session,
          "document.querySelector('.diorama')?.dataset.spatialPhase",
          'focused',
        );
        await waitFor(
          session,
          "document.querySelector('.diorama')?.dataset.spatialTarget",
          'washer',
        );
        await waitFor(session, "document.querySelector('.washer-panel')?.hidden === false", true);
        const washerNameState = await session.evaluate(`(() => ({
        text: document.querySelector('.washer-panel__heading')?.textContent?.trim() ?? '',
        transform: getComputedStyle(document.querySelector('.washer-panel')).transform,
        bounds: (() => {
          const rect = document.querySelector('.washer-panel').getBoundingClientRect();
          return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
        })(),
        portalVisible: document.querySelector('.washer-preview-portal')?.hidden === false,
        portalBounds: (() => { const rect = document.querySelector('.washer-preview-portal').getBoundingClientRect(); return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom }; })(),
        nameplate: (() => { const element = document.querySelector('.washer-nameplate'); const rect = element.getBoundingClientRect(); return { visible: !element.hidden, text: element.textContent?.trim() ?? '', marquee: element.dataset.marquee, left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom }; })(),
        actionButtons: document.querySelectorAll('.washer-panel__actions button').length,
      }))()`);
        if (
          !washerNameState.text ||
          washerNameState.transform.startsWith('matrix3d(') ||
          washerNameState.bounds.left < 0 ||
          washerNameState.bounds.right > viewport.width + 1 ||
          washerNameState.bounds.top < 0 ||
          washerNameState.bounds.bottom > viewport.height + 1 ||
          !washerNameState.portalVisible ||
          washerNameState.portalBounds.left < 0 ||
          washerNameState.portalBounds.right > viewport.width + 1 ||
          washerNameState.portalBounds.top < 0 ||
          washerNameState.portalBounds.bottom > viewport.height + 1 ||
          !washerNameState.nameplate.visible ||
          washerNameState.nameplate.right > viewport.width + 1 ||
          washerNameState.nameplate.bottom > viewport.height + 1 ||
          washerNameState.actionButtons !== 2
        ) {
          throw new Error(
            `The Washer details panel is not a readable screen-space panel: ${JSON.stringify(washerNameState)}.`,
          );
        }
        const washerPreview = await session.evaluate(`(() => {
        const image = document.querySelector('.washer-preview-portal img');
        return {
        hasImage: Boolean(image),
        imageLoaded: Boolean(image?.complete && image.naturalWidth > 0),
        imageSource: image?.getAttribute('src') ?? '',
        hasError: Boolean(document.querySelector('.washer-panel__error')),
        portal: document.querySelector('.washer-preview-portal')?.getBoundingClientRect().toJSON() ?? null,
      }; })()`);
        await waitFor(
          session,
          "Boolean((document.querySelector('.washer-preview-portal img')?.complete ?? false) && (document.querySelector('.washer-preview-portal img')?.naturalWidth ?? 0) > 0)",
          true,
          10_000,
        );
        if (
          !washerPreview.hasImage ||
          !washerPreview.imageLoaded ||
          !washerPreview.imageSource.startsWith('blob:') ||
          washerPreview.hasError
        ) {
          throw new Error(
            `The Washer drum does not show the revision-bound preview fixture: ${JSON.stringify(washerPreview)}.`,
          );
        }
        await captureProjectScreenshot(
          session,
          captured,
          `project-washer-${viewport.name}-${theme}-${locale}.png`,
        );
        await session.evaluate(
          "document.querySelector('.washer-panel__actions button:last-child')?.click()",
        );
        await waitFor(
          session,
          "Boolean(document.querySelector('app-ui-alert-dialog .ui-alert-dialog'))",
          true,
        );
        await captureProjectScreenshot(
          session,
          captured,
          `project-delete-dialog-${viewport.name}-${theme}-${locale}.png`,
        );
        await session.pressKey('Escape', 'Escape', 27);
        await waitFor(session, "Boolean(document.querySelector('app-ui-alert-dialog'))", false);

        await focusDioramaTarget(session, 'overview');
        await session.evaluate(
          'document.querySelector(\'[data-hotspot-target="courier"]\')?.click()',
        );
        const courierFocusing = await session.evaluate(`(() => ({
        phase: document.querySelector('.diorama')?.dataset.spatialPhase,
        paperHidden: document.querySelector('.paper-backdrop')?.hidden !== false,
      }))()`);
        const reducedMotion = await session.evaluate(
          "matchMedia('(prefers-reduced-motion: reduce)').matches",
        );
        if (
          !reducedMotion &&
          (courierFocusing.phase !== 'focusing' || !courierFocusing.paperHidden)
        ) {
          throw new Error(
            `Courier opened its paper before camera focus: ${JSON.stringify(courierFocusing)}.`,
          );
        }
        await waitFor(
          session,
          "document.querySelector('.diorama')?.dataset.spatialPhase",
          'focused',
        );
        await waitFor(
          session,
          "document.querySelector('.diorama')?.dataset.spatialTarget",
          'courier',
        );
        await waitFor(session, "document.querySelector('.paper-backdrop')?.hidden === false", true);
        const courierPanel = await session.evaluate(`(() => ({
        visible: document.querySelector('.paper-panel')?.hidden === false,
        transform: getComputedStyle(document.querySelector('.paper-panel')).transform,
        bounds: (() => {
          const rect = document.querySelector('.paper-panel').getBoundingClientRect();
          return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
        })(),
      }))()`);
        if (
          !courierPanel.visible ||
          courierPanel.transform.startsWith('matrix3d(') ||
          courierPanel.bounds.left < 0 ||
          courierPanel.bounds.right > viewport.width + 1 ||
          courierPanel.bounds.top < 0 ||
          courierPanel.bounds.bottom > viewport.height + 1
        ) {
          throw new Error(
            `Courier's paper form is not a readable screen-space panel: ${JSON.stringify(courierPanel)}.`,
          );
        }
        await captureProjectScreenshot(
          session,
          captured,
          `project-courier-paper-${viewport.name}-${theme}-${locale}.png`,
        );
        await session.evaluate('document.querySelector(\'[data-project-tab="import"]\')?.click()');
        await waitFor(
          session,
          "document.querySelector('[data-project-tab=\"import\"]')?.getAttribute('aria-selected')",
          'true',
        );
        const importOptions = await session.evaluate(`(() => ({
        tabCount: document.querySelectorAll('.paper-panel__tabs [role="tab"]').length,
        actionCount: document.querySelectorAll('#diorama-project-import-panel .project-utilities button').length,
      }))()`);
        if (importOptions.tabCount !== 2 || importOptions.actionCount !== 2) {
          throw new Error(
            `Courier does not expose Create and Import options: ${JSON.stringify(importOptions)}.`,
          );
        }
        await captureProjectScreenshot(
          session,
          captured,
          `project-import-options-${viewport.name}-${theme}-${locale}.png`,
        );
        await session.evaluate(
          "document.querySelector('.project-utilities--compact button:last-of-type')?.click()",
        );
        await waitFor(session, "Boolean(document.querySelector('.backup-import-dialog'))", true);
        await captureProjectScreenshot(
          session,
          captured,
          `project-backup-dialog-${viewport.name}-${theme}-${locale}.png`,
        );
        await session.pressKey('Escape', 'Escape', 27);
        await waitFor(session, "Boolean(document.querySelector('.backup-import-dialog'))", false);
        await waitFor(
          session,
          "Boolean(document.querySelector('.paper-panel')) && document.querySelector('.paper-backdrop')?.hidden === false",
          true,
        );

        await session.evaluate(`(() => {
        const input = document.querySelector('.project-utilities input[type="file"]');
        if (!input) throw new Error('The Structure JSON picker is missing.');
        const files = new DataTransfer();
        files.items.add(new File(['{ broken'], 'invalid.json', { type: 'application/json' }));
        input.files = files.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      })()`);
        await waitFor(
          session,
          "Boolean(document.querySelector('.project-import-dialog:not(.backup-import-dialog) .project-import-error'))",
          true,
        );
        await captureProjectScreenshot(
          session,
          captured,
          `project-structure-import-dialog-${viewport.name}-${theme}-${locale}.png`,
        );
        await session.pressKey('Escape', 'Escape', 27);
        await waitFor(
          session,
          "Boolean(document.querySelector('.project-import-dialog:not(.backup-import-dialog)'))",
          false,
        );
        await waitFor(
          session,
          "Boolean(document.querySelector('.paper-panel')) && document.querySelector('.paper-backdrop')?.hidden === false",
          true,
        );
        await session.pressKey('Escape', 'Escape', 27);
        await waitFor(
          session,
          "Boolean(document.querySelector('.paper-panel')) && document.querySelector('.paper-backdrop')?.hidden === false",
          false,
        );
      }
    }
  }
  await focusDioramaTarget(session, 'overview');
  await setLanguageThroughSettings(session, 'en');
  return captured;
}

async function focusDioramaTarget(session, target) {
  if (target === 'overview') {
    const phase = await session.evaluate(
      "document.querySelector('.diorama')?.dataset.spatialPhase",
    );
    if (phase === 'overview') return;
    const paperOpen = await session.evaluate(
      "document.querySelector('.paper-backdrop')?.hidden === false",
    );
    if (paperOpen) {
      await session.pressKey('Escape', 'Escape', 27);
    } else {
      await session.evaluate(`(() => {
        document.querySelector('.board-panel:not([hidden]) .board-panel__header button, .washer-panel:not([hidden]) .washer-panel__header button')?.click();
      })()`);
    }
    await waitFor(
      session,
      "document.querySelector('.diorama')?.dataset.spatialPhase",
      'overview',
      browserAnimationTimeoutMs,
    );
    return;
  }

  await focusDioramaTarget(session, 'overview');
  const hotspot = `[data-hotspot-target="${target}"]`;
  try {
    await waitFor(
      session,
      `document.querySelector('${hotspot}')?.hidden === false`,
      true,
      browserAnimationTimeoutMs,
    );
  } catch (error) {
    const hotspotState = await session.evaluate(`(() => {
      const element = document.querySelector('${hotspot}');
      const bounds = element?.getBoundingClientRect();
      const style = element ? getComputedStyle(element) : undefined;
      return {
        sceneState: document.querySelector('[data-scene-state]')?.dataset.sceneState,
        phase: document.querySelector('.diorama')?.dataset.spatialPhase,
        activeTarget: document.querySelector('.diorama')?.dataset.spatialTarget,
        elementPresent: Boolean(element),
        hidden: element?.hidden,
        label: element?.textContent?.trim(),
        bounds: bounds && { left: bounds.left, right: bounds.right, top: bounds.top, bottom: bounds.bottom },
        display: style?.display,
        visibility: style?.visibility,
        opacity: style?.opacity,
      };
    })()`);
    throw new Error(`${error.message} Hotspot state: ${JSON.stringify(hotspotState)}.`);
  }
  await session.evaluate(`document.querySelector('${hotspot}')?.click()`);
  const focusedPanel =
    target === 'courier'
      ? '.paper-backdrop'
      : `${target === 'project-board' ? '.board-panel' : '.washer-panel'}`;
  await waitFor(
    session,
    "document.querySelector('.diorama')?.dataset.spatialPhase",
    'focused',
    browserAnimationTimeoutMs,
  );
  await waitFor(
    session,
    `document.querySelector('.diorama')?.dataset.spatialTarget`,
    target,
    browserAnimationTimeoutMs,
  );
  try {
    await waitFor(
      session,
      `document.querySelector('${focusedPanel}')?.hidden === false`,
      true,
      browserAnimationTimeoutMs,
    );
  } catch (error) {
    const panelState = await session.evaluate(`(() => {
      const workspace = document.querySelector('.diorama-project-workspace');
      const panel = document.querySelector('${focusedPanel}');
      return {
        phase: document.querySelector('.diorama')?.dataset.spatialPhase,
        target: document.querySelector('.diorama')?.dataset.spatialTarget,
        workspaceClass: workspace?.className,
        panelPresent: Boolean(panel),
        panelHidden: panel?.hidden,
        panelDisplay: panel ? getComputedStyle(panel).display : undefined,
        heading: panel?.querySelector('h2')?.textContent?.trim(),
        activeElement: document.activeElement?.className ?? document.activeElement?.tagName,
        reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      };
    })()`);
    throw new Error(`${error.message} Focused panel state: ${JSON.stringify(panelState)}.`);
  }
}

async function verifySpatialPanelLayouts(session) {
  const layoutViewports = [
    { name: 'desktop', width: 1440, height: 900, mobile: false },
    { name: 'tablet', width: 1024, height: 768, mobile: false },
    { name: 'compact', width: 760, height: 800, mobile: true },
    { name: 'mobile', width: 390, height: 844, mobile: true },
    { name: 'small-mobile', width: 320, height: 568, mobile: true },
  ];
  const report = {};

  for (const target of ['project-board', 'washer', 'courier']) {
    if (target === 'washer') {
      await focusDioramaTarget(session, 'project-board');
      await session.evaluate("document.querySelector('.project-note__select')?.click()");
      await waitFor(session, "document.querySelector('.washer-panel')?.hidden === false", true);
    } else {
      await focusDioramaTarget(session, target);
    }

    const observations = [];
    for (const viewport of layoutViewports) {
      await assertViewport(session, viewport);
      const state = await session.evaluate(`(() => {
        const rect = selector => {
          const element = document.querySelector(selector);
          if (!element) return null;
          const box = element.getBoundingClientRect();
          return { left: box.left, right: box.right, top: box.top, bottom: box.bottom, width: box.width, height: box.height };
        };
        const panel = rect(${JSON.stringify(target === 'courier' ? '.paper-panel' : target === 'project-board' ? '.board-panel' : '.washer-panel')});
        const time = rect('.diorama-time-dial');
        const account = rect('.homepage-account-trigger');
        const logo = rect('.diorama-header__logo');
        const nameplateElement = document.querySelector('.washer-nameplate');
        const nameplate = rect('.washer-nameplate');
        const previewElement = document.querySelector('.washer-preview-portal');
        const preview = rect('.washer-preview-portal');
        const courierHotspot = document.querySelector('[data-hotspot-target="courier"]');
        return {
          width: innerWidth,
          height: innerHeight,
          scrollWidth: document.documentElement.scrollWidth,
          panel,
          time,
          account,
          logo,
          panelHidden: document.querySelector(${JSON.stringify(target === 'courier' ? '.paper-panel' : target === 'project-board' ? '.board-panel' : '.washer-panel')})?.hidden !== false,
          panelFilter: getComputedStyle(document.querySelector(${JSON.stringify(target === 'project-board' ? '.board-panel' : target === 'courier' ? '.paper-panel' : '.washer-panel')})).backdropFilter,
          nameplateVisible: !!nameplateElement && !nameplateElement.hidden,
          nameplate,
          previewVisible: !!previewElement && !previewElement.hidden,
          preview,
          courierX: Number.parseFloat(courierHotspot?.style.left ?? 'NaN'),
        };
      })()`);
      const outsideViewport = [state.panel, state.nameplate, state.preview]
        .filter(Boolean)
        .some(
          (box) =>
            box.left < -1 ||
            box.top < -1 ||
            box.right > viewport.width + 1 ||
            box.bottom > viewport.height + 1,
        );
      const controlOverlap =
        overlaps(state.panel, state.time) || overlaps(state.panel, state.account);
      const leftCourierScene =
        target !== 'courier' || viewport.width <= 760 || !Number.isFinite(state.courierX)
          ? true
          : state.courierX < viewport.width * 0.55 && state.panel.left > viewport.width * 0.45;
      if (
        state.width !== viewport.width ||
        state.scrollWidth > viewport.width + 1 ||
        state.panelHidden ||
        outsideViewport ||
        controlOverlap ||
        !leftCourierScene ||
        (target === 'project-board' && !state.panelFilter.includes('blur')) ||
        (target === 'washer' && (!state.nameplateVisible || !state.previewVisible))
      ) {
        throw new Error(
          `${viewport.name} ${target} layout escaped its safe area or lost its composition: ${JSON.stringify(state)}.`,
        );
      }
      observations.push({
        viewport: viewport.name,
        panel: state.panel,
        time: state.time,
        account: state.account,
        raccoonX: target === 'courier' ? state.courierX : undefined,
      });
    }
    report[target] = observations;
    await focusDioramaTarget(session, 'overview');
  }
  return { viewports: layoutViewports.map(({ name }) => name), targets: report };
}

function overlaps(first, second) {
  if (!first || !second) return false;
  return (
    first.left < second.right &&
    first.right > second.left &&
    first.top < second.bottom &&
    first.bottom > second.top
  );
}

async function captureProjectScreenshot(session, captures, filename) {
  await session.evaluate('new Promise(resolve => setTimeout(resolve, 180))');
  await session.captureScreenshot(join(screenshots, filename));
  captures.push(filename);
}

async function setDioramaTheme(session, theme) {
  const progressByTheme = { light: 0, craft: 25, raccoon: 50, dark: 75 };
  await session.evaluate(
    `document.querySelector('.diorama-time-dial__quarter[data-time-stage="${theme}"]')?.click()`,
  );
  await waitFor(session, `document.querySelector('.diorama')?.dataset.theme`, theme);
  await waitFor(
    session,
    "document.querySelector('.diorama')?.dataset.timeTransition",
    'idle',
    browserAnimationTimeoutMs,
  );
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
  await waitFor(
    session,
    `(() => {
      const canvas = document.querySelector('.diorama-scene__canvas');
      if (!canvas) return true;
      const rect = canvas.getBoundingClientRect();
      return Math.abs(rect.width - ${viewport.width}) < 1 && Math.abs(rect.height - ${viewport.height}) < 1;
    })()`,
    true,
    10_000,
  );
  await waitFor(
    session,
    `Array.from(document.querySelectorAll('.diorama-scene__hotspot:not([hidden])')).every(button => {
      const rect = button.getBoundingClientRect();
      return rect.left >= -1 && rect.top >= -1 && rect.right <= ${viewport.width + 1} && rect.bottom <= ${viewport.height + 1};
    })`,
    true,
    10_000,
  );
  const state = await session.evaluate(`({
    width: innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    height: innerHeight,
    canvasBounds: (() => {
      const canvas = document.querySelector('.diorama-scene__canvas');
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height };
    })(),
    hasMode: Boolean(document.querySelector('.diorama') || document.querySelector('.project-page--simple-home')),
    hotspots: Array.from(document.querySelectorAll('.diorama-scene__hotspot:not([hidden])'), button => {
      const rect = button.getBoundingClientRect();
      return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
    }),
  })`);
  if (state.width !== viewport.width || state.scrollWidth > viewport.width + 1 || !state.hasMode) {
    throw new Error(
      `${viewport.name} homepage overflow or missing content: ${JSON.stringify(state)}.`,
    );
  }
  if (
    state.hotspots.some(
      (hotspot) =>
        hotspot.left < 0 ||
        hotspot.right > state.width + 1 ||
        hotspot.top < 0 ||
        hotspot.bottom > state.height + 1,
    )
  ) {
    throw new Error(
      `${viewport.name} Diorama scene hotspot is outside the viewport: ${JSON.stringify(state.hotspots)}.`,
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
    await focusDioramaTarget(session, 'overview');
    const before = await session.evaluate('window.__goal06Perf.drawCalls');
    const hotspotPositionsBefore = await readHotspotPositions(session);
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
    const hotspotPositionsAfter = await readHotspotPositions(session);
    const projectedHotspotMovementPx = hotspotPositionsBefore.reduce((total, point, index) => {
      const next = hotspotPositionsAfter[index];
      return total + Math.hypot(next.x - point.x, next.y - point.y);
    }, 0);
    if (!Number.isFinite(projectedHotspotMovementPx) || projectedHotspotMovementPx < 0.5) {
      throw new Error(
        `The Diorama ${action} gesture did not update scene hotspot positions: ${JSON.stringify({ hotspotPositionsBefore, hotspotPositionsAfter })}.`,
      );
    }
    results[action] = { drawCalls: after - before, observationMs: 650, projectedHotspotMovementPx };
  }
  return results;
}

async function readHotspotPositions(session) {
  return session.evaluate(`Array.from(
    document.querySelectorAll('.diorama-scene__hotspot'),
    button => ({ x: Number.parseFloat(button.style.left), y: Number.parseFloat(button.style.top) }),
  )`);
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
    await waitFor(
      session,
      "document.querySelector('.diorama')?.dataset.timeTransition",
      'idle',
      browserAnimationTimeoutMs,
    );
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
  await waitFor(
    session,
    "document.querySelector('.diorama')?.dataset.timeTransition",
    'idle',
    browserAnimationTimeoutMs,
  );
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
  await waitFor(
    session,
    "document.querySelector('.diorama')?.dataset.timeTransition",
    'idle',
    browserAnimationTimeoutMs,
  );
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
  const query = name === 'homepage' ? '?dioramaPerf=1' : '';
  const session = await startHeadlessBrowser(browser, `${origin}/${query}`, profile, options);
  await session.bringToFront();
  return session;
}

async function waitFor(session, expression, expected, timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs;
  let value;
  while (Date.now() < deadline) {
    value = await session.evaluate(expression);
    if (value === expected) return value;
    if (value === 'fallback') {
      const details = await session.evaluate(`(() => ({
        fallbackMessage: document.querySelector('.diorama-scene__fallback')?.innerText,
        loadedAssets: performance.getEntriesByType('resource')
          .filter(entry => /Octagonal-Laundromat\\.glb|washer-alternate\\/Washer\\.glb|forest-floor\\.png/.test(entry.name))
          .map(entry => ({ name: entry.name, duration: Math.round(entry.duration), transferSize: entry.transferSize })),
      }))()`);
      throw new Error(
        `Browser reached scene fallback while waiting for ${JSON.stringify(expected)}: ${JSON.stringify(details)}; console: ${JSON.stringify(session.getConsoleMessages())}.`,
      );
    }
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
