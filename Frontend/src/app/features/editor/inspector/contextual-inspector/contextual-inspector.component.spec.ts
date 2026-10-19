import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ContextualInspectorComponent } from './contextual-inspector.component';
import { EditorToolService } from '../../../../core/editor/state/tool.service';
import { SelectionService } from '../../../../core/editor/selection/selection.service';
import { WorkspaceStateService } from '../../../../core/workspace/workspace-state.service';
import { ProjectBlockRuntimeIndex } from '../../../../core/editor/runtime/project-block-runtime-index';
import { ContentAssetRuntimeService } from '../../../../core/assets/content-asset-runtime.service';
import { rendererBenchmarkProject } from '../../../../core/renderer/benchmark/renderer-benchmark-fixtures';

describe('ContextualInspectorComponent', () => {
  afterEach(() => TestBed.resetTestingModule());
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
