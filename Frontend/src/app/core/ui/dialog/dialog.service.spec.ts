import { OverlayModule, OverlayContainer } from '@angular/cdk/overlay';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { I18nService } from '../localization/i18n.service';
import { DialogService } from './dialog.service';
import { UiAlertDialogComponent } from '../../../shared/ui/dialog/ui-alert-dialog.component';

function completeDialogExit(overlayContainer: OverlayContainer): void {
  const surface = overlayContainer
    .getContainerElement()
    .querySelector<HTMLElement>('.ui-dialog-overlay-pane.workspace-dialog-exit');
  surface?.dispatchEvent(new Event('animationend'));
}

async function settleDialogFocus(): Promise<void> {
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );
}

describe('DialogService', () => {
  let service: DialogService;
  let overlayContainer: OverlayContainer;
  let i18n: I18nService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OverlayModule, UiAlertDialogComponent],
      providers: [DialogService],
    }).compileComponents();
    service = TestBed.inject(DialogService);
    overlayContainer = TestBed.inject(OverlayContainer);
    i18n = TestBed.inject(I18nService);
  });

  afterEach(() => {
    i18n.setLocale('en');
    overlayContainer.getContainerElement().replaceChildren();
  });

  it('localizes default actions and close name, describes the message and restores focus', async () => {
    i18n.setLocale('vi');
    const opener = document.createElement('button');
    document.body.append(opener);
    opener.focus();

    const confirmation = service.confirm({ title: 'Xác nhận', text: 'Mô tả' });
    await Promise.resolve();
    const pane = overlayContainer
      .getContainerElement()
      .querySelector('.ui-alert-dialog') as HTMLElement;
    const message = pane.querySelector('.ui-alert-dialog__text') as HTMLElement;
    expect(pane.getAttribute('aria-describedby')).toBe(message.id);
    expect(pane.querySelector('.ui-close-button')?.getAttribute('aria-label')).toBe('Đóng');
    expect(
      [...pane.querySelectorAll('.ui-alert-dialog__actions button')].map((button) =>
        button.textContent?.trim(),
      ),
    ).toEqual(['Hủy', 'Xác nhận']);

    (pane.querySelector('.ui-close-button') as HTMLButtonElement).click();
    completeDialogExit(overlayContainer);
    await expect(confirmation).resolves.toBe(false);
    expect(document.activeElement).toBe(opener);

    const notice = service.info('Thông tin');
    await Promise.resolve();
    const noticeButton = overlayContainer
      .getContainerElement()
      .querySelector('.ui-alert-dialog__actions .ui-button') as HTMLButtonElement;
    expect(noticeButton.textContent?.trim()).toBe('Đồng ý');
    noticeButton.click();
    completeDialogExit(overlayContainer);
    await expect(notice).resolves.toBe(true);
    opener.remove();
  });

  it('resolves confirm with true and applies destructive styling', async () => {
    const result = service.confirm({
      title: 'Delete',
      confirmButtonText: 'Delete',
      destructive: true,
    });
    await Promise.resolve();
    const dialogHost = overlayContainer
      .getContainerElement()
      .querySelector('.ui-dialog-overlay-pane app-ui-alert-dialog') as HTMLElement;
    expect(dialogHost.classList.contains('workspace-dialog-enter')).toBe(true);
    const pane = overlayContainer
      .getContainerElement()
      .querySelector('.ui-alert-dialog') as HTMLElement;
    expect(pane.querySelector('.ui-button--danger')).toBeTruthy();
    (
      Array.from(pane.querySelectorAll('button')).find((button) =>
        button.textContent?.includes('Delete'),
      ) as HTMLButtonElement
    ).click();
    expect(dialogHost.classList.contains('workspace-dialog-exit')).toBe(true);
    completeDialogExit(overlayContainer);
    await expect(result).resolves.toBe(true);
  });

  it('resolves cancel and Escape as false', async () => {
    const cancelled = service.confirm({
      title: 'Confirm',
      confirmButtonText: 'OK',
      cancelButtonText: 'Cancel',
    });
    await Promise.resolve();
    const pane = overlayContainer
      .getContainerElement()
      .querySelector('.ui-alert-dialog') as HTMLElement;
    (
      Array.from(pane.querySelectorAll('button')).find((button) =>
        button.textContent?.includes('Cancel'),
      ) as HTMLButtonElement
    ).click();
    completeDialogExit(overlayContainer);
    await expect(cancelled).resolves.toBe(false);

    const escaped = service.confirm({ title: 'Confirm' });
    await Promise.resolve();
    overlayContainer
      .getContainerElement()
      .querySelector('.ui-alert-dialog')
      ?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    completeDialogExit(overlayContainer);
    await expect(escaped).resolves.toBe(false);
  });

  it('keeps an alert open when the modal backdrop is clicked', async () => {
    let settled = false;
    const pending = service.confirm({ title: 'Confirm', confirmButtonText: 'OK' }).then(() => {
      settled = true;
    });
    await Promise.resolve();
    (
      overlayContainer.getContainerElement().querySelector('.cdk-overlay-backdrop') as HTMLElement
    ).click();
    await Promise.resolve();
    expect(settled).toBe(false);
    (
      overlayContainer
        .getContainerElement()
        .querySelector('.ui-alert-dialog .ui-button') as HTMLButtonElement
    ).click();
    completeDialogExit(overlayContainer);
    await expect(pending).resolves.toBeUndefined();
  });

  it('focuses nested dialogs and returns Escape to the top overlay only', async () => {
    const parent = service.confirm({ title: 'Parent' });
    await Promise.resolve();
    await settleDialogFocus();
    const parentClose = overlayContainer
      .getContainerElement()
      .querySelector('.ui-alert-dialog .ui-close-button') as HTMLButtonElement;
    expect(document.activeElement).toBe(parentClose);

    const nested = service.confirm({ title: 'Nested' });
    await Promise.resolve();
    await settleDialogFocus();
    const dialogs = overlayContainer.getContainerElement().querySelectorAll('.ui-alert-dialog');
    expect(dialogs).toHaveLength(2);
    const nestedClose = dialogs[1].querySelector('.ui-close-button') as HTMLButtonElement;
    expect(document.activeElement).toBe(nestedClose);

    let documentEscapeBubbles = false;
    const onDocumentEscape = (): void => {
      documentEscapeBubbles = true;
    };
    document.addEventListener('keydown', onDocumentEscape);
    nestedClose.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
    document.removeEventListener('keydown', onDocumentEscape);
    expect(documentEscapeBubbles).toBe(false);
    completeDialogExit(overlayContainer);
    await expect(nested).resolves.toBe(false);
    expect(
      overlayContainer.getContainerElement().querySelectorAll('.ui-alert-dialog'),
    ).toHaveLength(1);
    expect(document.activeElement).toBe(parentClose);

    parentClose.click();
    completeDialogExit(overlayContainer);
    await expect(parent).resolves.toBe(false);
  });

  it('disposes the overlay if the exit animation event does not arrive', async () => {
    vi.useFakeTimers();
    try {
      const result = service.info('Saved');
      await Promise.resolve();
      const host = overlayContainer
        .getContainerElement()
        .querySelector('.ui-dialog-overlay-pane app-ui-alert-dialog') as HTMLElement;
      (host.querySelector('.ui-button') as HTMLButtonElement).click();

      await vi.advanceTimersByTimeAsync(180);

      await expect(result).resolves.toBe(true);
      expect(
        overlayContainer.getContainerElement().querySelector('app-ui-alert-dialog'),
      ).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('resolves a typed choice and uses undefined for Escape', async () => {
    const result = service.choice({
      title: 'Choose',
      options: [
        { id: 'resize', label: 'Resize', value: 'resize', kind: 'primary' },
        { id: 'keep', label: 'Keep', value: 'keep', kind: 'secondary' },
      ] as const,
    });
    await Promise.resolve();
    const pane = overlayContainer
      .getContainerElement()
      .querySelector('.ui-alert-dialog') as HTMLElement;
    (
      Array.from(pane.querySelectorAll('button')).find((button) =>
        button.textContent?.includes('Keep'),
      ) as HTMLButtonElement
    ).click();
    completeDialogExit(overlayContainer);
    await expect(result).resolves.toBe('keep');

    const cancelled = service.choice({
      title: 'Choose',
      options: [{ id: 'resize', label: 'Resize', value: 'resize' }],
    });
    await Promise.resolve();
    overlayContainer
      .getContainerElement()
      .querySelector('.ui-alert-dialog')
      ?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    completeDialogExit(overlayContainer);
    await expect(cancelled).resolves.toBeUndefined();
  });

  it.each(['success', 'warning', 'error', 'info'] as const)(
    'opens %s notice with a single action',
    async (kind) => {
      const result = service[kind](kind);
      await Promise.resolve();
      const pane = overlayContainer
        .getContainerElement()
        .querySelector('.ui-alert-dialog') as HTMLElement;
      expect(pane).toBeTruthy();
      (pane.querySelector('.ui-button') as HTMLButtonElement).click();
      completeDialogExit(overlayContainer);
      await expect(result).resolves.toBe(true);
    },
  );
});
