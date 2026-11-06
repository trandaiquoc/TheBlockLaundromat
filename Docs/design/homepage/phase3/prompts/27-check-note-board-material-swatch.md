# Check response — modular note-board method and Job 1A

Check 01 recommends one generated material swatch plus vector-defined board geometry. The frame, face, corners, bevels, and fasteners are vector-owned; generated wood texture is clipped inside those shapes; real UI remains a separate application layer. Do not generate separate transparent rails or corners, because that would bring back inconsistent dimensions, mismatched joints and alpha-edge contamination.

The fixed coordinate system is 370×360. Board frame `(5,30,360,318)`, clean face `(11,38,348,304)`, UI-safe rectangle `(20,45,330,290)`, 9 px horizontal padding and 7 px vertical padding. Side rails are 6 px, top rail 8 px, bottom rail 6 px. These are layout constraints, not instructions for Generate.

Only one new generated asset is needed for the first job: an opaque, front-facing, square honey-oak material swatch. The same texture is used at 0° in horizontal rails and rotated 90° in vertical rails; it may be cropped or tiled, never nonuniformly stretched. Face fill, frame geometry and transparency are vector-defined. This method removes transparent generated edges from the artwork path and should prevent the repeated red-fringe failure. Do not erase or recolor candidate pixels to force acceptance.

## Exact references

Attach only:

- `washer-master-v1.png` — approved oak color, grain, warmth, matte finish and lighting.
- `raccoon-master-v1.png` — shared illustration quality and visual finish.

Omit all board candidates, direct edits, geometry screenshots, desktop panel, workstation and room concepts. Geometry no longer comes from an image reference.

## Generate 02 prompt — Job 1A

PHASE 3 — JOB 1A: HONEY OAK MATERIAL SWATCH

Generate one original, seamless-looking honey-oak wood material swatch for use in a vector-defined note board.

REFERENCE AUTHORITY:

washer-master-v1.png: primary reference for approved honey-oak color, grain, warmth, matte finish and lighting.

raccoon-master-v1.png: reference for shared illustration quality and visual finish only.

Create ONLY a flat, front-facing wood material texture.

REQUIREMENTS:

Warm honey-oak.

Natural, restrained wood grain.

Fine, subtle grain variation.

Matte finish.

Soft warm tonal variation.

Consistent material appearance across the entire image.

Suitable for a small illustrated wooden note-board frame.

Grain should be natural and relatively fine, not oversized or dramatic.

No perspective.

No lighting direction that creates strong shadows.

No bevels or dimensional edges.

OUTPUT:

Square, high-resolution image.

Fully opaque RGB artwork.

Consistent wood material across the entire swatch.

No transparency required.

No background objects.

STRICTLY FORBIDDEN:

Complete wooden boards.

Frames or rails.

Corner blocks.

Fasteners or screws.

Furniture.

Shelves.

Cabinets.

Objects or environmental scenes.

Text, logos or symbols.

Shadows, glow or outlines.

Red or magenta color contamination.

This image is a MATERIAL SOURCE, not a finished asset.

Its purpose is to provide authentic oak surface artwork that will be clipped into independently defined vector shapes.

Do not attempt to determine or create the note board geometry.

## Acceptance gates

The swatch must be square and high resolution, fully opaque, consistently honey-oak, fine-grained, matte, front-facing, without strong shadows, red/magenta contamination or any object/scene elements. Only after swatch acceptance, build the vector composition and separately verify: exact 370×360 canvas, frame geometry, clean-face bounds, UI containment, specified rail thickness, genuine export transparency, and no baked UI/text. If later export shows fringe, keep the vector-rendered composition as the production source with the opaque generated swatch clipped into its shapes; never recolor or erase the swatch pixels to force acceptance.

This text-only Check answer does not approve the failed board candidate or the swatch. No shelf, support, room assembly or Phase 4 work is authorized before Job 1 passes.
