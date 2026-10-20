# Checkpoint I3 — Classify malformed ZIP archives

Root cause, 2026-10-20: the ZIP reader exposed malformed directory/header
records as generic `Error` values (and some truncated records as `RangeError`).
The Mod JAR UI could not distinguish a damaged archive from an unrelated read
or validation failure without matching error text.

`ZipArchive` now throws `InvalidZipArchiveError` for missing or truncated
directory entries, invalid local headers, truncated compressed data and size
mismatches. It checks record bounds before reading them. Valid archive parsing,
resource limits, cancellation and file formats are unchanged.

The archive specs prove typed rejection for corrupt and truncated inputs alongside
stored/deflated reads, progress and cancellation (7 passed). App typecheck,
production build and encoding checks passed. The local browser corrupt-JAR
probe had already shown the generic parser message; the presentation mapping
is a separate G checkpoint.
