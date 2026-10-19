# Homepage Source Asset Inventory

**Status:** extraction inventory; pixel bounds are recorded in the asset
manifest when each mask is measured. No coordinates below are estimates.

All four approved references are 1672 × 941 and remain immutable sources:

| Theme     | Source                                    |
| --------- | ----------------------------------------- |
| Minecraft | `Docs/design/references/01-minecraft.png` |
| Light     | `Docs/design/references/02-light.png`     |
| Raccoon   | `Docs/design/references/03-raccoon.png`   |
| Dark      | `Docs/design/references/04-dark.png`      |

## Scene and asset groups

| ID                              | Position in source                                              | Theme coverage                                           | Static classification and target owner                                                        | Existing evidence / required work                                                                                                                                                                                                                  |
| ------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `exterior-panorama`             | Outdoor view through the left entrance and upper-right window   | Four distinct source views                               | One panorama per theme, behind the room                                                       | Minecraft now isolates three source-pixel groups on the exact 1672 × 941 canvas. It does not synthesize unseen scenery. The remaining themes still share the old panorama and need source-aligned extraction.                                      |
| `room-shell`                    | Ceiling, walls, fixed architecture and floor around all objects | Four independent compositions                            | Theme-specific room artwork with transparent exterior openings                                | Minecraft now uses a complementary room layer whose opening pixels are transparent; baked furniture, UI, and characters still need extraction. Runtime uses `ref4/scene-light.jpg` for the other themes, with mismatched proportions and geometry. |
| `left-architecture-and-shelves` | Left entrance, awning, door, shelving and adjacent wall         | Four themes                                              | Static grouped architecture/decor                                                             | Preserve awning, door hardware, shelves, bottles, folded towels, plants, hanging grass block, creeper cube, sign and contact shadows. Extract only when independent depth requires it.                                                             |
| `ceiling-lights-and-vines`      | Upper ceiling and three hanging light areas                     | Four themes                                              | Static lamp/plant groups plus theme lighting                                                  | Lamp bodies, cords, vines and ceiling shadows must retain their source geometry; emission is a separate layer where needed. Dark lamps are nearly unlit.                                                                                           |
| `wall-logo`                     | Upper-center wall above the washer                              | Four themes                                              | Extracted logo/sign plus mounting and light layers                                            | Craft keeps the logo baked in the full reference; other themes overlay the official SVG. Extract the source presentation, preserve the official artwork and build only its mounting/light treatment.                                               |
| `washer`                        | Central lower-middle                                            | Four theme-specific machines                             | Extracted body, controls, drum/glass and contact shadow; functional controls remain DOM       | Existing `ref4/washer-*.webp` assets do not establish source-pixel fidelity; the inspected Light PNG has extraction residue. Extract from each matching reference, remove its baked note/buttons, and reconstruct only occluded portions.          |
| `washer-preview-window`         | Circular washer door                                            | Four theme-specific masks and highlights                 | Clean drum surface, circular mask, glass/highlight layers                                     | Every source contains a sample structure. Craft now mounts a dark-grid runtime fallback over the sample even with no selected project; this is not a clean static drum extraction. Other themes and real populated preview remain pending.         |
| `washer-project-plate`          | Angled display at upper-left of washer face                     | Four themes                                              | Source plate asset plus real DOM project data                                                 | Source contains a sample project name and details. Preserve only the plate/pencil artwork; render selected project metadata from live data.                                                                                                        |
| `project-board`                 | Mid-right wall                                                  | Four theme-specific boards                               | Extracted frame, clean inner surface and grouped greenery                                     | Existing `board-light.webp` is shared by Light, Raccoon and Dark despite distinct source materials; inspected PNG has extraction residue. Reconstruct behind baked controls/cards and retain board bolts, wood, leaves and grass details.          |
| `project-card-template`         | Board interior                                                  | Four theme-specific card styles if they differ in source | Source-derived card template with real thumbnail/title; New Project remains a real DOM button | The Craft source crop is runtime-wired; baked project names/thumbnails and the source New Project tile still require complete scene cleanup. Non-empty preview alignment remains unverified.                                                       |
| `raccoon-washer`                | Lower-left, overlapping washer and floor                        | Four theme-specific source poses                         | Extracted character with contact shadow; animation parts later                                | Existing state poses are not the source poses and use one generic asset set. Extract the approved pose first; do not animate before static validation.                                                                                             |
| `raccoon-note`                  | Lower-right, overlapping board and floor                        | Four theme-specific source poses                         | Extracted character, paper and pencil groups                                                  | Existing shared map mascot does not preserve all four source variations. Separate only where animation/occlusion requires it.                                                                                                                      |
| `foreground-props`              | Lower edge and overlaps with washer/characters                  | Four theme-specific grouped props                        | Basket/laundry, stool, blocks, rug, bench, mug, lanterns and small plants                     | Existing `laundry-foreground.webp` is a shared cutout with visible edge residue and does not match every reference. Group by actual overlap, not by arbitrary one-file-per-object splitting.                                                       |
| `global-controls`               | Top-right and bottom-left                                       | Shared functional UI                                     | Angular DOM controls/account status                                                           | The source images bake language/theme/settings controls and a profile/account widget. Remove these from static artwork; keep the real app controls in HTML.                                                                                        |
| `project-board-controls`        | Board header and card grid                                      | Shared functional UI on theme-specific artwork           | Angular title/search/sort/create/list/actions                                                 | Craft baked header labels/icons are source-cleaned and the live controls are shown over the preserved frames. Other baked cards, sample content, and theme-specific controls still require source-derived cleanup.                                 |

## Current ownership audit

- `asset-manifest.json` records the Minecraft canvas and the measured polygons
  used by `Frontend/tools/project-screen-assets/extract-minecraft-exterior.ps1`.
  The script splits the immutable source pixels and checks every pixel after
  recomposition before accepting the pair.
- `ProjectScreenSceneComponent` owns scene-layer selection. Its current asset
  registry shares the Light room, one board, one exterior panorama and one
  right mascot across multiple themes; the references contradict those sharing
  assumptions.
- `ProjectScreenComponent` owns real project workflows and positions DOM
  controls over the scene. It currently overlays live controls on top of source
  pixels that still contain fake controls and sample project content.
- `Frontend/public/assets/project-screen/layers/ref4/` contains the prior
  layered scene, washer, board and mascot masters. Their dimensions and visible
  extraction edges do not match the approved 1672 × 941 coordinate system; they
  are not authoritative final assets without per-file source comparison.
- `layers/exterior-*.webp`, `layers/exterior-panorama.jpg`,
  `scenes/laundromat-*.webp` and `raccoon-map-reader*.png` currently have no
  runtime consumer. Their retention or removal is deferred until source and
  manifest comparison proves they are obsolete.
- The source references remain byte-for-byte unchanged. Temporary crops,
  masks and composite checks belong under the ignored local artifact directory;
  final runtime images and measured provenance belong under
  `Frontend/public/assets/project-screen/` and the asset manifest.

## Extraction order

1. Minecraft exterior and clean room shell, including every visible opening.
2. Minecraft original major-object cutouts and reconstructed hidden surfaces.
3. Pixel-aligned static Minecraft recomposition and visual comparison.
4. Repeat the same measured pipeline for Light, Raccoon and Dark.
5. Remove source-baked UI and integrate existing live Angular controls.
6. Validate the real washer preview, then add motion only after all four static
   scenes pass.
