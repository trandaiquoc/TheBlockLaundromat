import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DecorationService } from '../../../../core/decorations/decoration.service';
import { ContextualInspectorComponent } from './contextual-inspector.component';
import { EditorToolService } from '../../../../core/editor/state/tool.service';
import { SelectionService } from '../../../../core/editor/selection/selection.service';
import { WorkspaceStateService } from '../../../../core/workspace/workspace-state.service';
import { ProjectBlockRuntimeIndex } from '../../../../core/editor/runtime/project-block-runtime-index';
import { ContentAssetRuntimeService } from '../../../../core/assets/content-asset-runtime.service';
import { rendererBenchmarkProject } from '../../../../core/renderer/benchmark/renderer-benchmark-fixtures';

describe('ContextualInspectorComponent', () => {
  afterEach(() => TestBed.resetTestingModule());
  it('owns one reachable action row before either context and derives availability from real selection', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: ProjectBlockRuntimeIndex, useValue: new ProjectBlockRuntimeIndex() }],
    });
    const workspace = TestBed.inject(WorkspaceStateService),
      selection = TestBed.inject(SelectionService);
    const project = rendererBenchmarkProject('small');
    workspace.publishProject({ ...project, blocks: [] });
    const fixture = TestBed.createComponent(ContextualInspectorComponent);
    fixture.detectChanges();
    const all = fixture.nativeElement.querySelector(
      '[data-action="select-all"]',
    ) as HTMLButtonElement;
    const clear = fixture.nativeElement.querySelector(
      '[data-action="clear-selection"]',
    ) as HTMLButtonElement;
    const selectAll = vi.fn(),
      clearSelection = vi.fn();
    fixture.componentInstance.selectAllRequested.subscribe(selectAll);
    fixture.componentInstance.clearSelectionRequested.subscribe(clearSelection);
    expect(all.disabled).toBe(true);
    expect(clear.disabled).toBe(true);
    workspace.publishProject(project);
    selection.select(project.blocks[0].position);
    fixture.detectChanges();
    expect(all.disabled).toBe(false);
    expect(clear.disabled).toBe(false);
    all.click();
    clear.click();
    expect(selectAll).toHaveBeenCalledOnce();
    expect(clearSelection).toHaveBeenCalledOnce();
    expect(selection.single()).toEqual(project.blocks[0].position);
    for (const tool of ['select', 'place'] as const) {
      TestBed.inject(EditorToolService).select(tool);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelectorAll('.overview-actions')).toHaveLength(1);
      const detail = fixture.nativeElement.querySelector(
        tool === 'place' ? '.placement-context' : 'app-selection-inspector',
      );
      expect(
        fixture.nativeElement.querySelector('.overview-actions').compareDocumentPosition(detail) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }
    selection.clear();
    fixture.detectChanges();
    expect(clear.disabled).toBe(true);
    TestBed.inject(DecorationService).selectFrame(false);
    // A material is not a real placed selection.
    fixture.detectChanges();
    expect(clear.disabled).toBe(true);
  });
  it('follows the tool while keeping real selection intact and allows explicit context browsing', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: ProjectBlockRuntimeIndex, useValue: new ProjectBlockRuntimeIndex() },
        {
          provide: ContentAssetRuntimeService,
          useValue: { thumbnailUrlForItem: () => undefined, requestItemThumbnail: vi.fn() },
        },
      ],
    });
    const project = rendererBenchmarkProject('small');
    const workspace = TestBed.inject(WorkspaceStateService);
    const selection = TestBed.inject(SelectionService);
    const tool = TestBed.inject(EditorToolService);
    workspace.publishProject(project);
    selection.select(project.blocks[0].position);
    tool.select('place');
    const fixture = TestBed.createComponent(ContextualInspectorComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.placement-context')).not.toBeNull();
    const contexts = fixture.nativeElement.querySelectorAll('.inspector-context button');
    contexts[1].click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-selection-inspector')).not.toBeNull();
    tool.select('select');
    fixture.detectChanges();
    tool.select('place');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.placement-context')).not.toBeNull();
    expect(selection.single()).toEqual(project.blocks[0].position);
  });
});
