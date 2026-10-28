"""Cut the hero mote sheets into transparent sprites (96 px) and write motes.json.

raw.png: 4 columns x 5 rows on #FF00FF, rows fire, ice, earth, lightning, novice.
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
SIZE = 96
SHEETS = [("raw.png", ["fire", "ice", "earth", "lightning", "novice"], (255, 0, 255))]


def cut(cell, key):
    key = np.array(key, dtype=np.float32)
    red, green, blue = cell[..., 0], cell[..., 1], cell[..., 2]
    # How strongly a pixel looks like the key: the key's channels against the others.
    keyness = np.minimum(red, blue) - green if key[1] == 0 else green - np.maximum(red, blue)
    # Glows are half see-through: take the key colour out of them (observed = a*colour + (1-a)*key).
    alpha = np.clip(1 - np.clip(keyness, 0, None) / 200, 0, 1) ** 1.4
    soft = (alpha > .02) & (alpha < 1)
    unmixed = (cell - (1 - alpha[..., None]) * key) / np.maximum(alpha[..., None], .02)
    cell = np.where(soft[..., None], unmixed, cell).clip(0, 255)
    img = Image.fromarray(np.concatenate([cell, alpha[..., None] * 255], -1).clip(0, 255).astype("uint8"), "RGBA")
    img = img.crop(img.getbbox())
    img.thumbnail((SIZE, SIZE), Image.Resampling.LANCZOS)
    out = Image.new("RGBA", (SIZE, SIZE)); out.alpha_composite(img, ((SIZE - img.width) // 2, (SIZE - img.height) // 2))
    return out


book = {}
for name, rows, key in SHEETS:
    sheet = np.asarray(Image.open(HERE / name).convert("RGB"), dtype=np.float32)
    h, w = sheet.shape[0] / len(rows), sheet.shape[1] / 4
    for r, hero in enumerate(rows):
        for c in range(4):
            cell = sheet[round(r * h):round((r + 1) * h), round(c * w):round((c + 1) * w)].copy()
            file = f"{hero}-{c + 1}.png"; cut(cell, key).save(HERE / file)
            book.setdefault(hero, []).append(f"assets/fx/heroes/motes/{file}")
(HERE / "motes.json").write_text(json.dumps(book, indent=2) + "\n", encoding="utf-8")
print(", ".join(f"{hero}: {len(files)}" for hero, files in book.items()))
