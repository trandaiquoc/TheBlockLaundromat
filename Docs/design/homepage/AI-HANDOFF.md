# AI Handoff — The Block Laundromat Homepage

Updated: 2026-11-02 (Asia/Ho_Chi_Minh)
Repository: `trandaiquoc/TheBlockLaundromat`
Branch: `homepage/illustrated-rebuild`

## Read this first

Continue the existing Homepage goal from its current checkpoint. The user authorized work through Phases 2–11, with phase gates, documentation, commit and push. Continue automatically after each proven phase; do not stop for a model switch. Do not begin a later phase before its predecessor's gate passes. The user most recently paused implementation and asked for the current work to be committed and handed off. Treat this document as a handoff, not as authorization to skip the active Phase 3 checks.

Before new work, read the repository `AGENTS.md`, this file, [Phase 3 handoff](phase3/handoff.md), [Phase 3 README](phase3/README.md), [Phase 2 art direction](phase2/art-direction.md), and the specific prompt/review files linked below. Phase 3 handoff contains operational Chrome details and should be kept current as the active job changes.

## Current repository checkpoint

- Phase 1 was committed and pushed as `04f8f11848c1a7d5146233fb95146ea406ddccb4`.
- Phase 2 was committed and pushed as `22b585f89fbf7f5317c18d3aae631cf92d395e04`.
- This handoff and the complete current Phase 3 work are included in the commit that adds this file; inspect `git log` and `git status` on resume for its SHA and remote state.
- Work on `homepage/illustrated-rebuild`. Never force-push, merge to the default branch, or deploy.
- No frontend, Figma, runtime asset, or backend changes have been made in Phase 3 so far.

## Immediate next action: inspect the in-flight portrait note-board job

The previous Generate 02 message created **portrait note-board v2** and was still generating when the user paused. Do not assume it was canceled or completed. Open the existing conversation, find the latest response, and inspect it before sending anything new:

- Generate 02: https://chatgpt.com/g/g-p-6aaa3cffff7c8191855cea64ad58ff2f/c/6ae4326c-7b90-83ec-8a91-15738c9c601d
- Check 01: https://chatgpt.com/g/g-p-6aaa3cffff7c8191855cea64ad58ff2f/c/6ae30c55-c97c-83ec-8510-210da7e3bf5e
- Source conversation: https://chatgpt.com/g/g-p-6aaa3cffff7c8191855cea64ad58ff2f/c/6adab75f-719c-83ec-ba26-f763e84c8556
- Figma: https://www.figma.com/design/ESqNCTN9XWIacmdVEjzJkZ/The-Block-Laundromat--Homepage-Redesign (unchanged; old page `0:1`, desktop `6:13`, portrait `6:56` remain rejected references)

At the pause, the exact prompt was [21-portrait-note-board-v2.md](phase3/prompts/21-portrait-note-board-v2.md). It used only the clean measured geometry guide plus the approved washer and raccoon as style references. The guide defined a 370×360 CSS-pixel workstation: shelf `(0,8,370,16)`, board `(5,30,360,318)`, clean face `(11,38,348,304)`, and UI `(20,45,330,290)` with 9 px side and 7 px vertical clearance. The upload was confirmed complete, Send enabled, and the prompt sent. On resume, resolve the live Chrome tab by URL and inspect the terminal result; never resend solely because time has elapsed.

The user's latest visual correction is decisive: **“đúng rồi, tôi thấy giống cái hộp hơn là 1 bảng note”** (“yes, it looks more like a box than a note board”). The previous portrait workstation is rejected: it reads as a cabinet/box, has chunky enclosed massing, and its usable face maps to only about 291×186 px at 370 px width. The new direction is a thin, light note board attached to room architecture, with a visibly separate slim shelf for the washer and raccoon. Avoid a closed cabinet/case, deep counter, bulky posts and corner blocks. This is recorded in [Phase 2 art direction](phase2/art-direction.md) and the Phase 3 docs.

For the generated result: download the original image from ChatGPT, inspect its actual appearance and file metadata/alpha, measure the clean face at uniform 370 px width, and verify the UI rectangle fits. If Codex passes, send that exact unchanged original and relevant context to Check once. Add to `assets/approved/` only after both Codex and Check pass. If it still reads as a box or misses geometry, keep it unapproved and correct the art direction/method before another generation. See [Check's correction notes](phase3/prompts/20-check-note-board-refinement.md).

Chrome is the user's existing Chrome through DevTools MCP at `127.0.0.1:9223`; use the established `chrome_devtools_923a4c51c4b7` connection. Page IDs can go stale: list/select by actual conversation URL and verify it before any upload or send. Chat history is virtualized; scroll to the latest response. Download original artwork, never use a screenshot as a production asset. `/tmp/tbl-homepage-resume-O1DuNQ` was the task staging path at pause and may no longer exist; recreate it from approved repository files if needed. Do not inspect/delete unrelated Downloads.

## Phase 3 proven state

Phase 3 is **IN PROGRESS**, not complete. Four exact original PNGs have Codex + Check PASS and are recorded in [the asset catalog](phase3/assets/catalog.json):

| Asset                    | Approved file                                   | Original size / SHA-256                                                            | Scope of proof                                                                                                                                                    |
| ------------------------ | ----------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Raccoon master v1        | `phase3/assets/approved/raccoon-master-v1.png`  | 1122×1402 RGBA; `9e03d41f34bcf0c2f70f35dac17adcda9ee8e05bad849f5d5b05c5320d485cdc` | Neutral identity master, true alpha. Animation parts/poses remain Phase 5.                                                                                        |
| Washer master v1         | `phase3/assets/approved/washer-master-v1.png`   | 1254×1254 RGBA; `eae56cf336e32bbc46809bf43de3c03965daed3c7e528c18c029246ea008d3fa` | Isolated preview aperture; thumbnail masking, reflections and full scene fit remain later checks.                                                                 |
| Desktop project panel v2 | `phase3/assets/approved/panel-master-v2.png`    | 1448×1086 RGBA; `15e16354fa06136beb610ef125cfe6535a1c3f6463e2965e00f9be744a342e26` | Check accepted measured 560×355 UI fit at 660 px width with positive margins; it did not certify the original guide ratio, Figma, responsive layout or full room. |
| Desktop panel support v1 | `phase3/assets/approved/support-desktop-v1.png` | 1448×1086 RGBA; `e4810ae8452a141b721b6f29217e00c8778a7dd2412c2fa240c6f35a49e8d528` | Separate background supports; pair geometry checked with panel, not a full assembled room.                                                                        |

Review evidence and failed candidates/history are documented in [Phase 3 reviews](phase3/reviews/review-log.md). Do not repeat unchanged-version reviews or treat historical failures/screenshots as approved artwork. The desktop support approval does not satisfy the portrait support/room need.

Remaining Phase 3 work: finish and dual-review the revised portrait note board/workstation; produce a plant master; produce enough cohesive desktop and portrait environment to assemble the room. Inspect originals and actual alpha, edges, supports, camera, scale, lighting, material and style coherence. Do not claim the isolated masters pass as a composed scene. Update the catalog, README, handoff and review evidence as work settles.

## Phase gates and remaining roadmap

- **Phase 3:** foundation assets and sufficient environment, each through Generate → Codex inspection → one exact-version Check review; phase remains open until the required set and consistency are proven.
- **Phase 4 is the mandatory assembly gate:** create a new editable Figma composition with complete desktop and representative portrait rooms, unchanged logo, real-size editable UI and coherent object/support/floor relationships. Compare screenshots directly against all four original Homepage images and the rejected Figma. Fix artwork through Generate–Check where needed. No mass production and no frontend implementation before this gate passes.
- **Phase 5:** remaining artwork and animation-ready raccoon, tickets, plant, shadows and occlusion parts.
- **Phase 6:** responsive, editable Light-theme UI and workflows in Figma, including EN/VI and error/loading/empty/selected states.
- **Phase 7:** Minecraft, Raccoon and Dark theme artwork via Generate–Check.
- **Phase 8:** all-theme Figma review, viewport acceptance, anchors/layers/theme mapping, export-ready catalog.
- **Phase 9:** implement Homepage using existing Angular workflow ownership, project data and routing. Verify actual source patterns first; PixiJS is the stated preference for environment/animation and Angular DOM for editable UI, subject to repository evidence. No duplicate project state, backend or Editor expansion.
- **Phase 10:** lightweight animation with reduced-motion and visibility/resource handling.
- **Phase 11:** project-selection gaze, Create/Import tickets, controlled lighting, and complete workflow/responsive/accessibility/performance/lifecycle acceptance.

Full requirements, viewports, UI/workflow contracts and animation constraints are in the original brief attachment and [Phase 1 shared brief](phase1/prompts/shared-brief.md). Do not drop existing project workflows, the four themes, EN/VI, keyboard access, accessibility, responsive behavior, or resource ownership. Do not invent Minecraft behavior or mark unverified work as PASS.

## Asset workflow and evidence rules

1. Ask Check for the next Phase 3 art prompt, exact reference set, technical constraints and acceptance criteria; preserve prompts in `phase3/prompts/`.
2. Generate only with those intended references. Inspect the original output locally before Check: visual brief, geometry at intended CSS scale, complete silhouette, actual alpha/halos, supports/contacts and coherence with accepted masters.
3. If it fails Codex inspection, revise through Generate; if the same failure repeats three times, return to Check and change the method rather than weakening acceptance.
4. Send each unchanged passing candidate to Check exactly once. Record the exact verdict, response/screenshot evidence and technical metadata. Only dual-PASS originals enter `assets/approved/`.
5. Keep candidates and diagnostic renders out of `src/`, canonical documentation and runtime public assets. Screenshots document review evidence; they are not production artwork. Catalog `figmaUsage`, anchors and runtime paths stay empty/null until actually established.
6. After a phase gate is proven, update its docs, run applicable documentation/link/format and task-specific checks, inspect the staged diff, commit with a conventional phase-specific message, push the branch, and verify the remote SHA. Do not claim push success without checking it.

## Source of truth and current limitations

Use the current user direction first, then repository `AGENTS.md`, then current `Docs/design/homepage/` documents, existing implementation, and verified platform evidence. The latest note-board correction supersedes box-like portrait massing in older concept art; preserve the accepted shared-room, shared-support and single-floor logic where compatible. The existing unchanged logo is `Frontend/public/assets/brand/the-block-laundromat-logo.svg`; do not redraw it or reuse the contaminated old room logo cutout.

No Phase 3 Figma assembly, browser application verification, frontend code change, or runtime integration has passed. Asset-level Check PASS does not imply any of those. No research/configuration checkpoint is currently recorded as blocking the next art review.
