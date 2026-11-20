# Stage 4 interaction preparation

**Status (2026-11-20):** Preparation brief after the user approved the Stage 3
captures. No Stage 4 implementation has started. This document consolidates
existing design evidence and current code boundaries; it is not yet an
approved implementation specification.

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
