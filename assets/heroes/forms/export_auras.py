"""Assemble processed final-form aura frames into runtime strips.

Input per hero: assets/heroes/forms/<hero>/aura/aura-1.png .. aura-8.png
(256x256 RGBA frames written by generate2dsprite.py process --mode aura,
read order left-to-right, top-to-bottom of the 2x4 raw grid).

Output per hero:
  aura.webp  2048x256 lossless RGBA horizontal strip (8 frames)
  ../aura.json  runtime metadata read by both builds

Usage: python assets/heroes/forms/export_auras.py [hero ...]
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image

FORMS = Path(__file__).resolve().parent
HEROES = ("fire", "earth", "ice", "lightning", "shadow")
COUNT = 8
CELL = 256
FRAME_DURATION = {"shadow": 190}
# Elements with no legitimate violet: magenta key spill in their glows is removed.
DESPILL = {"fire", "ice", "earth"}


def despill(frame: Image.Image) -> Image.Image:
    """Fade pixels whose red and blue both exceed green (chroma-key spill)."""
    import numpy as np
    a = np.asarray(frame, dtype=np.float32)
    r, g, b, alpha = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    spill = np.minimum(r, b) - g
    fade = np.clip((spill - 24) / 70, 0, 1)
    a[..., 3] = alpha * (1 - fade)
    a[..., 0] = np.where(spill > 24, np.minimum(r, g + 24 + (r - g) * .3), r)
    a[..., 2] = np.where(spill > 24, np.minimum(b, g + 24 + (b - g) * .3), b)
    return Image.fromarray(a.clip(0, 255).astype("uint8"), "RGBA")


def export(hero: str) -> bool:
    aura_dir = FORMS / hero / "aura"
    frames = [aura_dir / f"aura-{i}.png" for i in range(1, COUNT + 1)]
    missing = [p.name for p in frames if not p.exists()]
    if missing:
        print(f"[skip] {hero}: missing {', '.join(missing)}")
        return False
    strip = Image.new("RGBA", (CELL * COUNT, CELL), (0, 0, 0, 0))
    for index, path in enumerate(frames):
        frame = Image.open(path).convert("RGBA")
        if hero in DESPILL:
            frame = despill(frame)
        if frame.size != (CELL, CELL):
            raise ValueError(f"{path} is {frame.size}, expected {CELL}x{CELL}")
        strip.paste(frame, (index * CELL, 0))
    strip.save(aura_dir / "aura.webp", "WEBP", lossless=True, quality=100, method=6, exact=True)
    rel = f"assets/heroes/forms/{hero}/aura"
    meta = {
        "file": f"{rel}/aura.webp",
        "count": COUNT,
        "cols": COUNT,
        "rows": 1,
        "frameDuration": FRAME_DURATION.get(hero, 160),
        "prompt": f"{rel}/prompt-used.txt",
    }
    # build.py and scripts/build_gemwoven.py read forms/<hero>/aura.json.
    (FORMS / hero / "aura.json").write_text(json.dumps(meta) + "\n", encoding="utf-8")
    print(f"[ok] {hero}: {rel}/aura.webp")
    return True


def main() -> int:
    heroes = sys.argv[1:] or list(HEROES)
    results = [export(hero) for hero in heroes]
    return 0 if all(results) else 1


if __name__ == "__main__":
    sys.exit(main())
