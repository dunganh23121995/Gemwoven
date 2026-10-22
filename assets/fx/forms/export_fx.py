"""Pack the star-form skill FX (form 2 and 3 ultimates) into runtime strips.

Input: <hero>-<form>/fx-1..8.png (320px frames from generate2dsprite.py process).
Output: <hero>-<form>.webp horizontal strips and fx.json read by build.py.
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent
COUNT, CELL, FRAME_MS = 8, 320, 85
VIOLET_OK = {"lightning"}  # Lumi's storm is legitimately violet; others lose magenta key spill
MONOCHROME = {"shadow"}  # Noct's effects are black and silver only


def clean(frame, hero):
    a = np.asarray(frame, dtype=np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    if hero not in VIOLET_OK:
        spill = np.minimum(r, b) - g
        a[..., 3] *= 1 - np.clip((spill - 18) / 60, 0, 1)
        a[..., 0] = np.where(spill > 18, np.minimum(r, g + 18 + (r - g) * .3), r)
        a[..., 2] = np.where(spill > 18, np.minimum(b, g + 18 + (b - g) * .3), b)
    if hero in MONOCHROME:
        a[..., 0] = a[..., 1] = a[..., 2] = r * .3 + g * .59 + b * .11
    return Image.fromarray(a.clip(0, 255).astype("uint8"), "RGBA")


meta = {}
for folder in sorted(p for p in ROOT.iterdir() if p.is_dir()):
    hero, form = folder.name.rsplit("-", 1)
    strip = Image.new("RGBA", (CELL * COUNT, CELL), (0, 0, 0, 0))
    for index in range(COUNT):
        strip.alpha_composite(clean(Image.open(folder / f"fx-{index + 1}.png").convert("RGBA"), hero), (CELL * index, 0))
    strip.save(ROOT / f"{folder.name}.webp", "WEBP", lossless=True, method=6, exact=True)
    meta.setdefault(hero, {})[form] = {"file": f"assets/fx/forms/{folder.name}.webp", "count": COUNT, "frameDuration": FRAME_MS}
    print("[ok]", folder.name)
(ROOT / "fx.json").write_text(json.dumps(meta, indent=2) + "\n", encoding="utf-8")
