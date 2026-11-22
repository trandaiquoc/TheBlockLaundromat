# Historical Stage 4 interaction preparation and Goal 04 review

**Historical status (2026-11-20):** Goal 04 was integrated on
`/mini-diorama-preview`. Goal 05 removed that route and moved Diorama to the
root mode. The interaction details below record the implementation at that
checkpoint; they do not define the current Homepage route or asset paths.

## Goal 04 implementation contract

- The preview uses the assembled Stage 3 octagonal room and its two included
  Raccoons. The board remains blank for a later Angular overlay.
- Four `ThemeService` presets drive the existing GLB material variants, CSS
  atmosphere, scene lights, and a synchronized four-quarter clock dial. Dragging
  the dial clockwise or counterclockwise updates the time and theme at each
  quarter. The center swaps one animated weather scene for the selected stage;
  four curved theme labels on the rim select their matching quarter. The
  accessible range control remains available.
- The daily sequence is Light morning, Minecraft orange sunset, Raccoon
  blue-purple twilight around 6–7 pm, and Dark late night. Dawn uses warm yellow
  sunlight and clouds, sunset uses a low orange sun, twilight fades into a
  crescent behind thin clouds, and only late night shows stars. Each sky layer,
  celestial glow, and scene lighting follows that time-of-day sequence.
- A soft sky glow and celestial body travel horizontally across the viewport
  with the dial on one level path. Night-to-morning and morning-to-night
  transitions wrap around opposite screen edges. Clouds
  appear in the morning and during twilight; stars appear only at night.
  The sun/moon sits higher than its glow field.
- A horizontal drag or touch swipe across the preview changes to the adjacent
  time stage only while Overview is selected. Focused object views retain their
  camera behavior without changing themes. Washer and board views lock camera
  orbit, pan, wheel zoom, and pinch zoom; other eligible views retain camera
  controls. This gesture belongs to the mini-diorama preview and does not change
  Workspace interactions. The room turns with the sky change.
- A theme change runs a smoothed full room turn in 0.95 seconds, following the
  shortest clockwise or counterclockwise route between stages while the camera
  stays in place. Reduced-motion mode skips the turn and completes the theme
  change immediately. The scene render loop idles when no camera, theme, turn,
  or Raccoon motion is active; Settings can disable scene animation.
- The ground plane uses a generated moss, grass, leaf-litter, and earth texture
  with a forest-floor palette. A soft
  rounded-rectangle shader fade blends it into the CSS atmosphere without a
  circular platform or visible hard edge. A soft PCF shadow receiver and the
  faded ground contact shade anchor the room to the forest floor.
- The current scene uses one named `production-default` profile in
  `mini-diorama-scene-profile.ts`. It owns the room, washer, and exterior-floor
  asset paths, the cabinet-group node offsets, and the exterior ground/fade/
  shadow settings. The scene contract, loader, and scene builder consume that
  profile so a future seasonal profile can replace those values as one unit;
  this release has no seasonal variants or profile selector.
- The Niche and Shelf lantern anchors each receive a warm point light, so both
  lamps illuminate the room at night. The cabinet, shelf contents, lantern,
  ivy, bottom baskets, wash boxes, and foreground planter shift together 1.1
  units toward the board along the cabinet's rightward wall axis. The hanging
  wall ivy rises 0.25 units and shifts 0.18 units into the room. Its plant
  animation anchor moves with it; the rest of the group stays against the wall.
- Left-button taps keep semantic picking; left-button drags orbit; middle
  button drags pan like Workspace; wheel and touch pinch zoom. Zoom eases to
  its bounded target to avoid abrupt camera jumps. Focus and recenter actions
  return the camera to the room.
- Selecting the washer frames its front-facing bounds. Selecting the board
  brings the complete board into a closer view without other room props
  covering it. Washer framing uses the model bounds center and leaves room to
  see the full appliance; the existing bounded zoom range stays unchanged.
- The preview header uses the enlarged SVG logo as a text-free home link at the
  top left. The
  account sits at bottom left with a slightly larger avatar and trigger. The
  clock sits snug at bottom right; its single-color center crossfades one
  animated weather scene at a time. Theme names follow the four colored rim
  segments. The four focus actions remain vertical, centered above the Light arc,
  and aligned to the viewport's vertical midpoint.
- The account dialog owns language and Settings actions. The room starts
  centered after reload. The shadow receiver grounds the room against the
  exterior floor without creating a hard circular platform or a detached blob.
- WebGL startup failures and scene asset load failures have separate localized
  messages; the scene load error is also logged for diagnosis.
- The shared panel keeps `/homepage-integration-preview` on its existing scene
  and controls. `/` remains the Project Screen.
- Project CRUD, washer previews, character choreography, and environmental
  smoke remain out of scope.

## Generated exterior paving asset

`Frontend/source-assets/homepage/textures/mini-diorama/exterior-forest-floor.png`
is a generated woodland ground tile created for the exterior forest request.
It replaces the earlier generated sandstone texture and is not part of the
supplied Stage 3 ZIP. Angular copies this single PNG to
`assets/homepage/runtime/textures/mini-diorama/exterior-forest-floor.png`;
the scene loader fetches it with the GLB cancellation signal and disposes its
texture and decoded bitmap with the scene. Its SHA-256 is
`f84a70b6ca7acd494e4d527ca82b9185fa644be1bb8c21f9702ae87a7968ddf9`.

Browser captures are stored under the ignored
`Frontend/.artifacts/mini-diorama-preview/` directory. The screenshot gate is
pending the user's visual review and is not self-approved by the implementation.

## Source of truth

Use the current user request and repository instructions first. The existing
[Stage 2 interaction architecture](../stage-2-spatial-concepts/interaction-architecture.md)
and [asset change specification](../stage-2-spatial-concepts/asset-change-specification.md)
describe candidate interactions, but both label their requirements as Stage 3
design or review material. Do not treat that label as approval for Stage 4
scope. The supplied
[Stage 3 `ASSETS.md`](../stage-3/ASSETS.md) documents the delivered scene graph
and anchors; it is asset documentation, not an instruction to implement every
described control or animation.

## Confirmed Stage 3 baseline

- `/mini-diorama-preview` loads the octagonal production GLB. Its board is
  blank, and both Raccoons are already assembled into the room.
- `/` remains the existing Project Screen. The separate
  `/homepage-integration-preview` still uses the earlier scene through the
  shared scene panel's `integration-preview` contract.
- `MiniDioramaScenePanelComponent` exposes semantic Overview, Washer, Project
  Board, and Raccoon actions. The runtime emits typed intents and keeps scene
  loading, cancellation, fallback, and resource disposal in the existing
  owners.
- The Stage 3 scene contract names board corners and center, washer Preview,
  Open, and Delete anchors, and Overview, Portrait, Board, Washer, and Recenter
  camera anchors. The preview uses some of these for bounds and camera focus;
  it does not yet project DOM controls onto the board or washer.
- The room GLB has no animation clips. Its character roots and authored pivots
  are available, but Stage 3 does not implement project-aware character
  behavior.

## Existing project workflow boundary

`ProjectScreenComponent` owns a component-scoped `ProjectScreenWorkflow`. That
workflow owns the project list and existing create, open, and confirmed-delete
actions through `ProjectPersistenceService`, `ProjectDeletionService`, the
workspace/session owners, and the Router. Search and sort already have a
focused project-list function. The standalone mini-diorama route does not
inject this workflow and does not load project data.

Revision-keyed preview storage already exists: `ProjectStore.openPreview` and
`ProjectPersistenceService.openPreview` accept both project ID and
`updatedAt`. `ProjectPreviewService` currently writes previews and emits
updates; it does not provide a read wrapper. Stage 4 should consume the
existing contract and should not read persistence from the Three.js runtime or
create a second project owner.

## Candidate Stage 4 scope

The current design documents support the following candidate objective:

> Make `/mini-diorama-preview` a project-aware scene using Angular DOM controls
> anchored to the delivered board and washer, while keeping existing project
> workflows as the only owners of project creation, opening, deletion, and
> persistence.

Candidate workstreams:

1. **Project board:** render real `ProjectSummary` data as semantic DOM, with
   loading, empty, error, list, and selected-detail states. Keep search, sort,
   Add Project, and independent note scrolling in DOM if they remain in scope.
2. **Washer:** show only the cached preview matching the selected project's
   current `id` and `updatedAt`. Define explicit missing, stale, and read-error
   states. Route Open and Delete through the existing actions and confirmation
   behavior.
3. **Create and selection:** make the board's Add Project action and Courier's
   paper affordance invoke the same existing create workflow. A selected board
   project updates washer state but never writes project data from the scene.
4. **Camera and input:** decide whether Stage 4 adds bounded orbit/zoom in
   addition to Stage 3's fixed camera presets. Keep scene drag distinct from
   picking; board scroll and controls must consume their own input.
5. **Character presentation:** use Courier and Guide as distinct roles if
   character actions are included. The current runtime maps both roots to one
   `raccoon` action. Define whether Stage 4 needs static responses, short
   procedural poses, or safe floor movement; do not assume GLB clips exist.
6. **Responsive DOM and fallback:** keep controls keyboardable and available
   when WebGL is unavailable. Project text, notes, and statuses stay in DOM,
   never baked into the room textures.

## Candidate acceptance checks

| Area                          | Evidence required                                                                                                                                                                                                  |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Route ownership               | `/` and `/homepage-integration-preview` keep their current workflows and scene selection. The Stage 4 controls exist only on the authorized preview route.                                                         |
| Data and workflows            | Board data comes from the existing project store/workflow. Create, open, and delete preserve existing validation, confirmation, persistence, navigation, and error behavior. No parallel CRUD owner is introduced. |
| Preview correctness           | A preview is displayed only for its current project ID and revision. Missing, stale, failed, and cancelled reads produce clear states and never publish an older selection.                                        |
| Spatial input                 | Board and washer overlays track their authored anchors after resize and camera changes. Board scroll does not orbit/zoom; drags are not project activations; taps remain pickable.                                 |
| Accessibility and preferences | DOM equivalents provide keyboard operation, visible focus, localized status, focus restoration, reduced-motion behavior, and a useful WebGL fallback. Cover all four themes × EN/VI.                               |
| Responsive layout             | Capture 1440×900, 1024×768, 390×844, and 320×568. Keep the full room and essential controls visible without horizontal overflow or distorted framing.                                                              |
| Lifecycle                     | Verify async cancellation, selection changes during preview reads, observer/listener cleanup, owned GPU-resource disposal, and 20 route mount/unmount cycles.                                                      |
| Review                        | Capture real browser states for the user to review. Do not self-approve the visual gate.                                                                                                                           |

## Decisions before implementation

1. Confirm whether the board, washer preview/actions, and Add Project flow form
   one Stage 4 release or should be split into smaller milestones.
2. Choose the project-workflow boundary for a standalone preview route. The
   current `ProjectScreenWorkflow` is component-scoped; avoid injecting scene
   code into persistence or duplicating its create/open/delete behavior.
3. Choose how the washer preview is presented. A DOM overlay over the authored
   Preview anchor preserves Angular ownership; a dynamic Three.js texture
   changes rendering and disposal ownership. The existing design requires the
   real revision-matched preview but does not settle this presentation detail.
4. Confirm whether bounded orbit/zoom and character floor movement belong in
   Stage 4. The Stage 2 documents propose them; Stage 3 only integrates the
   authored roots, pivots, and camera anchors.
5. Decide whether a Stage 4 review requires representative desktop/mobile GPU
   measurements. The Stage 3 SwiftShader timing is a software-renderer
   diagnostic, not device performance evidence.

The delivered pack has no license or provenance notice. Local interaction
work can use the already supplied assets, but the rights question remains open
before any further public distribution or production deployment.

## Suggested implementation order after scope approval

1. Audit the workflow and preview owners in the affected routes; design the
   narrow shared project-action boundary and its regression tests.
2. Implement and test the project board DOM and its anchor projection without
   changing project persistence.
3. Add selection-keyed washer state and Open/Delete actions through the
   existing workflows.
4. Add only the camera and character behavior approved for Stage 4.
5. Run route regression, data/error/race, keyboard/localization, responsive,
   fallback, and lifecycle checks; provide screenshots for visual review.

No new dependency or route is assumed by this preparation brief.
