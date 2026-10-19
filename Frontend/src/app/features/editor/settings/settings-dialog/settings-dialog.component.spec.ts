import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ContentAssetRuntimeService } from '../../../../core/assets/content-asset-runtime.service';
import {
  REALITY_SKY_BACKGROUND_COLORS,
  REALITY_SKY_PRESETS,
} from '../../../../core/editor/appearance/editor-background-contract';
import { UiPreferencesService } from '../../../../core/ui/preferences/ui-preferences.service';
import { DialogService } from '../../../../core/ui/dialog/dialog.service';
import { SettingsDialogComponent } from './settings-dialog.component';
import { SettingsDialogSession } from './settings-dialog-session';

interface SettingsAppearanceView {
  setSection(section: 'appearance'): void;
  appearanceTab: { set(value: 'interface' | 'workspace-background'): void };
  setEditorBackground(mode: 'dark' | 'light' | 'reality'): void;
  setRealitySkyPreset(preset: 'overworld-day' | 'overworld-night' | 'nether' | 'end'): void;
  groundOptions(): readonly {
    id: string;
    availability: string;
    previewUrl: string | undefined;
  }[];
}

describe('SettingsDialogComponent Reality previews', () => {
  afterEach(() => localStorage.removeItem('the-block-laundromat.ui-preferences'));

  it('marks the current Settings section as the dialog initial focus target', async () => {
    localStorage.removeItem('the-block-laundromat.ui-preferences');
    await TestBed.configureTestingModule({
      imports: [SettingsDialogComponent],
      providers: [
        {
          provide: ContentAssetRuntimeService,
          useValue: {
            generation: signal(0),
            resourceAvailabilitySettled: signal(true),
            sources: { resources: { textureUrl: () => undefined } },
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(SettingsDialogComponent);
    fixture.detectChanges();
    const currentSection = fixture.nativeElement.querySelector(
      '.settings-nav button[aria-current="page"]',
    );
    const cancel = fixture.nativeElement.querySelector('.settings-close');
    expect(currentSection.hasAttribute('cdkfocusinitial')).toBe(true);
    expect(cancel.hasAttribute('cdkfocusinitial')).toBe(false);
    expect(fixture.nativeElement.querySelector('.settings-dialog').hasAttribute('autofocus')).toBe(
      false,
    );

    fixture.destroy();
  });

  it('groups sections and reports the existing draft state in the footer', async () => {
    localStorage.removeItem('the-block-laundromat.ui-preferences');
    await TestBed.configureTestingModule({
      imports: [SettingsDialogComponent],
      providers: [
        {
          provide: ContentAssetRuntimeService,
          useValue: {
            generation: signal(0),
            resourceAvailabilitySettled: signal(true),
            sources: { resources: { textureUrl: () => undefined } },
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(SettingsDialogComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(
      [...root.querySelectorAll('.settings-nav-group-label')].map((node) =>
        node.textContent?.trim(),
      ),
    ).toEqual(['Workspace', 'Input', 'Accessibility']);
    expect(root.querySelector('.settings-save-status')?.textContent).toContain('All changes saved');

    const setting = root.querySelector('input[type="checkbox"]') as HTMLInputElement;
    setting.checked = !setting.checked;
    setting.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();

    expect(root.querySelector('.settings-save-status')?.textContent).toContain('Unapplied changes');
    expect(TestBed.inject(UiPreferencesService).preferences().autoUseHugeStructureBlocks).not.toBe(
      setting.checked,
    );
    fixture.destroy();
  });

  it('changes sections through the compact selector used on narrow screens', async () => {
    localStorage.removeItem('the-block-laundromat.ui-preferences');
    await TestBed.configureTestingModule({
      imports: [SettingsDialogComponent],
      providers: [
        {
          provide: ContentAssetRuntimeService,
          useValue: {
            generation: signal(0),
            resourceAvailabilitySettled: signal(true),
            sources: { resources: { textureUrl: () => undefined } },
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(SettingsDialogComponent);
    fixture.detectChanges();
    const selector = fixture.nativeElement.querySelector(
      '.settings-nav-select',
    ) as HTMLSelectElement;
    selector.value = 'shortcuts';
    selector.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();

    expect(selector.value).toBe('shortcuts');
    expect(fixture.nativeElement.querySelector('.settings-content h3')?.textContent).toContain(
      'Shortcuts',
    );
    fixture.destroy();
  });

  it('keeps the selected section visible in the horizontally scrolling navigation', async () => {
    localStorage.removeItem('the-block-laundromat.ui-preferences');
    await TestBed.configureTestingModule({
      imports: [SettingsDialogComponent],
      providers: [
        {
          provide: ContentAssetRuntimeService,
          useValue: {
            generation: signal(0),
            resourceAvailabilitySettled: signal(true),
            sources: { resources: { textureUrl: () => undefined } },
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(SettingsDialogComponent);
    fixture.detectChanges();
    const lastSection = fixture.nativeElement.querySelector(
      '.settings-nav button:last-child',
    ) as HTMLButtonElement;
    const scrollIntoView = vi.fn();
    lastSection.scrollIntoView = scrollIntoView;

    lastSection.click();
    fixture.detectChanges();

    expect(lastSection.getAttribute('aria-current')).toBe('page');
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest', inline: 'nearest' });

    fixture.destroy();
  });

  it('shows Reality controls while Dark is applied and separates saved preferences from a draft', async () => {
    localStorage.removeItem('the-block-laundromat.ui-preferences');
    await TestBed.configureTestingModule({
      imports: [SettingsDialogComponent],
      providers: [
        {
          provide: ContentAssetRuntimeService,
          useValue: {
            generation: signal(0),
            resourceAvailabilitySettled: signal(true),
            sources: { resources: { textureUrl: () => undefined } },
          },
        },
      ],
    }).compileComponents();

    const preferences = TestBed.inject(UiPreferencesService);
    const fixture = TestBed.createComponent(SettingsDialogComponent);
    const component = fixture.componentInstance as unknown as SettingsAppearanceView;
    component.setSection('appearance');
    component.appearanceTab.set('workspace-background');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.reality-settings')).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector('.reality-ground-grid .selected')?.textContent,
    ).toContain('Plains grass');
    expect(
      fixture.nativeElement.querySelector('.reality-sky-grid .selected')?.textContent,
    ).toContain('Overworld day');
    expect(
      fixture.nativeElement.querySelector('.workspace-background-status').textContent,
    ).toContain('Applied and saved: Dark workspace');
    expect(
      fixture.nativeElement.querySelector('.workspace-background-status').textContent,
    ).toContain('Draft matches the applied settings.');
    expect(preferences.preferences().appearance).toMatchObject({
      editorBackground: 'dark',
      reality: { groundPreset: 'plains-grass', skyPreset: 'overworld-day' },
    });

    component.setEditorBackground('reality');
    component.setRealitySkyPreset('overworld-night');
    fixture.detectChanges();
    const status = fixture.nativeElement.querySelector('.workspace-background-status').textContent;
    expect(status).toContain('Applied and saved: Dark workspace');
    expect(status).toContain('Draft: Reality');
    expect(status).toContain('Overworld night');
    expect(status).toContain('This draft is not applied');
    expect(preferences.preferences().appearance).toMatchObject({
      editorBackground: 'dark',
      reality: { groundPreset: 'plains-grass', skyPreset: 'overworld-day' },
    });

    const session = fixture.debugElement.injector.get(SettingsDialogSession);
    expect(session.apply()).toBe(true);
    fixture.detectChanges();
    expect(preferences.preferences().appearance).toMatchObject({
      editorBackground: 'reality',
      reality: { groundPreset: 'plains-grass', skyPreset: 'overworld-night' },
    });
    expect(
      fixture.nativeElement.querySelector('.workspace-background-status').textContent,
    ).toContain('Applied and saved: Reality');
    expect(
      fixture.nativeElement.querySelector('.workspace-background-status').textContent,
    ).toContain('Draft matches the applied settings.');

    const confirm = vi.spyOn(TestBed.inject(DialogService), 'confirm').mockResolvedValue(true);
    component.setEditorBackground('dark');
    component.setRealitySkyPreset('end');
    fixture.detectChanges();
    (
      fixture.nativeElement.querySelector('.settings-dialog-footer .secondary') as HTMLButtonElement
    ).click();
    await fixture.whenStable();
    expect(confirm).toHaveBeenCalledOnce();
    expect(preferences.preferences().appearance).toMatchObject({
      editorBackground: 'reality',
      reality: { groundPreset: 'plains-grass', skyPreset: 'overworld-night' },
    });
    fixture.destroy();
  });

  it('uses one Appearance tab stop and supports arrow, Home, and End navigation', async () => {
    localStorage.removeItem('the-block-laundromat.ui-preferences');
    await TestBed.configureTestingModule({
      imports: [SettingsDialogComponent],
      providers: [
        {
          provide: ContentAssetRuntimeService,
          useValue: {
            generation: signal(0),
            resourceAvailabilitySettled: signal(true),
            sources: { resources: { textureUrl: () => undefined } },
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(SettingsDialogComponent);
    const component = fixture.componentInstance as unknown as {
      setSection(section: 'appearance'): void;
    };
    component.setSection('appearance');
    fixture.detectChanges();

    const tabs = Array.from(
      fixture.nativeElement.querySelectorAll('.appearance-tabs [role="tab"]'),
    ) as HTMLButtonElement[];
    expect(tabs.map((tab) => tab.tabIndex)).toEqual([0, -1]);

    const press = (tab: HTMLButtonElement, key: string): void => {
      tab.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
      fixture.detectChanges();
    };
    const expectSelectedTab = (index: number): void => {
      expect(tabs.map((tab) => tab.getAttribute('aria-selected'))).toEqual(
        tabs.map((_, tabIndex) => String(tabIndex === index)),
      );
      expect(tabs.map((tab) => tab.tabIndex)).toEqual(
        tabs.map((_, tabIndex) => (tabIndex === index ? 0 : -1)),
      );
      expect(document.activeElement).toBe(tabs[index]);
      expect(
        fixture.nativeElement.querySelector(
          index === 0 ? '#appearance-interface-panel' : '#appearance-workspace-background-panel',
        ),
      ).toBeTruthy();
    };

    tabs[0].focus();
    press(tabs[0], 'ArrowRight');
    expectSelectedTab(1);
    press(tabs[1], 'ArrowRight');
    expectSelectedTab(0);
    press(tabs[0], 'ArrowLeft');
    expectSelectedTab(1);
    press(tabs[1], 'Home');
    expectSelectedTab(0);
    press(tabs[0], 'End');
    expectSelectedTab(1);

    fixture.destroy();
  });

  it('uses one shortcut tab stop and supports arrow, Home, and End navigation', async () => {
    localStorage.removeItem('the-block-laundromat.ui-preferences');
    await TestBed.configureTestingModule({
      imports: [SettingsDialogComponent],
      providers: [
        {
          provide: ContentAssetRuntimeService,
          useValue: {
            generation: signal(0),
            resourceAvailabilitySettled: signal(true),
            sources: { resources: { textureUrl: () => undefined } },
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(SettingsDialogComponent);
    const component = fixture.componentInstance as unknown as {
      setSection(section: 'shortcuts'): void;
    };
    component.setSection('shortcuts');
    fixture.detectChanges();

    const tabs = Array.from(
      fixture.nativeElement.querySelectorAll('.shortcut-tabs [role="tab"]'),
    ) as HTMLButtonElement[];
    expect(tabs.map((tab) => tab.tabIndex)).toEqual([0, -1]);

    const press = (tab: HTMLButtonElement, key: string): void => {
      tab.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
      fixture.detectChanges();
    };
    const expectSelectedTab = (index: number): void => {
      expect(tabs.map((tab) => tab.getAttribute('aria-selected'))).toEqual(
        tabs.map((_, tabIndex) => String(tabIndex === index)),
      );
      expect(tabs.map((tab) => tab.tabIndex)).toEqual(
        tabs.map((_, tabIndex) => (tabIndex === index ? 0 : -1)),
      );
      expect(document.activeElement).toBe(tabs[index]);
      const panelId = index === 0 ? 'shortcut-panel-keyboard' : 'shortcut-panel-mouse';
      expect(
        fixture.nativeElement.querySelector(`#${panelId}`)?.getAttribute('aria-labelledby'),
      ).toBe(tabs[index].id);
    };

    tabs[0].focus();
    press(tabs[0], 'ArrowRight');
    expectSelectedTab(1);
    press(tabs[1], 'ArrowRight');
    expectSelectedTab(0);
    press(tabs[0], 'ArrowLeft');
    expectSelectedTab(1);
    press(tabs[1], 'Home');
    expectSelectedTab(0);
    press(tabs[0], 'End');
    expectSelectedTab(1);

    fixture.destroy();
  });

  it('uses actual ground resources, availability state, and the renderer sky palette', async () => {
    localStorage.removeItem('the-block-laundromat.ui-preferences');
    const generation = signal(0);
    const resourceAvailabilitySettled = signal(false);
    let sandTextureUrl: string | undefined;
    const assetRuntime = {
      generation,
      resourceAvailabilitySettled,
      sources: {
        resources: {
          textureUrl: (resource: string) =>
            resource === 'minecraft:block/sand' ? sandTextureUrl : undefined,
        },
      },
    };
    await TestBed.configureTestingModule({
      imports: [SettingsDialogComponent],
      providers: [{ provide: ContentAssetRuntimeService, useValue: assetRuntime }],
    }).compileComponents();

    const preferences = TestBed.inject(UiPreferencesService);
    preferences.setAppearance({
      editorBackground: 'reality',
      reality: { groundPreset: 'sand', skyPreset: 'nether' },
    });
    const fixture = TestBed.createComponent(SettingsDialogComponent);
    const component = fixture.componentInstance as unknown as SettingsAppearanceView;
    component.setSection('appearance');
    fixture.detectChanges();
    const appearanceTabs = fixture.nativeElement.querySelectorAll(
      '.appearance-tabs [role="tab"]',
    ) as NodeListOf<HTMLButtonElement>;
    expect(appearanceTabs).toHaveLength(2);
    expect(appearanceTabs[0].getAttribute('aria-selected')).toBe('true');
    expect(fixture.nativeElement.querySelector('#appearance-interface-panel')).toBeTruthy();
    appearanceTabs[1].click();
    fixture.detectChanges();
    expect(appearanceTabs[1].getAttribute('aria-selected')).toBe('true');
    expect(
      fixture.nativeElement.querySelector('#appearance-workspace-background-panel'),
    ).toBeTruthy();

    expect(component.groundOptions().find(({ id }) => id === 'sand')).toMatchObject({
      availability: 'loading',
      previewUrl: undefined,
    });
    const skyPreviews = Array.from(
      fixture.nativeElement.querySelectorAll('.sky-preview') as NodeListOf<HTMLElement>,
    );
    expect(skyPreviews).toHaveLength(REALITY_SKY_PRESETS.length);
    expect(
      skyPreviews.map((preview) => preview.style.getPropertyValue('--reality-sky-background')),
    ).toEqual(REALITY_SKY_PRESETS.map((preset) => REALITY_SKY_BACKGROUND_COLORS[preset]));
    expect(
      fixture.nativeElement
        .querySelector('.reality-sky-grid .selected')
        ?.getAttribute('aria-pressed'),
    ).toBe('true');

    sandTextureUrl = 'blob:sand-texture';
    resourceAvailabilitySettled.set(true);
    generation.set(1);
    fixture.detectChanges();
    const sandOption = fixture.nativeElement.querySelector(
      '.reality-ground-grid .selected',
    ) as HTMLButtonElement;
    expect(sandOption.disabled).toBe(false);
    expect(sandOption.querySelector('img')?.getAttribute('src')).toBe('blob:sand-texture');

    sandOption.querySelector('img')?.dispatchEvent(new Event('error'));
    fixture.detectChanges();
    const unavailableSand = fixture.nativeElement.querySelector(
      '.reality-ground-grid .selected',
    ) as HTMLButtonElement;
    expect(unavailableSand.disabled).toBe(true);
    expect(unavailableSand.classList.contains('unavailable')).toBe(true);
    expect(unavailableSand.querySelector('small')).toBeTruthy();

    fixture.destroy();
  });

  it('renders independent Appearance resets and keeps each operation in the draft', async () => {
    localStorage.removeItem('the-block-laundromat.ui-preferences');
    await TestBed.configureTestingModule({
      imports: [SettingsDialogComponent],
      providers: [
        {
          provide: ContentAssetRuntimeService,
          useValue: {
            generation: signal(0),
            resourceAvailabilitySettled: signal(true),
            sources: { resources: { textureUrl: () => undefined } },
          },
        },
      ],
    }).compileComponents();

    const preferences = TestBed.inject(UiPreferencesService);
    preferences.setAppearance({
      preset: 'raccoon',
      font: 'pangolin',
      fontSize: 'large',
      editorBackground: 'reality',
      reality: { groundPreset: 'snow', skyPreset: 'nether' },
    });
    const fixture = TestBed.createComponent(SettingsDialogComponent);
    const closed = vi.fn();
    fixture.componentInstance.closed.subscribe(closed);
    fixture.detectChanges();
    const component = fixture.componentInstance as unknown as {
      setSection(section: 'appearance'): void;
      appearanceTab: { set(value: 'interface' | 'workspace-background'): void };
    };
    const session = fixture.debugElement.injector.get(SettingsDialogSession);
    component.setSection('appearance');
    fixture.detectChanges();

    const reset = (index: number) => {
      const buttons = fixture.nativeElement.querySelectorAll(
        '.appearance-settings-pane .section-reset',
      ) as NodeListOf<HTMLButtonElement>;
      expect(buttons).toHaveLength(1);
      buttons[index]?.click();
      fixture.detectChanges();
    };

    reset(0);
    expect(session.draft().appearance).toMatchObject({
      preset: 'craft',
      font: 'comfortaa',
      fontSize: 'normal',
      editorBackground: 'reality',
      reality: { groundPreset: 'snow', skyPreset: 'nether' },
    });
    expect(preferences.preferences().appearance.preset).toBe('raccoon');

    component.appearanceTab.set('workspace-background');
    fixture.detectChanges();
    reset(0);
    expect(session.draft().appearance).toMatchObject({
      preset: 'craft',
      font: 'comfortaa',
      fontSize: 'normal',
      editorBackground: 'dark',
      reality: { groundPreset: 'plains-grass', skyPreset: 'overworld-day' },
    });
    expect(preferences.preferences().appearance.editorBackground).toBe('reality');
    const saveAndClose = fixture.nativeElement.querySelector(
      '.settings-dialog-footer .primary',
    ) as HTMLButtonElement;
    saveAndClose.click();
    fixture.detectChanges();
    expect(closed).toHaveBeenCalledOnce();
    expect(preferences.preferences().appearance).toMatchObject({
      preset: 'craft',
      font: 'comfortaa',
      fontSize: 'normal',
      editorBackground: 'dark',
      reality: { groundPreset: 'plains-grass', skyPreset: 'overworld-day' },
    });
    fixture.destroy();
  });
});
