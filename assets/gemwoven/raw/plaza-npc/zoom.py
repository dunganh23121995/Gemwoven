"""Zoomed frames of a baked plaza NPC sheet for the tear check and the Codex review.
  python assets/gemwoven/raw/plaza-npc/zoom.py <id> <out.png> [frames]   frames default 0,4,8,12,16,20
Also prints how far the drawing moves (max pixel offset of the alpha edge between frame 1 and each frame)."""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[4]
npc, out = sys.argv[1], sys.argv[2]
frames = [int(x) for x in (sys.argv[3] if len(sys.argv) > 3 else "0,4,8,12,16,20").split(",")]
d = ROOT / f"assets/gemwoven/plaza/npcs/{npc}/rig/show"
sheet = Image.open(d / "idle.webp").convert("RGBA")
n = sheet.width // 6
cells = [sheet.crop(((i % 6) * n, (i // 6) * n, (i % 6 + 1) * n, (i // 6 + 1) * n)) for i in range(24)]
box = None
for c in cells:
    b = c.getbbox(); box = b if box is None else (min(box[0], b[0]), min(box[1], b[1]), max(box[2], b[2]), max(box[3], b[3]))
pad = 6; box = (max(0, box[0] - pad), max(0, box[1] - pad), min(n, box[2] + pad), min(n, box[3] + pad))
w, h = box[2] - box[0], box[3] - box[1]
s = 900 / h
sheet_out = Image.new("RGB", (round(w * s) * len(frames), round(h * s)), (150, 150, 150))
for k, i in enumerate(frames):
    bg = Image.new("RGBA", (w, h), (150, 150, 150, 255)); bg.alpha_composite(cells[i].crop(box))
    sheet_out.paste(bg.convert("RGB").resize((round(w * s), round(h * s)), Image.Resampling.LANCZOS), (k * round(w * s), 0))
sheet_out.save(out)
a0 = np.asarray(cells[0])[..., 3] > 127
print("bbox over loop", box, "cell", n)
for i in range(0, 24, 3):
    a = np.asarray(cells[i])[..., 3] > 127
    print(f"frame {i + 1}: changed alpha px {int((a ^ a0).sum())}")
