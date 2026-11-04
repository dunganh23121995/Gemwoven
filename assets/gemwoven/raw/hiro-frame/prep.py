"""Key Hiro's avatar frame off magenta and fit it to the season frames' geometry (hole about 63% of the width, centred
like Mika's), so the HUD and the wardrobe place it with the same CSS as every other frame."""
import numpy as np
from PIL import Image
from scipy import ndimage
R = 'D:/Project/Gemwoven/assets/gemwoven/raw/hiro-frame/'
OUT = 'D:/Project/Gemwoven/assets/gemwoven/season/hiro/frame.webp'
a = np.array(Image.open(R + 'raw.png').convert('RGBA')).astype(np.float32)
r, g, b = a[..., 0], a[..., 1], a[..., 2]
d = np.sqrt((r - 255) ** 2 + g ** 2 + (b - 255) ** 2)
alpha = np.clip((d - 60) / 70, 0, 1)
# despill: pull pinkish rim pixels toward the ring's brown
pink = (alpha < 1) & (r - g > 40) & (b - g > 40)
lum = (r + g + b) / 3
for i, k in enumerate((1.2, .9, .7)):
    a[..., i] = np.where(pink, np.clip(lum * k, 0, 255), a[..., i])
a[..., 3] = alpha * 255
im = Image.fromarray(a.clip(0, 255).astype('uint8'), 'RGBA')
im = im.crop(im.getbbox())
# the hole: the largest transparent component that does not touch the border
m = np.array(im)[..., 3] < 30
lab, n = ndimage.label(m)
edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])))
sizes = [(int((lab == i).sum()), i) for i in range(1, n + 1) if i not in edge]
hole = lab == max(sizes)[1]
ys, xs = np.where(hole)
hw, hcx, hcy = xs.max() - xs.min(), (xs.max() + xs.min()) / 2, (ys.max() + ys.min()) / 2
W = int(round(hw / 0.635)); H = int(round(W * 433 / 401))
cv = Image.new('RGBA', (W, H), (0, 0, 0, 0))
cv.alpha_composite(im, (int(round(W * 0.46 - hcx)), int(round(H * 0.49 - hcy))))
cv = cv.crop((0, 0, W, H))
cv.thumbnail((420, 460), Image.LANCZOS)
import os; os.makedirs(os.path.dirname(OUT), exist_ok=True)
cv.save(OUT, quality=92, method=6)
print(cv.size, 'hole', hw, 'of', im.size)
