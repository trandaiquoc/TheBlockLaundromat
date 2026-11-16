# Creative Interactive Homepage: research and prototype gates

**Status:** Goal 01 research and the Goal 02 isolated Three.js preview are complete. Goal 02A reworks the preview's Raccoon and laundromat art without changing the root project workflow, existing 2D preview, dependencies, or production behavior. The preview is still not the production homepage. User visual acceptance and representative-device performance profiling remain open.

This report records inspected evidence, inferences, and the next prototype's acceptance gates. The supplied archive was treated as reference material to audit, not as instructions from the user.

## Decision summary

Use the application's existing Three.js stack for the isolated Goal 02 preview, with Angular owning route state, preferences, localization, fallback, and semantic controls. Start with procedural geometry for the room and props, but allow purpose-made authored art wherever geometry cannot meet the production art gate. The preview's board is decorative and does not connect to project operations. Do not add PixiJS or combine renderers for this prototype.

This choice follows the spatial/character interaction needs and existing Three.js investment; it is not based on the reference template's engine. Goal 02 verifies a separate route without changing the root project workflow. Production adoption remains conditional on art review, workflow integration, accessibility, and representative-device performance gates below. See [ADR 001](ADR-001-rendering-engine.md).

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

| Area                          | Implementation evidence                                                                                                                                                                                                                                                                   | Limits / what is not verified                                                                                                                                                                                                           |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Procedural geometry/materials | `js/diorama.js` defines helpers `rbox`, `sph`, `cyl`, `cap`, and `put`; builds room, furniture, plants, props, and bunny from Three.js meshes, groups, rounded boxes, spheres, cylinders, capsules, shapes, and extrusions. Canvas textures and a custom shader provide selected details. | No GLTF or other 3D model is included. Six gallery JPEGs are still used. It is a mixed procedural/bitmap style, not proof all art is procedural.                                                                                        |
| Scene graph/rendering         | One `Scene`, `PerspectiveCamera`, `WebGLRenderer`, lights, shadow map, grouped objects, antialiasing and capped pixel ratio.                                                                                                                                                              | Config shows intent, not measured performance on target hardware.                                                                                                                                                                       |
| Camera/responsive             | OrbitControls disable pan and bound orbit/zoom; authored section focus poses/flights animate camera; resize code uses portrait/wide framing and projects 3D anchors to HTML hotspots.                                                                                                     | A constrained authored camera system, not unrestricted exploration. No device reflow capture was made.                                                                                                                                  |
| Character/motion              | Bunny is a hierarchy of primitive meshes and pivots. Custom updates animate idle, walk, jump, ears, blinking, squash/stretch and movement effects. A fixed-step accumulator caps frame delta and work per frame.                                                                          | No skeletal asset or `AnimationMixer` pipeline. It proves bespoke procedural motion exists, not that the Raccoon can meet our visual bar with primitives.                                                                               |
| Picking/interaction           | Raycaster intersects an explicit set of floor, section and bunny targets. Pointer handlers distinguish tap/drag, floor interaction moves the character, keyboard movement/jump and HTML hotspots/section controls are wired.                                                              | Real interaction is present in source, but it was not executed or tested across browsers.                                                                                                                                               |
| DOM integration               | `index.html` provides controls, dock, hotspots, panels and status/content UI; canvas is hidden from the accessibility tree. `js/app.js` owns panels/UI and communicates using `window.GM635`. Focus is moved into panels and restored to triggers.                                        | Useful separation pattern. Every important scene action still needs a semantic equivalent in our app.                                                                                                                                   |
| Accessibility                 | Native buttons/forms, labels, status/live-region patterns, focus handling, keyboard controls, reduced-motion styles/checks appear in `index.html`, `js/app.js`, `css/style.css`.                                                                                                          | Reduced motion is partial; source does not establish that all motion stops. No automated accessibility tree or actual keyboard audit. Hotspot opacity/pointer hiding may leave controls focusable; verify before calling this a defect. |
| Performance                   | Frame-time moving average can lower pixel ratio and later simplify shadow quality/map size. Animation delta/steps are capped.                                                                                                                                                             | No reproducible benchmark, target-device matrix or measured report is provided.                                                                                                                                                         |
| Resource lifecycle/failure    | WebGL capability check and failure/status path exist. Source starts a continuing RAF loop and installs event listeners; inspected code lacks a complete renderer/scene/listener/RAF teardown. Shadow-map disposal is only in a quality downgrade path.                                    | No route-scoped Angular lifecycle owner or complete teardown was found. Treat deterministic disposal as an integration requirement, not a pattern to copy. WebGL fallback equivalence is not proven.                                    |

### Transferable lessons and constraints

A bounded room with clear landmarks makes movement and picking legible. Procedural state-based animation can be expressive without a skeleton. Projected HTML hotspots and DOM panels can connect a scene to real content. Camera framing should adapt to portrait instead of cropping a desktop composition.

Do not copy the bunny-specific movement algorithm, continuous-loop lifecycle, partial reduced-motion behavior, or performance assumptions. Do not make raycasting the only way to invoke a project action. Do not copy the template's art or engine choice merely because it is a reference.

## Existing application audit

### Routes and current homepage

`Frontend/src/app/app.routes.ts` routes `/` to `ProjectScreenComponent`, the real project screen. `/editor` uses the existing editor leave guard. `/homepage-2d-preview` lazy-loads `HomepagePreviewComponent`; `/mini-diorama-preview` lazy-loads the Goal 02 3D study. Neither preview replaces `/`.

The preview validates `scene-manifest.json`, maps app themes `craft`, `light`, `raccoon`, `dark` to art packages, builds a 2D parent/pivot graph, loads PNGs as `ImageBitmap`s and draws ordered raster layers to Canvas 2D. Manifest `interactive` metadata does not currently create hit testing: `drawHomepageScene` draws images, and `renderCurrentTheme` passes an empty transform map. There is no scene camera, character controller or animation. DOM controls remain separate. The canvas has an accessible image label but does not expose individual depicted objects as semantic actions. Narrow CSS changes the crop, not the composition.

The preview does demonstrate good patterns: asynchronous cancellation, generation checks, `ResizeObserver`, DPR cap, `ImageBitmap.close()`, and destruction cleanup. The homepage package under `Frontend/source-assets/homepage/` contains 618 files and is about 54 MB on disk; manifests contain 82–84 layers/theme. Angular copies these source assets to runtime. Output transfer size and runtime memory were not measured here.

### Project, persistence, editor and preferences

The root project screen consumes `ProjectScreenWorkflow`, backup/import workflows, controls/account components, dialogs, and persistence services. Existing workflows cover create, list/search/sort, open, delete with confirmation, project package and Structure JSON import, and backup. Validation, activation, session reset, and editor routing are already owned by these workflows. The Goal 02 mini-diorama deliberately consumes no project summaries and dispatches no project workflow actions.

`PROJECT_STORE` resolves to `IndexedDbProjectStore`. `ProjectPersistenceService` validates/migrates project data and handles packages; editor/session services own active editor state. Undo/Redo is session history with autosave; editor leave handling protects pending work. Import/backup/Structure JSON paths already support cancellation/worker handling. The scene must consume read-only summaries and dispatch intent through these workflows; it must not add persistence or mutate project documents.

The theme service persists `craft`, `light`, `raccoon`, and `dark` (craft is presented as Minecraft). `I18nService` owns EN/VI. Keep all text in Angular localization; the scene may consume theme palettes/composition but should not bake translated copy into textures.

### Existing tests and renderer evidence

Homepage unit specs cover manifest validation, scene graph, renderer transforms and asset loading/cancellation. They prove parts of the current raster preview contract, not browser interaction for a new scene. Three.js is already used in the editor and its renderer baseline documents ownership/lifecycle patterns. This is useful project context, not evidence that an interactive homepage exists.

### Four concept images

`Docs/design/references/01-minecraft.png`, `02-light.png`, `03-raccoon.png`, and `04-dark.png` share a dense laundromat/project-board composition with palette/lighting variations. They provide direction for room identity and project-card placement. At screenshot resolution, some labels are tiny and text is baked into the image. They do not show motion, focus states, loading/error/empty states, responsive recomposition, semantic controls, or different project counts. Similar layouts aid palette comparison but do not prove every theme should differ only by color.

These are observable constraints, not proof of why any prior direction failed. No rejection rationale was found in reviewed docs; history was intentionally not inspected.

## Goal 02 implementation

### Route and ownership

The implementation stays within `Frontend/src/app/features/mini-diorama-preview/` and adds one lazy route. `MiniDioramaPreviewComponent` owns localized labels, selected DOM action, Settings open state, theme observation, WebGL fallback status, and the runtime's route lifetime. It uses existing `ProjectScreenControlsComponent` and `SettingsDialogComponent`; it does not inject router services, project workflows, persistence, or editor state.

`MiniDioramaSceneRuntime` owns the Three.js renderer, scene instance, camera, resize observation, visibility/reduced-motion listeners, animation frame, context-loss handling, and GPU teardown. It caps device pixel ratio at 1.75 and frame delta at 50 ms. The preview uses a 512×512 shadow map and limits shadow casting to hero shapes and the window sill. No scene assets load asynchronously, so there are no late asset promises to publish after destroy. A theme switch updates material/background colors in the existing scene; it does not rebuild or remount the scene.

| Owner                  | Current contract                                                                                                                                                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Angular route host     | Mounts after render, exposes semantic controls and fallback, applies existing theme and EN/VI services, disposes the runtime on destroy.                                                                                              |
| Scene runtime          | Creates one `WebGLRenderer`, owns resize/visibility/motion/context listeners and RAF, forwards typed intents, removes its canvas and disposes scene resources and renderer.                                                           |
| Camera rig             | Owns fixed overview plus washer, board, and Raccoon presets; selects wide/portrait framing and smooth or reduced-motion transitions. No free orbit.                                                                                   |
| Scene asset modules    | `mini-diorama-scene-assets.ts` assembles the scene; dedicated room, washer, board, and Raccoon builders own their geometry; `mini-diorama-scene-geometry.ts` owns shared primitives; materials and disposal live in separate modules. |
| Raccoon controller     | Owns bounded idle breathing, head/ear/tail movement, blink, greeting pose, and a static reduced-motion pose. There is no walking/pathfinding system.                                                                                  |
| Interaction controller | Raycasts only the washer, decorative board, and Raccoon roots; ignores drags over 8 CSS pixels and emits `focus-target` or `greet-raccoon` intents.                                                                                   |
| Angular DOM            | Mirrors overview, washer, board, and greeting actions with native buttons, localized labels, pressed state, and a polite live message. The canvas is hidden from assistive technology.                                                |

The board has three blank decorative cards and no project names or fake records. It is a scene test object only. The WebGL fallback uses a small CSS/DOM composition and keeps the four scene buttons available. Theme palettes alter the same scene's wall, floor, accent, and object materials; they are not four complete art variants.

### Asset provenance and visual inspection

Every mesh and material in this preview is generated in source with Three.js primitives, `RoundedBoxGeometry`, fitted `ShapeGeometry` face patches, and custom curved `BufferGeometry`. A deterministic, low-contrast wood-grain `DataTexture` is generated from code. The preview includes no Tooplate code, artwork, model, texture, or copied asset. The attached Raccoon screenshots informed shape language only; no screenshot, texture, or artwork was copied. No production asset was added.

The Goal 02 art assessment failed: the original mascot had glossy layered eyes, a humanoid torso, head spikes, and raised torus tail rings; the room read as a plastic showroom. Goal 02A replaces those forms with an oversized soft head, fitted warm-brown eye patches, shallow matte pupils, a compact seated body, and a continuous softly striped tail. The room now uses warm plank flooring, oak wainscoting, a cork-and-wood board, enamel washer, muted brass and linen accents, and softer warm lighting. This description records source changes, not a quality score.

The regular browser run captures `scene-1440x900.png`, `scene-1024x768.png`, `scene-390x844.png`, `scene-320x568.png`, `fallback-mobile-390x844.png`, and `project-screen-root.png` under ignored `Frontend/.artifacts/mini-diorama-preview/screenshots/`. Goal 02A's additional visual evidence is under ignored `Frontend/.artifacts/mini-diorama-preview/art-review/`: overview and hero views at desktop/mobile sizes, plus Raccoon front, three-quarter, side-profile, close-up, and greeting views. These images are local review evidence and are not committed.

This is enough evidence to assess the direction, not a formal art gate PASS. No independent design reviewer scored silhouette, material/style, hierarchy, contrast, or theme identity. SwiftShader captures are not evidence of representative-device frame rate or GPU quality.

### How to run and verify

From `Frontend/`:

```sh
npm start
```

Open `http://localhost:4200/mini-diorama-preview`. For the current automated browser proof, build first and run:

```sh
npm run build
npm run check:mini-diorama-browser
```

The browser script uses Chromium with SwiftShader for WebGL, then a separate WebGL-disabled Chromium session for fallback. It checks the four target viewports, semantic keyboard actions, mouse/touch picking for washer, board and Raccoon, all four application themes, EN/VI, Settings, reduced-motion operation, 20 route mount/unmount cycles and zero remaining scene RAF/canvas after unmount. It also verifies the root project-screen structure. Screenshots and browser profiles are generated under ignored `.artifacts/` and are not committed.

Goal 02 baseline verification (before Goal 02A): `npm run build` passed; `npm test -- --watch=false` passed 350 files / 2,191 tests with 7 files / 11 tests skipped by existing configuration; `npm run check:mini-diorama-browser` passed. The baseline SwiftShader diagnostics were variable and slow; they are historical measurements, not a performance target result. No mobile hardware, screen reader, axe scan, GPU-memory counter, 60-second performance run, or independent art score was available.

## Technology comparison

Qualitative fit for this app and scope; the Goal 02 browser capture is a rendering smoke check, not a representative-device benchmark or formal art scoring.

| Criterion                 | Three.js procedural-first                                                                                                                                 | PixiJS 2.5D                                                                                                       | Three.js + PixiJS                                                                   |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Art fidelity              | Volumetric light/material/depth suit an explorable laundromat. Procedural-only shapes risk looking generic; allow authored texture/model for key details. | Strong layered illustration, sprites, meshes and filters; volume/camera behavior must be intentionally simulated. | Broadest toolkit, but two visual languages must cohere.                             |
| Character                 | 3D turning, depth and grounded movement; procedural rig/state machine or authored clips. Raccoon still needs art review.                                  | Sprite/2D rig is natural; authored frames/layers add asset work and depth is simulated.                           | Flexible but splits pose/overlay ownership.                                         |
| Camera/interaction        | Perspective/orthographic cameras and Raycaster fit room-scale scene; DOM mirrors actions.                                                                 | Container camera and scene events fit fixed-view parallax; depth/occlusion requires a chosen model.               | Adds coordinate spaces, event bridge and tests.                                     |
| Responsive                | Reframe same scene with authored wide/portrait presets.                                                                                                   | Reposition layers or use alternate illustrated layouts.                                                           | Coordinate sizing and composition across renderers.                                 |
| Performance/accessibility | Existing engine/investment; budgets/shadows/continuous motion need profiling. Canvas needs semantic DOM and fallback.                                     | New dependency/runtime; sprite workloads may fit well; Pixi accessibility overlays do not replace workflow DOM.   | Highest GPU/context coordination risk and does not improve accessibility by itself. |
| Lifecycle/maintenance     | Reuse current knowledge, but new scene still needs route-scoped ownership/disposal.                                                                       | Separate app/assets/events lifecycle to learn and test.                                                           | Highest overlap and disposal burden; use only with evidence.                        |

### Recommendation and fallback

The Goal 02 preview uses the existing Three.js engine and establishes a procedural room, washer, board structure, Raccoon and props. If independent review finds the Raccoon lacks the required face, silhouette, or handmade quality, use purpose-made textures/decals or an authored/rigged character before production adoption. Keep readable UI in DOM.

Switch to PixiJS 2.5D only if the focused Three.js procedural pass plus bounded authored-art pass fails the Raccoon/illustration gate, while a Pixi spike meets it with less custom work and preserves real object actions. Reconsider hybrid only for a required effect that Three.js plus DOM cannot meet, with measured ownership/performance costs documented.

## Production integration boundary

The mini-diorama preview does not own or call production Project workflows. If a later goal integrates a scene with the homepage, keep the boundary as follows:

| Responsibility                                                    | Production owner and contract                                                                                                                                                        |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Root route, project list/forms, theme/language, semantic controls | Angular project-screen feature, existing theme service and `I18nService`; the current `/` route remains authoritative until a reviewed replacement ships.                            |
| Create/open/delete/import/backup                                  | Existing `ProjectScreenWorkflow` and dedicated workflows/services; delete retains confirmation and persistence remains IndexedDB-backed.                                             |
| Scene mount/unmount                                               | Route-scoped Angular host; supplies only required read-only summaries and presentation preferences; receives semantic typed intents; owns fallback and lifetime.                     |
| Three renderer, scene, camera, resize                             | A focused runtime with no router, IndexedDB, editor-session, or project-mutation dependency.                                                                                         |
| Geometry/materials/textures                                       | Scene asset builders with explicit resource ownership and disposal; authored art is allowed when procedural forms miss the reviewed bar.                                             |
| Character motion                                                  | Raccoon controller owns pose/motion state and bounded timing; the render rig remains an adapter. Use clamped deltas; use `AnimationMixer` only for authored clips.                   |
| Picking and action mapping                                        | Interaction controller raycasts explicit scene targets and emits typed intents; Angular maps real project actions through existing workflows.                                        |
| Accessible alternatives                                           | Angular DOM mirrors scene actions with localized, keyboardable controls and visible focus. Keep the canvas decorative/hidden from assistive technology when equivalents exist.       |
| Lifecycle                                                         | Host/runtime stop RAF, remove listeners, disconnect observers and dispose owned GPU resources on destroy. Add cancellation only when a future scene introduces asynchronous loading. |

Goal 02 implements the scene-side owners and a non-production host. It deliberately does not prove workflow parity or production homepage replacement. The existing raster preview remains available for comparison; a later production goal must choose one authoritative homepage path after parity.

## Goal 02A art direction recovery and remaining review

- **Character:** the Raccoon remains fully 3D. The face patches conform to the head ellipsoid, pupils and nose use shallow matte geometry, the neck is hidden by overlap, limbs are short, and the tail is one curved mesh with vertex-color bands. Idle, blink, and greeting use the existing rig contract; greeting raises and gently waves one arm. Walking and pathfinding remain out of scope.
- **Environment:** code-built oak panels and floorboards, cork-backed notice board, warm enamel washer, linen laundry, small supply shelves, and muted brass lamps establish one cozy vintage laundromat style. The scene remains a compact diorama rather than a full Homepage layout.
- **Camera and interaction:** the existing overview/washer/board/Raccoon presets and responsive framing remain. Scene targets still emit typed presentation intents; Angular buttons remain the semantic, keyboardable alternatives. No Project workflow is invoked.
- **Themes and localization:** one scene graph still receives `craft`, `light`, `raccoon`, and `dark` palettes; Angular owns EN/VI copy and preferences. Wood grain contains no text, and the four themes are palette variants rather than separate art builds.
- **Fallback and lifecycle:** the CSS fallback, reduced-motion handling, route teardown, raycasting, and owned-resource disposal remain. New shared wood texture is released by `disposeMiniDioramaScene` with the other scene resources.

Goal 02A verification: `npm run build` passed. `npm test -- --watch=false` passed: 350 test files passed and 7 were skipped; 2,192 tests passed and 11 were skipped. The focused mini-diorama suite passed 14 tests across 7 files, including the Raccoon head/body proportion, continuous vertex-colored tail, absence of tail torus rings, shallow eye contract, and generated texture disposal. `npm run check:encoding`, `npm run check:home-assets`, `npm run check:home-composition`, `npm run check:homepage-browser`, and `npm run check:mini-diorama-browser` passed. Composition comparison found zero pixel differences for each existing theme. The 2D browser suite preserved all four themes, EN/VI, viewport coverage and the traditional root Project Screen. The diorama browser check covers four viewports, keyboard controls, picking, all four themes, EN/VI, Settings, reduced motion, 20 route mount/unmount cycles, root Project Screen, and WebGL fallback. On headless Chromium with SwiftShader, the latest 120-frame diagnostic was median 66.7 ms / p95 133.4 ms; this is software-renderer evidence only, not a physical GPU benchmark.

The final-source browser captures, including overview, Raccoon front/profile/close-up/greeting, responsive views, and fallback, are under the ignored `Frontend/.artifacts/mini-diorama-preview/` directory. They are review evidence and are not committed. Modified source and this report passed Prettier checks; `git diff --check` was clean.

The art gate is **open for user visual acceptance**. No character-appeal, facial-fidelity, material/style, composition, or scene-cohesion score is recorded; this report does not self-declare PASS. Representative GPU/mobile performance, contrast review, assistive-technology review, a 60-second performance run, and a GPU-resource-growth report also remain unverified.

## Goal 01 production homepage gates

These are future production criteria, outside Goal 02. Goal 02 does not claim these gates PASS. Capture visual, workflow, accessibility, and runtime evidence together before replacing the production root.

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

- Live Tooplate interaction and device behavior remain unverified; its archived source audit is not a live-browser test.
- The current captures do not establish a formal art score, representative hardware/browser frame rate, GPU-memory growth, or assistive-technology quality.
- Four images do not explain prior rejection reasons. The 54 MB source asset package is a packaging/runtime risk to measure, not a demonstrated performance failure.
- Permission to redistribute the full template ZIP is unclear; it remains local and ignored.
- Goal 02 adds one preview route and localization strings; it does not change root project behavior, dependencies, persistence, or Editor. Existing homepage tests still cover the raster preview only.

## Research references

- [Tooplate 2171 Spatial Diorama](https://www.tooplate.com/view/2171-spatial-diorama) and [Tooplate terms/about](https://www.tooplate.com/about).
- Three.js official docs: [resource disposal](https://threejs.org/manual/pages/how-to-dispose-of-objects.html), [Raycaster](https://threejs.org/docs/pages/Raycaster), [animation system](https://threejs.org/manual/pages/animation-system.html), [responsive rendering](https://threejs.org/manual/pages/responsive.html), and [WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer).
- PixiJS 8 official docs: [architecture](https://pixijs.com/8.x/guides/concepts/architecture), [events](https://pixijs.com/8.x/guides/components/events), [accessibility](https://pixijs.com/8.x/guides/components/accessibility), [application lifecycle](https://pixijs.com/8.x/guides/components/application), [assets](https://pixijs.com/8.x/guides/components/assets), and [render loop](https://pixijs.com/8.x/guides/concepts/render-loop). No PixiJS dependency is installed or proposed for prototype 1.
