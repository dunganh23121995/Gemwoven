"""Pre-register processed idle frames to the master's fitted silhouette (placement stabilize_idle uses:
bbox centred, feet at 94%, 80% height) by an alpha-IoU search over scale and shift, with one shared scale
(median of per-frame bests). Usage: precenter.py master.png proc_dir out_dir"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image
master, src, dst = sys.argv[1:4]
cell, P = 256, 40
m = Image.open(master).convert("RGBA"); m = m.crop(m.getbbox())
sc = min(cell*0.80/m.height, cell*0.92/m.width)
m = m.resize((max(1, round(m.width*sc)), max(1, round(m.height*sc))), Image.Resampling.LANCZOS)
M = Image.new("RGBA", (cell, cell), (0,0,0,0)); M.alpha_composite(m, ((cell-m.width)//2, round(cell*0.94)-m.height))
ma = np.asarray(M)[..., 3] > 128

def base(f, s):
    """frame scaled by s, placed bbox-centred / feet-on-line, on a padded canvas"""
    c = f.crop(f.getbbox())
    c = c.resize((max(1, round(c.width*s)), max(1, round(c.height*s))), Image.Resampling.LANCZOS)
    big = Image.new("RGBA", (cell+2*P, cell+2*P), (0,0,0,0))
    big.alpha_composite(c, (P + round(cell/2 - c.width/2), P + round(cell*0.94) - c.height))
    return big

def search(big, dxs, dys):
    a = np.asarray(big)[..., 3] > 128
    best = None
    for dx in dxs:
        for dy in dys:
            fa = a[P-dy:P-dy+cell, P-dx:P-dx+cell]
            v = (fa & ma).sum() / max(1, (fa | ma).sum())
            if best is None or v > best[0]: best = (v, dx, dy)
    return best

frames = [Image.open(f"{src}/idle-{i}.png").convert("RGBA") for i in range(1, 9)]
per = []
for f in frames:
    b = f.getbbox(); s0 = m.height / (b[3]-b[1])
    cands = [(search(base(f, s), range(-30, 31, 2), range(-16, 9, 2)), s) for s in np.linspace(s0*0.85, s0*1.15, 21)]
    per.append(max(cands, key=lambda t: t[0][0]))
fs = float(np.median([p[1] for p in per]))
Path(dst).mkdir(exist_ok=True)
for i, f in enumerate(frames, 1):
    big = base(f, fs)
    v, dx, dy = search(big, range(-P+1, P), range(-20, 12))
    big.crop((P-dx, P-dy, P-dx+cell, P-dy+cell)).save(f"{dst}/idle-{i}.png")
print("scale", round(fs, 3), "iou", [round(p[0][0], 3) for p in per])
