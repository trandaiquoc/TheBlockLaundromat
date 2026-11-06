# Portrait note-board panel master — geometry-control reset

Status: **candidate generation prompt only**. Check 01 supplied this fresh-generation method after three direct edits kept missing the face/UI geometry and transparent-edge requirements. No candidate is approved by this prompt.

## Root cause and method

The combined assembly gave Generate competing geometry: shelf, brackets and the earlier silhouette expanded while the cream face stayed too small. A guide and exact text did not reliably constrain the rendered proportions, and direct edits inherited the previous composition. Generate one thin board panel and frame as an independent asset first; create the shelf and mounting structure as separate jobs after the face passes. If this fresh generation still misses the measured face or edge criteria, stop prompt-based correction and use modular construction with generated wood artwork and exact vector/layout geometry.

## References

Use only the already attached files in Generate 02:

- `portrait-note-board-geometry-guide.png` — geometry only. For this job, use the central board-frame and clean-face rectangles; ignore the guide's shelf and rear supports because they are outside this asset's ownership.
- `washer-master-v1.png` — approved honey-oak material, warmth, lighting and rendering style.
- `raccoon-master-v1.png` — shared illustration finish and outline quality.

Do not attach or use old board/workstation/panel candidates, room concepts, desktop panel/support images or unrelated objects as geometry references. The reference files are already present earlier in this Generate 02 conversation; do not upload duplicate files.

## Generate 02 prompt

PHASE 3 — JOB 1: PORTRAIT NOTE BOARD MASTER

Create one completely new, standalone portrait note-board panel asset. This is a thin, lightweight wall-mounted note board, not a workstation, cabinet, box, storage unit or furniture enclosure. This is a fresh generation, not an edit of any previous image.

REFERENCE AUTHORITY

The previously attached `portrait-note-board-geometry-guide.png` is the only geometry reference. Use only its central board-frame and clean-face rectangles. Ignore the shelf and rear supports visible in that guide; they are not part of this job.

Use the previously attached `washer-master-v1.png` only for approved honey-oak material, warmth, lighting and rendering style. Use the previously attached `raccoon-master-v1.png` only for the shared illustration finish and visual identity. Style references must not influence geometry.

Do not use any previous board, panel, workstation, room or support image as an image reference. Do not infer board geometry from another object.

LOCKED GEOMETRY — FOLLOW THE GUIDE

Composition: 370 × 360 proportional design.

Board outer frame: x=5, y=30, width=360, height=318.

Clean cream face: x=11, y=38, width=348, height=304.

Required real UI-safe rectangle: x=20, y=45, width=330, height=290.

The clean face must fully contain the UI rectangle with 9 units of horizontal and 7 units of vertical clearance. Keep frame rails approximately 6–8 units thick. Keep the geometry and proportions from the guide; do not enlarge the outer silhouette, increase rail thickness, reduce the cream face, stretch the output or reinterpret it as a furniture box.

VISUAL DESIGN

Create a thin, flat, lightweight honey-oak wooden frame around one large uninterrupted warm cream note surface. Use a near-frontal camera with minimal perspective, matte natural oak, subtle grain, restrained bevels and soft warm lighting consistent with the approved washer and raccoon. The board should read immediately as a note board.

Keep the cream face opaque, flat, blank, calm and unobstructed. No internal divisions, pins, papers, illustrations, icons, text or decoration crossing the face.

ASSET BOUNDARY

Create only the board panel and its frame, including restrained corner construction and only necessary small fasteners.

Do not create a shelf, countertop, legs, side posts, support braces, rear structure, mounting brackets, wall, floor, environment, plants, washer, raccoon, cabinet volume, storage or drawers. The shared shelf and architectural mounting structure will be separate assets and will be verified during assembly.

TRANSPARENCY AND EDGE QUALITY

Output a genuine RGBA PNG with true transparency outside the complete board silhouette. Keep the face and frame opaque. Preserve a clean, naturally antialiased silhouette with edge colors consistent with adjacent wood and outline colors. No red, magenta or other colored fringe; no colored pixels bleeding into the transparent exterior; no glow, outer stroke, drop shadow, ambient shadow, background plane, fake checkerboard or simulated transparency. Avoid isolated semi-transparent colored pixels outside the physical silhouette.

OUTPUT

Generate one complete original asset and preserve the entire frame without cropping. Do not generate UI, text, logos, decorations, a presentation mockup or an inspection screenshot. Keep the complete asset visible with modest transparent padding.

PRIORITY ORDER

1. Clean-face geometry and usable UI area.
2. Complete, thin and balanced board frame.
3. Approved material and illustration consistency.
4. Clean RGBA silhouette.

Do not sacrifice the required usable face area for decorative styling.

## Acceptance checks before Check review

Measure the downloaded original PNG before judging the preview. Require genuine RGBA transparency, a complete uncropped silhouette, a clean face at least 348 × 304 in the composition, the full 330 × 290 UI rectangle within the cream face, 6–8 unit rails, a thin note-board appearance, no color fringe or anomalous exterior pixels, and no shadow outside the silhouette. Distinguish natural edge antialiasing from color-infected pixels; do not remove antialiasing or retouch the artwork programmatically. If any required geometry or edge criterion fails, do not submit it to Check or repeat another direct edit. Follow the modular-construction fallback and ask Check only about the next production step after recording the limitation.

The independent Check review must receive the exact original candidate only after Codex's own measurements and visual inspection. A successful generation response is not an approval.
