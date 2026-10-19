# Goal Report: Workspace UI and Homepage Artwork

- **Snapshot:** 2026-10-19
- **Repository:** `TheBlockLaundromat`
- **Checkpoint before this report:** `cf2e2fe279b2053cee6eb348bfdc17d3f40c7ea6` (`feat(project-screen): extract Minecraft layers and hand off goal`)
- **Branch/status before this report:** `main`, clean, equal to `origin/main`. This report is documentation-only and is committed separately; it is not pushed.

## What This Handoff Covers

This report deliberately separates two related workstreams so the next ChatGPT/Codex session does not mistake an in-progress artwork task for a finished UI renovation:

1. The Workspace UI renovation and its follow-up behavior/accessibility fixes, recorded across the October 13-18 commit history.
2. The active, still-in-progress pixel-faithful Homepage/Project Screen artwork reconstruction, whose full acceptance criteria are in `empt docx/source-current-goal-objective.txt`.

The full commit ledger from the four-theme foundation through the checkpoint is in [`commit-ledger.log`](commit-ledger.log). It is a navigation aid: the range contains adjacent maintenance and verification commits too, so do not assume every commit is exclusively visual UI work. An earlier focused ledger remains at `Trash docx/TheBlockLaundromat-Workspace-Handoff-20261016/commits/theme-foundation-to-current.log`.

## Workspace UI Work Recorded

The implementation history covers these delivered changes and follow-up corrections:

- Established the four UI themes (Minecraft/Craft, Raccoon, Light, Dark), the independent font preference system, shared workspace palette/tokens, and theme-aware controls.
- Added Reality workspace-background preferences and guarded asynchronous environment/asset transitions; kept UI theme and editor background as separate settings.
- Reworked shared editor chrome and interaction patterns: toolbar choice tracks, mode/tool controls, menus, dialogs, inspectors, quick bar, status hierarchy, and responsive panel behavior.
- Improved block browser previews, Block Usage presentation and keyboard navigation, Groups and Painting panel hierarchy, selection inspector context, item/storage previews, and project board search/sort/selection.
- Fixed Structure JSON dialog scrolling and import/create focus/navigation paths; improved External AI tab behavior and narrow-screen readability.
- Added or corrected keyboard/focus behavior, accessible names/status announcements, touch actions, reduced-motion handling, selected/disabled feedback, and narrow viewport/font-size layouts.
- Refined Project Screen behavior and preview ownership: real project summaries and actions, localized controls, preview capture/cache display, stale capture guards, and responsive layouts. These workflows remain real application behavior, not Stitch mock controls.
- Included dependency/toolchain and documentation corrections in the broader commit history, including the October 14 advisory remediation and exact Node.js compatibility wording.

The current code and historical browser/test evidence remain the authority for individual acceptance details. This report does **not** claim that the broad Workspace redesign has been re-audited in this reporting turn. In particular, the user's request to make Project Diagnostics an on-demand collapsible section was explicitly retracted; do not reintroduce that behavior as unfinished work.

## Active Homepage / Project Screen Goal

The four approved source images are immutable and each 1672 × 941:

- `Docs/design/references/01-minecraft.png`
- `Docs/design/references/02-light.png`
- `Docs/design/references/03-raccoon.png`
- `Docs/design/references/04-dark.png`

The current implementation uses the real Angular Project Screen workflows and approved art as evidence. The latest checkpoint includes:

- A measured Minecraft doorway/window exterior extraction into complementary room-shell and exterior-view PNG layers. A deterministic PowerShell script reloads the outputs and verifies pixel-for-pixel recomposition against the source.
- A source-derived Minecraft project-card crop with a transparent real-preview window and live project text, plus a board cleanup layer covering baked sample project cards while preserving the source New Project tile.
- Runtime scene wiring, asset manifest/inventory, image dimension/composition regression coverage, and a browser checkpoint screenshot.
- Existing Project Screen functionality retained: project create/open/delete/import, local persistence, real project summaries, search/sort, localized controls, and renderer-backed project previews.

Milestone commits to orient source review: `3161ae6` (theme-aware Project Screen), `b8978f9` / `8e3e389` / `f221c74` (real project preview path and navigation/lifecycle fixes), `adc024b` (reference alignment), `065499f` and `d056d33` (layered scenes and independent themed exterior/foreground), `5dc1989` (Minecraft reference artwork), and `cf2e2fe` (measured Minecraft layer extraction and handoff). The full 206-entry ledger includes the surrounding Workspace, accessibility, responsive, documentation, and verification commits.

### Explicitly Not Complete

- The Minecraft scene is **not** a complete separated/reconstructed static scene. Logo, washer, controls, board chrome, mascots, baked labels/account UI, floor props and other artwork still need measured extraction/cleanup and visual alignment.
- Light, Raccoon and Dark still need source-specific extraction and parity work; theme-color changes alone do not satisfy the references.
- The selected project's real renderer thumbnail was not proven by the latest checkpoint screenshot; that capture showed a placeholder. Do not claim populated-preview visual acceptance from it.
- No final source-sized visual comparison has passed for all four themes. Do not close the active Goal or mark visual acceptance PASS.

## Verification Evidence and Limits

The existing checkpoint notes report these results; they were not rerun merely to write this report:

- Targeted scene-asset suite: 6/6 passed.
- Full Angular test suite: 329 files passed, 7 skipped; 2,061 tests passed, 11 skipped (2,072 total).
- App, worker, and spec TypeScript checks passed.
- Production build passed, with a known `project-screen.component.scss` budget warning: about 29.97 KB against a 20 KB warning threshold and 30 KB hard maximum.
- Encoding and changed-file Prettier checks passed. Earlier `git diff --check` passed with line-ending conversion warnings.
- Headless Chrome/CDP inspection at 1672 × 941 reported the Craft scene images loaded, no image failures, and no browser console/runtime errors for that inspected run. It inspected a disposable local project and is only a checkpoint, not final visual acceptance.
- The exterior layer script's saved/reloaded recomposition reported zero differing pixels (maximum channel difference 0). This proves only that measured visible opening pixels were split without loss; it does not prove the complete scene.

The detailed commands, failure history, screenshot caveats, extraction provenance and remaining task order are in [`empt docx/handoff-notes.md`](../../empt%20docx/handoff-notes.md). The screenshot `empt docx/minecraft-layer-check-1672x941.png` is explicitly a checkpoint sample, not a final reference match.

## Read These Files First on the Next Machine

1. This report.
2. [`empt docx/source-current-goal-objective.txt`](../../empt%20docx/source-current-goal-objective.txt) — canonical active objective, copied from the user's attachment.
3. [`empt docx/continuation-prompt.md`](../../empt%20docx/continuation-prompt.md) — continuation instructions and the complete objective text.
4. [`empt docx/handoff-notes.md`](../../empt%20docx/handoff-notes.md) — exact checkpoint, verification history, risks and prioritized remaining work.
5. [`Docs/design/homepage-renovation/README.md`](../../Docs/design/homepage-renovation/README.md), [`asset-inventory.md`](../../Docs/design/homepage-renovation/asset-inventory.md), and [`asset-manifest.json`](../../Docs/design/homepage-renovation/asset-manifest.json).
6. [`Docs/design/homepage-renovation/evidence/README.md`](../../Docs/design/homepage-renovation/evidence/README.md) and the linked focused browser-evidence READMEs.
7. All four immutable references listed above. Open and inspect them visually before editing.
8. Current implementation under `Frontend/src/app/features/projects/project-screen/`, source assets under `Frontend/public/assets/project-screen/`, and deterministic extraction tools under `Frontend/tools/project-screen-assets/`.
9. Root `AGENTS.md` and `Frontend/AGENTS.md`.

`empt docx/source-initial-goal-objective.md` preserves the older broad UI-renovation request for context. It is not a replacement for the current Homepage objective. Keep the complete handoff package until the next machine has read it; the user may delete the `Trash docx` folder after that.

## Continue Safely

- Start from the actual current `git status` and HEAD; do not assume this report's pre-report SHA is still HEAD after its documentation commit.
- Continue the existing Goal. Do not create another Goal, push, or declare completion.
- Inspect all four source references and current consumers before changing scene assets.
- Finish and visually inspect the full static Minecraft scene first; only then continue Light, Raccoon, Dark, DOM replacement of baked UI, and motion.
- Keep new artwork source-derived and measured. Do not hide mismatches under unmeasured patches or use generated art as a substitute for reference pixels.
- Preserve Project Screen persistence, renderer preview contracts, route behavior, and real functional controls.
