# P3 Groups Panel verification — 2026-10-20

Focused localhost review of the [current Groups contract](../../GROUPS-PANEL.md).
The isolated browser project contained one UI-placed Stone and 22 UI-created
groups. No test project, browser profile or probe is shipped with the application.

- [Desktop, Raccoon, EN](desktop-raccoon.png)
- [320 px drawer and row menu, Minecraft, VI](narrow-minecraft-vi.png)

## Browser evidence

- Create/rename with Enter and Escape, duplicate-name feedback, returned focus,
  direct visibility/lock and isolate/exit isolate without accidental selection.
- Add/remove selection with overlapping group membership, Undo/Redo, distinct
  metadata deletion and confirmed block deletion, including Cancel and Undo.
- Move preview left committed coordinates unchanged until Save. Save, Cancel,
  out-of-bounds validation and Undo/Redo passed. Opening Move from a narrow
  drawer initially left it covered; the Groups entry now closes the drawer and
  focuses the panel. Desktop/320/390 entry, preview/cancel and focus return passed,
  including the empty-group close-button fallback.
- Empty panel, no-results recovery, 22-group scrolling, and equality of group
  properties/memberships/blocks across an actual reload.
- 24 cases: four themes × EN/VI × desktop/320/390. No horizontal overflow or
  nested controls; rows measured 57 px including their border, row action
  targets 44 × 44 px. Menus remained within viewport bounds.
- 30 additional cases: three Normal fonts plus Small/Large Chakra Petch,
  EN/VI and desktop/320/390. No overflow or control overlap. Keyboard menu
  opening, arrows/Home/End/Enter, Escape and Tab dismissal were exercised;
  narrow Escape kept the drawer open and restored the row trigger. Reduced
  motion naming/focus smoke passed. Final Chrome runtime exception list was empty.

These checks concern editor presentation and existing domain workflows. They
are not an in-Minecraft verification or a comprehensive accessibility audit.
No renderer or project-block hot path changed; counts use the existing service
cache, with a regression guarding transient UI edits from recomputing them.

## Automated verification

- Groups UI/service, Group Move/session, shell interaction and theme contracts:
  87 targeted tests passed.
- Final full suite: 334 files passed, 7 skipped; 2,102 tests passed, 11 skipped.
  Existing jsdom canvas notices remain; real Chrome checks recorded no uncaught
  runtime exceptions.
- App TypeScript check, production build, tool tests (2), scoped Prettier,
  encoding/strict UTF-8/BOM checks and `git diff --check` passed.
- No lint script is configured. No renderer benchmark was run because this
  presentation work adds no project-block or frame-loop hot path.
