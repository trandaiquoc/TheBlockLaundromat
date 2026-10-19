# P2 Block Browser verification — 2026-10-19

Focused localhost review of the [current Grid/List contract](../../BLOCK-BROWSER-GRID-LIST.md).
The two captures show the final quieter actions: a 28 px Quick Add surface and
an unframed information icon inside separate 44 px minimum targets.

- [Desktop Grid, Minecraft, EN](grid-desktop.png)
- [390 px List drawer, Minecraft, VI](list-narrow.png)

## Browser checks

An isolated Chrome profile loaded real Vanilla Java 1.21.1 assets (906 items),
the local Cobblemon 1.8.1 Fabric JAR (321 placeable items), and a disposable
resource-only test JAR (10,001 items): 11,228 items total. The generated test
archive and profile are not committed. No uploaded mod code was executed.

- 48 layout cases: four themes × EN/VI × 1600/320/390 px × Grid/List.
  No horizontal overflow or preview/action overlap; action targets at least
  44 px. The catalog materialized 10–22 cards or 11 list rows in this matrix.
- All three fonts; Small/Normal/Large sizing at narrow widths; reduced-motion
  keyboard navigation. Large font increases the virtual row height.
- Source counts/filtering, search/empty recovery, active item and query retained
  across view changes, Quick Add/duplicate guard and numeric Quick Bar shortcut.
- Actual sidebar pointer drag and keyboard resize changed the grid between one
  and three columns while retaining source/query/results.
- Home/End moved focus beyond the virtual range. Full long ID, copy feedback,
  details Escape/focus restoration, and keeping the outer narrow drawer open.
- Repeated warmed Grid/List changes added **zero thumbnail enhancement tasks**.
  The final review recorded no uncaught browser runtime exceptions.

These are editor/browser and code regression checks, not an in-Minecraft test,
a comprehensive accessibility audit, or a renderer performance benchmark.
No project-block/frame-loop path changed.

## Automated verification

- Focused browser/item/layout/visibility specs: 18 tests passed.
- Full suite: 334 files passed, 7 skipped; 2,094 tests passed, 11 skipped.
  The first run exposed two stylesheet assertions tied to the old presentation;
  they now check the current focus rule and selected metadata owner/color.
- App TypeScript check, production build, tool tests (2), scoped Prettier,
  frontend encoding, strict UTF-8/BOM check and `git diff --check`: passed.
- No lint script is configured. Existing jsdom canvas notices occurred during
  the full suite; browser runtime checks used real Chrome.
