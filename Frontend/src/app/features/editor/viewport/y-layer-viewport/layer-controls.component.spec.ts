import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LayerControlsComponent } from './layer-controls.component';

describe('LayerControlsComponent', () => {
  afterEach(() => TestBed.resetTestingModule());
  function create() {
    const fixture = TestBed.createComponent(LayerControlsComponent);
    fixture.componentRef.setInput('currentY', 4);
    fixture.componentRef.setInput('maximumY', 15);
    fixture.componentRef.setInput('visibility', 'current-only');
    fixture.componentRef.setInput('opacity', 0.5);
    const actions = vi.fn();
    fixture.componentInstance.action.subscribe(actions);
    fixture.detectChanges();
    return { fixture, actions };
  }
  it('groups Minecraft Y height with both step controls in one compact stepper', () => {
    const { fixture } = create();
    const stepper = fixture.nativeElement.querySelector('.layer-primary');
    expect(stepper.children).toHaveLength(3);
    expect(stepper.querySelector('.layer-axis-label > span')?.textContent).toBe('Y');
    expect(stepper.querySelector('input[type="number"]')?.value).toBe('4');
    expect(stepper.querySelector('[aria-label="Current Y"]')).not.toBeNull();
  });
  it('emits step, preview, commit, occupied and opacity actions through the existing layer contract', () => {
    const { fixture, actions } = create();
    fixture.nativeElement.querySelector('.layer-primary button').click();
    const slider = fixture.nativeElement.querySelector('input[type="range"]') as HTMLInputElement;
    slider.value = '8';
    slider.dispatchEvent(new Event('input'));
    slider.dispatchEvent(new Event('change'));
    fixture.nativeElement.querySelector('.occupied-layers button').click();
    const opacity = fixture.nativeElement.querySelector('input[step="0.05"]') as HTMLInputElement;
    opacity.value = '0.25';
    opacity.dispatchEvent(new Event('input'));
    expect(actions.mock.calls.map(([action]) => action)).toEqual([
      { type: 'step', direction: -1 },
      { type: 'preview', value: '8' },
      { type: 'commit', value: '8' },
      { type: 'jump', position: 'first' },
      { type: 'opacity', value: '0.25' },
    ]);
  });
  it('closes options on Escape, returns focus and closes when the retained viewport deactivates', () => {
    const { fixture } = create();
    const details = fixture.nativeElement.querySelector('details') as HTMLDetailsElement;
    details.open = true;
    const focus = vi.spyOn(details.querySelector('summary')!, 'focus');
    details.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
    expect(details.open).toBe(false);
    expect(focus).toHaveBeenCalledOnce();
    details.open = true;
    fixture.componentRef.setInput('active', false);
    fixture.detectChanges();
    expect(details.open).toBe(false);
  });
});
