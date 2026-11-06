# Portrait note-board v2 — face fit and edge cleanup

Edit the currently selected note-board v2 fix2 image. Preserve its improved thin note-board appearance, near-frontal view, cream surface, oak material and separate shelf. Do not return to the box-like workstation v1 or redesign the asset.

The neutral `portrait-note-board-geometry-guide.png` was included earlier in this conversation. If it is available in the existing context, use it for geometry only; the exact dimensions below are authoritative. Do not copy its flat colors. The selected artwork is the material/style reference and edit base.

## Remaining measured corrections

At a uniform 370 CSS px object width, Codex measured the current clear face at about 329×281 px. It must be 348×304 px so the real 330×290 UI area retains 9 px horizontal and 7 px vertical padding. The main silhouette is currently about 370×352 px at that scale and must fit the 370×360 guide without stretching.

Follow the existing guide exactly while keeping the complete assembly near 370×360:

- Shelf: x=0, y=8, width=370, visible front thickness about 16.
- Board frame: x=5, y=30, width=360, height=318.
- Clear face: x=11, y=38, width=348, height=304.
- Thin rails: 6–8 units on all four sides. Enlarge the face by thinning the rails; do not shrink the UI.
- Minimal rear brackets: 5–8 units wide, behind the board, with only the required visible connections.
- Keep the shelf visibly separate from the board and remove any gap/extra height that makes the assembly taller than the guide.

The current original has 10,685 red-fringe pixels with alpha 1–7 around the exterior. Remove the red/pink fringe. Preserve natural antialiasing and true transparent pixels outside the silhouette; edge colors must remain consistent with the adjacent oak and dark-brown outline. Do not leave a low-alpha shadow below the board.

Do not introduce a shadow below the board. Keep the cream face flat and blank. Preserve the selected asset's overall design and use no nonuniform scaling or crop.

## Exclusions

No cabinet, storage volume, broad sidewalls, chunky frame, drawers, legs, thick counter, floor, room, washer, raccoon, plants, logo, UI, text, decorative face divisions, drop shadow, fake checkerboard, halo, or background.

Return one edited transparent PNG. Codex will remeasure the original before sending this exact revision to Check.
