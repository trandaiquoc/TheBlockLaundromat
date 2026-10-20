# Checkpoint H14 — Group Move panel

Escape now closes the floating Move panel through the editor shell's existing
cancel path. It resets the preview offset and restores focus to the opening
control, including when the panel is used beside a narrow sidebar. The narrow
position clamp also keeps an 8 px inset where the panel fits, so its right edge
does not touch the viewport edge at 320 px.

Verification: in a disposable browser project, a group was created and one real
block added. X+ produced a one-block preview offset; Escape closed the panel,
left the block at X8/Y0/Z8 and reset the offset to zero on reopening. At 320 px,
the 288 px wide panel sat at X24–312 and remained within the viewport. Focus
returned to the Move trigger after Escape. Focused editor shell, Groups, panel
positioning and session tests passed (51 tests); the Angular production build
passed.

The same disposable project also verified the row menu: renaming retained the
group's block, deleting only the group was undoable, and Undo restored it.
Deleting blocks from the group opened a confirmation naming the group and count;
Cancel kept all three structure blocks and the group intact. An X offset of
1000 showed the out-of-bounds reason and disabled Save. Locking the group showed
the locked-content reason and disabled Save; the QA group was unlocked again
after this check.
