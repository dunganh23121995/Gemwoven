"""Montage of the frames qa/gemwoven/capture-elites.cjs filmed: python qa/gemwoven/strip-elites.py <id> [beat ...] writes
qa/gemwoven/elites/<id>-strip.jpg with one row per beat."""
import sys
from pathlib import Path

from PIL import Image

OUT = Path(__file__).resolve().parent / "elites"
e, *beats = sys.argv[1:]
beats = beats or ["basic", "skill1", "skill2"]
rows = [sorted(OUT.glob(f"{e}-{b}-*.jpg")) for b in beats]
first = Image.open(rows[0][0])
w, h = 300, round(300 * first.height / first.width)
n = max(len(r) for r in rows)
sheet = Image.new("RGB", (w * min(n, 6), h * sum((len(r) + 5) // 6 for r in rows)), (20, 20, 24))
y = 0
for r in rows:
    for k, f in enumerate(r):
        sheet.paste(Image.open(f).resize((w, h)), ((k % 6) * w, y + (k // 6) * h))
    y += h * ((len(r) + 5) // 6)
sheet.save(OUT / f"{e}-strip.jpg", quality=85)
print(OUT / f"{e}-strip.jpg", sheet.size)
