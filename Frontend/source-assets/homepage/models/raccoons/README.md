# Spatial homepage Raccoons

These two original, low-voxel Raccoon prototypes are authored by
[`generate.mjs`](../../../../tools/homepage-raccoon-assets/generate.mjs)
and exported as self-contained GLB files beside this document.

**Visual status:** the GLBs are not approved character art. Their tall cuboid
bodies do not match the selected Raccoon references. The current proposed
shape direction is documented in
[`raccoon-pair-look-review.png`](../../../../../Docs/design/homepage/stage-2-spatial-concepts/raccoon-pair-look-review.png);
it keeps the shared head design the user preferred and balances both body
proportions, separating the roles through pose, note prop, and moderate tail
direction.
No GLB or Blender model was changed for this Stage 2 review.

| Asset        | Character distinction                                                                | Output                     |
| ------------ | ------------------------------------------------------------------------------------ | -------------------------- |
| Note Courier | Holds a small paper note; tail rests in a low sweep; includes the `offer-note` clip. | `raccoon-note-courier.glb` |
| Washer Guide | Raises one forepaw; tail has a modest upward curl; includes the `greet` clip.        | `raccoon-washer-guide.glb` |

Both prototypes use gray-brown cuboid fur, a dark face mask, cream muzzle, and
banded tail. The Chrome preview shows their current forms and activities, not
the approved look. Stage 3 must replace/refine their silhouettes against the
proposed shape sheet after user approval.

## Model contract

- Local forward is `+Z`; ground contact is `y = 0`.
- Each file has one `Raccoon` root at the established `0.86` scene scale.
- `ForelegL`, `ForelegR`, `Head_BroadCheekMask`, and `Tail_Banded` are stable
  named pivots for existing presentation controls.
- Geometry and PBR materials are generated from the shared unit cuboid in the
  source script. No external model, texture, or added dependency is used.
- The `offer-note` and `greet` clips use named pivots; the host runtime owns
  when they play and when their animation mixer is stopped.

Regenerate from `Frontend/` with:

```sh
node tools/homepage-raccoon-assets/generate.mjs
```

The models are source assets only. The current mini-diorama preview still loads
the existing `models/laundromat/Laundromat.glb`; these two GLBs are not copied
to runtime or integrated into the laundromat scene by this task.

## Preview

The preview below is a Chrome render of both exported GLBs with the
`offer-note` and `greet` clips playing. It shows an activity pose from each
clip; the complete motion is stored as the named animation tracks in the GLBs.

![Rendered preview of both Raccoon models and their activity clips](./raccoons-activity-preview.png)
