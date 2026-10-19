import { Component, OnDestroy, inject, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { IDBFactory } from 'fake-indexeddb';
import * as THREE from 'three';
import { filter, firstValueFrom } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ContentAssetRuntimeService } from '../assets/content-asset-runtime.service';
import type { ProjectDocument } from '../domain/project.types';
import { ThreeViewportEngine } from '../renderer/engine/three-viewport-engine';
import { editorCanDeactivate, EditorLeaveCoordinator } from './editor-leave-coordinator.service';
import { PROJECT_STORE } from './project-store/project-store.token';
import { IndexedDbProjectStore } from './project-store/indexeddb-project-store';
import { ProjectPreviewService } from './project-preview.service';
import { ProjectAutosaveService } from './autosave/project-autosave.service';
import { DialogService } from '../ui/dialog/dialog.service';
import { I18nService } from '../ui/localization/i18n.service';
import { ViewportComponent } from '../../features/editor/viewport/three-d-viewport/viewport.component';
import { WorkspaceStateService } from '../workspace/workspace-state.service';

const project: ProjectDocument = {
  schemaVersion: 3,
  id: 'preview-route-teardown',
  metadata: {
    name: 'Preview route teardown',
    minecraftVersion: '1.21.1',
    createdAt: '2026-10-18T00:00:00.000Z',
    updatedAt: '2026-10-18T00:00:00.000Z',
  },
  size: { x: 4, y: 4, z: 4 },
  structureMode: 'vanilla-structure-block',
  blocks: [
    {
      kind: 'resolved',
      id: 'minecraft:stone',
      namespace: 'minecraft',
      position: { x: 0, y: 0, z: 0 },
      state: {},
    },
  ],
  groups: [],
  decorations: [],
  editorSettings: { currentY: 0, layerVisibility: 'current-only', referenceLayerOpacity: 0.5 },
};
@Component({
  imports: [ViewportComponent],
  template: '<app-viewport />',
})
class PreviewEditorRouteComponent implements OnDestroy {
  private readonly viewport = viewChild.required(ViewportComponent);
  private readonly workspace = inject(WorkspaceStateService);
  private readonly previews = inject(ProjectPreviewService);
  private captureFinished!: () => void;
  readonly captureCompletion = new Promise<void>((resolve) => (this.captureFinished = resolve));
  captureResult?: Blob;
  private readonly unregisterCapture = inject(EditorLeaveCoordinator).registerProjectPreviewCapture(
    () => {
      const snapshot = this.workspace.project();
      if (!snapshot) return;
      const task = this.viewport()
        .captureProjectPreview(snapshot)
        .then(async (preview) => {
          this.captureResult = preview;
          if (preview)
            await this.previews.savePreview(snapshot.id, snapshot.metadata.updatedAt, preview);
        });
      void task.then(this.captureFinished, this.captureFinished);
      return task;
    },
  );

  ngOnDestroy(): void {
    this.unregisterCapture();
  }
}

@Component({
  template: '<main>Projects</main>',
})
class ProjectListRouteComponent {}

function createReadbackRenderer(
  pixels: Uint8Array,
  isGpuReady: () => boolean,
): {
  renderer: THREE.WebGLRenderer;
  readPixels: ReturnType<typeof vi.fn>;
  deleteBuffer: ReturnType<typeof vi.fn>;
  deleteSync: ReturnType<typeof vi.fn>;
} {
  const gl = {
    PIXEL_PACK_BUFFER_BINDING: 0x88ed,
    PIXEL_PACK_BUFFER: 0x88eb,
    STREAM_READ: 0x88e1,
    RGBA: 0x1908,
    UNSIGNED_BYTE: 0x1401,
    SYNC_GPU_COMMANDS_COMPLETE: 0x9117,
    SYNC_FLUSH_COMMANDS_BIT: 1,
    WAIT_FAILED: 0x911d,
    TIMEOUT_EXPIRED: 0x911b,
    ALREADY_SIGNALED: 0x911a,
    CONDITION_SATISFIED: 0x911c,
    getParameter: vi.fn(() => null),
    isContextLost: vi.fn(() => false),
    createBuffer: vi.fn(() => ({}) as WebGLBuffer),
    bindBuffer: vi.fn(),
    bufferData: vi.fn(),
    readPixels: vi.fn(),
    fenceSync: vi.fn(() => ({}) as WebGLSync),
    flush: vi.fn(),
    clientWaitSync: vi.fn(() => (isGpuReady() ? 0x911a : 0x911b)),
    getBufferSubData: vi.fn((_target, _offset, output: Uint8Array) => output.set(pixels)),
    deleteSync: vi.fn(),
    deleteBuffer: vi.fn(),
  } as unknown as WebGL2RenderingContext;
  const renderer = {
    domElement: { remove: vi.fn() },
    getRenderTarget: () => null,
    getViewport: (target: THREE.Vector4) => target.set(0, 0, 800, 600),
    getScissor: (target: THREE.Vector4) => target.set(0, 0, 800, 600),
    getScissorTest: () => false,
    getClearColor: (target: THREE.Color) => target.set(0x123456),
    getClearAlpha: () => 1,
    getContext: () => gl,
    setRenderTarget: vi.fn(),
    setViewport: vi.fn(),
    setScissor: vi.fn(),
    setScissorTest: vi.fn(),
    setClearColor: vi.fn(),
    clear: vi.fn(),
    render: vi.fn(),
    dispose: vi.fn(),
  } as unknown as THREE.WebGLRenderer;
  return {
    renderer,
    readPixels: vi.mocked(gl.readPixels),
    deleteBuffer: vi.mocked(gl.deleteBuffer),
    deleteSync: vi.mocked(gl.deleteSync),
  };
}

describe('project preview route and viewport teardown integration', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('persists a completed GPU readback after router teardown and updates the loaded Homepage card', async () => {
    vi.stubGlobal('indexedDB', new IDBFactory());
    const imagePixels = new Uint8Array(256 * 144 * 4).fill(20);
    imagePixels.set([1, 2, 3, 255], 0);
    imagePixels.set([7, 8, 9, 255], 143 * 256 * 4);
    let gpuReady = false;
    const { renderer, readPixels, deleteBuffer, deleteSync } = createReadbackRenderer(
      imagePixels,
      () => gpuReady,
    );
    let rendererForMount = renderer;
    const encodedPixels: Uint8ClampedArray[] = [];
    let encodedImageCount = 0;
    vi.stubGlobal(
      'OffscreenCanvas',
      class {
        constructor(
          readonly width: number,
          readonly height: number,
        ) {}
        getContext() {
          return {
            createImageData: () => ({ data: new Uint8ClampedArray(this.width * this.height * 4) }),
            putImageData: (image: ImageData) => encodedPixels.push(image.data),
          };
        }
        async convertToBlob(): Promise<Blob> {
          const moduleName = ['node', 'buffer'].join(':');
          const bufferModule = (await import(moduleName)) as { Blob: typeof Blob };
          encodedImageCount++;
          return new bufferModule.Blob([`encoded-webp-${encodedImageCount}`], {
            type: 'image/webp',
          });
        }
      },
    );

    const store = new IndexedDbProjectStore('preview-route-teardown-integration');
    await store.create(project);
    await TestBed.configureTestingModule({
      imports: [PreviewEditorRouteComponent, ProjectListRouteComponent],
      providers: [
        provideRouter([
          {
            path: 'editor',
            component: PreviewEditorRouteComponent,
            canDeactivate: [editorCanDeactivate],
          },
          { path: '', component: ProjectListRouteComponent },
        ]),
        { provide: PROJECT_STORE, useValue: store },
        {
          provide: ProjectAutosaveService,
          useValue: { isUnsafeDirty: false, flush: vi.fn(async () => undefined) },
        },
        {
          provide: ContentAssetRuntimeService,
          useValue: {
            visualProvider: () => undefined,
            generation: () => 0,
            contentReady: () => false,
            resourceAvailabilitySettled: () => true,
            sources: { resources: { textureUrl: () => undefined } },
            contentRestore: () => ({ phase: 'ready' }),
            diagnostics: () => ({}),
            status: () => 'ready',
          },
        },
        { provide: DialogService, useValue: { confirm: vi.fn(async () => false) } },
        { provide: I18nService, useValue: { t: (key: string) => key } },
      ],
    })
      .overrideComponent(ViewportComponent, { set: { template: '<div #host></div>' } })
      .compileComponents();

    vi.spyOn(ThreeViewportEngine.prototype, 'mount').mockImplementation(function (
      this: ThreeViewportEngine,
    ) {
      (this as unknown as { renderer: THREE.WebGLRenderer }).renderer = rendererForMount;
    });
    vi.spyOn(ThreeViewportEngine.prototype, 'update').mockImplementation(() => undefined);
    vi.spyOn(ThreeViewportEngine.prototype, 'diagnostics').mockReturnValue({} as never);

    const workspace = TestBed.inject(WorkspaceStateService);
    workspace.activate(project, undefined);
    const harness = await RouterTestingHarness.create('/editor');
    const editor = harness.routeDebugElement?.componentInstance as PreviewEditorRouteComponent;
    const viewport = harness.routeDebugElement?.query(
      (node) => node.componentInstance instanceof ViewportComponent,
    ).componentInstance as ViewportComponent;
    const engine = (viewport as unknown as { engine: ThreeViewportEngine }).engine;
    const internals = engine as unknown as {
      project: ProjectDocument;
      scene: THREE.Scene;
      canonicalRoot: THREE.Group;
    };
    internals.project = project;
    internals.scene.add(internals.canonicalRoot);
    const targetDispose = vi.spyOn(THREE.WebGLRenderTarget.prototype, 'dispose');
    const previews = TestBed.inject(ProjectPreviewService);
    const savedUpdate = firstValueFrom(
      previews.updates.pipe(filter((update) => update.projectId === project.id)),
    );

    await harness.navigateByUrl('/');
    expect(renderer.domElement.remove).toHaveBeenCalledOnce();
    expect(harness.routeNativeElement?.textContent).toContain('Projects');
    expect(renderer.dispose).not.toHaveBeenCalled();
    expect(targetDispose).not.toHaveBeenCalled();

    gpuReady = true;
    await editor.captureCompletion;
    const update = await savedUpdate;
    const storedPreview = await store.openPreview(project.id, project.metadata.updatedAt);
    expect(editor.captureResult?.type).toBe('image/webp');
    expect(editor.captureResult?.size).toBeGreaterThan(0);
    expect(update).toEqual({ projectId: project.id, updatedAt: project.metadata.updatedAt });
    expect(storedPreview?.type).toBe('image/webp');
    expect(storedPreview?.size).toBeGreaterThan(0);
    expect(readPixels).toHaveBeenCalledOnce();
    expect(deleteBuffer).toHaveBeenCalledOnce();
    expect(deleteSync).toHaveBeenCalledOnce();
    expect(encodedPixels).toHaveLength(1);
    expect([...encodedPixels[0].slice(0, 4)]).toEqual([7, 8, 9, 255]);
    expect([...encodedPixels[0].slice(143 * 256 * 4, 143 * 256 * 4 + 4)]).toEqual([1, 2, 3, 255]);
    expect(targetDispose).toHaveBeenCalledOnce();
    expect(renderer.dispose).toHaveBeenCalledOnce();

    const updatedProject: ProjectDocument = {
      ...project,
      metadata: { ...project.metadata, updatedAt: '2026-10-18T00:00:01.000Z' },
      blocks: [
        {
          ...project.blocks[0],
          position: { x: 1, y: 0, z: 0 },
        },
      ],
    };
    await store.save(updatedProject);
    expect(await store.openPreview(project.id, project.metadata.updatedAt)).toBeUndefined();
    const reopenedProject = await store.open(project.id);
    expect(reopenedProject?.metadata.updatedAt).toBe(updatedProject.metadata.updatedAt);
    if (!reopenedProject) throw new Error('Updated project did not reopen from IndexedDB');

    workspace.activate(reopenedProject, undefined);
    const updatedPixels = new Uint8Array(256 * 144 * 4).fill(30);
    updatedPixels.set([11, 12, 13, 255], 0);
    updatedPixels.set([17, 18, 19, 255], 143 * 256 * 4);
    let updatedGpuReady = false;
    const updatedReadback = createReadbackRenderer(updatedPixels, () => updatedGpuReady);
    rendererForMount = updatedReadback.renderer;
    const updatedEditor = await harness.navigateByUrl('/editor', PreviewEditorRouteComponent);
    const updatedViewport = harness.routeDebugElement?.query(
      (node) => node.componentInstance instanceof ViewportComponent,
    ).componentInstance as ViewportComponent;
    const updatedEngine = (updatedViewport as unknown as { engine: ThreeViewportEngine }).engine;
    const updatedInternals = updatedEngine as unknown as {
      project: ProjectDocument;
      scene: THREE.Scene;
      canonicalRoot: THREE.Group;
    };
    updatedInternals.project = reopenedProject;
    updatedInternals.scene.add(updatedInternals.canonicalRoot);
    const updatedPreviewSaved = firstValueFrom(
      previews.updates.pipe(
        filter(
          (entry) =>
            entry.projectId === reopenedProject.id &&
            entry.updatedAt === reopenedProject.metadata.updatedAt,
        ),
      ),
    );

    await harness.navigateByUrl('/');
    expect(harness.routeNativeElement?.textContent).toContain('Projects');
    expect(updatedReadback.renderer.domElement.remove).toHaveBeenCalledOnce();

    updatedGpuReady = true;
    await updatedEditor.captureCompletion;
    await updatedPreviewSaved;
    const replacementPreview = await store.openPreview(
      reopenedProject.id,
      reopenedProject.metadata.updatedAt,
    );
    expect(updatedEditor.captureResult?.type).toBe('image/webp');
    expect(updatedEditor.captureResult?.size).toBeGreaterThan(0);
    expect(replacementPreview?.type).toBe('image/webp');
    expect(replacementPreview?.size).toBeGreaterThan(0);
    expect(await replacementPreview?.text()).toBe('encoded-webp-2');
    expect(updatedReadback.readPixels).toHaveBeenCalledOnce();
    expect(updatedReadback.deleteBuffer).toHaveBeenCalledOnce();
    expect(updatedReadback.deleteSync).toHaveBeenCalledOnce();
    expect(encodedPixels).toHaveLength(2);
    expect([...encodedPixels[1].slice(0, 4)]).toEqual([17, 18, 19, 255]);
    expect([...encodedPixels[1].slice(143 * 256 * 4, 143 * 256 * 4 + 4)]).toEqual([
      11, 12, 13, 255,
    ]);
    expect(targetDispose).toHaveBeenCalledTimes(2);
    expect(renderer.dispose).toHaveBeenCalledOnce();
    expect(updatedReadback.renderer.dispose).toHaveBeenCalledOnce();

    harness.fixture.destroy();
  });
});
