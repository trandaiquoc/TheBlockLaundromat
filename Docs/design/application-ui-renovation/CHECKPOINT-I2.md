# Checkpoint I2 — Replace stale Mod JAR preflight state

Root cause, 2026-10-20: `AssetManagerModImportWorkflow.inspect()` validated a new
file before clearing the previous prepared JAR. If the replacement failed upload
validation, the old preflight card and enabled Import action remained beside
the new error. Retrying could also use the previous file.

The workflow now cancels and disposes the previous preview before validating
the replacement. An invalid file clears retry eligibility and reports a failed
operation; a valid file continues through the existing preflight path. The
importer, registry, project content and archive format are unchanged.

The regression spec proves that a valid preview is disposed and removed after
an invalid replacement, with no second archive inspection. All nine focused
workflow tests, app typecheck, production build and encoding checks passed.
Browser QA in a disposable Chrome profile used the local Cobblemon Fabric
1.8.1 JAR for a successful preflight, then selected a `.txt` file: the old
card disappeared, the JAR-only error appeared, and imported mods stayed at
zero. A corrupt `.jar` also produced an error with no stale card. Raw parser
wording for corrupt ZIP data remains a presentation refinement for G.
