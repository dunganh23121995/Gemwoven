"""Cut the six stardust sparkles (owner 05/11: "bụi sao không đẹp, không nhiều màu, cánh xấu — vẽ lại") out of
raw-stardust.png (3x2 on black, keyed by brightness like board-fx-v3/prep.py) into assets/special-fx/dust-*.webp,
each centred on its own core in a square file. Used by src/special-fx.js specialFxStardust for the bomb and sweep dust."""
from pathlib import Path
import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
OUT = HERE.parents[3] / 'assets/special-fx'
NAMES = ['dust-rose', 'dust-gold', 'dust-mint', 'dust-sky', 'dust-violet', 'dust-prism']
im = Image.open(HERE / 'raw-stardust.png').convert('RGB'); W, H = im.size
for i, name in enumerate(NAMES):
    col, row = i % 3, i // 3
    a = np.asarray(im.crop((col * W // 3, row * H // 2, (col + 1) * W // 3, (row + 1) * H // 2))).astype(np.float32) / 255
    alpha = np.clip((a.max(axis=2) - .03) / .97, 0, 1)
    rgb = np.where(alpha[..., None] > 0, np.clip(a / np.maximum(a.max(axis=2, keepdims=True), 1e-4), 0, 1), 0)
    lum = a.sum(axis=2); cy, cx = np.unravel_index(np.argmax(lum), lum.shape)  # the white-hot core
    ys, xs = np.where(alpha > .04)
    r = int(max(ys.max() - cy, cy - ys.min(), xs.max() - cx, cx - xs.min())) + 6
    rgba = np.pad(np.dstack([rgb, alpha]), ((r, r), (r, r), (0, 0)))
    out = Image.fromarray((rgba * 255).astype(np.uint8), 'RGBA').crop((cx, cy, cx + 2 * r, cy + 2 * r))
    out.resize((128, 128), Image.LANCZOS).save(OUT / f'{name}.webp', quality=92, method=6); print(name, out.size)
