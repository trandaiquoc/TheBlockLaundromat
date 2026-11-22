# Goal 05 browser diagnostics — 2026-11-23

## Result

**Gate E: partial.** The automated headless run confirms resource loading,
camera/theme interactions, WebGL fallback, and cleanup over 20 mode changes. A
paired Intel UHD desktop run confirms lower draw-call and render-callback cost
for camera gestures and non-spinning theme changes, and the 60-second desktop
idle check passed. Some active theme-transition frame-interval p95 samples still
exceed the 20 ms desktop target. Mid-range mobile hardware and GPU-memory growth
remain unmeasured.

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

## Paired desktop hardware run

The renderer was measured before and after disabling automatic shadow-map refresh
for camera-only and lighting-only renders. Both runs used the same visible Chrome
157.0.8103.79 page, Windows 11 desktop, 1280×720 viewport, DPR 1, and Intel UHD
Graphics through ANGLE/Direct3D 11. All four material variants were warmed before
the measured theme transitions. Theme measurements used Washer focus, where the
room does not spin; camera gestures used Overview. The browser reported hardware
WebGL acceleration, not SwiftShader.

| Action                              | Before                                                                    | After                                                                  | Change                                                             |
| ----------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Warm theme transition, Washer focus | 715 WebGL draw calls per rendered frame; render callback p95 11.2–14.7 ms | 233 calls per frame; callback p95 7.0–9.7 ms                           | 67.4% fewer draw calls; lower callback p95 in all four transitions |
| Orbit, 40 pointer moves             | 37 rendered responses, 35,853 calls (969 per render); event p95 10.8 ms   | 37 rendered responses, 18,019 calls (487 per render); event p95 6.0 ms | 49.7% fewer calls; event p95 44.4% lower                           |
| Pan, 40 pointer moves               | 37 rendered responses, 35,853 calls (969 per render); event p95 10.1 ms   | 37 rendered responses, 18,019 calls (487 per render); event p95 8.5 ms | 49.7% fewer calls; event p95 15.8% lower                           |
| Zoom, 400 px wheel input            | 40 RAF renders, 39,729 calls (969 per render); interval p95 21.2 ms       | 72 RAF renders, 35,551 calls (487 per render); interval p95 14.0 ms    | 49.7% fewer calls per frame; observed interval p95 34.0% lower     |

The paired run confirms the shadow pass is skipped for static camera movement and
theme lighting, while room-spin frames continue refreshing shadows. Theme-transition
render-interval p95 varied from 20.9–27.8 ms before to 21.1–34.5 ms after, so the
documented 20 ms desktop target is not proven across all active transitions. RAF
cadence varied during the run, and the zoom runs did not produce the same number of
frames; draw calls per rendered frame and pointer-event samples provide the more
direct paired comparison. These results establish a desktop diagnostic, not a
mobile result or a GPU-memory measurement.

The WebGL-call instrumentation session logged repeated sampler-type
`GL_INVALID_OPERATION` warnings (256 per measured page context). A separate
uninstrumented Chrome theme-switch smoke produced no console entries. The source
of the warnings was not isolated, so the runs do not establish a clean-console
result and the instrumented frame timings remain diagnostic.

On the same desktop Chrome/Intel UHD setup, a 60,029.9 ms visible idle interval
reported zero draw calls, zero RAF callbacks, zero pending frames, zero long-task
milliseconds, and no WebGL buffer or texture creates/deletes. JS heap changed from
65,932,300 to 65,941,456 bytes (+9,156 bytes); this is not a GPU-memory reading.

The browser harness was rerun on the optimized build: 16 captures were regenerated,
20/20 in-place mount/unmount cycles left one canvas while mounted and zero after
unmount, with zero pending frames each time. The WebGL fallback remained usable,
and its one-second idle check also reported zero draw calls and zero pending
frames. Representative mid-range mobile hardware remains open.

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
