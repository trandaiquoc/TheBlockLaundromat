# Homepage and Project Screen

**Current status:** `/` remains the traditional Project Screen. A separate
Canvas 2D illustration preview is available at `/homepage-2d-preview`; it does
not replace the default screen or connect artwork to project data.

## Approved design direction — Phase 1 PARTIAL

The [Illustrated Interactive Homepage Phase 1 decisions](illustrated-homepage-phase-1.md)
record the approved PixiJS 2D/2.5D direction, Angular DOM interaction boundary,
reuse of existing Project workflows, landscape/portrait composition, asset gaps,
and acceptance conditions. Minecraft is the representative theme for future work.

This is a design direction, not the current renderer: PixiJS and the proposed
animation are not implemented. Phase 1 remains **PARTIAL** because clean artwork
and complete responsive visual evidence are missing. The record stops after
Phase 1 and does not authorize Phase 2 implementation.

The implementation sections below describe the existing Canvas 2D preview and
traditional Project Screen. The historical section identifies retired proposals
and dated evidence; those records do not override the Phase 1 design direction.

## Project Screen

The branded Project Screen provides English and Vietnamese locale controls,
four application themes, Settings, and a local account presentation. It keeps
project creation inline and lists recent projects with search, sorting, Open,
and Delete actions. Structure JSON import uses a validated preview, and project
backup import/export uses the existing persistence workflows.

Project creation, import, opening, deletion, validation, and persistence remain
owned by their existing workflows. Thumbnail capture and persistence remain
owned by the editor and persistence subsystems; the Project Screen does not
render thumbnails.

The account card is a local presentation demo that starts as `rakoon` on the
Free Plan and uses the shared raccoon avatar. Logging out changes this component
to Guest; it does not alter projects, IndexedDB, preferences, or editor state.
Locale, theme, Settings, and account controls continue to use their existing
shared components and services.

## 2D illustration preview

The standalone preview route is lazy-loaded at `/homepage-2d-preview`. Its
Canvas 2D renderer reads the canonical layer manifest, uses each layer's
source coordinates and manifest order, and retains semantic parent/group
relationships for composed transforms. It does not use Three.js or a flattened
background image. The app's shared locale, theme, Settings, and account controls
sit outside the illustration; the raster navigation and account layers are
omitted from the runtime package to avoid duplicate controls.

The scene is a static design concept. Project names, cards, and washer controls
drawn into the supplied artwork are illustration pixels, not live project data.
Project Screen workflows and project data are not mounted on this preview. The
sample text and sample projects still need artwork cleanup before any future
data integration.

The source package remains at
[`../../../Frontend/source-assets/homepage/`](../../../Frontend/source-assets/homepage/),
outside Angular `public/`. The Angular build exports the 323 layer PNGs needed
to render the four theme variants and the scene manifest to
`assets/homepage/runtime/`. Only the active theme's images are fetched in the
preview; the output excludes source masks, reference images, inventory, and
provenance material. `check:home-assets` verifies the 331 source layer hashes,
282 masks, 86 semantic IDs, canonical reference hashes, and the exact runtime
output file set and hashes.

Desktop framing contains the full illustration while preserving its aspect
ratio. Portrait layouts crop around the central washer area so the scene stays
large enough to read while the controls and account remain usable. Theme changes
clear the old scene, cancel pending image requests, and close decoded image
bitmaps before displaying the selected theme.

Run the asset and pixel fidelity checks from `Frontend/`:

```sh
npm run check:home-assets
npm run check:home-composition
npm run check:homepage-browser
```

The composition check uses the production canvas drawing function in a browser,
at the native 1672 × 941 artboard size, and compares the rendered RGB pixels to
all four canonical source references. It runs separately from the production
preview. The browser check verifies theme switching, controls, desktop and
mobile framing, and the traditional Project Screen at `/`. It writes current
screenshots to the ignored `Frontend/.artifacts/homepage-preview/screenshots/`
directory.

## Visual references and historical evidence

The four canonical concepts remain in
[`../references/`](../references/): Minecraft, Light, Raccoon, and Dark. They
are preserved byte-for-byte and are used for validation; production rendering
uses the extracted layers rather than loading the reference images.

Source inventory and ZIP provenance are in
[`source-assets/`](source-assets/). Source-supplied QA records and earlier
preview images remain under
[`evidence/phase1-source-assets/`](evidence/phase1-source-assets/); they are
historical package evidence, not screenshots of the current Angular preview.

The former 3D technical proposal and Phase 2 implementation report remain
retired historical records in [`3d-homepage-spec.md`](3d-homepage-spec.md) and
[`phase2-prototype.md`](phase2-prototype.md). The 3D asset plan is also retired
as an implementation contract; its semantic IDs, source paths, and theme
coverage remain useful reference data. No Three.js Homepage implementation or
route is part of the current preview.

Dated screenshots and interaction notes under [`evidence/`](evidence/) are
historical records of earlier Project Screen reviews, not current UI contracts.
Current Project Screen behavior is defined by the Angular implementation and
the [application UI contract](../application-ui-renovation/CURRENT-UI-CONTRACT.md).

For interaction research, the [LucianLabs UX/UI gallery](https://lucianlabs.dev/uxui-prompt/)
account switcher 037 informed the upward-opening account menu, item focus, and
compact trigger. Sliding pill 039 informed selected-state feedback, and
language switch 267 informed selected-language feedback. The demos and source
were reviewed for interaction ideas; no demo code, global CSS, or dependencies
were copied.
