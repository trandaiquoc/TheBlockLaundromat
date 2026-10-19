#!/usr/bin/env python3
"""Remove baked board-header labels so real Angular controls can be visible."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[3]
SOURCE = ROOT / "Docs/design/references/01-minecraft.png"
OUTPUT = (
    ROOT / "Frontend/public/assets/project-screen/layers/scene-minecraft-board-header-cleanup.png"
)
CANVAS = (1672, 941)
TEXT_REGIONS = (
    ((1066, 338, 1209, 374), 336, 145),
    ((1238, 336, 1350, 358), 335, 175),
    ((1410, 328, 1490, 355), 327, 150),
)


def gray(pixel: tuple[int, ...]) -> int:
    return (pixel[0] + pixel[1] + pixel[2]) // 3


def fill_header_rows(source: Image.Image) -> Image.Image:
    source_pixels = source.load()
    patch = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    patch_pixels = patch.load()

    for (left, top, right, bottom), sample_y, _ in TEXT_REGIONS:
        for x in range(left, right):
            color = source_pixels[x, sample_y][:3]
            for y in range(top, bottom):
                patch_pixels[x, y] = (*color, 255)

    return patch


def expected_alpha() -> Image.Image:
    alpha = Image.new("L", CANVAS, 0)
    draw = ImageDraw.Draw(alpha)
    for (left, top, right, bottom), _, _ in TEXT_REGIONS:
        draw.rectangle((left, top, right - 1, bottom - 1), fill=255)
    return alpha


def build_cleanup(source_path: Path, output_path: Path) -> tuple[tuple[int, int, int, int], int]:
    with Image.open(source_path) as opened:
        source = opened.convert("RGBA")
    if source.size != CANVAS:
        raise ValueError(
            f"Expected the approved {CANVAS[0]} by {CANVAS[1]} source, got {source.size}."
        )

    source_pixels = source.load()
    core_points: list[tuple[int, int, int]] = []

    for (left, top, right, bottom), _, fill_gray_minimum in TEXT_REGIONS:
        for y in range(top, bottom):
            for x in range(left, right):
                pixel = source_pixels[x, y]
                if gray(pixel) < fill_gray_minimum - 5:
                    core_points.append((x, y, fill_gray_minimum))

    if not core_points:
        raise ValueError("No source text pixels were found in the measured header regions.")

    patch = fill_header_rows(source)
    composite = Image.alpha_composite(source, patch)
    composite_pixels = composite.load()
    remaining = [
        (x, y)
        for x, y, fill_gray_minimum in core_points
        if gray(composite_pixels[x, y]) < fill_gray_minimum
    ]
    if remaining:
        samples = [(x, y, gray(composite_pixels[x, y])) for x, y in remaining[:12]]
        raise ValueError(
            f"Baked header glyph pixels remain after cleanup: {len(remaining)}; samples={samples}."
        )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    patch.save(output_path, format="PNG", optimize=True)
    with Image.open(output_path) as saved:
        saved_patch = saved.convert("RGBA")
    if saved_patch.size != CANVAS or saved_patch.getbbox() is None:
        raise ValueError("Saved header cleanup has an invalid canvas or empty alpha.")
    if saved_patch.getchannel("A").tobytes() != expected_alpha().tobytes():
        raise ValueError("Saved cleanup alpha extends outside the three measured text regions.")
    if Image.alpha_composite(source, saved_patch).tobytes() != composite.tobytes():
        raise ValueError("Saved cleanup pixels differ from the validated in-memory composite.")

    bounds = (
        min(region[0][0] for region in TEXT_REGIONS),
        min(region[0][1] for region in TEXT_REGIONS),
        max(region[0][2] for region in TEXT_REGIONS),
        max(region[0][3] for region in TEXT_REGIONS),
    )
    pixels = sum(
        (region[0][2] - region[0][0]) * (region[0][3] - region[0][1])
        for region in TEXT_REGIONS
    )
    return bounds, pixels


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=SOURCE)
    parser.add_argument("--output", type=Path, default=OUTPUT)
    arguments = parser.parse_args()
    bounds, pixels = build_cleanup(arguments.source, arguments.output)
    print(f"Created {arguments.output}; cleaned {pixels} source pixels within {bounds}.")


if __name__ == "__main__":
    main()
