# Illustrated Interactive Homepage — Phase 1 Design Decisions

**Status: PARTIAL.** This document preserves the eight-part Phase 1 analysis
and the approved design direction. Clean artwork and complete responsive
visual evidence are still missing; Phase 1 has not passed acceptance.

Recorded on 2026-10-23. Implementation facts were checked against HEAD
`4c5758a285dc319ecd7f345f950d9c89cb325221` when this document was persisted.
The user explicitly retained the PixiJS 2D/2.5D direction and the stop after
Phase 1. The former Three.js homepage proposal is historical, not an active
implementation instruction.

This is a design and architecture record, not an implementation report or
authorization to begin Phase 2. It does not change the Editor, persistence,
Undo/Redo, project formats, source artwork, or application dependencies.

## Evidence and decision labels

- **Verified current implementation:** read from the source listed below.
- **Observed artwork:** findings from the original Phase 1 visual inspection
  of the four references and selected extracted PNGs; not a complete asset audit.
- **Decided direction:** retained design choices, still requiring implementation
  and visual verification.
- **Proposed / open:** dimensions, authoring data, or behavior details without
  sufficient evidence for final acceptance. These must not be reported as implemented.

The original analysis inspected remote `main` at the same commit. The local
source was rechecked for this documentation task. Source inspection covered
Homepage and its Project workflow boundaries, not the whole Editor or Git history.

Relevant current sources:

- [Routes](../../../Frontend/src/app/app.routes.ts) — `/` is the traditional
  Project Screen; `/homepage-2d-preview` is a separate lazy-loaded preview.
- [Preview coordinator](../../../Frontend/src/app/features/homepage/homepage-preview.component.ts),
  [template](../../../Frontend/src/app/features/homepage/homepage-preview.component.html),
  and [layout](../../../Frontend/src/app/features/homepage/homepage-preview.component.scss)
  — Canvas 2D illustration with real shared controls, Settings, and Account.
  The project names, cards, and washer actions in the artwork are raster pixels.
- [Dependencies](../../../Frontend/package.json) — PixiJS is not installed.
  Three.js remains a project dependency but is not the Homepage renderer.
- [Scene graph](../../../Frontend/src/app/features/homepage/homepage-scene-graph.ts),
  [renderer](../../../Frontend/src/app/features/homepage/homepage-scene-renderer.ts),
  and [asset loader](../../../Frontend/src/app/features/homepage/homepage-scene-asset-loader.ts)
  — manifest ordering, parent transforms, selected-theme image loading,
  cancellation, and bitmap cleanup exist in the current Canvas preview.
- [Project Screen coordinator](../../../Frontend/src/app/features/projects/project-screen/project-screen.component.ts)
  and [preview persistence contract](../../../Frontend/src/app/core/persistence/project-store/project-store.port.ts)
  — existing workflow owners and revision-aware preview access.
- [Source manifest](../../../Frontend/source-assets/homepage/scene-manifest.json),
  [inventory](source-assets/asset-inventory.csv),
  [provenance](source-assets/PROVENANCE.md), and [four references](../references/)
  — source material and recorded package checks.

The original analysis could not access the deployed
[application](https://the-block-laundromat.vercel.app/) or
[preview](https://the-block-laundromat.vercel.app/homepage-2d-preview) through
the available web reader. It did not directly open either
`The-Block-Laundromat-4-Themes.zip` or
`The-Block-Laundromat-Assets-Corrected.zip`. Repository provenance is evidence
of previously recorded checks, not a claim that those checks were rerun here.

## 1. Landscape and portrait composition

### Decided direction

The Homepage is an illustrated laundry room in 2D/2.5D. Preserve the original
painted perspective, materials, lighting, and theme identity. Avoid the appearance
of a rectangular image surrounded by empty application background or a large
modern HTML panel covering the artwork.

Landscape retains the original recognizable arrangement:

- Door and shelf on the left.
- Washer and standing raccoon left of center.
- Wooden project board on the right.
- Seated raccoon, basket, and bench forming the foreground.
- Window and exterior providing background depth.

Furniture can move only within prepared background reconstruction and within
limits that preserve its relationship to the floor, wall, perspective, and light.
The decision does not imply arbitrary furniture dragging or a freely navigable room.

Portrait uses a separate vertical composition:

1. Global controls at the top, allowed to wrap.
2. Compact logo and washer–raccoon cluster as the identity area.
3. Project board below, using most of the available width.
4. Account at the bottom left with reserved clearance for content.

The washer still represents the selected project. On narrow screens, Open/Delete
move onto an authored action surface beside the washer cluster so their touch
targets remain usable. The seated raccoon sits outside the board's interactive
safe region instead of covering live cards as it does in the sample illustration.

Global controls are viewport-relative Angular DOM: EN/VI, Minecraft, Raccoon,
Light, Dark, and Settings at the upper right; Account at the lower left.

### Rejected alternatives and open work

Rebuilding the room from crude 3D blocks is rejected because it loses the approved
illustrated treatment. Simply shrinking or cropping landscape on mobile is
rejected because it cannot preserve readable project UI and the main composition.
The current preview's desktop framing and portrait crop remain current behavior,
not acceptance evidence for the new design.

Exact portrait artwork, object positions, and safe-region dimensions have not
been authored or visually approved. No final portrait mockup was produced in Phase 1.

## 2. Responsive scale, extension, crop, and reposition

### Decided rules

Use the source **1672 × 941** landscape coordinate system. Scale object artwork
uniformly on both axes; give DOM text and hit targets their own readable sizing
limits. Preserve original pixels wherever a new layout does not require repair.

| Viewport                  | Selected design treatment                                                               |
| ------------------------- | --------------------------------------------------------------------------------------- |
| 1672 × 941                | Original composition is the landscape reference.                                        |
| 1440 × 900                | Reveal additional ceiling and floor while retaining furniture proportions.              |
| 1366 × 768 and 1280 × 720 | Retain the washer–board cluster; reflow the board to two columns when needed.           |
| Ultrawide 21:9            | Extend architecture and exterior at the sides; keep the main furniture grouped.         |
| 390 × 844                 | Use portrait composition; two board columns only while cards remain wide enough.        |
| 320 × 700                 | Use a one-column project list and allow vertical scrolling when height is insufficient. |

Permitted cropping covers peripheral foreground foliage, part of the bench,
outer floor, and extended architecture. It must not remove global controls,
washer actions, board headings, or access to projects. Preserve clearance around
Account and controls. Height shortages must be handled through reflow and scrolling,
not by making functional UI unreadable.

Extensions must continue the original vanishing lines, plank scale, material,
and light direction. Reposition objects only with their support/contact anchors
and the repaired background needed to expose their former location.

### Proposed authoring extent

The analysis proposed a **2312 × 1321** landscape environment: add 320 source
pixels on each side, 160 above, and 220 below the original artboard. This is an
authoring envelope to review, not an approved output asset size or an implemented
runtime contract. Exact extension coverage and breakpoint values remain open.

Contain, cover, nine-slice, and parallax are rejected as the sole solution for
the whole room. Nine-slice may suit a specifically prepared paper or board-center
surface; it must not stretch the entire room. No browser screenshot currently
proves the proposed responsive composition at all required sizes in normal windows.

## 3. PixiJS, Angular DOM, and ownership

### Decided responsibility boundaries

| Owner                      | Responsibility in the approved design                                                              |
| -------------------------- | -------------------------------------------------------------------------------------------------- |
| PixiJS scene               | Artwork, scene graph, masks, transforms, and decorative animation.                                 |
| Angular DOM                | Functional text, inputs, buttons, focus, dialogs, localization, and accessibility.                 |
| Responsive layout          | One set of placement transforms and safe regions shared by scene artwork and DOM.                  |
| Asset manifest             | Semantic IDs, asset sources, parents, pivots, contact points, draw layers, and permitted movement. |
| Presentation state         | Selected project ID, thumbnail loading state, and animation intent.                                |
| Existing Project workflows | Create/Open/Delete, import/export, validation, and persistence.                                    |
| Scene lifecycle            | Resource loading, theme replacement, textures, ticker, observers, and listeners.                   |

This is the future PixiJS boundary. The current preview uses Canvas 2D and has
no connected Project workflows or animation. The design does not justify a
new state-management system, persistence system, or additional animation library.

Reuse `ProjectScreenWorkflow`, `ProjectBackupWorkflow`,
`StructureJsonProjectImportWorkflow`, and `filterAndSortProjectSummaries`.
Do not reproduce their rules inside PixiJS or replace the Project Screen with
a second business implementation. Keep files with their owning subsystem,
use consistent semantic concepts, and keep documentation aligned with actual code.
After a verified renderer replacement, remove the obsolete rendering path rather
than retaining parallel Homepage renderers indefinitely. This document makes no
such source change.

PixiJS was selected for illustrated parent-child transforms, masking, and layer
ordering. Official references consulted in the original analysis:
[Containers](https://pixijs.com/8.x/guides/components/scene-objects/container),
[Render Layers](https://pixijs.com/8.x/guides/concepts/render-layers), and
[Assets](https://pixijs.com/8.x/guides/components/assets).
An exact dependency version and compatibility validation remain open.

### Project interaction decisions

- Selecting a card updates the presentation selection; Open is a separate action.
- Search and sort do not automatically open a project.
- Deleting the selected project clears selection and returns the washer to its empty state.
- Read thumbnails through existing preview access using `projectId` and `updatedAt`.
  `ProjectSummary` does not currently contain a thumbnail URL.
- Do not load the Editor or reconstruct a structure to render the decorative washer preview.
- Preserve selection and form state across theme changes.

Project List, Search/Sort, Select, Open/Delete, Create, Structure JSON Import,
Project Backup Import/Export, Settings, EN/VI, four themes, and the existing
local Account presentation must all remain reachable. This design does not imply
authentication or cloud capabilities beyond the current Account demo.

### Asynchronous work and resource lifecycle

Use generation tokens to reject stale results when selection, theme, or route
changes. Abort requests where supported, and release results that complete after
being superseded. Do not assume every PixiJS asset load is abortable.

Load the selected theme only. A theme replacement is staged, swapped as one
transaction, and followed by release of the previous set. Temporary overlap of
old and replacement resources must have explicit ownership; loading all four sets
at startup is not the design. Clear cached references and release scene-owned
textures, ticker callbacks, observers, and listeners on teardown.

The existing Canvas loader's cancellation and bitmap cleanup are reusable
behavioral evidence, not proof that future PixiJS lifecycle behavior is implemented.

## 4. Scene graph, anchors, contact points, and occlusion

Landscape and portrait share semantic objects and a logical coordinate model,
with composition-specific placements. Parent transforms must carry their children,
including props attached to supporting surfaces. Draw order and logical ownership
are related contracts, but one must not be inferred solely from the other.

| Object               | Required authoring anchors and surfaces                                                    |
| -------------------- | ------------------------------------------------------------------------------------------ |
| Washer               | Floor contact, top support surface, door center, thumbnail mask, label and action regions. |
| Board                | Wall mount or supporting feet, DOM safe region, list region, decorative border.            |
| Shelf                | Wall attachment and individual support surfaces for contents.                              |
| Raccoon              | Feet, neck, shoulders, hands, tail root, and prop contact points.                          |
| Create/Import papers | Hand grip and readable DOM region.                                                         |
| Shadows              | Contact anchor and permitted displacement region.                                          |

The current scene graph uses centers of asset/group bounds as anchors. These
support general transforms but do not establish feet, neck joints, or paper grips.
Exact coordinates, joint locations, movement envelopes, and final anchor schema
are missing; the analysis did not approve numeric values for them.

The selected layer order is:

1. Exterior.
2. Architecture and reconstructed backgrounds.
3. Object contact shadows.
4. Furniture and props.
5. Project thumbnail inside the washer mask.
6. Washer rim, glass, and reflections.
7. Raccoons and foreground.
8. Angular DOM on authored safe regions.

One Pixi canvas below DOM cannot cover DOM using a foreground sprite. The design
therefore reserves unobstructed interactive areas: hands, leaves, and paper edges
can overlap decorative margins, but cannot cross live labels or buttons. Visual
occlusion and pointer behavior must agree. DOM artwork alignment must use the same
placement/anchor result as the scene and be recomputed on resize, not maintained
as unrelated pixel positions.

Create exposes its choices immediately while the raccoon offers two papers.
The papers are artwork; Create and Import content is DOM. Animation cannot delay
interaction. Complex Create and Import forms use sufficiently spacious dialogs
with existing validation, busy/error states, focus trapping, and focus restoration.
Exact dialog placement and the presentation of Import choices remain to be
verified; no replacement import workflow is specified.

### Motion and light preparation

No animation is implemented or produced by Phase 1. Prepare the following design:

- Idle: selected leaf clusters pivot gently; blinking swaps eye frames. Breathing
  must not scale the entire character like rubber.
- Project selection: update the door thumbnail and let the raccoon look toward it
  with a small neck/head or body lean. Keep foot contact stable and prefer the
  newest selection when inputs arrive rapidly.
- Create: arms move around shoulders and keep hands attached to the papers.
  Reconstruct body areas exposed by those movements.
- Reduced motion: show the final still state immediately without delaying actions.
- Lighting: keep static environment lighting in artwork. Separate shadows for
  moving parts; use bounded masked glow and reflected-light layers on the raccoon
  and floor. Theme changes adjust those layers. Avoid duplicating baked shadows
  and added shadows; no physical whole-room shadow system is required.

Numeric timing, joint coordinates, final pose sheets, shadow images, and glow
strengths have not been established by the report.

## 5. Asset inventory and missing artwork

### Existing evidence

The source manifest contains 331 layers: Minecraft 82, Light 82, Raccoon 84,
and Dark 83, with 86 semantic IDs across themes. Source provenance records 282
masks and four canonical reference copies. See the existing
[inventory](source-assets/asset-inventory.csv) and
[provenance](source-assets/PROVENANCE.md) rather than duplicating all rows here.
The current runtime exports 323 layers after excluding raster navigation/account
for each theme; preserving source hashes does not establish independent movability.

The Phase 1 inspection observed these concrete limitations in Minecraft assets:

- [Washer body](../../../Frontend/source-assets/homepage/assets/minecraft/washer-body.png)
  still contains raccoon and basket fragments, a sample thumbnail, and raster text.
- [Repaired washer body](../../../Frontend/source-assets/homepage/assets/minecraft/repairs/washer-body-hidden-fill.png)
  still contains the sample label and actions.
- [Repaired board](../../../Frontend/source-assets/homepage/assets/minecraft/repairs/board-body-hidden-fill.png)
  still contains parts of sample cards.
- [Standing raccoon](../../../Frontend/source-assets/homepage/assets/minecraft/raccoon-standing.png)
  includes surrounding shelf/floor artwork in the crop.

These are targeted observations from the earlier report, not a claim that every
PNG has been inspected. A layer named `inferred-hidden-fill` is inferred repair,
not recovered original art or a guaranteed clean UI surface. Successful original
image recomposition does not prove that objects can move without exposing damage.

### Minimum supplementation for the representative theme

| Priority                              | Asset category                     | Required preparation from the report                                                                  |
| ------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------- |
| P0                                    | Environment                        | Landscape extension and a separate portrait background.                                               |
| P0                                    | Background / hidden reconstruction | Clean areas behind the washer, board, and raccoons, including former object positions.                |
| P0                                    | Clean UI surfaces                  | Completely clean cork, header without text, separate board frame/ledge, and blank card papers.        |
| P0                                    | Interactive washer                 | Clean body, blank label, empty door, thumbnail mask, and separate rim/glass/reflections.              |
| P0                                    | Main character isolation           | Raccoon without surrounding background, clean edges, and a separate contact shadow.                   |
| P0                                    | Foreground / occlusion             | Prepared foreground borders and explicit regions prohibited from covering UI.                         |
| P1                                    | Raccoon poses/body parts           | Head/neck, open/closed eyes, near/far arms, and restored body areas hidden by them.                   |
| P1                                    | Create/Import props                | Two blank papers, gripping hands, and reconstructed body behind the pose.                             |
| P1                                    | Lighting / shadow layers           | Door glow, reflected light, and shadows for approved poses.                                           |
| P2                                    | Decorative objects                 | A small number of leaf clusters with pivots; do not split every plant.                                |
| After representative-theme validation | Theme variants                     | Adapt the approved semantic contracts to Light, Raccoon, and Dark while preserving their own artwork. |

For a solo developer, prepare and verify one cluster at a time through targeted
masked image editing. Retain original pixels outside the required repair areas,
then inspect repaired joins and edges against both light and dark backgrounds.
Do not require manual cutting of hundreds of PNGs or production of all four themes
before the representative theme proves the pipeline.

The report did not establish exact export filenames, a final atlas layout, or a
complete pose/texture count. These remain authoring work, not completed deliverables.

## 6. Representative theme: Minecraft

**Decided:** begin with Minecraft (`craft` in application preferences,
`minecraft` in the source asset manifest).

Its strong identity, varied materials, and clear lighting expose matte halos,
duplicated shadows, incorrect support points, and reconstruction defects. It
also exercises the complete washer–board–raccoon cluster and provides a useful
visual quality check for the intended asset pipeline.

After that cluster is validated, reuse its semantic contracts for Light,
Raccoon, and Dark. Retain theme-specific artwork, local source coordinates, and
lighting treatment; a color overlay on Minecraft is not an accepted substitute
for the other source themes. No new theme artwork has been created or accepted.

## 7. Phase 1 acceptance and inputs for Phase 2

These are the acceptance conditions recorded in the analysis, not checked-off
claims. Phase 1 remains **PARTIAL** until supporting evidence exists.

| PASS condition                                                                     | Current evidence / remaining gap                                                                                           |
| ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Approved landscape and portrait compositions at every required viewport group.     | Composition direction recorded; finished portrait/extension artwork and complete responsive visual review are missing.     |
| Extension, crop, and reposition rules identified by object.                        | Rules recorded in sections 1–2; exact authored regions and visual validation remain open.                                  |
| Anchors, contact points, safe regions, and occlusion have concrete authoring data. | Responsibilities and required anchors recorded; numeric authoring data is missing.                                         |
| P0 assets are clean of raster sample UI, neighboring fragments, and broken joins.  | Selected source assets contradict readiness; clean replacements have not been accepted.                                    |
| Every existing function has a DOM location and an existing workflow path.          | Ownership and intended placement recorded; live scene integration is future work, with detailed placement still to verify. |
| Idle, selection, paper-offer, and reduced-motion preparation is explicit.          | Motion requirements recorded; final rig, poses, contact points, and shadows remain missing.                                |
| Missing evidence is disclosed and not counted as acceptance.                       | Gaps recorded in this document; no Visual PASS claimed.                                                                    |

Concrete inputs before the planned Phase 2 integration:

1. Minecraft P0 assets from section 5.
2. An approved expanded landscape composition and an approved portrait composition.
3. Authoring manifest additions for anchors, safe regions, and movement envelopes.
4. Character state references for idle, looking into the washer, offering papers,
   and reduced motion.
5. A verification checklist covering every existing workflow, required viewport,
   occlusion, alignment, and resource cleanup.

No Phase 2 implementation prompt, code, dependency installation, artwork generation,
or rollout is authorized by this record. The current documentation task ends after
persisting the analysis and synchronizing its documentation commit.

## 8. Risks, evidence limits, and unresolved questions

- There was no fresh browser visual review of the deployed URLs in the original analysis.
- The two named ZIPs were not directly inspected. Recorded provenance must remain
  distinguished from new verification.
- Portrait artwork and landscape extensions are not approved assets.
- Clean UI surfaces and character rig parts are incomplete, as the selected asset
  observations demonstrate.
- Exact PixiJS version compatibility, texture memory, and performance are unmeasured.
- The current preview is not connected to Project workflows; painted samples
  must not be represented as live project data.
- Final breakpoint thresholds, safe-region/anchor coordinates, movement bounds,
  pose sheets, timing, dialog placement, and asset export layout remain open.

The current [browser checker](../../../Frontend/scripts/check-homepage-preview.mjs)
checks framing/layout constraints, theme requests, shared controls, and the
traditional screen at `/`. Its scope does not establish a new portrait composition,
DOM alignment inside live scene surfaces, foreground occlusion, or scene-integrated
project workflows. Native-size pixel recomposition and historical prototype checks
also do not establish those properties. Existing checks were inspected, not run
as part of this documentation-only task.

### Rejected alternatives and rationale

| Alternative                                                                                           | Reason retained from the analysis                                                                         |
| ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Crude 3D room reconstruction or defaulting Homepage to Three.js.                                      | Loses the approved illustrated treatment; the retained direction is PixiJS 2D/2.5D.                       |
| Whole-scene contain/cover, nine-slice, parallax, or desktop crop as the complete responsive solution. | Does not provide the required environment extension, separate portrait composition, and readable live UI. |
| Large modern HTML panel over the painting.                                                            | Obscures the room instead of integrating functional DOM with authored surfaces.                           |
| Moving source cutouts without reconstruction checks.                                                  | Crops and inferred repairs still contain neighboring objects and sample UI.                               |
| New persistence/business logic or structure rendering for decorative thumbnails.                      | Existing workflows and revision-aware preview access already own those responsibilities.                  |
| Foreground crossing live text/buttons beneath one canvas.                                             | A canvas below DOM cannot supply matching visual occlusion above it.                                      |
| Whole-character breathing scale or waiting for animation before interaction.                          | Deforms the character or delays normal user actions.                                                      |
| Recoloring one theme to stand in for all four source themes.                                          | Fails to preserve each reference's material and lighting identity.                                        |

Historical records remain unchanged: [retired 3D proposal](3d-homepage-spec.md),
[retired prototype report](phase2-prototype.md), and [earlier evidence](evidence/).
They are not current implementation instructions or acceptance for this design.

**PHASE 1: PARTIAL.** Stop after Phase 1. Clean artwork and complete responsive
visual evidence are required before PASS can be considered.
