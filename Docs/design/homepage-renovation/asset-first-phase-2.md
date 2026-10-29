# Homepage asset-first redesign: Phase 2 proposal

**Status: design proposal, not visual approval.** No artwork has been generated
or reviewed. [Check's proposal and evidence notes](https://chatgpt.com/g/g-p-6aaa3cffff7c8191855cea64ad58ff2f-cobblemon/c/6ae2cfac-70bc-83ec-9d1d-6f76fe67ed65) informed this document; Codex corrected and qualified its inventory below.
The existing application contract remains in [Homepage and Project Screen](README.md).

## References and limits

- The unchanged [brand logo](../../../Frontend/public/assets/brand/the-block-laundromat-logo.svg)
  is the documented original: an SVG containing a 1774 × 887 raster PNG. SHA-256
  of the SVG: `7c4d64d5ed5612724bab359a1610163355145ec484412045ee17d62072838b5a`.
  A copy of its embedded PNG was sent to Check for visual inspection.
- After the user signed in to Instagram on the dedicated browser, Codex
  inspected [the watermelon post](https://www.instagram.com/p/Ddg8UkKo6DB/)
  and [the sword post](https://www.instagram.com/p/De7CD3kIw15/) by
  [ooa_raccoon](https://www.instagram.com/ooa_raccoon/). They show compact
  characters with large heads and eyes, short limbs, brown eye patches and
  striped tails, with warm muted colors, dark irregular outlines, flat color
  shapes and subtle texture. Check saw the logo but has not independently
  inspected these posts. Exact numerical proportions and hex colors below remain
  proposals, not measurements from the reference.
- Four earlier scene concepts remain product references, not requirements to
  reconstruct their pixels. Every new object must be a complete, coherent
  standalone asset, even if another layer later covers part of it.

## Proposed visual rules

Use a gentle, simplified 2D illustrated direction that sits comfortably beside
the unchanged logo. The following are working targets for the sample set and
will be revised after reviewing actual files together:

| Property | Working direction |
| --- | --- |
| Shape and line | Clear silhouette, rounded contours and dark warm outlines; preserve recognizable geometry on machines and boards. Restrained texture and detail. |
| Character | Round, large head; small ears and short body; warm gray fur, cream face, darker eye mask and striped tail. Check proposed a head around 55–60% of character height; this is a starting estimate, not an artist measurement. |
| Palette | Check's starting colors: outline `#51423F`, fur `#B8ABA5`, cream `#F7EFE2`, mask `#76615A`, grass `#9FBE72`, wood `#BA8055`, water `#93C6D9`, stone `#C6C3BB`. These are experimental artwork colors, not replacements for logo colors or application theme tokens. |
| Perspective | Predominantly frontal with a gentle three-quarter view; align visible top and side surfaces across objects. |
| Light | Soft, consistent light from upper left as a starting point; keep contact and scene shadows adjustable as separate layers where practical. |
| Detail | Recognizable at intended display size; allow restrained hand-drawn texture while avoiding busy texture, embedded functional text and photorealistic rendering. |

## Initial asset inventory

These sizes are provisional starting points on a 1672 × 941 desktop reference
canvas, not fixed Figma dimensions or mobile constraints. Anchors describe how
to place complete assets and must be adjusted through composition review.

| Asset | Purpose and proposed scale | Anchor and separation |
| --- | --- | --- |
| Existing logo | Brand; 25–35% canvas width | Brand area; preserve original proportions and content. |
| Raccoon | Mascot and future interactions; 23–33% canvas height | Feet/contact point; complete character first, plan separate movable parts later. |
| Washer | Laundry motif and potential project preview; 16–23% canvas width | Bottom center; complete machine, with door and preview layers considered separately. |
| Project board | Surface around project content; 24–36% canvas width initially | Mount point; complete frame and clean surface, with editable content above it. Verify usable space for real project list and controls. |
| Plant | Organic sample and possible leaf motion; 16–27% canvas height | Pot base; complete plant, with leaves separable if needed. |
| Papers | Create and Import presentation, subject to layout design | Hand or surface contact; separate blank papers and editable controls. |
| Basket, bench and other props | Candidate foreground objects from earlier concepts; final selection pending composition | Individual contact points; each object complete, including parts later hidden. |
| Room/background and ground | Candidate scene context; size depends on responsive layout | Separate environment pieces and contact shadows as needed. |

Raccoon, washer, board and plant form the planned Phase 3 sample set. Remaining
objects and precise scale are decisions for composition, not new product
features. Existing project creation, import, search, sorting, open, delete and
persistence remain owned by current workflows. UI text, buttons, cards, locale,
themes, settings and account controls remain editable and separate from art.
The existing account is a local presentation demo, not an authentication feature.

## Acceptance and next work

For each generated asset: retrieve the original file; confirm the complete object
is coherent at its edges and behind any future overlap; inspect alpha, resolution,
silhouette, style and suitability beside the logo; then have Check review the
actual file after Codex's first review. A flat PNG is not a rig or separated
animation layers. Review the four sample objects together in Figma before scaling
up production. Phase 3 requires an explicit request under repository instructions.

Check has specified an initial raccoon brief, but has not yet provided a final
Generate prompt. The first sample should be one complete raccoon, with clear
space around ears, feet and tail, no text or props, and transparency if the
generator can provide it. Confirm actual output dimensions and alpha from the
downloaded file rather than assuming the requested format was delivered.
