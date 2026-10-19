import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WorkspaceHelpDialogComponent } from './workspace-help-dialog.component';

describe('WorkspaceHelpDialogComponent', () => {
  afterEach(() => localStorage.removeItem('the-block-laundromat.ui-preferences'));

  it('renders the selected topic and emits navigation from the topic list', async () => {
    await TestBed.configureTestingModule({
      imports: [WorkspaceHelpDialogComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(WorkspaceHelpDialogComponent);
    fixture.componentRef.setInput('topic', 'camera-navigation');
    fixture.detectChanges();
    const topicChange = vi.fn();
    fixture.componentInstance.topicChange.subscribe(topicChange);

    expect(fixture.nativeElement.querySelector('article h1')?.textContent).toContain(
      'Camera navigation',
    );
    fixture.nativeElement.querySelector('.workspace-help-navigation button')?.click();

    expect(topicChange).toHaveBeenCalledWith('getting-started');
    fixture.destroy();
  });

  it('filters topics by localized content and updates the mobile selector', async () => {
    await TestBed.configureTestingModule({
      imports: [WorkspaceHelpDialogComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(WorkspaceHelpDialogComponent);
    fixture.detectChanges();
    const search = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;
    search.value = 'troubleshooting';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    const navigationItems = fixture.nativeElement.querySelectorAll(
      '.workspace-help-navigation button',
    );
    expect(navigationItems).toHaveLength(1);
    expect(navigationItems[0].textContent).toContain('Troubleshooting');

    const selector = fixture.nativeElement.querySelector(
      '.workspace-help-mobile-topic select',
    ) as HTMLSelectElement;
    const topicChange = vi.fn();
    fixture.componentInstance.topicChange.subscribe(topicChange);
    selector.value = 'undo-redo';
    selector.dispatchEvent(new Event('change', { bubbles: true }));
    expect(topicChange).toHaveBeenCalledWith('undo-redo');
    fixture.destroy();
  });

  it('closes on Escape and prevents the event from reaching editor shortcuts', async () => {
    await TestBed.configureTestingModule({
      imports: [WorkspaceHelpDialogComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(WorkspaceHelpDialogComponent);
    fixture.detectChanges();
    const closed = vi.fn();
    fixture.componentInstance.closed.subscribe(closed);
    const event = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    document.dispatchEvent(event);

    expect(closed).toHaveBeenCalledOnce();
    expect(event.defaultPrevented).toBe(true);
    fixture.destroy();
  });
});
