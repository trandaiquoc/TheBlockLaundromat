# Homepage and Project Screen

**Status:** traditional Project Screen restored. The laundromat scene direction
was discontinued on 2026-10-19. The four approved concept images remain visual
references for Homepage control and account placement/material; their
illustrated scene and page composition are not active implementation work.

## Current screen

The Project Screen uses the traditional project-management layout: branded
header with language, theme, and Settings controls; project introduction; an
inline Create Project form; and a Recent Projects list with Open and Delete
actions. Structure JSON import uses its validated preview dialog. Project data
and account status remain local. The screen supports English and Vietnamese,
all four application themes, keyboard focus management, and responsive layouts.

The screen delegates project creation, import activation, opening, deletion,
validation, and persistence to the current workflows. Recent project search and
sorting are available when saved projects exist. Thumbnail capture and
persistence remain owned by the editor/persistence workflow; the Project Screen
does not render thumbnails.

The bottom-left account card is a local presentation demo that starts as
`rakoon` on the Free Plan and uses one local raccoon avatar in every theme.
Logging out changes only this component to Guest; it does not alter projects,
IndexedDB, preferences, or editor state. The shared top controls continue to
use the existing locale and theme workflows. Both outer groups use the same
theme surface, border, text, and selected-state tokens as the inner Project
Screen, with shared translucent floating surfaces and a softly raised account
menu. Project Screen cards, Settings dialogs, and Editor shared controls resolve
the same semantic theme tokens, while the Editor keeps its separate header,
toolbar, and sidebar roles. The references guide those controls' placement and
material only; no illustrated scene artwork is loaded.

For interaction research, the [LucianLabs UX/UI gallery](https://lucianlabs.dev/uxui-prompt/)
account switcher 037 informed the upward-opening account menu, item focus, and
compact trigger. Sliding pill 039 informed selected-state feedback, and
language switch 267 informed clear selected language feedback. Their demos and
source were reviewed for interaction ideas; no demo code, global CSS, or
dependencies were copied. The existing Angular services and semantic theme
tokens remain authoritative.

## Visual references and historical evidence

The four original approved concepts remain in
[`../references/`](../references/): Minecraft, Light, Raccoon, and Dark. They
guide control/account placement and translucent panel treatment. They remain
documentation images and are not loaded by the application.

Dated captures and interaction notes are retained under
[`evidence/`](evidence/) as historical records of the discontinued scene
implementation. They are not evidence of the current screen. No scene asset
registry, laundromat artwork, scene-level raccoon motion, or layered composition
is active.
