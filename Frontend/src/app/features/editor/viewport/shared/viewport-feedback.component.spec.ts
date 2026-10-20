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
    fixture.componentRef.setInput('target', { x: 2, y: 0, z: 3 });
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const status = host.querySelector('.viewport-status');

    expect(host.querySelector('.viewport-starter')).toBeNull();
    expect(host.querySelector('.starter-action')).toBeNull();
    expect(status?.getAttribute('data-status')).toBe('valid');
    expect(status?.querySelector('.status-chip')).not.toBeNull();
    expect(
      status
        ?.querySelector('.status-chip')
        ?.nextElementSibling?.classList.contains('coordinate-readout'),
    ).toBe(true);
    expect(status?.querySelector('.coordinate-readout')?.textContent).toContain('X2');
    expect(status?.querySelector('.coordinate-readout')?.textContent).toContain('Y0');
    expect(status?.querySelector('.coordinate-readout')?.textContent).toContain('Z3');
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
    fixture.componentRef.setInput('target', { x: 1, y: 0, z: 1 });
    fixture.detectChanges();

    const status = (fixture.nativeElement as HTMLElement).querySelector('.viewport-status');
    expect(status?.hasAttribute('data-status')).toBe(false);
    expect(status?.querySelector('.coordinate-readout')?.textContent).toContain('X1');
    expect(status?.querySelector('.coordinate-readout')?.textContent).toContain('Y0');
    expect(status?.querySelector('.coordinate-readout')?.textContent).toContain('Z1');
    expect(status?.querySelector('.status-chip')).toBeNull();
    expect(status?.textContent).not.toContain('invalid');
  });
});
