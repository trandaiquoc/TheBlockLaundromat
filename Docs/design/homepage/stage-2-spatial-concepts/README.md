# Stage 2 — Spatial UX & room composition

**Review status:** Design package assembled; user visual approval is pending.
Gate F is not passed.

[`approved-octagonal-room.png`](./approved-octagonal-room.png) is the room
composition the user selected on 2026-11-19. It establishes the octagonal
cutaway, thick recessed washer bay, nearby project board, fireplace, compact
seated Raccoons, checker floor, and rounded floor edge. The top UI is
deliberately outside the room concept; the user said that interface will
follow the ZIP reference separately.

The user has deferred detailed room materials and 3D alignment notes until the
next scene review. Treat the selected image as the approved composition
reference, not as a final 3D specification. In particular, Stage 3 must fit
the slightly larger washer inside the thick rear-wall niche and keep the
fireplace aperture clear of overhead wood. The superseded Goal 02C look-dev
package was removed at the user's direction. This package retains only the
selected octagonal direction instead of recreating concepts the user asked to
remove.

## Visual review assets

- [Selected octagonal room](./approved-octagonal-room.png)
- [Desktop room-first mockup](./desktop-room-mockup.png)
- [Portrait mobile room reframe](./mobile-room-reframe.png)
- [Four-theme comparison with shared geometry](./four-theme-room-comparison.png)
- [Raccoon A — note holder turnaround](./raccoon-model-a-note-turnaround.png)
- [Raccoon B — seated turnaround](./raccoon-model-b-turnaround.png)
- [Two Raccoon models and activity preview](../../../../Frontend/source-assets/homepage/models/raccoons/raccoons-activity-preview.png)

The desktop, mobile, and theme images are concept illustrations, not browser
captures. Their sample project copy and preview artwork are placeholders; live
project text and revision previews must come from real data and must not be
baked into model textures. The mobile concept has its own camera composition.
Each Raccoon sheet shows a full four-view rotation: front, left profile, back,
and right profile. A holds a larger blank paper note with both paws; B sits
with its paws lowered. Both use a cooler gray coat and one compact, attached,
banded tail. The user approved these two concept sheets on 2026-11-19. They
remain design references, not finished model renders.

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
| C — Visual concepts     | **PARTIAL**             | Desktop and portrait mockups plus four-theme comparison exist. Only the selected composition is retained; new 2–3 alternatives were not recreated after the user locked the room and requested cleanup of unselected concepts.                     |
| D — Asset readiness     | **PARTIAL**             | Relative sizes and anchors are specified. The A/B turnaround sheets give Stage 3 a clearer Raccoon target, but the current source GLBs still do not match it. Exact 3D wall/fireplace alignment is deferred to the user's Stage 3 scene description. |
| E — Consistency         | **PASS (design audit)** | Stage 1 workflow ownership, DOM data ownership, theme set, reduced-motion, fallback, and cleanup boundaries are carried forward without app implementation changes.                                                                                |
| F — User art approval   | **PENDING**             | The user approved the A/B Raccoon concept sheets on 2026-11-19. The desktop/mobile/theme presentation still needs visual approval.                                                                                                               |

No production implementation or GLB edit was made for this review. Do not
start Stage 3 until the user approves the visual direction and provides the
deferred 3D alignment notes.

No Angular, production route, Three.js scene, Blender file, GLB, or animation
clip was modified for this Stage 2 design package. The Raccoon source package
was created under the user's separate request and remains source-only. The
existing `/` route and project workflows are unchanged.
