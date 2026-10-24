"""cut.py <dir> <name> [--pad=1.25] [--cell=384]
Cut a Codex 2x4 sheet into its 8 frames by connected parts instead of a fixed grid: Codex's rows are not
always equal and wide roots or a raised hammer can run past the nominal cell line. Every connected part of
the keyed sheet goes to the frame cell holding most of its pixels (loose leaves by centre), and each frame
is put on a canvas `pad` times the nominal cell (centred on its nominal cell), so nothing is cut. Keying is
the same as fidget.py key_cells. Writes <work>/cells/idle-N.png (cell x cell) and removes cells-orig.
Placement only: nothing drawn, warped or stretched (one uniform resize like key_cells)."""
import shutil, sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path("D:/Project/Gemwoven")
d, name, *flags = sys.argv[1:]
pad = next((float(f.split("=")[1]) for f in flags if f.startswith("--pad=")), 1.25)
cell = next((int(f.split("=")[1]) for f in flags if f.startswith("--cell=")), 384)
W = ROOT / ".build-cache/fidgets" / d.replace("/", "_") / name
green = (W / "green").exists()
sheet = np.asarray(Image.open(W / "raw.png").convert("RGB"), dtype=np.float32)
H, Wd = sheet.shape[:2]; h, w = H // 4, Wd // 2
r, g, b = sheet[..., 0], sheet[..., 1], sheet[..., 2]
key = g - np.maximum(r, b) if green else np.minimum(r, b) - g
alpha = np.clip(1 - (key - 60) / 90, 0, 1)
spill = np.clip(key / 255, 0, 1)
c = sheet.copy()
if green:
    c[..., 1] = np.where(key > 0, np.maximum(r, b) + (g - np.maximum(r, b)) * (1 - spill), g)
else:
    c[..., 0] = np.where(key > 0, np.minimum(r, g + (r - g) * (1 - spill)), r)
    c[..., 2] = np.where(key > 0, np.minimum(b, g + (b - g) * (1 - spill)), b)
despill = next((float(f.split("=")[1]) for f in flags if f.startswith("--despill-below=")), None)
if despill is not None and not green:
    # magenta caught between thin roots: below this share of each row band, a pixel whose blue and red both
    # exceed green is key spill (the design has no pink/violet near the ground here): pull it to neutral
    rows = (np.arange(H) % h) / h >= despill
    sus = rows[:, None] & (c[..., 2] > c[..., 1]) & (c[..., 0] > c[..., 1])
    c[..., 2] = np.where(sus, c[..., 1], c[..., 2]); c[..., 0] = np.where(sus, c[..., 1] + (c[..., 0] - c[..., 1]) * .5, c[..., 0])
    alpha = np.where(sus & (key > 20), alpha * .5, alpha)
labels, n = ndimage.label(ndimage.binary_dilation(alpha > .02, iterations=2))
owner = np.zeros(n + 1, int)
grid = (np.arange(H)[:, None] // h).clip(0, 3) * 2 + (np.arange(Wd)[None, :] // w).clip(0, 1)
for lab in range(1, n + 1):
    m = labels == lab
    cnt = np.bincount(grid[m], minlength=8)
    owner[lab] = cnt.argmax() if cnt.max() >= .8 * cnt.sum() else -2   # two frames' parts touching: split on the grid
fr = owner[labels]; fr[labels == 0] = -1
fr = np.where(fr == -2, grid, fr)
side = int(round(max(h, w) * pad))
shutil.rmtree(W / "cells-orig", ignore_errors=True)
(W / "cells").mkdir(exist_ok=True)
rgba = np.concatenate([c, alpha[..., None] * 255], -1)
for i in range(8):
    cy, cx = (i // 2) * h + h // 2, (i % 2) * w + w // 2
    out = np.zeros((side, side, 4), np.float32)
    y0, x0 = cy - side // 2, cx - side // 2
    ys, xs = max(0, y0), max(0, x0); ye, xe = min(H, y0 + side), min(Wd, x0 + side)
    part = rgba[ys:ye, xs:xe].copy(); mine = fr[ys:ye, xs:xe] == i
    part[..., 3] *= mine
    out[ys - y0:ye - y0, xs - x0:xe - x0] = part
    edge = out[..., 3] > 128
    hit = [edge[:2].any(), edge[-2:].any(), edge[:, :2].any(), edge[:, -2:].any()]
    if any(hit):
        print("frame", i + 1, "still touches the padded canvas edge", hit)
    Image.fromarray(out.clip(0, 255).astype("uint8"), "RGBA").resize((cell, cell), Image.Resampling.LANCZOS).save(W / f"cells/idle-{i + 1}.png")
print("cut", name, "into 8 cells, pad", pad, "components", n)
