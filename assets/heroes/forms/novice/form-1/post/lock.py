"""lock.py <sheet.webp> [free:]box[;box...] (free: = lock everything EXCEPT the boxes) : in frames 2-8, pixels inside the boxes (x0,y0,x1,y1 px
of the cell) come back from the resting frame (frame 1 = the master), feathered, like stabilize_idle's rigid core.
Only picks master pixels; never draws, warps or scales. Overwrites the sheet in place."""
import sys
import numpy as np
from PIL import Image, ImageFilter
path, spec = sys.argv[1], sys.argv[2]
invert = spec.startswith("free:"); spec = spec[5:] if invert else spec
boxes = [[int(v) for v in b.split(",")] for b in spec.split(";")]
im = np.asarray(Image.open(path).convert("RGBA")).astype(np.float32) / 255
c = im.shape[1] // 2
cell = lambda i: (slice((i // 2) * c, (i // 2 + 1) * c), slice((i % 2) * c, (i % 2 + 1) * c))
m = np.zeros((c, c), np.uint8)
for x0, y0, x1, y1 in boxes:
    m[y0:y1, x0:x1] = 255
m = 255 - m if invert else m
w = np.asarray(Image.fromarray(m).filter(ImageFilter.GaussianBlur(1.5)), np.float32)[..., None] / 255
pm = lambda a: np.concatenate([a[..., :3] * a[..., 3:], a[..., 3:]], -1)
ref = pm(im[cell(0)])
for i in range(1, 8):
    mixed = ref * w + pm(im[cell(i)]) * (1 - w)
    a = mixed[..., 3:]
    im[cell(i)] = np.concatenate([np.where(a > 1e-4, mixed[..., :3] / np.maximum(a, 1e-4), 0), a], -1)
Image.fromarray((im.clip(0, 1) * 255).astype("uint8"), "RGBA").save(path, lossless=True, method=6)
print("locked", boxes)
