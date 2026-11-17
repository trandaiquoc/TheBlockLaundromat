# Goal 02C look-dev package

**Status: PARTIAL — the user selected the in-scene Raccoon direction; room composition and all four scene themes still need acceptance.**

This package proposes new homepage art direction and scene concepts. It is review material only: no production route, Project workflow, persistence, Editor, dependency, or Mini Diorama code has changed.

## Reference readback

The latest user-supplied room image sets the visual style: chunky Minecraft blocks, richly textured dark oak, gray stone, leaf-block vines, planter greenery, and warm amber lanterns. Keep that cozy cottagecore material language across the room and the surrounding Project Screen UI. Use timber and cream-paper panels with restrained moss-green actions; do not turn the UI into the pastel kawaii style of the Tooplate example.

The [Spatial Diorama ZIP](../../../design/references/2171_spatial_diorama.zip) informs only the scene geometry: a shallow platform, a 5 × 5 square checker floor, two perpendicular walls, and a small set of repeated primitives. The checker tiles here use cream and natural brown/stone colors to match the user's visual reference. Do not carry over the ZIP's lavender/mint palette or its top HUD, object hotspots, and bottom dock.

The room in the user's reference is much denser than the scene should be. Keep its style while simplifying construction to repeated box geometry and a few shared assets: timber beams, square window, short shelf, washer, blank board, lantern, a few plants, and a small Raccoon. The board stays blank so real project data can be rendered in Angular DOM.

The requested live URL returned HTTP 200 and the title “Kawaii Spatial Diorama 3D - Live View”. The browser access host was unavailable, so live interaction and responsive behavior could not be captured. Archive observations come from static inspection of `index.html`, `css/style.css`, `js/app.js`, and `js/diorama.js`; no artwork or implementation from the archive is copied into these concepts.

## Proposed Project Screen

![Project workspace concept with persistent controls outside the 3D scene](concepts/project-screen-spatial-workspace.png)

Keep the user's confirmed new three-column layout: a persistent New Project panel on the left, the 3D room in the center, and Recent Projects on the right. The top bar contains language, theme, and settings controls. The room and outer panels share the same warm Minecraft timber style, but project fields, labels, accessibility, and actions remain semantic Angular DOM.

This generated screen is a visual/layout concept. Names, dates, Minecraft versions, field values, save location, thumbnails, and visible action labels in the mockup are sample artwork, not project data or a revised workflow contract. The production screen must preserve the existing Project Screen behavior, including the current create/import/open/export/delete flows. See [the Project Screen template](../../../../Frontend/src/app/features/projects/project-screen/project-screen.component.html) and [workflow](../../../../Frontend/src/app/features/projects/project-screen/project-screen-workflow.ts).

At narrow widths, keep the app bar and semantic controls in the DOM, reframe the room to a portrait camera, and stack the create form and project list below it. Do not move project names or controls into scene textures.

## Room composition options

### A — Checker stage (recommended)

![Buildable room composition A](concepts/room-checker-stage.png)

The washer and blank board sit across the back corner, with the checker floor open in front. This is the most balanced option for a small viewport. Keep the ivy to a few repeated leaf clusters; represent the plant as a pot plus shared leaf cubes.

### B — Board left, washer right

![Buildable room composition B](concepts/room-board-left-washer-right.png)

The board gets a broad left-wall surface for the Angular overlay, while the washer remains a clear hero prop on the right. The window stays near the corner to preserve the forest view without crowding the board.

### C — Window left, washer center, board right

![Buildable room composition C](concepts/room-window-washer-left-board-right.png)

The window and centered washer make the shop feel lived in; the right-side board remains separate. Keep the Raccoon small enough to sit on the platform without obscuring the washer or floor.

All three concepts use the same core scene kit: one platform, 25 tiles sharing geometry/materials, two walls, a few timber beams, one window, one shelf, towels, one washer, one blank board, a lantern, a few plants, a simple basket, and the Raccoon. Avoid the reference image's fireplace, dining furniture, deep shelf maze, and many unique small props. None of those are needed to retain its visual style.

## Raccoon options

The user preferred the small seated Raccoon in the four-theme room image over the earlier character sheets. The three updated turnarounds now use that low, compact Minecraft voxel style, with gray fur, a strong charcoal eye mask, short muzzle, and floor-resting striped tail. The user-selected in-scene Raccoon remains the art-direction source; the turnarounds expand it into front, three-quarter, side, and greeting/seated views for review.

| Option | Silhouette and face | Rig/build trade-off |
| --- | --- | --- |
| [Puddlepaw](concepts/raccoon-puddlepaw-turnaround.png) | Low seated quadruped; broad charcoal mask; compact body; ringed tail resting along the floor. **User-preferred direction.** | Best match to the chosen in-scene Raccoon; simple head/body and four-limb hierarchy, with a segmented tail. **Recommended.** |
| [Tumble](concepts/raccoon-tumble-turnaround.png) | Low walking quadruped; slightly longer body; raised arched ring tail. | Strong raccoon silhouette beside floor props; locomotion needs more limb motion than the seated direction. |
| [Pebble](concepts/raccoon-pebble-turnaround.png) | Loaf-like seated shape; tucked paws; curled ring tail. | Smallest idle footprint; less suited to walking interaction. |

These are original design explorations, not reproductions of the supplied Raccoon reference or Alex’s Mobs model/texture. Use the same voxel surface language as the room when authoring a production model.

## Four scene themes

![Same compact Minecraft room rendered for Minecraft, Light, Raccoon, and Dark](concepts/themes-four-way-buildable.png)

The room geometry and props stay consistent. These retained references have notably different color treatments; preserve those differences instead of applying one palette to every theme:

| Theme | Reference | Time | Color direction |
| --- | --- | --- | --- |
| Light | [02-light.png](../../references/02-light.png) | Early morning | Bright, airy cream and pale oak, fresh green foliage, and a clear blue-green view. |
| Minecraft | [01-minecraft.png](../../references/01-minecraft.png) | Sunset | Strong orange-gold window light, richer honey oak, and vivid Minecraft greens. |
| Raccoon | [03-raccoon.png](../../references/03-raccoon.png) | Around 6–7 PM | Muted taupe and gray-brown timber, violet-blue dusk view, and distinct amber lamps. |
| Dark | [04-dark.png](../../references/04-dark.png) | Late night | Deep navy-blue shadows and exterior, cyan moonlight at the windows, and restrained amber lights. |

The comparison board keeps one geometry while pushing those four color identities farther apart. The matching [palette source](four-theme-palette.svg) is an editable scene-art proposal, not a change to existing application CSS tokens. Minecraft continues to use the existing internal theme key `craft`.

## Buildability notes

Build the room from a small reusable set. Use shared box geometry for tiles, beams, shelves, towel stacks, and frame parts; use a small shared leaf cluster rather than modeling each vine segment uniquely. The board is a plain surface with a stable DOM placement anchor. Text and project content are never baked into a texture.

The washer and Raccoon are hero assets. The washer shell can stay procedural if its drum reads clearly; author the bezel in Blockbench only if the stepped pixel ring needs more control. Author the Raccoon in Blockbench. Keep walls, floor, window, shelf, towels, plant, lantern, and simple basket procedural or as reusable grouped props. The [asset pipeline](asset-pipeline.md) describes source ownership and export/import contracts.

## Review gate

**PARTIAL.** The user has selected the Raccoon appearance shown in the theme board and prefers that direction to the earlier character sheets. The remaining acceptance gates are:

1. one room composition;
2. all four scene themes.

Do not rebuild or integrate the Mini Diorama from these concepts until the room and themes are accepted. The Project Screen image is an art/layout reference, not an approved production UI implementation.
