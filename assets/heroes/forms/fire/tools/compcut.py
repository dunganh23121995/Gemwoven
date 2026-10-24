"""Workaround for fidget.py proc when Codex lets a frame run over its grid line into the next cell
(a long weapon or a fire arc): each opaque part of the sheet is given to the cell holding its
centre, every frame is cut on a padded square (cell + pad) so its overhang is kept, then the same
stabilize_idle.py step as fidget.py proc runs (same flags), and fidget.webp is written for accept.
usage: python compcut.py <cid> <name> [--pad=0.12] [--cell=384] [--fill=.55] [extra stabilize flags...]"""
import json, subprocess, sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage
ROOT = Path("D:/Project/Gemwoven")
sys.path.insert(0, str(ROOT / "assets/gemwoven/elites"))
import fidget  # noqa
cid, name, *rest = sys.argv[1:]
opt = {r.split("=")[0]: r.split("=")[1] for r in rest if r.startswith("--") and "=" in r and r.split("=")[0] in ("--pad", "--cell", "--fill")}
splice = [tuple(map(int, r.split("=")[1].split(":"))) for r in rest if r.startswith("--splice=")]   # --splice=4:3 places frame 4 exactly like frame 3 (same template row)
extra = [r for r in rest if r.split("=")[0] not in ("--pad", "--cell", "--fill", "--splice")]
pad_r = float(opt.get("--pad", .12)); cell = int(opt.get("--cell", 384)); fill = float(opt.get("--fill", .55))
d = fidget.WORK / cid.replace("/", "_") / name
s = np.asarray(Image.open(d / "raw.png").convert("RGB"), dtype=np.float32)
H, W = s.shape[:2]; h, w = H // 4, W // 2
r, g, b = s[..., 0], s[..., 1], s[..., 2]
key = np.minimum(r, b) - g
alpha = np.clip(1 - (key - 60) / 90, 0, 1)
spill = np.clip(key / 255, 0, 1)
s[..., 0] = np.where(key > 0, np.minimum(r, g + (r - g) * (1 - spill)), r)
s[..., 2] = np.where(key > 0, np.minimum(b, g + (b - g) * (1 - spill)), b)
labels, n = ndimage.label(ndimage.binary_dilation(alpha > .05, iterations=2))
owner = np.zeros(n + 1, dtype=int) - 1
for i, c in enumerate(ndimage.center_of_mass(alpha > .05, labels, range(1, n + 1))):
    if not np.isnan(c[0]):
        owner[i + 1] = min(3, int(c[0] // h)) * 2 + min(1, int(c[1] // w))
pad = int(w * pad_r)
(d / "cells").mkdir(exist_ok=True)
for i in range(8):
    mine = owner[labels] == i
    a = np.where(mine, alpha, 0)
    rgba = np.concatenate([s, a[..., None] * 255], -1).clip(0, 255).astype("uint8")
    y0, x0 = (i // 2) * h - pad, (i % 2) * w - pad
    canvas = np.zeros((h + 2 * pad, w + 2 * pad, 4), dtype="uint8")
    sy0, sx0 = max(0, y0), max(0, x0); sy1, sx1 = min(H, y0 + h + 2 * pad), min(W, x0 + w + 2 * pad)
    canvas[sy0 - y0:sy1 - y0, sx0 - x0:sx1 - x0] = rgba[sy0:sy1, sx0:sx1]
    edge = canvas[..., 3] > 128
    print("frame", i + 1, "touches padded edge" if edge[:2].any() or edge[-2:].any() or edge[:, :2].any() or edge[:, -2:].any() else "ok")
    Image.fromarray(canvas, "RGBA").resize((cell, cell), Image.Resampling.LANCZOS).save(d / "cells" / f"idle-{i + 1}.png")
out = subprocess.run([sys.executable, str(fidget.HERE / "stabilize_idle.py"), str(fidget.master_of(cid)), str(d / "stable"), *[str(d / f"cells/idle-{i}.png") for i in range(1, 9)],
                      "--core", "9999", "--same-transform", "--grow", "3", "--cell", str(cell), "--fill", str(fill), "--open", "1", "--min-area", "20", *extra], capture_output=True, text=True, cwd=ROOT)
if out.returncode:
    sys.exit(out.stderr)
for bad, good in splice:
    o = subprocess.run([sys.executable, str(fidget.HERE / "stabilize_idle.py"), str(fidget.master_of(cid)), str(d / "stable-splice"), str(d / f"cells/idle-{bad}.png"), str(d / f"cells/idle-{good}.png"),
                        "--core", "9999", "--same-transform", "--no-refine", "--grow", "3", "--cell", str(cell), "--fill", str(fill), "--open", "1", "--min-area", "20", *extra], capture_output=True, text=True, cwd=ROOT)
    if o.returncode:
        sys.exit(o.stderr)
    print("splice", bad, "like", good, [(f["dx"], f["dy"], f["scale"]) for f in json.loads((d / "stable-splice/stabilize-meta.json").read_text())["frames"]])
    Image.open(d / "stable-splice/idle-1.png").save(d / f"stable/idle-{bad}.png")
meta = json.loads((d / "stable/stabilize-meta.json").read_text())
print([(f["dx"], f["dy"], f["scale"], f["error"]) for f in meta["frames"]], out.stdout.strip())
sheet = Image.new("RGBA", (cell * 2, cell * 4), (0, 0, 0, 0))
for i in range(8):
    sheet.alpha_composite(Image.open(d / f"stable/idle-{i + 1}.png"), ((i % 2) * cell, (i // 2) * cell))
sheet.save(d / "fidget.webp", lossless=True, method=6)
