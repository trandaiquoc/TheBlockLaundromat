import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BlockLibraryService } from '../../../../core/blocks/catalog/block-library.service';
import type { ProjectDocument, PlacedBlock } from '../../../../core/domain/project.types';
import { ProjectBlockRuntimeIndex } from '../../../../core/editor/runtime/project-block-runtime-index';
import { SelectionService } from '../../../../core/editor/selection/selection.service';
import { I18nService } from '../../../../core/ui/localization/i18n.service';
import { rendererBenchmarkProject } from '../../../../core/renderer/benchmark/renderer-benchmark-fixtures';
import { WorkspaceStateService } from '../../../../core/workspace/workspace-state.service';
import type { ContentPropertyDescriptor } from '../../../../core/content/content-introspection';
import { ItemStackPickerComponent } from '../../../../shared/ui/item-stack-picker/item-stack-picker.component';
import { StructureEditorService } from '../../../../core/editor/structure/structure-editor.service';
import { ItemDisplayInspectorComponent } from '../item-display-inspector/item-display-inspector.component';
import { SelectionInspectorComponent } from './selection-inspector.component';

describe('SelectionInspectorComponent', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('presents Select all as a selected set, retaining real bounds and count', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: ProjectBlockRuntimeIndex, useValue: new ProjectBlockRuntimeIndex() }],
    });
    const base = rendererBenchmarkProject('small');
    const project = {
      ...base,
      blocks: [
        { ...base.blocks[0], position: { x: 1, y: 0, z: 2 } },
        { ...base.blocks[0], position: { x: 3, y: 2, z: 4 } },
      ],
    };
    TestBed.inject(WorkspaceStateService).publishProject(project);
    TestBed.inject(SelectionService).selectAll(project);
    const fixture = TestBed.createComponent(SelectionInspectorComponent);
    fixture.detectChanges();
    const values = [...fixture.nativeElement.querySelectorAll('.selection-details dd')].map((e) =>
      e.textContent.trim(),
    );
    expect(values).toEqual(['X 1, Y 0, Z 2', 'X 3, Y 2, Z 4', '3 x 3 x 3', '2']);
    expect(fixture.nativeElement.querySelector('[data-empty-selection]')).toBeNull();
    fixture.destroy();
  });

  function lockedProject(block: PlacedBlock): ProjectDocument {
    const base = rendererBenchmarkProject('small');
    return {
      ...base,
      id: `locked-${block.id}`,
      groups: [{ id: 'locked', name: 'Locked group', visible: true, locked: true }],
      blocks: [{ ...block, groupIds: ['locked'] }],
    };
  }

  it('reads compact all-selection bounds after project changes without computed signal writes', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: ProjectBlockRuntimeIndex, useValue: new ProjectBlockRuntimeIndex() }],
    });
    const base = rendererBenchmarkProject('small');
    const project = {
      ...base,
      size: { x: 257, y: 1, z: 1 },
      blocks: Array.from({ length: 257 }, (_, x) => ({
        ...base.blocks[0],
        position: { x, y: 0, z: 0 },
      })),
    };
    const workspace = TestBed.inject(WorkspaceStateService);
    const selection = TestBed.inject(SelectionService);
    workspace.publishProject(project);
    selection.selectAll(project);
    expect(selection.kind()).toBe('all');
    const fixture = TestBed.createComponent(SelectionInspectorComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.selection-details').textContent).toContain(
      'X 256, Y 0, Z 0',
    );
    workspace.publishProject({ ...project, blocks: project.blocks.slice(0, -1) });
    fixture.detectChanges();
    const values = [...fixture.nativeElement.querySelectorAll('.selection-details dd')].map((e) =>
      e.textContent.trim(),
    );
    expect(values).toEqual(['X 0, Y 0, Z 0', 'X 255, Y 0, Z 0', '256 x 1 x 1', '256']);
    fixture.destroy();
  });

  it('shows selected-set bounds and count instead of a synthetic drag volume', async () => {
    const base = rendererBenchmarkProject('small');
    const project = {
      ...base,
      size: { x: 16, y: 32, z: 16 },
      blocks: [
        { ...base.blocks[0], position: { x: 8, y: 0, z: 8 } },
        { ...base.blocks[0], position: { x: 8, y: 28, z: 8 } },
      ],
    };
    const runtimeIndex = new ProjectBlockRuntimeIndex();
    await TestBed.configureTestingModule({
      imports: [SelectionInspectorComponent],
      providers: [{ provide: ProjectBlockRuntimeIndex, useValue: runtimeIndex }],
    }).compileComponents();
    const fixture = TestBed.createComponent(SelectionInspectorComponent);
    const workspace = TestBed.inject(WorkspaceStateService);
    const selection = TestBed.inject(SelectionService);
    workspace.publishProject(project);
    selection.selectMarqueeLogical(
      {
        candidateBounds: { min: { x: 8, y: 0, z: 8 }, max: { x: 8, y: 28, z: 8 } },
        intersectsVoxel: ({ x, z }) => x === 8 && z === 8,
      },
      project,
      () => undefined,
    );
    fixture.detectChanges();

    const details = [...fixture.nativeElement.querySelectorAll('.selection-details dd')].map(
      (entry) => entry.textContent?.replace(/\s+/g, ' ').trim(),
    );
    expect(details).toEqual(['X 8, Y 0, Z 8', 'X 8, Y 28, Z 8', '1 x 29 x 1', '2']);
    fixture.destroy();
  });

  it('keeps the structure summary below selection without owning contextual actions', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: ProjectBlockRuntimeIndex, useValue: new ProjectBlockRuntimeIndex() }],
    });
    TestBed.inject(WorkspaceStateService).publishProject(rendererBenchmarkProject('small'));
    const fixture = TestBed.createComponent(SelectionInspectorComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-empty-selection]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-overview-size]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-action]')).toBeNull();
  });

  it('keeps the auto-derived marker separate from property effect labels', async () => {
    await TestBed.configureTestingModule({
      imports: [SelectionInspectorComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(SelectionInspectorComponent);
    const i18n = TestBed.inject(I18nService);
    const property: ContentPropertyDescriptor = {
      name: 'shape',
      values: ['straight'],
      defaultValue: 'straight',
      derived: true,
      provenance: 'resource-backed',
      effects: {
        visual: true,
        placement: true,
        behavior: true,
        attachment: false,
        connection: false,
        itemDisplay: false,
        runtimeUnknown: false,
      },
      evidence: [],
    };
    const component = fixture.componentInstance as unknown as {
      propertyEffects: (value: ContentPropertyDescriptor) => string[];
    };

    expect(component.propertyEffects(property)).toEqual([
      i18n.t('propertyVisual'),
      i18n.t('propertyBehavior'),
      i18n.t('propertyPlacement'),
    ]);
    fixture.destroy();
  });

  it('disables state editing for locked blocks and restores it after unlocking the group', async () => {
    const position = { x: 1, y: 1, z: 1 };
    const project = lockedProject({
      kind: 'resolved',
      id: 'minecraft:lantern',
      namespace: 'minecraft',
      position,
      state: { hanging: 'false', waterlogged: 'false' },
    });
    const runtimeIndex = new ProjectBlockRuntimeIndex();
    runtimeIndex.ensure(project);
    await TestBed.configureTestingModule({
      imports: [SelectionInspectorComponent],
      providers: [{ provide: ProjectBlockRuntimeIndex, useValue: runtimeIndex }],
    }).compileComponents();
    const fixture = TestBed.createComponent(SelectionInspectorComponent);
    const workspace = TestBed.inject(WorkspaceStateService);
    const selection = TestBed.inject(SelectionService);
    const i18n = TestBed.inject(I18nService);
    workspace.publishProject(project);
    selection.select(position);
    fixture.detectChanges();

    const nativeElement = fixture.nativeElement as HTMLElement;
    const stateControl = nativeElement.querySelector<HTMLButtonElement>(
      '.state-editor app-property-control button',
    );
    const rotateButton = nativeElement.querySelector<HTMLButtonElement>('.state-editor > button');
    if (!stateControl || !rotateButton) throw new Error('Locked block controls are missing.');
    expect(stateControl.disabled).toBe(true);
    expect(rotateButton.disabled).toBe(true);
    expect(nativeElement.querySelector('.locked-block-hint')?.textContent).toContain(
      i18n.t('lockedBlockEditHint'),
    );

    workspace.publishProject({
      ...project,
      groups: project.groups.map((group) => ({ ...group, locked: false })),
    });
    fixture.detectChanges();

    expect(stateControl.disabled).toBe(false);
    expect(rotateButton.disabled).toBe(false);
    expect(nativeElement.querySelector('.locked-block-hint')).toBeNull();
    fixture.destroy();
  });

  it('keeps sign text and appearance controls read-only while preserving side navigation', async () => {
    const position = { x: 1, y: 1, z: 1 };
    const project = lockedProject({
      kind: 'resolved',
      id: 'minecraft:oak_sign',
      namespace: 'minecraft',
      position,
      state: { rotation: '0' },
    });
    const runtimeIndex = new ProjectBlockRuntimeIndex();
    runtimeIndex.ensure(project);
    await TestBed.configureTestingModule({
      imports: [SelectionInspectorComponent],
      providers: [{ provide: ProjectBlockRuntimeIndex, useValue: runtimeIndex }],
    }).compileComponents();
    const fixture = TestBed.createComponent(SelectionInspectorComponent);
    TestBed.inject(WorkspaceStateService).publishProject(project);
    TestBed.inject(SelectionService).select(position);
    fixture.detectChanges();

    const nativeElement = fixture.nativeElement as HTMLElement;
    const signInputs = nativeElement.querySelectorAll<HTMLInputElement>('.sign-inspector input');
    const signSelects = nativeElement.querySelectorAll<HTMLButtonElement>(
      '.sign-inspector app-themed-select button',
    );
    const sideTabs = nativeElement.querySelectorAll<HTMLButtonElement>(
      '.sign-inspector [role="tab"]',
    );
    expect(signInputs.length).toBeGreaterThan(0);
    expect([...signInputs].every((input) => input.disabled)).toBe(true);
    expect([...signSelects].every((button) => button.disabled)).toBe(true);
    expect([...sideTabs].length).toBe(2);
    expect([...sideTabs].every((button) => !button.disabled)).toBe(true);
    fixture.destroy();
  });

  it('disables item-display picking for locked blocks and skips the edit callback', async () => {
    const position = { x: 1, y: 1, z: 1 };
    const setBlockItemSlot = vi.fn();
    const runtimeIndex = new ProjectBlockRuntimeIndex();
    await TestBed.configureTestingModule({
      imports: [SelectionInspectorComponent],
      providers: [
        { provide: ProjectBlockRuntimeIndex, useValue: runtimeIndex },
        { provide: StructureEditorService, useValue: { setBlockItemSlot } },
      ],
    }).compileComponents();
    const library = TestBed.inject(BlockLibraryService);
    library.replaceSource({
      minecraftVersion: '1.21.1',
      sourceId: 'locked-inspector-test',
      sourceName: 'Locked inspector test',
      blocks: [
        {
          id: 'example:display_case',
          displayName: 'Display Case',
          defaultState: {},
          stateDefinitions: [],
          resources: { textures: [] },
          support: 'full',
          capabilities: [{ kind: 'item-storage-display', slotCount: 1, evidence: 'verified' }],
        },
      ],
    });
    const project = lockedProject({
      kind: 'resolved',
      id: 'example:display_case',
      namespace: 'example',
      position,
      state: {},
    });
    runtimeIndex.ensure(project);
    const fixture = TestBed.createComponent(SelectionInspectorComponent);
    TestBed.inject(WorkspaceStateService).publishProject(project);
    TestBed.inject(SelectionService).select(position);
    fixture.detectChanges();

    const inspector = fixture.debugElement.query(By.directive(ItemDisplayInspectorComponent));
    const picker = fixture.debugElement.query(By.directive(ItemStackPickerComponent));
    expect(inspector.componentInstance.locked).toBe(true);
    expect(picker.componentInstance.disabled).toBe(true);
    const itemDisplay = inspector.componentInstance as ItemDisplayInspectorComponent;
    (itemDisplay as unknown as { setSlot: (slot: number, stack: undefined) => void }).setSlot(
      0,
      undefined,
    );
    expect(setBlockItemSlot).not.toHaveBeenCalled();
    fixture.destroy();
  });
});
