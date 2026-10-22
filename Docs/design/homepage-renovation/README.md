# Homepage and Project Screen

**Current status:** `/` renders the traditional Project Screen. The obsolete
Three.js homepage prototype, its route, and runtime assets have been removed.
The 2D homepage has not been implemented. The original concepts and extracted
source assets remain preserved as design materials and are not loaded by the
application.

## Current screen

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

## Visual references and historical evidence

The four original concepts remain in
[`../references/`](../references/): Minecraft, Light, Raccoon, and Dark. They
are preserved byte-for-byte as design references and are not loaded by the
application.

Phase 1 keeps the supplied cutouts, masks, repairs, manifest, and four exact
reference copies under
[`../../../Frontend/source-assets/homepage/`](../../../Frontend/source-assets/homepage/).
The existing originals in `../references/` remain unchanged and canonical.
The public source directory is not consumed by the current Project Screen.
Inventory and ZIP provenance are in
[`source-assets/`](source-assets/); source-supplied QA records and preview
images are retained under
[`evidence/phase1-source-assets/`](evidence/phase1-source-assets/).

The former 3D technical proposal and Phase 2 implementation report are
retained as retired historical records in
[`3d-homepage-spec.md`](3d-homepage-spec.md) and
[`phase2-prototype.md`](phase2-prototype.md). The 3D asset plan is also retired
as an implementation contract; its semantic IDs, source paths, and theme
coverage remain useful reference data. None of these documents describes a
current renderer or runnable screen.

Dated screenshots and interaction notes under [`evidence/`](evidence/) are
historical records of earlier Project Screen reviews, not current UI contracts.
Current behavior is defined by the Angular implementation and the
[application UI contract](../application-ui-renovation/CURRENT-UI-CONTRACT.md).

For interaction research, the [LucianLabs UX/UI gallery](https://lucianlabs.dev/uxui-prompt/)
account switcher 037 informed the upward-opening account menu, item focus, and
compact trigger. Sliding pill 039 informed selected-state feedback, and
language switch 267 informed selected-language feedback. The demos and source
were reviewed for interaction ideas; no demo code, global CSS, or dependencies
were copied.
