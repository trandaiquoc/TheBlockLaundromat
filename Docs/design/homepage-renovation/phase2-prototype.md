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
and window openings, exterior geometry, washer, board, shelf, plants, basket,
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
`Frontend/public/`, so the full source package is excluded. Forty-eight original
detail PNGs (washer, shelf, basket, door/window and decoration faces, and two raccoons per theme) are
copied byte-for-byte to `Frontend/public/assets/homepage/runtime/`. Only the selected theme's twelve
detail images are requested by the scene. `npm run check:home-assets` verifies
the 331 source layer hashes, four canonical references, runtime copies, and
source exclusion from production output.

## Verification baseline

`npm run check:home-preview` uses local Chrome headless and writes screenshots
and a JSON report into ignored `Frontend/.artifacts/home-preview/`. At
1280 × 720 it recorded 129 draw calls, 21,826 triangles, and 25 GPU textures
in the software WebGL environment. At 390 × 844 it recorded 97 draw calls,
12,160 triangles, and 22 textures. The same-route theme sequence retained 111
geometries and 25 textures while loading only the twelve images of each selected
theme; Angular route navigation disposed the preview owner. All checked widths (1280, 1366, 390, 320)
had no document horizontal overflow and control text was at least 14 CSS px.
These are software-renderer measurements, not production GPU frame-time data.

The source references have more intricate architecture, visible exterior,
painted materials, props, and board integration than the current browser
render. Visual quality is therefore **partial** despite the functional preview
and asset integrity checks.
