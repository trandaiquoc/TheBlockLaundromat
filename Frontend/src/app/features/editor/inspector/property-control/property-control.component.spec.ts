import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ContentPropertyDescriptor } from '../../../../core/content/content-introspection';
import { PropertyControlComponent, propertyControlKind } from './property-control.component';

function property(values: readonly string[], derived = false): ContentPropertyDescriptor {
  return {
    name: 'custom_property',
    values,
    derived,
    provenance: 'unknown',
    evidence: [],
    effects: {
      visual: false,
      placement: false,
      behavior: false,
      attachment: false,
      connection: false,
      itemDisplay: false,
      runtimeUnknown: true,
    },
  };
}

describe('PropertyControlComponent', () => {
  afterEach(() => TestBed.resetTestingModule());
  it('chooses controls from value metadata, including unknown and long enums', () => {
    expect(propertyControlKind(['false', 'true'])).toBe('boolean');
    expect(propertyControlKind(['north', 'east', 'south', 'west'])).toBe('segments');
    expect(propertyControlKind(['false', 'true', 'unknown'])).toBe('segments');
    expect(propertyControlKind(['a', 'b', 'c', 'd', 'e'])).toBe('select');
    expect(propertyControlKind(['custom_long_property_value', 'other'])).toBe('select');
    expect(propertyControlKind(['preserved'])).toBe('select');
  });
  it('emits a boolean value without mutating the descriptor and disables locked/derived edits', () => {
    const fixture = TestBed.createComponent(PropertyControlComponent);
    fixture.componentRef.setInput('property', property(['false', 'true']));
    fixture.componentRef.setInput('value', 'false');
    const changed = vi.fn();
    fixture.componentInstance.valueChange.subscribe(changed);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('[role="switch"]') as HTMLButtonElement;
    button.click();
    expect(changed).toHaveBeenCalledExactlyOnceWith('true');
    expect(button.getAttribute('aria-checked')).toBe('false');
    fixture.componentRef.setInput('locked', true);
    fixture.detectChanges();
    expect(button.disabled).toBe(true);
    button.click();
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(changed).toHaveBeenCalledTimes(1);
    fixture.componentRef.setInput('locked', false);
    fixture.componentRef.setInput('property', property(['false', 'true'], true));
    fixture.detectChanges();
    expect(button.disabled).toBe(true);
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(changed).toHaveBeenCalledTimes(1);
  });
  it('supports arrow navigation through short enums and preserves readonly derived values', () => {
    const fixture = TestBed.createComponent(PropertyControlComponent);
    fixture.componentRef.setInput('property', property(['a', 'b', 'c']));
    fixture.componentRef.setInput('value', 'a');
    const changed = vi.fn();
    fixture.componentInstance.valueChange.subscribe(changed);
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('[role="radio"]');
    buttons[0].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
    );
    expect(changed).toHaveBeenCalledWith('b');
    fixture.componentRef.setInput('property', property(['a', 'b', 'c'], true));
    fixture.detectChanges();
    expect([...buttons].every((button) => button.disabled)).toBe(true);
  });
});
