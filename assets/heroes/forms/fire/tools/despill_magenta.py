"""Remove leftover magenta chroma-key fringe from transparent sprite sheets (lossless, in place).

Only pixels near the transparent edge (or semi-transparent ones) whose colour is tinted toward
#FF00FF are touched; their RGB is replaced by the nearest clean opaque pixel's colour, alpha kept.
Strongly magenta pixels trapped inside the body (enclosed key gaps) are recoloured the same way.
Outline pixels near the edge with a purple cast get their blue pulled down toward red-brown.
Isolated pink specks (tiny components that are mostly magenta) are cleared.
Usage: python despill_magenta.py [--dry] <image> [...]
"""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

def despill(im):
    a = np.asarray(im.convert("RGBA")).astype(np.int32)
    r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    tint = (np.minimum(r, b) - g > 35) & (b * 100 > r * 45) & (al > 0)
    solid = al >= 64
    near_edge = ndimage.binary_dilation(~solid, iterations=3)
    strong = (np.minimum(r, b) - g > 60) & (b * 100 > r * 55) & (al > 0)
    bad = (tint & (near_edge | (al < 200))) | strong
    # tiny components dominated by magenta are keying specks
    lab, k = ndimage.label(al > 0)
    cleared = 0
    if k:
        idx = range(1, k + 1)
        size = ndimage.sum(np.ones_like(lab), lab, idx)
        magn = ndimage.sum(tint, lab, idx)
        drop = [i + 1 for i, (s, m) in enumerate(zip(size, magn)) if s <= 30 and m >= s * .4]
        if drop:
            mask = np.isin(lab, drop); cleared = int(mask.sum()); a[mask, 3] = 0; bad &= ~mask
    good = solid & ~tint & ~strong & (al >= 200)
    fixed = int(bad.sum())
    if fixed and good.any():
        _, (iy, ix) = ndimage.distance_transform_edt(~good, return_indices=True)
        ys, xs = np.nonzero(bad)
        a[ys, xs, :3] = a[iy[ys, xs], ix[ys, xs], :3]
    # softer purple cast on outline pixels near the edge: pull blue down toward a red-brown
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    soft = (np.minimum(r, b) - g > 25) & (b * 100 > r * 40) & near_edge & (a[..., 3] > 0)
    target = np.minimum(b, g + (r - g) // 4)
    soft &= target < b
    a[..., 2] = np.where(soft, target, b)
    fixed += int(soft.sum())
    return Image.fromarray(a.astype(np.uint8), "RGBA"), fixed, cleared

if __name__ == "__main__":
    dry = "--dry" in sys.argv
    for path in [p for p in sys.argv[1:] if p != "--dry"]:
        src = Image.open(path)
        out, fixed, cleared = despill(src)
        print(f"{path}: recoloured {fixed} fringe px, cleared {cleared} speck px")
        if dry or not (fixed or cleared):
            continue
        if path.lower().endswith(".webp"):
            out.save(path, lossless=True, quality=100, method=6)
        else:
            out.save(path)
