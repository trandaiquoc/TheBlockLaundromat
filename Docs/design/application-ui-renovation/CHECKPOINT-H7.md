# Checkpoint H7 — Asset audit categories and filters

Asset-audit summary cards now filter the entries below. The total card restores
all entries, and activating the currently selected category again also restores
the full list. Search text composes with the selected category. A new audit or a
change to its project/provider scope returns the category filter to all entries.

Visual coverage and behavior coverage have separate headings and semantic theme
colors. Each result row labels its two support values as **Visual** and
**Behavior** (localized as **Hiển thị** and **Hành vi**) so values such as
`partial`, `full` and `unknown` have an unambiguous category. The group headings,
selected cards and row labels use the same category colors in Minecraft,
Raccoon, Light and Dark.

## Verification

- Diagnostics dialog component spec: 13 tests passed, including all category
  mappings, selecting and clearing a filter, and the empty result state.
- Angular production build passed.
- Browser audit of the disposable empty project returned 1,060 entries. Visual
  partial filtered to 130 entries; behavior unknown filtered to 745; activating
  the selected filter again restored all 1,060. Result rows displayed both
  localized category labels.
- Computed category colors matched across the group headings and result badges
  in all four themes.
- At 390 px and 320 px, the dialog fit the viewport and the category groups had
  no horizontal overflow. Escape closed the dialog.
- Scoped Prettier, encoding check and `git diff --check` passed.

The browser capture used to review the final grouped cards and labeled result
badges is `/tmp/codex-audit-h7.png`.
