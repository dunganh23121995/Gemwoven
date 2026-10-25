"""defringe.py <image> [cols rows] [--bleed] [--dry]: remove chroma-key fringes from a Lumi sheet in place (no pixel moved or drawn).

Lumi is violet, so a key colour left on her outline shows as a pink/magenta rim on her blonde hair and white/gold
armour (magenta-keyed sheets) or a lime rim (green-keyed sheets). Each outline pixel (<= 2.5 px from transparency,
or semi-transparent) that is lime (G - max(R,B) > 10) or yellow-green (G > R + 6, G > B + 20; blonde never has G above R) takes the colour of the nearest clean opaque pixel within 6 px;
one that is hot pink/key red (R > 170, R - G > 70, B - G > -15) takes the colour of the nearest blonde/skin/gold/
white pixel within 6 px, so her purple cloak (R < 170) and violet gems keep their own edges.
Not for form-3 sheets with pink orbit rings. Alpha is unchanged."""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

path = sys.argv[1]; nums = [int(v) for v in sys.argv[2:4] if v.isdigit()]
cols, rows = nums if len(nums) == 2 else (1, 1)
bleed = '--bleed' in sys.argv
im = Image.open(path).convert('RGBA'); x = np.asarray(im).astype(np.int32).copy(); cw, ch = im.width // cols, im.height // rows
changed = 0
for j in range(rows):
    for i in range(cols):
        c = x[j * ch:(j + 1) * ch, i * cw:(i + 1) * cw]
        r, g, b, a = c[..., 0], c[..., 1], c[..., 2], c[..., 3]
        solid = a > 128
        depth = ndimage.distance_transform_edt(solid)
        edge = (a > 0) & ((depth <= 2.5) | (a < 250))
        magenta = np.minimum(r, b) - g > 22
        green = (g - np.maximum(r, b) > 10) | ((g > r + 6) & (g > b + 20))   # lime, or yellow-green (blonde gone green)
        pink = (np.where(a < 200, r > 110, r > 170)) & (b - g > -15) & (r - g > 70)   # hot pink / key-red rim
        light = (a >= 200) & (r > 200) & (g > 140) & ~green     # blonde hair, skin, gold, white
        clean = (a >= 200) & ~magenta & ~green & ~pink
        fix = np.zeros_like(edge)
        for donors, bad in ((light, edge & pink), (clean, edge & green)):
            if not donors.any() or not bad.any(): continue
            dist, (iy, ix) = ndimage.distance_transform_edt(~donors, return_indices=True)
            f = bad & (dist <= 6)
            for k in range(3): c[..., k] = np.where(f, c[..., k][iy, ix], c[..., k])
            fix |= f
        if bleed:  # --bleed: semi-transparent rim pixels take the colour of the nearest solid pixel (keyed rims stay dark/olive otherwise)
            solid_px = a >= 240
            if solid_px.any():
                dist, (iy, ix) = ndimage.distance_transform_edt(~solid_px, return_indices=True)
                f = (a > 0) & (a < 220) & (dist <= 3)
                # opaque olive rim on blonde hair: green spill left with G pulled up to R (yellow gone dark/olive)
                hair = (a >= 240) & (r > 200) & (g > 140) & (r >= g + 15)
                if hair.any():
                    hd, (hy, hx) = ndimage.distance_transform_edt(~hair, return_indices=True)
                    olive = (a > 0) & (depth <= 3.5) & (g >= r - 4) & (b < g - 30) & (r < 225) & (hd <= 4)
                    for k in range(3): c[..., k] = np.where(olive, c[..., k][hy, hx], c[..., k])
                    fix |= olive
                for k in range(3): c[..., k] = np.where(f, c[..., k][iy, ix], c[..., k])
                fix |= f
        changed += int(fix.sum())
print(path.replace('\\', '/').split('/assets/')[-1], 'outline pixels recoloured:', changed)
if '--dry' not in sys.argv:
    out = Image.fromarray(x.clip(0, 255).astype('uint8'), 'RGBA')
    if path.endswith('.webp'): out.save(path, 'WEBP', lossless=True, method=6, exact=True)
    else: out.save(path)
