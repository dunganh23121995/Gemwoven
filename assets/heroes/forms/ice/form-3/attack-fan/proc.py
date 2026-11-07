# Yuki six-star basic attack redrawn as a fan gust (owner 07/11: the staff hand had a second hand on the staff; the
# effect is the fan gust "B"). Keys the magenta, then puts frame 1 exactly over the old sheet's frame 1 (same height,
# same bottom, same centre) and moves every frame by that same scale and offset, so the motion between frames stays.
import sys
import numpy as np
from PIL import Image
sys.path.insert(0, 'D:/Project/Gemwoven/assets/fx/heroes/fire'); from export_fx import key_out
raw = key_out(Image.open('raw-original.png')); old = Image.open('../attack.webp').convert('RGBA')
C = 512; cw, ch = raw.width / 3, raw.height / 2
cells = [raw.crop((round(c * cw), round(r * ch), round((c + 1) * cw), round((r + 1) * ch))) for r in range(2) for c in range(3)]
def box(im): return (np.asarray(im.getchannel('A')) > 60).nonzero()
ys, xs = box(cells[0]); oy, ox = box(old.crop((0, 0, C, C)))
k = (oy.max() - oy.min()) / (ys.max() - ys.min())
dx = (ox.min() + ox.max()) / 2 - k * (xs.min() + xs.max()) / 2; dy = oy.max() - k * ys.max()
sheet = Image.new('RGBA', (C * 3, C * 2), (0, 0, 0, 0))
for i, cell in enumerate(cells):
    s = cell.resize((round(cell.width * k), round(cell.height * k)), Image.LANCZOS)
    f = Image.new('RGBA', (C, C), (0, 0, 0, 0)); f.alpha_composite(s, (round(dx), round(dy))) if dx >= 0 and dy >= 0 else f.paste(s, (round(dx), round(dy)), s)
    a = np.asarray(f.getchannel('A')) > 60; yy, xx = a.nonzero()
    print(i, 'bbox', xx.min(), yy.min(), xx.max(), yy.max(), 'edge' if xx.min() <= 0 or yy.min() <= 0 or xx.max() >= C - 1 or yy.max() >= C - 1 else '')
    f.save(f'frame-{i:02}.png'); sheet.alpha_composite(f, ((i % 3) * C, (i // 3) * C))
sheet.save('../attack.webp', lossless=True, method=6); print('scale', round(k, 3), 'offset', round(dx), round(dy))
