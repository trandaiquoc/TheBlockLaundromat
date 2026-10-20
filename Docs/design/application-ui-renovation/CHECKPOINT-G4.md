# Checkpoint G4 — Mod JAR error presentation

The Mod JAR preflight now turns a typed damaged-archive error into a clear
localized instruction to choose a valid JAR and try again. Other failures keep
their distinct messages. Both Mod preflight and the Vanilla manual-JAR fallback
derive the displayed upload limit from `JarUploadValidationError.maxBytes`, so
the message matches the actual 200 MiB validation policy.

The focused archive, Mod workflow and Asset Manager tests passed (25 tests),
along with app typecheck, production build and encoding checks. Browser checks
used a disposable project/profile: a corrupt `.jar` showed the new message in
EN and VI with no stale preflight card; a sparse file one byte over the limit
showed “200 MiB”. At 390 CSS px, the dialog fit within the viewport with no
horizontal overflow. The separate I4 fix makes failed activity appear only in
recent history.

Unsupported loaders, timeout/retry, Vanilla offline/cache recovery and
diagnostic warning/blocker content remain in the G verification scope.
