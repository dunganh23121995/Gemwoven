# Owner 07/11: "ảnh thứ 3 khi đánh thường cán đao bị bé hơn bình thường". In the attack frames the level shaft reads as
# a thin bright line: a blown-out white stripe over a near-black lower half (the colour match and the sharpening pushed
# it). Where the shaft lies over the plain background (a lone rod per column, not the hands or the fittings), each
# column is stretched about its centre by THICK and recoloured by brightness onto the resting pose's shaft colours
# (deep red body, warm orange-cream highlight).
import sys
import numpy as np
from PIL import Image
THICK = 1.5
STOPS = [(0, (105, 6, 8)), (60, (165, 12, 18)), (120, (200, 38, 30)), (185, (232, 128, 86)), (255, (248, 196, 150))]
def palette(l):
    xs = [s for s, _ in STOPS]; return np.stack([np.interp(l, xs, [c[i] for _, c in STOPS]) for i in range(3)], -1)
def key(p): return (np.abs(p[..., 0] - 255) + p[..., 1] + np.abs(p[..., 2] - 255))
src, dst, x0, x1, y0, y1 = sys.argv[1], sys.argv[2], *map(int, sys.argv[3:7])
a = np.asarray(Image.open(src).convert('RGB')).astype(float); out = a.copy(); n = 0
for x in range(x0, x1):
    d = key(a[y0:y1, x]); idx = np.nonzero(d > 150)[0]
    if not len(idx): continue
    runs = np.split(idx, np.where(np.diff(idx) > 1)[0] + 1)
    if len(runs) > 1 or len(runs[0]) > 16: continue
    top, bot = y0 + runs[0][0], y0 + runs[0][-1] + 1; c = (top + bot) / 2; h = bot - top
    col = a[top:bot, x]; luma = col @ [.299, .587, .114]; solid = palette(luma)   # the whole rod is solid
    nt, nb = int(np.floor(c - h * THICK / 2)) - 1, int(np.ceil(c + h * THICK / 2)) + 1
    for y in range(nt, nb):
        sy = c + (y + .5 - c) / THICK - .5
        if sy < top - .5 or sy > bot - .5: continue
        i = min(h - 1, max(0, int(round(sy - top))))
        edge = .5 if y in (nt + 1, nb - 2) and (sy < top or sy > bot - 1) else 1   # soften the outermost rows
        out[y, x] = solid[i] * edge + a[y, x] * (1 - edge)
    n += 1
Image.fromarray(out.round().astype(np.uint8)).save(dst); print(src, 'shaft columns', n)
