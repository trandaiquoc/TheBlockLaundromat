// @ts-expect-error Vitest checks this template contract in Node.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const templatePath = 'src/app/features/projects/project-utilities.component.html';

describe('ProjectUtilitiesComponent', () => {
  it('keeps the Structure JSON and project package utilities reusable', () => {
    const template = String(readFileSync(templatePath, 'utf8'));

    expect(template).toContain("i18n.t('createFromStructureJson')");
    expect(template).toContain("i18n.t('importProjectPackage')");
    expect(template).toContain("i18n.t('backupRestoreCopy')");
    expect(template).toContain('accept="application/json,.json"');
    expect(template).toContain('(keydown.escape)="closeStructureJsonImport()"');
    expect(template).toContain('[cdkTrapFocusAutoCapture]="true"');
  });
});
