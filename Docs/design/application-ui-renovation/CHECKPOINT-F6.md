# Checkpoint F6 — Structure JSON import choices

Local implementation evidence, 2026-10-20. This refines the review hierarchy;
the import planner, confirmation and History commit are unchanged.

After validation, the Apply footer was visible while Replace, Merge and New
Group sat below a long diagnostics list inside a 160 px review pane. At 390 px,
the first mode choice started below the viewport. The review now presents mode
choices and their impact summary before detailed diagnostics. On narrow
viewports with a plan, the review pane grows to at most 42dvh / 22rem, while
the source editor remains reachable by scrolling the dialog body.

The targeted import dialog spec checks document order and passed with the
existing atomic import/oversize tests. Localhost at 390 px showed all three
choices together; at 320 px all three could be selected, Apply reflected the
new plan, there was no page overflow or page error. Exceptional branches
remain in the final F gate.
