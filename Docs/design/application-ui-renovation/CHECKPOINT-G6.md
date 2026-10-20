# Checkpoint G6 — Vanilla fallback and recovery

The Vanilla resource panel now clears an unrelated manual-JAR error when a
replacement file is selected or a cache recovery action starts. Offline failures
show localized recovery guidance in the panel. Activity entries retain an
`offline` error code, so the Asset Manager localizes the historical message
even after the network recovers while preserving the original technical message
in the activity record.

Browser QA used a disposable Chrome profile and project:

- Exported the compatibility report through a user click. The downloaded JSON
  parsed successfully and matched the panel summary: 267 reused, 189 changed,
  604 generic and 0 unsupported.
- Invalid `.txt` fallback selection showed the JAR-only error; a sparse JAR
  larger than the upload limit showed the `200 MiB` limit. Selecting the real
  Cobblemon JAR opened the explicit replacement confirmation; cancelling kept
  Mojang assets active and the source unchanged.
- Removed the disposable profile's cached Vanilla assets while offline. The
  panel showed localized guidance and no stale JAR error. The recent activity
  message was localized in English and Vietnamese. After reconnection, the
  asset set recovered to 8,356 resources, and the prior offline entry remained
  localized in the history.
- At 390 CSS px, the offline message fit without horizontal overflow.

Focused activity, runtime and Asset Manager tests passed (22 tests). App
typecheck, production build, encoding, Prettier and `git diff --check` passed.
This checkpoint verifies Vanilla offline/cache recovery and manual fallback
presentation; Mod timeout/retry and warning diagnostics remain open.
