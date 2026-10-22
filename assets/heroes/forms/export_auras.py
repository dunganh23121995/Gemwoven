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
# Auras with no legitimate violet: magenta key spill in their glows is removed.
DESPILL = {"fire", "ice", "earth", "shadow"}  # lightning keeps its violet


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


# Optional front layer (aura/front/front-1..8.png) drawn over the body, e.g. Noct's waist sash.
# The union of its frames is scaled to `width` and its lowest point placed on `bottom`, in the
# 256px cell of the back layer (shoulder scarf about y 115, foot cushion top about y 195).
FRONT = {
    "shadow": {"width": 116, "bottom": 170},
    # Raw-cell auras below: head top about y 72, shoulders 115, waist 154, feet 210.
    "fire": {"width": 74, "bottom": 202},       # flame tail across the shins
    "ice": {"width": 84, "bottom": 190},        # frost mist across the knees
    "earth": {"width": 82, "bottom": 166},      # leafy vine across the waist
    "lightning": {"width": 104, "bottom": 166},  # front of the comet trail at the waist
}
# These sheets were drawn on a fixed imaginary-hero layout (feet at 82% of the cell), so
# each raw cell is resized whole instead of fitted to its content.
RAW_CELL = {"fire", "ice", "earth", "lightning"}


PROCESSOR = Path.home() / ".codex/skills/generate2dsprite/scripts/generate2dsprite.py"


def raw_cells(hero: str) -> list[Image.Image]:
    aura_dir = FORMS / hero / "aura"
    if not (aura_dir / "raw-sheet-clean.png").exists():
        # The chroma-keyed sheet is a gitignored intermediate; rebuild it from the raw sheet.
        import subprocess
        import tempfile
        with tempfile.TemporaryDirectory() as tmp:
            subprocess.run([sys.executable, str(PROCESSOR), "process", "--input", str(aura_dir / "raw-sheet.png"), "--target", "asset",
                            "--mode", "aura", "--output-dir", tmp, "--rows", "4", "--cols", "2", "--cell-size", str(CELL),
                            "--component-mode", "all"], check=True, capture_output=True)
            Image.open(Path(tmp) / "raw-sheet-clean.png").save(aura_dir / "raw-sheet-clean.png")
    clean = Image.open(aura_dir / "raw-sheet-clean.png").convert("RGBA")
    w, h = clean.width / 2, clean.height / 4
    return [clean.crop((round(c * w), round(r * h), round((c + 1) * w), round((r + 1) * h))).resize((CELL, CELL), Image.Resampling.LANCZOS)
            for r in range(4) for c in range(2)]


def export_front(hero: str, rel: str):
    spec, folder = FRONT.get(hero), FORMS / hero / "aura" / "front"
    if not spec or not (folder / "front-1.png").exists():
        return None
    frames = [Image.open(folder / f"front-{i}.png").convert("RGBA") for i in range(1, COUNT + 1)]
    boxes = [f.getbbox() for f in frames]
    left, top = min(b[0] for b in boxes), min(b[1] for b in boxes)
    right, bottom = max(b[2] for b in boxes), max(b[3] for b in boxes)
    scale = spec["width"] / (right - left)
    strip = Image.new("RGBA", (CELL * COUNT, CELL), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        crop = despill(frame.crop((left, top, right, bottom)))
        crop = crop.resize((round(crop.width * scale), round(crop.height * scale)), Image.Resampling.LANCZOS)
        strip.alpha_composite(crop, (index * CELL + (CELL - crop.width) // 2, spec["bottom"] - crop.height))
    strip.save(folder / "front.webp", "WEBP", lossless=True, quality=100, method=6, exact=True)
    return f"{rel}/front/front.webp"


def export(hero: str) -> bool:
    aura_dir = FORMS / hero / "aura"
    frames = [aura_dir / f"aura-{i}.png" for i in range(1, COUNT + 1)]
    missing = [p.name for p in frames if not p.exists()]
    if missing:
        print(f"[skip] {hero}: missing {', '.join(missing)}")
        return False
    if hero in RAW_CELL:
        frames = raw_cells(hero)
    strip = Image.new("RGBA", (CELL * COUNT, CELL), (0, 0, 0, 0))
    for index, path in enumerate(frames):
        frame = path if isinstance(path, Image.Image) else Image.open(path).convert("RGBA")
        if hero in DESPILL:
            frame = despill(frame)
        if frame.size != (CELL, CELL):
            raise ValueError(f"{hero} frame {index + 1} is {frame.size}, expected {CELL}x{CELL}")
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
    front = export_front(hero, rel)
    if front:
        meta["front"] = front
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
