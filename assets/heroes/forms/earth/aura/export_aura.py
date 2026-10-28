"""Cut Nori's six-star aura (raw-sheet.png: 2 columns x 4 rows on #FF00FF, drawn around an invisible
hero whose soles stand at 82% of the cell) into the 8-frame strip aura.webp.

Every cell keeps its drawn geometry (no refit), so the moss patch stays where the soles stand when
the band is laid under the hero (hero-forms.css: dropped 18%). Only the ground patch of frame 1 is
kept, in all eight frames: the patch must not sway, and the drawn leaves and spores only faded in
place; they rise as live motes instead (form-effects.js .aura-motes).
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

HERE = Path(__file__).resolve().parent
CELL = 256
GROUND = .72   # share of the cell height above which nothing of the drawing is kept
KEY = np.array([255, 0, 255], dtype=np.float32)

sheet = np.asarray(Image.open(HERE / "raw-sheet.png").convert("RGB"), dtype=np.float32)
h, w = sheet.shape[0] / 4, sheet.shape[1] / 2
frames = []
for i in range(8):
    cell = sheet[round(i // 2 * h):round((i // 2 + 1) * h), round(i % 2 * w):round((i % 2 + 1) * w)].copy()
    # How magenta a pixel is; glows and spores are half see-through, so the key is taken out of them.
    keyness = np.minimum(cell[..., 0], cell[..., 2]) - cell[..., 1]
    alpha = np.clip(1 - np.clip(keyness, 0, None) / 200, 0, 1) ** 1.4
    alpha[alpha < .03] = 0
    unmixed = (cell - (1 - alpha[..., None]) * KEY) / np.maximum(alpha[..., None], .02)
    cell = np.where(((alpha > 0) & (alpha < 1))[..., None], unmixed, cell).clip(0, 255)
    img = Image.fromarray(np.concatenate([cell, alpha[..., None] * 255], -1).astype("uint8"), "RGBA")
    img = img.resize((CELL, CELL), Image.Resampling.LANCZOS)
    frames.append(img)
keep = Image.new("L", (CELL, CELL), 0)
ImageDraw.Draw(keep).rectangle((0, round(CELL * GROUND), CELL, CELL), fill=255)
ground = Image.new("RGBA", (CELL, CELL))
ground.paste(frames[0], (0, 0), keep.filter(ImageFilter.GaussianBlur(3)))
strip = Image.new("RGBA", (CELL * 8, CELL))
for i in range(8):
    ground.save(HERE / f"aura-{i + 1}.png")
    strip.paste(ground, (i * CELL, 0))
strip.save(HERE / "aura.webp", lossless=True, method=6)
print("aura.webp: the ground patch, held in all 8 frames")
