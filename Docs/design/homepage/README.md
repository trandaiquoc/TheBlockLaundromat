# Creative Interactive Homepage: research and prototype gates

**Status:** Goal 01 research complete; rendering decision proposed for the first prototype. No homepage implementation, production asset, or dependency change was made.

This report records inspected evidence, inferences, and the next prototype's acceptance gates. The supplied archive was treated as reference material to audit, not as instructions from the user.

## Decision summary

Use the application's existing Three.js stack for prototype 1, with Angular owning real project operations and semantic UI. Start with procedural geometry for the room and simple props, but allow purpose-made authored art wherever geometry cannot meet the art gate. Keep project actions, copy, menus, and accessible controls in Angular DOM. Do not add PixiJS or combine renderers for the first prototype.

This choice follows the spatial/character interaction needs and existing Three.js investment; it is not based on the reference template's engine. The current root route is the real project workflow, so the prototype must integrate at that boundary rather than replace it with a visual mock. The choice remains proposed until an art-reviewed, browser-tested prototype demonstrates the gates below. See [ADR 001](ADR-001-rendering-engine.md).

## Evidence and scope

The audit was static: the supplied ZIP was inspected without executing its JavaScript; current homepage, routes, project workflow, persistence, editor session, theme, localization, renderer baseline, and relevant documentation were read; and the four retained concept images were viewed. The ZIP copy was verified by byte comparison, SHA-256, and archive integrity check.

The requested [Tooplate page](https://www.tooplate.com/view/2171-spatial-diorama) was opened through web access. It returned the title and top navigation, but did not expose a running scene or usable interaction state. Native browser automation was unavailable. Template interaction findings below therefore come from archived source, not live browser testing. Comments and page text are treated as claims; implementation claims are based on source constructs.

No Git history was inspected. The four screenshots show candidate visual directions, but no written rationale explains why prior concepts may have been rejected. This report describes observable limits, not historical failure causes.

## Reference archive and license handling

The unmodified archive is retained locally at `Docs/design/references/2171_spatial_diorama.zip`.

- SHA-256: `cbc5ebf7aa1d4c61e5a4801a52262ec5eb35fd4bed34140b44874334ae02bb4e`
- Size: 452,323 bytes; identical to `/home/trandaiquoc/Downloads/2171_spatial_diorama.zip`.
- `unzip -t`: passed.
- Contents include `index.html`, `css/style.css`, `js/app.js`, `js/diorama.js`, six gallery JPEGs, and a bundled Three.js vendor file/license.

Tooplate's [About page](https://www.tooplate.com/about) describes personal and commercial use and allows removal of credit, while also restricting redistribution of the template file. This wording does not clearly authorize committing the original ZIP to this repository. The archive is thus kept at the requested local path and excluded from Git by `Docs/design/references/.gitignore`. This is a conservative handling choice, not a legal interpretation. `js/vendor/LICENSE-three.txt` covers the bundled Three.js code only; it does not grant rights to redistribute the template or its artwork. Recheck the terms before publishing or redistributing the archive.

## Spatial Diorama source audit

Paths below are within the ZIP. Source was inspected statically.

| Area | Implementation evidence | Limits / what is not verified |
| --- | --- | --- |
| Procedural geometry/materials | `js/diorama.js` defines helpers `rbox`, `sph`, `cyl`, `cap`, and `put`; builds room, furniture, plants, props, and bunny from Three.js meshes, groups, rounded boxes, spheres, cylinders, capsules, shapes, and extrusions. Canvas textures and a custom shader provide selected details. | No GLTF or other 3D model is included. Six gallery JPEGs are still used. It is a mixed procedural/bitmap style, not proof all art is procedural. |
| Scene graph/rendering | One `Scene`, `PerspectiveCamera`, `WebGLRenderer`, lights, shadow map, grouped objects, antialiasing and capped pixel ratio. | Config shows intent, not measured performance on target hardware. |
| Camera/responsive | OrbitControls disable pan and bound orbit/zoom; authored section focus poses/flights animate camera; resize code uses portrait/wide framing and projects 3D anchors to HTML hotspots. | A constrained authored camera system, not unrestricted exploration. No device reflow capture was made. |
| Character/motion | Bunny is a hierarchy of primitive meshes and pivots. Custom updates animate idle, walk, jump, ears, blinking, squash/stretch and movement effects. A fixed-step accumulator caps frame delta and work per frame. | No skeletal asset or `AnimationMixer` pipeline. It proves bespoke procedural motion exists, not that the Raccoon can meet our visual bar with primitives. |
| Picking/interaction | Raycaster intersects an explicit set of floor, section and bunny targets. Pointer handlers distinguish tap/drag, floor interaction moves the character, keyboard movement/jump and HTML hotspots/section controls are wired. | Real interaction is present in source, but it was not executed or tested across browsers. |
| DOM integration | `index.html` provides controls, dock, hotspots, panels and status/content UI; canvas is hidden from the accessibility tree. `js/app.js` owns panels/UI and communicates using `window.GM635`. Focus is moved into panels and restored to triggers. | Useful separation pattern. Every important scene action still needs a semantic equivalent in our app. |
| Accessibility | Native buttons/forms, labels, status/live-region patterns, focus handling, keyboard controls, reduced-motion styles/checks appear in `index.html`, `js/app.js`, `css/style.css`. | Reduced motion is partial; source does not establish that all motion stops. No automated accessibility tree or actual keyboard audit. Hotspot opacity/pointer hiding may leave controls focusable; verify before calling this a defect. |
| Performance | Frame-time moving average can lower pixel ratio and later simplify shadow quality/map size. Animation delta/steps are capped. | No reproducible benchmark, target-device matrix or measured report is provided. |
| Resource lifecycle/failure | WebGL capability check and failure/status path exist. Source starts a continuing RAF loop and installs event listeners; inspected code lacks a complete renderer/scene/listener/RAF teardown. Shadow-map disposal is only in a quality downgrade path. | No route-scoped Angular lifecycle owner or complete teardown was found. Treat deterministic disposal as an integration requirement, not a pattern to copy. WebGL fallback equivalence is not proven. |

### Transferable lessons and constraints

A bounded room with clear landmarks makes movement and picking legible. Procedural state-based animation can be expressive without a skeleton. Projected HTML hotspots and DOM panels can connect a scene to real content. Camera framing should adapt to portrait instead of cropping a desktop composition.

Do not copy the bunny-specific movement algorithm, continuous-loop lifecycle, partial reduced-motion behavior, or performance assumptions. Do not make raycasting the only way to invoke a project action. Do not copy the template's art or engine choice merely because it is a reference.

## Existing application audit

### Routes and current homepage

`Frontend/src/app/app.routes.ts` routes `/` to `ProjectScreenComponent`, the real project screen. `/editor` uses the existing editor leave guard. `/homepage-2d-preview` lazy-loads `HomepagePreviewComponent`; this is a preview, not the production root or an interactive 3D homepage.

The preview validates `scene-manifest.json`, maps app themes `craft`, `light`, `raccoon`, `dark` to art packages, builds a 2D parent/pivot graph, loads PNGs as `ImageBitmap`s and draws ordered raster layers to Canvas 2D. Manifest `interactive` metadata does not currently create hit testing: `drawHomepageScene` draws images, and `renderCurrentTheme` passes an empty transform map. There is no scene camera, character controller or animation. DOM controls remain separate. The canvas has an accessible image label but does not expose individual depicted objects as semantic actions. Narrow CSS changes the crop, not the composition.

The preview does demonstrate good patterns: asynchronous cancellation, generation checks, `ResizeObserver`, DPR cap, `ImageBitmap.close()`, and destruction cleanup. The homepage package under `Frontend/source-assets/homepage/` contains 618 files and is about 54 MB on disk; manifests contain 82–84 layers/theme. Angular copies these source assets to runtime. Output transfer size and runtime memory were not measured here.

### Project, persistence, editor and preferences

The root project screen consumes `ProjectScreenWorkflow`, backup/import workflows, controls/account components, dialogs, and persistence services. Existing workflows cover create, list/search/sort, open, delete with confirmation, project package and Structure JSON import, and backup. Validation, activation, session reset, and editor routing are already owned by these workflows.

`PROJECT_STORE` resolves to `IndexedDbProjectStore`. `ProjectPersistenceService` validates/migrates project data and handles packages; editor/session services own active editor state. Undo/Redo is session history with autosave; editor leave handling protects pending work. Import/backup/Structure JSON paths already support cancellation/worker handling. The scene must consume read-only summaries and dispatch intent through these workflows; it must not add persistence or mutate project documents.

The theme service persists `craft`, `light`, `raccoon`, and `dark` (craft is presented as Minecraft). `I18nService` owns EN/VI. Keep all text in Angular localization; the scene may consume theme palettes/composition but should not bake translated copy into textures.

### Existing tests and renderer evidence

Homepage unit specs cover manifest validation, scene graph, renderer transforms and asset loading/cancellation. They prove parts of the current raster preview contract, not browser interaction for a new scene. Three.js is already used in the editor and its renderer baseline documents ownership/lifecycle patterns. This is useful project context, not evidence that an interactive homepage exists.

### Four concept images

`Docs/design/references/01-minecraft.png`, `02-light.png`, `03-raccoon.png`, and `04-dark.png` share a dense laundromat/project-board composition with palette/lighting variations. They provide direction for room identity and project-card placement. At screenshot resolution, some labels are tiny and text is baked into the image. They do not show motion, focus states, loading/error/empty states, responsive recomposition, semantic controls, or different project counts. Similar layouts aid palette comparison but do not prove every theme should differ only by color.

These are observable constraints, not proof of why any prior direction failed. No rejection rationale was found in reviewed docs; history was intentionally not inspected.

## Technology comparison

Qualitative fit for this app and scope; no prototype benchmark or art scoring has been run.

| Criterion | Three.js procedural-first | PixiJS 2.5D | Three.js + PixiJS |
| --- | --- | --- | --- |
| Art fidelity | Volumetric light/material/depth suit an explorable laundromat. Procedural-only shapes risk looking generic; allow authored texture/model for key details. | Strong layered illustration, sprites, meshes and filters; volume/camera behavior must be intentionally simulated. | Broadest toolkit, but two visual languages must cohere. |
| Character | 3D turning, depth and grounded movement; procedural rig/state machine or authored clips. Raccoon still needs art review. | Sprite/2D rig is natural; authored frames/layers add asset work and depth is simulated. | Flexible but splits pose/overlay ownership. |
| Camera/interaction | Perspective/orthographic cameras and Raycaster fit room-scale scene; DOM mirrors actions. | Container camera and scene events fit fixed-view parallax; depth/occlusion requires a chosen model. | Adds coordinate spaces, event bridge and tests. |
| Responsive | Reframe same scene with authored wide/portrait presets. | Reposition layers or use alternate illustrated layouts. | Coordinate sizing and composition across renderers. |
| Performance/accessibility | Existing engine/investment; budgets/shadows/continuous motion need profiling. Canvas needs semantic DOM and fallback. | New dependency/runtime; sprite workloads may fit well; Pixi accessibility overlays do not replace workflow DOM. | Highest GPU/context coordination risk and does not improve accessibility by itself. |
| Lifecycle/maintenance | Reuse current knowledge, but new scene still needs route-scoped ownership/disposal. | Separate app/assets/events lifecycle to learn and test. | Highest overlap and disposal burden; use only with evidence. |

### Recommendation and fallback

Use existing Three.js for prototype 1. Procedural meshes can establish the room, washer, board structure and simple props. If reviews show the Raccoon lacks the face, silhouette or soft handmade quality, use authored textures/decals or an authored/rigged character. Keep readable UI in DOM. This is a strategy, not a request to make production assets in Goal 01.

Switch to PixiJS 2.5D only if the focused Three.js procedural pass plus bounded authored-art pass fails the Raccoon/illustration gate, while a Pixi spike meets it with less custom work and preserves real object actions. Reconsider hybrid only for a required effect that Three.js plus DOM cannot meet, with measured ownership/performance costs documented.

## Proposed architecture and ownership

| Responsibility | Owner and contract |
| --- | --- |
| Route, shell, project list/forms, theme/language, semantic controls | Existing Angular project-screen feature, theme service and `I18nService`. `/` remains a real project screen. |
| Create/open/delete/import/backup | Existing `ProjectScreenWorkflow` and dedicated workflows/services. Delete intent invokes current confirmation. Persistence stays behind existing IndexedDB-backed services. |
| Scene mount/unmount | Focused Angular scene host. Supplies read-only project summaries and presentation preferences; receives typed user intents; owns fallback state and lifetime. |
| Three renderer/scene/camera/resize | Narrow scene runtime. Owns renderer resources and resize; no router, IndexedDB, editor-session or project-mutation dependency. |
| Geometry/materials/textures | Focused scene asset/build modules with explicit ownership and disposal. |
| Raccoon movement/animation | Raccoon controller/state machine owns movement target, constraints and pose timing; rendering mesh behind small visual adapter. Use fixed/clamped delta. Use `AnimationMixer` only if choosing authored clips. |
| Picking and action mapping | Interaction controller raycasts only explicit targets and emits semantic intents such as `open-project(projectId)` or `request-create-project`; never persists. |
| Accessible alternatives | Angular DOM mirrors every scene affordance with localized, keyboardable controls and visible focus. Canvas may be decorative/hidden from AT when equivalent actions are available. |
| Lifecycle | Host/runtime stop RAF, remove listeners, disconnect observers, abort work and dispose owned GPU resources on destroy/theme swap. Late async completion cannot publish to a destroyed scene. |

These are proposed boundaries, not implemented types. Keep the current raster preview as a reference until the new prototype passes art, workflow and lifecycle gates. After parity, maintain one production homepage path rather than two indefinitely.

## Art, motion, camera, theme and responsive plan

- **Assets:** procedural room volumes and simple props first. Prioritize the washer door, project board and Raccoon in art review. Readable labels/project names stay in DOM; textures may carry decoration only. Add authored art where it materially raises fidelity.
- **Motion:** minimum Raccoon states: idle, walk, arrive/turn, expressive interaction. Define transitions, bounded movement and obstacle behavior. Judge naturalness with captured runs, not interpolation smoothness alone.
- **Camera:** authored wide and portrait presets with safe framing. Keep project actions visible at small widths; avoid unrestricted orbit in the first homepage.
- **Semantic interactions:** scene objects signal actions; existing workflows perform them. Renderer receives read-only project data and cannot write it.
- **Themes:** one scene graph with four variants driven by existing theme preference. Check distinct identity and contrast, not palette alone. No translated text in textures.
- **Localization:** EN/VI names, dialogs, loading/error/accessibility messages remain in Angular translations.
- **Fallback:** if WebGL is unavailable, project work stays available in a clear DOM presentation.

## Prototype 1 acceptance gates

These proposed criteria are not yet met. Capture visual, interaction, and runtime evidence together.

1. **Real workflow:** show a hero scene with Raccoon and project board using real `ProjectSummary` data and existing create/open/delete-confirm/import/backup entry points. A created project survives reload in IndexedDB; open reaches Editor; delete requires current confirmation. Scene code does not mutate persisted data. Editor autosave, Undo/Redo and leave guard continue to work.
2. **Art direction:** capture 1440×900, 1024×768, 390×844 and 320×568. Score Raccoon silhouette/face, focal hierarchy, material/style, depth/readability and theme identity on a 1–5 rubric. Every category must be >=4 on desktop and narrow mobile; no theme below 4. Save reviewer scores, character close-up and scene view.
3. **Natural movement:** record >=20 target interactions across desktop/mobile. Reach targets without teleporting, floor penetration, or crossing fixed obstacles; turning/stopping settles without visible snapping; movement never obscures a primary DOM action. Reduced-motion preference keeps actions operable while removing or materially shortening nonessential motion.
4. **Themes/locales:** test all four (`craft`/Minecraft, `light`, `raccoon`, `dark`) × EN/VI (eight combinations). Theme comes from existing service and copy from `I18nService`; no embedded text. Check contrast and visible focus in each.
5. **Accessibility/actions:** every scene affordance has an equivalent keyboardable semantic DOM control with same localized action. Complete keyboard create/open/delete-confirm journeys, visible-focus review, and axe scan with zero critical/serious findings. Include screen-reader labels, loading/error/status and fallback messages.
6. **Responsive/fallback:** all four target viewports keep title/actions/essential project info visible, with no horizontal page overflow. Reframe camera instead of clipping controls. Simulate unavailable WebGL and verify DOM workflows remain usable with a clear explanation.
7. **Performance/lifecycle:** capture 60 seconds on documented desktop and mid-range mobile hardware. Target p95 frame interval <=20ms desktop and <=33.4ms mobile; investigate scene-attributable main-thread tasks >100ms. Run 20 mount/unmount cycles and theme swaps; show no accumulating RAF, listeners, observers, stale async publication or owned GPU resource growth. Report counters/heap where available; timing is not lifecycle proof.
8. **Automated/source evidence:** unit-test interaction mapping, Raccoon state transitions, camera framing, theme mapping, abort/destroy and disposal ownership. Browser-test workflow journeys, keyboard, responsive captures and fallback. Re-run relevant homepage and project/editor tests. Source audit confirms one project path and no renderer imports of persistence/router/editor-domain services.

If a gate depends on unavailable hardware/browser, record the exact environment and leave it open; do not pass it from unit tests or static inspection.

## Risks and unresolved evidence

- Live Tooplate interaction and device behavior were not verified: web extraction exposed only metadata/navigation, and browser automation was unavailable.
- Art quality, Raccoon asset approach, target hardware/browser frame rates, fallback presentation, and resource behavior need a real prototype.
- Four images do not explain prior rejection reasons. The 54 MB source asset package is a packaging/runtime risk to measure, not a demonstrated performance failure.
- Permission to redistribute the full template ZIP is unclear; it remains local and ignored.
- No production behavior or dependency changed in Goal 01. Existing homepage tests cover the raster preview only.

## Research references

- [Tooplate 2171 Spatial Diorama](https://www.tooplate.com/view/2171-spatial-diorama) and [Tooplate terms/about](https://www.tooplate.com/about).
- Three.js official docs: [resource disposal](https://threejs.org/manual/pages/how-to-dispose-of-objects.html), [Raycaster](https://threejs.org/docs/pages/Raycaster), [animation system](https://threejs.org/manual/pages/animation-system.html), [responsive rendering](https://threejs.org/manual/pages/responsive.html), and [WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer).
- PixiJS 8 official docs: [architecture](https://pixijs.com/8.x/guides/concepts/architecture), [events](https://pixijs.com/8.x/guides/components/events), [accessibility](https://pixijs.com/8.x/guides/components/accessibility), [application lifecycle](https://pixijs.com/8.x/guides/components/application), [assets](https://pixijs.com/8.x/guides/components/assets), and [render loop](https://pixijs.com/8.x/guides/concepts/render-loop). No PixiJS dependency is installed or proposed for prototype 1.
