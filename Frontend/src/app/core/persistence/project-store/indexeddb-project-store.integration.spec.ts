import { afterEach, describe, expect, it, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import type { EditorSettings, ProjectDocument } from '../../domain/project.types';
import { WorkspaceStateService } from '../../workspace/workspace-state.service';
import { IndexedDbProjectStore } from './indexeddb-project-store';

const editorSettings: EditorSettings = {
  currentY: 3,
  layerVisibility: 'current-next',
  referenceLayerOpacity: 0.7,
};

function project(id: string, updatedAt: string): ProjectDocument {
  return {
    schemaVersion: 3,
    id,
    metadata: {
      name: `Project ${id}`,
      minecraftVersion: '1.21.1',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt,
    },
    size: { x: 8, y: 8, z: 8 },
    structureMode: 'vanilla-structure-block',
    blocks: [],
    groups: [],
    decorations: [],
    editorSettings: { ...editorSettings },
  };
}

function legacyRecord(value: ProjectDocument): Record<string, unknown> {
  const { editorSettings: settings, ...document } = value;
  return {
    id: value.id,
    name: value.metadata.name,
    minecraftVersion: value.metadata.minecraftVersion,
    updatedAt: value.metadata.updatedAt,
    document: { ...document, editorSettings: settings },
  };
}

function currentRecord(value: ProjectDocument): Record<string, unknown> {
  const { editorSettings: _settings, ...document } = value;
  return {
    id: value.id,
    name: value.metadata.name,
    minecraftVersion: value.metadata.minecraftVersion,
    updatedAt: value.metadata.updatedAt,
    document,
  };
}

async function createIndexedDbBlob(content: string, type: string): Promise<Blob> {
  const moduleName = ['node', 'buffer'].join(':');
  const bufferModule = (await import(moduleName)) as { Blob: typeof Blob };
  return new bufferModule.Blob([content], { type });
}

function seedVersionSixDatabase(
  factory: IDBFactory,
  databaseName: string,
  records: {
    readonly projects: readonly Record<string, unknown>[];
    readonly recoveries: readonly Record<string, unknown>[];
  },
): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = factory.open(databaseName, 6);
    request.onupgradeneeded = () => {
      const database = request.result;
      const projects = database.createObjectStore('projects', { keyPath: 'id' });
      database.createObjectStore('project-summaries', { keyPath: 'id' });
      const recoveries = database.createObjectStore('recovery-snapshots', { keyPath: 'id' });
      database.createObjectStore('project-editor-settings', { keyPath: 'id' });
      for (const record of records.projects) projects.put(record);
      for (const record of records.recoveries) recoveries.put(record);
    };
    request.onerror = () => reject(request.error ?? new Error('Unable to seed schema version 6'));
    request.onsuccess = () => {
      request.result.close();
      resolve();
    };
  });
}

function seedVersionSevenDatabase(
  factory: IDBFactory,
  databaseName: string,
  canonical: ProjectDocument,
  recovery: ProjectDocument,
  sharedSettings: EditorSettings,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = factory.open(databaseName, 7);
    request.onupgradeneeded = () => {
      const database = request.result;
      database.createObjectStore('projects', { keyPath: 'id' }).put(currentRecord(canonical));
      database.createObjectStore('project-summaries', { keyPath: 'id' });
      database
        .createObjectStore('recovery-snapshots', { keyPath: 'id' })
        .put(currentRecord(recovery));
      database
        .createObjectStore('project-editor-settings', { keyPath: 'id' })
        .put({ id: canonical.id, settings: sharedSettings });
      database.createObjectStore('project-previews', { keyPath: 'id' });
    };
    request.onerror = () => reject(request.error ?? new Error('Unable to seed schema version 7'));
    request.onsuccess = () => {
      request.result.close();
      resolve();
    };
  });
}

describe('IndexedDbProjectStore integration', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('migrates schema version 6 project and recovery data without losing editor settings', async () => {
    const factory = new IDBFactory();
    vi.stubGlobal('indexedDB', factory);
    const databaseName = 'project-store-schema-six-migration';
    const savedProject = project('saved-project', '2026-10-01T00:00:00.000Z');
    const recoveryProject = project('recovery-only', '2026-10-02T00:00:00.000Z');
    const recoveryForSavedProject = {
      ...project(savedProject.id, '2026-10-03T00:00:00.000Z'),
      editorSettings: { ...editorSettings, currentY: 7 },
    };
    await seedVersionSixDatabase(factory, databaseName, {
      projects: [legacyRecord(savedProject)],
      recoveries: [legacyRecord(recoveryProject), legacyRecord(recoveryForSavedProject)],
    });

    const store = new IndexedDbProjectStore(databaseName);
    const [summaries, migratedProject, recovery, recoveryForSaved] = await Promise.all([
      store.list(),
      store.openRecord(savedProject.id),
      store.openRecoveryRecord(recoveryProject.id),
      store.openRecoveryRecord(savedProject.id),
    ]);

    expect(summaries).toHaveLength(1);
    expect(migratedProject?.project.schemaVersion).toBe(3);
    expect(recovery?.project.editorSettings).toEqual(editorSettings);
    expect(recoveryForSaved?.project.editorSettings).toEqual({ ...editorSettings, currentY: 7 });
    expect(migratedProject?.project.editorSettings).toEqual(editorSettings);
    expect(recovery?.project.metadata.updatedAt).toBe(recoveryProject.metadata.updatedAt);

    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = factory.open(databaseName);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
    expect(database.objectStoreNames.contains('project-previews')).toBe(true);
    expect(database.objectStoreNames.contains('recovery-editor-settings')).toBe(true);
    database.close();
  });

  it('preserves readable schema 7 settings while assigning recovery its own settings record', async () => {
    const factory = new IDBFactory();
    vi.stubGlobal('indexedDB', factory);
    const databaseName = 'project-store-schema-seven-migration';
    const canonical = project('schema-seven-project', '2026-10-01T00:00:00.000Z');
    const recovery = { ...canonical, editorSettings: { ...editorSettings, currentY: 8 } };
    await seedVersionSevenDatabase(factory, databaseName, canonical, recovery, editorSettings);

    const store = new IndexedDbProjectStore(databaseName);
    expect((await store.openRecord(canonical.id))?.project.editorSettings).toEqual(editorSettings);
    expect((await store.openRecoveryRecord(canonical.id))?.project.editorSettings).toEqual(
      editorSettings,
    );

    const newRecoverySettings = { ...editorSettings, currentY: 9 };
    await store.saveRecoverySnapshot({ ...recovery, editorSettings: newRecoverySettings });
    expect((await store.openRecord(canonical.id))?.project.editorSettings).toEqual(editorSettings);
    expect((await store.openRecoveryRecord(canonical.id))?.project.editorSettings).toEqual(
      newRecoverySettings,
    );
    await store.deleteRecoverySnapshot(canonical.id);
    expect((await store.openRecord(canonical.id))?.project.editorSettings).toEqual(editorSettings);
    expect(await store.openRecoveryRecord(canonical.id)).toBeUndefined();
  });

  it('keeps previews revision-bound and project data, settings, recovery, and deletion in IndexedDB', async () => {
    vi.stubGlobal('indexedDB', new IDBFactory());
    const store = new IndexedDbProjectStore('project-store-write-workflow');
    const initial = project('workflow-project', '2026-10-01T00:00:00.000Z');
    const preview = await createIndexedDbBlob('webp preview', 'image/webp');
    await store.create(initial, { persistenceToken: 'revision-one' });

    expect(await store.exists(initial.id)).toBe(true);
    expect((await store.open(initial.id))?.id).toBe(initial.id);
    expect((await store.list())[0]?.updatedAt).toBe(initial.metadata.updatedAt);
    expect(await store.savePreview(initial.id, initial.metadata.updatedAt, preview)).toBe(true);
    const storedPreview = await store.openPreview(initial.id, initial.metadata.updatedAt);
    expect(storedPreview?.type).toBe('image/webp');
    expect(await storedPreview?.text()).toBe('webp preview');
    expect(await store.open(initial.id)).not.toHaveProperty('preview');

    const saved = {
      ...initial,
      metadata: { ...initial.metadata, updatedAt: '2026-10-02T00:00:00.000Z' },
    };
    await store.save(saved, { persistenceToken: 'revision-two' });
    expect(await store.openPreview(initial.id, saved.metadata.updatedAt)).toBeUndefined();
    expect(await store.savePreview(initial.id, initial.metadata.updatedAt, preview)).toBe(false);
    expect(await store.openPreview(initial.id, saved.metadata.updatedAt)).toBeUndefined();

    const previewFirst = project('preview-first-race', '2026-10-01T00:00:00.000Z');
    const saveFirst = project('save-first-race', '2026-10-01T00:00:00.000Z');
    await Promise.all([store.create(previewFirst), store.create(saveFirst)]);
    const previewFirstSaved = {
      ...previewFirst,
      metadata: { ...previewFirst.metadata, updatedAt: '2026-10-02T00:00:00.000Z' },
    };
    const saveFirstSaved = {
      ...saveFirst,
      metadata: { ...saveFirst.metadata, updatedAt: '2026-10-02T00:00:00.000Z' },
    };
    await Promise.all([
      store.savePreview(previewFirst.id, previewFirst.metadata.updatedAt, preview),
      store.save(previewFirstSaved),
    ]);
    await Promise.all([
      store.save(saveFirstSaved),
      store.savePreview(saveFirst.id, saveFirst.metadata.updatedAt, preview),
    ]);
    expect(
      await store.openPreview(previewFirst.id, previewFirstSaved.metadata.updatedAt),
    ).toBeUndefined();
    expect(
      await store.openPreview(saveFirst.id, saveFirstSaved.metadata.updatedAt),
    ).toBeUndefined();

    const changedSettings = { ...editorSettings, currentY: 6 };
    await store.saveEditorSettings(initial.id, changedSettings);
    expect((await store.openRecord(initial.id))?.project.editorSettings).toEqual(changedSettings);

    const recoverySettings = {
      ...editorSettings,
      currentY: 5,
      layerVisibility: 'whole-structure' as const,
    };
    const recovery = {
      ...saved,
      editorSettings: recoverySettings,
      blocks: [
        {
          kind: 'missing' as const,
          id: 'example:unknown',
          namespace: 'example',
          position: { x: 1, y: 2, z: 3 },
          state: { variant: 'kept' },
        },
      ],
    };
    await store.saveRecoverySnapshot(recovery, { persistenceToken: 'recovery-two' });
    expect((await store.openRecoveryRecord(initial.id))?.project.blocks).toEqual(recovery.blocks);
    expect((await store.openRecord(initial.id))?.project.editorSettings).toEqual(changedSettings);
    expect((await store.openRecoveryRecord(initial.id))?.project.editorSettings).toEqual(
      recoverySettings,
    );

    const canonicalWorkspace = new WorkspaceStateService();
    await canonicalWorkspace.restore(store, {
      getItem: () => initial.id,
      setItem: () => undefined,
    });
    expect(canonicalWorkspace.restoreStatus()).toBe('recovery-pending');
    canonicalWorkspace.continueWithMain();
    expect(canonicalWorkspace.project()?.editorSettings).toEqual(changedSettings);

    const recoveryWorkspace = new WorkspaceStateService();
    await recoveryWorkspace.restore(store, {
      getItem: () => initial.id,
      setItem: () => undefined,
    });
    await recoveryWorkspace.restoreRecovery();
    expect(recoveryWorkspace.project()?.blocks).toEqual(recovery.blocks);
    expect(recoveryWorkspace.project()?.editorSettings).toEqual(recoverySettings);
    expect((await store.openRecord(initial.id))?.project.editorSettings).toEqual(recoverySettings);
    expect(await store.openRecoverySnapshot(initial.id)).toBeUndefined();

    await store.delete(initial.id);
    await store.delete(previewFirst.id);
    await store.delete(saveFirst.id);
    expect(await store.exists(initial.id)).toBe(false);
    expect(await store.list()).toEqual([]);
    expect(await store.openPreview(initial.id, saved.metadata.updatedAt)).toBeUndefined();
  });
});
