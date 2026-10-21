# Homepage and Project Screen

**Status:** the existing Project Screen is integrated with a layered Minecraft
Homespace scene. Minecraft and Dark share geometry and current temporary plates;
Dark applies cool-night lighting. Browser checks verify the scene geometry,
projection, and responsive behavior; generated plates remain temporary and are
not presented as final visual artwork. Light and Raccoon scenes remain
unimplemented.

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

The Minecraft scene is composed from an outside panorama and a transparent room
shell on a shared 1672 × 941 artboard. Objects and projected UI have separate
layers; the current scene adds no washer, raccoon, board content, logo, or
animation. Project Screen controls and workflows remain in their existing page
layer. A CSS projective surface contract maps future HTML content to a scene
quadrilateral, including transformed pointer hit testing. The scene scales
uniformly to viewport height and can pan horizontally when wider than the
viewport; vertical scene panning is disabled. Dragging and ArrowLeft/ArrowRight
pan the scene when its region is targeted; horizontal touch swipes pan the
scene, and projected interactive controls retain their native arrow-key
behavior. Project Screen content keeps its own vertical scrolling. Narrow
layouts use denser spacing so the create actions remain reachable without
browser fullscreen. Current generated plates live under
`Frontend/public/assets/homespace/temporary/` and remain temporary pending
visual-art review. Browser verification covers scene alignment and interaction;
it does not claim final reference-art fidelity.

Minecraft (`craft`) and Dark share one scene geometry and current artwork; Dark
applies cool-night lighting. Light and Raccoon retain their existing page
backgrounds.

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

The four original concepts remain in
[`../references/`](../references/): Minecraft, Light, Raccoon, and Dark. They
guide control/account placement, translucent panel treatment, and the scene
artwork. The reference files themselves are not loaded by the application.

Dated captures and interaction notes are retained under
[`evidence/`](evidence/) as historical records of earlier screen reviews. They
are not evidence of the current layered scene implementation. The current
Minecraft scene uses separately owned outside and interior assets.
