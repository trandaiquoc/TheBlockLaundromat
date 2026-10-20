# Checkpoint G8 — Real loader compatibility and activation cancellation

Used official Cobblemon 1.6.0 files for Minecraft Java 1.21.1 from Modrinth:
[Fabric](https://modrinth.com/mod/cobblemon/version/qQkr9Wdi) and
[NeoForge](https://modrinth.com/mod/cobblemon/version/rN59dd71). Their declared
game version and loader matched the official version metadata, and both local
SHA-512 values matched Modrinth. The JARs were inspected only by the app's
static resource importer; no classes were executed. Fixtures were temporary
under ignored `.artifacts/` and are removed after this verification.

In a disposable browser profile, the Fabric preflight reached Ready to import
with 20,640 resources, 219 blocks, 614 items and no warnings. Import produced
one active Mod; Details showed the 1.21.1 version, namespaces, resource count
and indexed content. The external-AI Content section reported the same 219
blocks and exposed exact `cobblemon:` IDs. Canceling the Remove confirmation
kept the Mod; confirming Remove returned the imported count to zero. The test
project remained at three blocks throughout.

The same Fabric archive was imported a second time and canceled while the
commit operation was active. The operation ended with no active task, a
`Task cancelled` history entry, zero imported Mods and the same three project
blocks. Clearing activity produced the empty-history state.

The official NeoForge archive reached the real unsupported-loader state:
metadata was unavailable, compatibility could not be verified, one blocking
diagnostic identified `unsupported-loader`, and Import was disabled. Escape
closed the diagnostic while retaining the parent workflow; Cancel preflight
cleared the preview without importing a Mod or changing the project.

This closes the real supported/unsupported loader and activation-cancellation
browser gaps. A real nonblocking warning archive was not available; the existing
synthetic unsafe-path warning remains the evidence for that presentation path.
