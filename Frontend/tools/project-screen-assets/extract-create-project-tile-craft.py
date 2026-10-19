#!/usr/bin/env python3
"""Extract and verify the source-derived Minecraft Create Project tile."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageChops


SOURCE_SIZE = (1672, 941)
SOURCE_RECT = (1026, 385, 1168, 541)
REPOSITORY_ROOT = Path(__file__).resolve().parents[3]


def extract(source_path: Path, output_path: Path) -> None:
    with Image.open(source_path) as source_image:
        source = source_image.convert("RGBA")
    if source.size != SOURCE_SIZE:
        raise ValueError(f"Expected source size {SOURCE_SIZE}, got {source.size}")

    crop = source.crop(SOURCE_RECT)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    crop.save(output_path, optimize=True)

    with Image.open(output_path) as saved_image:
        saved = saved_image.convert("RGBA")
    difference = ImageChops.difference(crop, saved)
    if saved.size != crop.size or difference.getbbox() is not None:
        raise RuntimeError("Saved tile does not match the measured source crop")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--source",
        type=Path,
        default=REPOSITORY_ROOT / "Docs/design/references/01-minecraft.png",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=REPOSITORY_ROOT
        / "Frontend/public/assets/project-screen/layers/create-project-tile-craft.png",
    )
    arguments = parser.parse_args()
    extract(arguments.source, arguments.output)
    print(f"Verified source-identical tile: {arguments.output}")


if __name__ == "__main__":
    main()
