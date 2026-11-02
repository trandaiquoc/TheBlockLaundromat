# Active checkpoint — Phase 3

Status: **IN PROGRESS**, checkpoint updated 2026-11-02. Branch `homepage/illustrated-rebuild`; Phase 2 commit/push verified `22b585f89fbf7f5317c18d3aae631cf92d395e04`. This checkpoint is committed with the parent [AI handoff](../AI-HANDOFF.md); verify the current commit and remote state on resume. Goal remains Phase 2–11 with automatic continuation after proven phase gates/commit/push; no model-switch wait.

## Approved assets and current job

Raccoon master v1, washer master v1, primary panel v2 and desktop support v1 are dual Codex + Check PASS. Originals, hashes, dimensions and alpha bounds are in [catalog](assets/catalog.json); review screenshots were visually inspected. Do not repeat unchanged-version reviews. Raccoon is an identity master, not separated animation parts. Washer has an isolated transparent preview aperture; measured thumbnail mapping behind rim/handle, reflections/contact shadows and actual scene fit remain later work. No Figma or runtime usage yet.

**Last observed at pause: portrait NOTE BOARD v2 was generating in Generate02.** User: “đúng rồi, tôi thấy giống cái hộp hơn là 1 bảng note”. This takes priority: thin light note surface, distinct slim shelf, minimal backing supports; no deep countertop/case/chunky posts/corner blocks. Check supplied [revised fullprompt](prompts/21-portrait-note-board-v2.md). Guide1110×1080 at3× verified/viewed: local370×360, shelf(0,8,370,16), panel(5,30,360,318), face(11,38,348,304), UI330×290 padded9/7. Sent ONLY guide+approvedwasher/raccoon style with correctURL/completedattachments/enabledSend. On resume, inspect the existing conversation's latest state before taking action; never assume it was canceled or completed. Inspect the actual original for note-board appearance AND UI geometry/alpha before the first independent Check. User correction is also recorded in canonical Phase2 art-direction and Phase3 README. No revised portrait is approved yet.

Portrait workstationv1 original1159×1358RGBA hash`b856b9ca70ed394742833f2d17bbf5975adbf269b96b0bb15fa6f5dccc115c09` remains ignored/unapproved. It failed both usableface(~291×186at370width) and box-like massing; no independent approval review. No directfix submitted toGenerate after userfeedback.

Supportv1 is dual-PASS, original and pairfit in catalog; [PASS screenshot](reviews/check-support-v1-pass.png) inspected. Bothphysicalwidth660, supportscale660/1332, contact590relativepanel (scene250→840), lowergap156. Tiny sideprojections accepted byCheck as structural back joints. No unchangedreview needed.

Panelv2 actual1448×1086RGBA hash`15e16354fa06136beb610ef125cfe6535a1c3f6463e2965e00f9be744a342e26` is approved; exactmetadata/fit in catalog and [PASS evidence](reviews/check-panel-v2-pass.png). Check explicitly accepted actual functional560×355 fit at660outerwidth with positivepadding (~17horizontal/5–6vertical), not exactguide1.475. Shape/alpha/materiallocked, no further unchangedreview. ActualFigma/DOMresponsive/room support remain separategates.

Generate02 has full [context transfer](prompts/11-generate02-transfer.md), nine original/style/brand/negative references and the four approved concept/master originals. Its latest job explicitly excludes room/failed-panel images as shape references; only current geometry guide controls shape. Face/frame must fit UI first; supports/workstation will be separate assets and assembled in Phase4, so no final floating poster is accepted.

Board v1–v4 all failed Codex: face too short, still short, then too tall, then too short plus RGB fake checkerboard. None approved. Exact metadata and defects are in [historical review log](reviews/review-log.md). After three corrections, [mandatory Check reset](prompts/09-check-board-method-reset.md) chose a new chat and fresh generation, fixing primary face/frame geometry before adding secondary supports. Failed candidates were deliberately not transferred as image references. If clean v5 still fails measured face fit/alpha, **do not repeat the same prompt**: ask Check for the prescribed separate face/frame and layout-support jobs. Preserve UI quality and room identity.

## Active resources

- [Generate 02](https://chatgpt.com/g/g-p-6aaa3cffff7c8191855cea64ad58ff2f/c/6ae4326c-7b90-83ec-8a91-15738c9c601d) — current generation; title verified “The Block Laundromat — Generate 02”.
- [Check 01](https://chatgpt.com/g/g-p-6aaa3cffff7c8191855cea64ad58ff2f/c/6ae30c55-c97c-83ec-8510-210da7e3bf5e) — current independent reviewer.
- [Generate 01](https://chatgpt.com/g/g-p-6aaa3cffff7c8191855cea64ad58ff2f/c/6ae30c44-f568-83ec-a93d-df6ae428bb7b) — retained provenance; retired for board generation.
- [Source](https://chatgpt.com/g/g-p-6aaa3cffff7c8191855cea64ad58ff2f/c/6adab75f-719c-83ec-ba26-f763e84c8556).
- [Figma](https://www.figma.com/design/ESqNCTN9XWIacmdVEjzJkZ/The-Block-Laundromat--Homepage-Redesign) unchanged. Old page `0:1`, desktop `6:13`, portrait `6:56` remain rejected references.

Chrome MCP `923a4c51c4b7` attaches to user's Chrome at `127.0.0.1:9223`. Resolve tabs by URL; creation IDs were Generate 02=7, Check 01=5, Generate 01=6. Explicit select + actual URL guard before every cross-chat upload/send. History is virtualized: scroll to latest before reading. Capture the viewport at actual review heading; screenshotting the whole main element can jump to old history. Viewer close and chat rename rerender UIDs; take a fresh snapshot.

Task-owned staging `/tmp/tbl-homepage-resume-O1DuNQ`, ignored candidates `.artifacts/homepage-production/`. Recreate staging from durable approved files if absent. Native viewer download only, never screenshots as production assets. Do not inspect/delete unrelated Downloads. Upload success alone is insufficient: verify completed attachments/no failure and enabled Send. Transient failed Check uploads recovered by removing failed items and reuploading only the new asset; no current upload blocker.

## Remaining Phase 3 and gates

After desktop board approval: companion portrait workstation/board with shared face/frame language and layout-specific supports (washer/raccoon share one top, board on vertical front, one bottom floor), then plant and sufficient desktop/portrait environment. Do not force freestanding desktop board onto portrait.

Inspect each original for camera/identity/style, geometry/usable UI area, full hidden edges, actual alpha/halos and contacts before one exact-version independent Check. Record approved version and provenance. Three repeated failed corrections require root-cause/method change. An isolated asset PASS does not prove room PASS.

Finish Phase 3 documentation/asset/link validation, commit/push, then automatically open mandatory Phase 4 desktop+portrait Figma assembled-room gate before mass production/code. Full motion parts are Phase 5; Light UI Phase 6; deliberate other-theme artworks Phase 7; final anchors/mapping Phase 8; real workflows Phase 9, motion Phase 10, interaction/lighting/acceptance Phase 11. Preserve all workflows, four themes, EN/VI, Account/Settings and existing ownership; no Editor/backend expansion. No goal completion is claimed.
