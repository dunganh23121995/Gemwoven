"""clean_ghosts.py <sheet> <cols> <rows> <count> [--max-area N] [--box x0,y0,x1,y1] [--thin-only] [--faint] [--dry]: remove ghost fragments from a Lumi loop sheet in place.

The stabilised idle loops keep small detached leftovers of the master's pose (a second outline of the hat-tip star,
broken contour strokes under the hat tip). Per frame, every alpha island (alpha > 8, 8-connected) that is not the
main body and is smaller than --max-area pixels is cleared. Nothing is drawn or moved; intended pieces attached to
the body (dangling star charms, hair tips) are untouched because they belong to the main island."""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

path, cols, rows, count = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4])
max_area = int(sys.argv[sys.argv.index('--max-area') + 1]) if '--max-area' in sys.argv else 300
# --box x0,y0,x1,y1 (cell px): only islands centred in this zone (where the ghosts sit, e.g. under the hat tip) go;
# detached pieces elsewhere (orbit-ring segments, sparkles) are kept.
# --thin-only: only thin islands (outline strokes, specks: nothing left after a 1-px erosion) go; solid detached
# drawings such as a star floating above her palm stay.
thin_only = '--thin-only' in sys.argv
# --faint: also clear faint pixels (alpha < 140) more than 2.5 px from any solid pixel: ghost contour strokes.
faint = '--faint' in sys.argv
box = [int(v) for v in sys.argv[sys.argv.index('--box') + 1].split(',')] if '--box' in sys.argv else None
im = Image.open(path).convert('RGBA'); a = np.asarray(im).copy(); cw, ch = im.width // cols, im.height // rows
removed = []
for i in range(count):
    y0, x0 = (i // cols) * ch, (i % cols) * cw
    cell = a[y0:y0 + ch, x0:x0 + cw]
    lab, n = ndimage.label(cell[..., 3] > 8, structure=np.ones((3, 3)))
    drop = []
    if n >= 2:
      sizes = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1)); main = int(np.argmax(sizes)) + 1
      cy, cx = zip(*ndimage.center_of_mass(np.ones_like(lab), lab, range(1, n + 1)))
      drop = [k + 1 for k, s in enumerate(sizes) if k + 1 != main and s < max_area
            and (box is None or (box[0] <= cx[k] <= box[2] and box[1] <= cy[k] <= box[3]))
            and (not thin_only or ndimage.binary_erosion(cell[..., 3] * (lab == k + 1) > 96).sum() <= 2)]
    mask = np.isin(lab, drop)
    if faint:  # faint strokes standing off the body (ghost contours), not the 1-2 px antialiased rim of a solid part
        far = ndimage.distance_transform_edt(cell[..., 3] < 200) > 2.5
        f = (cell[..., 3] > 0) & (cell[..., 3] < 140) & far
        if box: f[:, :box[0]] = f[:, box[2]:] = False; f[:box[1]] = f[box[3]:] = False
        mask |= f
    cell[mask] = 0; removed.append(int(mask.sum()))
print(path.replace('\\', '/').split('/assets/')[-1], 'cleared px per frame:', removed)
if '--dry' not in sys.argv:
    Image.fromarray(a, 'RGBA').save(path, 'WEBP', lossless=True, method=6, exact=True)
