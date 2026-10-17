import {
  AfterViewInit,
  Component,
  ElementRef,
  ErrorHandler,
  OnDestroy,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideImage } from '@lucide/angular';
import type { ProjectSummary } from '../../../core/persistence/project-store/project-store.port';
import { ProjectPreviewService } from '../../../core/persistence/project-preview.service';
import { ProjectScreenWorkflow } from './project-screen-workflow';

@Component({
  selector: 'app-project-screen-preview',
  imports: [LucideImage],
  templateUrl: './project-screen-preview.component.html',
  styleUrl: './project-screen-preview.component.scss',
})
export class ProjectScreenPreviewComponent implements AfterViewInit, OnDestroy {
  private static sharedObserver: IntersectionObserver | undefined;
  private static readonly observedElements = new Map<Element, ProjectScreenPreviewComponent>();
  readonly project = input.required<Pick<ProjectSummary, 'id' | 'updatedAt'>>();
  protected readonly previewUrl = signal<string | undefined>(undefined);
  private readonly shouldLoadPreview = signal(false);
  private readonly workflow = inject(ProjectScreenWorkflow);
  private readonly projectPreviews = inject(ProjectPreviewService);
  private readonly errorHandler = inject(ErrorHandler);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly refreshToken = signal(0);

  constructor() {
    this.projectPreviews.updates.pipe(takeUntilDestroyed()).subscribe((update) => {
      const project = this.project();
      if (project.id === update.projectId && project.updatedAt === update.updatedAt)
        this.refreshToken.update((token) => token + 1);
    });

    effect((onCleanup) => {
      this.refreshToken();
      const shouldLoadPreview = this.shouldLoadPreview();
      const project = this.project();
      this.previewUrl.set(undefined);
      if (!shouldLoadPreview) return;

      let active = true;
      let objectUrl: string | undefined;
      onCleanup(() => {
        active = false;
        if (objectUrl) URL.revokeObjectURL(objectUrl);
      });

      void this.workflow
        .loadProjectPreview(project.id, project.updatedAt)
        .then((preview) => {
          if (!active || !preview) return;
          objectUrl = URL.createObjectURL(preview);
          this.previewUrl.set(objectUrl);
        })
        .catch((error: unknown) => {
          if (active) this.errorHandler.handleError(error);
        });
    });
  }

  ngAfterViewInit(): void {
    if (!ProjectScreenPreviewComponent.observe(this, this.host.nativeElement)) {
      this.shouldLoadPreview.set(true);
    }
  }

  private static observe(component: ProjectScreenPreviewComponent, element: Element): boolean {
    if (typeof IntersectionObserver === 'undefined') return false;
    if (!this.sharedObserver) {
      this.sharedObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries)
            this.observedElements.get(entry.target)?.shouldLoadPreview.set(entry.isIntersecting);
        },
        { rootMargin: '160px' },
      );
    }
    this.observedElements.set(element, component);
    this.sharedObserver.observe(element);
    return true;
  }

  private static release(element: Element): void {
    const component = this.observedElements.get(element);
    if (!component) return;
    this.observedElements.delete(element);
    this.sharedObserver?.unobserve(element);
    if (this.observedElements.size > 0) return;
    this.sharedObserver?.disconnect();
    this.sharedObserver = undefined;
  }

  ngOnDestroy(): void {
    ProjectScreenPreviewComponent.release(this.host.nativeElement);
  }
}
