"""deghost.py <sheet> <cols> <rows> <count> <box x0,y0,x1,y1 (cell fractions)> [--frames=2,3,...]
Remove the faint leftover outline of an old pose (a ghosted cape tip, etc.): inside the box, pixels that are
faint (alpha < 150) and more than 2 px away from the frame's solid body are cleared. Nothing is drawn.
Rewrites the sheet in place (lossless)."""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage
p, cols, rows, count, box, *rest = sys.argv[1:]; cols, rows, count = int(cols), int(rows), int(count)
frames = next(([int(v) for v in a.split('=')[1].split(',')] for a in rest if a.startswith('--frames=')), list(range(1, count + 1)))
x0, y0, x1, y1 = [float(v) for v in box.split(',')]
a = np.asarray(Image.open(p).convert('RGBA')).copy(); h, w = a.shape[0] // rows, a.shape[1] // cols
for fr in frames:
    i = fr - 1; c = a[(i // cols) * h:(i // cols + 1) * h, (i % cols) * w:(i % cols + 1) * w]
    al = c[..., 3].astype(int); far = (al > 0) & (al < 150) & ~ndimage.binary_dilation(al >= 150, iterations=2)
    m = np.zeros_like(far); m[int(y0 * h):int(y1 * h), int(x0 * w):int(x1 * w)] = True
    kill = far & m; c[..., 3][kill] = 0
    print('frame', fr, 'cleared', int(kill.sum()))
Image.fromarray(a, 'RGBA').save(p, lossless=True, method=6, exact=True)
