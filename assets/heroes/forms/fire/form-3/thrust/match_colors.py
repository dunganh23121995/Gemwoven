# Owner 06/11: "màu sắc bị thay đổi" - each redraw drifts the palette. Every frame's character pixels get the resting
# pose's colours back: per-channel histogram matching of the foreground (magenta background untouched) to rest.png.
import sys
import numpy as np
from PIL import Image
def fg(a): return (np.abs(a[..., 0] - 255) + a[..., 1] + np.abs(a[..., 2] - 255)) > 150
ref = np.asarray(Image.open('rest.png').convert('RGB')).astype(int); rm = fg(ref)
for name in sys.argv[1:]:
    a = np.asarray(Image.open(f'{name}.png').convert('RGB')).astype(int); m = fg(a); out = a.copy()
    for c in range(3):
        src = a[..., c][m]; tgt = ref[..., c][rm]
        sv, si, sc = np.unique(src, return_inverse=True, return_counts=True)
        tv, tc = np.unique(tgt, return_counts=True)
        sq = np.cumsum(sc) / src.size; tq = np.cumsum(tc) / tgt.size
        out[..., c][m] = np.interp(sq, tq, tv)[si]
    Image.fromarray(out.astype(np.uint8)).save(f'{name}-c.png')
    def st(x, mm): return x[mm].mean(0).round(1)
    print(name, st(a, m), '->', st(out, m), 'rest', st(ref, rm))
