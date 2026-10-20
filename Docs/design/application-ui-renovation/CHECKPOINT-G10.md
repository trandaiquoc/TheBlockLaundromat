# Checkpoint G10 — real Mod warning diagnostics

Validated the preflight warning report in the browser using Supplementaries
Fabric `1.21.1-3.9.9`, a real Minecraft 1.21.1 archive from Modrinth. The
downloaded JAR's SHA-512 matched the official Modrinth version metadata:

`f5071c78bdd2e1a809c467f80fa05712b9929107128b13a58073dc085e0e1b63e63164aaa19672d8bc6bf5bac00657e33d8e19f68da9f5a23d5015008b3793d7`

Static archive inspection found model JSON resources that use custom model
loaders. Preflight reported 27 `custom-model-loader` warnings. The warning
details were readable in English and Vietnamese at a 390 × 844 viewport, with
no horizontal overflow. Opening the nested diagnostics and pressing Escape
closed that layer while retaining the preflight and Asset Manager.

This archive also contains four independent blocking conflicts: three vanilla
item model path conflicts and one item ID conflict. Import correctly remained
disabled for those blockers. This checkpoint verifies real warning presentation
alongside unrelated blockers; it does not claim a successful import with only
nonblocking warnings. No blocks or Mods were imported, and no JAR code was run.

Source: [Modrinth version metadata](https://api.modrinth.com/v2/version/h8FyJ2as)
and [Supplementaries version page](https://modrinth.com/mod/supplementaries/version/h8FyJ2as).
Browser captures are retained in ignored `.artifacts/` as
`mod-warning-supplementaries-en-390x844.png` and
`mod-warning-supplementaries-vi-390x844.png`.
