# Checkpoint I4 — End failed asset activity

Root cause, 2026-10-20: `AssetActivityService.fail()` stored the failure in the
`current` activity signal. Asset Manager labels that signal as the task in
progress, so a failed Mod JAR preflight continued to appear as “In progress”
even after the job ended.

Failure now remains in the recent activity history and clears the current task,
matching the existing finish, cancel and timeout terminal paths. The protected
operation guard, import cancellation and project state are unchanged.

The activity regression spec proves `current` is empty and the latest history
entry is an error after failure (4 focused tests passed). App typecheck and
production build passed. In a disposable Chrome profile, a corrupt JAR showed
the Vietnamese error and recent history entry with no current-task panel.
