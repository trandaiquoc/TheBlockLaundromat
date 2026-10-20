import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { ViewportAxisGizmoComponent } from './viewport-axis-gizmo.component';

describe('ViewportAxisGizmoComponent', () => {
  it('exposes all six Minecraft axis views and emits the selected camera preset', () => {
    TestBed.configureTestingModule({ imports: [ViewportAxisGizmoComponent] });
    const fixture = TestBed.createComponent(ViewportAxisGizmoComponent);
    const selected: string[] = [];
    fixture.componentInstance.selectPreset.subscribe((preset) => selected.push(preset));
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('button');
    expect(buttons).toHaveLength(6);
    expect(fixture.nativeElement.querySelector('[aria-label="Top"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[aria-label="Bottom"]')).not.toBeNull();
    fixture.nativeElement.querySelector('[aria-label="Bottom"]').click();
    expect(selected).toEqual(['bottom']);
  });
});
