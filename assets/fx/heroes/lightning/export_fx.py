"""Lumi's form 2/3 skill FX (src/forms-lumi.js): green-keyed Codex sheets -> horizontal runtime strips.

Input:  <name>/raw-sheet.png (gpt-6-astra high, solid #00FF00 key; prompt in <name>/prompt-used.txt)
Output: <name>/<name>-N.png frames, <name>.webp strip, fx.json (read by build.py as ART.heroFx.lightning).
Each grid cell is cut on the grid, keyed (same maths as assets/heroes/forms/lightning/tools/green_master.py),
edge-despilled and resized as a whole to the strip cell: positions stay exactly where Codex drew them.
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent
# name: (cols, rows, count, output cell px, ms per frame)
FX = {
    "star": (2, 2, 4, 192, 70),
    "starpop": (3, 2, 6, 256, 55),
    "groundstrike": (3, 2, 6, 256, 60),
    "pentagram": (3, 2, 6, 384, 90),
    "starbolt": (2, 2, 4, 384, 55),
    "galaxy": (2, 2, 4, 384, 120),
    "orbitbolt": (2, 2, 4, 192, 70),
    "ringburst": (3, 2, 6, 256, 55),
    "idlestar": (2, 2, 4, 96, 160),
}


def key_green(cell):
    c = np.asarray(cell.convert("RGB"), dtype=np.float32)
    r, g, b = c[..., 0], c[..., 1], c[..., 2]
    key = g - np.maximum(r, b)
    alpha = np.clip(1 - (key - 60) / 90, 0, 1)
    spill = np.clip(key / 255, 0, 1)
    c[..., 1] = np.where(key > 0, np.maximum(r, b) + (g - np.maximum(r, b)) * (1 - spill), g)
    # drop isolated key-noise specks (tiny components far from anything)
    solid = alpha > .5
    lab, n = ndimage.label(ndimage.binary_dilation(solid, iterations=4))
    if n:
        sizes = ndimage.sum(solid, lab, range(1, n + 1))
        keep = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s >= 12])
        alpha = alpha * keep
    rgba = np.concatenate([c, alpha[..., None] * 255], -1).clip(0, 255).astype(np.int32)
    R, G, B, A = rgba[..., 0], rgba[..., 1], rgba[..., 2], rgba[..., 3]
    edge = (ndimage.distance_transform_edt(A > 128) <= 2.5) | (A < 250)
    cap = np.maximum(R, B)
    rgba[..., 1] = np.where(edge & (A > 0) & (G > cap), cap, G)
    return Image.fromarray(rgba.clip(0, 255).astype("uint8"), "RGBA")


meta = {}
for name, (cols, rows, count, size, duration) in FX.items():
    raw = Image.open(ROOT / name / "raw-sheet.png")
    cw, ch = raw.width // cols, raw.height // rows
    strip = Image.new("RGBA", (size * count, size), (0, 0, 0, 0))
    for i in range(count):
        cell = raw.crop(((i % cols) * cw, (i // cols) * ch, (i % cols + 1) * cw, (i // cols + 1) * ch))
        frame = key_green(cell).resize((size, size), Image.Resampling.LANCZOS)
        frame.save(ROOT / name / f"{name}-{i + 1}.png")
        strip.alpha_composite(frame, (size * i, 0))
    strip.save(ROOT / f"{name}.webp", "WEBP", quality=92, alpha_quality=100, method=6)
    meta[name] = {"file": f"assets/fx/heroes/lightning/{name}.webp", "count": count, "frameDuration": duration}
    print("[ok]", name, strip.size)
(ROOT / "fx.json").write_text(json.dumps(meta, indent=2) + "\n", encoding="utf-8")
