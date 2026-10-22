"""Pack Noct's processed Grim Reaper FX frames into runtime strips.

Input: <name>/<name>-1..N.png (256px frames from generate2dsprite.py process).
Output: <name>.webp horizontal strip and fx.json metadata read by build.py.
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent
FX = {"mist": (8, 110), "slash": (6, 40), "hook": (6, 60), "fogcut": (6, 50)}  # frame count, ms per frame


def despill(frame):
    """Noct's FX are monochrome: fade magenta key spill, then drop every pixel to grey."""
    a = np.asarray(frame, dtype=np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    spill = np.minimum(r, b) - g
    a[..., 3] *= 1 - np.clip((spill - 6) / 40, 0, 1)
    grey = r * .3 + g * .59 + b * .11
    a[..., 0] = a[..., 1] = a[..., 2] = grey
    return Image.fromarray(a.clip(0, 255).astype("uint8"), "RGBA")


meta = {}
for name, (count, duration) in FX.items():
    strip = Image.new("RGBA", (256 * count, 256), (0, 0, 0, 0))
    for index in range(count):
        strip.alpha_composite(despill(Image.open(ROOT / name / f"{name}-{index + 1}.png").convert("RGBA")), (256 * index, 0))
    strip.save(ROOT / f"{name}.webp", "WEBP", lossless=True, method=6, exact=True)
    meta[name] = {"file": f"assets/fx/noct/{name}.webp", "count": count, "frameDuration": duration}
    print("[ok]", name)
(ROOT / "fx.json").write_text(json.dumps(meta, indent=2) + "\n", encoding="utf-8")
