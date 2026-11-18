// @ts-expect-error Vitest checks this route contract in Node.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { routes } from '../../app.routes';
import { ProjectScreenComponent } from '../projects/project-screen/project-screen.component';
import { HomepageIntegrationPreviewComponent } from './homepage-integration-preview.component';

describe('HomepageIntegrationPreviewComponent route', () => {
  it('keeps the production root route and adds a separate lazy preview route', async () => {
    const rootRoute = routes.find(({ path }) => path === '');
    const previewRoute = routes.find(({ path }) => path === 'homepage-integration-preview');

    expect(rootRoute?.component).toBe(ProjectScreenComponent);
    expect(previewRoute?.component).toBeUndefined();
    expect(previewRoute?.loadComponent).toBeTypeOf('function');
    expect(await previewRoute?.loadComponent?.()).toBe(HomepageIntegrationPreviewComponent);

    const template = readFileSync(
      'src/app/features/homepage/homepage-integration-preview.component.html',
      'utf8',
    );
    expect(template).toContain('<app-project-screen [integrationPreview]="true" />');
  });
});
