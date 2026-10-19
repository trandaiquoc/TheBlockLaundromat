# Workspace UI Acceptance and Audit

**Status:** the audited Workspace surfaces are implemented and browser-checked.
Full visual acceptance remains open for the Mod JAR import states that require
a compatible external fixture.

## Keep / Refine / Redesign inventory

| Workspace surface                                                                | Classification        | Evidence and decision                                                                                                                                                                          |
| -------------------------------------------------------------------------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Header, application menus, project context, and shared toolbar                   | Keep                  | Their information order and controls match the approved compositions. Existing keyboard, menu, and four-theme reviews cover the interaction states.                                            |
| 3D and Y-Layer mode controls, camera and layer controls                          | Keep                  | The shared controls remain readable and responsive. Renderer background and scene behavior stay separate from theme colors.                                                                    |
| Empty viewport starter card                                                      | Redesign: remove      | The card duplicated the left Block Browser and Place instructions while occupying the canvas in both modes. It is removed for empty projects; viewport placement feedback remains independent. |
| Placement status and target feedback                                             | Keep                  | The shared feedback component still reports status, reason, and coordinates without adding an empty-state overlay.                                                                             |
| Sidebars, resize handles, tabs, and narrow drawers                               | Keep                  | The approved three-region layout remains intact; existing responsive evidence covers desktop and narrow navigation.                                                                            |
| Block Browser and Decorations picker                                             | Keep                  | Search, virtualized results, selected state, source filtering, thumbnails, and narrow drawer behavior already match the documented contracts.                                                  |
| Groups panel and Quick Bar                                                       | Refine                | Increase the Groups search-clear and Quick Bar remove targets to 24 CSS px. Their actions and state contracts are unchanged.                                                                   |
| Selection Inspector, BlockState editors, specialized inspectors, and Block Usage | Keep                  | Preserve the reviewed hierarchy and all existing editing behavior. Block Usage remains explicitly out of redesign scope.                                                                       |
| Status Bar                                                                       | Keep                  | The compact two-row hierarchy and translated narrow labels already have current responsive evidence.                                                                                           |
| Settings, Help, and shared Workspace dialogs                                     | Refine                | Use the canonical `--overlay-scrim` token for modal backdrops; one NBT backdrop previously used a different hardcoded opacity. Keep the lighter drawer scrim because it is a separate surface. |
| Asset Manager, Diagnostics, JSON/NBT workflows, Datapack export, and AI dialogs  | Keep                  | Existing browser evidence covers the available states and responsive layouts. No workflow or data contract changes are needed for this visual audit.                                           |
| Broad Workspace redesign                                                         | No redesign justified | The four-theme shell retains the approved structure and theme identity; current evidence supports focused refinements instead of replacing accepted surfaces.                                  |

## Root causes and changes

- The empty-state component displayed a large card above the canvas whenever a
  project had no blocks or decorations. It repeated instructions already
  visible in the Block Browser and Place control, and could overlap placement
  feedback. Removed the component, its theme-specific artwork/styles, related
  EN/VI copy, the now-unused Block Browser event chain, and its tests. The 3D
  and Y-Layer canvases now start clear. Placement feedback uses a focused shared
  `ViewportFeedbackComponent` and remains available in both modes.
- The Quick Bar remove target was 19.2 px and the Groups search-clear target was
  21.6 px. Both now measure 24 x 24 CSS px while preserving their icon size and
  placement.
- Workspace modal backdrops had repeated literal colors, including a 0.52 NBT
  value alongside the shared 0.48 token. All seven modal backdrops now consume
  `--overlay-scrim`; the separate 0.38 drawer overlay remains unchanged.
- No project model, persistence, placement, selection, Undo/Redo, renderer, or
  100k-block hot path was changed.

## Current browser review

See the [2026-10-19 Workspace cleanup review](evidence/20261019-workspace-cleanup/README.md)
for fresh Chrome evidence across the four themes, empty and populated projects,
3D/Y-Layer, narrow layout, locale switching, modal Escape, and reduced motion.
The approved sources remain the four files under `references/`.

## Acceptance gaps

### Mod JAR fixture

The Asset Manager's empty Mods state and the Mod JAR Import menu destination
have been reviewed. Import preflight, progress, completion, and failure states
need a real Fabric mod JAR compatible with Minecraft Java 1.21.1 that includes
standard `fabric.mod.json` metadata and static block resources. No such fixture
is checked into this repository. A supplied fixture can be imported through
the browser-local workflow; JAR code is never loaded or executed. The importer
contract is documented in [Minecraft asset support](../../minecraft-assets.md).
On 2026-10-18, the user confirmed no compatible fixture is available yet, so
those importer states remain **NOT VERIFIED**.

## Historical technical checkpoints

At 0a18e1e5, the full frontend suite passed (318 files passed, 7 skipped;
1,992 tests passed, 11 skipped), and the production build passed. After
211ac0cd, inventory-storage and decorated-pot count feedback received a
follow-up check (9 inspector tests, production build, Prettier, encoding check,
and `git diff --check`). These results describe earlier checkpoints and do not
replace the current verification reported with this audit.

## Evidence rules

- The [browser evidence index](evidence/README.md) separates historical captures
  from current acceptance evidence. Historical captures are context, not a new
  PASS for the current implementation.
- The four files in `references/` are approved Workspace design sources.
- Keep Block Usage in its reviewed state; no redesign is requested here.
- Add browser evidence only for a meaningful change, a distinct theme or
  responsive state, or behavior tests cannot demonstrate. Do not recreate
  exhaustive theme/font/locale/viewport grids.
