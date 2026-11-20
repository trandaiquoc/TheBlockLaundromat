import { createReadStream, existsSync, statSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findBrowser, startHeadlessBrowser } from './headless-browser-session.mjs';

const frontend = resolve(fileURLToPath(new URL('..', import.meta.url)));
const webRoot = resolve(frontend, 'dist/TheBlockLaundromat/browser');
const artifacts = resolve(frontend, '.artifacts/mini-diorama-preview');
const screenshots = join(artifacts, 'screenshots');
const artReview = join(artifacts, 'art-review');
const themeTransitionAndTurnMs = 2600;
const sceneRemountTimeoutMs = 30_000;
const browser = findBrowser();
if (!existsSync(join(webRoot, 'index.html'))) {
  throw new Error('Production build is missing. Run npm run build before browser verification.');
}

await mkdir(screenshots, { recursive: true });
await mkdir(artReview, { recursive: true });
const profiles = [];
const server = createStaticServer(webRoot);
let webglSession;
let fallbackSession;

try {
  const address = await listen(server);
  const origin = process.argv[2]
    ? new URL(process.argv[2]).origin
    : 'http://127.0.0.1:' + address.port;
  webglSession = await openSession(origin, 'webgl', { webglEnabled: true });
  await webglSession.setViewport(1440, 900);
  try {
    await waitFor(
      webglSession,
      "document.querySelector('.mini-diorama__scene')?.dataset.previewState",
      'ready',
    );
  } catch (error) {
    throw new Error(
      `${error.message} Browser console: ${JSON.stringify(webglSession.getConsoleMessages())}`,
    );
  }
  await assertReadyScene(webglSession);
  const frameTiming = await measureFrameTiming(webglSession);

  const screenshotsTaken = [];
  await verifyLayoutAndCapture(
    webglSession,
    screenshots,
    artReview,
    screenshotsTaken,
    1440,
    900,
    false,
  );
  await verifyLayoutAndCapture(
    webglSession,
    screenshots,
    artReview,
    screenshotsTaken,
    1024,
    768,
    false,
  );
  await verifyLayoutAndCapture(
    webglSession,
    screenshots,
    artReview,
    screenshotsTaken,
    390,
    844,
    true,
  );
  await verifyLayoutAndCapture(
    webglSession,
    screenshots,
    artReview,
    screenshotsTaken,
    320,
    568,
    true,
  );

  await verifySceneActions(webglSession, artReview, screenshotsTaken);
  await verifyNoCameraToolbar(webglSession);
  await verifyMiddleMousePan(webglSession, artReview, screenshotsTaken);
  await verifyThemesAndLocalization(webglSession, artReview, screenshotsTaken);
  await verifyClockRotation(webglSession, artReview, screenshotsTaken);
  await verifyThemeSwipe(webglSession, artReview, screenshotsTaken);
  await verifySettings(webglSession);
  await verifyReducedMotion(webglSession);
  await verifyCanvasPicking(webglSession, artReview, screenshotsTaken);
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
    const button = document.querySelector('[data-focus-target="project-board"]');
    button.click();
  })()`);
  await waitFor(
    fallbackSession,
    `document.querySelector('[data-focus-target="project-board"]')?.getAttribute('aria-pressed')`,
    'true',
  );
  const fallbackAction = await fallbackSession.evaluate(`(() => ({
    selected: document.querySelector('[data-focus-target="project-board"]')?.getAttribute('aria-pressed'),
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
    'Browser verification passed: WebGL scene, four viewport captures, keyboard focus actions, camera gestures, four themes, EN/VI, Settings, reduced motion, pointer picking, 20 route mount/unmount cycles, root Project Screen, and WebGL fallback.',
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
    sceneRequests: performance.getEntriesByType('resource')
      .map(entry => new URL(entry.name).pathname)
      .filter(path => path.includes('/assets/homepage/runtime/models/')),
    textureRequests: performance.getEntriesByType('resource')
      .map(entry => new URL(entry.name).pathname)
      .filter(path => path.endsWith('/textures/mini-diorama/exterior-forest-floor.png')),
    fallback: document.querySelector('.mini-diorama__fallback')?.textContent?.trim() ?? null,
  }))()`);
  if (
    state.previewState !== 'ready' ||
    state.canvasCount !== 1 ||
    !state.canvasSize?.[0] ||
    !state.canvasSize?.[1] ||
    state.sceneRequests.length !== 2 ||
    state.textureRequests.length !== 1 ||
    !state.sceneRequests.includes(
      '/assets/homepage/runtime/models/Room/Octagonal-Laundromat.glb',
    ) ||
    !state.sceneRequests.includes(
      '/assets/homepage/runtime/models/Props/Washer-Alternate/Washer.glb',
    )
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

async function verifyLayoutAndCapture(
  session,
  directory,
  artReviewDirectory,
  captured,
  width,
  height,
  mobile,
) {
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
      header: rect('.mini-diorama-header'),
      scene: rect('.mini-diorama__scene'),
      hotspots: rect('.mini-diorama__focus-toolbar'),
      cameraControls: document.querySelectorAll('.mini-diorama__camera-controls').length,
      timeControl: rect('app-mini-diorama-time-dial'),
      clockFace: rect('.mini-diorama-time-dial__face'),
      clockButtonCount: document.querySelectorAll('.mini-diorama-time-dial__quarter').length,
      logoWidth: rect('.mini-diorama-header__logo')?.width,
      logoLeft: rect('.mini-diorama-header__logo')?.left,
      logoTop: rect('.mini-diorama-header__logo')?.top,
      backLinkText: document.querySelector('.mini-diorama-header__back')?.textContent?.trim(),
      controls: rect('.mini-diorama-header__quick-controls'),
      profile: rect('app-mini-diorama-preview-account'),
      buttons: [...document.querySelectorAll('.mini-diorama__focus-toolbar [data-focus-target], .mini-diorama-time-dial__quarter, .mini-diorama-time-dial__slider, .mini-diorama-header__back, .mini-diorama-header__settings-button, app-mini-diorama-preview-account .account-card')].map(button => {
        const box = button.getBoundingClientRect();
        return [box.left, box.right, box.top, box.bottom];
      }),
    };
  })()`);
  const hasOverflow = layout.document[0] > width || layout.document[1] > height;
  const elementsOutside = [
    layout.header,
    layout.scene,
    layout.hotspots,
    layout.timeControl,
    layout.profile,
  ].some(
    (box) =>
      !box || box.left < -1 || box.right > width + 1 || box.top < -1 || box.bottom > height + 1,
  );
  const actionOutside = layout.buttons.some(
    ([left, right, top, bottom]) =>
      left < -1 || right > width + 1 || top < -1 || bottom > height + 1,
  );
  const timeToolbarOverlap =
    layout.timeControl.left < layout.hotspots.right &&
    layout.timeControl.right > layout.hotspots.left &&
    layout.timeControl.top < layout.hotspots.bottom &&
    layout.timeControl.bottom > layout.hotspots.top;
  const toolbarAlignedToLightAndViewport =
    Math.abs(
      layout.hotspots.left +
        layout.hotspots.width / 2 -
        layout.clockFace.left -
        layout.clockFace.width / 2,
    ) <= 3 && Math.abs(layout.hotspots.top + layout.hotspots.height / 2 - height / 2) <= 3;
  if (
    layout.viewport[0] !== width ||
    layout.viewport[1] !== height ||
    hasOverflow ||
    elementsOutside ||
    layout.cameraControls !== 0 ||
    layout.clockButtonCount !== 4 ||
    width - layout.clockFace.right > 18 ||
    height - layout.clockFace.bottom > 18 ||
    layout.timeControl.top < layout.header.top ||
    (width <= 380 && (layout.timeControl.width > 150 || layout.timeControl.height > 150)) ||
    timeToolbarOverlap ||
    !toolbarAlignedToLightAndViewport ||
    (width >= 1400 && layout.logoWidth < 190) ||
    (width >= 1400 && (layout.logoLeft > 16 || layout.logoTop > 16)) ||
    layout.backLinkText !== '' ||
    actionOutside ||
    layout.scene.height < 100 ||
    layout.scene.left > 1 ||
    layout.scene.top > 1 ||
    layout.scene.right < width - 1 ||
    layout.scene.bottom < height - 1
  ) {
    throw new Error(
      `${mobile ? 'Mobile' : 'Desktop'} layout failed at ${width}x${height}: ${JSON.stringify(layout)}.`,
    );
  }
  const name = `scene-${width}x${height}.png`;
  await session.captureScreenshot(join(directory, name));
  captured.push(name);
  try {
    await session.evaluate(
      "document.querySelector('.mini-diorama__focus-toolbar [data-focus-target]:last-child').click()",
    );
  } catch (error) {
    throw new Error(
      `The Raccoon focus action failed: ${error.message}. Browser console: ${JSON.stringify(session.getConsoleMessages())}`,
    );
  }
  await settleCamera(session);
  const heroName = `art-review/scene-hero-${width}x${height}.png`;
  await session.captureScreenshot(join(artReviewDirectory, `scene-hero-${width}x${height}.png`));
  captured.push(heroName);
  try {
    await session.evaluate("document.querySelector('[data-focus-target=overview]').click()");
  } catch (error) {
    throw new Error(
      `Returning to the room overview failed: ${error.message}. Browser console: ${JSON.stringify(session.getConsoleMessages())}`,
    );
  }
  await settleCamera(session);
}

async function verifySceneActions(session, directory, captured) {
  const controls = ['Overview', 'Project board', 'Washer', 'Greet the Raccoon'];
  for (const label of controls) {
    const action = await session.evaluate(`(() => {
      const button = [...document.querySelectorAll('.mini-diorama__focus-toolbar [data-focus-target]')]
        .find(candidate => candidate.getAttribute('aria-label') === ${JSON.stringify(label)});
      button?.focus();
      return Boolean(button && document.activeElement === button);
    })()`);
    if (!action) throw new Error(`Could not focus the ${label} scene action.`);
    await session.pressKey('Enter', 'Enter', 13);
    await waitFor(
      session,
      `(() => {
        const button = document.querySelector('.mini-diorama__focus-toolbar [data-focus-target][aria-pressed="true"]');
        return button?.getAttribute('aria-label');
      })()`,
      label,
    );
    const result = await session.evaluate(`(() => ({
      selected: (() => {
        const button = document.querySelector('.mini-diorama__focus-toolbar [data-focus-target][aria-pressed="true"]');
        return button?.getAttribute('aria-label');
      })(),
      message: document.querySelector('.mini-diorama__live-message')?.textContent?.trim(),
    }))()`);
    if (result.selected !== label || !result.message) {
      throw new Error(
        `Keyboard action ${label} did not update the DOM state: ${JSON.stringify(result)}.`,
      );
    }
  }

  await session.setViewport(1440, 900);
  for (const target of ['project-board', 'washer']) {
    await session.evaluate(`document.querySelector('[data-focus-target="${target}"]').click()`);
    await settleCamera(session);
    const selected = await session.evaluate(
      `document.querySelector('[data-focus-target="${target}"]')?.getAttribute('aria-pressed')`,
    );
    if (selected !== 'true') throw new Error(`The ${target} front focus did not become active.`);
    const filename = `front-focus-${target}-1440x900.png`;
    await session.captureScreenshot(join(directory, filename));
    captured.push(`art-review/${filename}`);
  }
  await session.evaluate("document.querySelector('[data-focus-target=overview]').click()");
  await settleCamera(session);
}

async function verifyNoCameraToolbar(session) {
  const state = await session.evaluate(`({
    cameraControls: document.querySelectorAll('.mini-diorama__camera-controls').length,
    sceneCanvases: document.querySelectorAll('.mini-diorama__scene canvas').length,
  })`);
  if (state.cameraControls !== 0 || state.sceneCanvases !== 1) {
    throw new Error(
      `The preview still renders the removed camera toolbar: ${JSON.stringify(state)}.`,
    );
  }
}

async function verifyMiddleMousePan(session, directory, captured) {
  await session.setReducedMotion(true);
  await session.evaluate(
    'document.activeElement instanceof HTMLElement && document.activeElement.blur()',
  );
  await session.evaluate('new Promise(resolve => setTimeout(resolve, 80))');
  const canvasBounds = await session.evaluate(`(() => {
    const { x, y, width, height } = document.querySelector('.mini-diorama__scene canvas').getBoundingClientRect();
    return { x, y, width, height };
  })()`);
  if (canvasBounds.width < 100 || canvasBounds.height < 100) {
    throw new Error(
      `The scene canvas is too small for the middle-button pan check: ${JSON.stringify(canvasBounds)}.`,
    );
  }

  const clip = {
    x: canvasBounds.x,
    y: canvasBounds.y,
    width: canvasBounds.width,
    height: canvasBounds.height,
    scale: 1,
  };
  const beforePath = join(directory, 'camera-middle-pan-before-1440x900.png');
  const afterPath = join(directory, 'camera-middle-pan-after-1440x900.png');
  await session.captureScreenshot(beforePath, clip);

  const startX = canvasBounds.x + canvasBounds.width * 0.52;
  const startY = canvasBounds.y + canvasBounds.height * 0.5;
  await session.dispatchMouseEvent('mouseMoved', startX, startY);
  await session.dispatchMouseEvent('mousePressed', startX, startY, 'middle', 4);
  await session.dispatchMouseEvent('mouseMoved', startX + 64, startY + 38, 'middle', 4);
  await session.dispatchMouseEvent('mouseReleased', startX + 64, startY + 38, 'middle', 0);
  await session.evaluate(`(() => {
    const canvas = document.querySelector('.mini-diorama__scene canvas');
    canvas.dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse' }));
  })()`);
  await session.evaluate('new Promise(resolve => requestAnimationFrame(() => resolve()))');
  await session.captureScreenshot(afterPath, clip);
  const before = await readFile(beforePath);
  const after = await readFile(afterPath);
  if (before.equals(after)) {
    throw new Error('A middle-button drag did not change the rendered camera view.');
  }
  captured.push('art-review/camera-middle-pan-before-1440x900.png');
  captured.push('art-review/camera-middle-pan-after-1440x900.png');

  await session.evaluate(`document.querySelector('[data-focus-target="overview"]')?.click()`);
  await session.setReducedMotion(false);
}

async function verifyThemesAndLocalization(session, directory, captured) {
  await session.setViewport(1440, 900);
  const expectedVariants = {
    craft: 'Minecraft',
    raccoon: 'Raccoon',
    light: 'Light',
    dark: 'Dark',
  };
  const expectedTimeStops = { light: '0', craft: '1', raccoon: '2', dark: '3' };
  for (const theme of ['craft', 'raccoon', 'light', 'dark']) {
    await session.evaluate(`(() => {
      const slider = document.querySelector('.mini-diorama-time-dial__slider');
      slider.value = ${JSON.stringify(expectedTimeStops[theme])};
      slider.dispatchEvent(new Event('input', { bubbles: true }));
    })()`);
    const selectedTheme = await waitFor(session, 'document.documentElement.dataset.theme', theme);
    if (selectedTheme !== theme) throw new Error(`The ${theme} theme did not apply.`);
    await session.evaluate(
      `new Promise(resolve => setTimeout(resolve, ${themeTransitionAndTurnMs}))`,
    );
    await waitFor(
      session,
      `(() => {
        const activeLayer = document.querySelector('.mini-diorama__sky-layer--${theme}');
        const activeOpacity = Number(getComputedStyle(activeLayer).opacity);
        const inactiveLayers = [...document.querySelectorAll('.mini-diorama__sky-layer')]
          .filter(layer => !layer.classList.contains('mini-diorama__sky-layer--${theme}'));
        return activeOpacity >= 0.999 && inactiveLayers.every(layer => Number(getComputedStyle(layer).opacity) <= 0.001);
      })()`,
      true,
    );
    const sliderState = await session.evaluate(`(() => ({
      theme: document.querySelector('.mini-diorama')?.dataset.theme,
      value: document.querySelector('.mini-diorama-time-dial__slider')?.value,
      selectedQuarter: document.querySelector('.mini-diorama-time-dial__quarter.is-selected')?.dataset.timeStage,
      clockButtonCount: document.querySelectorAll('.mini-diorama-time-dial__quarter').length,
      curvedThemeLabelCount: document.querySelectorAll('.mini-diorama-time-dial__quarter textPath').length,
      activeWeatherAssetCount: document.querySelectorAll('.mini-diorama-time-dial__weather .weather-art.is-selected').length,
      clockHeadingCount: document.querySelectorAll('.mini-diorama-time-dial__heading').length,
      rootAttributes: [...document.querySelector('.mini-diorama')?.attributes ?? []]
        .map(attribute => [attribute.name, attribute.value]),
      skyAttributes: [...document.querySelector('.mini-diorama__sky-layer--${theme}')?.attributes ?? []]
        .map(attribute => [attribute.name, attribute.value]),
      selectorMatches: document.querySelector('.mini-diorama__sky-layer--${theme}')
        ?.matches('.mini-diorama[data-theme="${theme}"] .mini-diorama__sky-layer--${theme}'),
      activeSkyOpacity: getComputedStyle(document.querySelector('.mini-diorama__sky-layer--${theme}')).opacity,
      otherSkyOpacity: [...document.querySelectorAll('.mini-diorama__sky-layer')]
        .filter(layer => !layer.classList.contains('mini-diorama__sky-layer--${theme}'))
        .map(layer => getComputedStyle(layer).opacity),
      glowX: Number.parseFloat(document.querySelector('.mini-diorama__sky-glow')?.style.left ?? 'NaN'),
      cloudOpacity: Number(getComputedStyle(document.querySelector('.mini-diorama__sky-cloud--one')).opacity),
      starOpacity: Number(getComputedStyle(document.querySelector('.mini-diorama__sky-star--one')).opacity),
    }))()`);
    if (
      sliderState.theme !== theme ||
      sliderState.value !== expectedTimeStops[theme] ||
      sliderState.selectedQuarter !== theme ||
      sliderState.clockButtonCount !== 4 ||
      sliderState.curvedThemeLabelCount !== 4 ||
      sliderState.activeWeatherAssetCount !== 1 ||
      sliderState.clockHeadingCount !== 0 ||
      Math.abs(sliderState.glowX - { light: 14, craft: 38, raccoon: 63, dark: 87 }[theme]) > 0.1 ||
      (theme === 'light' || theme === 'raccoon'
        ? sliderState.cloudOpacity <= 0
        : sliderState.cloudOpacity !== 0) ||
      (theme === 'dark' ? sliderState.starOpacity <= 0 : sliderState.starOpacity !== 0) ||
      Number(sliderState.activeSkyOpacity) < 0.999 ||
      sliderState.otherSkyOpacity.some((opacity) => Number(opacity) > 0.001)
    ) {
      throw new Error(
        `The ${theme} theme did not sync its slider and sky: ${JSON.stringify(sliderState)}.`,
      );
    }
    const selectedVariant = await waitFor(
      session,
      "document.querySelector('.mini-diorama__scene canvas')?.dataset.materialVariant",
      expectedVariants[theme],
    );
    if (selectedVariant !== expectedVariants[theme]) {
      throw new Error(
        `The ${theme} theme selected ${selectedVariant} instead of ${expectedVariants[theme]}.`,
      );
    }
    await session.evaluate(
      'new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))',
    );
    await session.evaluate(
      'document.activeElement instanceof HTMLElement && document.activeElement.blur()',
    );
    const screenshotName = `art-review/theme-${theme}-overview-1440x900.png`;
    await session.captureScreenshot(join(directory, `theme-${theme}-overview-1440x900.png`));
    captured.push(screenshotName);
  }
  for (const [theme, value] of Object.entries(expectedTimeStops)) {
    await session.evaluate(`(() => {
      const slider = document.querySelector('.mini-diorama-time-dial__slider');
      slider.value = ${JSON.stringify(value)};
      slider.dispatchEvent(new Event('input', { bubbles: true }));
    })()`);
    await waitFor(session, "document.querySelector('.mini-diorama')?.dataset.theme", theme);
    await session.evaluate(
      `new Promise(resolve => setTimeout(resolve, ${themeTransitionAndTurnMs}))`,
    );
    const variant = await waitFor(
      session,
      "document.querySelector('.mini-diorama__scene canvas')?.dataset.materialVariant",
      expectedVariants[theme],
    );
    const sliderState = await session.evaluate(`(() => ({
      value: document.querySelector('.mini-diorama-time-dial__slider')?.value,
      valueText: document.querySelector('.mini-diorama-time-dial__slider')?.getAttribute('aria-valuetext'),
    }))()`);
    if (sliderState.value !== value || !sliderState.valueText) {
      throw new Error(
        `The time slider did not update the ${theme} theme menu: ${JSON.stringify(sliderState)} (${variant}).`,
      );
    }
  }
  await session.evaluate(
    "document.querySelector('app-mini-diorama-preview-account .account-card').click()",
  );
  await waitFor(session, "Boolean(document.querySelector('.account-popover.is-open'))", true);
  const languageLabel = await session.evaluate(
    "document.querySelector('.account-popover-section-title')?.textContent?.trim()",
  );
  if (languageLabel !== 'Language')
    throw new Error(`Missing Language label in account settings: ${languageLabel}`);
  await session.evaluate("document.querySelector('[data-locale=vi]').click()");
  const vietnamese = await session.evaluate(`({
    lang: document.documentElement.lang,
    logoAlt: document.querySelector('.mini-diorama-header__logo')?.alt,
    actions: [...document.querySelectorAll('.mini-diorama__focus-toolbar [data-focus-target]')].map(button => button.getAttribute('aria-label')),
    timeLabel: document.querySelector('.mini-diorama-time-dial__slider')?.getAttribute('aria-valuetext'),
    sliderLabel: document.querySelector('.mini-diorama-time-dial__slider')?.getAttribute('aria-valuetext'),
    selectedThemeLabel: document.querySelector('.mini-diorama-time-dial__quarter.is-selected')?.textContent?.trim(),
    clockHeadingCount: document.querySelectorAll('.mini-diorama-time-dial__heading').length,
  })`);
  if (vietnamese.clockHeadingCount !== 0 || !vietnamese.selectedThemeLabel) {
    throw new Error(
      `The clock kept redundant text or lost its curved theme label: ${JSON.stringify(vietnamese)}.`,
    );
  }
  if (
    vietnamese.lang !== 'vi' ||
    vietnamese.logoAlt !== 'The Block Laundromat' ||
    !vietnamese.actions.some((label) => label?.includes('Máy giặt')) ||
    vietnamese.timeLabel !== 'Ban đêm' ||
    vietnamese.sliderLabel !== 'Ban đêm'
  ) {
    throw new Error(`Vietnamese preview copy was not applied: ${JSON.stringify(vietnamese)}.`);
  }
  await session.evaluate("document.querySelector('[data-locale=en]').click()");
  const english = await session.evaluate(`({
    lang: document.documentElement.lang,
    logoAlt: document.querySelector('.mini-diorama-header__logo')?.alt,
  })`);
  if (english.lang !== 'en' || english.logoAlt !== 'The Block Laundromat') {
    throw new Error(`English preview copy was not restored: ${JSON.stringify(english)}.`);
  }
}

async function verifyClockRotation(session, directory, captured) {
  await session.setViewport(1440, 900);
  await session.evaluate(`(() => {
    const slider = document.querySelector('.mini-diorama-time-dial__slider');
    slider.value = '3';
    slider.dispatchEvent(new Event('input', { bubbles: true }));
  })()`);
  await waitFor(session, "document.querySelector('.mini-diorama')?.dataset.theme", 'dark');
  const face = await session.evaluate(`(() => {
    const { left, top, width, height } = document.querySelector('.mini-diorama-time-dial__face').getBoundingClientRect();
    return { left, top, width, height };
  })()`);
  const centerX = face.left + face.width / 2;
  const centerY = face.top + face.height / 2;
  const dragRadius = face.width * 0.22;

  await session.dispatchMouseEvent('mouseMoved', centerX, centerY - dragRadius);
  await session.dispatchMouseEvent('mousePressed', centerX, centerY - dragRadius, 'left', 1);
  await waitFor(session, "document.querySelector('.mini-diorama')?.dataset.theme", 'light');
  const morning = await session.evaluate(`({
    glowX: Number.parseFloat(document.querySelector('.mini-diorama__sky-glow')?.style.left ?? 'NaN'),
    dragging: document.querySelector('.mini-diorama')?.dataset.clockDragging,
  })`);
  if (Math.abs(morning.glowX - 14) > 0.1 || morning.dragging !== 'true') {
    throw new Error(
      `Clock rotation did not sweep the glow to morning: ${JSON.stringify(morning)}.`,
    );
  }

  await session.dispatchMouseEvent('mouseMoved', centerX - dragRadius, centerY, 'left', 1);
  await waitFor(session, "document.querySelector('.mini-diorama')?.dataset.theme", 'dark');
  const night = await session.evaluate(`({
    glowX: Number.parseFloat(document.querySelector('.mini-diorama__sky-glow')?.style.left ?? 'NaN'),
    selected: document.querySelector('.mini-diorama-time-dial__quarter.is-selected')?.dataset.timeStage,
  })`);
  if (Math.abs(night.glowX - 87) > 0.1 || night.selected !== 'dark') {
    throw new Error(`Counter-rotation did not return to night: ${JSON.stringify(night)}.`);
  }

  await session.dispatchMouseEvent('mouseReleased', centerX - dragRadius, centerY, 'left', 0);
  await waitFor(session, "document.querySelector('.mini-diorama')?.dataset.clockDragging", 'false');
  await session.captureScreenshot(join(directory, 'clock-reverse-sweep-dark-1440x900.png'));
  captured.push('art-review/clock-reverse-sweep-dark-1440x900.png');
}

async function verifyThemeSwipe(session, directory, captured) {
  await session.setViewport(1440, 900);
  const startX = 820;
  const endX = 510;
  const y = 460;
  const drag = async (fromX, toX) => {
    await session.dispatchMouseEvent('mouseMoved', fromX, y);
    await session.dispatchMouseEvent('mousePressed', fromX, y, 'left', 1);
    await session.dispatchMouseEvent('mouseMoved', toX, y, 'left', 1);
    await session.dispatchMouseEvent('mouseReleased', toX, y, 'left', 0);
  };

  for (const target of ['washer', 'project-board', 'raccoon']) {
    await session.evaluate(`document.querySelector('[data-focus-target="${target}"]').click()`);
    await settleCamera(session);
    await drag(startX, endX);
    await session.evaluate('new Promise(resolve => setTimeout(resolve, 180))');
    const state = await session.evaluate(`({
      theme: document.querySelector('.mini-diorama')?.dataset.theme,
      selectedFocus: document.querySelector('.mini-diorama__focus-toolbar [data-focus-target][aria-pressed="true"]')?.dataset.focusTarget,
      cursor: document.querySelector('.mini-diorama__scene canvas')?.style.cursor,
    })`);
    if (state.theme !== 'dark' || state.selectedFocus !== target || state.cursor === 'grabbing') {
      throw new Error(`A swipe changed the ${target} focus interaction: ${JSON.stringify(state)}.`);
    }
  }

  await session.evaluate("document.querySelector('[data-focus-target=overview]').click()");
  await settleCamera(session);
  await drag(startX, endX);
  await waitFor(session, "document.querySelector('.mini-diorama')?.dataset.theme", 'light');
  await waitFor(session, "document.querySelector('.mini-diorama')?.dataset.skyOrbit", 'right');
  await session.evaluate('new Promise(resolve => setTimeout(resolve, 1400))');
  await session.captureScreenshot(join(directory, 'theme-swipe-dark-to-light-1440x900.png'));
  captured.push('art-review/theme-swipe-dark-to-light-1440x900.png');

  await drag(endX, startX);
  await waitFor(session, "document.querySelector('.mini-diorama')?.dataset.theme", 'dark');
  await waitFor(session, "document.querySelector('.mini-diorama')?.dataset.skyOrbit", 'left');
  await session.evaluate('new Promise(resolve => setTimeout(resolve, 1400))');
  await session.captureScreenshot(join(directory, 'theme-swipe-light-to-dark-1440x900.png'));
  captured.push('art-review/theme-swipe-light-to-dark-1440x900.png');
  await session.evaluate("document.querySelector('[data-focus-target=overview]').click()");
  await settleCamera(session);
}

async function verifySettings(session) {
  await session.evaluate(
    "document.querySelector('app-mini-diorama-preview-account .account-card').click()",
  );
  await session.evaluate("document.querySelector('.account-settings-action').click()");
  await waitFor(session, "Boolean(document.querySelector('.settings-dialog[role=dialog]'))", true);
  const setting = await session.evaluate(`(() => {
    const section = document.querySelector('.settings-nav-select');
    section.value = 'accessibility';
    section.dispatchEvent(new Event('change', { bubbles: true }));
    return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => {
      const checkbox = document.querySelector('[data-scene-animations-setting]');
      if (!checkbox || !checkbox.checked) {
        resolve({ found: Boolean(checkbox), checked: checkbox?.checked });
        return;
      }
      checkbox.click();
      resolve({ found: true, checked: checkbox.checked });
    })));
  })()`);
  if (!setting.found || setting.checked) {
    throw new Error(
      `The scene-animation setting did not disable preview motion: ${JSON.stringify(setting)}.`,
    );
  }
  await waitFor(
    session,
    "document.querySelector('.mini-diorama')?.dataset.sceneAnimationsEnabled",
    'false',
  );
  await session.evaluate("document.querySelector('.settings-dialog .primary').click()");
  await waitFor(session, "Boolean(document.querySelector('.settings-dialog'))", false);
  const persisted = await session.evaluate(`(() => {
    const saved = JSON.parse(localStorage.getItem('the-block-laundromat.ui-preferences') || '{}');
    return document.querySelector('.mini-diorama')?.dataset.sceneAnimationsEnabled === 'false' &&
      saved.accessibility?.sceneAnimationsEnabled === false;
  })()`);
  if (!persisted) throw new Error('The disabled scene-animation setting was not saved.');

  await session.evaluate("document.querySelector('.account-settings-action').click()");
  await waitFor(session, "Boolean(document.querySelector('.settings-dialog[role=dialog]'))", true);
  await session.evaluate(`(() => {
    const section = document.querySelector('.settings-nav-select');
    section.value = 'accessibility';
    section.dispatchEvent(new Event('change', { bubbles: true }));
  })()`);
  await waitFor(
    session,
    "Boolean(document.querySelector('[data-scene-animations-setting]'))",
    true,
  );
  await session.evaluate("document.querySelector('[data-scene-animations-setting]').click()");
  await session.evaluate("document.querySelector('.settings-dialog .primary').click()");
  await waitFor(session, "Boolean(document.querySelector('.settings-dialog'))", false);
  await waitFor(
    session,
    "document.querySelector('.mini-diorama')?.dataset.sceneAnimationsEnabled",
    'true',
  );
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
    "document.querySelector('.mini-diorama__focus-toolbar [data-focus-target]:last-child').click()",
  );
  const greetingStillWorks = await session.evaluate(`({
    selected: document.querySelector('[data-focus-target=\"raccoon\"]')?.getAttribute('aria-pressed'),
    message: document.querySelector('.mini-diorama__live-message')?.textContent?.trim(),
  })`);
  if (greetingStillWorks.selected !== 'true' || !greetingStillWorks.message) {
    throw new Error(
      `Reduced motion disabled the semantic greeting action: ${JSON.stringify(greetingStillWorks)}.`,
    );
  }
  await session.setReducedMotion(false);
}

async function verifyCanvasPicking(session, directory, captured) {
  await session.evaluate("document.querySelector('[data-focus-target=overview]').click()");
  await settleCamera(session);
  await verifySceneDragDoesNotPick(session);
  await session.evaluate("document.querySelector('[data-focus-target=overview]')?.click()");
  await settleCamera(session);
  const washerHit = await tapSceneTarget(session, 'Washer', 0.54, 0.4, 'mouse');

  await session.evaluate("document.querySelector('[data-focus-target=overview]').click()");
  await settleCamera(session);
  await tapSceneTarget(session, 'Project board', 0.46, 0.31, 'mouse');

  await session.evaluate("document.querySelector('[data-focus-target=overview]').click()");
  await settleCamera(session);
  await session.evaluate("document.querySelector('[data-focus-target=raccoon]').click()");
  await settleCamera(session);
  await session.captureScreenshot(join(directory, 'raccoon-focus-dark-1440x900.png'));
  captured.push('art-review/raccoon-focus-dark-1440x900.png');
  await tapSceneTarget(session, 'Greet the Raccoon', 0.3, 0.61, 'mouse', {
    left: 0.27,
    top: 0.58,
    right: 0.33,
    bottom: 0.65,
  });

  await session.evaluate("document.querySelector('[data-focus-target=overview]').click()");
  await settleCamera(session);
  await tapSceneTarget(session, 'Washer', washerHit.xRatio, washerHit.yRatio, 'touch', {
    left: washerHit.xRatio - 0.005,
    top: washerHit.yRatio - 0.005,
    right: washerHit.xRatio + 0.005,
    bottom: washerHit.yRatio + 0.005,
  });
}

async function verifySceneDragDoesNotPick(session) {
  const result = await session.evaluate(`(() => {
    const canvas = document.querySelector('.mini-diorama__scene canvas');
    const bounds = canvas.getBoundingClientRect();
    const startX = bounds.left + bounds.width * 0.52;
    const startY = bounds.top + bounds.height * 0.52;
    const dispatch = (type, clientX, clientY) => canvas.dispatchEvent(new PointerEvent(type, {
      bubbles: true,
      pointerId: 19,
      pointerType: 'mouse',
      isPrimary: true,
      button: 0,
      clientX,
      clientY,
    }));
    dispatch('pointerdown', startX, startY);
    dispatch('pointermove', startX + 30, startY + 12);
    dispatch('pointerup', startX + 30, startY + 12);
    const selected = document.querySelector('.mini-diorama__focus-toolbar [data-focus-target][aria-pressed="true"]');
    return selected?.getAttribute('aria-label');
  })()`);
  if (result !== 'Overview') {
    throw new Error(
      `Dragging the scene activated a target instead of orbiting: ${JSON.stringify(result)}.`,
    );
  }
}

async function settleCamera(session) {
  await session.evaluate('new Promise(resolve => setTimeout(resolve, 2600))');
}

async function tapSceneTarget(
  session,
  expectedAction,
  xRatio,
  yRatio,
  pointerType,
  searchArea = {
    left: xRatio - 0.04,
    top: yRatio - 0.04,
    right: xRatio + 0.04,
    bottom: yRatio + 0.04,
  },
) {
  const hit = await session.evaluate(`(() => {
    const canvas = document.querySelector('.mini-diorama__scene canvas');
    const bounds = canvas.getBoundingClientRect();
    const eventInit = {
      bubbles: true,
      pointerId: 1,
      pointerType: 'mouse',
      isPrimary: true,
      button: 0,
    };
    const dispatch = (type, x, y) => canvas.dispatchEvent(
      new PointerEvent(type, { ...eventInit, clientX: x, clientY: y }),
    );
    let x = bounds.left + bounds.width * ${xRatio};
    let y = bounds.top + bounds.height * ${yRatio};
    dispatch('pointermove', x, y);
    if (canvas.style.cursor !== 'pointer') {
      search: for (let yRatio = ${searchArea.top}; yRatio <= ${searchArea.bottom}; yRatio += 0.01) {
        for (let xRatio = ${searchArea.left}; xRatio <= ${searchArea.right}; xRatio += 0.01) {
          x = bounds.left + bounds.width * xRatio;
          y = bounds.top + bounds.height * yRatio;
          dispatch('pointermove', x, y);
          if (canvas.style.cursor === 'pointer') break search;
        }
      }
    }
    if (canvas.style.cursor !== 'pointer') {
      return { selected: null, cursor: canvas.style.cursor, hit: false };
    }
    eventInit.pointerType = ${JSON.stringify(pointerType)};
    dispatch('pointerdown', x, y);
    dispatch('pointerup', x, y);
    return new Promise(resolve => requestAnimationFrame(() => resolve({
      selected: (() => {
        const button = document.querySelector('.mini-diorama__focus-toolbar [data-focus-target][aria-pressed="true"]');
        return button?.getAttribute('aria-label');
      })(),
      cursor: canvas.style.cursor,
      hit: true,
      xRatio: (x - bounds.left) / bounds.width,
      yRatio: (y - bounds.top) / bounds.height,
    })));
  })()`);
  if (hit.selected !== expectedAction) {
    throw new Error(
      `Expected ${expectedAction} from a ${pointerType} tap, received ${JSON.stringify(hit)}.`,
    );
  }
  return { xRatio: hit.xRatio, yRatio: hit.yRatio };
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
    await session.evaluate("document.querySelector('.mini-diorama-header__back').click()");
    await waitFor(session, "Boolean(document.querySelector('.project-page'))", true);
    await waitFor(session, 'window.__miniDioramaPendingFrames.size', 0);
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
    try {
      await waitFor(
        session,
        "document.querySelector('.mini-diorama__scene')?.dataset.previewState",
        'ready',
        sceneRemountTimeoutMs,
      );
    } catch (error) {
      const stateExpression = [
        '({',
        '  path: location.pathname,',
        "  previewState: document.querySelector('.mini-diorama__scene')?.dataset.previewState,",
        "  fallback: document.querySelector('.mini-diorama__fallback')?.textContent?.trim() ?? null,",
        "  canvases: document.querySelectorAll('.mini-diorama__scene canvas').length,",
        '})',
      ].join('\n');
      const state = await session.evaluate(stateExpression);
      throw new Error(
        'Scene failed to remount on route cycle ' +
          (cycle + 1) +
          ': ' +
          JSON.stringify(state) +
          '. Browser console: ' +
          JSON.stringify(session.getConsoleMessages()) +
          '.',
        { cause: error },
      );
    }
    const remounted = await session.evaluate(`({
      canvases: document.querySelectorAll('.mini-diorama__scene canvas').length,
      frames: window.__miniDioramaPendingFrames.size,
    })`);
    if (remounted.canvases !== 1 || remounted.frames !== 0) {
      throw new Error(
        `The scene did not remount idle at cycle ${cycle + 1}: ${JSON.stringify(remounted)}.`,
      );
    }
  }
}

async function verifyProjectScreenRoot(session, directory, captured) {
  await session.evaluate("document.querySelector('.mini-diorama-header__back')?.click()");
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
    focusControls: document.querySelectorAll('.mini-diorama__focus-toolbar [data-focus-target]').length,
    cameraControls: document.querySelectorAll('.mini-diorama__camera-controls button').length,
    canvasCount: document.querySelectorAll('.mini-diorama__scene canvas').length,
  }))()`);
  if (
    state.previewState !== 'fallback' ||
    !state.fallback ||
    !state.message ||
    !state.message.includes('WebGL 2') ||
    state.focusControls !== 4 ||
    state.cameraControls !== 0 ||
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
