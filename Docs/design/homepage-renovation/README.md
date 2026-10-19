# Homepage and Project Screen Renovation

**Status:** in progress. This page records the current implementation and its
remaining scope; it is not a full application acceptance report.

## Implemented Project Screen

- The Minecraft (`craft`) scene starts from the exact 1672 × 941 source in
  `Docs/design/references/01-minecraft.png`. The left doorway and two right
  window-view groups are split into a transparent exterior layer and a
  complementary room layer. The other themes still use their earlier layered
  scene assets and have not yet been brought into parity. Project controls,
  data, preview, actions, and local status remain real DOM layers over artwork.
- Recent projects appear as real selectable entries on the wooden board. The
  washer drum displays the selected project's real cached capture when one is
  available. The selected project name and size appear on the washer's angled
  control display. Real Open/Delete buttons align their hit areas and labels
  with the washer artwork's green and gray controls.
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

`scene-minecraft-reference.png` remains a byte-for-byte copy of the approved
Minecraft source. The current split assets are derived only from that image:
`scene-minecraft-room-shell.png` and `scene-minecraft-exterior-view.png` use the
same 1672 × 941 canvas. Their measured mask regions are recorded in the
[asset manifest](asset-manifest.json); the extraction script verifies that
compositing both layers reproduces every source pixel. Only the visible view
groups are isolated so far; unseen outdoor regions are not generated. The split
does not yet remove the baked logo, washer, board, controls, or mascots. Those
still form the source artwork under their live DOM layers.
`scene-minecraft-board-cleanup.png` covers the five static sample project cards
while preserving the original New Project tile. The source-derived
`project-card-craft.png` crop at `(1176, 385)` preserves its pin and paper frame,
opens a transparent preview window, and replaces baked card text with live DOM
text. A browser screenshot with an empty IndexedDB project confirms the card
frame, placeholder, and title alignment; non-empty thumbnail alignment remains
pending. `create-project-tile-craft.png` is a 142 × 156 pixel crop at `(1026,
385)` from that same source; its button remains interactive while showing the
original tile art. A responsive percentage translation aligns that live
button with the source tile after the board's perspective transform; the exact
source crop remains underneath it. See the [focused alignment evidence](evidence/20261019-craft-tile-alignment/README.md).

`scene-minecraft-display-cleanup.png` removes only the two baked text lines from
the Craft washer's dark project plate. Its script masks neutral-bright glyphs,
dilates the mask by two source pixels, and locally interpolates the surrounding
plate pixels; every pixel outside the mask remains transparent. Run
`python3 Frontend/tools/project-screen-assets/extract-minecraft-display-cleanup.py`
with Pillow installed to regenerate it. The actual localized project label and
name remain DOM content positioned over the original plate and pencil artwork.
The [source-size browser check](evidence/20261019-minecraft-display-cleanup/README.md)
shows a real `Lakeside Cabin` project on the cleaned plate; it does not claim
whole-scene or real-thumbnail acceptance.

`Frontend/public/assets/project-screen/layers/ref4/` still contains the earlier
layered artwork masters used by Light, Raccoon, and Dark. Those themes, their
geometry, and their transition lighting remain pending alignment with the
Minecraft source. The new Craft exterior layer currently contains only the
visible source pixels from the measured doorway/window groups. Its scene
composition is pixel-identical to the source before the separate board cleanup
overlay is applied. The empty washer preview now shows a dark glass grid while
no saved capture exists; the cached renderer image remains the visible content
when available. In Craft the preview well stays mounted even when no project is
selected, so the baked sample cottage cannot leak through the empty state. This
is a runtime fallback, not yet a clean static washer/drum extraction.

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
its component is destroyed. Preview capture renders the project grid in a
brighter preview-specific color over a solid dark olive background, then
restores the live grid material and renderer state immediately after
submission. Saved previews show the structure against a visible grid without
changing the editor viewport appearance.
Saving the canonical project invalidates its preview in the same transaction;
previews do not enter project JSON, backups, exports, or summary records. Empty
projects, Y-Layer exits, stale captures, and unavailable captures show no image.
The project board remains metadata-only and never opens or renders every full
structure during list load.

## Browser Evidence

The captures linked below document earlier implementations and remain
historical workflow evidence. The exact Minecraft scene asset is covered by a
byte-comparison test. Browser inspection confirmed the background uses the
reference at its native composition and the original toolbar no longer doubles
under its interactive hit areas. The original board surface is visible without
an opaque replacement layer; transparent search/sort hit targets preserve the
baked controls until focus. Dynamic project rows replace matching sample cards,
while sample cards in unused positions remain visible, so board data has not
reached visual acceptance. The selected washer preview was inspected with a
temporary test project rather than the user's Cresselia project. Visual parity
for the other three themes also remains pending.

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

The [Minecraft washer display cleanup review](evidence/20261019-minecraft-display-cleanup/README.md)
checks the localized project label and live project name over the source plate
at native source resolution.

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
