# 2026-10-19 responsive Workspace and contextual Inspector

Focused P0/P1 evidence from an isolated local Chrome profile and the Angular dev
server. No existing user projects were opened or changed. The before capture
comes from the design exploration at baseline `fc16bceb`, the same HEAD used to
start this implementation. After captures use the P0/P1 implementation.

| Capture                                                            | Purpose                                                                                      |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| [Before: narrow Y-Layer](before-narrow-y-layer.png)                | Minecraft, Vietnamese, 320 x 740; canvas measured 123 px high                                |
| [After: narrow Y-Layer](after-narrow-y-layer.png)                  | Same theme, locale and viewport size; canvas measures 392 px high with all commands retained |
| [After: collapsed Inspector](after-narrow-inspector-collapsed.png) | Nonmodal header, reachable Quick Bar, bottom dock and Status Bar                             |
| [After: desktop Inspector](after-desktop-inspector.png)            | Raccoon; selected block, read-only Position/Group, metadata controls and Auto property       |

## Browser coverage

- Thirty layout cases: four themes x EN/VI x desktop 1600 x 900 and narrow
  320 x 740 / 390 x 844, plus both narrow widths in each of the three fonts.
  No document or Inspector horizontal overflow was found. Canvas height was
  392-396 px at 320 x 740 and 496-500 px at 390 x 844.
- An additional Chakra Petch Large (18 px root) case checked the narrow toolbar
  and expanded properties; no clipping or horizontal overflow was found.
- Real 3D placement, Quick Add/Quick Bar, tool/context switching without changing
  selection, selected-set/empty display, and BlockState edit/Undo/Redo.
- Locked-group property and rotation controls, Auto-derived Shape, and active
  decoration identity in Placement context.
- Layer input/slider, occupied navigation, visibility, opacity, and Escape
  returning focus from Layer options.
- Native keyboard entry into Menu, enum arrow navigation, sheet expand/collapse,
  Escape, reduced-motion focus, and resize to desktop releasing the modal/trap.
  The collapsed sheet had no scrolling overflow.

## Automated verification

- Focused inspector, chrome, shell and Layer controls: 11 files / 73 tests passed
  before the final selected-set regression additions.
- Final complete Angular suite: 331 files / 2,060 tests passed; 7 files / 11 tests
  skipped. The first full run hit two existing renderer tests' 5-second timeouts;
  a complete rerun after stopping the remaining dev server passed without source
  or timeout changes.
- Application typecheck, production build, two tools tests, production encoding,
  scoped Prettier check and `git diff --check` passed. No lint script is configured.

The run did not import a Mod JAR, run a benchmark, or verify behavior inside
Minecraft. These captures do not claim acceptance for unrelated dialogs or
async import states. The current implementation and ownership/test matrix are
in [the P0/P1 contract](../../RESPONSIVE-LAYOUT-AND-CONTEXTUAL-INSPECTOR.md).
