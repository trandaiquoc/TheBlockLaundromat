# Production art direction — Phase 2 lock

Version: `room-direction-v1`. Status: **LOCKED FOR ASSET PRODUCTION**, reconciled with dual-approved desktop v2 and portrait v7 in the [catalog](assets/catalog.json). This specification approves art direction only; Phase 3 masters and Phase 4 assembled Figma remain separate gates.

## Shared drawing grammar

Create an original raccoon-led illustrated room using the verified reference group in README. Silhouettes are rounded and compact; the head is roughly half the standing body height, with round ears, broad cream cheek mask, warm-brown oval eye patches, simple paws and a chunky ringed tail. Keep both feet/paw contacts on one support plane. Do not copy the references' string, sword, costume or sleeping composition. Main scene mascot stands to the washer's right, facing left in three-quarter view so gaze can reach the door; a second scene mascot is unnecessary.

Use soft dark warm-brown contours, slightly irregular rather than geometric vector strokes. At 1672-wide reference display: silhouette contours about 3–5 px, internal marks 1–3 px, no black cutout edge or white sticker border. Furniture contours use the same weight hierarchy. Matte diffuse form shading with two or three broad tonal levels, restrained paper-like grain, no photographic metal, hard plastic CGI or extreme glossy mascot eyes. Metal enamel is communicated by cool sage/cream fields and local highlights; wood by sparse broad grain strokes, not high-frequency photoreal texture.

Retain the original brand unchanged: `Frontend/public/assets/brand/the-block-laundromat-logo.svg` contains the clean 1774×887 PNG. SVG SHA-256 `7c4d64d5ed5612724bab359a1610163355145ec484412045ee17d62072838b5a`. Do not use old room `assets/light/logo.png` as the final logo: direct visual inspection found wall/ceiling/lamp fragments still present despite partial alpha. Do not generate a replacement. Place the unchanged brand on the reserved architectural wall zone; preserve aspect ratio and identity. Logo is the deliberate more saturated brand accent, not a reason to make the rest of the room hyperreal.

## Camera, scale and lighting

Near-frontal 2.5D interior, mild downward view (visual target approximately 10–15 degrees), upright verticals. Back-wall UI plane is nearly screen parallel. Floor planks and architecture imply depth without wide-angle distortion. Furniture reveals a narrow top plane and one side with the same vanishing logic; never mix isometric cabinet, flat-front board and top-down pot. Camera numbers are production guidance, not a claim that a generated bitmap encodes a physical camera.

Room has three depth groups: exterior garden/town through openings; wall/beams/shelves/board/washer activity plane; floor/contact shadows/cropped near-edge foliage and bench. In the actual accepted desktop v2, the rear floor/threshold is around y680–740 and the floor extends to y941; this supersedes the earlier y590–630 proposal. Every object has a support, contact and consistent cast-shadow direction. Board is secured to structural posts/back wall and ledge, with support visible to floor; never an unrelated floating panel.

Light theme: upper-left warm daylight through left opening, shadow projection down-right; pendants provide weak warm fill. Mascot, washer, board, plant and architecture share that key/fill. Keep local door glow separate for later interaction; do not bake a permanently strong glow or mascot shadow into the environment. Contact shadows under feet/pot/machine are separately controlled where motion/theme requires it.

| Material / role    | Light target color    | Use                                          |
| ------------------ | --------------------- | -------------------------------------------- |
| Contour/deep wood  | `#4B3C31`             | Main drawn edges, never pure black           |
| Plaster / paper UI | `#F2E5CF` / `#FFF6E5` | Warm room and clean readable board surface   |
| Oak mid / lit      | `#B98752` / `#D8AE72` | Beam, frame, ledge, floor                    |
| Sage enamel        | `#A9B7A0`             | Washer body with cream highlights            |
| Olive foliage      | `#71815B`             | Plant midtone, lighter/darker variants local |
| Terracotta         | `#B77853`             | Grounded pot and small warm accents          |
| Door/glass accent  | `#6DAEB1`             | Cool focal inset, controlled reflections     |
| Readable UI ink    | `#342C26`             | Text; contrast checked in Phase 6/9          |

These are target swatches for production, not a filter to apply over the whole image. Slight drawn variation is expected; UI tokens must remain readable and each theme later changes materials/exterior/light deliberately.

## Desktop composition contract

Reference design plane `1672×941`. Coordinates below are production slots reconciled with actual accepted desktop v2, superseding the initial prompt boxes. They are not permission to distort artwork. Tolerance approximately ±30–50 px if function and hierarchy survive; final measured anchors come from assembled Figma Phase 8. Recheck contacts and board interior against isolated masters in Phase 4. The original room establishes density/depth, while new assets may differ in shape and style.

| Element               | Reference slot x/y/w/h               | Support / functional constraint                                       |
| --------------------- | ------------------------------------ | --------------------------------------------------------------------- |
| Ceiling / beams       | 0/0/1672/150                         | Real ceiling structure framing room                                   |
| Left exterior opening | 20/180/240/550                       | Receding garden/town, threshold meets floor                           |
| Shelving              | 255/100/180/580                      | Fixed to wall, behind activity cluster                                |
| Unchanged brand       | 480/100/470/235                      | Quiet wall zone; clean 2:1 brand fits clear of lamp/washer            |
| Washer                | 450/340/530/460                      | Feet near y800; clean door target near (680,600)                      |
| Mascot                | 850/510/230/310                      | Feet near y815; body slot excludes tail, which extends to about x1160 |
| Board structure       | 1000/250/640/500                     | Supports to y840, nearly screen-parallel face                         |
| Board inner UI        | 1040/305/560/355                     | Unoccluded, low texture, enough for real search/sort/list/actions     |
| Left plant            | 120/650/190/220                      | Pot contact near y870; foliage movement pivot at stem/pot neck        |
| Peripheral foreground | Outside board/door/ticket safe zones | Cropped edges create near depth without blocking tasks                |

Keep washer-door circle and board face blank in artwork. Board content is not drawn projects. At full desktop, use a scrollable compact 2×2 card area or one-column rows within roughly 560×355; reserve about 90–100 px for title/search/sort. At smaller desktops use one-column compact rows and fewer simultaneous results. Arbitrary project count scrolls inside the panel. Open/Delete can occupy the washer action region, Create/Import use ticket/menu UI; forms do not have to fit on the board. Title/search/sort/selection/actions are real UI. Selected preview comes from saved project summary, never by starting Editor. Forms use spacious viewport dialogs, not miniaturized artwork controls.

## Responsive and portrait composition

Desktop scene objects scale uniformly; UI text/targets use CSS minimums and do not blindly inherit art scale. Primary controls at least 44×44 CSS px, normal reading text around 14–16 px; test long EN/VI strings and keyboard focus. At 1280×720, preserve a board inner area about 429×272 and use one-column rows about 72–80 px high (two visible after header/search/sort), rather than shrink type below readability. At 1366×768 and 1440×900 adapt peripheral crop/scene offset, never crop task zones. At 21:9 extend exterior/wall/floor at the sides using matching environment artwork; do not stretch the 16:9 image or separate the main interaction cluster excessively.

Portrait uses a new vertical room arrangement, not desktop scaling. Approved native canvas is 730×2155: uniform scale to390 gives390×1151.3 CSS px, never stretch to an exact1150 height. Washer and raccoon stand together on ONE supported oak workstation top; the project board is its vertical front facade. Posts descend to ONE real bottom floor. Do not reintroduce stacked floor/rug planes. Exterior opening, shelving, ceiling and peripheral foreground retain continuous architecture and depth.

The brand sits on an oak-framed cream plaque with two real hangers attached to the ceiling beam. At390, its actual clear face is approximately245–255×145–150 CSS px. Center the unchanged2:1 brand at200×100, leaving about22–27px horizontal and22–25px vertical margins. These actual accepted bounds supersede the conservative260px face-width request; do not claim that request was met literally. At320, uniform art scaling alone would reduce the logo to about164×82; Phase4/6 must prove readability and adjust the architectural plaque/layout if needed. The390 concept PASS does not prove narrow-screen brand/UI acceptance. Keep global controls reachable above the activity cluster, using real44px targets rather than scaling them with the bitmap.

| Portrait region         | 390-wide intent                                                                     | 320-wide intent                                                          |
| ----------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Global controls         | Two compact rows with 44 px targets; not a dashboard header                         | Wrap predictably, no horizontal overflow                                 |
| Brand mounting          | Unchanged200×100 centered on supported plaque                                       | Preserve2:1; prove readable fit in Phase4/6, adapt plaque if required    |
| Activity vignette       | Washer roughly 210–230 wide; mascot roughly 90–110                                  | Washer about 180–195; mascot about 85–95                                 |
| Board readable interior | Actual concept approximately330–340 wide; clean face about290 high                  | Approximately272+ wide; reflow height/rows rather than shrinking targets |
| Project list            | One column, compact row thumbnails, 2–3 visible rows and scroll/flow as appropriate | One column with wrapping names; no tiny 2-column cards                   |
| Forms                   | Viewport dialog/sheet with keyboard focus and scroll                                | Same, respecting narrow width and on-screen keyboard                     |

Viewport acceptance remains 1672×941, 1440×900, 1366×768, 1280×720, 21:9, 390×844 and 320×700 in ordinary browser chrome, no F11 requirement. Portrait reference image may depict full scrollable composition; rendered viewport verification later must inspect both top and lower board.

## Layering and interaction boundary

Artwork target concepts are reference only; runtime must retain separate environment/interactive objects. One possible stratum contract for Phase 8/9: Pixi world draws exterior → architecture → floor/shadows → washer body → masked saved thumbnail → door rim/reflection → mascot body/parts → peripheral foreground. Angular UI is above the world with a shared anchor mapping; no decoration may cross board text, washer controls or ticket label regions. Dialogs/popovers sit above both. Do not assume DOM can interleave arbitrary sprite layers in one canvas. Any finger/occlusion crossing a ticket is confined outside the DOM label/hit rectangle or explicitly represented in its anchor/mask contract.

Selection is transient UI intent; latest selected project replaces previous gaze target. Create immediately exposes two real localized keyboard targets while the mascot presents blank ticket artwork. Opening dialogs/actions never waits for animation. Motion completion never persists project data. Reduced motion resolves directly to usable final states. Pause unneeded hidden-page updates; release textures/listeners/resources on route exit or theme replacement.

## Asset and motion inventory

All IDs below are planned semantic roles; versions/approved files are assigned only after actual Generate–Check reviews. No row is an approved production asset yet.

| Group / planned ID                            | Production requirement                                                                                                                     | Decomposition / animation                                                                                                             |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Environment `room-shell`                      | Opaque room architecture/wall/floor with exterior openings; desktop and portrait-compatible coverage, no UI or logo, no baked main objects | Static composite is acceptable; provide extension edges for ultrawide, no need for hundreds of fragments                              |
| Environment `exterior`                        | Garden/town depth through windows/door, compatible with shell/camera                                                                       | Theme-specific light/time/material, parallax optional only if specified later                                                         |
| Environment `shelf-set`                       | Grounded/mounted shelf, folded towels/jars/small Minecraft cues                                                                            | Static peripheral set may be grouped; no isolated decoration patchwork                                                                |
| Environment `brand-plaque`                    | Portrait oak frame/cream face, two visible ceiling hangers and attachment hardware; actual accepted clear face noted above                 | Static supported cluster; record contact/cast shadow and logo layer relationship, no generated brand or baked UI                      |
| Interactive `washer-master`                   | Full sage enamel object, complete hidden edges, clean round preview inset, leg/contact geometry                                            | Body/back, door/rim/handle, glass/reflection, circular preview mask, local light/shadow separate                                      |
| Interactive `raccoon-master`                  | Original standing three-quarter-left mascot, repeatable identity/proportions, stable two-foot base                                         | Torso/belly breathing pivot above feet; head/eye-open/eye-closed; gaze head/eye variants; arms/paws for tickets; tail; contact shadow |
| UI surface `project-board`                    | Clean almost-front plane, frame/post/ledge supports; no painted labels/cards/data                                                          | Face and frame separated if occlusion/UI requires, wide and portrait variants share materials                                         |
| Decorative/motion `plant-master`              | Complete pot/stem/leaf silhouette, same contour/light/camera                                                                               | Pot + trunk/base fixed; grouped leaves with pivots at stem attachments, no drifting base                                              |
| Interactive `ticket-create` / `ticket-import` | Blank readable paper tickets, no text/icons; hand grips/hidden rear edges                                                                  | Two independent planes, arms/paws in front at edges, DOM label/hit bounds and motion anchors                                          |
| Lighting `contact-shadows`                    | Soft local feet/pot/washer/board supports, light from upper-left                                                                           | Separate alpha layers when object moves; no double shadow baked into shell                                                            |
| Lighting `door-glow` / `raccoon-bounce`       | Controlled focal glow and corresponding face/paw/floor response                                                                            | Alpha masks/tints, theme-specific intensity; no claim of full physical 3D lighting                                                    |
| Foreground `bench-edge` / `foliage-edge`      | Deliberate near-depth occlusion only at safe perimeter                                                                                     | Do not overlap active board/ticket/door UI bounds                                                                                     |
| Brand `brand-original`                        | Existing clean brand source unchanged                                                                                                      | Static, no redraw, uniform scaling                                                                                                    |
| Angular UI surfaces                           | Project data, controls, state labels, forms, settings/account                                                                              | Native editable Figma text/components then real Angular DOM, EN/VI, full keyboard and errors                                          |

Phase 3 builds the five foundational roles (mascot, washer, board, plant, sufficient environment). Phase 4 must demonstrate the assembled room with UI sizing. Phase 5 fills remaining environment and the actual motion parts; no one-piece PNG is assumed sufficient for all character behavior. Phase 7 derives three themes with distinct exterior/material/lighting. Source, dimensions/alpha, anchors/parents/draw order, Figma usage and runtime mapping become verified catalog entries, not guessed metadata.
