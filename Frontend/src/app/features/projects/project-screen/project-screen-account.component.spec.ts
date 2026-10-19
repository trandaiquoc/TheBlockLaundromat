import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { TranslationKey } from '../../../core/ui/localization/translation-catalogs';
import { I18nService } from '../../../core/ui/localization/i18n.service';
import { ProjectScreenAccountComponent } from './project-screen-account.component';

const translations: Partial<Record<TranslationKey, string>> = {
  accountMenu: 'Account menu',
  freePlan: 'Free Plan',
  guest: 'Guest',
  logOut: 'Log out',
  localGuestMode: 'Local guest mode',
  localProjectsDescription: 'Your projects stay in this browser.',
};

describe('ProjectScreenAccountComponent', () => {
  afterEach(() => localStorage.removeItem('the-block-laundromat.ui-preferences'));

  it('opens the demo account menu and supports Escape with focus restoration', async () => {
    const fixture = await createFixture();
    const host = fixture.nativeElement as HTMLElement;
    const trigger = host.querySelector('.account-card') as HTMLButtonElement;

    expect(trigger.getAttribute('aria-label')).toContain('rakoon, Free Plan');
    expect(host.querySelector('.account-avatar')).not.toBeNull();

    trigger.click();
    await settle(fixture);

    const menu = host.querySelector('[role="menu"]') as HTMLElement;
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(menu.textContent).toContain('rakoon');
    expect(menu.textContent).toContain('Free Plan');
    expect(menu.querySelector('[role="separator"]')).not.toBeNull();
    expect(menu.querySelector('[role="menuitem"]')?.textContent).toContain('Log out');
    expect(document.activeElement).toBe(menu.querySelector('[role="menuitem"]'));

    (menu.querySelector('[role="menuitem"]') as HTMLButtonElement).dispatchEvent(
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
    const trigger = host.querySelector('.account-card') as HTMLButtonElement;
    trigger.click();
    await settle(fixture);

    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    fixture.detectChanges();

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    fixture.destroy();
  });

  it('logs out to a local Guest presentation without changing browser preferences', async () => {
    localStorage.setItem('the-block-laundromat.ui-preferences', 'test-preferences');
    const fixture = await createFixture();
    const host = fixture.nativeElement as HTMLElement;
    const trigger = host.querySelector('.account-card') as HTMLButtonElement;
    trigger.click();
    await settle(fixture);

    (host.querySelector('[role="menuitem"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(trigger.getAttribute('aria-label')).toContain('Guest, Local guest mode');
    expect(host.querySelector('[role="dialog"]')?.textContent).toContain(
      'Your projects stay in this browser.',
    );
    expect(host.querySelector('[role="menuitem"]')).toBeNull();
    expect(localStorage.getItem('the-block-laundromat.ui-preferences')).toBe('test-preferences');
    fixture.destroy();
  });

  it('closes on Tab and keeps menu arrows within its only action', async () => {
    const fixture = await createFixture();
    const host = fixture.nativeElement as HTMLElement;
    const trigger = host.querySelector('.account-card') as HTMLButtonElement;
    trigger.click();
    await settle(fixture);
    const logout = host.querySelector('[role="menuitem"]') as HTMLButtonElement;

    logout.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(document.activeElement).toBe(logout);
    logout.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    fixture.detectChanges();

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    fixture.destroy();
  });
});

async function createFixture() {
  TestBed.configureTestingModule({
    imports: [ProjectScreenAccountComponent],
    providers: [
      {
        provide: I18nService,
        useValue: { t: (key: TranslationKey) => translations[key] ?? key },
      },
    ],
  });
  await TestBed.compileComponents();
  const fixture = TestBed.createComponent(ProjectScreenAccountComponent);
  fixture.detectChanges();
  return fixture;
}

async function settle(fixture: Awaited<ReturnType<typeof createFixture>>): Promise<void> {
  await new Promise<void>((resolve) => queueMicrotask(resolve));
  await fixture.whenStable();
  fixture.detectChanges();
}
