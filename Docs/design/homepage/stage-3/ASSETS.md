# Stage 3 spatial assets

## Input audit, 19 November 2026

| Decision | Source and treatment |
| --- | --- |
| KEEP | Detachable window and its miniature landscape, flower boxes, fern, hanging leaves, towel folds and lantern housing from the supplied Goal 02D pack. Reuse the packed pixel materials. |
| MODIFY | Adapt foliage and lantern hierarchies for secondary motion. Use the 02D gray character's face and voxel construction as starting geometry. Rebuild the tail, body profile and limbs for the approved A/B poses. |
| CREATE | Eight-edge shell and clipped checker tiles, central niche, washer with offset porthole and independent controls, flat project board, rectilinear left shelving, hollow hearth and vertical chimney, two role-specific character rigs and spatial anchors. |
| REMOVE from the new scene | Square plinth, perpendicular stage walls, decorative old board, old washer face, old single character and prototype GLBs. The existing repo assets remain available to their current consumers. |

The user supplied the prior 02D Blender/GLB pack and six approved Stage 2 images. The images serve as visual references. Stage 3 geometry additions, pixel-surfaced masonry and rigid joint hierarchies were authored in Blender for this handoff. No concept screenshot is mapped onto the room, paper or board. The independent ownership and redistribution rights of the supplied assets and concept references have not been verified. This package does not grant a third-party license.

## Working files

| Location | Contents |
| --- | --- |
| Room/Octagonal-Laundromat | Assembled eight-sided room, both characters, interaction anchors and motion pivots. The Blender scene selector offers Minecraft, Light, Raccoon and Dark. The GLB uses KHR_materials_variants on one mesh set. The studio lighting is in the Blender source. |
| Characters/Courier and Characters/Guide | Separate full-scale character sources and exports. Courier is posed to read the detachable BlankNote. Guide sits with both front paws down. Characters/UV-Verification.csv contains per-mesh results for the original models, assembled room and loose parts. |
| Props | 37 individually editable modules, each with its own local origin, editable Blender scene and GLB. Identical towel and lantern instances reuse their corresponding module. |
| Parts | 259 individually editable component models. The 268 placement records in index.json identify the original object and provide Blender world transforms. |
| Parts/Detail-Kit | 23 finer reusable elements including individual checker tiles, blossoms, a petal, an ivy leaf, stems, window mullions, a lantern pane, a chain link, an arch keystone and a hollow flue course. detail-kit.json identifies their source placements. These records sample portions of the existing assemblies. |
| Renders | Four studio-lit theme images, four orthographic views per character, three room directions, three aspect-ratio checks and a roofless overhead view. Cabinet-Detail, Fireplace-Detail, Niche-Detail and Courier-In-Room are close-up renders of the exported GLB. The cabinet inspection view hides the foreground planter. The fireplace view hides the guide and wash tub group. The Courier inspection view hides the foreground railing. These visibility choices apply to the close-up renders. Stage3-Themes and Stage3-Raccoons are contact sheets. Raccoon-Faces shows both brow markings in the character studio lighting. |

All mesh coordinates use metres. Blender is Z-up and a character's local forward is −Y. The GLBs use the standard glTF Y-up axis with forward +Z for these characters. Independent props are exported at their local origin. The matrices in the Parts catalogs use Blender coordinates and row-major storage.

## UV and animation controls

| Asset | UV channels | Motion and attachment controls |
| --- | --- | --- |
| Courier and Guide | UV0.Paint is a shared paint layout per character, in the 0–1 tile. The default gray coat uses material colors. | Each role has a ground Root, a Breath pivot, a Head pivot, a gaze anchor, and bilateral hip, hind paw, shoulder, elbow and front paw pivots. Rotate the rigid hierarchy for gait, greeting or grooming. Each single-piece tail has a root pivot and three weighted bones named Tail.Base, Tail.Middle and Tail.Tip. |
| Courier note | Standalone mesh with its own UV0.Paint layout. | Parent the BlankNote root to Courier.Anchor.Note with an identity local transform. The socket and both arm chains follow Courier.Pivot.OfferNote. The Blender and GLB assembly already include this attachment. |
| Room modules and loose environmental parts | UV0.Surface retains the tiled pixel finish. UV1.Paint is a separate normalized layout for painting each module. Extracted parts retain their module's UV coordinates and texture scale. | The washer exposes DoorHinge, DrumSpin and separate left/right dial pivots. The glass and its Preview anchor follow the hinge. Open and Delete remain fixed on the front panel. Lamp panes, appliance status and fire have distinct material slots. |
| Vegetation, lamps and hearth | The same two environment UV channels. | Pivot.*.Sway moves attached foliage. Pivot.*.Swing rotates each suspended lantern at its hanger. Pivot.*.Flicker targets the luminous part. Pivot.Fire.FlameBase controls the ember assembly. Anchor.SmokeEmitter sits above the open flue. |

Anchor.Board.Center and its four named corners delimit the blank board viewport. Anchor.Washer.Preview, Open and Delete are separate targets. Each character has floor anchors for its idle position, two waypoints and arrival. Camera targets cover overview, portrait, board, washer and recenter. The sources contain rest poses and motion controls. Animation clips and application behavior belong to the next stage.

## Measurements and visual decisions

The regular octagonal foundation measures 8.00 m between opposite faces in both directions. Its eight sides measure 3.314 m each and meet at 135 degrees. A two-color mitred floor border follows the entire perimeter. The three rear facets carry the board, recessed washer and window. Low front facets keep the entrance open. The washer is 2.25 m wide, 1.018 m deep and 1.68 m high. Its central niche has 1.00 m returns and a 2.615 m clear opening. The left cabinet shelves are level with parallel gables. The right hearth transitions from the open firebox through a hollow hood into a straight vertical stack. Its cap has a through-opening.

Both characters use the same 0.89 root scale. In the seated poses, Courier measures 0.978 m to its tilted ear and Guide measures 0.890 m. These are 58% and 53% of washer height. The concept-scale staging keeps the held note visible. For the written Stage 2 starting range of 19–25%, use a uniform scale of 0.38 on each character Root.

## Verification

Blender 4.3.2 opened the 322 native files and imported the 322 corresponding GLBs. All exported mesh primitives carry finite UV coordinates, and each has a paint layout with positive area. The room uses 253 mesh datablocks shared by its four Blender scenes. Environment GLBs embed their texture images. Character GLBs retain skin weights, and their tails have a single closed connected surface. Rotating the tip bone in the source and the reimported GLB deforms the tip while the root stays fixed.

Both Courier palms intersect the paper at its side edges in the source and the imported GLB. The paper clears the muzzle and nose. The exported Courier offer control moved the socket and both gripping paws. In the room, it also moved the mounted paper. Rotating a Guide shoulder moved its front paw. Rotation probes also moved the washer door, drum, both dials, ivy, lantern and embers. Five vertical ray checks cleared the complete flue. Each of the two floor routes cleared the fixed room geometry at 33 sampled positions. The minimum lateral separation between the route envelopes was 1.93 m.

Front, three-quarter and side verification renders of the room and all eight character views were made from reimported GLBs. The four theme previews were rendered in their corresponding Blender scenes. All four share the same 253 mesh datablocks and the same assembled object transforms. The delivery contains 282 loose detail models, 37 reusable prop modules, two characters and one assembly.

## Shelf dressing and revised pose

The left cabinet now holds a woven linen basket, two individual rolled towels, soap cartons, a glazed pitcher, two different bottles, a tin, a bound ledger and a wrapped bar of soap. The washer shelf adds a cobalt bottle, a sage tin and a bristle brush. Two hanging towels use separate sway pivots on the peg rail. The oak wash tub, its hoop bands, the ribbed washboard and its loose soap form a separate floor grouping. Each of the 21 added props is available under Props with an editable source and a GLB. Smaller components are under Parts.

## Reading pose and fur

Courier holds a blank 504 × 411 mm sheet at full character scale. Both shoulders, forearms and paws have more volume. The elbows bend beside the ribcage. The sheet sits ahead of the chest and its upper edge tilts outward by 31°. The neck pitches forward and the local negative Z axis of Courier.Anchor.Gaze hits the upper half of the sheet. The paired fingertips curl around the side edges. The muzzle and the nose clear the paper. The seated hind legs and the continuous, weighted tail retain their earlier form. Both characters use the same muted warm gray brow marking, with a base material of sRGB #A29790.

The paper is stored in Props/BlankNote. Character files carry the empty attachment socket. In the assembled room the sheet is a separate object and can be removed or swapped. The Courier turnaround renders show the standalone prop attached at the socket.

## Board and shelf fit

The board frame spans 2.95 × 2.64 m on a 3.314 m diagonal facet. Both trim widths and all four corner pegs retain their original cross sections. The usable rectangle between the board anchors measures 2.586 × 2.270 m. All 169 sample rays from the default perspective camera reached the blank board surface in the Blender file and the imported GLB. The shelf and its contents sit against the adjoining straight wall. The left planter sits inside the low diagonal wall. The right hearth fits beside the window and has a clear vertical flue.

## Mesh-level UV verification

Courier has 33 meshes and 20,536 triangles. Guide has 21 meshes and 21,728 triangles. Each has one paint atlas across all its meshes, including the bevels. Tests checked finite coordinates, 0–1 bounds, triangle area and positive-area triangle overlap, including overlap between meshes. Both characters passed in their source files, GLBs, room assembly and loose component files. The paper passed in both independent files and the assembly. Characters/UV-Verification.csv records the result for each mesh and representation. Renders/Raccoon-UV.jpg shows both source atlases grouped by body part.

A separate export-wide scan found finite surface coordinates and a usable paint layout in every material primitive. Some bevel triangles on environmental props have zero area in their secondary paint channel. Their primary tiled finish is retained.
