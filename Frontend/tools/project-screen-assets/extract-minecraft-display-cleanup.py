#!/usr/bin/env python3
"""Remove the baked sample copy from the Minecraft washer display source pixels."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[3]
SOURCE = ROOT / "Docs/design/references/01-minecraft.png"
OUTPUT = ROOT / "Frontend/public/assets/project-screen/layers/scene-minecraft-display-cleanup.png"
CANVAS = (1672, 941)
TEXT_BOXES = ((500, 396, 620, 414), (500, 417, 635, 438))
MAX_MASK_BOUNDS = (503, 393, 638, 441)
CORE_THRESHOLD = 145
MASK_THRESHOLD = 115


def luminance(pixel: tuple[int, ...]) -> int:
    red, green, blue = pixel[:3]
    return (299 * red + 587 * green + 114 * blue) // 1000


def is_neutral_bright(pixel: tuple[int, ...], threshold: int) -> bool:
    red, green, blue = pixel[:3]
    return min(red, green, blue) >= threshold and max(red, green, blue) - min(red, green, blue) <= 75


def build_cleanup(source_path: Path, output_path: Path) -> tuple[tuple[int, int, int, int], int]:
    with Image.open(source_path) as opened:
        source = opened.convert("RGBA")

    if source.size != CANVAS:
        raise ValueError(f"Expected the approved {CANVAS[0]} by {CANVAS[1]} source, got {source.size}.")

    source_pixels = source.load()
    mask = Image.new("L", CANVAS, 0)
    mask_pixels = mask.load()
    core_pixels: list[tuple[int, int]] = []

    for left, top, right, bottom in TEXT_BOXES:
        for y in range(top, bottom):
            for x in range(left, right):
                pixel = source_pixels[x, y]
                if is_neutral_bright(pixel, MASK_THRESHOLD):
                    mask_pixels[x, y] = 255
                if is_neutral_bright(pixel, CORE_THRESHOLD):
                    core_pixels.append((x, y))

    mask = mask.filter(ImageFilter.MaxFilter(5))
    mask_bounds = mask.getbbox()
    if mask_bounds is None or not core_pixels:
        raise ValueError("The washer display text mask was empty; source may have changed.")
    if not (
        MAX_MASK_BOUNDS[0] <= mask_bounds[0]
        and MAX_MASK_BOUNDS[1] <= mask_bounds[1]
        and mask_bounds[2] <= MAX_MASK_BOUNDS[2]
        and mask_bounds[3] <= MAX_MASK_BOUNDS[3]
    ):
        raise ValueError(f"Text mask escaped its measured display area: {mask_bounds}.")

    mask_pixels = mask.load()
    left, top, right, bottom = mask_bounds
    region_bounds = (
        max(0, left - 1),
        max(0, top - 1),
        min(CANVAS[0], right + 1),
        min(CANVAS[1], bottom + 1),
    )
    left, top, _, _ = region_bounds
    source_region = source.crop(region_bounds).convert("RGB")
    region_pixels = source_region.load()
    mask_region = mask.crop(region_bounds).load()
    width, height = source_region.size
    current = [[region_pixels[x, y] for x in range(width)] for y in range(height)]
    masked = [
        (x, y)
        for y in range(height)
        for x in range(width)
        if mask_region[x, y]
    ]

    # Harmonic interpolation preserves the plate's local tone without painting a flat rectangle.
    for _ in range(250):
        updated = [row.copy() for row in current]
        for x, y in masked:
            neighbors = (
                current[y][x - 1],
                current[y][x + 1],
                current[y - 1][x],
                current[y + 1][x],
            )
            updated[y][x] = tuple(
                round(sum(neighbor[channel] for neighbor in neighbors) / 4)
                for channel in range(3)
            )
        current = updated

    patch = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    patch_pixels = patch.load()
    for x, y in masked:
        patch_pixels[left + x, top + y] = (*current[y][x], 255)

    composite = Image.alpha_composite(source, patch)
    composite_pixels = composite.load()
    if any(
        not mask_pixels[x, y] or luminance(composite_pixels[x, y]) >= 120
        for x, y in core_pixels
    ):
        raise ValueError("The baked display lettering remains visible after cleanup.")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    patch.save(output_path, format="PNG", optimize=False)
    return mask_bounds, len(masked)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=SOURCE)
    parser.add_argument("--output", type=Path, default=OUTPUT)
    args = parser.parse_args()

    bounds, pixels = build_cleanup(args.source, args.output)
    print(f"Created {args.output}; covered {pixels} source pixels within {bounds}.")


if __name__ == "__main__":
    main()
