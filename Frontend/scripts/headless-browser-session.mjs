import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { writeFile } from 'node:fs/promises';

export function findBrowser() {
  const candidates = [
    process.env['CHROME_BIN'],
    process.env['EDGE_BIN'],
    process.env['PROGRAMFILES'] &&
      join(process.env['PROGRAMFILES'], 'Google/Chrome/Application/chrome.exe'),
    process.env['PROGRAMFILES(X86)'] &&
      join(process.env['PROGRAMFILES(X86)'], 'Microsoft/Edge/Application/msedge.exe'),
    '/usr/bin/chromium',
    '/usr/bin/google-chrome',
  ].filter(Boolean);
  const browser = candidates.find((candidate) => existsSync(candidate));
  if (!browser) throw new Error('Chrome or Edge is required for Homepage browser verification.');
  return browser;
}

export async function startHeadlessBrowser(browser, url, userDataDirectory) {
  const child = spawn(
    browser,
    [
      '--headless=new',
      '--disable-gpu',
      '--disable-extensions',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--no-first-run',
      '--no-default-browser-check',
      '--remote-allow-origins=*',
      '--remote-debugging-port=0',
      `--user-data-dir=${userDataDirectory}`,
      'about:blank',
    ],
    { windowsHide: true, stdio: 'ignore' },
  );
  let spawnError;
  let resolveChildClose;
  const childClosed = new Promise((resolveClose) => (resolveChildClose = resolveClose));
  child.once('close', resolveChildClose);
  child.once('error', (error) => (spawnError = error));
  let browserSocket;
  let pageSocket;

  try {
    const activePortPath = join(userDataDirectory, 'DevToolsActivePort');
    const { port, browserUrl } = await waitForDevTools(child, activePortPath, () => spawnError);
    browserSocket = await connectDebugger(browserUrl);
    const targetResponse = await fetch(
      `http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`,
      { method: 'PUT' },
    );
    if (!targetResponse.ok) {
      throw new Error(`Could not open the browser verification page (${targetResponse.status}).`);
    }
    const target = await targetResponse.json();
    pageSocket = await connectDebugger(target.webSocketDebuggerUrl);
    const send = createDebuggerSender(pageSocket);
    await send('Page.enable');
    await send('Runtime.enable');

    return {
      evaluate: async (expression) => {
        const response = await send('Runtime.evaluate', {
          expression,
          returnByValue: true,
          awaitPromise: true,
        });
        if (response.exceptionDetails) {
          throw new Error(response.exceptionDetails.text ?? 'Browser evaluation failed.');
        }
        return response.result.value;
      },
      setViewport: (width, height, deviceScaleFactor = 1, mobile = false) =>
        send('Emulation.setDeviceMetricsOverride', {
          width,
          height,
          deviceScaleFactor,
          mobile,
        }),
      captureScreenshot: async (path) => {
        const response = await send('Page.captureScreenshot', {
          format: 'png',
          fromSurface: true,
          captureBeyondViewport: false,
        });
        await writeFile(path, Buffer.from(response.data, 'base64'));
      },
      close: () => closeBrowser(),
    };
  } catch (error) {
    await closeBrowser();
    throw error;
  }

  async function closeBrowser() {
    pageSocket?.close();
    try {
      if (browserSocket?.readyState === WebSocket.OPEN) {
        await Promise.race([createDebuggerSender(browserSocket)('Browser.close'), delay(1500)]);
      }
    } catch {
      child.kill();
    }
    browserSocket?.close();
    await Promise.race([childClosed, delay(5000)]);
    if (child.exitCode === null) {
      child.kill();
      await childClosed;
    }
  }
}

async function waitForDevTools(child, path, getSpawnError) {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (getSpawnError()) throw getSpawnError();
    if (child.exitCode !== null) throw new Error(`Browser exited early with ${child.exitCode}.`);
    try {
      const [portValue, browserPath] = readFileSync(path, 'utf8').split(/\r?\n/);
      const port = Number(portValue);
      if (Number.isInteger(port) && port > 0 && browserPath) {
        return { port, browserUrl: `ws://127.0.0.1:${port}${browserPath}` };
      }
    } catch {
      await delay(50);
    }
  }
  throw new Error('Browser did not publish its DevTools port.');
}

function connectDebugger(url) {
  return new Promise((resolveSocket, reject) => {
    const socket = new WebSocket(url);
    socket.addEventListener('open', () => resolveSocket(socket), { once: true });
    socket.addEventListener(
      'error',
      () => reject(new Error('Could not connect to browser DevTools.')),
      { once: true },
    );
  });
}

function createDebuggerSender(socket) {
  let nextId = 0;
  const pending = new Map();
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (typeof message.id !== 'number') return;
    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    if (message.error) request.reject(new Error(message.error.message));
    else request.resolve(message.result);
  });

  return (method, params = {}) =>
    new Promise((resolveResponse, rejectResponse) => {
      const id = ++nextId;
      pending.set(id, { resolve: resolveResponse, reject: rejectResponse });
      socket.send(JSON.stringify({ id, method, params }));
    });
}
