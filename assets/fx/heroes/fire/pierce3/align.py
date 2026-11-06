# The spear-hit burst (owner 07/11: "loại hiệu ứng mũi lao trúng địch"): every frame's impact point on one spot, so the
# burst does not jump between frames. The point is the centroid of each frame's white-hot core; the last frame (embers
# only) keeps the shift of the frame before it. Writes raw-aligned.png for export_fx.py.
import json
import numpy as np
from PIL import Image
im = np.asarray(Image.open('pierce3/raw-sheet.png').convert('RGB')).astype(int); H, W = im.shape[:2]; cw, ch = W // 2, H // 2
cells = [im[(i // 2) * ch:(i // 2 + 1) * ch, (i % 2) * cw:(i % 2 + 1) * cw] for i in range(4)]
def core(c):
    # the largest white-hot blob (the star at the impact point; the flames' highlights are smaller)
    from scipy import ndimage
    m = (c[..., 0] > 248) & (c[..., 1] > 240) & (c[..., 2] > 200)
    lab, n = ndimage.label(ndimage.binary_dilation(m, iterations=3))
    if not n: return None
    sizes = ndimage.sum(m, lab, range(1, n + 1)); k = int(np.argmax(sizes)) + 1
    if sizes[k - 1] < 40: return None
    ys, xs = np.nonzero(m & (lab == k)); return xs.mean(), ys.mean()
cores = [core(c) for c in cells[:3]] + [None]; print([tuple(round(v) for v in c) if c else None for c in cores])
target = cores[1]; out = np.full_like(im, (255, 0, 255)); last = (0, 0)
for i, c in enumerate(cells):
    dx, dy = (round(target[0] - cores[i][0]), round(target[1] - cores[i][1])) if cores[i] else last; last = (dx, dy)
    sh = np.full_like(c, (255, 0, 255)); ys, xs = np.mgrid[0:ch, 0:cw]; ty, tx = ys + dy, xs + dx; ok = (ty >= 0) & (ty < ch) & (tx >= 0) & (tx < cw)
    sh[ty[ok], tx[ok]] = c[ys[ok], xs[ok]]
    out[(i // 2) * ch:(i // 2 + 1) * ch, (i % 2) * cw:(i % 2 + 1) * cw] = sh
Image.fromarray(out.astype(np.uint8)).save('pierce3/raw-aligned.png')
json.dump({'impact': [round(target[0] / cw, 3), round(target[1] / ch, 3)]}, open('pierce3/impact.json', 'w'))
print('impact point', round(target[0] / cw, 3), round(target[1] / ch, 3))
