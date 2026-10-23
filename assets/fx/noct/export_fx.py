"""Pack Noct's processed Grim Reaper FX frames into runtime strips.

Input: <name>/<name>-1..N.png (256px frames from generate2dsprite.py process).
Output: <name>.webp horizontal strip and fx.json metadata read by build.py.
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent
FX = {"slash": (6, 40), "hook": (6, 60), "fogcut": (6, 50)}  # mist/ is the retired painted fog, kept as source  # frame count, ms per frame


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
# Smoke puffs: black smoke on white, so darkness becomes alpha and the soft wisps stay soft.
raw = Image.open(ROOT / "puffs/raw-sheet.png").convert("L")
cell = raw.width // 2
strip = Image.new("RGBA", (256 * 4, 256), (0, 0, 0, 0))
for index in range(4):
    crop = np.asarray(raw.crop(((index % 2) * cell, (index // 2) * cell, (index % 2 + 1) * cell, (index // 2 + 1) * cell)).resize((256, 256), Image.Resampling.LANCZOS), dtype=np.float32)
    alpha = np.clip((250 - crop) / 190, 0, 1) ** 1.15
    shade = np.clip(crop * .55, 0, 70)  # keep the folds' grey modelling, darkened
    rgba = np.dstack([shade, shade, shade * 1.02, alpha * 255]).clip(0, 255).astype("uint8")
    strip.alpha_composite(Image.fromarray(rgba, "RGBA"), (256 * index, 0))
strip.save(ROOT / "puffs.webp", "WEBP", quality=90, alpha_quality=95, method=6)
meta["puffs"] = {"file": "assets/fx/noct/puffs.webp", "count": 4, "frameDuration": 0}
print("[ok] puffs")
(ROOT / "fx.json").write_text(json.dumps(meta, indent=2) + "\n", encoding="utf-8")
