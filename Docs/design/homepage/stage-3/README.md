# Stage 3 production asset handoff

This directory preserves the documentation and renders supplied in
`Stage3-Production (1).zip`. The original archive was 49,014,163 bytes with
SHA-256 `38649a9593f9c090fb40a63bd1d21e3a0f65fae0a4722f8fae3924532c09d83d`.
The archive itself is not stored; [archive-inventory.csv](archive-inventory.csv)
records all 676 entries, their repository destination, byte size, and SHA-256.
The inventory is a generated record of that supplied pack, not an application
runtime contract.

## Stored contents

| Files                                                                                          | Location                                                                         | Use                                                                                       |
| ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `ASSETS.md`, `Parts/index.json`, `Parts/detail-kit.json`, and `Characters/UV-Verification.csv` | This directory                                                                   | Asset specification, Blender placement transforms, component catalog, and UV verification |
| 27 JPGs under `Renders/` plus `Preview.jpg`                                                    | This directory                                                                   | Supplied room, character, theme, and detail renders                                       |
| 322 `.blend` sources and 322 `.glb` exports                                                    | `Frontend/source-assets/homepage/models/`                                        | Editable production source and loose/exported modules                                     |
| `Room/Octagonal-Laundromat.glb`                                                                | `Frontend/source-assets/homepage/models/Room/` and the Angular runtime allowlist | The single assembled Stage 3 scene used by `/mini-diorama-preview`                        |

The archive paths remain intact below their respective storage roots. Catalog
paths such as `Parts/index.json` are relative to
`Frontend/source-assets/homepage/models/`; their transforms use Blender's
Z-up coordinates and row-major matrices. The complete assembled scene is
glTF Y-up. Its two characters are already included in the room GLB, which has
four `KHR_materials_variants` and no animation clips.

Angular copies only the assembled room GLB into
`assets/homepage/runtime/models/Room/`. Loose exports, Blender files, renders,
catalogs, and specifications stay out of the production bundle. The earlier
assembled laundromat GLB remains packaged for the separate homepage
integration-preview consumer; it is not loaded by the Stage 3 route.

The supplied pack contains no license or provenance notice. Its authorship,
redistribution rights, and attribution requirements remain unverified.
