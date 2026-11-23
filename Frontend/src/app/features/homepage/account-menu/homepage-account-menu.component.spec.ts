import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { TranslationKey } from '../../../core/ui/localization/translation-catalogs';
import { I18nService } from '../../../core/ui/localization/i18n.service';
import { HomepageAccountMenuComponent } from './homepage-account-menu.component';

const translations: Partial<Record<TranslationKey, string>> = {
  accountMenu: 'Account menu',
  freePlan: 'Free Plan',
  guest: 'Guest',
  homepageAppearance: 'Homepage appearance',
  homepageModeDiorama: 'Diorama homepage',
  homepageModeSimple: 'Simple project manager',
  localGuestMode: 'Local guest mode',
  localProjectsDescription: 'Your projects stay in this browser.',
  logOut: 'Log out',
  settingsMenu: 'Settings',
};

describe('HomepageAccountMenuComponent', () => {
  afterEach(() => localStorage.removeItem('the-block-laundromat.ui-preferences'));

  it('opens the shared account menu and supports Escape with focus restoration', async () => {
    const fixture = await createFixture();
    const host = fixture.nativeElement as HTMLElement;
    const trigger = host.querySelector('.homepage-account-trigger') as HTMLButtonElement;

    expect(trigger.getAttribute('aria-label')).toContain('rakoon, Free Plan');
    expect(host.querySelector('.homepage-account-avatar')).not.toBeNull();
    trigger.click();
    await settle(fixture);

    const menu = host.querySelector('[role="menu"]') as HTMLElement;
    const selectedMode = menu.querySelector('[aria-checked="true"]') as HTMLButtonElement;
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(menu.textContent).toContain('rakoon');
    expect(menu.textContent).toContain('Free Plan');
    expect(menu.querySelector('[role="separator"]')).not.toBeNull();
    expect(selectedMode.textContent).toContain('Diorama homepage');
    expect(document.activeElement).toBe(selectedMode);
    expect(host.querySelector('[data-locale]')).toBeNull();

    selectedMode.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(trigger);
    fixture.destroy();
  });

  it('closes the menu when a pointer lands outside the account component', async () => {
    const fixture = await createFixture();
    const host = fixture.nativeElement as HTMLElement;
    const trigger = host.querySelector('.homepage-account-trigger') as HTMLButtonElement;
    trigger.click();
    await settle(fixture);

    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    fixture.detectChanges();

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    fixture.destroy();
  });

  it('emits Homepage appearance changes immediately and leaves language in Settings', async () => {
    const fixture = await createFixture();
    const host = fixture.nativeElement as HTMLElement;
    const trigger = host.querySelector('.homepage-account-trigger') as HTMLButtonElement;
    const modeRequested = vi.fn();
    const settingsRequested = vi.fn();
    fixture.componentInstance.homepageModeRequested.subscribe(modeRequested);
    fixture.componentInstance.settingsRequested.subscribe(settingsRequested);
    trigger.click();
    await settle(fixture);

    (host.querySelector('[data-homepage-mode="simple"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(modeRequested).toHaveBeenCalledWith('simple');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    trigger.click();
    await settle(fixture);
    (
      host.querySelector(
        '[role="menuitem"].homepage-account-menu-action--settings',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    expect(settingsRequested).toHaveBeenCalledOnce();
    expect(host.textContent).not.toContain('Language');
    fixture.destroy();
  });

  it('logs out to a local Guest presentation without changing browser preferences', async () => {
    localStorage.setItem('the-block-laundromat.ui-preferences', 'test-preferences');
    const fixture = await createFixture();
    const host = fixture.nativeElement as HTMLElement;
    const trigger = host.querySelector('.homepage-account-trigger') as HTMLButtonElement;
    trigger.click();
    await settle(fixture);

    (host.querySelector('.homepage-account-menu-action--logout') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(trigger.getAttribute('aria-label')).toContain('Guest, Local guest mode');
    expect(host.querySelector('[role="menu"]')?.textContent).toContain(
      'Your projects stay in this browser.',
    );
    expect(host.querySelector('.homepage-account-menu-action--logout')).toBeNull();
    expect(localStorage.getItem('the-block-laundromat.ui-preferences')).toBe('test-preferences');
    fixture.destroy();
  });

  it('moves focus through menu actions with arrows and closes on Tab', async () => {
    const fixture = await createFixture();
    const host = fixture.nativeElement as HTMLElement;
    const trigger = host.querySelector('.homepage-account-trigger') as HTMLButtonElement;
    trigger.click();
    await settle(fixture);

    const diorama = host.querySelector('[data-homepage-mode="diorama"]') as HTMLButtonElement;
    const simple = host.querySelector('[data-homepage-mode="simple"]') as HTMLButtonElement;
    diorama.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
    );
    expect(document.activeElement).toBe(simple);
    simple.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true }),
    );
    const logout = host.querySelector('.homepage-account-menu-action--logout') as HTMLButtonElement;
    expect(document.activeElement).toBe(logout);
    logout.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    fixture.detectChanges();

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    fixture.destroy();
  });
});

async function createFixture() {
  TestBed.configureTestingModule({
    imports: [HomepageAccountMenuComponent],
    providers: [
      {
        provide: I18nService,
        useValue: { t: (key: TranslationKey) => translations[key] ?? key },
      },
    ],
  });
  await TestBed.compileComponents();
  const fixture = TestBed.createComponent(HomepageAccountMenuComponent);
  fixture.componentRef.setInput('selectedMode', 'diorama');
  fixture.detectChanges();
  return fixture;
}

async function settle(fixture: Awaited<ReturnType<typeof createFixture>>): Promise<void> {
  await new Promise<void>((resolve) => queueMicrotask(resolve));
  await fixture.whenStable();
  fixture.detectChanges();
}
