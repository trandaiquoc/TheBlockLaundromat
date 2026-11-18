# Homepage authored asset pipeline

**Current Goal 02E status:** The assembled asset pack is integrated into `/mini-diorama-preview` only; `/` remains the Project Screen at the user's direction. The preview loads `Frontend/source-assets/homepage/models/laundromat/Laundromat.glb` and applies the GLB's Light, Minecraft, Raccoon, and Dark material variants. Production homepage adoption is outside this pass.

| Asset / contract | Source and runtime behavior |
| --- | --- |
| Assembled laundromat | `03-Laundromat/Laundromat.glb` from the supplied Goal-02D ZIP is copied to `models/laundromat/Laundromat.glb`. It contains the washer, board, lantern, and Raccoon. |
| Theme variants | The custom GLTFLoader plugin reads `KHR_materials_variants`; `craft` maps to `Minecraft`, and the other three app themes map to same-named variants. Geometry stays loaded while materials switch. |
| Parsed object names | Three.js sanitizes spaces and punctuation. The runtime binds to `Washer`, `Notice_board`, `Lantern`, `Raccoon`, `ForelegL`, `Head_•_broad_cheek_mask`, and `Tail_•_banded`. |
| Previous Puddlepaw candidate | The three user-modified files under `models/raccoon/` remain untouched and are not loaded by this scene. The assembled GLB already contains the Raccoon. |

The scene runtime owns asynchronous load cancellation, rendering, camera framing, responsive resize, theme changes, picking, reduced motion, context-loss fallback, and resource disposal. DOM controls remain the accessible action surface. The preview remains separate from project persistence and workflow services.

The supplied ZIP contains no `LICENSE`, `COPYING`, `NOTICE`, or provenance text file. Asset rights and attribution are unresolved; this local preview integration does not approve production redistribution.

**Historical status — Goal 02D checkpoint:** Goal 02C concept approval remains the visual source of truth. Goal 02D has created and integrated the original Puddlepaw Raccoon candidate, but Art Gate A is pending user review. Room A production and the four-theme art pass have not started and must wait for that approval.

## Historical Goal 02D source and runtime ownership

| Asset          | Editable source                                                                                                   | Runtime owner                                                                              | Notes                                                                                                                                       |
| -------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Raccoon        | `puddlepaw-raccoon.bbmodel` and `puddlepaw-fur-atlas.png` under `Frontend/source-assets/homepage/models/raccoon/` | `mini-diorama-preview` GLB loader and scene runtime                                        | The current candidate preserves body, head, foreleg, hindquarter, and tail pivots. Do not copy Alex’s Mobs geometry, UV layout, or texture. |
| Washer hero    | Blockbench source only if a procedural shell and drum do not meet the approved silhouette                         | Three.js scene                                                                             | The shell may use one rounded box; author the circular bezel/door only if it needs controlled topology or UVs.                              |
| Project Board  | Four frame cuboids plus a blank board surface, or a small Blockbench asset                                        | Three.js scene plus Angular overlay                                                        | Reserve a stable named anchor on the blank board. Angular DOM owns project names, controls, and focus.                                      |
| Room shell     | Scene builder in the existing homepage renderer                                                                   | Three.js scene                                                                             | One platform, shared tile geometry, two walls, and a simple window. No new scene framework.                                                 |
| Reusable props | Small grouped scene assets or scene-builder functions                                                             | Three.js scene                                                                             | Shelf, towel cubes, pot/leaves, and basket. Avoid unique meshes for basket holes or other tiny repeats.                                     |
| Theme variants | Theme scene configuration                                                                                         | Existing theme service supplies preference; scene applies lighting/material/window presets | Minecraft keeps internal key craft. Keep geometry semantics stable across themes.                                                           |

Angular now copies `models/**/*.glb` into `assets/homepage/runtime`; editable `.bbmodel` and standalone texture sources stay out of the runtime bundle. `check-home-assets.mjs` validates the editable project, matching embedded/source atlas, GLB rig and clip contract, and the built runtime inventory. The loader fetches the candidate from `assets/homepage/runtime/models/raccoon/puddlepaw-raccoon.glb` and owns its loaded scene resources through route teardown.

## Historical Goal 02D Blockbench authoring

1. The current candidate is the original low-poly cuboid model `Puddlepaw Raccoon`. Its charcoal face mask, gray muzzle, body proportions, and tail stripes use the original 64 × 64 pixel atlas.
2. Use intention-revealing node names and place pivots at joints before rigging. Separate static fur markings into the atlas so they do not require extra geometry.
3. Front, three-quarter, and side candidate renders are saved under the ignored `Frontend/.artifacts/goal-02d/raccoon-review/` directory. Keep the source project and source texture beside the runtime export.
4. Author the washer bezel only if the procedural cylinder/ring and rounded shell fail the approved visual gate. Keep the board surface blank.
5. Record the author, source file, texture source, license, export version, and generated runtime filename beside each editable source.

## Historical Goal 02D export and Three.js import notes

Use Blockbench’s glTF or GLB exporter for authored assets. Prefer GLB for a small self-contained character model and its atlas; use glTF with external files only when source inspection and caching make that clearer. The application already depends on Three.js, so import through its GLTFLoader; do not add a separate renderer or asset library.

Use GLTFLoader to load model scenes and AnimationMixer for exported clips. Keep these asset contracts stable:

- node names identify articulated parts and DOM anchor points;
- the model has an agreed local forward axis, unit scale, and ground contact point;
- clip names are stable, such as idle, greet, sit, and walk;
- each clip has one owner and is stopped when the scene host is destroyed;
- the runtime loader does not import project, router, persistence, or editor-domain services.

The current candidate exports `idle`, `sit`, and `greet`; visual and motion acceptance remain pending at Art Gate A. Goal 02C did not include animation production; this candidate work belongs to Goal 02D.

## Historical Goal 02D texture and theme notes

- Use the original 64 × 64 Raccoon atlas and keep the face details legible at the smallest supported viewport.
- Set pixel-art textures to sRGB color space and nearest filtering; verify eye highlights and the mask remain distinct at the smallest supported viewport.
- Keep Project Board text and project thumbnails in Angular DOM. Do not rasterize user project data into a texture or regenerate the board texture when project state changes.
- Keep scene art values in theme presets: key light, ambient fill, window sky/landscape, wall/wood materials, and tile contrast. Theme switching changes presentation only and never project data.
- Reuse shared geometry/materials for repeated tiles and props. Give the scene runtime a clear owner for loaded models, materials, textures, animation mixers, and event listeners; dispose only resources it owns.

## Historical Goal 02D packaging and validation

The Raccoon candidate has been loaded through GLTFLoader in the isolated preview and packaged by the Angular build. Automated asset checks verify its header, embedded atlas, geometry, rig nodes, and clips. Browser checks cover route loading, animation controls, reduced motion, fallback, and repeated mount/unmount. Room anchors and blank-board placement remain to be verified when Room A is authorized after Gate A.

The preview host owns model loading and disposal. Angular owns the page shell and semantic DOM. ProjectScreenWorkflow remains the sole owner of create/open/delete/import/backup operations. The renderer may receive read-only presentation summaries and emit typed intents; it must not mutate persistence or encode project content into pixels.

## Licensing and provenance

- No root `LICENSE`, `COPYING`, or `NOTICE` file was found, and the frontend package does not declare an art license. Do not assume a repository-wide redistribution license for future homepage art.
- Keep every production model and texture original or explicitly licensed for this project. Record the creator, source, license, attribution requirements, and any written grant beside the editable source. If the rights are unknown, record them as unresolved and do not package the asset.
- The Alex’s Mobs and Sketchfab sources are technical/art-direction references only. Do not copy their geometry, UV layout, textures, or exported files into the project. Verify the exact asset license before proposing any third-party runtime asset.
- The generated PNGs in this look-dev package are flattened review concepts, not editable models or runtime textures. The palette SVG is editable. Goal 02D has created original editable `.bbmodel` and texture sources plus a runtime GLB; their provenance and use record is beside the source. The candidate is not yet user-approved at Art Gate A.

## Reference and provenance

- [Blockbench export formats](https://blockbench.net/wiki/guides/export-formats/)
- [Blockbench model rendering](https://blockbench.net/wiki/guides/model-rendering/)
- [Blockbench animation expressions](https://blockbench.net/wiki/guides/animation-expressions/)
- [Three.js GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html)
- [Three.js animation system](https://threejs.org/manual/pages/animation-system.html)
- [Three.js texture documentation](https://threejs.org/docs/pages/Texture.html)
- [Three.js color management](https://threejs.org/manual/pages/color-management.html)
- [Alex’s Mobs Raccoon model source](https://github.com/AlexModGuy/AlexsMobs/blob/1.20/src/main/java/com/github/alexthe666/alexsmobs/client/model/ModelRaccoon.java) and [texture source](https://github.com/AlexModGuy/AlexsMobs/blob/1.20/src/main/resources/assets/alexsmobs/textures/entity/raccoon.png) — inspected as a cuboid/UV reference only; neither file is redistributed in these concepts.

No external dependency was added. The Goal 02D Puddlepaw Blockbench source and standalone atlas are original project files. The Goal 02E assembled GLB came from the user-provided archive; its rights and attribution remain unresolved because the archive has no licensing or provenance note. Runtime packaging includes the assembled scene GLB; the previous editable source and atlas remain unbundled authoring files. Passing automated checks does not approve the art or its redistribution.
