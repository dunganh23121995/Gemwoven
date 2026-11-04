"""Approved plaza NPC masters (attempt 5, Codex 8.7 / 8.6) -> keyed master, card portrait, rig resting frame.

  python assets/gemwoven/raw/plaza-npc/prep.py            both NPCs
Keys the magenta with the shared generate2dsprite processor, pulls the last pink rim pixels to a warm outline brown,
writes <id>/proc/raw-sheet-clean.png (keyed, full canvas), <id>/master.png (cropped) and the card portrait
assets/gemwoven/plaza/npc-<id>.webp, then `npc_rig.py rest plaza-<id>` stands her in the rig cell.
"""
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
PROC = "C:/Users/dungc/.codex/skills/generate2dsprite/scripts/generate2dsprite.py"
APPROVED = {"guide": "raw-master-5.png", "weaver": "raw-master-5.png"}


def despill(path):
    a = np.asarray(Image.open(path).convert("RGBA")).astype(np.float32)
    alpha = a[..., 3] > 8
    band = alpha & ~ndimage.binary_erosion(alpha, iterations=4)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    # chroma-key pink only: red and blue both high above green and close to each other (deep purples stay)
    pink = band & (r - g > 40) & (b - g > 40) & (r > 120) & (b > 110) & (np.abs(r - b) < 80)
    lum = (r + g + b) / 3
    for k, f in enumerate((1.25, .95, .8)):
        a[..., k] = np.where(pink, np.clip(lum * f, 0, 255), a[..., k])
    Image.fromarray(a.clip(0, 255).astype("uint8"), "RGBA").save(path)
    return int(pink.sum())


# Pink jewels set in gold that the key ate (raw-canvas boxes x0, y0, x1, y1): the weaver's hairpin.
JEWELS = {"weaver": [(680, 170, 780, 262)]}


def jewels(npc, path, raw_path):
    """Inside a jewel box, an enclosed hole gets its own drawn pixels back from the raw wherever they differ from
    the key, turned from magenta to ruby so they never read as the key leaking through."""
    im = np.asarray(Image.open(path).convert("RGBA")).copy()
    raw = np.asarray(Image.open(raw_path).convert("RGB")).astype(np.float32)
    key = np.median(raw[:24, :24].reshape(-1, 3), 0)
    holes = ndimage.binary_fill_holes(im[..., 3] > 0) & (im[..., 3] == 0)
    back = 0
    for x0, y0, x1, y1 in JEWELS.get(npc, []):
        m = np.zeros_like(holes); m[y0:y1, x0:x1] = holes[y0:y1, x0:x1]
        px = raw[m]
        dist = np.sqrt(((px - key) ** 2).sum(1))
        a = np.clip((dist - 22) / 30, 0, 1)
        lum = px.mean(1, keepdims=True)
        ruby = np.concatenate([px[:, :1] * .9, px[:, 1:2] * .4 + lum * .1, px[:, 2:] * .32], 1)
        im[m, :3] = ruby.clip(0, 255).astype("uint8"); im[m, 3] = (a * 255).astype("uint8")
        back += int((a > .5).sum())
    Image.fromarray(im, "RGBA").save(path)
    return back


def portrait(npc, master):
    """Card and list portrait (round sockets in plaza.js): a square bust around her head, found from the rig's part map
    (blue = head) when it exists, cut from the full-resolution master."""
    rig = ROOT / f"assets/gemwoven/plaza/npcs/{npc}/rig/show"
    n = 640
    s = min(n * .82 / master.height, n * .86 / master.width)
    ox, oy = (n - round(master.width * s)) // 2, round(n * .95) - round(master.height * s)
    if (rig / "parts.png").exists():
        p = np.asarray(Image.open(rig / "parts.png").convert("RGB")).astype(int)
        head = (p[..., 2] > 200) & (p[..., 0] < 60) & (p[..., 1] < 60)
        ys, xs = np.where(head)
        cx, top, bottom = (np.percentile(xs, 5) + np.percentile(xs, 95)) / 2, ys.min(), np.percentile(ys, 99)
        cx, top, bottom = (cx - ox) / s, (top - oy) / s, (bottom - oy) / s
    else:
        cx, top, bottom = master.width / 2, 0, master.height * .25
    side = (bottom - top) * 1.55
    box = (round(cx - side / 2), round(top - side * .04), round(cx + side / 2), round(top + side * .96))
    sq = Image.new("RGBA", (box[2] - box[0], box[3] - box[1]), (0, 0, 0, 0))
    sq.alpha_composite(master.crop((max(0, box[0]), max(0, box[1]), min(master.width, box[2]), min(master.height, box[3]))), (max(0, -box[0]), max(0, -box[1])))
    sq.resize((320, 320), Image.Resampling.LANCZOS).save(ROOT / f"assets/gemwoven/plaza/npc-{npc}.webp", quality=92, alpha_quality=100, method=6)


for npc, raw in APPROVED.items():
    d = HERE / npc
    subprocess.run([sys.executable, PROC, "process", "--input", str(d / raw), "--target", "npc", "--mode", "single", "--output-dir", str(d / "proc"),
                    "--rows", "1", "--cols", "1", "--scale-strategy", "preserve", "--allow-source-edge-touch", "--component-mode", "all"],
                   check=True, capture_output=True)
    clean = d / "proc/raw-sheet-clean.png"
    print(npc, "jewels", jewels(npc, clean, d / raw), "despilled", despill(clean))
    im = Image.open(clean).convert("RGBA")
    im = im.crop(im.getbbox())
    im.save(d / "master.png")
    subprocess.run([sys.executable, str(ROOT / "assets/gemwoven/npc/npc_rig.py"), "rest", f"plaza-{npc}"], check=True)
    portrait(npc, im)
