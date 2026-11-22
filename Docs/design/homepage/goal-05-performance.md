# Goal 05 browser diagnostics — 2026-11-23

## Result

**Gate E: partial.** The automated headless run confirms resource loading,
camera/theme interactions, WebGL fallback, and cleanup over 20 mode changes. A
paired Intel UHD desktop run confirms lower draw-call and render-callback cost
for camera gestures and theme changes. A follow-up removes the extra synchronous
theme render and avoids rebuilding a shadow map when the material variants do
not change caster silhouettes. The 60-second desktop idle check passed. Active
frame-interval p95 still exceeds the 20 ms desktop target, and mid-range mobile
hardware remains unmeasured. A Windows GPU-process memory-counter follow-up over
20 actual desktop mount/unmount cycles is recorded below.

## Environment and measurements

The browser harness used headless Chromium with SwiftShader. The document was
visible and `prefers-reduced-motion` was disabled. Measurements are diagnostic
and should not be compared to hardware GPU timing.

| Check                              | Observed result                                                                                |
| ---------------------------------- | ---------------------------------------------------------------------------------------------- |
| Scene ready from navigation start  | 2,805 ms                                                                                       |
| Room GLB                           | 10,660,804 transferred bytes; 10,660,504 decoded bytes; 122 ms reported resource duration      |
| Forest-floor texture               | 1,552,232 transferred bytes; 1,551,932 decoded bytes; 13 ms reported resource duration         |
| JS heap at scene ready             | 49,554,617 bytes (about 47.3 MiB)                                                              |
| One-second idle interval           | 0 draw calls; 0 pending animation frames; 0 observed long-task milliseconds                    |
| JS heap after idle interval        | 49,571,998 bytes, 17,381 bytes above scene-ready reading                                       |
| Theme switch (`craft` → `raccoon`) | Applied the `Raccoon` material variant; 3,876 draw calls; 0 buffer creates; 39 texture creates |
| Theme-switch frame intervals       | 3 samples; median 201.5 ms, p95 756.9 ms; unstable SwiftShader diagnostic                      |
| Camera gesture samples             | Orbit 2,435 draw calls, pan 1,948, zoom 974; each observed for 650 ms                          |
| Mode mount/unmount cycles          | 20/20 passed; zero canvases, pending frames, or live tracked WebGL objects after each unmount  |

An earlier headless run reported 2,601 ms scene-ready time and 47,481,069 bytes
of JS heap. These single-run SwiftShader values vary and are not hardware or
GPU-memory measurements.

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

## Hardware GPU process-memory follow-up

Windows `GPU Process Memory` counters were sampled for the Chrome GPU process
while Chrome 157 rendered on Intel UHD Graphics through ANGLE/Direct3D 11 at
1280×720, DPR 1. The browser document remained visible. Counters are process and
adapter totals; they include Chromium and driver allocations and do not isolate
the Diorama renderer's exact bytes.

| State                                               | Samples | Total Committed MiB (p50 / p95 / max) | Local / Shared Usage MiB (p50) |
| --------------------------------------------------- | ------: | ------------------------------------: | -----------------------------: |
| Diorama ready                                       |       5 |              138.59 / 138.59 / 138.59 |                125.82 / 125.82 |
| Two seconds after first unmount                     |       5 |                 36.39 / 36.39 / 36.39 |                  28.71 / 35.38 |
| During a later 10-cycle batch                       |      45 |               64.50 / 167.19 / 178.39 |                  61.57 / 61.57 |
| Thirty seconds after the last unmount in that batch |      30 |                 37.82 / 43.84 / 43.84 |                  34.90 / 34.90 |

The scene-ready to post-unmount difference was about 102 MiB in this GPU
process. The page completed 20 hardware mount/unmount cycles in two 10-cycle
batches; each observed mount reached `ready` with one canvas and each return to
Simple left zero canvases. The later 30-second idle window returned close to the
first post-unmount reading, with no continuing increase observed. This supports
the context-disposal result but is not a per-scene allocation measurement or a
mobile result.

## Theme scheduling follow-up

The profile now states whether material variants change the caster silhouette.
For the current room, all 262 GLB materials are `OPAQUE`, have base-color alpha
1, and omit `alphaTexture`; the asset check enforces that evidence while the
profile keeps `materialVariantsChangeCasterSilhouette` false. The theme loader
already applies the selected variant while creating the transition, so the
animation owner no longer applies it a second time. Animated theme changes draw
on the next animation frame instead of forcing a synchronous render in the
button handler. Profiles whose variants change the caster silhouette still mark
the shadow map dirty.

On Chrome 157 with Intel UHD, 1280×720 at DPR 1, four warmed non-spinning theme
transitions each produced 23–25 animation renders at 233 WebGL draw calls per
frame and zero synchronous draw calls. Render-callback p95 ranged from 7.6 to
9.3 ms. Frame-interval p95 ranged from 21.0 to 41.5 ms, so this scheduling change
does not prove the 20 ms desktop target. With Overview focus, a Minecraft-to-Light
transition spun the room for 37 rendered frames: 35,853 calls (969 per frame),
callback p95 16.0 ms, and frame-interval p95 27.9 ms (69.4 ms maximum). Those
frames continue refreshing the shadow map so room and ground shadows follow the
rotation. This remains the measured active-rendering bottleneck; removing or
reducing those casters was not justified without a visual-quality comparison.

The WebGL-call instrumentation session logged repeated sampler-type
`GL_INVALID_OPERATION` warnings (256 per measured page context). A separate
uninstrumented Chrome theme-switch smoke produced no console entries. The source
of the warnings was not isolated, so the runs do not establish a clean-console
result and the instrumented frame timings remain diagnostic.

A follow-up used `EXT_disjoint_timer_query_webgl2` on the same Intel UHD desktop
to time GPU work from the first WebGL draw through the end of each render
callback. The driver reported no disjoint query results. During a Night-to-Light
theme transition from Overview, 27 of 27 GPU queries completed: 18 frames at
487 calls had GPU p95 6.9 ms, and 9 shadow-refresh frames at 969 calls had GPU
p95 13.8 ms (13.8 ms maximum). Render-callback p95 was 9.6 ms; frame-interval
p95 was 21.1 ms. A separate 33-frame high-shadow-load Overview window at 969
calls per frame measured GPU p50 10.2 ms and p95 12.3 ms, with one 48.0 ms
maximum outlier; callback p95 was 12.7 ms and frame-interval p95 was 55.4 ms.
These small, instrumented samples show the shadow-refresh frames use more GPU
time, but do not prove the 20 ms frame-interval target or represent mobile
hardware. They do not justify reducing shadow quality without a visual test.

On the same desktop Chrome/Intel UHD setup, a 60,029.9 ms visible idle interval
reported zero draw calls, zero RAF callbacks, zero pending frames, zero long-task
milliseconds, and no WebGL buffer or texture creates/deletes. JS heap changed from
65,932,300 to 65,941,456 bytes (+9,156 bytes); this is not a GPU-memory reading.

## WebGL resource lifecycle follow-up

API-level resource instrumentation found that 20 unmounts removed the canvas and
stopped animation frames but left renderer-owned WebGL handles without matching
delete calls. Scene cleanup now disposes shadow resources exposed by scene nodes,
disposes the renderer, and requests context loss to release remaining context-owned
allocations. The `LightShadow` render target is now disposed with the scene;
context loss releases internal renderer resources for which Three.js does not
issue individual delete calls.

The production browser check completed 20/20 cycles. Each mount created 2,216
buffers, 74 textures, 4 framebuffers, 10 programs, 20 shaders, and 969 vertex
arrays. Each teardown explicitly deleted all buffers, shaders, and vertex arrays,
plus 67 textures, 1 framebuffer, and 7 programs. The confirmed context-loss event
released the remaining 7 textures, 3 framebuffers, and 3 programs. Every cycle
ended with zero live tracked WebGL objects, zero canvases, and zero pending frames.
This headless API-level check is separate from the Windows hardware-counter
measurements above; it does not measure GPU-memory bytes or mobile-device
behavior.

The latest browser run regenerated 16 captures. WebGL fallback remained usable,
and its one-second idle check reported zero draw calls and zero pending frames.
Representative mid-range mobile hardware, exact Diorama-attributable GPU-memory
measurements, and user approval of the captures remain open. Windows GPU-process
memory counters were measured on desktop, but include Chromium and driver use.

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
