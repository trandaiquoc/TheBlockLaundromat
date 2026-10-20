# Checkpoint G7 — Mod preflight recovery and warning diagnostics

Browser QA in the disposable Chrome profile used a synthetic Fabric ZIP with
one safe language resource and one unsafe traversal path. No archive code was
executed; the fixture remained under `/tmp` and is not evidence of real Mod
compatibility.

For the timeout path, the browser session temporarily stalled the selected
fixture stream and shortened the watchdog delay. Preflight reported the
localized timeout in Vietnamese and offered Retry. Restoring the original
stream and retrying completed preflight and showed one warning.

The warning detail displayed the localized unsafe-path explanation and source
path in Vietnamese and English. At 390 CSS px, the dialog fit without
horizontal overflow. Escape closed only the nested warning dialog and kept the
Asset Manager and preflight open. Cancelling preflight cleared its preview; the
Mod count and project block count remained zero.

The existing Mod workflow specs cover timeout/retry generation behavior. The
synthetic ZIP verifies presentation and recovery handling only. Real
unsupported-Mod compatibility and browser verification of activation
cancellation remain open checkpoints.
