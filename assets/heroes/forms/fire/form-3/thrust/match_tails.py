# Owner 07/11: "kích thước đuôi không khớp với trạng thái nghỉ và màu cũng vậy". After the whole-frame colour match,
# the tails (left of x=330 on the canvas, behind her) get the resting pose's tail colours: per-channel histogram
# matching of that region to the resting pose's left-hand tails, blended in over x 300..360.
import sys
import numpy as np
from PIL import Image
def fg(a): return (np.abs(a[..., 0] - 255) + a[..., 1] + np.abs(a[..., 2] - 255)) > 150
ref = np.asarray(Image.open('rest.png').convert('RGB')).astype(int); X = np.arange(ref.shape[1])[None, :]
rm = fg(ref) & (X < 330)
for name in sys.argv[1:]:
    a = np.asarray(Image.open(f'{name}.png').convert('RGB')).astype(int); m = fg(a) & (X < 360); out = a.astype(float).copy()
    for c in range(3):
        src = a[..., c][m]; tgt = ref[..., c][rm]
        sv, si, sc = np.unique(src, return_inverse=True, return_counts=True); tv, tc = np.unique(tgt, return_counts=True)
        mapped = np.interp(np.cumsum(sc) / src.size, np.cumsum(tc) / tgt.size, tv)[si]
        w = np.clip((360 - np.broadcast_to(X, a.shape[:2])[m]) / 60, 0, 1)
        out[..., c][m] = mapped * w + src * (1 - w)
    Image.fromarray(out.round().astype(np.uint8)).save(f'{name}-t.png')
    print(name, 'tails', a[m].mean(0).round(1), '->', out[m].mean(0).round(1), 'rest tails', ref[rm].mean(0).round(1))
