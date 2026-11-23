# Homepage architecture and historical design records

## Current contract - Goal 06 (2026-11-23)

The root route `/` is the only Homepage route. `HomepageComponent` persists the selected mode and lazy-loads `DioramaHomeComponent` or `ProjectScreenComponent`. Fresh, mode-less, invalid-mode, and migrated preferences default to Diorama. A valid explicit Simple choice is preserved. Migration preserves theme, language, editor preferences, project data, and other settings without clearing localStorage or IndexedDB.

Simple remains the owner of project creation, opening, search, sorting, deletion, Structure JSON import, package restore, and their existing persistence. Recent project rows expose Open and Delete actions with project size details. The redesign keeps those workflows and presents a larger brand logo with one functional Projects heading, responsive themed controls, and localized empty states.

Simple and Diorama use one shared account menu for identity, homepage appearance selection, Settings, and guest/logout. Selecting Simple or Diorama applies and saves the preference immediately. The menu contains no language selector. Settings owns EN/VI under General; it no longer owns Homepage appearance. Diorama has no duplicate Projects navigation button. WebGL fallback keeps the shared menu available.

The Diorama runtime keeps one room GLB, one profile, and focused camera, input, time, animation, loading, and resource owners. One pointer controller arbitrates gestures: horizontal Overview swipes scrub semantic time, vertical drags orbit, middle drag pans, wheel zooms, and two-finger pinch zooms while panning. Board and Washer focus restrictions remain explicit. The horizontal focus toolbar sits at the bottom-left across desktop and mobile, clear of the clock. Clock dragging and swipes update the same continuous time progress. Progress starts at Morning at the top of the dial and advances clockwise through Minecraft, Raccoon, and Dark. A left-to-right Overview swipe advances Morning to Minecraft; every theme step rotates the room one full turn, including the Minecraft-to-Morning wraparound. Release settles to the nearest stage, and interrupted transitions continue from their current progress and room angle. Reduced motion and the Scene Animations preference retain functional controls without unwanted motion.

One scene animation lifecycle owns theme and time transitions, room rotation, and RAF scheduling. The room renders on demand and stops rendering at idle. Static shadows continue to use the pivot-local proxy batch; moving casters request shadow refreshes only while moving. The Goal 06 browser check passed 20 mount/unmount cycles with no live tracked WebGL objects after each teardown.

Goal 06 automated browser evidence is under ignored `Frontend/.artifacts/goal-06/`: 32 Simple, account, and Diorama captures cover desktop and mobile in all four themes, and `traces/diorama-time-swipe-trace.json` records the time swipe. The current headless Chromium/SwiftShader diagnostics compare against Goal 05; they are software-renderer evidence, not hardware performance results. Physical desktop/mobile performance remains unverified.

**Visual review is pending. Goal 06 Gate G and 100% acceptance are not claimed.** Review the captures and motion trace before marking visual acceptance. See [Goal 05 browser diagnostics](goal-05-performance.md) for the prior baseline and its historical hardware measurements.

## Historical records

**Historical Goal 02D status:** Goal 01 research and the engine decision are complete. The Goal 02B preview art direction was rejected in user review. Goal 02C concepts passed the art gate on 2026-11-17; their working look-dev package was later removed at the user's direction on 2026-11-19. The current room composition is documented in [Stage 2](stage-2-spatial-concepts/README.md). Goal 02D integrated an original Puddlepaw Raccoon candidate into the separate preview route; Art Gate A remained pending at that checkpoint. Room A and four-theme production were paused. The preview was not the production homepage.

**Historical Goal 02E result (2026-11-18):** The earlier assembled laundromat GLB was integrated into `/mini-diorama-preview`. At the user's direction, `/` remained the existing Project Screen. That preview applied the pack's four authored material variants.

**Historical Goal 03 result (2026-11-18):** `/homepage-integration-preview` combined the existing Project Screen workflows with the shared scene runtime. The root route remained unchanged.

**Historical Stage 3 integration:** `/mini-diorama-preview` loaded the supplied `Room/Octagonal-Laundromat.glb`; `/` and Project Screen workflows were unchanged at that checkpoint. That route was removed in Goal 05. See [Stage 3 asset handoff](stage-3/README.md) for the preserved source archive and provenance record.

**Historical Goal 04 record (2026-11-20):** The user approved the Stage 3 captures. Goal 04 then refined the spatial preview on `/mini-diorama-preview`; Goal 05 moved that experience to the root mode and removed the preview route. See [Stage 4 implementation and review](stage-4/README.md) for the archived interaction details.

This report records inspected evidence, inferences, and prototype acceptance gates. The supplied `ASSETS.md` and catalogs describe the model payload and its node contracts; they do not override the user's integration request.

## Goal 02E — assembled asset integration

The user selected `/mini-diorama-preview` as the only integration target and asked to leave `/` unchanged. The route loads `Frontend/source-assets/homepage/models/laundromat/Laundromat.glb`, a 4,088,540-byte scene from the supplied Goal-02D asset pack. The unused Goal 02D Puddlepaw source model, atlas, standalone GLB, and per-asset README were removed on 2026-11-18 at the user's request; the assembled scene already contains its Raccoon.

The assembled scene contains the washer, notice board, lantern, and Raccoon. Its four `KHR_materials_variants` are applied by a focused GLTFLoader plugin: `craft` maps to `Minecraft`, with `light`, `raccoon`, and `dark` mapping to their same-named variants. Three.js sanitizes the source node names on load, so interaction and motion bind to the parsed names `Washer`, `Notice_board`, `Lantern`, `Raccoon`, `ForelegL`, `Head_•_broad_cheek_mask`, and `Tail_•_banded`. The assembled file already contains the Raccoon; the preview does not load a second character model.

The scene runtime still owns loading cancellation, renderer and camera lifecycle, resize and visibility behavior, reduced motion, picking, theme application, context-loss fallback, and GPU resource disposal. The semantic DOM actions remain the equivalent controls. This route remains a visual study; it does not connect project data or workflows, and it does not replace `/`.

The supplied archive contains no `LICENSE`, `COPYING`, `NOTICE`, or provenance text file. Rights and attribution for this provided pack are unresolved; this preview integration does not establish production redistribution approval.

Goal 02E verification on 2026-11-18: `npm run build`, the 9-file / 21-test mini-diorama suite, `npm run check:mini-diorama-browser`, `npm run check:homepage-browser`, `npm run check:home-assets`, `npm run check:home-composition`, `npm run check:encoding`, and `npm run test:tools` passed. The mini-diorama browser run captured four viewports and four theme views under ignored `Frontend/.artifacts/mini-diorama-preview/`; its SwiftShader diagnostic was median 50 ms / p95 66.7 ms and is not representative hardware evidence. `npx prettier --check` passed for the changed code. There is no lint script in `Frontend/package.json`.

At the Goal 02E checkpoint, the full suite was not green in this Windows Node 26.13.1 environment. Without Node's `--localstorage-file` option, 124 tests failed because `localStorage` was unavailable. With a localStorage file, 349 files / 2,196 tests passed and 3 files / 3 tests failed (7 files / 11 tests skipped); each of those three specs passed when run alone with fresh storage. Goal 03 verification below resolves the shared-storage test race. No representative GPU/mobile performance run, 60-second lifecycle check, screen-reader/contrast review, or formal art score was completed at that checkpoint.

## Historical Goal 03 - integrated project workspace preview

The separate `/homepage-integration-preview` route embeds the existing `ProjectScreenComponent` and enables its preview presentation. It reuses the established create, open, search, sort, delete-confirmation, Structure JSON import, project backup export, and package restore workflows and their IndexedDB persistence. It does not create sample projects or a parallel persistence path. The `ProjectScreenComponent` root route still receives its default `integrationPreview=false`, so `/` retains the existing Project Screen.

`MiniDioramaScenePanelComponent` owns the shared scene host, runtime mount/dispose lifecycle, theme propagation, semantic scene actions, and WebGL fallback. Both routes use this panel and `MiniDioramaSceneRuntime`; the scene kind is selected by the route consumer. The Stage 3 route uses the octagonal room assembly, while the integrated workspace keeps the earlier assembled scene. Washer and project-board actions focus the corresponding project controls. Raccoon greeting stays presentational and does not change project data.

At desktop widths, the preview uses three columns for project creation/import, the scene, and recent projects. Tablet widths retain three columns with narrower proportions; mobile stacks the scene, form, and recent projects and allows page scrolling. Language and theme controls reuse the existing services. Scene and fallback actions remain semantic DOM buttons, with focus/status feedback outside the canvas.

The full-suite localStorage failures recorded at the Goal 02E checkpoint came from Vitest workers sharing the same persistent storage file. `Frontend/src/test-setup.ts` now installs a per-test in-memory `Storage` instance and clears it before each test, avoiding cross-worker preference races without deleting or weakening specs.

Goal 03 verification on 2026-11-18: `npm run build` passed; `npm test -- --watch=false` passed 353 files / 2,200 tests, with 7 files / 11 tests skipped; `npm run test:tools`, `npm run check:home-assets`, `npm run check:home-composition`, `npm run check:encoding`, `npm run check:homepage-browser`, and Prettier checks passed. `npm run check:mini-diorama-browser` passed the original route's theme/localization, fallback, reduced-motion, and 20 route mount/unmount cycle checks. The new `npm run check:homepage-integration-browser` passed the four target viewports, four material variants, EN/VI, keyboard focus traversal, scene-to-form focus, create/open/delete, invalid and successful Structure JSON import, package cancellation/restore, backup export, search/sort, reduced motion, root-route boundary, and integrated WebGL fallback workflows. Captures are stored in ignored `Frontend/.artifacts/homepage-integration-preview/screenshots/`.

The latest headless SwiftShader frame interval was 100 ms median / 100.1 ms p95. This software-renderer diagnostic does not establish performance on representative desktop or mobile hardware. The supplied asset pack still lacks license/provenance evidence, and no formal screen-reader, contrast, or art-direction score review was performed. Production adoption remains gated on those reviews and representative hardware measurements.

## Decision summary

Use the application's existing Three.js stack for the isolated Goal 02 preview, with Angular owning route state, preferences, localization, fallback, and semantic controls. Start with procedural geometry for the room and props, but allow purpose-made authored art wherever geometry cannot meet the production art gate. The preview's board is decorative and does not connect to project operations. Do not add PixiJS or combine renderers for this prototype.

This choice follows the spatial/character interaction needs and existing Three.js investment; it is not based on the reference template's engine. Goal 02 verifies a separate route without changing the root project workflow. Concept art approval does not approve production adoption, which remains conditional on implementation, workflow integration, accessibility, and representative-device performance gates below. See [ADR 001](ADR-001-rendering-engine.md).

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

Tooplate's [About page](https://www.tooplate.com/about) permits personal and commercial website use and removal of credit, while prohibiting redistribution of the template file on template websites or template collection websites. At the user's request, the unmodified ZIP is tracked in this project repository for a Linux-to-Windows handoff. The repository is public, so pushing makes the archive publicly downloadable; the About page does not explicitly resolve redistribution from a general source-code repository. This is recorded as an unresolved licensing boundary, not a grant of broader rights. `js/vendor/LICENSE-three.txt` covers the bundled Three.js code only; it does not grant rights to redistribute the template or its artwork. Recheck the terms before any further distribution. Adding a future ignore rule will not remove the archive from commits already in Git history.

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

## Historical Goal 02 procedural prototype (superseded)

### Route and ownership

The implementation stays within `Frontend/src/app/features/mini-diorama-preview/` and adds one lazy route. `MiniDioramaPreviewComponent` owns localized labels, selected DOM action, Settings open state, theme observation, WebGL fallback status, and the runtime's route lifetime. It uses existing `ProjectScreenControlsComponent` and `SettingsDialogComponent`; it does not inject router services, project workflows, persistence, or editor state.

`MiniDioramaSceneRuntime` owns the Three.js renderer, scene instance, camera, resize observation, visibility/reduced-motion listeners, animation frame, context-loss handling, and GPU teardown. It caps device pixel ratio at 1.75 and frame delta at 50 ms. The preview uses a 512×512 shadow map and limits shadow casting to hero shapes and the window sill. No scene assets load asynchronously, so there are no late asset promises to publish after destroy. A theme switch updates material colors, key/fill/pendant lighting, background/fog, and day/dusk/night window details in the existing scene; it does not rebuild or remount it.

| Owner                  | Current contract                                                                                                                                                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Angular route host     | Mounts after render, exposes semantic controls and fallback, applies existing theme and EN/VI services, disposes the runtime on destroy.                                                                                              |
| Scene runtime          | Creates one `WebGLRenderer`, owns resize/visibility/motion/context listeners and RAF, forwards typed intents, removes its canvas and disposes scene resources and renderer.                                                           |
| Camera rig             | Owns fixed overview plus washer, board, and Raccoon presets; selects wide/portrait framing and smooth or reduced-motion transitions. No free orbit.                                                                                   |
| Scene asset modules    | `mini-diorama-scene-assets.ts` assembles the scene; dedicated room, washer, board, and Raccoon builders own their geometry; `mini-diorama-scene-geometry.ts` owns shared primitives; materials and disposal live in separate modules. |
| Raccoon controller     | Owns bounded idle breathing, head/ear/tail movement, blink, greeting pose, and a static reduced-motion pose. There is no walking/pathfinding system.                                                                                  |
| Interaction controller | Raycasts only the washer, decorative board, and Raccoon roots; ignores drags over 8 CSS pixels and emits `focus-target` or `greet-raccoon` intents.                                                                                   |
| Angular DOM            | Mirrors overview, washer, board, and greeting actions with native buttons, localized labels, pressed state, and a polite live message. The canvas is hidden from assistive technology.                                                |

The board has three blank decorative cards and no project names or fake records. It is a scene test object only. The WebGL fallback uses a small CSS/DOM composition and keeps the four scene buttons available. The window switches between daylight with block trees, a dusk skyline, and a moonlit skyline. These Goal 02B captures were not approved; the user later rejected that art direction. The later Goal 02C theme concepts were approved, but their old review package was removed; the current composition reference is [the octagonal room concept](stage-2-spatial-concepts/approved-octagonal-room.png).

### Asset provenance and visual inspection

The room, washer, board, and props use source-built Three.js geometry and materials. Raccoon geometry is now built from `BoxGeometry` cuboids and one purpose-made 64×64 `DataTexture`; the earlier sphere/capsule construction path has been removed. The source texture uses warm gray fur, cream forehead and muzzle regions, dark eye-mask pixels, brown paws, and a banded tail. The side UVs carry the face pattern around the head so the face does not read as a flat decal. The authored texture and geometry are original; Alex's Mobs code and texture were inspected as references but were not copied or redistributed.

The previous model did not meet the visual bar: user review identified the silhouette and face as visibly different. Goal 02B replaced its geometry and texture rather than extending the old model. The cuboids follow the reference extents at a shared scale: body 11×15×8 in the upright pose (the source 11×8×15 cuboid reoriented), head 9×7×5, muzzle 4×3×3, limbs 2×7×2, ears 2×2×1, and tail 5×5×19. The face has stepped eye-mask patches, a narrow cream blaze, a smaller muzzle, and low-profile pixel eyes. Neutral front, three-quarter, side, and close-up renders were regenerated from that candidate under ignored `Frontend/.artifacts/mini-diorama-preview/art-review/` as `raccoon-front-fullbody.png`, `raccoon-three-quarter.png`, `raccoon-side-profile.png`, and `raccoon-closeup.png`. These Goal 02B captures are historical; the user rejected that art direction. Current original Raccoon assets are documented in [the Stage 2 asset package](../../../Frontend/source-assets/homepage/models/raccoons/README.md) and remain pending visual review.

The [Minecraft Guides Raccoon page](https://www.minecraft-guides.com/wiki/alexs-mobs/raccoon/), [Alex's Mobs `ModelRaccoon.java`](https://github.com/AlexModGuy/AlexsMobs/blob/1.20/src/main/java/com/github/alexthe666/alexsmobs/client/model/ModelRaccoon.java), and [original raccoon texture](https://github.com/AlexModGuy/AlexsMobs/blob/1.20/src/main/resources/assets/alexsmobs/textures/entity/raccoon.png) were opened and inspected. The source defines a 64×64 texture, an 11×8×15 body, 9×7×5 head, 4×3×3 snout, 2×7×2 limbs, 2×2×1 ears, and a 5×5×19 tail; its head, tail, and limbs are parented under the body, and its upright begging pose uses body/head counter-rotation. The new builder uses the reference's cuboid hierarchy, attachment language, face mapping, and pixel-art style, but its geometry dimensions, face texture, and UV atlas are custom. The supplied image and guide page were compared against front, three-quarter, and side renders from the new builder.

The Alex's Mobs [CurseForge license page](https://www.curseforge.com/minecraft/mc-mods/alexs-mobs/license) currently lists LGPLv3. The inspected GitHub branch has no `LICENSE` file, and its open [licensing clarification issue #1969](https://github.com/AlexModGuy/AlexsMobs/issues/1969) records concern about the license being correctly applied. Whether that listing covers the specific model source and texture is unresolved, so neither has been copied or redistributed. Retain the references and measurements only unless the maintainer confirms the assets' licensing scope.

For the Goal 02B candidate, visual inspection did not establish an independent art score, representative-device frame rate, or GPU quality; that art direction was later rejected. Goal 02C's concept art gate is approved, while production scoring and device/performance checks remain unverified.

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

Goal 02 baseline verification (before the later Raccoon rework): `npm run build` passed; `npm test -- --watch=false` passed 350 files / 2,191 tests with 7 files / 11 tests skipped by existing configuration; `npm run check:mini-diorama-browser` passed. The baseline SwiftShader diagnostics were variable and slow; they are historical measurements, not a performance target result. No mobile hardware, screen reader, axe scan, GPU-memory counter, 60-second performance run, or independent art score was available.

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

## Goal 02B visual status — 2026-11-17

**Result: FAIL — art direction rejected by the user.** The isolated implementation and its technical verification remain historical evidence; they do not make the Raccoon, room, or theme art accepted. Do not patch the rejected models as part of Goal 02C. Its working concept package was removed at the user's direction; current design work is recorded in [Stage 2](stage-2-spatial-concepts/README.md).

- **A — Character:** front, three-quarter, side, and close-up renders remain at Frontend/.artifacts/mini-diorama-preview/art-review/; the face and proportions were rejected. The later Goal 02C turnaround options were removed with the superseded look-dev package; new original source models are documented in the Stage 2 asset package.
- **B — Environment:** the prior room art was rejected for its visual direction and build complexity. Goal 02C's tiled-floor concepts were superseded; the current selected octagonal composition is documented in [Stage 2](stage-2-spatial-concepts/README.md).
- **C — Four themes:** the prior theme set was not accepted. Goal 02C's same-room theme concepts were removed with the superseded look-dev package; the app still supports all four theme keys, but no new room theme art has been approved.
- **D — Technical:** build, full unit suite, both homepage browser checks, asset/composition/encoding checks, and tool tests passed. The diorama browser check covered actions, themes, localization, reduced motion, fallback, responsive bounds, root Project Screen, and 20 route mount/unmount cycles.
- **Reference handling:** the source model, texture, and guide image were inspected; none were copied. CurseForge lists LGPLv3, while the inspected repository branch and open licensing issue leave the license scope of these specific assets unresolved.

### Historical Goal 02A verification (superseded Raccoon model)

Before the user's face/silhouette correction, Goal 02A passed `npm run build`, the full 350-file / 2,192-test suite (7 files and 11 tests skipped), encoding/assets/composition checks, and browser checks for the root project screen, previews, themes, EN/VI, keyboard, picking, reduced motion, fallback, and route cleanup. Its Raccoon model used an ellipsoid body/head and curved tail and was subsequently rejected in visual review; those results do not validate the current Raccoon art. The recorded SwiftShader median of 66.7 ms / p95 133.4 ms was software-renderer evidence only.

Goal 02A baseline verification captured on 2026-11-16: `npm run build` and the 350-file / 2,192-test suite passed (7 files and 11 tests skipped). Encoding/assets/composition checks and the earlier mini-diorama browser checks passed. Those results predate the current Goal 02B geometry and texture changes; see the Goal 02B verification below for current evidence.

Goal 02B verification captured on 2026-11-17 at 02:32 UTC: `npm run build` passed; `npm test -- --watch=false` passed 350 files / 2,192 tests with 7 files / 11 tests skipped; `npm run check:mini-diorama-browser` and `npm run check:homepage-browser` passed; `npm run check:home-assets`, `npm run check:home-composition`, `npm run check:encoding`, and `npm run test:tools` passed. Four current Raccoon views and all theme/viewport captures were regenerated under ignored `.artifacts/`. The SwiftShader diagnostic was median 33.3 ms / p95 50 ms over 120 frames; this is not a hardware performance result. At capture time, the Goal 02B art and theme gates awaited user review; that art direction was later rejected and replaced by the Goal 02C concepts, which the user approved. Representative GPU/mobile performance, contrast review, assistive-technology review, 60-second timing, and GPU-resource-growth evidence remain unverified.

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
- At that Goal 02 checkpoint, the captures did not establish a formal art score, representative hardware/browser frame rate, GPU-memory growth, or assistive-technology quality. Goal 05 later recorded Intel UHD GPU-process memory across 20 desktop mount/unmount cycles; those counters do not isolate Diorama-specific bytes or establish mobile GPU-memory behavior. Assistive-technology quality remains unreviewed.
- The Goal 02 review images did not explain prior rejection reasons. Goal 05's current production runtime allowlist is 12.2 MB; the earlier 54 MB source asset package was a packaging concern, not a measured runtime failure. See the [Goal 05 browser diagnostics](goal-05-performance.md) for the package comparison.
- The public repository now contains the unmodified template ZIP at the user's direction for machine migration. The scope of permission for public source-repository distribution remains unverified.
- At its checkpoint, Goal 02 added a preview route and localization strings without changing the root route, dependencies, persistence, or Editor. Goal 05 retired that route and moved the mode-based Homepage to `/`; its browser check now covers Simple and Diorama workflows, fallback, themes, and lifecycle.

## Research references

- [Tooplate 2171 Spatial Diorama](https://www.tooplate.com/view/2171-spatial-diorama) and [Tooplate terms/about](https://www.tooplate.com/about).
- [Minecraft Guides Raccoon reference](https://www.minecraft-guides.com/wiki/alexs-mobs/raccoon/), [Alex's Mobs model source](https://github.com/AlexModGuy/AlexsMobs/blob/1.20/src/main/java/com/github/alexthe666/alexsmobs/client/model/ModelRaccoon.java), and [raccoon texture source](https://github.com/AlexModGuy/AlexsMobs/blob/1.20/src/main/resources/assets/alexsmobs/textures/entity/raccoon.png). The code and texture were inspected only; they are not redistributed here.
- Three.js official docs: [resource disposal](https://threejs.org/manual/pages/how-to-dispose-of-objects.html), [Raycaster](https://threejs.org/docs/pages/Raycaster), [animation system](https://threejs.org/manual/pages/animation-system.html), [responsive rendering](https://threejs.org/manual/pages/responsive.html), and [WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer).
- PixiJS 8 official docs: [architecture](https://pixijs.com/8.x/guides/concepts/architecture), [events](https://pixijs.com/8.x/guides/components/events), [accessibility](https://pixijs.com/8.x/guides/components/accessibility), [application lifecycle](https://pixijs.com/8.x/guides/components/application), [assets](https://pixijs.com/8.x/guides/components/assets), and [render loop](https://pixijs.com/8.x/guides/concepts/render-loop). No PixiJS dependency is installed or proposed for prototype 1.
