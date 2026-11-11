"""Cut the five rarity slots (raw-sheet.png, one row: uncommon, rare, epic, legendary, divine) into
assets/gemwoven/rarity/slot-<tier>.webp at inventory-slot's width (341) and their own drawn proportions.
The raw came back transparent; alpha below 40 is the API's keying noise and is dropped.
Legendary's well came out too dark to tell from the plain slot once a solid fragment sits on it (owner 08/11), so its
inside is brightened into a golden burst; the rim and the other tiers are as drawn."""
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

HERE = Path(__file__).resolve().parent
OUT = HERE.parents[1] / "rarity"
im = Image.open(HERE / "raw-sheet.png").convert("RGBA")
a = np.array(im)
a[a[..., 3] < 40] = 0
solid = a[..., 3] > 0
cols = np.where(solid.any(0))[0]
runs = np.split(cols, np.where(np.diff(cols) > 1)[0] + 1)
assert len(runs) == 5, len(runs)
for tier, run in zip(["uncommon", "rare", "epic", "legendary", "divine"], runs):
    rows = np.where(solid[:, run[0]:run[-1] + 1].any(1))[0]
    tile = Image.fromarray(a[rows[0]:rows[-1] + 1, run[0]:run[-1] + 1])
    pad = 8 * tile.width // 325
    canvas = Image.new("RGBA", (tile.width + 2 * pad, tile.height + 2 * pad), (0, 0, 0, 0))
    canvas.paste(tile, (pad, pad))
    canvas = canvas.resize((341, round(341 * canvas.height / canvas.width)), Image.LANCZOS)
    if tier == "legendary":
        px = np.array(canvas).astype(np.float32)
        h, w = px.shape[:2]
        well = ndimage.gaussian_filter(ndimage.binary_erosion(px[..., 3] > 200, iterations=34).astype(np.float32), 4)
        yy, xx = np.mgrid[:h, :w]
        r = np.sqrt(((xx - w / 2) / (w * .42)) ** 2 + ((yy - h / 2) / (h * .42)) ** 2).clip(0, 1)
        for k, (centre, edge) in enumerate([(1.8, 1.55), (1.65, 1.4), (1.3, 1.1)]):
            px[..., k] *= 1 + (centre + (edge - centre) * r - 1) * well
        canvas = Image.fromarray(px.clip(0, 255).astype("uint8"))
    canvas.save(OUT / f"slot-{tier}.webp", "WEBP", quality=92, alpha_quality=90, method=6)
    print(tier, canvas.size)
