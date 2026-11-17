# Puddlepaw Raccoon

Status: Goal 02D Art Gate A candidate. Visual acceptance is pending.

## Source and exports

- Editable source: `puddlepaw-raccoon.bbmodel`.
- Original 64 × 64 pixel atlas: `puddlepaw-fur-atlas.png`.
- Three.js runtime export: `puddlepaw-raccoon.glb`.
- Authoring tool: Blockbench Web 5.2.2, Generic Model project.
- Export settings: binary glTF, embedded texture, scale 16, armature and animations enabled.
- Runtime contract: +Y up, +Z forward, ground contact at local Y = 0; articulated nodes `body_pivot`, `head_pivot`, `foreleg_left`, `foreleg_right`, `tail_base`, `tail_tip`, and `hindquarters`.
- Animation clips: `idle`, `sit`, and `greet`.

## Provenance and use

The model and atlas were authored for The Block Laundromat from the user-approved seated Raccoon in `Docs/design/homepage/look-dev/concepts/themes-four-way-buildable.png`. The Puddlepaw turnaround is supplemental reference for side structure and rig placement. Geometry, UV layout, and texture pixels are original work created in Blockbench for this project. No third-party model, UV layout, texture, or extracted game asset was used.

The user's Goal 02D request authorizes using this original asset in this repository. The repository does not declare a general artwork redistribution license; this provenance record does not create one. Runtime packaging includes only the GLB. The editable model and standalone texture remain source files.
