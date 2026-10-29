# Shared initialization brief — Generate 01 / Check 01

The Block Laundromat — illustrated interactive Homepage. This is an implementation goal orchestrated by Codex for a solo developer without an artist. The latest user brief supersedes older analysis-only restrictions and older roadmaps. This message is self-contained; do not assume access to Source or other chats.

CURRENT PHASE: 1 — context recovery and workflow setup only. Acknowledge the brief and attachments; do not generate images, design the room, approve assets, produce the next generation prompt, or advance to Phase 2 until Codex explicitly opens that phase. No artwork or Figma composition is approved for this new goal.

## Sources and attached evidence

- Repository: https://github.com/trandaiquoc/TheBlockLaundromat
- Website: https://the-block-laundromat.vercel.app/
- Existing preview: https://the-block-laundromat.vercel.app/homepage-2d-preview
- Source conversation: https://chatgpt.com/g/g-p-6aaa3cffff7c8191855cea64ad58ff2f/c/6adab75f-719c-83ec-ba26-f763e84c8556
- Existing Figma: https://www.figma.com/design/ESqNCTN9XWIacmdVEjzJkZ/The-Block-Laundromat--Homepage-Redesign
- Attached 01-minecraft.png, 02-light.png, 03-raccoon.png, 04-dark.png: four original 1672×941 room illustrations. Study architecture, depth, density, resting areas, object scale, windows/exterior, materials, lighting and integration of UI into space. These are references, not a fixed background for the final interactive product. Rebuild assets; pixel parity and reuse of old cutouts are not required.
- Attached logo-light-existing.png: original Light logo cutout. Preserve the existing logo, do not redraw it. Final source/variant selection remains open; do not treat this cutout as a newly approved master.
- Attached figma-existing-rejected.png: current old Figma composition, explicitly rejected. This is a negative reference, never a target or approved composition.
- Attached instagram-post-De7CD3kIw15.png: browser evidence of an actual post at https://www.instagram.com/p/De7CD3kIw15/ from https://www.instagram.com/ooa_raccoon/. This is reference evidence, not a production asset. Phase 2 must inspect and select a consistent group of actual posts before locking line, form, proportion, palette, texture or expression. Do not infer the artist's style from a username or pretend a group has already been selected.

## Visual direction and acceptance

Create individual assets and compose them in Figma. Keep the old Figma intact and use a new page/frame for the new direction. Mascot, furniture and background must share one coherent visual language informed by the original rooms and verified raccoon references.

The scene must read as a complete room: recognizable architecture, consistent camera/perspective and scale, far/middle/near layers, believable supports/occlusion/contact shadows, one lighting logic, and a clear washer–raccoon–project-board activity cluster. Richness must leave readable UI areas. Do not repair a weak composition by scattering decoration.

Reject: large blank white/gray fields, washer/raccoon/plant arranged like stickers, a freestanding project panel without architectural context, a colored strip standing in for a floor, and a conventional dashboard/header dominating the illustration. Phase 4 compares the assembled scene directly with originals and Phase 2 targets; isolated asset approval cannot approve a room. No mass production or implementation before that gate passes.

Lock layout and scale before mass production. A full-room concept may be generated through Generate–Check as reference, but never flatten the interactive Homepage into one bitmap. Raster remains raster; Figma text, buttons, inputs and lists stay editable.

## Functionality, layout and motion constraints

Project list, Search, Sort, Create, Select, Open/Delete, Structure JSON import, Project Backup import/export, Settings, EN/VI, Minecraft/Light/Raccoon/Dark, and Account only to existing capability. Existing Angular workflow/persistence/session/routing owners must be reused; no second project system or Account backend. Existing preview is Canvas 2D; PixiJS is preferred for future scene/motion, Angular DOM for real UI. Code decisions are verified in Phase 9, not made by these chats.

Project-board artwork needs a clean surface for dynamic UI. Washer shows selected project's saved preview within a door mask/frame/reflections; do not load the Editor just for a thumbnail. Do not bake sample projects or localized labels into PNG. Complex forms need space, focus and keyboard access.

Viewports: 1672×941, 1440×900, 1366×768, 1280×720, 21:9, 390×844, 320×700. Uniform object scaling within sensible limits; extend environment and crop periphery deliberately. Portrait recomposes the space and may scroll. Do not stretch artwork or shrink the whole desktop. Global controls follow viewport and blend with the design; desktop must work in a normal browser window without F11. Pixi/DOM need shared anchors and explicit occlusion, since DOM cannot interleave arbitrarily inside one canvas.

Motion: fixed foot/pot contacts; separate parts/poses/shadows as needed for breathing, blinking, looking toward washer and offering two blank Create/Import tickets. Ticket labels/hit areas are real localized keyboard UI, available immediately. Latest selection replaces prior intent; interrupted states must resolve. Animation never gates actions or triggers persistence. Support reduced motion and suspend unnecessary hidden-page work. Prefer artwork, masks, shadow/light layers and controlled color/opacity; do not promise full physical 3D lighting from PNG. No default Three.js/Spine requirement.

## Mandatory Generate–Check loop

1. Codex asks Check for the next image job inside the explicitly active phase.
2. Check supplies full prompt, exact references, technical requirements and acceptance criteria.
3. Codex submits that prompt and references to Generate; Generate creates/edits imagery only.
4. Codex inspects the actual image first: brief, camera/ratio/style/function, anatomy, extra/missing parts, cut edges, halos, fake transparency, consistency, clean UI space and animation parts. Codex requests direct corrections until satisfied.
5. Codex sends that exact version plus brief/references to Check once. Check returns PASS / FAIL / NEEDS_CONTEXT, concrete defects, full fix prompt if FAIL, and next prompt within current phase if PASS. Never re-review an unchanged version. During Phase 1 there is no image job, so acknowledgement must not include a generation prompt.
6. If FAIL, Generate fixes and Codex checks again. Only dual Codex + Check PASS can approve a version. Check must not expand scope or bypass gates. After three consecutive fixes repeating the same defect, return to Check for root-cause/brief/method revision rather than loop indefinitely or lower standards.

Inspect assets individually and assembled when context exists. Download originals using image download, never screenshots as production assets. Verify dimensions and actual alpha; candidates stay temporary, only approved versions enter approved/. Preserve previously accepted details during fixes. Codex owns technical/file/Figma/code validation. Save handoff before rotating long/inconsistent chats and transfer style guide, references, versions, status and next job.

## Roadmap (Codex model / effort, distinct from image generator)

| Phase | Output / gate                                                                                                     | Codex model            |
| ----- | ----------------------------------------------------------------------------------------------------------------- | ---------------------- |
| 1     | Sources, active Generate/Check, roadmap, baseline and handoff                                                     | GPT-6.1 Sol / High     |
| 2     | Whole-scene art direction, camera/scale/palette/light, desktop/portrait, asset/animation breakdown                | GPT-6.1 Sol / High     |
| 3     | Raccoon, washer, clean board, plant masters and enough environment to form a room                                 | GPT-6.1 Terra / Medium |
| 4     | Complete desktop + representative portrait Figma scene with real UI sizes; room gate                              | GPT-6.1 Sol / High     |
| 5     | Remaining artwork, edges/occlusion, motion parts/poses/tickets/shadows                                            | GPT-6.1 Terra / Medium |
| 6     | Responsive Light Figma UI, forms, EN/VI and empty/loading/selected/error/long content                             | GPT-6.1 Sol / Medium   |
| 7     | Minecraft, Raccoon, Dark artwork through Generate–Check; deliberate materials/exterior/light, no whole-scene tint | GPT-6.1 Terra / Medium |
| 8     | All-theme Figma and export handoff: sizes, anchors, occlusion, parents, mapping                                   | GPT-6.1 Sol / Medium   |
| 9     | Real Homepage/workflows, preferred PixiJS + Angular DOM, responsive/accessibility/lifecycle                       | GPT-6.1 Sol / High     |
| 10    | Specified simple motion, stable contacts, reduced motion/hidden-page suspension                                   | GPT-6 Luna / Medium    |
| 11    | Raccoon interaction/interruption, lighting/themes, workflow/performance/memory acceptance                         | GPT-6.1 Sol / High     |

Each phase ends with documentation, commit/push and a stop for user model selection. Do not claim to switch the Codex model. The chats must never start a later phase on their own.

## Durable artifacts

Each phase: Docs/design/homepage/phaseN/README.md and handoff.md; prompts/, reviews/, assets/approved/ only when needed. Do not commit whole chat transcripts or duplicate masters unnecessarily. Asset catalog records semantic ID/version, source, dimensions/alpha, theme/role, anchors/layers/parents when locked, Codex/Check status, Figma frame/version and future runtime path. Only approved runtime assets go to Frontend/public/homepage/ during code implementation. No candidates/reports in public/.
