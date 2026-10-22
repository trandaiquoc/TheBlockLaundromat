# Phase 2 Homepage Prototype — Current State

The experimental Three.js room is available at `/home-preview`. The default
`/` route still renders the traditional Project Screen. Both routes use the
same `ProjectScreenComponent` and existing project workflows. The preview
uses the existing Create, Open, Delete, search, sort, import/export, Settings,
Account, locale, and theme controls; the Create form opens from a button in
preview mode. The canvas is decorative to assistive technology.

## Scene and asset ownership

`Frontend/src/app/features/projects/home-preview/` owns the preview renderer,
semantic groups, modeled room, detail textures, theme treatment, hit testing,
resize observer, and GPU disposal. It does not access the Editor renderer or
project persistence. The scene includes a floor, walls, ceiling, framed door
and window openings in the side walls, exterior geometry, washer, board, shelf, plants, basket,
two hybrid raccoons, and lamps. The material and light sets switch in place
without changing geometry or placement. Dark turns interior lamp emission and
lamp light off.

Blender is unavailable in the current environment. The prototype uses Three.js
geometry with modeled depth and generated paint textures. No GLB has been
exported yet. This remains a significant visual and asset-contract gap against
the Phase 1 design; the scene currently reads as a stylized blockout rather
than matching the source paintings closely.

Source artwork is preserved byte-for-byte under
`Frontend/source-assets/homepage/`. Angular's production asset input is
`Frontend/public/`, so the full source package is excluded. Eighty original
detail PNGs (washer, shelf contents, board plants, basket, door/window and decoration faces, and two raccoons per theme) are
copied byte-for-byte to `Frontend/public/assets/homepage/runtime/`. Only the selected theme's twenty
detail images are requested by the scene. `npm run check:home-assets` verifies
the 331 source layer hashes, four canonical references, runtime copies, and
source exclusion from production output.

`runtime/shared/plaster.png` and `runtime/shared/wood-grain.png` are separate
1254 × 1254 generated wall and floor materials, not source layers or a room background. Their SHA-256 values are
`d6e358a806e1e70da269676e5d0fd4624d75854d8aa1f2e0af8f44383eabf133`.
`551221deab78694e6c8ebc5e4b4e1c5059eac80308002626ad409f7f61097051`.
They are mapped onto existing meshes, retained through theme switches, and
disposed when the scene ends. The runtime inventory is 82 PNGs: 80 exact
source-detail copies and two shared materials.

## Verification baseline

`npm run check:home-preview` uses local Chrome headless and writes screenshots
and a JSON report into ignored `Frontend/.artifacts/home-preview/`, including
a 1672 × 941 Minecraft capture at the reference artboard size. At
1280 × 720 it recorded 149 draw calls, 21,966 triangles, and 33 GPU textures
in the software WebGL environment. At 390 × 844 it recorded 91 draw calls,
12,108 triangles, and 24 textures. The same-route theme sequence retained 123
geometries and 33 textures while loading only the twenty images of each selected
theme; Angular route navigation disposed the preview owner. All checked widths (1280, 1366, 390, 320)
had no document horizontal overflow and control text was at least 14 CSS px.
At 1280 × 720, selected-theme texture dimensions imply about 19.1–19.7 MiB
for uncompressed RGBA with mipmaps; this excludes driver overhead and other
GPU allocations. One on-demand frame took 28–60 ms in Chrome's software
renderer across the four themes. These are software-renderer measurements,
not production GPU frame-time or measured VRAM data.

The source references have more intricate architecture, visible exterior,
painted materials, props, and board integration than the current browser
render. The current window image uses a mesh UV crop to display the exterior
portion without duplicating the board artwork. At the 1672 × 941 reference size,
the prototype door and right window are narrower, the logo and washer are
smaller, and the floor lacks the reference's strong framed sunlight shadows.
The board shows live project data and therefore has an empty state in a fresh
browser profile instead of the reference's sample cards. Visual quality is
therefore **partial** despite the functional preview and asset integrity checks.
