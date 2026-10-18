# Homepage and Project Screen Renovation

**Status:** in progress. This page records the current implementation and its
remaining scope; it is not a full application acceptance report.

## Implemented Project Screen

- The Homepage scene uses four theme-specific wide room backdrops, exterior
  cutouts, washer, board, mascot, and foreground layers based on the approved
  Minecraft, Light, Raccoon, and Dark references. The layers share the same
  camera angle and placement. The official logo asset stays unchanged as a
  separate wall sign, with a restrained glow adapted to each theme.
  Language/theme/settings controls and local status remain real DOM outside
  the illustrated room.
- Recent projects appear as real selectable entries on the wooden board. The
  washer drum displays the selected project's real cached capture when one is
  available. A pinned paper note beside the washer lists the selected project's
  name, Minecraft version, dimensions, and structure mode without an image.
  Open/Delete actions stack beside the drum.
- On wide desktop, the unchanged official logo sits above the washer in the
  scene's open wall area. The board arranges real project summaries as cards;
  the layout reduces to one column when the board is narrow. Local search
  filters project name, Minecraft version, mode, and dimensions; sorting offers
  newest, oldest, and name order. Search and sorting appear once projects exist,
  keeping the empty board clear while preserving both controls for populated
  lists.
- The board's `+` menu offers the two existing creation workflows: project
  creation reuses the size/version form in a focus-trapped dialog, and
  Structure JSON import reuses its validated file workflow. The menu uses
  Angular CDK keyboard, focus, Escape, and outside-dismiss behavior.
- The existing Project Screen workflow still owns create/open/delete, import,
  local persistence, and project navigation. Local guest status remains
  explicit; no account or cloud behavior was added.
- Theme controls and project rows use the shared 120 ms standard-easing token;
  reduced-motion preferences suppress these transitions.
- Settings includes a persisted Home Space Animations toggle. The washer mascot
  uses idle, create, selected, and opening poses; both mascots use state-aware
  motion, and the browser's reduced-motion preference suppresses that motion.
- At narrow widths, the scene becomes a responsive visual header followed by
  the project details, board, and local status. Project controls remain within
  the document width.

## Art Assets

`Frontend/public/assets/project-screen/layers/ref4/` owns the four wide room
backdrops and each theme's transparent washer, board, and mascot layers. The
parent `layers/` directory owns four theme-specific exterior cutouts and the
shared transparent foreground props. The desktop canvas follows the generated
backdrops' approximately 2.13:1 ratio and fills wide displays; narrower desktop
ratios crop the outer edges while preserving the reference composition. At
mobile widths, the artwork becomes a 16:9 room header and the real project
board moves below it. The logo, actual project previews, pinned project note,
controls, and metadata stay in independent DOM/image layers, so generated room
backdrops contain no project names, fake thumbnails, or interface controls.
Only the active theme's room layers and the shared foreground props are rendered.

The project board reads lightweight summary records while full structure data
stays in separate project records. Once route checks approve leaving the 3D
workspace, the mounted viewport submits a 256 x 144 capture and starts async GPU
pixel readback through a cancellable WebGL2 buffer and fence with a bounded
wait. The viewport restores renderer state immediately after submitting the
readback. Navigation does not wait for readback, image encoding, or the
IndexedDB write; if the viewport is disposed, the bounded readback temporarily
owns the renderer and target until it completes or times out. Project changes
within the same project cancel an obsolete readback; switching projects keeps
the task bound to its captured project. Route teardown does not cancel a valid
readback. The save remains bound to the captured project ID and timestamp, and
the store checks that revision transactionally before saving, so a stale result
is rejected even after the workspace changes. A committed preview update notifies
any matching card already on Home so it can reload that image without a page
reload. Home loads only the selected project's preview for the washer and
lazily loads near-visible project-card previews through one shared visibility
observer. Object URLs are released when a preview leaves the near viewport or
its component is destroyed. Preview capture now keeps the project grid visible
for the render and restores its prior visibility afterward, so a saved preview
can show the structure against the grid.
Saving the canonical project invalidates its preview in the same transaction;
previews do not enter project JSON, backups, exports, or summary records. Empty
projects, Y-Layer exits, stale captures, and unavailable captures show no image.
The project board remains metadata-only and never opens or renders every full
structure during list load.

## Browser Evidence

The captures linked below document the earlier flattened-scene implementation.
They remain historical workflow evidence; they do not verify the current
layered composition. The current scene has code-level tests, but a browser
visual pass against all four references and the user's preview report is still
pending.

The [2026-10-17 laundromat scene review](evidence/20261017-laundromat-scene/README.md)
contains captures of the empty state, project selection, four themes, creation
dialog, and narrow Vietnamese layout. Browser interaction checks created two
projects in an isolated profile, selected and opened a saved project, and
confirmed deletion. That sample profile is not part of the repository. Those
captures predate the wide-screen logo placement, project-card layout, and local
search/sorting controls. The [selected project card review](evidence/20261017-project-selection/README.md)
captures the current populated board in all four themes and at a narrow width.
It also records a selected-state correction found in the current Dark theme.
The [populated 320 px Project Screen review](evidence/20261018-project-populated-narrow/README.md)
checks a selected project card in Raccoon Vietnamese, including its Open and
Delete actions and the empty-project preview surface.
The [project board polish review](evidence/20261018-project-board-polish/README.md)
compares the empty-state action and populated card layout before and after the
latest refinement, with a narrow-screen check.
The [empty board controls review](evidence/20261018-project-empty-state/README.md)
keeps search and sorting out of the zero-project state while preserving the
washer's Create action and the board's Structure JSON import action.
The [project creation focus review](evidence/20261017-project-create-focus/README.md)
checks the narrow dialog's initial focus target and confirms the page has no
horizontal overflow.

The [project version hierarchy review](evidence/20261017-project-create-version-hierarchy/README.md)
removes the repeated Minecraft version status from the create dialog and keeps
the incomplete-behavior caveat distinct for other versions.

The [Structure JSON project import focus review](evidence/20261017-project-import-focus/README.md)
checks that the narrow import preview opens with its heading focused before
the create and cancel actions.

Visual review covers the current empty and populated board compositions, the
selected card in four themes, the narrow selected state, and the actual selected
project preview. Search/sort, project creation, and opening a saved project
have also been exercised in the local browser profile.

The [independent mascot motion review](evidence/20261017-project-screen-mascots/README.md)
checks the two separate character layers across the four themes, at a narrow
viewport, and with reduced motion enabled.

The [project-card preview review](evidence/20261017-project-card-previews/README.md)
shows the real renderer capture on a project card, with the card actions visible.

The [real project preview review](evidence/20261017-project-preview/README.md)
checks the selected washer preview captured from the mounted 3D workspace, its
timestamp-matched IndexedDB record, and its desktop and narrow-screen display.

## Interaction Research

The [Lucian Labs UI catalog](https://lucianlabs.dev/uxui-prompt/) and its
[MIT-licensed source](https://github.com/Seokwoooo/lucian-uxui-prompt) were
reviewed. HTML/CSS/JavaScript patterns from sliding tabs, dropdown menus,
undo snackbars, and button feedback were inspected. The application uses its
existing Angular controls and tokens; demo code and assets were not copied.

## Approved Visual References

- [Minecraft](../references/01-minecraft.png)
- [Light](../references/02-light.png)
- [Raccoon](../references/03-raccoon.png)
- [Dark](../references/04-dark.png)
