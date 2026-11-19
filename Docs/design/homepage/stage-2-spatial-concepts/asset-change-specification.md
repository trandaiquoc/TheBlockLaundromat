# Stage 2 — Asset change specification

**Status:** Scene-ready proposal for Stage 3. No Three.js scene or GLB was
modified to produce this specification.

## Design authority

Use [`approved-octagonal-room.png`](./approved-octagonal-room.png) as the
selected room composition. It is the user's chosen direction: open octagonal
cutaway, thick rear wall with a washer recess, board adjacent on the left,
clear fireplace on the right, rounded octagonal floor edge, and two compact
Raccoons. Do not revive the discarded square-room / perpendicular-wall
look-dev variants. Detailed wall, cabinet, and fireplace alignment remains a
Stage 3 authoring review because the user deferred those 3D details.

Use [`raccoon-pair-look-review.png`](./raccoon-pair-look-review.png) as the
current proposed Raccoon shape direction. The user preferred its shared head
design while asking for clearer differences between the pair. This remains a
visual candidate pending approval; the existing source GLBs are prototypes
and visibly do not match the chosen Raccoon references.

The desktop and mobile images are visual mockups, not production screenshots.
Their sample project name, summary, and miniature preview art are illustrative
only. The live board must be Angular DOM backed by real `ProjectSummary` data;
project text and image are not authored into a texture. The mobile image is a
separate portrait camera composition, not a crop of desktop.

## KEEP / MODIFY / CREATE / REMOVE

| Action     | Asset / responsibility                                                                        | Stage 3 direction                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ---------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **KEEP**   | Approved room composition                                                                     | Preserve the octagonal floor and wall silhouette, central recess, adjacent board, right-side fireplace, and open floor area. Geometry refinements must be reviewed against the selected image and user's 3D notes.                                                                                                                                                                                                                                                                                        |
| **KEEP**   | Four theme identity                                                                           | Use the same geometry for `craft`, `light`, `raccoon`, and `dark`; change materials, illumination, and ambience only. The 2×2 comparison is a visual direction, not a new asset pack.                                                                                                                                                                                                                                                                                                                     |
| **MODIFY** | Twin Raccoon source prototypes                                                                | The existing GLBs and activity preview are exploratory prototypes only; their tall cuboid bodies do not match the chosen Raccoon references. Re-author or replace them in Stage 3 from the approved shape direction. Preserve the preferred shared head design, keep compact seated bodies, and distinguish the pair through modest torso contour, ear/tail silhouette, and role pose. Do not integrate these prototypes as final art.                                                                    |
| **MODIFY** | Existing assembled room in `Frontend/source-assets/homepage/models/laundromat/Laundromat.glb` | Do not scale its square/two-wall stage to fake the selected plan. Re-author or restructure the room shell to the octagonal plan and thick rear wall. Reuse detachable washer, board, window, lantern, planter, shelf, and material work only where each piece fits the selected geometry without distortion.                                                                                                                                                                                              |
| **MODIFY** | Washer and wall opening                                                                       | Enlarge the washer slightly relative to the earlier square-room preview, but make the washer fit inside a deep wall niche. Starting target: washer body width 0.28–0.32 of room floor width; niche opening width 1.15–1.25× washer width and depth at least 0.45× washer body depth. Keep its face clear and readable.                                                                                                                                                                                    |
| **MODIFY** | Board mounting and project UI                                                                 | Mount the board surface to the left rear facet, aligned with that wall plane. Keep its right edge close to the recess (initial gap 0.02–0.06 room widths). Create a flat DOM overlay within the projected board bounds. Angular owns Search, Sort, Add Project, vertical note list, selected full-detail state, and statuses. The scroll container must not pass wheel/touch events to camera controls.                                                                                                   |
| **MODIFY** | Fireplace                                                                                     | Keep it on the right return wall. Align its face to that wall plane. Preserve a visibly open fire aperture and masonry surround; do not place a timber lintel, cabinet, or shelf across the opening. Keep safe visual clearance above the fire.                                                                                                                                                                                                                                                           |
| **MODIFY** | Washer contextual UI                                                                          | Anchor the real revision preview in the washer door/glass. Place distinct semantic Open and Delete buttons next to washer controls, outside the preview. Do not put these actions on the board note. The preview uses `openPreview(projectId, expectedUpdatedAt)`; missing/stale data shows real project facts and a clear no-preview state.                                                                                                                                                              |
| **MODIFY** | Raccoon identities and motion                                                                 | Place Courier near the board and Washer Guide near the washer. Use the preferred shared head design from `raccoon-pair-look-review.png`. Keep both characters low, seated, short-bodied, and close in height and mass. Give Courier a folded seated pose, note prop, and tail tucked near one haunch; give Guide a modest gesture, slightly slimmer torso contour, and tail sweeping the opposite way. Keep the tail moderate in size. The current GLB preview is a mismatch reference, not approved art. |
| **CREATE** | Octagonal room shell                                                                          | Build an eight-sided floor platform with a softened block-step outer rim and a visibly open front. Make the back wall read as a substantial wall volume, with the washer recess carved into it. Avoid a perfect square base or two unjoined perpendicular wall slabs.                                                                                                                                                                                                                                     |
| **CREATE** | Fireplace asset / anchor                                                                      | Author a right-facet fireplace with masonry surround, visible aperture, fire/light anchor, and enough clearance from overhead beams. Keep a single reusable fireplace asset across themes.                                                                                                                                                                                                                                                                                                                |
| **CREATE** | Two-character placement and waypoint set                                                      | Add distinct idle, board-side, washer-side, and safe arrival anchors. Route both Raccoons along short floor paths that avoid the board, washer action anchors, fireplace aperture, platform edge, and each other.                                                                                                                                                                                                                                                                                         |
| **CREATE** | Spatial camera anchors                                                                        | Add `overview`, `board`, `washer`, and `recenter` poses/targets. Resolve their bounds against portrait and landscape aspect ratios so board and washer are visible together in overview.                                                                                                                                                                                                                                                                                                                  |
| **CREATE** | DOM overlay anchors                                                                           | Expose stable anchors for board viewport, washer preview glass, washer Open/Delete, and Courier note affordance. DOM text remains localized and accessible. Keep semantic controls even when the camera is focused or WebGL has failed.                                                                                                                                                                                                                                                                   |
| **REMOVE** | Superseded room look-dev variants                                                             | Old unselected square room concepts, previous theme boards, and rejected Raccoon turnaround images were removed per the user's cleanup direction. They are not Stage 3 inputs.                                                                                                                                                                                                                                                                                                                            |
| **REMOVE** | Single in-room Raccoon instance in the assembled GLB                                          | Once the twin GLBs pass visual and runtime regression review, remove the old duplicate character from the rebuilt room. Retain only one authoritative pair; do not render both the old embedded Raccoon and both new characters.                                                                                                                                                                                                                                                                          |
| **REMOVE** | Baked or sample project data                                                                  | Do not bake generated example names/details/thumbs into the board or scene textures. Empty/loading/error and actual-project content come from Angular-owned DOM state.                                                                                                                                                                                                                                                                                                                                    |

## Relative placement contract

Use these normalized starting proportions to author and compare scene variants;
they are targets for visual review, not claims of measured geometry in the
approved raster image.

- Set the octagonal floor's outer X width to `1.0`; target depth `0.78–0.88`.
  Clip the front-center perimeter into the open entrance; soften the edge with
  stepped blocks while keeping a continuous rounded/octagonal silhouette.
- Keep the rear wall thick enough that the washer visibly sits partly inside
  it. Target wall thickness `0.12–0.16` of floor width. The recess returns and
  lintel should be distinct from the outer wall mass.
- Place the washer on the central rear facet. Target its visual height at
  `0.40–0.48` of the back wall height. Its drum is the preview focal area and
  must remain unobscured at the overview camera.
- Put the board on the adjacent left rear facet. Target board width
  `0.24–0.30` of floor width and height `0.30–0.38` of back wall height.
  Leave a narrow visual gap to the washer recess so one scan covers both.
- Place the fireplace on the right return facet, at least one masonry block
  clear of the front of the washer and clear of every overhead timber above
  its aperture. Keep window/planters on the same right zone only if the fire
  outline stays legible.
- Keep a clear central floor zone approximately `0.34` room widths across.
  Each Raccoon target height is about `0.19–0.25` washer height. Their tail
  envelopes may differ, but must not overlap the board, washer actions, or
  entrance rim at rest.
- Use the shared head and face design shown in
  [`raccoon-pair-look-review.png`](./raccoon-pair-look-review.png). Keep each
  seated body compact, with short limbs and no elongated neck or torso. Give
  Courier a folded pose and low tail curl beside one haunch; give Guide a
  slightly slimmer torso contour, small raised-paw gesture, and tail sweeping
  along the opposite side. Keep overall height and mass close; do not make
  either character tall, heavy, or oversized. These are visual targets, not
  measured source geometry.

## Camera and visual anchors

| Anchor            | Composition target                                                                                    | Stage 3 check                                                                                                        |
| ----------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Overview          | Front elevated three-quarter view; washer, board, fireplace, both characters, floor rim all readable. | Desktop 16:9 shows the whole room without excessive empty canvas.                                                    |
| Portrait overview | More frontal, slightly higher framing with a tighter horizontal perspective.                          | At 390×844 and 320×568 the board, washer, fireplace, both characters, entrance and compact controls remain in-frame. |
| Board             | Move target toward the left rear facet; keep the washer edge in view as context.                      | Note list/detail has enough readable area; focus does not hide washer state.                                         |
| Washer            | Move target toward washer drum and adjacent Open/Delete.                                              | Glass preview and both actions fit in the viewport and do not overlap the drum.                                      |
| Recenter          | Return to overview with a short, calm easing transition.                                              | Reduced motion skips or sharply shortens the transition.                                                             |

Board DOM is anchored to the board plane but owns note content and independent
scroll. Washer actions are attached to the washer in the same viewport; their
focus targets remain in the DOM tree and do not depend on a raycast. Pointer
drag controls orbit only when started on scene background. A short scene click
can pick a hotspot; scroll inside the board never zooms the room.

## Motion zones (design only)

| Character/object | Authoring zones                                                        | Motion direction                                                                                                                       | Reduced-motion equivalent                                                 |
| ---------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Note Courier     | Board idle anchor, note-offer pose, two safe floor waypoints.          | Small breathing; optional grooming/scratch while idle; brief offer-note gesture when the user asks to add a project.                   | Stable seated pose; semantic Add Project stays active.                    |
| Washer Guide     | Washer-side idle anchor, greeting pose, separate washer arrival point. | Small breathing/tail movement; brief greeting or guide gesture on project selection.                                                   | Stable seated pose and static selected indicator.                         |
| Both Raccoons    | Separate washer-side staging points and obstacle-safe paths.           | Short, non-crossing run toward the washer area after explicit project selection; stop beside rather than in front of the door/actions. | Stay in their idle zones; selection and washer illumination still update. |
| Lantern / fire   | Existing fixture anchors and per-theme light owners.                   | Low-amplitude flicker; preserve readable shadows and materials.                                                                        | Constant light level.                                                     |
| Plants           | Existing planter anchors only.                                         | Very low-amplitude leaf sway.                                                                                                          | Static leaves.                                                            |
| Washer           | Preview glass, selection light.                                        | Gentle illumination change tied to selection/loading; no flashing.                                                                     | Static clear selected/unselected state.                                   |

No animation clips are to be authored in Stage 2. The Raccoon source GLBs
currently include only `offer-note` and `greet`; walking, collision, and the
behaviors above remain future Stage 3 work.
