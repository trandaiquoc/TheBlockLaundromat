# Checkpoint F7 — Structure JSON clip-empty recovery

Local implementation evidence, 2026-10-20. The import planner, clipping rules,
project data and History commit remain unchanged.

When a user selected **Keep current size** and every imported block or
decoration fell outside the current bounds, the clipped plan was empty. The
workflow then showed the resize-limit warning, even though the user had chosen
not to resize. The workflow now explains that nothing remains after clipping
and offers the valid recovery choice to resize and import. It leaves the source
preview open, restores the ready state and does not create a History entry or
change the project.

The `StructureJsonImportWorkflow` regression spec covers this case in Merge
mode. It verifies the bilingual message keys, unchanged project identity,
unchanged History and ready workflow state.

On localhost at 320 px, a Structure JSON block outside the 16³ project was
validated in Merge mode. **Keep current size** showed the clip-empty warning;
the import dialog stayed open, the project remained at three blocks, and the
page had no horizontal overflow. The resize and partial-clip branches were
also checked during the same browser pass.
