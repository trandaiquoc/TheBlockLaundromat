# Checkpoint H15 — Y-Layer, Quick Bar and decoration source handoff

No production code changed in this verification checkpoint.

In the disposable local project, Y-Layer started with reference opacity at 15%.
All six visibility options retained 15%. Changing the slider to 40%, reloading,
and reading the control again confirmed that manual opacity persists; it was
then restored to 15%. The options panel fit without document overflow at 320,
390 and 1440 CSS px (304 px wide at 320; 352 px at 390 and desktop).

At 390 px, searching the Block Browser for `stone` and using Quick Add created
one Quick Bar slot with the accessible name `1: Stone, minecraft:stone`. Focusing
the slot showed no visible tooltip. The temporary slot was removed after the
check, and the project stayed at three blocks.

From Decorations, Manage Sources opened the Asset Manager. At 320 px the nested
dialog was 304 px wide and stayed within the viewport. Escape closed only the
nested Asset Manager and kept the Decorations drawer open.

Importing a Structure JSON entry with an unknown ID at `y=0` created one
placeholder while preserving `unverified-example:missing_block`. The status bar
reported one missing block, and Missing Assets listed the namespace and exact
ID before handing off to Asset Manager. Undo reduced the project from four
blocks to the original three; Redo restored four and the missing status; a final
Undo returned to three blocks and Assets ready.

The AI Limits tab also exercised Clear, Restore defaults and a no-match search;
the default limits were restored and the search was cleared afterward.

The six visibility modes, persisted slider value and narrow/desktop measurements
were checked in Chrome on localhost. Quick Bar focus and the nested source
handoff were checked in the same disposable profile. No screenshots were kept.
