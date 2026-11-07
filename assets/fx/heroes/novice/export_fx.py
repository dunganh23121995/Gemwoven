"""Pack Tân's Kiếm Nhiệt Huyết FX into runtime strips (ART.heroFx.novice).

Input: <name>/raw-sheet.png (3x2 grid of 512px cells, solid #FF00FF), keyed here by the generate2dsprite.py
processor. Plain redesign (owner 07/11, fx_prompts_plain.py): a wooden-sword chop, a dust burst and a dust swirl. Every cell is cut on the same grid and scaled by
the same factor, so the effect keeps its authored position from frame to frame (the processor's
per-frame centering would drag a growing slash around). Output: <name>.webp strip + fx.json.

  python assets/fx/heroes/novice/export_fx.py
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image

from export_form_fx import g2d, unpink

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[3]
FX = {  # frame count, ms per frame, output cell
    "slash": (6, 55, 256),  # the big overhead chop: a plain air trail swept downward
    "burst": (6, 60, 256),  # the white flash and dust puff where the wooden blade lands
    "aura": (6, 90, 256),   # a low swirl of dust and leaves round his feet while he plants them
}


def despill(frame):
    """Beige and white FX on magenta: fade the remaining key spill and pull pink fringes back to beige."""
    a = np.asarray(frame, dtype=np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    spill = np.minimum(r, b) - g
    a[..., 3] *= 1 - np.clip((spill - 10) / 50, 0, 1)
    # Pink-violet tints left at soft edges become beige (blue never exceeds green here).
    unpink(a)
    a[..., 2] = np.minimum(a[..., 2], a[..., 1])
    return Image.fromarray(a.clip(0, 255).astype("uint8"), "RGBA")


meta = {}
for name, (count, duration, size) in FX.items():
    sheet = g2d.remove_bg_magenta(Image.open(ROOT / name / "raw-sheet.png").convert("RGBA"), 100, 150)
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
