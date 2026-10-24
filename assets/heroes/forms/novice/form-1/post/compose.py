"""compose.py <rigid.webp> <whole.webp> <out.webp> box[;box...] : frames 2-8 = frame 1 of <rigid> (the master pose)
everywhere, except inside the boxes (x0,y0,x1,y1 px of a cell), where the registered Codex drawing of <whole> is taken
whole (no master remnants), on a feathered seam. Frame 1 stays the master. Pixel selection only, no drawing/warping."""
import sys
import numpy as np
from PIL import Image, ImageFilter
rig = np.asarray(Image.open(sys.argv[1]).convert("RGBA")).astype(np.float32) / 255
who = np.asarray(Image.open(sys.argv[2]).convert("RGBA")).astype(np.float32) / 255
c = rig.shape[1] // 2
cell = lambda i: (slice((i // 2) * c, (i // 2 + 1) * c), slice((i % 2) * c, (i % 2 + 1) * c))
m = np.zeros((c, c), np.uint8)
for b in sys.argv[4].split(";"):
    x0, y0, x1, y1 = map(int, b.split(",")); m[y0:y1, x0:x1] = 255
w = np.asarray(Image.fromarray(m).filter(ImageFilter.GaussianBlur(2)), np.float32)[..., None] / 255
pm = lambda a: np.concatenate([a[..., :3] * a[..., 3:], a[..., 3:]], -1)
master = pm(rig[cell(0)]); out = rig.copy()
for i in range(1, 8):
    mixed = master * (1 - w) + pm(who[cell(i)]) * w
    a = mixed[..., 3:]
    out[cell(i)] = np.concatenate([np.where(a > 1e-4, mixed[..., :3] / np.maximum(a, 1e-4), 0), a], -1)
Image.fromarray((out.clip(0, 1) * 255).astype("uint8"), "RGBA").save(sys.argv[3], lossless=True, method=6)
print("composed", sys.argv[4])
