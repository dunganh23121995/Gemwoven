"""Cut the special-gem FX pieces out of the two Codex sheets (black background, keyed by brightness so the glow keeps
its alpha; colours un-premultiplied) and save them as transparent webp in assets/special-fx/. Re-run after a redraw."""
import numpy as np
from PIL import Image
from pathlib import Path
HERE = Path(__file__).resolve().parent
OUT = HERE.parents[3] / 'assets/special-fx'; OUT.mkdir(parents=True, exist_ok=True)
# name: (sheet, region as fractions x0,y0,x1,y1, longest side in px)
PIECES = {
    'beam': ('a', (0, 0, 1, .5), 1024), 'head': ('a', (0, .5, 1/3, 1), 256), 'blast': ('a', (1/3, .5, 2/3, 1), 512),
    # 'ring' retired 05/11 (it was cut off at the top and wobbled as it turned): assets/gemwoven/raw/core-fx/ draws the halo.
    'flash': ('b', (0, 0, 1/3, .5), 320), 'mark': ('b', (1/3, 0, 2/3, .5), 256), 'arrows': ('b', (2/3, 0, 1, .5), 256),
    'sparkle': ('b', (0, .5, 1/3, 1), 128), 'shard': ('b', (1/3, .5, 2/3, 1), 96), 'glow': ('b', (2/3, .5, 1, 1), 256),
}
SQUARE = {'blast', 'ring', 'flash', 'mark', 'sparkle', 'glow'}
for name, (sheet, (x0, y0, x1, y1), longest) in PIECES.items():
    im = Image.open(HERE / f'raw-sheet-{sheet}.png').convert('RGB'); W, H = im.size
    a = np.asarray(im.crop((int(x0 * W), int(y0 * H), int(x1 * W), int(y1 * H)))).astype(np.float32) / 255
    alpha = a.max(axis=2); alpha = np.clip((alpha - .03) / .97, 0, 1)
    rgb = np.where(alpha[..., None] > 0, np.clip(a / np.maximum(a.max(axis=2, keepdims=True), 1e-4), 0, 1), 0)
    rgba = np.dstack([rgb, alpha]); ys, xs = np.where(alpha > .02)
    pad = 6; box = (max(0, xs.min() - pad), max(0, ys.min() - pad), min(alpha.shape[1], xs.max() + pad), min(alpha.shape[0], ys.max() + pad))
    out = Image.fromarray((rgba * 255).astype(np.uint8), 'RGBA').crop(box)
    if name in SQUARE:  # round pieces keep their shape when drawn into a square box
        side = max(out.size); sq = Image.new('RGBA', (side, side)); sq.paste(out, ((side - out.width) // 2, (side - out.height) // 2)); out = sq
    s = longest / max(out.size); out = out.resize((max(1, round(out.width * s)), max(1, round(out.height * s))), Image.LANCZOS)
    out.save(OUT / f'{name}.webp', quality=90, method=6); print(name, out.size)
