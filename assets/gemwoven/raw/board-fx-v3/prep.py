"""Cut the six board FX pieces out of raw-fx.png (3x2 cells on black, keyed by brightness so the glow keeps its alpha;
colours un-premultiplied). Item overlays go to assets/board-items/, blast pieces to assets/special-fx/. Re-run after a
redraw. Pieces: bolt-aura (Sao băng on the board), blade (sweep), bomb-ring (Bom on the board), vortex, fireball, prism."""
from pathlib import Path
import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
# name: (col, row, folder, longest side px, square)
PIECES = {'bolt-aura': (0, 0, 'board-items', 256, False), 'blade': (1, 0, 'special-fx', 384, False),
          'bomb-ring': (2, 0, 'board-items', 256, True), 'vortex-square': (0, 1, 'special-fx', 640, True),  # retired 05/11: the round vortex is bomb-vortex/prep.py
          
          'fireball': (1, 1, 'special-fx', 640, True)}  # 'prism' (2, 1) retired 05/11: the Lõi's beams became star wisps
im = Image.open(HERE / 'raw-fx.png').convert('RGB'); W, H = im.size
for name, (col, row, folder, longest, square) in PIECES.items():
    a = np.asarray(im.crop((col * W // 3, row * H // 2, (col + 1) * W // 3, (row + 1) * H // 2))).astype(np.float32) / 255
    alpha = np.clip((a.max(axis=2) - .03) / .97, 0, 1)
    rgb = np.where(alpha[..., None] > 0, np.clip(a / np.maximum(a.max(axis=2, keepdims=True), 1e-4), 0, 1), 0)
    ys, xs = np.where(alpha > .02); pad = 6
    box = (max(0, xs.min() - pad), max(0, ys.min() - pad), min(alpha.shape[1], xs.max() + pad), min(alpha.shape[0], ys.max() + pad))
    out = Image.fromarray((np.dstack([rgb, alpha]) * 255).astype(np.uint8), 'RGBA').crop(box)
    if square:
        side = max(out.size); sq = Image.new('RGBA', (side, side)); sq.paste(out, ((side - out.width) // 2, (side - out.height) // 2)); out = sq
    s = longest / max(out.size); out = out.resize((max(1, round(out.width * s)), max(1, round(out.height * s))), Image.LANCZOS)
    if name.endswith('-square'):
        continue
    out.save(ROOT / 'assets' / folder / f'{name}.webp', quality=90, method=6); print(name, out.size)
