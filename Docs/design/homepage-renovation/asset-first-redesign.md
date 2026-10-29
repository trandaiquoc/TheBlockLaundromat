# Homepage asset-first redesign

**Status: Phase 3 sample set complete; all four assets are approved by Check and Codex. Phase 4/Figma has not started.** This is the
new design workflow agreed
in the [Homepage discussion](https://chatgpt.com/g/g-p-6aaa3cffff7c8191855cea64ad58ff2f/c/6adab75f-719c-83ec-aa57-cb7297bde2a1).
It supersedes the earlier plan to reconstruct assets to match the four source
images. It is a design plan, not a description of the implemented Homepage.

## Direction

- Create complete objects individually and compose the room in Figma. Preserve
  the existing logo. The documented original brand source is
  [`the-block-laundromat-logo.svg`](../../../Frontend/public/assets/brand/the-block-laundromat-logo.svg);
  its SHA-256 is `7c4d64d5ed5612724bab359a1610163355145ec484412045ee17d62072838b5a`
  and it contains an embedded raster image. Four scene-specific logo PNGs also
  exist under `Frontend/source-assets/homepage/assets/`. Confirm the intended
  version when the style and logo are reviewed.
- Use the raccoon as the visual reference for a consistent set of objects.
  The user identified [ooa_raccoon](https://www.instagram.com/ooa_raccoon/)
  as a reference. The discussion did not establish the account's precise
  visual rules: representative posts have been inspected in the dedicated
  signed-in browser. See the [Phase 2 proposal](asset-first-phase-2.md).
- Keep each object as a separate layer or group. Keep editable UI text and
  controls separate from raster artwork. Prepare moving parts and shadows
  separately when needed; an imported PNG remains raster artwork.
- Preserve the existing Project workflow ownership and the intended PixiJS
  scene / Angular DOM boundary. The redesign does not itself implement either.

## Check, Generate and Figma workflow

1. Check prepares the requirements and prompt for Generate.
2. Codex sends the prompt and references to Generate, retrieves the original
   output and performs the first quality review.
3. If the output fails Codex's review, Codex handles the identified problems
   before passing the asset on. Avoid an endless loop when the same fault
   persists, and record the issue.
4. Once Codex finds the asset acceptable, send the file to Check for its
   second check and associated checking prompt; report the resulting verdict.
5. When the asset has passed both reviews, Codex assembles the parts in Figma
   at the appropriate phase and records the asset version used there.

## Roadmap from the latest discussion

| Phase | Work and expected output | Suggested Codex model |
| --- | --- | --- |
| 1 | Prepare Chrome workflow, Check and Generate conversations, Figma file, storage, versioning and recoverable state. | Sol — Medium |
| 2 | Inspect the raccoon references and original logo; define linework, proportions, palette, perspective, lighting, detail and the asset inventory. | Sol — Medium |
| 3 | Coordinate Generate and Check to create the raccoon, then a washer, project board and plant as a consistent sample set. | Terra — Medium |
| 4 | Assemble the logo and sample assets in desktop and mobile Figma layouts; review style, scale, perspective, UI space and contact points before scaling up. | Sol — Medium |
| 5 | Produce the remaining room objects, raccoon parts or poses, two papers and required shadow layers. | Terra — Medium |
| 6 | Complete the Figma Homepage, editable UI and desktop, ultrawide and portrait layouts. | Sol — Medium |
| 7 | Produce the required visual variants for all four themes. | Terra — Medium |
| 8 | Complete theme frames and states in Figma and package assets, names, sizes, anchors, layer order and theme mapping. | Terra — Medium |
| 9 | Implement the functional Homepage with PixiJS and Angular DOM using existing Project workflows. | Sol — Medium |
| 10 | Implement simple animation with pause and reduced-motion support. | Luna — Medium |
| 11 | Complete raccoon interactions, lighting and theme transitions; verify workflows, keyboard use, performance, memory and viewports. | Sol — Medium |

These model names are recommendations from the discussion, not a guarantee of
availability in a particular client. Image creation remains the responsibility
of the image-generation tool in the Generate conversation.

## Phase 1 setup state — 2026-10-29

- The dedicated Chrome DevTools endpoint at `127.0.0.1:9223` responded. The
  DevTools session and endpoint showed the same open ChatGPT pages.
- The latest Homepage discussion was readable in Project Cobblemon. Two new
  conversations have been created, named and initialized: [Check](https://chatgpt.com/g/g-p-6aaa3cffff7c8191855cea64ad58ff2f-cobblemon/c/6ae2cfac-70bc-83ec-9d1d-6f76fe67ed65)
  and [Generate](https://chatgpt.com/g/g-p-6aaa3cffff7c8191855cea64ad58ff2f-cobblemon/c/6ae2cfba-cd7c-83ec-a171-05d99fc0ec5a).
  Both confirmed their roles; neither has generated artwork yet. The earlier
  conversation URLs did not open in new tabs during this check.
- A Figma tab reached the signed-in Recents page. Search input was entered and
  cleared through DevTools, and the user confirmed Figma was ready. The user
  selected the personal team for the new
  [Homepage Redesign Figma file](https://www.figma.com/design/ESqNCTN9XWIacmdVEjzJkZ).
  The file opened in the dedicated Chrome instance. A temporary rectangle was
  created and removed through the Figma connector; a subsequent read confirmed
  the page is empty. This verifies edit access, not a finished design.
- The old `Docs/phase2` working directory was removed at the user's request.
  It is not the storage location for this new workflow.
- The local Git remote uses the former `MinecraftBuilderWeb` name. GitHub
  resolves both that name and `TheBlockLaundromat` to repository ID
  `1373821221`, whose current name is `trandaiquoc/TheBlockLaundromat`.

## Asset and version storage

- Preserve existing logo and reference files unchanged. Keep their source paths
  and SHA-256 hashes with each relevant asset decision.
- Keep temporary generation outputs and reviews under the ignored local path
  `.artifacts/homepage-redesign/candidates/<asset-id>/round-###/`, preserving
  the original downloaded files and identifying each round and review verdict.
  This local directory is not pushed and must not be treated as a backup.
- Record current decisions, output hashes, review results, unresolved issues
  and Figma asset versions in tracked design documentation. Choose the permanent
  product-owned location for accepted art as the deliverables are defined; do
  not put temporary candidate files in application `src/`.

## Open setup items

1. Check the Phase 2 visual proposal against the washer, project board and
   plant samples as they are approved, including their appearance beside the
   logo and Raccoon Master.
2. Record each phase's decisions, approved asset versions, Figma usage and
   unresolved issues as work proceeds. The setup check is not Phase 2 design
   approval and does not start later phases automatically.
