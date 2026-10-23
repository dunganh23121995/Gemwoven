"""Stabilize a generated Noct idle loop against his accepted master drawing.

Generated frames never repeat the hood, eyes, weapon or boots pixel for pixel, which made the
idle boil. Each frame is registered to the master (translation + small scale search on the
rigid parts), then composited: rigid parts and the body core come from the master, only the
cloak/robe margins (where the cloth really moves) come from the generated frame, joined on a
feathered seam. Output frames keep the master's exact scale, root and foot line.

Usage: python stabilize_idle.py <master.png> <out_dir> <form> <frame.png>...
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

# Rigid parts per form in 256px cells: rows above `neck` (hood/face), weapon capsules
# [x1,y1,x2,y2,halfWidth], rectangles [x,y,w,h] (hood crown, legs and boots), and the boot
# band above `foot`. Legs must stay planted while the cloak flies.
RIGID = {
    "1": {"neck": 138, "foot": 246, "capsules": [[100, 80, 114, 128, 7]], "rects": [[68, 200, 44, 56], [118, 190, 54, 66]]},
    "2": {"neck": 138, "foot": 248, "capsules": [[4, 248, 134, 174, 13], [116, 154, 144, 194, 11]], "rects": [[86, 204, 50, 52], [152, 204, 52, 52]]},
    "3": {"neck": 144, "foot": 249, "capsules": [[99, 44, 133, 240, 7], [80, 46, 104, 84, 11]], "rects": [[0, 0, 256, 92], [172, 84, 202, 132], [74, 206, 116, 50]]},
}
CORE_INSET = 10   # body core = pixels this far inside the master silhouette
FEATHER = 4.0


def rgba(path):
    return np.asarray(Image.open(path).convert("RGBA"), dtype=np.float32) / 255


def rigid_mask(spec, alpha):
    n = alpha.shape[0]
    y, x = np.mgrid[0:n, 0:n]
    m = y < spec["neck"]
    m |= y > spec["foot"] - 12
    for x1, y1, x2, y2, r in spec["capsules"]:
        vx, vy = x2 - x1, y2 - y1
        k = np.clip(((x - x1) * vx + (y - y1) * vy) / (vx * vx + vy * vy), 0, 1)
        m |= np.hypot(x - x1 - k * vx, y - y1 - k * vy) < r
    for rx, ry, rw, rh in spec["rects"]:
        m |= (x >= rx) & (x < rx + rw) & (y >= ry) & (y < ry + rh)
    core = ndimage.distance_transform_edt(alpha > .5) > CORE_INSET
    return m | core


def transform(img, dx, dy, s, anchor):
    """Scale about the foot anchor, then translate (PIL affine maps output -> input)."""
    ax, ay = anchor
    im = Image.fromarray((img * 255).astype("uint8"), "RGBA")
    a, b, c = 1 / s, 0, ax - (ax + dx) / s
    d, e, f = 0, 1 / s, ay - (ay + dy) / s
    return np.asarray(im.transform(im.size, Image.AFFINE, (a, b, c, d, e, f), Image.BICUBIC), dtype=np.float32) / 255


def register(frame, master, mask, anchor):
    """Brute-force the shift/scale that best matches the rigid parts (premultiplied colour)."""
    target = master[..., :3] * master[..., 3:]
    best = None
    # Start from the silhouette height ratio, then search around it.
    rows = lambda a: np.where(a.max(axis=1) > .5)[0]
    fr, mr = rows(frame[..., 3]), rows(master[..., 3])
    s0 = (mr.max() - mr.min()) / max(1, fr.max() - fr.min())
    for s in (s0 * k for k in (0.97, 0.985, 1.0, 1.015, 1.03)):
        for dy in range(-8, 9, 2):
            for dx in range(-8, 9, 2):
                t = transform(frame, dx, dy, s, anchor)
                err = np.abs(t[..., :3] * t[..., 3:] - target)[mask].mean() + np.abs(t[..., 3] - master[..., 3])[mask].mean()
                if best is None or err < best[0]:
                    best = (err, dx, dy, s)
    _, dx0, dy0, s = best
    for dy in range(dy0 - 1, dy0 + 2):          # refine to the pixel
        for dx in range(dx0 - 1, dx0 + 2):
            t = transform(frame, dx, dy, s, anchor)
            err = np.abs(t[..., :3] * t[..., 3:] - target)[mask].mean() + np.abs(t[..., 3] - master[..., 3])[mask].mean()
            if err < best[0]:
                best = (err, dx, dy, s)
    return best


def main():
    master_path, out_dir, form, *frames = sys.argv[1:]
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    master = rgba(master_path)
    spec = RIGID[form]
    rigid = rigid_mask(spec, master[..., 3])
    ys, xs = np.where(master[..., 3] > .5)
    anchor = (float(np.median(xs)), float(ys.max()))
    weight = np.asarray(Image.fromarray((rigid * 255).astype("uint8")).filter(ImageFilter.GaussianBlur(FEATHER)), dtype=np.float32)[..., None] / 255
    report = []
    for index, path in enumerate(frames):
        err, dx, dy, s = register(rgba(path), master, rigid & (master[..., 3] > .5), anchor)
        moving = transform(rgba(path), dx, dy, s, anchor)
        # Premultiplied blend so seams never fringe.
        pm = lambda a: np.concatenate([a[..., :3] * a[..., 3:], a[..., 3:]], -1)
        mixed = pm(master) * weight + pm(moving) * (1 - weight)
        alpha = mixed[..., 3:]
        colour = np.where(alpha > 1e-4, mixed[..., :3] / np.maximum(alpha, 1e-4), 0)
        Image.fromarray((np.concatenate([colour, alpha], -1).clip(0, 1) * 255).astype("uint8"), "RGBA").save(out / f"idle-{index + 1}.png")
        report.append({"frame": Path(path).name, "dx": dx, "dy": dy, "scale": s, "rigid_error": round(float(err), 4)})
    (out / "stabilize-meta.json").write_text(json.dumps({"master": master_path, "form": form, "frames": report}, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report))


if __name__ == "__main__":
    main()
