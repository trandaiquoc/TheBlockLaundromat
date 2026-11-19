# Stage 2 — Spatial UX & room composition

**Review status:** The user approved the current visual package on 2026-11-19.
All Stage 2 acceptance gates pass; Stage 3 has not started.

[`approved-octagonal-room.png`](./approved-octagonal-room.png) is the room
composition the user selected on 2026-11-19. It establishes the octagonal
cutaway, thick recessed washer bay, nearby project board, fireplace, compact
seated Raccoons, checker floor, and rounded floor edge. The top UI is
deliberately outside the room concept; the user said that interface will
follow the ZIP reference separately.

The user deferred detailed room materials and exact 3D alignment notes until
Stage 3. Treat the selected image as the approved composition reference, not as
a final model render. Stage 3 must fit the slightly larger washer inside the
thick rear-wall niche and keep the fireplace aperture clear of overhead wood.
The superseded Goal 02C look-dev package and unselected composition artwork
were removed at the user's direction after the alternatives were reviewed.
The retained octagonal composition was selected for the open floor, thick
washer recess, and close board/washer relationship; its tradeoff is more
careful alignment across angled wall facets.

## Composition selection

The room alternatives were compared visually; the unused concept images were
removed after the user selected the octagonal direction.

| Direction reviewed              | Strength                                                    | Trade-off and decision                                                                                                      |
| ------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Square, two-wall room            | Familiar planes and simpler prop alignment.                | The room read like a screen, and the washer recess lacked enough wall depth; rejected.                                        |
| Shallow washer recess            | Keeps the washer central and close to the board.            | The wall did not read as thick enough for a recessed machine, so the washer dominated; rejected.                             |
| Octagonal room with deep recess  | Clear room silhouette, open floor, and close board/washer.  | Angled facets need careful fireplace and board alignment; selected, with exact 3D tuning deferred to Stage 3.                  |

## Visual review assets

- [Selected octagonal room](./approved-octagonal-room.png)
- [Desktop room-first mockup](./desktop-room-mockup.png)
- [Portrait mobile room reframe](./mobile-room-reframe.png)
- [Four-theme comparison with shared geometry](./four-theme-room-comparison.png)
- [Raccoon A — Note Courier turnaround](./raccoon-model-a-note-turnaround.png)
- [Raccoon B — Washer Guide turnaround](./raccoon-model-b-turnaround.png)
- [Two Raccoon models and activity preview](../../../../Frontend/source-assets/homepage/models/raccoons/raccoons-activity-preview.png)

The desktop, mobile, and theme images are concept illustrations, not browser
captures. Their sample project copy and preview artwork are placeholders; live
project text and revision previews must come from real data and must not be
baked into model textures. The mobile concept has its own camera composition.
Each Raccoon sheet shows a full four-view rotation: front, left profile, back,
and right profile. A (Note Courier) holds a larger blank paper note with both
paws; B (Washer Guide) sits with its paws lowered. Both use a cooler gray coat
and one compact, attached,
banded tail. The user approved these two concept sheets on 2026-11-19. They
remain design references, not finished model renders. The user also approved
the desktop mockup, four themes, and portrait mobile mockup, noting that the
mobile composition feels somewhat cramped.

The separate Raccoon preview is rendered in Chrome from the two source GLB
prototypes. It shows the Note Courier's `offer-note` activity and the Washer
Guide's `greet` activity, but their cuboid body shapes do not match the chosen
Raccoon references. Treat that preview as evidence of the current mismatch;
neither GLB is integrated into the laundromat runtime or approved as final art.

## Design specifications

- [Interaction architecture](./interaction-architecture.md) — board
  scrolling/selection, washer preview/actions, note creation, Raccoon states,
  camera/input routing, accessibility, fallback, and current implementation
  gaps.
- [Asset change specification](./asset-change-specification.md) — KEEP /
  MODIFY / CREATE / REMOVE, relative sizes and placements, camera/UI anchors,
  motion zones, themes, and Stage 3 asset-authoring work.

The reference ZIP was inspected as source code, separately from screenshot
observation. Stage 1 records the verified source mechanisms and the current
homepage/runtime audit; Stage 2 does not claim that the archived page was run.

## Acceptance gate snapshot

| Gate                    | Status                  | Evidence / open item                                                                                                                                                                                                                               |
| ----------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A — Spatial composition | **PASS (composition)**  | The selected concept has an octagonal cutaway, adjacent board and washer, clear fireplace, and room for both Raccoons.                                                                                                                             |
| B — Interaction design  | **PASS (design)**       | Board, washer actions, note creation, camera input, character states, and accessibility/fallback contracts are diagrammed.                                                                                                                         |
| C — Visual concepts     | **PASS**                | Approved octagonal room, room-first desktop, portrait mobile, four-theme comparison, and A/B turnarounds are retained. Earlier composition alternatives were reviewed and removed as requested after the user selected the octagonal direction.                     |
| D — Asset readiness     | **PASS (design spec)**  | Relative proportions, niche depth, object placement, DOM anchors, camera poses, and motion zones are specified. Exact model alignment and material tuning remain Stage 3 authoring work, as the user requested.                                           |
| E — Consistency         | **PASS (design audit)** | Stage 1 workflow ownership, typed scene/DOM contracts, accessibility, reduced motion, fallback, theme identity, and all six clean-code constraints are carried into the Stage 3 specification. No app implementation changed.                                  |
| F — User art approval   | **PASS**                | The user approved the octagonal room, A/B Raccoon turnarounds, desktop mockup, mobile mockup, and all four themes on 2026-11-19.                                                                                                                   |

No production implementation or GLB edit was made for this review. The visual
direction is approved. Do not start Stage 3 until separately requested; the
user will provide deferred 3D alignment notes during that stage.

No Angular, production route, Three.js scene, Blender file, GLB, or animation
clip was modified for this Stage 2 design package. The Raccoon source package
was created under the user's separate request and remains source-only. The
existing `/` route and project workflows are unchanged.
