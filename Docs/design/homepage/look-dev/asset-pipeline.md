# Goal 02C asset pipeline proposal

This is a pipeline recommendation for a future implementation after visual acceptance. Goal 02C creates concepts only; it does not create Blockbench models, glTF files, production textures, runtime loaders, or animations.

## Source and runtime ownership

| Asset | Editable source | Runtime owner | Notes |
| --- | --- | --- | --- |
| Raccoon | Original Blockbench project and original pixel atlas under Frontend/source-assets/homepage/models/raccoon/ | Route-scoped Three.js scene | Keep pivots for body, head, ears, forelegs, hind legs, tail base, and tail segments. Do not copy Alex’s Mobs geometry, UV layout, or texture. |
| Washer hero | Blockbench source only if a procedural shell and drum do not meet the approved silhouette | Three.js scene | The shell may use one rounded box; author the circular bezel/door only if it needs controlled topology or UVs. |
| Project Board | Four frame cuboids plus a blank board surface, or a small Blockbench asset | Three.js scene plus Angular overlay | Reserve a stable named anchor on the blank board. Angular DOM owns project names, controls, and focus. |
| Room shell | Scene builder in the existing homepage renderer | Three.js scene | One platform, shared tile geometry, two walls, and a simple window. No new scene framework. |
| Reusable props | Small grouped scene assets or scene-builder functions | Three.js scene | Shelf, towel cubes, pot/leaves, and basket. Avoid unique meshes for basket holes or other tiny repeats. |
| Theme variants | Theme scene configuration | Existing theme service supplies preference; scene applies lighting/material/window presets | Minecraft keeps internal key craft. Keep geometry semantics stable across themes. |

The repository currently copies homepage PNGs and scene-manifest.json into the runtime asset directory. It does not currently copy GLB assets. If a later approved implementation adopts authored models, add a focused model asset pattern to Frontend/angular.json and extend check-home-assets.mjs to validate the packaged GLB files. Keep editable Blockbench sources out of the runtime bundle.

## Blockbench authoring

1. Create an original low-poly cuboid model from the selected Raccoon sheet. Author the charcoal face mask, gray muzzle, body proportions, and tail stripes as original UV regions.
2. Use intention-revealing node names and place pivots at joints before rigging. Separate static fur markings into the atlas so they do not require extra geometry.
3. Build and inspect front, three-quarter, and side views before making animation clips. Keep the source project and source texture with the model.
4. Author the washer bezel only if the procedural cylinder/ring and rounded shell fail the approved visual gate. Keep the board surface blank.
5. Record the author, source file, texture source, license, export version, and generated runtime filename beside each editable source.

## Export and Three.js import

Use Blockbench’s glTF or GLB exporter for authored assets. Prefer GLB for a small self-contained character model and its atlas; use glTF with external files only when source inspection and caching make that clearer. The application already depends on Three.js, so import through its GLTFLoader; do not add a separate renderer or asset library.

Use GLTFLoader to load model scenes and AnimationMixer for exported clips. Keep these asset contracts stable:

- node names identify articulated parts and DOM anchor points;
- the model has an agreed local forward axis, unit scale, and ground contact point;
- clip names are stable, such as idle, greet, sit, and walk;
- each clip has one owner and is stopped when the scene host is destroyed;
- the runtime loader does not import project, router, persistence, or editor-domain services.

Actual clip set and dimensions remain subject to the accepted character and motion scope. This document does not add animation work to Goal 02C.

## Textures and theme data

- Use an original small pixel atlas for the Raccoon, initially testing 64 × 64 and increasing only when the approved face cannot remain legible.
- Set pixel-art textures to sRGB color space and nearest filtering; verify eye highlights and the mask remain distinct at the smallest supported viewport.
- Keep Project Board text and project thumbnails in Angular DOM. Do not rasterize user project data into a texture or regenerate the board texture when project state changes.
- Keep scene art values in theme presets: key light, ambient fill, window sky/landscape, wall/wood materials, and tile contrast. Theme switching changes presentation only and never project data.
- Reuse shared geometry/materials for repeated tiles and props. Give the scene runtime a clear owner for loaded models, materials, textures, animation mixers, and event listeners; dispose only resources it owns.

## Packaging and validation

After the art gate, validate each exported GLB by loading it through GLTFLoader in an isolated preview, checking node names, scale, ground contact, expected clips, texture filtering, and the blank board anchor. Record file sizes and inspect the packaged output from the Angular build. Extend the existing homepage asset check instead of creating a second asset-pipeline test system.

The preview host owns model loading and disposal. Angular owns the page shell and semantic DOM. ProjectScreenWorkflow remains the sole owner of create/open/delete/import/backup operations. The renderer may receive read-only presentation summaries and emit typed intents; it must not mutate persistence or encode project content into pixels.

## Reference and provenance

- [Blockbench export formats](https://blockbench.net/wiki/guides/export-formats/)
- [Blockbench model rendering](https://blockbench.net/wiki/guides/model-rendering/)
- [Blockbench animation expressions](https://blockbench.net/wiki/guides/animation-expressions/)
- [Three.js GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html)
- [Three.js animation system](https://threejs.org/manual/pages/animation-system.html)
- [Three.js texture documentation](https://threejs.org/docs/pages/Texture.html)
- [Alex’s Mobs Raccoon model source](https://github.com/AlexModGuy/AlexsMobs/blob/1.20/src/main/java/com/github/alexthe666/alexsmobs/client/model/ModelRaccoon.java) and [texture source](https://github.com/AlexModGuy/AlexsMobs/blob/1.20/src/main/resources/assets/alexsmobs/textures/entity/raccoon.png) — inspected as a cuboid/UV reference only; neither file is redistributed in these concepts.

No external dependency is proposed. The Blockbench authoring source and generated concept images have different ownership from runtime assets; the latter are not approved or packaged by this proposal.
