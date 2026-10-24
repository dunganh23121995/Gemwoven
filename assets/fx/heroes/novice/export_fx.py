"""Pack Tân's Kiếm Nhiệt Huyết FX into runtime strips (ART.heroFx.novice).

Input: <name>/proc/raw-sheet-clean.png, the generate2dsprite.py processor's chroma-keyed copy of
<name>/raw-sheet.png (3x2 grid of 512px cells). Every cell is cut on the same grid and scaled by
the same factor, so the effect keeps its authored position from frame to frame (the processor's
per-frame centering would drag a growing slash around). Output: <name>.webp strip + fx.json.

  python assets/fx/heroes/novice/export_fx.py
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[3]
FX = {  # frame count, ms per frame, output cell
    "slash": (6, 55, 256),  # the big overhead chop: a golden crescent swept downward
    "burst": (6, 60, 256),  # the spirit burst where the blade lands
    "aura": (6, 90, 256),   # fighting-spirit flare that rises around him while he plants his feet
}


def despill(frame):
    """Warm gold FX on magenta: fade the remaining key spill and pull pink fringes back to gold."""
    a = np.asarray(frame, dtype=np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    spill = np.minimum(r, b) - g
    a[..., 3] *= 1 - np.clip((spill - 10) / 50, 0, 1)
    # Pink-violet tints left at soft edges become warm gold (blue never exceeds green here).
    a[..., 2] = np.minimum(b, g)
    return Image.fromarray(a.clip(0, 255).astype("uint8"), "RGBA")


meta = {}
for name, (count, duration, size) in FX.items():
    sheet = Image.open(ROOT / name / "proc/raw-sheet-clean.png").convert("RGBA")
    cols, cell = 3, sheet.width // 3
    strip = Image.new("RGBA", (size * count, size), (0, 0, 0, 0))
    for i in range(count):
        frame = sheet.crop(((i % cols) * cell, (i // cols) * cell, (i % cols + 1) * cell, (i // cols + 1) * cell))
        frame = despill(frame.resize((size, size), Image.Resampling.LANCZOS))
        strip.alpha_composite(frame, (size * i, 0))
    strip.save(ROOT / f"{name}.webp", "WEBP", lossless=True, method=6, exact=True)
    meta[name] = {"file": f"assets/fx/heroes/novice/{name}.webp", "count": count, "frameDuration": duration}
    print("[ok]", name)
(ROOT / "fx.json").write_text(json.dumps(meta, indent=2) + "\n", encoding="utf-8", newline="\n")
