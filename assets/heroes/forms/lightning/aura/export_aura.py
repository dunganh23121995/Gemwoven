"""Lumi's six-star aura (src/gemwoven/form-effects.js), redrawn sharp at 512px cells and without its comets.

The old strip drew two comet arcs in every frame; cross-faded frame to frame they faded in place instead of
circling her. Now the strip holds only what twinkles where it is (stars, the shoulder spark, the dust under her
feet) and the comets are one drawn ring that CSS spins round a tilted orbit (.aura-orbit in hero-forms.css).

Input:  sharp/raw-sheet.png  2 x 2 Codex sheet (gpt-6.1-sol low, #00FF00 key; sharp/prompt-used.txt)
        comet/raw-sheet.png  Codex drew two comets round one circle, but running opposite ways: the upper one (head
                             at the top, its trail down the left) is kept and turned half a circle for its partner
Output: aura.webp (8 frames: the four drawn twice, for the aura clock's eight steps), comet/comet.webp, aura.json
"""
import importlib.util
import json
from pathlib import Path

import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[4]
spec = importlib.util.spec_from_file_location("lumi_fx", ROOT / "assets/fx/heroes/lightning/export_fx.py")
fx = importlib.util.module_from_spec(spec); spec.loader.exec_module(fx)
CELL = 512


def aura():
    raw = Image.open(HERE / "sharp/raw-sheet.png")
    cw, ch = raw.width // 2, raw.height // 2
    cells = [fx.key_green(raw.crop(((i % 2) * cw, (i // 2) * ch, (i % 2 + 1) * cw, (i // 2 + 1) * ch)), True).resize((CELL, CELL), Image.Resampling.LANCZOS)
             for i in range(4)]
    strip = Image.new("RGBA", (CELL * 8, CELL))
    for i in range(8):
        strip.alpha_composite(cells[i % 4], (CELL * i, 0))
    strip.save(HERE / "aura.webp", "WEBP", quality=92, alpha_quality=100, method=6)


def comet():
    keyed = fx.key_green(Image.open(HERE / "comet/raw-sheet.png"), True)
    a = np.asarray(keyed, dtype=np.float32)
    ys, xs = np.where(a[..., 3] > 128)
    # the circle through the drawn trails (least squares: x^2 + y^2 + Dx + Ey + F = 0)
    D, E, F = np.linalg.lstsq(np.c_[xs, ys, np.ones_like(xs)], -(xs ** 2 + ys ** 2).astype(np.float64), rcond=None)[0]
    cx, cy = -D / 2, -E / 2
    r = (cx * cx + cy * cy - F) ** .5
    # a square centred on the circle, the circle 76% of its width (as the CSS orbit expects)
    side = round(r / .38)
    canvas = Image.new("RGBA", (side, side))
    canvas.paste(keyed, (round(side / 2 - cx), round(side / 2 - cy)))
    upper = np.asarray(canvas).copy(); upper[side // 2:] = 0
    upper = Image.fromarray(upper, "RGBA")
    ring = upper.copy(); ring.alpha_composite(upper.rotate(180))
    ring.resize((CELL, CELL), Image.Resampling.LANCZOS).save(HERE / "comet/comet.webp", "WEBP", quality=92, alpha_quality=100, method=6)
    print(f"comet circle centre {cx:.0f},{cy:.0f} radius {r:.0f}")


if __name__ == "__main__":
    aura(); comet()
    meta = json.loads((HERE.parent / "aura.json").read_text(encoding="utf-8"))
    meta.pop("front", None)       # the old front strip was the near comet arc; the orbit's near half replaces it
    meta.update(prompt="assets/heroes/forms/lightning/aura/sharp/prompt-used.txt", comet="assets/heroes/forms/lightning/aura/comet/comet.webp")
    (HERE.parent / "aura.json").write_text(json.dumps(meta) + "\n", encoding="utf-8")
