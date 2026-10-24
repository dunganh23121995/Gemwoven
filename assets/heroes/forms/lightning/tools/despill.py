"""despill.py <sheet.webp>: green-key fringe cleanup in place (the shared keyer leaves green on
semi-transparent hair edges). Only pixels on the silhouette edge (<=2 px in, or not fully opaque)
whose green exceeds both red and blue get green clamped to max(red, blue). Nothing is moved or drawn."""
import sys, numpy as np
from PIL import Image
from scipy import ndimage
p = sys.argv[1]
im = np.asarray(Image.open(p).convert("RGBA")).astype(np.int32)
r, g, b, a = im[..., 0], im[..., 1], im[..., 2], im[..., 3]
edge = (ndimage.distance_transform_edt(a > 128) <= 2.5) | (a < 250)
cap = np.maximum(r, b)
m = edge & (a > 0) & (g > cap)
before = int((m & (g > cap + 12) & (a > 100)).sum())
im[..., 1] = np.where(m, cap, g)
Image.fromarray(im.clip(0, 255).astype("uint8"), "RGBA").save(p, lossless=True, method=6)
print("despilled", int(m.sum()), "px (", before, "clearly green )")
