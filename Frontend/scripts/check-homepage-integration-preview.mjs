import { createReadStream, existsSync, statSync } from 'node:fs';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findBrowser, startHeadlessBrowser } from './headless-browser-session.mjs';

const frontend = resolve(fileURLToPath(new URL('..', import.meta.url)));
const webRoot = resolve(frontend, 'dist/TheBlockLaundromat/browser');
const artifacts = resolve(frontend, '.artifacts/homepage-integration-preview');
const screenshots = join(artifacts, 'screenshots');
const browser = findBrowser();
const previewPath = '/homepage-integration-preview';
let editorLeaveGuardCancelVerified = false;

if (!existsSync(join(webRoot, 'index.html'))) {
  throw new Error('Production build is missing. Run npm run build before browser verification.');
}

await mkdir(screenshots, { recursive: true });
const profiles = [];
const server = createStaticServer(webRoot);
let workspaceSession;
let fallbackSession;

try {
  const address = await listen(server);
  const origin = `http://127.0.0.1:${address.port}`;
  workspaceSession = await openSession(origin, 'workspace', { webglEnabled: true });
  await waitFor(
    workspaceSession,
    "document.querySelector('.mini-diorama__scene')?.dataset.previewState",
    'ready',
  );

  const screenshotsTaken = [];
  await verifyResponsiveLayout(workspaceSession, screenshots, screenshotsTaken);
  console.log('Integrated responsive layouts passed.');
  await verifyThemesAndLocales(workspaceSession, screenshots, screenshotsTaken);
  console.log('Integrated themes and locales passed.');
  await verifySceneIntents(workspaceSession);
  await verifyProjectWorkflows(workspaceSession);
  console.log('Integrated project workflows passed.');
  await verifyReducedMotion(workspaceSession);
  console.log('Reduced-motion lifecycle passed.');
  await verifyProductionRouteBoundary(workspaceSession);
  console.log('Production root route boundary passed.');

  fallbackSession = await openSession(origin, 'workspace-fallback');
  await waitFor(
    fallbackSession,
    "document.querySelector('.mini-diorama__scene')?.dataset.previewState",
    'fallback',
  );
  const fallbackState = await fallbackSession.evaluate(`(() => ({
    fallback: Boolean(document.querySelector('.mini-diorama__fallback')),
    canvasCount: document.querySelectorAll('.mini-diorama__scene canvas').length,
    createAction: Boolean(document.querySelector('.project-form .create-action')),
    importActions: document.querySelectorAll('.project-form .structure-json-create-action').length,
    recentProjects: Boolean(document.querySelector('.project-page--integration-preview .recent-projects')),
  }))()`);
  if (
    !fallbackState.fallback ||
    fallbackState.canvasCount !== 0 ||
    !fallbackState.createAction ||
    fallbackState.importActions !== 2 ||
    !fallbackState.recentProjects
  ) {
    throw new Error(
      `Integrated WebGL fallback removed project controls: ${JSON.stringify(fallbackState)}.`,
    );
  }
  await createProject(fallbackSession, 'Fallback workspace project');
  await waitFor(fallbackSession, "location.pathname === '/editor'", true);

  console.log(
    'Homepage integration browser verification passed: four responsive viewports, four theme variants, EN/VI, semantic scene focus, create/open/delete, Structure JSON validation/import, package cancellation/restore, backup export, search/sort, reduced motion, root route boundary, and WebGL fallback workflow.',
  );
  console.log(`Screenshots: ${screenshotsTaken.join(', ')}`);
} finally {
  await fallbackSession?.close();
  await workspaceSession?.close();
  await new Promise((resolveClose) => server.close(resolveClose));
  await Promise.all(profiles.map((profile) => rm(profile, { recursive: true, force: true })));
}

async function openSession(origin, route, options) {
  const profile = await mkdtemp(join(artifacts, `${route}-profile-`));
  if (!resolve(profile).startsWith(artifacts + sep)) {
    throw new Error('Browser profile escaped the ignored artifacts directory.');
  }
  profiles.push(profile);
  return startHeadlessBrowser(browser, `${origin}${previewPath}`, profile, options);
}

async function verifyResponsiveLayout(session, directory, captured) {
  for (const [width, height, mobile] of [
    [1440, 900, false],
    [1024, 768, false],
    [390, 844, true],
    [320, 568, true],
  ]) {
    await session.setViewport(width, height, 1, mobile);
    await settleLayout(session);
    const layout = await session.evaluate(`(() => {
      const bounds = selector => {
        const rect = document.querySelector(selector)?.getBoundingClientRect();
        return rect ? { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height } : null;
      };
      return {
        viewport: [innerWidth, innerHeight],
        document: [document.documentElement.scrollWidth, document.documentElement.scrollHeight],
        form: bounds('.project-form'),
        scene: bounds('.workspace-scene'),
        recent: bounds('.recent-projects'),
        canvas: bounds('.mini-diorama__scene canvas'),
      };
    })()`);
    const isMobile = width <= 860;
    const positionsValid = isMobile
      ? layout.scene?.top < layout.form?.top && layout.form?.top < layout.recent?.top
      : layout.form?.left < layout.scene?.left && layout.scene?.left < layout.recent?.left;
    if (
      layout.viewport[0] !== width ||
      layout.viewport[1] !== height ||
      layout.document[0] > width ||
      !layout.form ||
      !layout.scene ||
      !layout.recent ||
      !layout.canvas ||
      !positionsValid ||
      layout.canvas.width <= 0 ||
      layout.canvas.height <= 0
    ) {
      throw new Error(`Integrated layout failed at ${width}x${height}: ${JSON.stringify(layout)}.`);
    }
    const name = `workspace-${width}x${height}.png`;
    await session.captureScreenshot(join(directory, name));
    captured.push(name);
  }
}

async function verifyThemesAndLocales(session, directory, captured) {
  const expectedVariants = { craft: 'Minecraft', light: 'Light', raccoon: 'Raccoon', dark: 'Dark' };
  await session.setViewport(1440, 900);
  for (const theme of ['craft', 'light', 'raccoon', 'dark']) {
    await session.evaluate(`document.querySelector('[data-theme-option="${theme}"]').click()`);
    await waitFor(session, 'document.documentElement.dataset.theme', theme);
    const variant = await waitFor(
      session,
      "document.querySelector('.mini-diorama__scene canvas')?.dataset.materialVariant",
      expectedVariants[theme],
    );
    if (variant !== expectedVariants[theme]) {
      throw new Error(`${theme} theme selected ${variant} instead of ${expectedVariants[theme]}.`);
    }
    for (const locale of ['en', 'vi']) {
      await session.evaluate(`document.querySelector('[data-locale="${locale}"]').click()`);
      await waitFor(session, 'document.documentElement.lang', locale);
      const copy = await session.evaluate(`({
        pageTitle: document.querySelector('.project-page h1')?.textContent?.trim(),
        sceneActions: [...document.querySelectorAll('.mini-diorama__actions button')].map(button => button.textContent.trim()),
      })`);
      if (
        !copy.pageTitle ||
        (locale === 'en' &&
          !copy.sceneActions.some((label) => label.toLowerCase().includes('washer'))) ||
        (locale === 'vi' &&
          !copy.sceneActions.some((label) =>
            label
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .toLowerCase()
              .includes('may'),
          ))
      ) {
        throw new Error(`${locale} copy was incomplete for ${theme}: ${JSON.stringify(copy)}.`);
      }
    }
    await session.evaluate('document.querySelector(\'[data-locale="en"]\').click()');
    await settleLayout(session);
    const name = `workspace-theme-${theme}.png`;
    await session.captureScreenshot(join(directory, name));
    captured.push(name);
  }
}

async function verifySceneIntents(session) {
  const washer = await session.evaluate(`(() => {
    const button = document.querySelector('.mini-diorama__actions button:first-child');
    button.focus();
    return document.activeElement === button;
  })()`);
  if (!washer) throw new Error('The overview scene action did not accept keyboard focus.');
  await session.pressKey('Tab', 'Tab', 9);
  const washerFocused = await session.evaluate(
    "document.activeElement === document.querySelector('.mini-diorama__actions button:nth-child(2)')",
  );
  if (!washerFocused) {
    throw new Error('Tab did not move focus to the next scene action.');
  }
  await session.evaluate(
    "document.querySelector('.mini-diorama__actions button:nth-child(2)').click()",
  );
  await waitFor(
    session,
    "document.activeElement === document.querySelector('.project-form input.project-text-input')",
    true,
  );
  await session.evaluate(
    "document.querySelector('.mini-diorama__actions button:nth-child(4)').click()",
  );
  await waitFor(
    session,
    "document.querySelector('.mini-diorama__actions button:nth-child(4)')?.getAttribute('aria-pressed')",
    'true',
  );
  const greeting = await session.evaluate(`({
    selected: document.querySelector('.mini-diorama__actions button:nth-child(4)')?.getAttribute('aria-pressed'),
    message: document.querySelector('.mini-diorama__live-message')?.textContent?.trim(),
  })`);
  if (greeting.selected !== 'true' || !greeting.message) {
    throw new Error(
      `Raccoon greeting did not update its semantic status: ${JSON.stringify(greeting)}.`,
    );
  }
}

async function verifyProjectWorkflows(session) {
  const empty = await session.evaluate(`({
    rows: document.querySelectorAll('.project-row').length,
    empty: Boolean(document.querySelector('.project-list-empty')),
  })`);
  if (empty.rows !== 0 || !empty.empty) {
    throw new Error(
      `The fresh workspace unexpectedly contains project data: ${JSON.stringify(empty)}.`,
    );
  }

  await createProject(session, 'Goal 03 Created Project');
  await waitFor(session, "location.pathname === '/editor'", true);
  await returnToWorkspace(session);
  await waitFor(
    session,
    "[...document.querySelectorAll('.project-open-action strong')].some(node => node.textContent.includes('Goal 03 Created Project'))",
    true,
  );

  await importStructureJson(session, '{');
  await waitFor(
    session,
    "Boolean(document.querySelector('.project-import-dialog .project-import-error'))",
    true,
  );
  await session.evaluate(
    "document.querySelector('.project-import-dialog .project-import-footer button:first-child').click()",
  );
  await waitFor(session, "!document.querySelector('.project-import-dialog')", true);

  const structureJson = JSON.stringify({
    format: 'the-block-laundromat-structure',
    minecraftVersion: '1.21.1',
    name: 'Goal 03 Structure Import',
    blocks: [{ id: 'minecraft:stone', x: 0, y: 0, z: 0 }],
    decorations: [],
  });
  await importStructureJson(session, structureJson);
  await waitFor(
    session,
    "Boolean(document.querySelector('.project-import-dialog .project-import-summary'))",
    true,
  );
  await session.evaluate(
    "document.querySelector('.project-import-dialog .project-import-footer .ui-button--primary').click()",
  );
  await waitFor(session, "location.pathname === '/editor'", true);
  await returnToWorkspace(session);
  await waitFor(
    session,
    "[...document.querySelectorAll('.project-open-action strong')].some(node => node.textContent.includes('Goal 03 Structure Import'))",
    true,
  );

  const packageProject = {
    schemaVersion: 3,
    id: 'goal03-backup-fixture',
    metadata: {
      name: 'Goal 03 Restored Package',
      minecraftVersion: '1.21.1',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    size: { x: 4, y: 4, z: 4 },
    structureMode: 'vanilla-structure-block',
    blocks: [],
    groups: [],
    decorations: [],
    editorSettings: { currentY: 0, layerVisibility: 'current-only', referenceLayerOpacity: 0.15 },
  };
  const packageText = JSON.stringify({
    format: 'the-block-laundromat-project',
    formatVersion: 1,
    project: packageProject,
  });
  await openPackageDialog(session);
  await setFile(
    session,
    '.backup-import-dialog input[type="file"]',
    'goal03-backup.json',
    packageText,
  );
  await waitFor(
    session,
    "Boolean(document.querySelector('.backup-import-dialog .project-import-summary'))",
    true,
  );
  await session.evaluate(
    "document.querySelector('.backup-import-dialog .project-import-footer .ui-button--ghost').click()",
  );
  await waitFor(session, "!document.querySelector('.backup-import-dialog')", true);
  if (
    await session.evaluate(
      "[...document.querySelectorAll('.project-open-action strong')].some(node => node.textContent.includes('Goal 03 Restored Package'))",
    )
  ) {
    throw new Error('Cancelling package restore created a project.');
  }

  await openPackageDialog(session);
  await setFile(
    session,
    '.backup-import-dialog input[type="file"]',
    'goal03-backup.json',
    packageText,
  );
  await waitFor(
    session,
    "Boolean(document.querySelector('.backup-import-dialog .project-import-summary'))",
    true,
  );
  await session.evaluate(
    "document.querySelector('.backup-import-dialog .project-import-footer .ui-button--primary').click()",
  );
  await waitFor(session, "!document.querySelector('.backup-import-dialog')", true);
  await waitFor(
    session,
    "[...document.querySelectorAll('.project-open-action strong')].some(node => node.textContent.includes('Goal 03 Restored Package'))",
    true,
  );

  await session.evaluate(`(() => {
    window.__downloadRecord = undefined;
    window.__downloadBlob = undefined;
    URL.createObjectURL = blob => { window.__downloadBlob = blob; return 'blob:homepage-preview-test'; };
    window.__nativeAnchorClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function() {
      if (this.download) window.__downloadRecord = { href: this.href, filename: this.download };
      else window.__nativeAnchorClick.call(this);
    };
  })()`);
  await session.evaluate(`(() => {
    const project = [...document.querySelectorAll('.project-row')].find(row => row.querySelector('.project-open-action strong')?.textContent.includes('Goal 03 Created Project'));
    project?.querySelector('.project-backup-action')?.click();
  })()`);
  await waitFor(session, 'Boolean(window.__downloadRecord)', true);
  const download = await session.evaluate(`(async () => ({
    ...window.__downloadRecord,
    content: await window.__downloadBlob.text(),
  }))()`);
  const downloadedPackage = JSON.parse(download.content);
  if (
    !download.filename.endsWith('.tbl-project.json') ||
    downloadedPackage.format !== 'the-block-laundromat-project' ||
    downloadedPackage.project.metadata.name !== 'Goal 03 Created Project'
  ) {
    throw new Error(
      `Backup export did not contain the selected project: ${JSON.stringify(download)}.`,
    );
  }

  await session.evaluate(`(() => {
    const select = document.querySelector('.project-sort');
    select.value = 'name';
    select.dispatchEvent(new Event('change', { bubbles: true }));
  })()`);
  await waitFor(session, "document.querySelector('.project-sort')?.value", 'name');
  await settleLayout(session);
  const sortedNames = await session.evaluate(
    "[...document.querySelectorAll('.project-open-action strong')].map(node => node.textContent.trim())",
  );
  if (
    sortedNames.join('\u0000') !==
    [...sortedNames].sort((a, b) => a.localeCompare(b)).join('\u0000')
  ) {
    throw new Error(`Project name sorting was not alphabetical: ${JSON.stringify(sortedNames)}.`);
  }
  const search = 'Goal 03 Structure Import';
  await session.evaluate(`(() => {
    const input = document.querySelector('.project-search-field input');
    input.value = ${JSON.stringify(search)};
    input.dispatchEvent(new Event('input', { bubbles: true }));
  })()`);
  await waitFor(session, "document.querySelectorAll('.project-row').length", 1);
  const searchResult = await session.evaluate(
    "document.querySelector('.project-open-action strong')?.textContent?.trim()",
  );
  if (searchResult !== search)
    throw new Error(`Project search returned ${JSON.stringify(searchResult)}.`);
  await session.evaluate(`(() => {
    const input = document.querySelector('.project-search-field input');
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  })()`);
  await waitFor(session, "document.querySelectorAll('.project-row').length", 3);

  await session.evaluate(`(() => {
    const project = [...document.querySelectorAll('.project-row')].find(row => row.querySelector('.project-open-action strong')?.textContent.includes('Goal 03 Created Project'));
    project?.querySelector('.project-delete-action')?.click();
  })()`);
  await waitFor(session, "Boolean(document.querySelector('.ui-alert-dialog'))", true);
  await session.evaluate(
    "document.querySelector('.ui-alert-dialog__actions button:first-child').click()",
  );
  await waitFor(session, "!document.querySelector('.ui-alert-dialog')", true);
  if (
    !(await session.evaluate(
      "[...document.querySelectorAll('.project-open-action strong')].some(node => node.textContent.includes('Goal 03 Created Project'))",
    ))
  ) {
    throw new Error('Cancelling project deletion removed the project.');
  }
  await session.evaluate(`(() => {
    const project = [...document.querySelectorAll('.project-row')].find(row => row.querySelector('.project-open-action strong')?.textContent.includes('Goal 03 Created Project'));
    project?.querySelector('.project-delete-action')?.click();
  })()`);
  await waitFor(session, "Boolean(document.querySelector('.ui-alert-dialog'))", true);
  await session.evaluate(
    "document.querySelector('.ui-alert-dialog__actions button:last-child').click()",
  );
  await waitFor(
    session,
    "![...document.querySelectorAll('.project-open-action strong')].some(node => node.textContent.includes('Goal 03 Created Project'))",
    true,
  );

  await session.evaluate(`(() => {
    const project = [...document.querySelectorAll('.project-row')].find(row => row.querySelector('.project-open-action strong')?.textContent.includes('Goal 03 Restored Package'));
    project?.querySelector('.project-open-action')?.click();
  })()`);
  await waitFor(session, "location.pathname === '/editor'", true);
  await returnToWorkspace(session);
  await waitFor(session, "document.querySelectorAll('.project-row').length", 2);

  await session.evaluate(
    "document.querySelector('.mini-diorama__actions button:nth-child(3)').click()",
  );
  await waitFor(
    session,
    "document.activeElement === document.querySelector('.project-search-field input')",
    true,
  );
}

async function importStructureJson(session, content) {
  await setFile(session, '.project-form input[type="file"]', 'structure.json', content);
}

async function openPackageDialog(session) {
  await session.evaluate(
    "document.querySelector('.project-form .project-actions button:last-of-type').click()",
  );
  await waitFor(session, "Boolean(document.querySelector('.backup-import-dialog'))", true);
}

async function createProject(session, name) {
  await session.evaluate(`(() => {
    const input = document.querySelector('.project-form input.project-text-input');
    input.value = ${JSON.stringify(name)};
    input.dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelector('.project-form .create-action').click();
  })()`);
}

async function setFile(session, selector, filename, content) {
  await session.evaluate(`(() => {
    const input = document.querySelector(${JSON.stringify(selector)});
    if (!input) throw new Error('Missing file input: ' + ${JSON.stringify(selector)});
    const transfer = new DataTransfer();
    transfer.items.add(new File([${JSON.stringify(content)}], ${JSON.stringify(filename)}, { type: 'application/json' }));
    input.files = transfer.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  })()`);
}

async function returnToWorkspace(session) {
  await chooseEditorProjects(session);
  await waitFor(
    session,
    "Boolean(document.querySelector('.ui-alert-dialog')) || (location.pathname === '/' && Boolean(document.querySelector('.project-page'))) ",
    true,
  );
  let hasLeavePrompt = await session.evaluate(
    "Boolean(document.querySelector('.ui-alert-dialog'))",
  );
  if (hasLeavePrompt && !editorLeaveGuardCancelVerified) {
    editorLeaveGuardCancelVerified = true;
    await session.evaluate(
      "document.querySelector('.ui-alert-dialog__actions button:first-child')?.click()",
    );
    await waitFor(session, "!document.querySelector('.ui-alert-dialog')", true);
    const stayedInEditor = await session.evaluate(
      "location.pathname === '/editor' && Boolean(document.querySelector('.editor-shell'))",
    );
    if (!stayedInEditor) {
      throw new Error('Cancelling the Editor leave confirmation did not keep the Editor open.');
    }
    await chooseEditorProjects(session);
    await waitFor(
      session,
      "Boolean(document.querySelector('.ui-alert-dialog')) || (location.pathname === '/' && Boolean(document.querySelector('.project-page'))) ",
      true,
    );
    hasLeavePrompt = await session.evaluate("Boolean(document.querySelector('.ui-alert-dialog'))");
  }
  if (hasLeavePrompt) {
    await session.evaluate(
      "document.querySelector('.ui-alert-dialog__actions button:last-child')?.click()",
    );
  }
  try {
    await waitFor(
      session,
      "location.pathname === '/' && Boolean(document.querySelector('.project-page'))",
      true,
    );
  } catch (error) {
    const state = await session.evaluate(`({
      path: location.pathname,
      editor: Boolean(document.querySelector('.editor-shell')),
      projectPage: Boolean(document.querySelector('.project-page')),
      dialog: document.querySelector('.ui-alert-dialog')?.textContent?.trim(),
    })`);
    throw new Error(`${error.message} Editor exit state: ${JSON.stringify(state)}.`);
  }
  await navigateAngularRoute(session, previewPath);
}

async function chooseEditorProjects(session) {
  await session.evaluate("document.querySelector('app-editor-chrome .menu-trigger')?.click()");
  await waitFor(
    session,
    'Boolean(document.querySelector(\'.menu-popover [role="menuitem"]\'))',
    true,
  );
  await session.evaluate('document.querySelector(\'.menu-popover [role="menuitem"]\')?.click()');
}

async function verifyReducedMotion(session) {
  await session.evaluate(`(() => {
    const requestFrame = window.requestAnimationFrame.bind(window);
    const cancelFrame = window.cancelAnimationFrame.bind(window);
    window.__reducedMotionPendingFrames = new Set();
    window.requestAnimationFrame = callback => {
      let frameId;
      frameId = requestFrame(timestamp => {
        window.__reducedMotionPendingFrames.delete(frameId);
        callback(timestamp);
      });
      window.__reducedMotionPendingFrames.add(frameId);
      return frameId;
    };
    window.cancelAnimationFrame = frameId => {
      window.__reducedMotionPendingFrames.delete(frameId);
      cancelFrame(frameId);
    };
  })()`);
  await session.setReducedMotion(true);
  await session.evaluate('new Promise(resolve => setTimeout(resolve, 80))');
  const reducedMotion = await session.evaluate(`({
    preference: matchMedia('(prefers-reduced-motion: reduce)').matches,
    frames: window.__reducedMotionPendingFrames.size,
  })`);
  if (!reducedMotion.preference || reducedMotion.frames !== 0) {
    throw new Error(
      `Reduced motion kept animation frames active: ${JSON.stringify(reducedMotion)}.`,
    );
  }
  await session.evaluate(
    "document.querySelector('.mini-diorama__actions button:last-child').click()",
  );
  await waitFor(
    session,
    "document.querySelector('.mini-diorama__actions button:last-child')?.getAttribute('aria-pressed')",
    'true',
  );
}

async function verifyProductionRouteBoundary(session) {
  await session.evaluate("document.querySelector('.integration-preview-back').click()");
  await waitFor(session, "location.pathname === '/'", true);
  const root = await session.evaluate(`(() => ({
    route: location.pathname,
    integrationClass: Boolean(document.querySelector('.project-page--integration-preview')),
    scene: Boolean(document.querySelector('.mini-diorama__scene')),
    create: Boolean(document.querySelector('.project-form .create-action')),
    imports: document.querySelectorAll('.project-form .structure-json-create-action').length,
  }))()`);
  if (
    root.route !== '/' ||
    root.integrationClass ||
    root.scene ||
    !root.create ||
    root.imports !== 2
  ) {
    throw new Error(`Production root route changed: ${JSON.stringify(root)}.`);
  }
  await navigateAngularRoute(session, previewPath);
}

async function navigateAngularRoute(session, route) {
  await session.evaluate(`(() => {
    history.pushState(history.state, '', ${JSON.stringify(route)});
    window.dispatchEvent(new PopStateEvent('popstate', { state: history.state }));
  })()`);
  await waitFor(session, `location.pathname === '${route}'`, true);
  await waitFor(
    session,
    "document.querySelector('.mini-diorama__scene')?.dataset.previewState",
    'ready',
  );
}

async function settleLayout(session) {
  await session.evaluate(
    'new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))',
  );
}

async function waitFor(session, expression, expected, timeoutMs = 12_000) {
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
