import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { ViewportAxisGizmoComponent } from './viewport-axis-gizmo.component';

describe('ViewportAxisGizmoComponent', () => {
  it('anchors the camera controls at the lower right of the viewport', () => {
    TestBed.configureTestingModule({ imports: [ViewportAxisGizmoComponent] });
    const fixture = TestBed.createComponent(ViewportAxisGizmoComponent);
    fixture.detectChanges();

    const style = getComputedStyle(fixture.nativeElement as HTMLElement);
    expect(style.position).toBe('absolute');
    expect(style.top).toBe('');
    expect(style.bottom).toBe('4.5rem');
    expect(style.right).toBe('0.75rem');
  });

  it('exposes all six Minecraft axis views and emits the selected camera preset', () => {
    TestBed.configureTestingModule({ imports: [ViewportAxisGizmoComponent] });
    const fixture = TestBed.createComponent(ViewportAxisGizmoComponent);
    const selected: string[] = [];
    fixture.componentInstance.selectPreset.subscribe((preset) => selected.push(preset));
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('button');
    expect(buttons).toHaveLength(6);
    expect(fixture.nativeElement.querySelector('[aria-label="Right (+X)"]')?.textContent).toContain(
      '+X',
    );
    expect(fixture.nativeElement.querySelector('[aria-label="Left (−X)"]')?.textContent).toContain(
      '−X',
    );
    expect(fixture.nativeElement.querySelector('[aria-label="Top (+Y)"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[aria-label="Bottom (−Y)"]')).not.toBeNull();
    fixture.nativeElement.querySelector('[aria-label="Bottom (−Y)"]').click();
    expect(selected).toEqual(['bottom']);
  });

  it('repositions the axis endpoints when the camera orientation changes', () => {
    TestBed.configureTestingModule({ imports: [ViewportAxisGizmoComponent] });
    const fixture = TestBed.createComponent(ViewportAxisGizmoComponent);
    fixture.componentRef.setInput('cameraState', {
      position: { x: 8, y: 7, z: 9 },
      target: { x: 0, y: 0, z: 0 },
      up: { x: 0, y: 1, z: 0 },
    });
    fixture.detectChanges();
    const right = fixture.nativeElement.querySelector('[aria-label="Right (+X)"]') as HTMLElement;
    const initialLeft = right.style.left;

    fixture.componentRef.setInput('cameraState', {
      position: { x: 9, y: 7, z: -8 },
      target: { x: 0, y: 0, z: 0 },
      up: { x: 0, y: 1, z: 0 },
    });
    fixture.detectChanges();

    expect(right.style.left).not.toBe(initialLeft);
  });
});
