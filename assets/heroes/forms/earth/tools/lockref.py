"""lockref.py <sheet> <cols> <rows> <count> <box x0,y0,x1,y1 (cell fractions)> [...more boxes] [--ref=1] [--feather=3] [--backup=dir]
Keep a planted/held rigid part (Nori's shield) still while he breathes: inside each box every frame takes the
reference frame's own pixels (frame 1 = the resting pose the loop starts and ends on; same placement, so no
offset), blended over a feathered seam. Nothing is drawn or warped. Rewrites the sheet in place (lossless)."""
import shutil, sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage
p, cols, rows, count, *rest = sys.argv[1:]; cols, rows, count = int(cols), int(rows), int(count)
ref = next((int(a.split('=')[1]) for a in rest if a.startswith('--ref=')), 1)
feather = next((int(a.split('=')[1]) for a in rest if a.startswith('--feather=')), 3)
backup = next((a.split('=', 1)[1] for a in rest if a.startswith('--backup=')), None)
boxes = [[float(v) for v in a.split(',')] for a in rest if not a.startswith('--')]
if backup: Path(backup).mkdir(parents=True, exist_ok=True); shutil.copy2(p, Path(backup) / (Path(p).parent.name + '-' + Path(p).parent.parent.name + '-' + Path(p).name))
im = Image.open(p); fmt = 'PNG' if p.endswith('.png') else 'WEBP'
arr = np.asarray(im.convert('RGBA'), dtype=np.float32) / 255; h, w = arr.shape[0] // rows, arr.shape[1] // cols
m = np.zeros((h, w), np.float32)
for x0, y0, x1, y1 in boxes: m[int(y0 * h):int(y1 * h), int(x0 * w):int(x1 * w)] = 1
if feather: m = ndimage.gaussian_filter(ndimage.binary_erosion(m > .5, iterations=feather).astype(np.float32), feather / 1.5) * 0 + ndimage.uniform_filter(m, 2 * feather + 1)
m = m[..., None]
cell = lambda i: (slice((i // cols) * h, (i // cols + 1) * h), slice((i % cols) * w, (i % cols + 1) * w))
R = arr[cell(ref - 1)].copy(); pm = lambda a: np.concatenate([a[..., :3] * a[..., 3:], a[..., 3:]], -1)
for i in range(count):
    if i == ref - 1: continue
    f = arr[cell(i)]; mix = pm(R) * m + pm(f) * (1 - m); a = mix[..., 3:]
    arr[cell(i)] = np.concatenate([np.where(a > 1e-4, mix[..., :3] / np.maximum(a, 1e-4), 0), a], -1)
out = Image.fromarray((arr.clip(0, 1) * 255).round().astype('uint8'), 'RGBA')
out.save(p, lossless=True, method=6, exact=True) if fmt == 'WEBP' else out.save(p)
print('locked', p, boxes)
