"""despill.py <sheet.webp> <frames e.g. 3,4>: in the named frames (which hold no pink/violet design colour)
pull leftover magenta key spill to neutral (blue and red down to green), fading very spilled edge pixels."""
import sys, numpy as np
from PIL import Image
p, frames = sys.argv[1], [int(v) for v in sys.argv[2].split(",")]
a = np.asarray(Image.open(p).convert("RGBA"), dtype=np.float32); c = a.shape[1] // 2
for i in frames:
    y, x = ((i - 1) // 2) * c, ((i - 1) % 2) * c
    f = a[y:y + c, x:x + c]
    r, g, b = f[..., 0], f[..., 1], f[..., 2]
    sus = (b > g + 8) & (r > g + 8)
    k = np.clip((np.minimum(r, b) - g) / 120, 0, 1)
    f[..., 3] = np.where(sus, f[..., 3] * (1 - .6 * k), f[..., 3])
    f[..., 0] = np.where(sus, g + (r - g) * .45, r); f[..., 2] = np.where(sus, g, b)
    print("frame", i, "despilled", int(sus.sum()), "px")
Image.fromarray(a.clip(0, 255).astype("uint8"), "RGBA").save(p, lossless=True, method=6)
