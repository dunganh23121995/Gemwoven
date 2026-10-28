"""Mika form 2: the hub's resting loop is the combat idle itself.

Her showcase stands in the combat guard (showcase/master.png is the combat idle's drawing), and the
combat idle (form-2/idle.webp, wind_idle.py) already keeps her face and body as the approved drawing
while only the hair, cloth and tail move. Codex's own showcase loop redrew her face a little in every
frame, so it warped as the loop played; this places the eight combat idle frames into showcase cells
instead, at the size and spot where the showcase actions start (their first frame is the same guard).

  python assets/heroes/forms/fire/tools/showcase_idle2.py     (after the actions are cut, sharpen_showcase.py)
"""
from pathlib import Path

import numpy as np
from PIL import Image

FORM = Path(__file__).resolve().parents[1] / "form-2"


def cells(path):
    sheet = Image.open(path).convert("RGBA")
    c = sheet.width // 2
    return c, [sheet.crop(((i % 2) * c, (i // 2) * c, (i % 2 + 1) * c, (i // 2 + 1) * c)) for i in range(8)]


def box(img):
    return img.getchannel("A").point(lambda a: 255 if a >= 128 else 0).getbbox()


c, idle = cells(FORM / "idle.webp")
cell, start = cells(FORM / "showcase/shouldersword.webp")
src, dst = box(idle[0]), box(start[0])
k = (dst[3] - dst[1]) / (src[3] - src[1])                  # the same guard, measured ear tips to soles
ox, oy = dst[0] - src[0] * k, dst[3] - src[3] * k
out = Image.new("RGBA", (cell * 2, cell * 4))
for i, f in enumerate(idle):
    big = f.resize((round(c * k), round(c * k)), Image.Resampling.LANCZOS)
    frame = Image.new("RGBA", (cell, cell)); frame.alpha_composite(big, (round(ox), round(oy))) if ox >= 0 and oy >= 0 else frame.paste(big, (round(ox), round(oy)), big)
    out.alpha_composite(frame, ((i % 2) * cell, (i // 2) * cell))
out.save(FORM / "showcase/idle.webp", lossless=True, method=6)
print("showcase idle from the combat idle: scale", round(k, 3), "offset", round(ox), round(oy))
