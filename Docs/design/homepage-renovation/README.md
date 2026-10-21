# Homepage and Project Screen

**Current status:** the Project Screen uses its traditional project-management
layout. The four original visual concepts remain references only; the screen
does not load scene artwork.

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
