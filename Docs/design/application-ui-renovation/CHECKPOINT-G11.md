# Checkpoint G11 — official client JAR fallback cancellation

Exercised the manual Vanilla fallback with Mojang's actual Minecraft 1.21.1
client JAR. The downloaded file matched the SHA-1 and size published by Mojang's
version metadata:

- SHA-1: `30c73b1c5da787909b2f73340419fdf13b9def88`
- Size: 26,836,906 bytes
- Client URL: <https://piston-data.mojang.com/v1/objects/30c73b1c5da787909b2f73340419fdf13b9def88/client.jar>
- Version metadata: <https://piston-meta.mojang.com/v1/packages/94f420093e771cd1e72614184736b044c747a8df/1.21.1.json>

In the isolated local project, the native picker reached the explicit
replacement confirmation, which identified Minecraft 1.21.1. After confirming,
the Asset Manager showed the running client-JAR task and its cancel control. A
pointer click canceled it. The activity recorded cancellation; the active source
remained Mojang official assets with 8,356 resources, and the project stayed at
zero blocks.

The browser capture is retained in ignored `.artifacts/` as
`minecraft-client-import-progress-vi-390x844.png`. The client JAR was inspected
as static archive data only; no code was executed. G9 continues to cover a
large generated resource archive and its detailed normalization progress.
