"""Pull the green-screen fringe out of Noct form 2's showcase sheets (drawn on #00FF00): where green
outweighs red and blue, it is brought down to their level; loose specks are dropped. Usage: python despill.py (in place)."""
from pathlib import Path

import numpy as np
from scipy import ndimage
from PIL import Image

for path in sorted(Path(__file__).resolve().parent.glob("*.webp")):
    a = np.asarray(Image.open(path).convert("RGBA"), dtype=np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    cap = np.maximum(r, b) + 6
    a[..., 1] = np.where(g > cap, cap, g)
    # Tiny loose specks (key leftovers) far from the figure are removed, cell by cell.
    h, w = a.shape[0] // 4, a.shape[1] // 2
    for i in range(8):
        cell = a[(i // 2) * h:(i // 2 + 1) * h, (i % 2) * w:(i % 2 + 1) * w]
        labels, count = ndimage.label(cell[..., 3] > 20)
        sizes = ndimage.sum(np.ones(labels.shape), labels, range(1, count + 1))
        for index, area in enumerate(sizes, 1):
            if area < 120:
                cell[labels == index, 3] = 0
    Image.fromarray(a.clip(0, 255).astype("uint8"), "RGBA").save(path, lossless=True, method=6)
    print("despilled", path.name)
