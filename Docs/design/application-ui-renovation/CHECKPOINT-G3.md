# Checkpoint G3 — Real Cobblemon Fabric JAR

Browser verification, 2026-10-20, using the local Cobblemon Fabric 1.8.1 JAR
for Minecraft 1.21.1 (137,391,338 bytes; below the 200 MiB upload limit). The
archive metadata and entry paths were inspected statically. No Java code was
executed.

At 390 CSS px, preflight identified the supported Fabric loader and matching
Minecraft version, reported 355 blocks, 884 items, 4 decorations and no
warnings. The long review remained within the viewport and its Import/Cancel
actions became visible by scrolling the dialog. Cancelling preflight left the
imported-mod count at zero.

The successful import path then reached 1/1 imported. Mod details showed the
same source identity and counts; searching for “Ability Capsule” returned
`cobblemon:ability_capsule`. Technical details reported that eight nested JARs
were skipped and embedded code is never executed. The Remove Mod confirmation
was exercised; confirming it returned the Asset Manager to zero imported mods.
The project remained at zero blocks and the browser had no horizontal overflow.

The final screenshot evidence stayed under `/tmp`; no fixture or image was
added to the repository. Unsupported/bad archives, retry, leave/cancel during
activation, Vanilla offline recovery and Mod diagnostics remain separate G
verification items.
