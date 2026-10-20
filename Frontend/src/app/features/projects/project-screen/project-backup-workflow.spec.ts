import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_EDITOR_SETTINGS } from '../../../core/domain/editor-settings';
import { ProjectDocument } from '../../../core/domain/project.types';
import { serializeProjectPackage } from '../../../core/persistence/project-package/project-package';
import { ProjectStore } from '../../../core/persistence/project-store/project-store.port';
import { ProjectBackupWorkflow } from './project-backup-workflow';

const project: ProjectDocument = {
  schemaVersion: 3,
  id: 'original',
  metadata: {
    name: 'Backup fixture',
    minecraftVersion: '1.21.1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  size: { x: 4, y: 4, z: 4 },
  structureMode: 'vanilla-structure-block',
  blocks: [],
  groups: [],
  decorations: [],
  editorSettings: { ...DEFAULT_EDITOR_SETTINGS },
};

function setup(initial: ProjectDocument[] = []) {
  const projects = new Map(initial.map((entry) => [entry.id, entry]));
  const store = {
    exists: vi.fn(async (id: string) => projects.has(id)),
    open: vi.fn(async (id: string) => projects.get(id)),
    create: vi.fn(async (entry: ProjectDocument) => {
      if (projects.has(entry.id)) throw new Error('Duplicate ID');
      projects.set(entry.id, entry);
    }),
  } as unknown as ProjectStore;
  return { workflow: new ProjectBackupWorkflow(store), projects, store };
}

function backupFile(content: string): File {
  return new File([content], 'project.tbl-project.json', { type: 'application/json' });
}

describe('ProjectBackupWorkflow', () => {
  it('exports and restores the real package without changing project content', async () => {
    const { workflow, projects } = setup([project]);
    const exported = await workflow.export(project.id);
    expect(exported?.content).toBe(serializeProjectPackage(project));
    await workflow.selectFile(backupFile(exported!.content));
    expect(workflow.collision()).toBe(true);
    const restored = await workflow.restore();
    expect(restored?.id).not.toBe(project.id);
    expect({ ...restored, id: project.id }).toEqual(project);
    expect(projects.get(project.id)).toEqual(project);
    expect(projects.get(restored!.id)).toEqual(restored);
  });

  it('rejects invalid input before storage and preserves the preview on storage failure', async () => {
    const { workflow, store } = setup();
    await workflow.selectFile(backupFile('{'));
    expect(workflow.failure()).toBe('invalid-json');
    expect(workflow.preview()).toBeUndefined();
    await workflow.selectFile(backupFile(serializeProjectPackage(project)));
    expect(workflow.preview()?.id).toBe(project.id);
    vi.mocked(store.create).mockRejectedValueOnce(new Error('Storage failed'));
    expect(await workflow.restore()).toBeUndefined();
    expect(workflow.failure()).toBe('storage');
    expect(workflow.preview()?.id).toBe(project.id);
  });

  it('rechecks a newly occupied ID before restore and never overwrites it', async () => {
    const { workflow, projects } = setup();
    await workflow.selectFile(backupFile(serializeProjectPackage(project)));
    expect(workflow.collision()).toBe(false);
    projects.set(project.id, project);
    const restored = await workflow.restore();
    expect(restored?.id).not.toBe(project.id);
    expect(projects.size).toBe(2);
  });

  it('rejects the wrong file type and ignores a cancelled pending read', async () => {
    const { workflow } = setup();
    await workflow.selectFile(new File(['{}'], 'archive.zip'));
    expect(workflow.failure()).toBe('file-type');

    let finishRead: (content: string) => void = () => undefined;
    const pendingFile = {
      name: 'backup.json',
      size: 100,
      text: () => new Promise<string>((resolve) => (finishRead = resolve)),
    } as File;
    const reading = workflow.selectFile(pendingFile);
    workflow.reset();
    finishRead(serializeProjectPackage(project));
    await reading;
    expect(workflow.preview()).toBeUndefined();
    expect(workflow.busy()).toBeUndefined();
  });
});
