import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findBrowser, startHeadlessBrowser } from './headless-browser-session.mjs';

const frontend = resolve(fileURLToPath(new URL('..', import.meta.url)));
const webRoot = resolve(frontend, 'dist/TheBlockLaundromat/browser');
const artifacts = resolve(frontend, '.artifacts/homepage-preview');
const screenshots = join(artifacts, 'screenshots');
const browser = findBrowser();
if (!existsSync(join(webRoot, 'index.html'))) {
  throw new Error('Production build is missing. Run npm run build before the browser check.');
}

await mkdir(screenshots, { recursive: true });
const profile = await mkdtemp(join(artifacts, 'preview-profile-'));
const artifactPrefix = artifacts + sep;
if (!resolve(profile).startsWith(artifactPrefix))
  throw new Error('Browser profile escaped artifacts.');

const server = createServer((request, response) => {
  const url = new URL(request.url ?? '/', 'http://127.0.0.1');
  const requestPath = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html';
  const requestedFile = resolve(webRoot, requestPath);
  if (!requestedFile.startsWith(webRoot + sep) && requestedFile !== webRoot) {
    response.writeHead(400);
    response.end();
    return;
  }
  const file =
    existsSync(requestedFile) && statSync(requestedFile).isFile()
      ? requestedFile
      : join(webRoot, 'index.html');
  response.writeHead(200, {
    'content-type': contentType(file),
    'cache-control': 'no-store',
  });
  if (request.method === 'HEAD') {
    response.end();
    return;
  }
  createReadStream(file).pipe(response);
});

let session;
try {
  const address = await listen(server);
  const appUrl = `http://127.0.0.1:${address.port}/homepage-2d-preview`;
  session = await startHeadlessBrowser(browser, appUrl, profile);
  await session.setViewport(1672, 941);
  await waitForPreview(session, 60_000);

  const themes = ['craft', 'raccoon', 'light', 'dark'];
  const screenshotsTaken = [];
  for (const [index, theme] of themes.entries()) {
    if (index > 0) {
      await session.evaluate('performance.clearResourceTimings()');
      await session.evaluate(`document.querySelector('[data-theme-option="${theme}"]').click()`);
      await waitForPreview(session, 60_000, theme);
    }

    await verifyThemeRequests(session, theme);
    await verifyLayout(session, 1672, 941, 'desktop');
    await capture(session, screenshots, `${theme}-1672x941.png`, screenshotsTaken);

    await session.setViewport(1440, 900);
    await settleViewport(session);
    await verifyLayout(session, 1440, 900, 'desktop');
    await capture(session, screenshots, `${theme}-1440x900.png`, screenshotsTaken);

    await session.setViewport(1366, 768);
    await settleViewport(session);
    await verifyLayout(session, 1366, 768, 'desktop');

    await session.setViewport(1280, 720);
    await settleViewport(session);
    await verifyLayout(session, 1280, 720, 'desktop');

    await session.setViewport(1672, 941);
    await settleViewport(session);
  }

  await session.evaluate('document.querySelector(\'[data-locale="vi"]\').click()');
  const localeState = await waitForLocale(session, 'vi');
  if (!localeState.localizedDescription || localeState.theme !== 'dark') {
    throw new Error(
      `Vietnamese locale changed unexpected Homepage state: ${JSON.stringify(localeState)}.`,
    );
  }
  await session.evaluate('document.querySelector(\'[data-locale="en"]\').click()');
  await waitForLocale(session, 'en');

  await session.evaluate("document.querySelector('.settings-button').click()");
  const settingsOpened = await session.evaluate(
    "Boolean(document.querySelector('.settings-dialog[role=dialog]'))",
  );
  if (!settingsOpened) throw new Error('Settings did not open from the Homepage controls.');
  await session.evaluate("document.querySelector('.settings-close').click()");
  await waitForCondition(
    session,
    "!document.querySelector('.settings-dialog')",
    'Settings did not close.',
  );

  await session.evaluate("document.querySelector('.account-card').click()");
  const accountOpened = await session.evaluate(
    "document.querySelector('.account-card')?.getAttribute('aria-expanded') === 'true'",
  );
  if (!accountOpened) throw new Error('The account menu did not open.');
  await session.evaluate(
    "document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))",
  );
  await waitForCondition(
    session,
    "document.querySelector('.account-card')?.getAttribute('aria-expanded') === 'false'",
    'The account menu did not close on Escape.',
  );
  await session.evaluate(
    'document.activeElement instanceof HTMLElement && document.activeElement.blur()',
  );

  await session.evaluate('performance.clearResourceTimings()');
  await session.evaluate('document.querySelector(\'[data-theme-option="craft"]\').click()');
  await waitForPreview(session, 60_000, 'craft');
  await verifyThemeRequests(session, 'craft');
  await session.setViewport(390, 844, 1, true);
  await settleViewport(session);
  await verifyLayout(session, 390, 844, 'mobile');
  await capture(session, screenshots, 'craft-mobile-390x844.png', screenshotsTaken);

  await session.setViewport(320, 700, 1, true);
  await settleViewport(session);
  await verifyLayout(session, 320, 700, 'mobile');
  await capture(session, screenshots, 'craft-mobile-320x700.png', screenshotsTaken);

  await session.setViewport(1440, 900);
  await session.evaluate("location.assign('/')");
  await waitForCondition(
    session,
    "location.pathname === '/' && Boolean(document.querySelector('.project-page'))",
    'The traditional Project Screen did not load at /.',
    30_000,
  );
  const projectScreen = await session.evaluate(`(() => ({
    hasProjectCreation: Boolean(document.querySelector('.project-form .create-action')),
    hasStructureAndBackupImports:
      document.querySelectorAll('.project-form .structure-json-create-action').length === 2,
    hasRecentProjects: Boolean(document.querySelector('.project-page .recent-projects')),
    hasPreview: Boolean(document.querySelector('.homepage-preview')),
  }))()`);
  if (
    !projectScreen.hasProjectCreation ||
    !projectScreen.hasStructureAndBackupImports ||
    !projectScreen.hasRecentProjects ||
    projectScreen.hasPreview
  ) {
    throw new Error(
      `The default Project Screen did not retain its existing structure: ${JSON.stringify(projectScreen)}.`,
    );
  }
  await capture(session, screenshots, 'project-screen-root.png', screenshotsTaken);

  console.log(
    'Browser verification passed: 2D preview, four themes, selected-theme-only image requests, EN/VI, Settings, account keyboard close, all required viewport sizes, and the traditional Project Screen at /.',
  );
  console.log(`Screenshots: ${screenshotsTaken.join(', ')}`);
} finally {
  await session?.close();
  await new Promise((resolveClose) => server.close(resolveClose));
  await rm(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 250 });
}

async function waitForPreview(session, timeoutMs, theme) {
  await waitForCondition(
    session,
    `(() => {
      const window = document.querySelector('.homepage-preview__scene-window');
      const canvas = document.querySelector('.homepage-preview__scene');
      const selected = document.querySelector('[data-theme-option][aria-pressed="true"]');
      return Boolean(window && canvas && window.getAttribute('aria-busy') === 'false' &&
        Number(window.dataset.loadMs) >= 0 && (!${JSON.stringify(theme)} || selected?.dataset.themeOption === ${JSON.stringify(theme)}));
    })()`,
    'Homepage illustration did not finish loading.',
    timeoutMs,
  );
}

async function waitForLocale(session, locale) {
  await waitForCondition(
    session,
    `document.querySelector('[data-locale="${locale}"]')?.getAttribute('aria-pressed') === 'true'`,
    `Locale did not switch to ${locale}.`,
  );
  return session.evaluate(`({
    theme: document.documentElement.dataset.theme,
    localizedDescription: document.querySelector('.homepage-preview__scene')?.getAttribute('aria-label')?.${locale === 'vi' ? 'startsWith("Bản minh họa")' : 'startsWith("Static illustrated")'},
  })`);
}

async function verifyThemeRequests(session, theme) {
  const artworkTheme = theme === 'craft' ? 'minecraft' : theme;
  const result = await session.evaluate(`(() => {
    const requests = performance.getEntriesByType('resource')
      .map(entry => new URL(entry.name).pathname)
      .filter(path => path.includes('/assets/homepage/runtime/assets/'));
    return {
      count: requests.length,
      onlySelectedTheme: requests.every(path => path.includes('/assets/homepage/runtime/assets/${artworkTheme}/')),
    };
  })()`);
  if (result.count === 0 || !result.onlySelectedTheme) {
    throw new Error(
      `The ${theme} selection fetched unexpected theme layers: ${JSON.stringify(result)}.`,
    );
  }
}

async function verifyLayout(session, width, height, formFactor) {
  const layout = await session.evaluate(`(() => {
    const sceneWindow = document.querySelector('.homepage-preview__scene-window').getBoundingClientRect();
    const canvas = document.querySelector('.homepage-preview__scene').getBoundingClientRect();
    const controls = document.querySelector('.homepage-preview__controls').getBoundingClientRect();
    const account = document.querySelector('.homepage-preview__account').getBoundingClientRect();
    return {
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      scrollWidth: document.documentElement.scrollWidth,
      aspectRatio: canvas.width / canvas.height,
      sceneTop: sceneWindow.top,
      sceneBottom: sceneWindow.bottom,
      controlsBottom: controls.bottom,
      accountTop: account.top,
    };
  })()`);
  if (
    layout.viewportWidth !== width ||
    layout.viewportHeight !== height ||
    layout.scrollWidth > width ||
    Math.abs(layout.aspectRatio - 1672 / 941) > 0.002 ||
    layout.controlsBottom > layout.sceneTop ||
    layout.accountTop < layout.sceneBottom
  ) {
    throw new Error(`${formFactor} ${width}x${height} layout failed: ${JSON.stringify(layout)}.`);
  }
}

async function capture(session, directory, name, captured) {
  await session.captureScreenshot(join(directory, name));
  captured.push(name);
}

async function settleViewport(session) {
  await session.evaluate(
    'new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))',
  );
  await waitForCondition(
    session,
    "document.querySelector('.homepage-preview__scene-window')?.getAttribute('aria-busy') === 'false'",
    'Homepage scene did not settle after viewport resize.',
  );
}

async function waitForCondition(session, expression, message, timeoutMs = 10_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await session.evaluate(expression)) return;
    const failure = await session.evaluate(
      "document.querySelector('[role=alert]')?.textContent?.trim() ?? null",
    );
    if (failure) throw new Error(`Homepage reported a rendering error: ${failure}`);
    await new Promise((resolveWait) => setTimeout(resolveWait, 100));
  }
  throw new Error(message);
}

function contentType(path) {
  const types = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.ico': 'image/x-icon',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.woff2': 'font/woff2',
  };
  return types[extname(path).toLowerCase()] ?? 'application/octet-stream';
}

function listen(httpServer) {
  return new Promise((resolveAddress, reject) => {
    httpServer.once('error', reject);
    httpServer.listen(0, '127.0.0.1', () => {
      const address = httpServer.address();
      if (!address || typeof address === 'string') {
        reject(new Error('Could not start the local preview server.'));
        return;
      }
      resolveAddress(address);
    });
  });
}
