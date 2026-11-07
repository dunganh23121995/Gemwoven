# Usage: align_sheet.py <old sheet> <cols> <rows> <raw redraw (magenta)> <out sheet> [ref frame, default 0]
# Keys the redraw and puts its frame 1 exactly over the old sheet's frame 1 (same height, bottom, centre), then
# moves every frame by that same scale and offset, so the drawn motion between frames is kept as drawn.
import sys
import numpy as np
from PIL import Image
sys.path.insert(0, 'D:/Project/Gemwoven/assets/fx/heroes/fire'); from export_fx import key_out
old_p, cols, rows, raw_p, out_p = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4], sys.argv[5]
ref = int(sys.argv[6]) if len(sys.argv) > 6 else 0
old = Image.open(old_p).convert('RGBA'); raw = key_out(Image.open(raw_p))
oc, orr = old.width // cols, old.height // rows; cw, ch = raw.width / cols, raw.height / rows
cells = [raw.crop((round(c * cw), round(r * ch), round((c + 1) * cw), round((r + 1) * ch))) for r in range(rows) for c in range(cols)]
def box(im): return (np.asarray(im.getchannel('A')) > 60).nonzero()
ys, xs = box(cells[ref]); oy, ox = box(old.crop(((ref % cols) * oc, (ref // cols) * orr, (ref % cols + 1) * oc, (ref // cols + 1) * orr)))
k = (oy.max() - oy.min()) / (ys.max() - ys.min())
dx = (ox.min() + ox.max()) / 2 - k * (xs.min() + xs.max()) / 2; dy = oy.max() - k * ys.max()
sheet = Image.new('RGBA', old.size, (0, 0, 0, 0)); edges = []
for i, cell in enumerate(cells):
    s = cell.resize((round(cell.width * k), round(cell.height * k)), Image.LANCZOS)
    f = Image.new('RGBA', (oc, orr), (0, 0, 0, 0)); f.paste(s, (round(dx), round(dy)), s)
    yy, xx = box(f)
    if len(xx) and (xx.min() <= 0 or yy.min() <= 0 or xx.max() >= oc - 1 or yy.max() >= orr - 1): edges.append(i)
    sheet.alpha_composite(f, ((i % cols) * oc, (i // cols) * orr))
sheet.save(out_p, lossless=True, method=6)
print(out_p, 'scale', round(k, 3), 'offset', round(dx), round(dy), 'edge frames', edges)
