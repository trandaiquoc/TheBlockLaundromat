import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DialogService } from '../../../core/ui/dialog/dialog.service';
import { GroupService } from '../../../core/editor/groups/group.service';
import { SelectionService } from '../../../core/editor/selection/selection.service';
import { HistoryService } from '../../../core/editor/history/history.service';
import { BlockLibraryService } from '../../../core/blocks/catalog/block-library.service';
import { ProjectBlockRuntimeIndex } from '../../../core/editor/runtime/project-block-runtime-index';
import { WorkspaceStateService } from '../../../core/workspace/workspace-state.service';
import type { ProjectDocument } from '../../../core/domain/project.types';
import { GroupsPanelComponent } from './groups-panel.component';

const project: ProjectDocument = {
  schemaVersion: 3,
  id: 'groups-ui',
  metadata: { name: 'Groups UI', minecraftVersion: '1.21.1', createdAt: '', updatedAt: '' },
  structureMode: 'vanilla-structure-block',
  size: { x: 16, y: 16, z: 16 },
  editorSettings: { currentY: 0, layerVisibility: 'current-only', referenceLayerOpacity: 0.15 },
  groups: [
    { id: 'roof', name: 'Roof', visible: true, locked: false },
    { id: 'walls', name: 'Walls', visible: false, locked: true },
  ],
  blocks: [
    {
      kind: 'resolved',
      id: 'minecraft:stone',
      namespace: 'minecraft',
      state: {},
      position: { x: 1, y: 0, z: 1 },
      groupIds: ['roof'],
    },
  ],
};

describe('GroupsPanelComponent interactions', () => {
  afterEach(() => TestBed.resetTestingModule());
  function setup(input = project) {
    const workspace = new WorkspaceStateService(),
      runtimeIndex = new ProjectBlockRuntimeIndex(),
      selection = new SelectionService(runtimeIndex),
      history = new HistoryService(workspace, undefined, runtimeIndex);
    runtimeIndex.ensure(input);
    workspace.publishProject(input);
    const confirm = vi.fn(async () => false);
    TestBed.configureTestingModule({
      providers: [
        { provide: WorkspaceStateService, useValue: workspace },
        { provide: SelectionService, useValue: selection },
        { provide: DialogService, useValue: { confirm } },
        {
          provide: GroupService,
          useFactory: () =>
            new GroupService(workspace, selection, history, TestBed.inject(BlockLibraryService)),
        },
      ],
    });
    const fixture = TestBed.createComponent(GroupsPanelComponent),
      component = fixture.componentInstance,
      groups = TestBed.inject(GroupService);
    document.body.append(fixture.nativeElement);
    fixture.detectChanges();
    const query = <T extends Element = HTMLElement>(selector: string): T => {
      const element = fixture.nativeElement.querySelector(selector);
      if (!element) throw Error('Missing ' + selector);
      return element;
    };
    const click = (selector: string) => {
      query<HTMLButtonElement>(selector).click();
      fixture.detectChanges();
    };
    const type = (name: string) => {
      const input = query<HTMLInputElement>('#group-name-input');
      input.value = name;
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    };
    const key = (selector: string, key: string, keyCode?: number) => {
      const event = new KeyboardEvent('keydown', { key, keyCode, bubbles: true, cancelable: true });
      query(selector).dispatchEvent(event);
      fixture.detectChanges();
      return event;
    };
    return {
      fixture,
      component,
      workspace,
      groups,
      selection,
      history,
      confirm,
      query,
      click,
      type,
      key,
    };
  }
  it('opens a single inline create form, validates normalized names and restores focus on cancel/create', async () => {
    const { fixture, workspace, groups, query, click, type, key } = setup();
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
    click('.new-group');
    await fixture.whenStable();
    expect(document.activeElement).toBe(query('#group-name-input'));
    key('#group-name-input', 'Enter');
    expect(query('#group-name-error').textContent).toContain('Enter a group name');
    type(' Ｒｏｏｆ ');
    expect(query<HTMLButtonElement>('.name-save').disabled).toBe(true);
    expect(query('#group-name-error').textContent).toContain('already exists');
    key('#group-name-input', 'Enter');
    expect(workspace.project()?.groups).toHaveLength(2);
    const escape = key('#group-name-input', 'Escape');
    await fixture.whenStable();
    expect(escape.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(query('.new-group'));
    click('.new-group');
    type(' Entrance ');
    key('#group-name-input', 'Enter');
    await fixture.whenStable();
    expect(workspace.project()?.groups).toHaveLength(3);
    expect(groups.activeGroup()?.name).toBe('Entrance');
    expect(document.activeElement).toBe(
      query(`[data-group-id="${groups.activeGroupId()}"] [data-action="select"]`),
    );
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
  });
  it('toggles row visibility and lock without reselecting, isolating or resetting a move', () => {
    const { groups, workspace, click, query } = setup();
    expect(query('[data-group-id="walls"]').classList.contains('is-locked')).toBe(true);
    expect(query('[data-group-id="walls"]').classList.contains('is-hidden')).toBe(true);
    groups.select('roof');
    groups.isolateActive();
    groups.setMoveOffset('x', 2);
    click('[data-group-id="walls"] [data-action="visibility"]');
    click('[data-group-id="walls"] [data-action="lock"]');
    expect(groups.activeGroupId()).toBe('roof');
    expect(groups.isolatedGroupId()).toBe('roof');
    expect(groups.moveOffset().x).toBe(2);
    expect(workspace.project()?.groups[1]).toMatchObject({ visible: true, locked: false });
    expect(query('[data-group-id="roof"]').classList.contains('active')).toBe(true);
    expect(query('[data-group-id="roof"]').classList.contains('isolated')).toBe(true);
    expect(
      query('[data-group-id="roof"] [data-action="select"]').getAttribute('aria-pressed'),
    ).toBe('true');
    expect(
      query('[data-group-id="roof"]').querySelector('.workspace-selection-indicator'),
    ).not.toBeNull();
    expect(query('[data-group-id="walls"]').querySelector('button button')).toBeNull();
    click('[data-group-id="walls"] [data-action="select"]');
    expect(query('[data-group-id="roof"]').classList.contains('active')).toBe(false);
    expect(
      query('[data-group-id="roof"]').querySelector('.workspace-selection-indicator'),
    ).toBeNull();
    expect(
      query('[data-group-id="walls"] [data-action="select"]').getAttribute('aria-pressed'),
    ).toBe('true');
    expect(groups.isolatedGroupId()).toBeUndefined();
    expect(groups.moveOffset().x).toBe(0);
  });
  it('opens a keyboard menu without selection, closes only the menu on Escape, and renames inline', async () => {
    const { fixture, groups, component, query, click, type, key } = setup();
    click('[data-group-id="walls"] [data-action="menu"]');
    await fixture.whenStable();
    expect(groups.activeGroupId()).toBeUndefined();
    const menu = document.querySelector<HTMLElement>('.group-menu')!;
    expect(menu).not.toBeNull();
    const bubble = vi.fn();
    const outerShortcut = (event: KeyboardEvent) => {
      if (!event.defaultPrevented) bubble(event);
    };
    document.body.addEventListener('keydown', outerShortcut);
    menu.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true, cancelable: true }),
    );
    await fixture.whenStable();
    expect(document.querySelector('.group-menu')).toBeNull();
    expect(bubble).not.toHaveBeenCalled();
    document.body.removeEventListener('keydown', outerShortcut);
    expect(document.activeElement).toBe(query('[data-group-id="walls"] [data-action="menu"]'));
    component['beginRename'](project.groups[1]);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.activeElement).toBe(query('#group-name-input'));
    type('Roof');
    expect(query<HTMLButtonElement>('.name-save').disabled).toBe(true);
    type('Walls renamed');
    key('#group-name-input', 'Enter');
    await fixture.whenStable();
    expect(groups.activeGroupId()).toBeUndefined();
    expect(document.activeElement).toBe(query('[data-group-id="walls"] [data-action="menu"]'));
    expect(query('[data-group-id="walls"]').textContent).toContain('Walls renamed');
  });
  it('retains multi-group membership, selection actions, lock guards and atomic undo/redo', () => {
    const { workspace, groups, selection, history, click, fixture } = setup();
    groups.setLocked('walls', false);
    selection.select({ x: 1, y: 0, z: 1 });
    click('[data-group-id="walls"] [data-action="select"]');
    click('[data-action="add"]');
    expect(workspace.project()?.blocks[0].groupIds).toEqual(['roof', 'walls']);
    click('[data-action="remove"]');
    expect(workspace.project()?.blocks[0].groupIds).toEqual(['roof']);
    history.undo();
    expect(workspace.project()?.blocks[0].groupIds).toEqual(['roof', 'walls']);
    history.redo();
    expect(workspace.project()?.blocks[0].groupIds).toEqual(['roof']);
    groups.setLocked('walls', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-action="add"]').disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('[data-action="remove"]').disabled).toBe(true);
  });
  it('keeps delete metadata distinct from confirmed block deletion and rejects late confirmations', async () => {
    const { component, workspace, groups, confirm, history } = setup();
    groups.select('roof');
    await component['deleteGroupBlocks'](project.groups[0]);
    expect(workspace.project()?.blocks).toHaveLength(1);
    confirm.mockResolvedValueOnce(true);
    await component['deleteGroupBlocks'](project.groups[0]);
    expect(workspace.project()?.blocks).toHaveLength(0);
    expect(workspace.project()?.groups).toHaveLength(2);
    history.undo();
    component['deleteGroup']('roof');
    expect(workspace.project()?.blocks).toHaveLength(1);
    expect(workspace.project()?.groups).toHaveLength(1);
    expect(workspace.project()?.blocks[0].groupIds).toEqual([]);
    history.undo();
    groups.select('roof');
    let resolve: (value: boolean) => void = () => {};
    confirm.mockImplementationOnce(
      () =>
        new Promise<boolean>((r) => {
          resolve = r;
        }),
    );
    const pending = component['deleteGroupBlocks'](project.groups[0]);
    groups.select('walls');
    resolve(true);
    await pending;
    expect(workspace.project()?.blocks).toHaveLength(1);
  });
  it('reuses computed group counts for transient presentation edits and preserves Move output', () => {
    const { groups, fixture, component, click, query } = setup();
    const count = vi.spyOn(groups, 'groupBlockCount');
    const move = vi.fn();
    component.movePanelToggle.subscribe(move);
    click('[data-group-id="roof"] [data-action="select"]');
    click('[data-action="move"]');
    expect(move).toHaveBeenCalledTimes(1);
    click('.new-group');
    component['draftName'].set('Draft');
    fixture.detectChanges();
    component['cancelName']();
    fixture.detectChanges();
    expect(count).not.toHaveBeenCalled();
    component['groupSearch'].set('unlocked');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.group-item')).toHaveLength(1);
    expect(query('.group-item').textContent).toContain('Roof');
  });
  it('discards an inline edit when its project changes, including reused group IDs', () => {
    const { component, fixture, workspace } = setup();
    component['beginRename'](project.groups[0]);
    fixture.detectChanges();
    component['draftName'].set('Old project draft');
    workspace.publishProject({ ...project, id: 'another-project' });
    component['submitName'](new Event('submit', { cancelable: true }));
    fixture.detectChanges();
    expect(component['editor']()).toBeUndefined();
    expect(workspace.project()?.groups[0].name).toBe('Roof');
  });
});
