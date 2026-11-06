# Portrait note-board v2 — direct geometry correction

Use Generate 02's current selected portrait note-board v2 as the image to edit. Preserve its now-correct lightweight note-board identity, near-frontal camera, material palette, and hand-drawn rendering. Do not restart from the rejected box-like workstation v1.

## Codex inspection findings

The current original is 1122×1402 RGBA. Its main object spans about 1082×1073 px at alpha ≥8. At a uniform 370 CSS px object width, the measured blank cream face is about 329×282 CSS px, so it does not contain the required 330×290 px UI region. The four frame rails are about 14 CSS px thick at that scale, the upper shelf front is about 28 px thick, and the two brackets are visually broad. There is also a soft shadow below the lower rail even though this isolated asset has no floor.

## Edit only these geometry defects

Follow the existing neutral guide's 370×360 layout coordinates:

- Overall assembly: 370×360.
- Upper shelf: x=0, y=8, width=370, visible front thickness about 16.
- Outer board frame: x=5, y=30, width=360, height=318.
- Clear cream face: x=11, y=38, width=348, height=304. It must contain a real 330×290 UI rectangle with positive padding on all sides.
- Reduce all four frame rails to the guide's 6–8 unit thickness. Keep the frame flat and lightly bevelled; do not add deep sidewalls or oversized corner caps.
- Make the two rear mounting brackets narrow and secondary, about 5–8 units wide, with no thick columns across the face.
- Remove the soft shadow under the lower rail. There is no floor in this asset.
- Clean any colored fringe outside the actual silhouette while preserving genuine transparent alpha.

Keep the board recognizably a thin note board and the separate shelf recognizably slim. Do not change the cream material, frame design, or camera beyond what is needed to meet the geometry above. Preserve a complete silhouette and modest transparent padding. Do not crop, stretch, or add objects.

## Exclusions

No cabinet, box, storage volume, drawers, legs, countertop, broad sidewalls, floor, wall, room, washer, raccoon, plants, logo, UI, text, icons, sample projects, decorative face divisions, cast shadow, fake checkerboard, or background.

Return one edited transparent PNG only. This is still a candidate; Codex will inspect the original and measure the face again before any Check review.
