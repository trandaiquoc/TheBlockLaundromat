# Goal handoff — The Block Laundromat Homepage asset reconstruction

- Checkpoint date: 2026-10-19 (Asia/Bangkok)
- Repository: D:\minecraft-myaddons\TheBlockLaundromat
- Active Goal: PIXEL-FAITHFUL HOMEPAGE ASSET RECONSTRUCTION
- State: in progress; do not close or replace the existing Goal.
- Push: not authorized; do not push.
- Current source of truth: source-current-goal-objective.txt (copied byte-for-byte from the active Codex objective attachment).
- Older context: source-initial-goal-objective.md (preserved from the earlier user request; it describes the broader UI/UX Goal and is not the active task specification).

## Current status supersedes historical checkpoint notes below

- Current artwork code checkpoint: `f450e4d97db6e4ffbb610908ab86dc8c7439bec1`. The local branch also contains earlier Workspace/homepage commits; none were pushed in this handoff.
- The tile alignment implementation, source-crop tool, manifest entry, focused browser screenshot, and regression assertion are committed. Targeted Project Screen tests pass 7/7; production build passes with the unchanged stylesheet soft-budget warning; encoding, formatting, and diff checks passed.
- The currently active Goal is still incomplete. Continue from the active objective and final repository state; do not mark it done from this report.
- This report bundle is copied under `Trash docx/Goal-Report-2026-10-19/` and is not an application runtime dependency. Read its `README.md` first. The operational state bullets in older sections below describe the checkpoint when they were written and are historical.

## Addendum: board-header controls checkpoint (`f450e4d`)

- Removed the baked Craft board title, search icon/placeholder, and sort label/caret with a measured, source-derived cleanup layer. Original parchment and search/sort frames remain visible.
- The Angular heading is visible after the source grass-block marker (source x≈1067). Search and sort are live controls, including in the empty Craft board. Empty-list behavior for Light/Raccoon/Dark is unchanged.
- Extractor: `Frontend/tools/project-screen-assets/extract-minecraft-board-header-cleanup.py`. It checks the approved 1672 × 941 source, validates glyph removal, exact alpha bounds, saved image dimensions, and recomposited output.
- Browser evidence: `Docs/design/homepage-renovation/evidence/20261019-board-header-live/` contains source-size EN/VI screenshots. CDP verified labels, asset load, positions, input/select events, and no page exception, console warning/error, or failed request. Chrome stderr showed GCM and headless GPU/WebGPU diagnostics only.
- Targeted tests: 13/13. Full suite: 329 files passed, 7 skipped; 2,061 tests passed, 11 skipped. App/spec/worker typechecks, production build, encoding, Prettier, JSON parse, and diff checks passed.
- Build warning remains: `project-screen.component.scss` 29.86 KB versus 20 KB soft budget; below unchanged 30 KB hard cap. Earlier Block Usage keyboard failure was not reproduced by the current full suite.
- The full artwork goal remains incomplete; this checkpoint does not close it.

## Addendum: tile-alignment checkpoint

- Current code checkpoint: `6b32b1c3e7fa9c03ceb9653501286b4e731a9b5a` (`fix(project-screen): align craft create tile`).
- The live Craft create tile is offset with `translate(-4.2%, 3.8%)` to compensate for the board perspective. The measured 142 × 156 source crop is exact; its Python/Pillow extractor was run and its pixels matched both source and runtime PNG.
- Browser proof at 1672 × 941: the real create menu opens from the tile and closes with Escape. The screenshot is `evidence/craft-empty-tile-aligned-browser-1672x941.png` in this package; the canonical copy is in `Docs/design/homepage-renovation/evidence/20261019-craft-tile-alignment/`.
- Targeted Project Screen tests pass 7/7; production build passes at 29.99 KB component stylesheet, with its existing 20 KB warning budget exceeded by 9.99 KB. No budget was changed.
- The wider artwork Goal is still incomplete. The full static Minecraft scene, source-specific Light/Raccoon/Dark extraction, all-theme visual acceptance, and real populated renderer preview proof remain open. Do not close the Goal.
- This report package lives under `Trash docx/Goal-Report-2026-10-19/`; it is not a runtime dependency. Deleting it will not break the app, but removes this handoff and copied references/evidence.

## Start here

1. Read this file fully.
2. Read continuation-prompt.md fully, including its verbatim copy of the complete active objective at the end.
3. Read source-current-goal-objective.txt fully. Do not use the older objective to override it.
4. Read repository AGENTS.md, Frontend/AGENTS.md, the renovation README/inventory/manifest, and inspect current source and Git status.
5. Open all four immutable references at Docs/design/references/01-minecraft.png through 04-dark.png. They are the source of truth, each 1672 × 941. Inspect them visually; do not rely only on old screenshots or this note.
6. Continue the existing Goal and preserve the user's priority: Minecraft theme first, pixel-faithful to the reference, then extract assets and derive the remaining themes from evidence. Do not create a new Goal or mark this Goal complete.

## User intent and design constraints captured across the conversation

- The references in Docs/design/references/ are authoritative. Previous generated/reconstructed-looking results were repeatedly rejected as visibly different. Match source colors, geometry, perspective, object proportions, placement, shadow and small detail; do not generate unreferenced art.
- Start with the Minecraft reference and reproduce the full static composition before cutting it into independently usable assets. Only then derive the other three themes and make their transitions coherent. Do not claim the themes are complete because their controls change colors; their reference scenes are materially distinct.
- Artwork may be separated from a source background when a measured, clean extraction is possible. Reconstruct pixels hidden by an object only when necessary, using the surrounding source as evidence. Do not cover source artwork with an unmeasured patch, silently substitute AI imagery, or flatten live controls back into the background.
- The exterior view must remain compatible across theme transitions in lighting/time and avoid a jarring scene jump, while each approved reference remains the visual evidence for its own theme. Resolve this using measured source regions and a deliberate transition treatment; do not erase visible differences in the references without verifying the intended composition.
- The logo should read as mounted on the wall with correct size, perspective and shadow. The board, washer, two washer controls, drum, project card, props, both raccoons, basket and account/settings controls must match the source placement and visual style. Baked sample copy and fake controls must become real DOM where functionality is required.
- The washer drum must show the application's actual selected project preview over a visible grid, not just a black placeholder. The project board must use actual projects, not baked sample projects. Preserve persistence, route behavior and existing controls.
- User explicitly asked the developer to inspect a screenshot after changes and only pass visually when the result is actually correct. A single relevant screenshot is useful; do not produce screenshot matrices or claim visual parity from automated tests alone.
- Conversation began with a real project-thumbnail bug and a long preview lifecycle audit. That work is already part of the repository baseline and is not a reason to rewrite preview infrastructure during this artwork Goal. Preserve those contracts and inspect consumers before any related change.

## Repository and workflow constraints

- AGENTS.md and Frontend/AGENTS.md were read this checkpoint. Their requirements include: inspect specific instructions/docs before editing; keep feature work scoped; do not guess Minecraft behavior; use real references/fixtures; keep generated/debug artifacts out of canonical source/docs; run relevant checks; report what was actually verified; preserve UI ownership (Angular for controls, Three.js for renderer); do not push.
- Do not read Git history from the beginning. Do not reset, revert broadly or replace the working tree. Do not create another Goal.
- No tests or screenshots should be labeled as visual acceptance unless they inspect the rendered app at source dimensions and the actual relevant data state.
- No image generation was used in the current checkpoint. Current scene/asset work uses exact source pixels and deterministic PowerShell scripts. If later using image generation, only target source-occluded/missing regions and pass the reference image; user rejected unreferenced generation.
- The current checkout contains the existing Docs/design/homepage-renovation/ work area. Follow its ownership and evidence conventions. Frontend/tmp/preview-visual/ is ignored temporary probe/evidence output; it is not canonical and is not included wholesale in commits.

## State at this checkpoint

The base HEAD at the start of the current packaging turn was 5dc1989d. The asset/UI changes listed below were uncommitted at that time. The current checkpoint must end in a local commit after final checks; no push. Re-check the actual HEAD and status before relying on this paragraph.

### Implemented in the current uncommitted change group

1. Frontend/tools/project-screen-assets/extract-minecraft-exterior.ps1
   - Uses Docs/design/references/01-minecraft.png at exactly 1672 × 941.
   - Isolates source pixels visible through three measured polygons: left doorway opening, upper-right window and right-side window.
   - Produces scene-minecraft-room-shell.png and scene-minecraft-exterior-view.png as complementary RGBA layers.
   - Reloads saved outputs and verifies that compositing every pixel reproduces the source exactly. It does not invent unseen scenery.
2. Frontend/public/assets/project-screen/layers/scene-minecraft-room-shell.png
   - Source-derived room layer with transparent openings for the three visible exterior regions.
3. Frontend/public/assets/project-screen/layers/scene-minecraft-exterior-view.png
   - Complementary source-derived exterior pixels, same canvas and original placement.
4. Frontend/tools/project-screen-assets/extract-project-card-craft.ps1
   - Extracts measured source rectangle (x=1176, y=385, width=158, height=154) from the Minecraft reference.
   - Keeps the original card frame and pin; makes the source preview rectangle (10,12,136,109) transparent for a live project preview.
   - Reconstructs the baked label strip (10,121,136,31) row-by-row from adjacent paper at local x=130. Project title and metadata are live DOM text.
5. Frontend/public/assets/project-screen/layers/project-card-craft.png
   - Source-derived Minecraft card frame. The card art is a draft extraction, not an accepted final scene.
6. Frontend/public/assets/project-screen/layers/scene-minecraft-board-cleanup.png
   - A canvas-aligned cleanup layer that covers baked sample project cards while retaining the source Create Project tile and nearby source artwork. It does not remove the baked board header/search/sort controls.
7. project-screen-scene-assets.ts, scene template/styles and Frontend/angular.json
   - Wire the Minecraft room/exterior split, board cleanup layer and build asset globs.
   - Keep Angular's NgOptimizedImage intrinsic dimensions static per theme branch; see the failure history below.
8. project-screen.component.scss
   - Gives the Minecraft washer drum a visible, subtle grid under the real cached preview and places live metadata over the extracted source card.
   - Prevents an inherited translateX(-50%) on the card art pseudo-element from shifting the source card frame over the Create tile.
9. Docs/design/homepage-renovation/README.md, asset-inventory.md, asset-manifest.json
   - Record source paths, exact coordinate system, current extraction, runtime wiring, checks and outstanding work.

### Files present in the working tree before this packaging turn

- Modified: Docs/design/homepage-renovation/README.md
- Modified: Frontend/angular.json
- Modified: Frontend/src/app/features/projects/project-screen/project-screen.component.scss
- Modified: Frontend/src/app/features/projects/project-screen/scene/project-screen-scene-assets.spec.ts
- Modified: Frontend/src/app/features/projects/project-screen/scene/project-screen-scene-assets.ts
- Modified: Frontend/src/app/features/projects/project-screen/scene/project-screen-scene.component.html
- Modified: Frontend/src/app/features/projects/project-screen/scene/project-screen-scene.component.scss
- Untracked before packaging: Docs/design/homepage-renovation/asset-inventory.md, asset-manifest.json, the three new PNG files listed above, and the Frontend/tools/project-screen-assets/ scripts.
- Current packaging turn adds the empt docx/ handoff documents and one evidence screenshot. Recheck status before commit and make sure ignored Frontend/tmp/preview-visual/ files are not staged.

## Evidence captured and what it proves

- All four references were confirmed at 1672 × 941 and visibly differ. Source paths are listed in the asset manifest.
- The exterior extraction script completed successfully. Its saved/reloaded two-layer recomposition is pixel-identical to 01-minecraft.png (0 different pixels, max per-channel difference 0). The layer split preserves only pixels actually visible in the source openings.
- Local browser was run at 1672 × 941 using Angular dev server on port 4201 and headless Chrome DevTools Protocol on port 9231. Browser reported loaded images and no console errors for the inspected run. The canvas probe also reported the source-sized layer reconstruction with zero differing pixels.
- A browser screenshot minecraft-board-cleanup-1672x941.png was visually inspected and copied into this handoff folder. It is a checkpoint sample, not a final acceptance screenshot. It shows a live local project row with the source card frame and placeholder, plus the washer grid; baked header/search/sort, source text/logo/washer visuals and other mismatches remain.
- The final packaging-turn browser rerun used Chrome 155 at 1672 × 941. It reported theme craft, projectCount 1, all three scene images loaded, imageFailures [], console/runtime errors [], and the selected local project “Board Surface Review”. The screenshot was refreshed after the last CSS changes and opened for manual inspection. The real card thumbnail is still only the placeholder.
- The current isolated browser profile contains a temporary local project “Board Surface Review” (created through Angular UI and stored in that disposable profile). It is not user data and is not committed. Current screenshot shows a placeholder rather than a real captured thumbnail; do not infer populated real-preview success from this check.
- PNG composition test validates dimensions and alpha-channel image type for the two scene layers and board cleanup asset. It does not prove all object masks or the complete scene are correct.

## Verification history — exact outcomes and failure causes

The results below distinguish the final current checks from earlier failure attempts. Rerun any check affected by subsequent edits before continuing the Goal.

- npm test -- --include src/app/features/projects/project-screen/scene/project-screen-scene-assets.spec.ts --watch=false --progress=false — rerun at the end of this packaging checkpoint: 1 file passed, 6/6 tests passed.
- npm test -- --watch=false --progress=false — full suite passed: 329 files passed, 7 skipped (336 total); 2061 tests passed, 11 skipped (2072 total). Several canvas getContext “Not implemented” notices came from tests running in the DOM test environment; they did not fail the suite.
- Direct npm exec vitest ... was attempted and failed because it bypassed the Angular TestBed initialization. Use the configured Angular CLI test command above; do not interpret the direct Vitest failure as a product regression.
- Initial targeted test expected craft exterior to be absent. That assertion described the prior architecture and was updated because the source-derived split now provides one.
- Initial template bound NgOptimizedImage width/height dynamically from the changing theme asset. Angular threw because optimized-image dimensions are immutable after initialization. Fixed by keeping literal intrinsic sizes in static theme branches. Regression test passed afterward.
- npm run build — final production build passed. project-screen.component.scss is 29.97 KB: it is below the configured 30 KB maximum error, but exceeds the 20 KB warning budget by 9.97 KB. Earlier packaging-turn attempts failed at 30.20 KB (+198 bytes over max), 30.07 KB (+70 bytes), and 30.01 KB (+10 bytes); redundant craft overrides were removed while preserving layout. Do not hide/increase the budget to make the build pass. The earlier baseline was not measured, so do not assign the warning to this patch without checking.
- npx tsc --noEmit -p tsconfig.app.json — passed.
- npx tsc --noEmit -p tsconfig.worker.json — passed.
- npx tsc --noEmit -p tsconfig.spec.json — passed.
- npm run check:encoding — passed. A prior PowerShell file read without -Encoding utf8 displayed mojibake; this was a console decoding issue, not source corruption.
- npx prettier --check ... initially used an unquoted path containing a space for empt docx/ and failed to find the two handoff files; it also identified the changed SCSS formatting. Correctly quoted paths were then formatted, and the full changed-file check passed.
- git diff --check passed previously; Git printed line-ending conversion warnings (LF to CRLF) but no whitespace errors. A final staged check is still required before commit.
- One shell probe for PNG header had a PowerShell parser error from a malformed array/slice expression; it did not modify files. Use a simpler Node or PowerShell byte probe if needed.
- The first handoff Markdown patch was rejected because some added lines lacked patch markers; no source file changed from that failed attempt. The handoff file was then added successfully.
- The first objective-hash command constructed an invalid mixed absolute path for Get-FileHash and emitted a Resolve-Path error. A corrected command hashed the active copy and original attachment; SHA256 values matched exactly: DEB514DE8E18752FB6B6C61704E7D38F446B55F5FD1848E05135245A320E0DE3. The older objective text is preserved in full in source-initial-goal-objective.md; only trailing whitespace was trimmed so git diff --check stays clean.
- One prompt-validation Node command was run from Frontend while using root-relative paths and failed with ENOENT; it made no changes. The corrected root-level validation confirmed the objective appendix in continuation-prompt.md contains all 7,098 words and matches the source after whitespace normalization. A first comparison counted the closing Markdown fence as content; the corrected comparison excludes the fence.
- PowerShell extraction scripts ran successfully, including save/reload recomposition assertions.
- Final encoding check passed. Final Prettier check passed for all changed production files and the handoff/renovation documents. App, worker and spec TypeScript checks passed. The full suite/build outcomes above are current. After the final CSS-only size reduction, the targeted 6-test suite and production build were rerun; the full suite and TypeScript checks preceded only CSS formatting/size simplifications, which do not change TypeScript behavior.

## Tools and working commands used

All commands were local; no network search or image generation was used for the current asset work.

- PowerShell/.NET System.Drawing extraction scripts:
  - powershell -ExecutionPolicy Bypass -File Frontend/tools/project-screen-assets/extract-minecraft-exterior.ps1
  - powershell -ExecutionPolicy Bypass -File Frontend/tools/project-screen-assets/extract-project-card-craft.ps1
- Angular CLI from Frontend/:
  - npm test -- --include src/app/features/projects/project-screen/scene/project-screen-scene-assets.spec.ts --watch=false --progress=false
  - npm run build
  - npx tsc --noEmit -p tsconfig.app.json
  - npx tsc --noEmit -p tsconfig.worker.json
  - npx tsc --noEmit -p tsconfig.spec.json
  - npm run check:encoding
- Formatting from Frontend/: npx prettier --check for changed TS/HTML/SCSS/JSON and ../Docs/design/homepage-renovation/{README.md,asset-inventory.md,asset-manifest.json}.
- Git: git status --short, scoped git diff, git diff --check; local commit only.
- Browser: ng serve on port 4201; Chrome headless CDP on port 9231 with a disposable profile below Frontend/tmp/preview-visual/; Node probe scripts in that ignored folder did screenshot, image-loading checks, pixel recomposition and UI inspection.
- Ignore all generated probes and screenshots under Frontend/tmp/preview-visual/ except the one copied evidence screenshot in this handoff folder. Stop dev server and Chrome before leaving the checkpoint.

## Remaining work, prioritized for continuation

### P0 — Complete and visually validate Minecraft static scene

1. Audit active component, scene asset registry, current source images, README, inventory and manifest before further edits. Recheck whether any already existing original-pixel extractions can be reused; do not remake accepted assets without evidence.
2. Continue measured source extraction at 1672 × 941. Build a complete manifest of source rectangles/polygons, alpha masks, layering, target scale/position, occlusion dependencies and whether each area is baked UI, live content, static art, or preview.
3. Isolate the Minecraft logo/wall mount, washer (body, front glass, drum, both physical-looking control positions, display plate), board/frame/surface, both raccoons, basket/laundry, floor props and any foliage/lights that need parallax. Preserve exact local placement/perspective, contact shadows and edges.
4. Remove baked sample project text/card, board title/search/sort, topbar settings/account content and washer demo project text/buttons only where live functional DOM replaces them. Keep Create/Open/Delete/search/sort/local account behaviors functional.
5. Reconstruct only source-occluded pixels. Use source sampling/inpainting with a reference-proven method, and measure/document all masks and patch bounds. Do not use a flat colored rectangle to hide the mismatch or generate new art without a supplied image reference.
6. Compose exact source layers in browser at native 1672 × 941. Compare against reference per-region and inspect screenshot visually. At this checkpoint, the existing image is visibly incomplete; do not call Minecraft static PASS. Fix composition, align positions, and review result before moving on.
7. Real project preview remains unverified in this screenshot. Check a populated project with an actual renderer-captured preview and confirm correct card/washer placement. Do not alter the previously audited captureProjectPreview, EditorLeaveCoordinator, ProjectPreviewService or IndexedDB contracts unless a reproduced defect directly blocks this goal.

### P1 — Derive and validate Light, Raccoon, Dark

1. Treat each of 02-light.png, 03-raccoon.png, and 04-dark.png as distinct source evidence. Extract theme-specific interiors, exterior-visible regions, lighting and object details. Existing runtime sharing of one room, board, exterior or right mascot is known to be incorrect unless pixel comparison proves otherwise.
2. Keep exterior continuity compatible with transitions/time/light while respecting source composition. Build a clear strategy from the source image groups; do not simply reuse one mismatched old panorama or falsify distinct source regions.
3. Static scenes must pass visual review before any animation is added. No theme is complete merely because the palette changes.

### P2 — Integrate and motion

1. Confirm live Angular overlay controls replace fake source UI without duplicates or misalignment; localization and theme switching still work.
2. Confirm actual selected-project previews are lazy-loaded, object URLs cleaned up, and the renderer preview surface uses the visible grid without impacting editor state/persistence or 100K+ block performance.
3. Only after all four static themes pass, implement the specified character/environmental movement and synchronized lighting/time transitions with reduced-motion/accessibility behavior. Avoid arbitrary animation changes before static fidelity.

### P3 — Final verification/checkpoint

- Targeted tests plus full suite, app/spec/worker typechecks, production build, encoding, formatter, git diff --check, browser screenshots for all final views/themes and one real populated preview. Benchmark only if hot path/capture is changed. Report unverified browser/GPU behavior honestly.
- Review final source/diff against the active objective. Commit each coherent, verified group locally. Do not push, close Goal, create new Goal, or start broad cleanup outside the objective.

## Open questions / risks (do not silently assume away)

- Existing design docs historically describe earlier generated concepts and are not final acceptance proof. Current references override those snapshots.
- asset-inventory.md explicitly labels current extraction work and identifies obsolete/unreferenced asset candidates. Do not delete old assets without checking runtime consumers and git/build usage first.
- Current source reference contains baked UI and content. Clean independent layers require careful inpainting where objects cover background; visible source polygons alone do not solve this.
- Browser capture is desktop, source-sized and local. It does not prove real user profile data, GPU preview capture, all responsive breakpoints, accessibility or final visual parity.
- The style budget warning is known and not yet baseline-compared; the latest successful production build is only 0.03 KB below the configured hard error threshold.
- Existing current generated artwork and older raster masters have been rejected by the user when they visibly diverge. Preserve source provenance for every new raster asset.

## Earlier preview-bug context that must remain intact

Before the current art Goal, the user reported black project-thumbnail placeholders and requested an end-to-end audit. The reported race was navigation accepted, Angular tears down the 3D viewport, engine disposal cancels a pending GPU readback, capture resolves undefined, and no preview is persisted. The repository's current project-preview documentation describes the resulting ownership contract: valid readback survives route teardown independently of the viewport, captured project ID/timestamp remain bound to the write, IndexedDB rejects stale revision transactionally, canonical save invalidates the preview in the same transaction, Home receives committed-preview notifications without reload, only near-visible cards load previews, object URLs are released on visibility exit/destroy, and the washer uses a preview-specific grid surface while restoring renderer state. Recovery settings A/B were also explicitly audited so recovery and canonical settings remain independent through v6→v7 migration. Treat these as existing contracts; inspect current implementation and tests before touching them. Do not infer that the current screenshot verifies real GPU capture: it does not.
