"""Crop and resize accepted ImageGen artwork; no procedural artwork generation."""
from pathlib import Path
import json

import numpy as np
from PIL import Image
from scipy.ndimage import binary_dilation, label

ROOT = Path(__file__).resolve().parent


def cleaned(path):
    image = Image.open(path).convert("RGBA")
    rgba = np.asarray(image).copy()
    labels, _ = label(rgba[:, :, 3] > 16)
    sizes = np.bincount(labels.ravel())
    sizes[0] = 0
    keep = binary_dilation(labels == sizes.argmax(), iterations=2)
    rgba[~keep] = 0
    return Image.fromarray(rgba)


def export(name, crop, size, position, canvas_size):
    source = cleaned(ROOT / "raw" / f"{name}.png")
    part = source.crop(crop).resize(size, Image.Resampling.LANCZOS)
    result = Image.new("RGBA", canvas_size)
    result.alpha_composite(part, position)
    result.save(ROOT / f"{name}.png")
    result.save(ROOT / f"{name}.webp", lossless=True, method=6)
    print(name, result.size, "visible bounds", result.getbbox(),
          "alpha", result.getchannel("A").getextrema())
    return result


if __name__ == "__main__":
    export("hanging-card", (114, 7, 910, 1480), (240, 368), (8, 8), (256, 384))
    export("gold-chain", (414, 250, 544, 1274), (32, 256), (8, 0), (48, 256))
    export("vine-terminal-left", (81, 37, 887, 1408), (164, 224), (8, 8), (180, 240))
