import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { I18nService } from '../../../../core/ui/localization/i18n.service';
import { ViewportFeedbackComponent } from './viewport-feedback.component';

describe('ViewportFeedbackComponent', () => {
  let fixture: ComponentFixture<ViewportFeedbackComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewportFeedbackComponent],
      providers: [{ provide: I18nService, useValue: { t: (key: string) => key } }],
    }).compileComponents();
    fixture = TestBed.createComponent(ViewportFeedbackComponent);
  });

  it('keeps placement feedback visible without onboarding UI in an empty viewport', () => {
    fixture.componentRef.setInput('placementStatus', 'valid');
    fixture.componentRef.setInput('target', '2, 0, 3');
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const status = host.querySelector('.viewport-status');

    expect(host.querySelector('.viewport-starter')).toBeNull();
    expect(host.querySelector('.starter-action')).toBeNull();
    expect(status?.getAttribute('data-status')).toBe('valid');
    expect(status?.textContent).toContain('2, 0, 3');
  });

  it('shows placement feedback with reasons even when no block is selected', () => {
    fixture.componentRef.setInput('placementStatus', 'warning');
    fixture.componentRef.setInput('placementReason', 'Needs support');
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const status = host.querySelector('.viewport-status');
    expect(host.querySelector('.viewport-starter')).toBeNull();
    expect(status?.getAttribute('data-status')).toBe('warning');
    expect(status?.textContent).toContain('warning');
    expect(status?.textContent).toContain('Needs support');
  });

  it('shows target-only hover details without inventing a placement result', () => {
    fixture.componentRef.setInput('target', '1, 0, 1');
    fixture.detectChanges();

    const status = (fixture.nativeElement as HTMLElement).querySelector('.viewport-status');
    expect(status?.hasAttribute('data-status')).toBe(false);
    expect(status?.textContent).toContain('1, 0, 1');
    expect(status?.textContent).not.toContain('invalid');
  });
});
