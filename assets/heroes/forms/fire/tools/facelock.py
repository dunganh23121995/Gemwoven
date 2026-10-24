"""Keep a hero's face rigid in a showcase idle (the pipeline's rule: rigid parts come from the master).
A face that looks toward the silhouette edge lies inside the --core band, so the stabilizer takes it from
the drawing and it boils. This pastes the placed master back inside a feathered ellipse over the face.
usage: python facelock.py <showcase dir> <name> cx cy rx ry [--cell=384 --fill=.55]   (cell px)
Rewrites .build-cache/fidgets/<dir>/<name>/fidget.webp (run accept afterwards)."""
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter
ROOT = Path("D:/Project/Gemwoven")
sys.path.insert(0, str(ROOT / "assets/gemwoven/elites"))
from stabilize_idle import fit_master  # noqa
rel, name, cx, cy, rx, ry, *rest = sys.argv[1:]
cx, cy, rx, ry = map(float, (cx, cy, rx, ry))
opt = {r.split("=")[0]: r.split("=")[1] for r in rest if "=" in r}
cell = int(opt.get("--cell", 384)); fill = float(opt.get("--fill", .55))
d = ROOT / ".build-cache/fidgets" / rel.replace("/", "_") / name
master = fit_master(ROOT / rel / "master.png", cell, fill)
yy, xx = np.mgrid[:cell, :cell]
mask = (((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2 <= 1).astype("uint8") * 255
w = np.asarray(Image.fromarray(mask).filter(ImageFilter.GaussianBlur(3)), dtype=np.float32)[..., None] / 255
pm = lambda a: np.concatenate([a[..., :3] * a[..., 3:], a[..., 3:]], -1)
sheet = Image.open(d / "fidget.webp").convert("RGBA")
out = Image.new("RGBA", sheet.size, (0, 0, 0, 0))
for i in range(8):
    box = ((i % 2) * cell, (i // 2) * cell, (i % 2 + 1) * cell, (i // 2 + 1) * cell)
    f = np.asarray(sheet.crop(box), dtype=np.float32) / 255
    mixed = pm(master) * w + pm(f) * (1 - w)
    a = mixed[..., 3:]
    col = np.where(a > 1e-4, mixed[..., :3] / np.maximum(a, 1e-4), 0)
    out.paste(Image.fromarray((np.concatenate([col, a], -1).clip(0, 1) * 255).astype("uint8"), "RGBA"), box[:2])
out.save(d / "fidget.webp", lossless=True, method=6)
print("face locked", rel, name)
