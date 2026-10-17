import { afterEach, describe, expect, it, vi } from 'vitest';
import { ErrorHandler } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { ProjectScreenWorkflow } from './project-screen-workflow';
import { ProjectScreenPreviewComponent } from './project-screen-preview.component';
import { ProjectPreviewService } from '../../../core/persistence/project-preview.service';

class TestIntersectionObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = '160px';
  readonly scrollMargin = '0px';
  readonly thresholds = [0];
  readonly observe = vi.fn();
  readonly unobserve = vi.fn();
  readonly disconnect = vi.fn();

  constructor(private readonly callback: IntersectionObserverCallback) {}

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  intersect(target: Element): void {
    this.callback([{ target, isIntersecting: true } as IntersectionObserverEntry], this);
  }

  leave(target: Element): void {
    this.callback([{ target, isIntersecting: false } as IntersectionObserverEntry], this);
  }
}

function installIntersectionObserver(): () => TestIntersectionObserver | undefined {
  let current: TestIntersectionObserver | undefined;
  vi.stubGlobal(
    'IntersectionObserver',
    class extends TestIntersectionObserver {
      constructor(callback: IntersectionObserverCallback) {
        super(callback);
        current = this;
      }
    },
  );
  return () => current;
}

describe('ProjectScreenPreviewComponent', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('loads near-view previews and releases their object URLs after leaving view', async () => {
    const preview = new Blob(['renderer capture'], { type: 'image/jpeg' });
    const loadProjectPreview = vi.fn(async () => preview);
    const createObjectUrl = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValueOnce('blob:project-preview-1')
      .mockReturnValueOnce('blob:project-preview-2');
    const revokeObjectUrl = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const getObserver = installIntersectionObserver();
    const updates = new Subject<{ projectId: string; updatedAt: string }>();

    await TestBed.configureTestingModule({
      imports: [ProjectScreenPreviewComponent],
      providers: [
        { provide: ProjectScreenWorkflow, useValue: { loadProjectPreview } },
        { provide: ProjectPreviewService, useValue: { updates: updates.asObservable() } },
        { provide: ErrorHandler, useValue: { handleError: vi.fn() } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ProjectScreenPreviewComponent);
    fixture.componentRef.setInput('project', {
      id: 'project-1',
      updatedAt: '2026-10-17T10:00:00.000Z',
    });
    fixture.detectChanges();
    expect(loadProjectPreview).not.toHaveBeenCalled();

    getObserver()?.intersect(fixture.nativeElement as Element);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(loadProjectPreview).toHaveBeenCalledWith('project-1', '2026-10-17T10:00:00.000Z');
    expect(fixture.nativeElement.querySelector('img')?.getAttribute('src')).toBe(
      'blob:project-preview-1',
    );

    getObserver()?.leave(fixture.nativeElement as Element);
    fixture.detectChanges();
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:project-preview-1');
    expect(fixture.nativeElement.querySelector('img')).toBeNull();

    getObserver()?.intersect(fixture.nativeElement as Element);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(loadProjectPreview).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.querySelector('img')?.getAttribute('src')).toBe(
      'blob:project-preview-2',
    );

    fixture.destroy();
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:project-preview-2');
    expect(getObserver()?.disconnect).toHaveBeenCalledOnce();
  });

  it('keeps an honest empty preview frame when a project has no current capture', async () => {
    const loadProjectPreview = vi.fn(async () => undefined);
    const getObserver = installIntersectionObserver();
    const updates = new Subject<{ projectId: string; updatedAt: string }>();
    await TestBed.configureTestingModule({
      imports: [ProjectScreenPreviewComponent],
      providers: [
        { provide: ProjectScreenWorkflow, useValue: { loadProjectPreview } },
        { provide: ProjectPreviewService, useValue: { updates: updates.asObservable() } },
        { provide: ErrorHandler, useValue: { handleError: vi.fn() } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ProjectScreenPreviewComponent);
    fixture.componentRef.setInput('project', {
      id: 'empty',
      updatedAt: '2026-10-17T11:00:00.000Z',
    });
    fixture.detectChanges();
    getObserver()?.intersect(fixture.nativeElement as Element);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(loadProjectPreview).toHaveBeenCalledWith('empty', '2026-10-17T11:00:00.000Z');
    expect(fixture.nativeElement.querySelector('.preview-surface svg')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
    fixture.destroy();
  });

  it('refreshes only the matching project when its persisted preview changes', async () => {
    const preview = new Blob(['updated'], { type: 'image/webp' });
    const loadProjectPreview = vi.fn(async (id: string) =>
      id === 'first' &&
      loadProjectPreview.mock.calls.filter(([projectId]) => projectId === 'first').length > 1
        ? preview
        : undefined,
    );
    const getObserver = installIntersectionObserver();
    const updates = new Subject<{ projectId: string; updatedAt: string }>();
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:first-preview');
    const revokeObjectUrl = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    await TestBed.configureTestingModule({
      imports: [ProjectScreenPreviewComponent],
      providers: [
        { provide: ProjectScreenWorkflow, useValue: { loadProjectPreview } },
        { provide: ProjectPreviewService, useValue: { updates: updates.asObservable() } },
        { provide: ErrorHandler, useValue: { handleError: vi.fn() } },
      ],
    }).compileComponents();

    const first = TestBed.createComponent(ProjectScreenPreviewComponent);
    first.componentRef.setInput('project', { id: 'first', updatedAt: 'revision-1' });
    const second = TestBed.createComponent(ProjectScreenPreviewComponent);
    second.componentRef.setInput('project', { id: 'second', updatedAt: 'revision-1' });
    first.detectChanges();
    second.detectChanges();

    expect(getObserver()?.observe).toHaveBeenCalledTimes(2);
    getObserver()?.intersect(first.nativeElement as Element);
    await first.whenStable();
    first.detectChanges();
    expect(loadProjectPreview).toHaveBeenCalledWith('first', 'revision-1');
    expect(loadProjectPreview).toHaveBeenCalledTimes(1);

    getObserver()?.intersect(second.nativeElement as Element);
    await second.whenStable();
    second.detectChanges();
    updates.next({ projectId: 'first', updatedAt: 'revision-1' });
    await first.whenStable();
    first.detectChanges();
    await second.whenStable();
    second.detectChanges();
    expect(loadProjectPreview).toHaveBeenCalledTimes(3);
    expect(loadProjectPreview.mock.calls.map(([projectId]) => projectId)).toEqual([
      'first',
      'second',
      'first',
    ]);
    expect(first.nativeElement.querySelector('img')?.getAttribute('src')).toBe(
      'blob:first-preview',
    );
    expect(revokeObjectUrl).not.toHaveBeenCalledWith('blob:first-preview');

    first.destroy();
    second.destroy();
    expect(getObserver()?.disconnect).toHaveBeenCalledOnce();
  });

  it('ignores in-flight preview loads after the card changes project or is destroyed', async () => {
    const firstLoad = deferred<Blob | undefined>();
    const secondLoad = deferred<Blob | undefined>();
    const loadProjectPreview = vi.fn((id: string) =>
      id === 'first' ? firstLoad.promise : secondLoad.promise,
    );
    const updates = new Subject<{ projectId: string; updatedAt: string }>();
    const getObserver = installIntersectionObserver();
    const createObjectUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:unexpected');
    await TestBed.configureTestingModule({
      imports: [ProjectScreenPreviewComponent],
      providers: [
        { provide: ProjectScreenWorkflow, useValue: { loadProjectPreview } },
        { provide: ProjectPreviewService, useValue: { updates: updates.asObservable() } },
        { provide: ErrorHandler, useValue: { handleError: vi.fn() } },
      ],
    }).compileComponents();

    const changed = TestBed.createComponent(ProjectScreenPreviewComponent);
    changed.componentRef.setInput('project', { id: 'first', updatedAt: 'revision-1' });
    changed.detectChanges();
    getObserver()?.intersect(changed.nativeElement as Element);
    changed.componentRef.setInput('project', { id: 'second', updatedAt: 'revision-2' });
    changed.detectChanges();
    const staleProjectPreview = new Blob(['stale project'], { type: 'image/webp' });
    firstLoad.resolve(staleProjectPreview);
    secondLoad.resolve(undefined);
    await changed.whenStable();
    expect(createObjectUrl.mock.calls.some(([blob]) => blob === staleProjectPreview)).toBe(false);
    changed.destroy();

    const destroyedLoad = deferred<Blob | undefined>();
    loadProjectPreview.mockImplementation(() => destroyedLoad.promise);
    const destroyed = TestBed.createComponent(ProjectScreenPreviewComponent);
    destroyed.componentRef.setInput('project', { id: 'third', updatedAt: 'revision-3' });
    destroyed.detectChanges();
    getObserver()?.intersect(destroyed.nativeElement as Element);
    destroyed.destroy();
    const latePreview = new Blob(['late result'], { type: 'image/webp' });
    destroyedLoad.resolve(latePreview);
    await Promise.resolve();
    expect(createObjectUrl.mock.calls.some(([blob]) => blob === latePreview)).toBe(false);
  });
});

function deferred<T>(): { promise: Promise<T>; resolve(value: T): void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => (resolve = complete));
  return { promise, resolve };
}
