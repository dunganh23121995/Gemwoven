"""Puts a drawn key pose (magenta background) on the f3-run clip canvas: scaled so its head matches the resting frame's,
feet on the resting feet line, shifted forward only as far as the trailing glaive needs (12/11: new running key R)."""
import sys
from pathlib import Path
import numpy as np
from PIL import Image
ROOT = Path(__file__).resolve().parents[7]
sys.path.insert(0, str(ROOT / 'assets/heroes'))
import clip_pipeline as cp

raw, out = Path(sys.argv[1]), Path(sys.argv[2])
_, spec = cp.load('fire/f3-run')
rest = Image.open(ROOT / spec['rest']).convert('RGBA')
n = round(cp.CELL * spec['pad']); off_y = n - cp.CELL - round((n - cp.CELL) * .15); off_x = round((n - cp.CELL) * .5)
im = cp.key_magenta(Image.open(raw)); im = im.crop(im.getbbox())
ra = np.asarray(rest)[..., 3] > 128; ys, xs = np.where(ra)
rest_feet = off_y + np.percentile(ys, 99.5)
s = 345 / 670
for _ in range(3):   # refine by the head
    t = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    k = cp.head_scale(rest, t); s /= k
    print('scale', round(s, 4), 'head ratio', round(k, 3))
    if abs(k - 1) < .021: break
# The head match fails on a profile face (it returns 1.0): measured by eye on the side-by-side, head 110 px vs the
# resting 100 px (ear to ear, 768 canvas) -> the drawn key is 0.91 of that.
s *= float(sys.argv[3]) if len(sys.argv) > 3 else 1.0
t = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
a = np.asarray(t)[..., 3] > 128; ys, xs = np.where(a)
feet = np.percentile(ys, 99.5)
margin = round(n * .09)   # Codex spec-v2: the trailing glaive needs 8-10% room on the left
x = margin
canvas = Image.new('RGBA', (n, n), (0, 0, 0, 0))
canvas.alpha_composite(t, (x, round(rest_feet - feet)))
print('canvas', n, 'placed at', x, round(rest_feet - feet), 'size', t.size)
cp.on_magenta(canvas).resize((cp.SIZE, cp.SIZE), Image.LANCZOS).save(out)
