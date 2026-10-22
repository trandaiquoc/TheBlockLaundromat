import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { findBrowser, startHeadlessBrowser } from './headless-browser-session.mjs';

const frontend = resolve(fileURLToPath(new URL('..', import.meta.url)));
const source = join(frontend, 'source-assets/homepage');
const rendererPath = join(frontend, 'src/app/features/homepage/homepage-scene-renderer.ts');
const artifacts = join(frontend, '.artifacts/homepage-preview');
const chrome = findBrowser();
const rendererModule = ts.transpileModule(readFileSync(rendererPath, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
}).outputText;
const server = createServer((request, response) => {
  const url = new URL(request.url ?? '/', 'http://127.0.0.1');
  if (url.pathname === '/') {
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    response.end(harnessPage());
    return;
  }
  if (url.pathname === '/manifest.json') {
    response.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
    response.end(readFileSync(join(source, 'scene-manifest.json')));
    return;
  }
  if (url.pathname === '/renderer.mjs') {
    response.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8' });
    response.end(rendererModule);
    return;
  }
  if (url.pathname.startsWith('/source/')) {
    const relativePath = decodeURIComponent(url.pathname.slice('/source/'.length));
    const path = resolve(source, relativePath);
    if (!path.startsWith(source + sep)) {
      response.writeHead(400);
      response.end();
      return;
    }
    try {
      response.writeHead(200, { 'content-type': 'image/png' });
      response.end(readFileSync(path));
    } catch {
      response.writeHead(404);
      response.end();
    }
    return;
  }
  response.writeHead(404);
  response.end();
});

await mkdir(artifacts, { recursive: true });
const profile = await mkdtemp(join(artifacts, 'composition-profile-'));
const profileRoot = resolve(artifacts) + sep;
if (!resolve(profile).startsWith(profileRoot))
  throw new Error('Browser profile escaped artifacts.');

try {
  const address = await listen(server);
  const url = `http://127.0.0.1:${address.port}/`;
  const report = await runBrowser(chrome, url, profile);
  if (!Array.isArray(report) || report.length !== 4) {
    throw new Error(`Expected four theme results; received ${JSON.stringify(report)}.`);
  }

  for (const result of report) {
    console.log(
      `${result.theme}: ${result.differingRgbPixels} RGB pixels differ, max channel delta ${result.maxRgbDelta}; load ${result.loadDurationMs.toFixed(1)} ms; render ${result.renderDurationMs.toFixed(1)} ms; decoded estimate ${result.decodedBytesEstimate} bytes.`,
    );
  }

  const failures = report.filter(
    (result) => result.differingRgbPixels !== 0 || result.maxRgbDelta !== 0,
  );
  if (failures.length) {
    throw new Error(
      `Pixel fidelity check failed for: ${failures.map((result) => result.theme).join(', ')}.`,
    );
  }
} finally {
  await new Promise((resolveClose) => server.close(resolveClose));
  await rm(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 250 });
}

function listen(httpServer) {
  return new Promise((resolveAddress, reject) => {
    httpServer.once('error', reject);
    httpServer.listen(0, '127.0.0.1', () => {
      const address = httpServer.address();
      if (!address || typeof address === 'string') {
        reject(new Error('Could not start the local composition server.'));
        return;
      }
      resolveAddress(address);
    });
  });
}

async function runBrowser(browser, url, userDataDirectory) {
  const browserSession = await startHeadlessBrowser(browser, url, userDataDirectory);
  try {
    const deadline = Date.now() + 120_000;
    let browserResult;
    while (Date.now() < deadline) {
      browserResult = await browserSession.evaluate('window.__compositionResult');
      if (browserResult !== null && browserResult !== undefined) return browserResult;
      await new Promise((resolveWait) => setTimeout(resolveWait, 100));
    }
    throw new Error('Browser pixel composition timed out before returning a result.');
  } finally {
    await browserSession.close();
  }
}

function harnessPage() {
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>Homepage source composition check</title></head>
<body><pre id="result">pending</pre>
<script>
window.__compositionResult = null;
window.addEventListener('error', event => {
  window.__compositionResult = { error: event.message };
});
window.addEventListener('unhandledrejection', event => {
  window.__compositionResult = { error: String(event.reason) };
});
</script>
<script type="module">
import { drawHomepageScene } from '/renderer.mjs';

const output = document.getElementById('result');
try {
  const manifestResponse = await fetch('/manifest.json');
  const manifest = await manifestResponse.json();
  const results = [];
  for (const [theme, themeManifest] of Object.entries(manifest.themes)) {
    const loadStart = performance.now();
    const entries = await Promise.all(themeManifest.assets.map(async asset => {
      const response = await fetch('/source/' + asset.file);
      if (!response.ok) throw new Error('Asset request failed: ' + asset.file);
      const blob = await response.blob();
      const bitmap = await createImageBitmap(blob);
      return { asset, bitmap, encodedBytes: blob.size };
    }));
    const referenceResponse = await fetch('/source/' + themeManifest.source);
    if (!referenceResponse.ok) throw new Error('Reference request failed: ' + themeManifest.source);
    const reference = await createImageBitmap(await referenceResponse.blob());
    const loadDurationMs = performance.now() - loadStart;
    const images = new Map(entries.map(entry => [entry.asset.id, entry.bitmap]));
    const canvas = document.createElement('canvas');
    canvas.width = manifest.canvas.width;
    canvas.height = manifest.canvas.height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    const scene = { layers: entries.map(entry => ({ asset: entry.asset, transformPath: [] })) };
    const renderStart = performance.now();
    drawHomepageScene(context, scene, images);
    const renderDurationMs = performance.now() - renderStart;
    const rendered = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const referenceCanvas = document.createElement('canvas');
    referenceCanvas.width = manifest.canvas.width;
    referenceCanvas.height = manifest.canvas.height;
    const referenceContext = referenceCanvas.getContext('2d', { willReadFrequently: true });
    referenceContext.drawImage(reference, 0, 0);
    const expected = referenceContext.getImageData(0, 0, canvas.width, canvas.height).data;
    let differingRgbPixels = 0;
    let maxRgbDelta = 0;
    let alphaDifferentPixels = 0;
    for (let index = 0; index < rendered.length; index += 4) {
      let pixelDiffers = false;
      for (let channel = 0; channel < 3; channel++) {
        const delta = Math.abs(rendered[index + channel] - expected[index + channel]);
        if (delta > 0) pixelDiffers = true;
        if (delta > maxRgbDelta) maxRgbDelta = delta;
      }
      if (pixelDiffers) differingRgbPixels++;
      if (rendered[index + 3] !== expected[index + 3]) alphaDifferentPixels++;
    }
    results.push({
      theme,
      differingRgbPixels,
      maxRgbDelta,
      alphaDifferentPixels,
      loadDurationMs,
      renderDurationMs,
      encodedBytes: entries.reduce((total, entry) => total + entry.encodedBytes, 0),
      decodedBytesEstimate: entries.reduce((total, entry) => total + entry.bitmap.width * entry.bitmap.height * 4, 0),
    });
    for (const entry of entries) entry.bitmap.close();
    reference.close();
  }
  window.__compositionResult = results;
  output.textContent = JSON.stringify(results);
} catch (error) {
  window.__compositionResult = { error: error instanceof Error ? error.message : String(error) };
  output.textContent = JSON.stringify(window.__compositionResult);
}
</script></body></html>`;
}
