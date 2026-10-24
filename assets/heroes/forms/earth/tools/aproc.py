"""aproc.py <dir> <name> <box x0,y0,x1,y1 (cell fractions)> [--ref=N] [stabilize flags...]
Like `fidget.py proc` for a showcase sheet, but every Codex cell is first moved by a whole-pixel shift so the
still part of the body inside <box> lines up with the reference cell (default the last, the resting pose);
then all cells are placed like the reference (--same-transform --no-refine), so the body cannot jump when a
moving shield, hammer, roots or debris would pull a leg fit. Only placement: nothing is drawn, warped or scaled.
Expects fidget.py proc to have run once (it cuts and keys the cells into <work>/cells)."""
import shutil, subprocess, sys
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path("D:/Project/Gemwoven")
d, name, box, *rest = sys.argv[1:]
ref = next((int(a.split("=")[1]) for a in rest if a.startswith("--ref=")), 8)
flags = [a for a in rest if not a.startswith("--ref=")]
W = ROOT / ".build-cache/fidgets" / d.replace("/", "_") / name
cells = W / "cells"
orig = W / "cells-orig"
if orig.exists() and orig.stat().st_mtime < (W / 'raw.png').stat().st_mtime:
    shutil.rmtree(orig)
if not orig.exists():
    shutil.copytree(cells, orig)
load = lambda i: np.asarray(Image.open(orig / f"idle-{i}.png").convert("RGBA"), dtype=np.float32) / 255
R = load(ref); n = R.shape[0]
x0, y0, x1, y1 = (int(float(v) * n) for v in box.split(","))
pm = lambda a: a[..., :3] * a[..., 3:]
mask = np.zeros(R.shape[:2], bool); mask[y0:y1, x0:x1] = True; mask &= R[..., 3] > .5
def place(a, dx, dy, s):
    """whole-cell similarity placement (registration only), anchored at the cell's bottom centre"""
    im = Image.fromarray((a * 255).astype("uint8"), "RGBA").convert("RGBa")
    ax, ay = n / 2, n * .86
    co = (1 / s, 0, ax - (ax + dx) / s, 0, 1 / s, ay - (ay + dy) / s)
    return np.asarray(im.transform(im.size, Image.AFFINE, co, Image.BICUBIC).convert("RGBA"), dtype=np.float32) / 255
def cost(F, dx, dy, s):
    m = place(F, dx, dy, s)
    return np.abs(pm(m) - pm(R))[mask].mean() + np.abs(m[..., 3] - R[..., 3])[mask].mean()
for i in range(1, 9):
    F = load(i)
    best = min((cost(F, dx, dy, 1.0), dx, dy, 1.0) for dy in range(-48, 49, 4) for dx in range(-24, 25, 4))
    for step in (2, 1):
        best = min((cost(F, dx, dy, s), dx, dy, s) for s in [best[3] + k * .01 * step for k in (-2, -1, 0, 1, 2)]
                   for dy in range(best[2] - 2 * step, best[2] + 2 * step + 1, step) for dx in range(best[1] - 2 * step, best[1] + 2 * step + 1, step))
    Image.fromarray((place(F, best[1], best[2], best[3]) * 255).clip(0, 255).astype("uint8"), "RGBA").save(cells / f"idle-{i}.png")
    print(f"cell {i}: shift {best[1]:+d},{best[2]:+d} scale {best[3]:.2f} err {best[0]:.3f}")
order = [cells / f"idle-{i}.png" for i in range(1, 9)]
# stabilize_idle places every frame like the LAST one given; put the reference last by registering it alone first
shutil.rmtree(W / "stable", ignore_errors=True)
r = subprocess.run([sys.executable, str(ROOT / "assets/gemwoven/elites/stabilize_idle.py"), str(ROOT / d / "master.png"), str(W / "stable"), *map(str, order),
                    "--same-transform", "--no-refine", "--grow", "3", "--cell", "384", "--fill", ".55", "--open", "1", "--min-area", "20", *flags],
                   capture_output=True, text=True, cwd=ROOT)
print(r.stdout.strip()[-500:], r.stderr[-1500:])
shutil.copy2(W / "stable/idle.webp", W / "fidget.webp")
