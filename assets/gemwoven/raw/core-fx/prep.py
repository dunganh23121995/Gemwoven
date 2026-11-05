"""Cut the two round prism pieces out of raw-rings.png (2 cells on black, keyed by brightness like board-fx-v3/prep.py)
into assets/special-fx/: halo (the Lõi's turning halo, on the board and while it fires) and prism-wave (the ring wave
of a Lõi's burst and of each full-board wave of Lõi + Lõi). Owner 05/11: the old ring was cut off at the top and
lopsided, so it wobbled as it turned; both of these are perfect circles centred in square files."""
from pathlib import Path
import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
OUT = HERE.parents[3] / 'assets/special-fx'
# orbit (owner 05/11: "style kiểu trước đó nhưng xoay quanh xích đạo"): the silky ribbon ring of the old halo, drawn whole
# and round (raw-ribbon.png), shown squashed and tilted as a ring orbiting the Lõi's equator.
# 'halo' (raw-rings.png left) retired 05/11: the Lõi's orbit ring replaced it.
for file, cols, col, name, side in [('raw-rings.png', 2, 1, 'prism-wave', 512), ('raw-ribbon.png', 1, 0, 'orbit', 512)]:
    im = Image.open(HERE / file).convert('RGB'); W, H = im.size
    a = np.asarray(im.crop((col * W // cols, 0, (col + 1) * W // cols, H))).astype(np.float32) / 255
    alpha = np.clip((a.max(axis=2) - .03) / .97, 0, 1)
    rgb = np.where(alpha[..., None] > 0, np.clip(a / np.maximum(a.max(axis=2, keepdims=True), 1e-4), 0, 1), 0)
    ys, xs = np.where(alpha > .05)
    # Centre on the ring's own middle (not the glow's bounding box), so it turns about its true centre.
    cy, cx = (ys.min() + ys.max()) / 2, (xs.min() + xs.max()) / 2
    r = int(max(ys.max() - cy, cy - ys.min(), xs.max() - cx, cx - xs.min())) + 8
    out = Image.fromarray((np.dstack([rgb, alpha]) * 255).astype(np.uint8), 'RGBA').crop((int(cx) - r, int(cy) - r, int(cx) + r, int(cy) + r))
    out.resize((side, side), Image.LANCZOS).save(OUT / f'{name}.webp', quality=90, method=6); print(name, out.size)
