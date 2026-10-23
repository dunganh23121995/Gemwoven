"""Pack every chapter boss's signature skill FX into runtime strips.

Input: <boss>/fx-1..6.png (256px frames from generate2dsprite.py process).
Output: <boss>.webp horizontal strips and fx.json read by the build.
Usage: python export_fx.py            rebuild every boss that has frames
       python export_fx.py --preview  also write <boss>-preview.png (dark backdrop) into PREVIEW_DIR for review
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent
COUNT, CELL, FRAME_MS = 6, 256, 70
ORDER = ["earth", "fire", "ice", "lightning", "mire", "scarab", "leviathan", "colossus", "prism", "reaper", "roc", "briar",
         "seraph", "eclipse", "elderbloom", "cinderheart", "frostregent", "tempestwing", "souljailer", "sporefather",
         "prismback", "sandchronarch", "coraltide", "moonfang"]
# Bosses whose own art is genuinely violet/purple: only near-pure magenta (red ~= blue) counts as key spill there.
VIOLET_OK = {"lightning", "eclipse", "souljailer", "moonfang", "prism"}
PINK_OK = {"leviathan", "coraltide"}  # coral pink is part of these bosses' art


def clean(frame, boss):
    a = np.asarray(frame, dtype=np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    spill = np.minimum(r, b) - g
    if boss in VIOLET_OK:
        spill = spill - 1.5 * np.abs(r - b)
    a[..., 3] *= 1 - np.clip((spill - 18) / 60, 0, 1)
    a[..., 0] = np.where(spill > 18, np.minimum(r, g + 18 + (r - g) * .3), r)
    a[..., 2] = np.where(spill > 18, np.minimum(b, g + 18 + (b - g) * .3), b)
    if boss not in VIOLET_OK:  # no purple in this palette: also neutralise the faint lilac cast the key bleeds into whites
        tint = np.clip(np.minimum(a[..., 0], a[..., 2]) - a[..., 1], 0, None) * .85
        a[..., 0] -= tint
        a[..., 2] -= tint
        if boss not in PINK_OK:  # and fold key-blended salmon/pink (red-dominant, blue close to green) back toward orange
            r, g, b = a[..., 0], a[..., 1], a[..., 2]
            a[..., 2] = np.where((r > g + 40) & (b > g * .75), g * .5, b)
    return Image.fromarray(a.clip(0, 255).astype("uint8"), "RGBA")


def build(boss):
    strip = Image.new("RGBA", (CELL * COUNT, CELL), (0, 0, 0, 0))
    for index in range(COUNT):
        strip.alpha_composite(clean(Image.open(ROOT / boss / f"fx-{index + 1}.png").convert("RGBA"), boss), (CELL * index, 0))
    strip.save(ROOT / f"{boss}.webp", "WEBP", lossless=True, method=6, exact=True)
    return strip


if __name__ == "__main__":
    preview = sys.argv[2] if len(sys.argv) > 2 and sys.argv[1] == "--preview" else None
    meta = {}
    for boss in ORDER:
        if not (ROOT / boss / f"fx-{COUNT}.png").exists():
            continue
        strip = build(boss)
        meta[boss] = {"file": f"assets/fx/bosses/{boss}.webp", "count": COUNT, "frameDuration": FRAME_MS}
        if preview:
            board = Image.new("RGBA", strip.size, (34, 38, 48, 255))
            board.alpha_composite(strip)
            board.convert("RGB").save(Path(preview) / f"{boss}-preview.png")
        print("[ok]", boss)
    (ROOT / "fx.json").write_text(json.dumps(meta, indent=2) + "\n", encoding="utf-8")
