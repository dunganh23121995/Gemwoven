"""Hold the sheathed katana still in Noct form 2's combat idle (idle.webp, in place): the wind idle lets
Codex redraw it in every frame and it bent and stretched. Inside a band along the hilt and scabbard
(256 px cell: from the hands at (110, 143) to just past the scabbard tip at (218, 197), 9 px either side,
feathered) every frame shows the resting frame (combat-idle/master.png) itself; loose specks are dropped.
Run after wind_idle.py accept (python assets/heroes/forms/shadow/form-2/lock_sword.py)."""
from pathlib import Path

import numpy as np
from scipy import ndimage
from PIL import Image

HERE = Path(__file__).resolve().parent
A, B, HALF = np.array([110, 143.]), np.array([218, 197.]), 9   # past the tip: its stray cord ends go
rest = np.asarray(Image.open(HERE / "combat-idle/master.png").convert("RGBA"), dtype=np.float32)
yy, xx = np.mgrid[0:256, 0:256].astype(np.float32)
d = B - A; t = np.clip(((xx - A[0]) * d[0] + (yy - A[1]) * d[1]) / (d @ d), 0, 1)
dist = np.hypot(xx - (A[0] + t * d[0]), yy - (A[1] + t * d[1]))
mask = np.clip((HALF + 2 - dist) / 3, 0, 1)[..., None]
path = HERE / "idle.webp"
sheet = np.asarray(Image.open(path).convert("RGBA"), dtype=np.float32)
cell = sheet.shape[1] // 2
assert cell == 256, cell
for i in range(8):
    y, x = (i // 2) * cell, (i % 2) * cell
    c = sheet[y:y + cell, x:x + cell]
    c = c * (1 - mask) + rest * mask
    # Loose cord ends drawn apart from the figure are dropped.
    labels, count = ndimage.label(c[..., 3] > 20)
    sizes = ndimage.sum(np.ones(labels.shape), labels, range(1, count + 1))
    for index, area in enumerate(sizes, 1):
        if area < 150:
            c[labels == index, 3] = 0
    sheet[y:y + cell, x:x + cell] = c
Image.fromarray(sheet.clip(0, 255).astype("uint8"), "RGBA").save(path, lossless=True, method=6)
print("sword held still in", path.name)
