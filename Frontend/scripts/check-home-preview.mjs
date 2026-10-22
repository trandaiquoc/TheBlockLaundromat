import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { once } from 'node:events';

const baseUrl = process.env.HOME_PREVIEW_URL ?? 'http://127.0.0.1:4200/home-preview';
const artifactDir = join(process.cwd(), '.artifacts', 'home-preview');
const profile = await mkdtemp(join(tmpdir(), 'home-preview-chrome-'));
const chrome = spawn(
  'google-chrome',
  [
    '--headless=new',
    '--no-sandbox',
    '--enable-unsafe-swiftshader',
    '--disable-background-networking',
    '--remote-debugging-port=0',
    `--user-data-dir=${profile}`,
    '--window-size=1366,768',
    'about:blank',
  ],
  { stdio: 'ignore' },
);

try {
  let port;
  for (let attempt = 0; attempt < 50; attempt++) {
    try {
      port = Number((await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]);
      break;
    } catch {
      await delay(100);
    }
  }
  if (!port) throw new Error('Chrome DevTools port did not start');
  const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const page = pages.find((entry) => entry.type === 'page');
  if (!page) throw new Error('Chrome page was not created');
  const socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  let nextId = 0;
  const pending = new Map();
  const requests = [];
  const runtimeErrors = [];
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.method === 'Network.requestWillBeSent') requests.push(message.params.request.url);
    if (message.method === 'Runtime.exceptionThrown')
      runtimeErrors.push(
        message.params.exceptionDetails.exception?.description ??
          message.params.exceptionDetails.text,
      );
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      message.error ? reject(new Error(message.error.message)) : resolve(message.result);
    }
  });
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++nextId;
      pending.set(id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params }));
    });
  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result.value;
  };
  const waitFor = async (expression, label) => {
    for (let attempt = 0; attempt < 40; attempt++) {
      if (await evaluate(expression)) return;
      await delay(200);
    }
    throw new Error(`Timed out waiting for ${label}`);
  };
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');
  await mkdir(artifactDir, { recursive: true });

  const checks = [
    { theme: 'craft', width: 1280, height: 720 },
    { theme: 'light', width: 1280, height: 720 },
    { theme: 'raccoon', width: 1280, height: 720 },
    { theme: 'dark', width: 1280, height: 720 },
    { theme: 'craft', width: 1672, height: 941 },
    { theme: 'craft', width: 1366, height: 768 },
    { theme: 'craft', width: 390, height: 844 },
    { theme: 'craft', width: 320, height: 700 },
  ];
  const results = [];
  for (const check of checks) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: check.width,
      height: check.height,
      deviceScaleFactor: 1,
      mobile: check.width < 700,
    });
    await send('Page.navigate', { url: baseUrl });
    let ready = false;
    for (let attempt = 0; attempt < 30; attempt++) {
      await delay(200);
      ready = await evaluate(`!!document.querySelector('app-home-scene canvas')?.dataset.theme`);
      if (ready) break;
    }
    if (!ready) {
      const pageState = await evaluate(
        `({url: location.href, title: document.title, scene: !!document.querySelector('app-home-scene'), canvas: !!document.querySelector('app-home-scene canvas'), alert: document.querySelector('[role="alert"]')?.textContent?.trim(), text: document.body?.innerText?.slice(0, 250)})`,
      );
      throw new Error(
        `Homepage canvas did not render at ${check.width}x${check.height}: ${JSON.stringify(pageState)} ${runtimeErrors.join(' | ')}`,
      );
    }
    await evaluate(`document.querySelector('[data-theme-option="${check.theme}"]').click()`);
    for (let attempt = 0; attempt < 30; attempt++) {
      await delay(200);
      if (
        await evaluate(
          `document.querySelector('app-home-scene canvas')?.dataset.theme === '${check.theme}'`,
        )
      )
        break;
    }
    await delay(150);
    const state = await evaluate(`(() => {
      const canvas = document.querySelector('app-home-scene canvas');
      const controls = document.querySelector('app-project-screen-controls');
      const account = document.querySelector('app-project-screen-account');
      const board = document.querySelector('.project-grid');
      const boardStyle = getComputedStyle(document.querySelector('.project-page'));
      const buttons = [...document.querySelectorAll('.screen-control-button')];
      const rect = (node) => { const value = node.getBoundingClientRect(); return { left: value.left, top: value.top, right: value.right, bottom: value.bottom }; };
      return { viewport: { width: innerWidth, height: innerHeight }, scrollWidth: document.documentElement.scrollWidth,
        theme: document.documentElement.dataset.theme, canvas: canvas ? { ...canvas.dataset, width: canvas.width, height: canvas.height } : null,
        controls: rect(controls), account: rect(account), board: rect(board), projectedBoard: { left: parseFloat(boardStyle.getPropertyValue('--board-left')), top: parseFloat(boardStyle.getPropertyValue('--board-top')), width: parseFloat(boardStyle.getPropertyValue('--board-width')) }, minControlFont: Math.min(...buttons.map((button) => parseFloat(getComputedStyle(button).fontSize))),
        projectList: document.querySelector('.recent-projects')?.textContent?.trim().slice(0, 100) };
    })()`);
    const screenshot = await send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false,
    });
    const file = `${check.theme}-${check.width}x${check.height}.png`;
    await writeFile(join(artifactDir, file), Buffer.from(screenshot.data, 'base64'));
    const valid =
      state.canvas &&
      Number(state.canvas.drawCalls) > 0 &&
      Number(state.canvas.drawCalls) <= 150 &&
      Number(state.canvas.triangles) <= 200000 &&
      Number(state.canvas.estimatedTextureMiB) > 0 &&
      state.scrollWidth <= check.width &&
      state.controls.left >= 0 &&
      state.controls.right <= check.width &&
      state.account.left >= 0 &&
      state.account.right <= check.width &&
      state.minControlFont >= 14 &&
      (check.width < 700 ||
        (Math.abs(state.board.left - state.projectedBoard.left) < 2 &&
          Math.abs(state.board.top - state.projectedBoard.top) < 2 &&
          Math.abs(state.board.right - state.board.left - state.projectedBoard.width) < 2));
    results.push({ ...check, file, valid, state });
  }
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 720,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await send('Page.navigate', { url: baseUrl });
  await waitFor(
    `!!document.querySelector('app-home-scene canvas')?.dataset.theme`,
    'interactive preview',
  );
  const themeSequence = [];
  for (const theme of ['craft', 'light', 'dark', 'raccoon', 'craft']) {
    const requestStart = requests.length;
    await evaluate(`document.querySelector('[data-theme-option="${theme}"]').click()`);
    await waitFor(
      `document.querySelector('app-home-scene canvas')?.dataset.theme === '${theme}'`,
      `${theme} material switch`,
    );
    await delay(180);
    const metrics = await evaluate(
      `(() => { const { dataset } = document.querySelector('app-home-scene canvas'); return { calls: Number(dataset.drawCalls), triangles: Number(dataset.triangles), textures: Number(dataset.textureCount), geometries: Number(dataset.geometryCount), estimatedTextureMiB: Number(dataset.estimatedTextureMiB), renderMs: Number(dataset.renderMs) }; })()`,
    );
    const newRequests = requests
      .slice(requestStart)
      .filter((url) => url.includes('/assets/homepage/runtime/'));
    const sourceTheme = theme === 'craft' ? 'minecraft' : theme;
    themeSequence.push({
      theme,
      metrics,
      requests: newRequests.length,
      selectedOnly: newRequests.every((url) => url.includes(`/runtime/${sourceTheme}/`)),
    });
  }
  await evaluate(
    `window.__previewCanvas = document.querySelector('app-home-scene canvas'); document.querySelector('.preview-traditional-link').click()`,
  );
  await waitFor(
    `location.pathname === '/' && !document.querySelector('app-home-scene')`,
    'Angular preview teardown',
  );
  const routeDisposed = await evaluate(`window.__previewCanvas.dataset.disposed === 'true'`);
  await send('Page.navigate', { url: baseUrl });
  await waitFor(
    `!!document.querySelector('app-home-scene canvas')?.dataset.theme`,
    'interactive preview',
  );
  await evaluate(`document.querySelector('[data-locale="vi"]').click()`);
  const locale = await evaluate(`document.documentElement.lang`);
  await evaluate(`document.querySelector('app-project-screen-account .account-card').click()`);
  const accountExpanded = await evaluate(
    `document.querySelector('app-project-screen-account .account-card').getAttribute('aria-expanded')`,
  );
  await evaluate(`document.querySelector('app-project-screen-controls .settings-button').click()`);
  await waitFor(`!!document.querySelector('app-settings-dialog')`, 'Settings dialog');
  const settingsOpened = await evaluate(`!!document.querySelector('app-settings-dialog')`);
  await send('Page.navigate', { url: baseUrl });
  await waitFor(`!!document.querySelector('.preview-create-trigger')`, 'create button');
  await evaluate(`document.querySelector('.preview-create-trigger').click()`);
  const formVisible = await evaluate(
    `getComputedStyle(document.querySelector('.project-form')).display !== 'none'`,
  );
  await evaluate(
    `(() => { const input = document.querySelector('.project-text-input'); const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; setter.call(input, 'Căn nhà bên hồ'); input.dispatchEvent(new Event('input', { bubbles: true })); })()`,
  );
  const vietnameseInput = await evaluate(`document.querySelector('.project-text-input').value`);
  await evaluate(`document.querySelector('.create-action').click()`);
  await waitFor(`location.pathname === '/editor'`, 'Create to Editor navigation');
  const created = await evaluate(`location.pathname === '/editor'`);
  await send('Page.navigate', { url: baseUrl });
  await waitFor(`!!document.querySelector('.project-row')`, 'saved project list');
  const projectListed = await evaluate(
    `document.querySelector('.project-row')?.textContent.includes('Căn nhà bên hồ')`,
  );
  const exportAvailable = await evaluate(`!!document.querySelector('.project-backup-action')`);
  await evaluate(
    `document.querySelector('.project-sort').value = 'name'; document.querySelector('.project-sort').dispatchEvent(new Event('change', { bubbles: true }))`,
  );
  const sortSelected = await evaluate(`document.querySelector('.project-sort').value === 'name'`);
  await evaluate(`document.querySelector('.preview-create-trigger').click()`);
  const structureImportAvailable = await evaluate(
    `!!document.querySelector('input[type="file"][accept="application/json,.json"]')`,
  );
  await evaluate(`document.querySelectorAll('.structure-json-create-action')[1].click()`);
  await waitFor(`!!document.querySelector('.backup-import-dialog')`, 'backup import dialog');
  const backupImportOpened = await evaluate(`!!document.querySelector('.backup-import-dialog')`);
  await send('Page.navigate', { url: baseUrl });
  await waitFor(
    `!!document.querySelector('.project-row')`,
    'saved project list after import dialog',
  );
  await evaluate(
    `document.querySelector('.project-search-field input').value = 'không khớp'; document.querySelector('.project-search-field input').dispatchEvent(new Event('input', { bubbles: true }))`,
  );
  const searchFiltered = await evaluate(`!!document.querySelector('.project-list-empty')`);
  await evaluate(
    `document.querySelector('.project-search-field input').value = ''; document.querySelector('.project-search-field input').dispatchEvent(new Event('input', { bubbles: true }))`,
  );
  await evaluate(`document.querySelector('.project-open-action').click()`);
  await waitFor(`location.pathname === '/editor'`, 'Open to Editor navigation');
  const opened = await evaluate(`location.pathname === '/editor'`);
  await send('Page.navigate', { url: baseUrl });
  await waitFor(`!!document.querySelector('.project-row')`, 'project to delete');
  await evaluate(`document.querySelector('.project-delete-action').click()`);
  await waitFor(`!!document.querySelector('.ui-alert-dialog__actions')`, 'delete confirmation');
  await evaluate(
    `document.querySelector('.ui-alert-dialog__actions .ui-button:last-child').click()`,
  );
  await waitFor(`!document.querySelector('.project-row')`, 'deleted project');
  const deleted = await evaluate(`!document.querySelector('.project-row')`);
  const interactions = {
    locale,
    accountExpanded,
    settingsOpened,
    formVisible,
    vietnameseInput,
    created,
    projectListed,
    exportAvailable,
    sortSelected,
    structureImportAvailable,
    backupImportOpened,
    searchFiltered,
    opened,
    deleted,
  };
  const runtimeRequests = requests.filter((url) => url.includes('/assets/homepage/runtime/'));
  const report = { results, themeSequence, routeDisposed, interactions, runtimeRequests };
  await writeFile(join(artifactDir, 'report.json'), JSON.stringify(report, null, 2));
  console.log(
    JSON.stringify(
      {
        results: results.map(({ theme, width, height, valid, state }) => ({
          theme,
          width,
          height,
          valid,
          calls: state.canvas?.drawCalls,
          triangles: state.canvas?.triangles,
          textures: state.canvas?.textureCount,
          estimatedTextureMiB: state.canvas?.estimatedTextureMiB,
          renderMs: state.canvas?.renderMs,
          scrollWidth: state.scrollWidth,
          minControlFont: state.minControlFont,
        })),
        runtimeRequests: runtimeRequests.length,
        themeSequence,
        routeDisposed,
        interactions,
        artifactDir,
      },
      null,
      2,
    ),
  );
  socket.close();
  if (results.some((result) => !result.valid)) process.exitCode = 1;
  const firstMetrics = themeSequence[0].metrics;
  if (
    !routeDisposed ||
    themeSequence.some(
      (step) =>
        !step.selectedOnly ||
        step.metrics.triangles !== firstMetrics.triangles ||
        step.metrics.geometries !== firstMetrics.geometries ||
        step.metrics.textures > firstMetrics.textures + 1,
    )
  )
    process.exitCode = 1;
  if (
    locale !== 'vi' ||
    accountExpanded !== 'true' ||
    !settingsOpened ||
    !formVisible ||
    vietnameseInput !== 'Căn nhà bên hồ' ||
    !created ||
    !projectListed ||
    !exportAvailable ||
    !sortSelected ||
    !structureImportAvailable ||
    !backupImportOpened ||
    !searchFiltered ||
    !opened ||
    !deleted
  )
    process.exitCode = 1;
} finally {
  chrome.kill();
  if (chrome.exitCode === null) await once(chrome, 'exit');
  await rm(profile, { recursive: true, force: true, maxRetries: 8, retryDelay: 100 });
}
