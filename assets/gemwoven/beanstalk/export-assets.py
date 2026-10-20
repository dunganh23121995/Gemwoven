"""Normalize accepted ImageGen source art; does not draw or synthesize artwork."""
from pathlib import Path
import json

import numpy as np
from PIL import Image, ImageOps
from scipy.ndimage import binary_dilation, label

ROOT = Path(__file__).resolve().parent


def clean_disconnected_alpha(image):
    """Keep the connected painted subject plus its antialiasing fringe."""
    pixels = np.asarray(image.convert("RGBA")).copy()
    labels, _ = label(pixels[:, :, 3] > 16)
    sizes = np.bincount(labels.ravel())
    sizes[0] = 0
    keep = binary_dilation(labels == sizes.argmax(), iterations=2)
    pixels[~keep] = 0
    return Image.fromarray(pixels)


def save(name, image):
    image = clean_disconnected_alpha(image)
    image.save(ROOT / f"{name}.png")
    image.save(ROOT / f"{name}.webp", lossless=True, method=6)
    return image


leaf = save(
    "leaf-platform",
    ImageOps.mirror(Image.open(ROOT / "raw/leaf-platform.png")).resize(
        (512, 320), Image.Resampling.LANCZOS
    ),
)
stem = save(
    "stem-segment",
    Image.open(ROOT / "raw/stem-segment.png").resize(
        (256, 512), Image.Resampling.LANCZOS
    ),
)
branch_part = Image.open(ROOT / "raw/branch-segment-keyed.png").crop(
    (360, 190, 1704, 550)
).resize((240, 64), Image.Resampling.LANCZOS)
branch = Image.new("RGBA", (256, 96))
branch.alpha_composite(branch_part, (8, 16))
branch = save("branch-segment", branch)

for name, image in [("leaf-platform", leaf), ("stem-segment", stem), ("branch-segment", branch)]:
    assert image.mode == "RGBA"
    assert image.getchannel("A").getextrema() == (0, 255)
    decoded = Image.open(ROOT / f"{name}.webp").convert("RGBA")
    # Hidden RGB in fully transparent pixels is immaterial to compositing.
    for background in [(120, 130, 140, 255), (255, 255, 255, 255)]:
        png_view = Image.new("RGBA", image.size, background)
        webp_view = png_view.copy()
        png_view.alpha_composite(image)
        webp_view.alpha_composite(decoded)
        assert np.array_equal(np.asarray(png_view), np.asarray(webp_view))
    print(name, image.size, "alpha bounds", image.getbbox(), "PNG/WebP composites identical")
