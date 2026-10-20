import { signal, type WritableSignal } from '@angular/core';
// @ts-expect-error Vitest executes this template contract test in Node.
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { JarUploadValidationError } from '../../../../core/assets/mod/import/jar-upload-validation';
import { AssetManagerDialogComponent } from './asset-manager-dialog.component';

const assetManagerTemplate = readFileSync(
  'src/app/features/editor/tools/asset-manager/asset-manager-dialog.component.html',
  'utf8',
);

type AssetManagerTab = 'vanilla' | 'mods';

interface AssetManagerTabState {
  readonly tab: WritableSignal<AssetManagerTab>;
  readonly tabIndex: (tab: AssetManagerTab) => 0 | -1;
  readonly onTabKeydown: (event: KeyboardEvent, currentTab: AssetManagerTab) => void;
}

interface AssetManagerHelpState {
  readonly helpOpen: WritableSignal<boolean>;
  readonly openHelp: () => void;
  readonly closeHelp: () => void;
  readonly closeHelpFromEscape: (event: Event) => void;
}

interface AssetManagerConfirmationState {
  readonly confirming: WritableSignal<boolean>;
  readonly helpOpen: WritableSignal<boolean>;
  readonly closed: { emit: () => void };
  readonly cancelPreflight: () => void;
  readonly closeFromEscape: () => void;
}

interface AssetManagerJarValidationState {
  readonly jarValidationMessage: (error: unknown) => string;
}

interface AssetManagerNestedEscapeState {
  readonly closeDetailsFromEscape: (event: Event) => void;
  readonly closeDiagnosticsFromEscape: (event: Event) => void;
}

describe('AssetManagerDialogComponent nested Escape', () => {
  it.each(['details', 'diagnostics'] as const)(
    'closes only the %s overlay and stops Escape before it reaches the manager',
    (overlay) => {
      const state = Object.create(
        AssetManagerDialogComponent.prototype,
      ) as AssetManagerNestedEscapeState;
      const close = vi.fn();
      Object.defineProperty(state, overlay === 'details' ? 'closeDetails' : 'closeDiagnostics', {
        value: close,
      });
      const manager = document.createElement('div');
      const nested = document.createElement('div');
      const parentEscape = vi.fn();
      manager.addEventListener('keydown', parentEscape);
      nested.addEventListener('keydown', (event) =>
        overlay === 'details'
          ? state.closeDetailsFromEscape(event)
          : state.closeDiagnosticsFromEscape(event),
      );
      manager.append(nested);

      const escape = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });
      nested.dispatchEvent(escape);

      expect(escape.defaultPrevented).toBe(true);
      expect(parentEscape).not.toHaveBeenCalled();
      expect(close).toHaveBeenCalledOnce();
      expect(assetManagerTemplate).toContain(
        `(keydown.escape)="${overlay === 'details' ? 'closeDetailsFromEscape' : 'closeDiagnosticsFromEscape'}($event)"`,
      );
    },
  );
});

describe('AssetManagerDialogComponent file validation', () => {
  it('uses the same upload limit in the Vanilla JAR fallback message', () => {
    const state = Object.create(
      AssetManagerDialogComponent.prototype,
    ) as AssetManagerJarValidationState;
    Object.defineProperty(state, 'i18n', {
      value: {
        t: (key: string) => (key === 'assetManagerJarTooLarge' ? 'JAR limit: {maxMiB} MiB' : key),
      },
    });

    expect(state.jarValidationMessage(new JarUploadValidationError('jar-too-large'))).toBe(
      'JAR limit: 200 MiB',
    );
  });
});

describe('AssetManagerDialogComponent tabs', () => {
  it('keeps one tab stop and moves focus with arrow, Home, and End keys', () => {
    const state = Object.create(AssetManagerDialogComponent.prototype) as AssetManagerTabState;
    Object.defineProperty(state, 'tab', { value: signal<AssetManagerTab>('vanilla') });
    const tablist = document.createElement('div');
    tablist.setAttribute('role', 'tablist');
    const tabs = (['vanilla', 'mods'] as const).map((tab) => {
      const button = document.createElement('button');
      button.setAttribute('role', 'tab');
      button.addEventListener('keydown', (event) => state.onTabKeydown(event, tab));
      tablist.append(button);
      return button;
    });
    document.body.append(tablist);

    tabs[0].focus();
    const arrowRight = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      bubbles: true,
      cancelable: true,
    });
    tabs[0].dispatchEvent(arrowRight);

    expect(arrowRight.defaultPrevented).toBe(true);
    expect(state.tab()).toBe('mods');
    expect(document.activeElement).toBe(tabs[1]);
    expect(state.tabIndex('vanilla')).toBe(-1);
    expect(state.tabIndex('mods')).toBe(0);

    const wrapRight = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      bubbles: true,
      cancelable: true,
    });
    tabs[1].dispatchEvent(wrapRight);
    expect(state.tab()).toBe('vanilla');
    expect(document.activeElement).toBe(tabs[0]);

    const end = new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true });
    tabs[0].dispatchEvent(end);
    expect(state.tab()).toBe('mods');
    expect(document.activeElement).toBe(tabs[1]);

    const home = new KeyboardEvent('keydown', { key: 'Home', bubbles: true, cancelable: true });
    tabs[1].dispatchEvent(home);
    expect(state.tab()).toBe('vanilla');
    expect(document.activeElement).toBe(tabs[0]);

    const wrapLeft = new KeyboardEvent('keydown', {
      key: 'ArrowLeft',
      bubbles: true,
      cancelable: true,
    });
    tabs[0].dispatchEvent(wrapLeft);
    expect(state.tab()).toBe('mods');
    expect(document.activeElement).toBe(tabs[1]);
    tablist.remove();
  });
});

describe('AssetManagerDialogComponent help', () => {
  it('keeps help open when both focus and click request it', () => {
    const state = Object.create(AssetManagerDialogComponent.prototype) as AssetManagerHelpState;
    Object.defineProperty(state, 'helpOpen', { value: signal(false) });

    state.openHelp();
    state.openHelp();

    expect(state.helpOpen()).toBe(true);
    const escape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    state.closeHelpFromEscape(escape);
    expect(escape.defaultPrevented).toBe(true);
    expect(escape.cancelBubble).toBe(true);
    expect(state.helpOpen()).toBe(false);
  });
});

describe('AssetManagerDialogComponent nested confirmation', () => {
  it('keeps the manager open while a confirmation owns Escape', () => {
    const state = Object.create(
      AssetManagerDialogComponent.prototype,
    ) as AssetManagerConfirmationState;
    const emit = vi.fn();
    const cancelPreflight = vi.fn();
    Object.defineProperties(state, {
      confirming: { value: signal(true) },
      helpOpen: { value: signal(false) },
      closed: { value: { emit } },
      cancelPreflight: { value: cancelPreflight },
    });

    state.closeFromEscape();

    expect(cancelPreflight).not.toHaveBeenCalled();
    expect(emit).not.toHaveBeenCalled();
  });
});

describe('AssetManagerDialogComponent progress announcements', () => {
  it('announces operation phases without making high-frequency progress a live region', () => {
    const openingTag = (className: string) =>
      assetManagerTemplate.match(new RegExp(`<[^>]*class="${className}"[^>]*>`, 's'))?.[0] ?? '';

    expect(openingTag('active-task-label')).toContain('role="status"');
    expect(openingTag('active-task-panel')).not.toContain('aria-live');
    expect(openingTag('preflight-card')).not.toContain('aria-live');
    expect(openingTag('import-progress compact')).not.toContain('aria-live');
  });
});

describe('AssetManagerDialogComponent empty states', () => {
  it('explains the initial mod library while keeping search misses concise', () => {
    expect(assetManagerTemplate).toContain('} @else if (modSearch()) {');
    expect(assetManagerTemplate).toContain('class="mods-empty-state"');
    expect(assetManagerTemplate).toContain("i18n.t('assetManagerModHint')");
    expect(assetManagerTemplate).toContain("i18n.t('assetManagerNoModMatches')");
  });
});

describe('AssetManagerDialogComponent mod icons', () => {
  it('keeps preflight and imported icons decorative beside their mod names', () => {
    const iconBlocks = [
      ...assetManagerTemplate.matchAll(/<div class="mod-icon">([\s\S]*?)<\/div>/g),
    ]
      .map(([, contents]) => contents)
      .filter((contents) => contents.includes('<img'));

    expect(iconBlocks).toHaveLength(2);
    expect(iconBlocks.every((contents) => contents.includes('alt=""'))).toBe(true);
  });
});
