"""Pack the departure effects (hero-departures.js) into runtime strips.

Input: <folder>/raw-sheet.png, a 3x2 Codex sheet on #FF00FF. Every cell is cut on the grid and
keyed in place (no per-frame refit, so a hopping rabbit keeps its hop and a sprout its ground),
then scaled down uniformly to 256 px. Output: <name>.webp strips and fx.json, read by build.py.
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent
FX = {"fox": ("mika", 80), "rabbit": ("yuki", 95), "comet": ("lumi", 90), "sprout": ("nori", 70), "dust": ("tan", 85)}  # folder, ms per frame


def key(cell):
    c = np.asarray(cell.convert("RGB"), dtype=np.float32)
    r, g, b = c[..., 0], c[..., 1], c[..., 2]
    k = np.minimum(r, b) - g
    alpha = np.clip(1 - (k - 60) / 90, 0, 1)
    spill = np.clip(k / 255, 0, 1)
    c[..., 0] = np.where(k > 0, np.minimum(r, g + (r - g) * (1 - spill)), r)
    c[..., 2] = np.where(k > 0, np.minimum(b, g + (b - g) * (1 - spill)), b)
    return Image.fromarray(np.concatenate([c, alpha[..., None] * 255], -1).clip(0, 255).astype("uint8"), "RGBA")


meta = {}
for name, (folder, ms) in FX.items():
    raw = Image.open(ROOT / folder / "raw-sheet.png"); w, h = raw.width // 3, raw.height // 2
    strip = Image.new("RGBA", (256 * 6, 256), (0, 0, 0, 0))
    for i in range(6):
        cell = key(raw.crop(((i % 3) * w, (i // 3) * h, (i % 3 + 1) * w, (i // 3 + 1) * h)))
        strip.alpha_composite(cell.resize((256, round(256 * h / w)), Image.Resampling.LANCZOS).crop((0, 0, 256, 256)), (256 * i, 0))
    strip.save(ROOT / f"{name}.webp", "WEBP", lossless=True, method=6, exact=True)
    meta[name] = {"file": f"assets/fx/depart/{name}.webp", "count": 6, "frameDuration": ms}
    print("[ok]", name)
(ROOT / "fx.json").write_text(json.dumps(meta, indent=2) + "\n", encoding="utf-8")
