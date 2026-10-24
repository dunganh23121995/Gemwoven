"""lock.py <sheet.webp> <master.png> <box x0,y0,x1,y1 cell fractions> [--as-is | --fill=.55] [--feather=4] [--frames=2,3,...]
Keep a region (head + antlers) rigid: inside the box every frame takes the accepted master's own pixels
(placed exactly the way stabilize_idle.py places the master), with a soft seam at the box's lower edge.
Thin antlers lie outside stabilize's rigid core, so Codex's slightly different antlers would boil; this
uses the same idea as the core (master pixels), only for a named region. Nothing is drawn or warped.
Rewrites the sheet in place (keeps a .bak copy)."""
import shutil, sys
from pathlib import Path
import numpy as np
from PIL import Image
sys.path.insert(0, "D:/Project/Gemwoven/assets/gemwoven/elites")
from stabilize_idle import fit_master, rgba  # noqa: E402

sheet_p, master_p, box, *flags = sys.argv[1:]
feather = next((int(f.split("=")[1]) for f in flags if f.startswith("--feather=")), 4)
frames = next(([int(v) for v in f.split("=")[1].split(",")] for f in flags if f.startswith("--frames=")), list(range(1, 9)))
sheet = Image.open(sheet_p).convert("RGBA"); cell = sheet.width // 2
if "--as-is" in flags:
    m = rgba(Image.open(master_p).convert("RGBA").resize((cell, cell), Image.Resampling.LANCZOS))
else:
    fill = next((float(f.split("=")[1]) for f in flags if f.startswith("--fill=")), .55)
    m = fit_master(master_p, cell, fill)
x0, y0, x1, y1 = (int(float(v) * cell) for v in box.split(","))
w = np.zeros((cell, cell), np.float32)
w[y0:y1, x0:x1] = 1
for k in range(feather):   # soft lower edge only: the shoulders below breathe
    yy = y1 - feather + k
    w[yy, x0:x1] = 1 - (k + 1) / (feather + 1)
if "--shape" in flags:   # only the master's own silhouette inside the box (something may pass behind the head)
    from scipy import ndimage
    sil = ndimage.binary_erosion(m[..., 3] > .5, iterations=1).astype(np.float32)
    sil = np.asarray(Image.fromarray((sil * 255).astype("uint8")).filter(__import__("PIL.ImageFilter", fromlist=["x"]).GaussianBlur(1.2)), np.float32) / 255
    w = w * sil
w = w[..., None]
shutil.copy2(sheet_p, str(sheet_p) + ".bak")
arr = np.asarray(sheet, dtype=np.float32) / 255
pm = lambda a: np.concatenate([a[..., :3] * a[..., 3:], a[..., 3:]], -1)
for i in frames:
    cx, cy = ((i - 1) % 2) * cell, ((i - 1) // 2) * cell
    f = arr[cy:cy + cell, cx:cx + cell]
    mixed = pm(m) * w + pm(f) * (1 - w)
    a = mixed[..., 3:]
    col = np.where(a > 1e-4, mixed[..., :3] / np.maximum(a, 1e-4), 0)
    arr[cy:cy + cell, cx:cx + cell] = np.concatenate([col, a], -1)
Image.fromarray((arr.clip(0, 1) * 255).astype("uint8"), "RGBA").save(sheet_p, lossless=True, method=6)
print("locked", box, "frames", frames)
