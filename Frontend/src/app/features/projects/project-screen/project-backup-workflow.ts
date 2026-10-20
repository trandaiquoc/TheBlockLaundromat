import { Inject, Injectable, signal } from '@angular/core';
import { ProjectDocument } from '../../../core/domain/project.types';
import { ProjectPackageError } from '../../../core/persistence/project-package/project-package';
import { ProjectPersistenceService } from '../../../core/persistence/project-persistence.service';
import { PROJECT_STORE } from '../../../core/persistence/project-store/project-store.token';
import { ProjectStore } from '../../../core/persistence/project-store/project-store.port';

export type BackupFailure =
  | 'file-type'
  | 'file-too-large'
  | 'read'
  | 'invalid-json'
  | 'not-project-package'
  | 'unsupported-package-version'
  | 'unsupported-project-schema'
  | 'invalid-project-data'
  | 'storage';

/** Owns the file-independent backup preview and safe, non-overwriting restore. */
@Injectable()
export class ProjectBackupWorkflow {
  private readonly persistence: ProjectPersistenceService;
  private generation = 0;
  private readonly previewState = signal<ProjectDocument | undefined>(undefined);
  private readonly collisionState = signal(false);
  private readonly failureState = signal<BackupFailure | undefined>(undefined);
  private readonly busyState = signal<'reading' | 'saving' | undefined>(undefined);
  readonly preview = this.previewState.asReadonly();
  readonly collision = this.collisionState.asReadonly();
  readonly failure = this.failureState.asReadonly();
  readonly busy = this.busyState.asReadonly();

  constructor(@Inject(PROJECT_STORE) store: ProjectStore) {
    this.persistence = new ProjectPersistenceService(store);
  }

  reset(): void {
    this.generation++;
    this.previewState.set(undefined);
    this.collisionState.set(false);
    this.failureState.set(undefined);
    this.busyState.set(undefined);
  }

  async selectFile(file: File): Promise<void> {
    this.reset();
    const generation = this.generation;
    if (!file.name.toLowerCase().endsWith('.json')) {
      this.failureState.set('file-type');
      return;
    }
    if (file.size > 64 * 1024 * 1024) {
      this.failureState.set('file-too-large');
      return;
    }
    this.busyState.set('reading');
    let serialized: string;
    try {
      serialized = await file.text();
    } catch {
      if (generation === this.generation) {
        this.busyState.set(undefined);
        this.failureState.set('read');
      }
      return;
    }
    if (generation !== this.generation) return;
    try {
      const project = this.persistence.importPackage(serialized);
      const collision = await this.persistence.exists(project.id);
      if (generation !== this.generation) return;
      this.previewState.set(project);
      this.collisionState.set(collision);
    } catch (error) {
      if (generation !== this.generation) return;
      this.failureState.set(error instanceof ProjectPackageError ? error.category : 'storage');
    } finally {
      if (generation === this.generation) this.busyState.set(undefined);
    }
  }

  async restore(): Promise<ProjectDocument | undefined> {
    const preview = this.previewState();
    if (!preview || this.busyState()) return undefined;
    const generation = this.generation;
    this.busyState.set('saving');
    this.failureState.set(undefined);
    try {
      // Recheck at commit time: an existing project is never replaced by an import.
      const collision = await this.persistence.exists(preview.id);
      if (generation !== this.generation) return undefined;
      const project = collision ? { ...preview, id: crypto.randomUUID() } : preview;
      await this.persistence.createValidatedImportedProject(project);
      if (generation !== this.generation) return undefined;
      this.previewState.set(undefined);
      return project;
    } catch {
      if (generation === this.generation) this.failureState.set('storage');
      return undefined;
    } finally {
      if (generation === this.generation) this.busyState.set(undefined);
    }
  }

  async export(id: string): Promise<{ name: string; content: string } | undefined> {
    const project = await this.persistence.open(id);
    if (!project) return undefined;
    return { name: project.metadata.name, content: this.persistence.exportPackage(project) };
  }
}
