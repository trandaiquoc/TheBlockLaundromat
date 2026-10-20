# Checkpoint G9 - manual Vanilla fallback progress and cancellation

The manual client-JAR fallback now reports archive read, resource normalization,
validation and cache-save progress through the existing asset activity owner.
Its Asset Manager panel exposes a localized cancel action. The UI owns a caller
`AbortSignal`; the runtime retains single-writer coordination and only activates
the imported provider after parsing, validation and cache save complete.

The localhost browser check used a generated static resource JAR with 50,004
entries (about 9.8 MiB). It contained no executable code. At `256 / 50004`
normalized resources, the Vietnamese progress panel showed the phase; a real
pointer click on Cancel stopped the operation. The prior Mojang source remained
active with 8,356 resources, status returned to ready, and the activity history
recorded the cancellation. The official source and compatibility summary were
verified again after the canceled import.

Browser verification exposed a runtime effect that read status signals through
`ensureVersion`. Setting `importing` could queue a background cache reload, which
then ran after cancellation. The version effect now reads only project-version
changes; its load decision runs untracked. This prevents a canceled replacement
from restarting through the cache path.

Targeted Vanilla provider, runtime cancellation, Asset Manager, lifecycle and
localization specs passed **56 tests**. G6 continues to cover the invalid-file,
200 MiB limit, replacement confirmation and offline recovery paths.

At the time of G9, a real nonblocking Mod warning archive remained unavailable;
G7's generated unsafe-path archive verified warning presentation only, while G8
verified a real unsupported-loader blocker. G10 later closes the warning-fixture
gap with a real Supplementaries archive. The generated Vanilla JAR used for this
G9 check was removed after browser verification. The final automated test,
production build, typecheck, formatter, and encoding gates passed after G9.
