import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { I18nService } from '../../../../core/ui/localization/i18n.service';
import { ViewportEmptyStateComponent } from './viewport-empty-state.component';

describe('ViewportEmptyStateComponent', () => {
  let fixture: ComponentFixture<ViewportEmptyStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewportEmptyStateComponent],
      providers: [{ provide: I18nService, useValue: { t: (key: string) => key } }],
    }).compileComponents();
    fixture = TestBed.createComponent(ViewportEmptyStateComponent);
  });

  it('offers an actionable Block Browser entry from the empty starting state', () => {
    fixture.componentRef.setInput('project', { blocks: [], decorations: [] });
    const openRequested = vi.fn();
    fixture.componentInstance.openBlockBrowserRequested.subscribe(openRequested);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const status = host.querySelector('[role="status"]');
    expect(status?.getAttribute('aria-atomic')).toBe('true');
    expect(host.querySelector('.viewport-starter')?.getAttribute('data-guidance')).toBe('choose');
    expect(status?.textContent).toContain('viewportEmptyTitle');
    expect(status?.textContent).toContain('viewportEmptyChooseBlockHint');
    expect(status?.textContent).toContain('viewportEmptyNextChoose');
    expect(host.querySelector('.starter-art[aria-hidden="true"] svg')).not.toBeNull();

    const openButton = host.querySelector<HTMLButtonElement>('.starter-action');
    expect(openButton?.textContent).toContain('openLeftSidebar');
    openButton?.click();
    expect(openRequested).toHaveBeenCalledOnce();
    expect(openRequested.mock.calls[0][0]).toBeInstanceOf(Event);
  });

  it('updates the next step for the selected item, decoration support, and Select tool', () => {
    fixture.componentRef.setInput('project', { blocks: [], decorations: [] });
    fixture.componentRef.setInput('hasActiveBlock', true);
    fixture.detectChanges();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[role="status"]')?.textContent,
    ).toContain('viewportEmptyNextPlace');

    fixture.componentRef.setInput('hasActiveDecoration', true);
    fixture.detectChanges();
    const supportHost = fixture.nativeElement as HTMLElement;
    const supportState = supportHost.querySelector('[role="status"]');
    expect(supportHost.querySelector('.viewport-starter')?.getAttribute('data-guidance')).toBe(
      'support',
    );
    expect(supportState?.textContent).toContain('viewportEmptySupportHint');
    expect(supportState?.textContent).toContain('viewportEmptyNextSupport');
    expect(supportHost.querySelector('.starter-action')).toBeNull();

    fixture.componentRef.setInput('tool', 'select');
    fixture.detectChanges();
    const selectHost = fixture.nativeElement as HTMLElement;
    const selectState = selectHost.querySelector('[role="status"]');
    expect(selectHost.querySelector('.viewport-starter')?.getAttribute('data-guidance')).toBe(
      'select',
    );
    expect(selectState?.textContent).toContain('viewportEmptySelectHint');
    expect(selectState?.textContent).toContain('viewportEmptyNextSwitch');
    expect(selectHost.querySelector('.starter-action')).toBeNull();
  });

  it('stays out of the way once blocks or decorations are present', () => {
    fixture.componentRef.setInput('project', { blocks: [{} as never], decorations: [] });
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('[role="status"]')).toBeNull();

    fixture.componentRef.setInput('project', { blocks: [], decorations: [{} as never] });
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('[role="status"]')).toBeNull();
  });
});
