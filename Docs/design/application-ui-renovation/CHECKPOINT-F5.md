# Checkpoint F5 — Structure JSON file-policy parity

Local implementation evidence, 2026-10-20. This covers file selection on both
Structure JSON entry points, not the remaining import decisions.

Project Screen and Workspace now use one `structureJsonFileIssue` contract to
check `.json` and the 64 MiB limit before reading. The Project Screen dialog
reports the same localized errors as Workspace. The parser, project preview,
size policy and persistence remain unchanged.

Three targeted spec files passed 21 tests, including the policy boundary and
both UI consumers. A disposable localhost session at 390 px showed a wrong
file error, a valid one-block preview, then a created project with one block.
No page errors appeared. Read failures, huge-structure decisions and the full
Workspace import mode matrix remain in the final F gate.
