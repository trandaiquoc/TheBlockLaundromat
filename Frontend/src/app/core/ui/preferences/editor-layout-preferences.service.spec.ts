import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { EditorLayoutPreferencesService } from './editor-layout-preferences.service';
import { UI_PREFERENCES_KEY, UiPreferencesService } from './ui-preferences.service';

describe('EditorLayoutPreferencesService', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    localStorage.removeItem(UI_PREFERENCES_KEY);
  });

  it('restores both sidebars to the shared default width', () => {
    const layout = TestBed.inject(EditorLayoutPreferencesService);
    const preferences = TestBed.inject(UiPreferencesService);
    preferences.setLayout({ leftSidebarWidth: 400, rightSidebarWidth: 460 });

    layout.reset();

    expect(layout.preferences()).toMatchObject({
      leftSidebarWidth: 340,
      rightSidebarWidth: 340,
    });
  });
});
