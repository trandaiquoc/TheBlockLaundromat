# Goal 05 browser diagnostics — 2026-11-23

## Result

**Gate E: partial.** The automated headless run confirms an idle render loop,
resource loading, camera/theme interactions, WebGL fallback, and cleanup over 20
mode changes. It does not establish the documented desktop or mobile frame-time
targets: this run used headless Chromium with SwiftShader, produced only one
frame-interval sample during a theme change, and did not measure GPU memory.
Representative desktop and mid-range mobile measurements remain open.

## Environment and measurements

The browser harness used headless Chromium with SwiftShader. The document was
visible and `prefers-reduced-motion` was disabled. Measurements are diagnostic
and should not be compared to hardware GPU timing.

| Check                              | Observed result                                                                                |
| ---------------------------------- | ---------------------------------------------------------------------------------------------- |
| Scene ready from navigation start  | 3,175 ms                                                                                       |
| Room GLB                           | 10,660,804 transferred bytes; 10,660,504 decoded bytes; 145 ms reported resource duration      |
| Forest-floor texture               | 1,552,232 transferred bytes; 1,551,932 decoded bytes; 16 ms reported resource duration         |
| JS heap at scene ready             | 49,371,503 bytes (about 47.1 MiB)                                                              |
| One-second idle interval           | 0 draw calls; 0 pending animation frames; 0 observed long-task milliseconds                    |
| JS heap after idle interval        | 49,388,872 bytes, 17,369 bytes above scene-ready reading                                       |
| Theme switch (`craft` → `raccoon`) | Applied the `Raccoon` material variant; 2,907 draw calls; 0 buffer creates; 39 texture creates |
| Theme-switch frame intervals       | 1 sample at 34.8 ms; insufficient for a stable median or p95                                   |
| Camera gesture samples             | Orbit 7,752 draw calls, pan 5,814, zoom 969; each observed for 650 ms                          |
| Mode mount/unmount cycles          | 20/20 passed; mounted canvas count 1, unmounted canvas count 0, pending frames 0 each cycle    |

Draw-call counts are WebGL calls, not frame counts. The PerformanceObserver only
reports long tasks of at least 50 ms, so zero observed milliseconds is not proof
that the main thread was idle. JS heap is not GPU memory.

## Packaging comparison

The production homepage asset allowlist contains two files totaling 12,212,436
bytes: the assembled room GLB and forest-floor texture. The earlier homepage
runtime package measured 56,930,166 bytes, a reduction of 44,717,730 bytes
(78.55%). The current scene request decodes to 12,212,436 bytes. Earlier scene
requests decoded to 12,391,960 bytes; this 179,524-byte difference reflects
removal of the separately loaded washer GLB. These are package/request-size
comparisons, not paired load-time or hardware-rendering benchmarks.

## Browser coverage

The harness captured 16 combinations: Simple and Diorama, desktop and mobile,
and Minecraft, Light, Raccoon, and Dark themes. It also exercised the Simple
project workflows, legacy preference migration, Diorama material-variant
switching, camera orbit/pan/zoom, WebGL fallback, and in-place mode lifecycle.
Captures and the full machine-readable diagnostics remain in the ignored
`Frontend/.artifacts/goal-05/` directory for visual review.
