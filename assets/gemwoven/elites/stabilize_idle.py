"""Stabilize a generated 8-frame idle loop against its accepted master drawing (any character).

Generated frames never repeat a drawing pixel for pixel, so a raw loop boils. Each processed frame
is registered to the master (scale + shift search), then composited: the body core and every pixel
that barely changed come from the master, and only clearly moving pixels near the silhouette
(cloaks, hair, tails, flames, held lights) come from the generated frame, on a feathered seam.

Usage: python stabilize_idle.py <master.png> <out_dir> <frame.png>... [--core 10] [--cell 256]
Writes out_dir/idle-1..N.png, idle.webp (2 columns) and stabilize-meta.json.
"""
import argparse
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage


def rgba(img):
    return np.asarray(img.convert("RGBA"), dtype=np.float32) / 255


def fit_master(path, cell):
    """Master on a cell x cell canvas with its feet on the shared sole line (94% of the cell)."""
    im = Image.open(path).convert("RGBA")
    box = im.getbbox()
    im = im.crop(box)
    target_h = cell * 0.80
    scale = min(target_h / im.height, cell * 0.92 / im.width)
    im = im.resize((max(1, round(im.width * scale)), max(1, round(im.height * scale))), Image.Resampling.LANCZOS)
    out = Image.new("RGBA", (cell, cell), (0, 0, 0, 0))
    out.alpha_composite(im, ((cell - im.width) // 2, round(cell * 0.94) - im.height))
    return rgba(out)


def warp(img, dx, dy, s, anchor):
    ax, ay = anchor
    # Resample premultiplied (RGBa): straight-alpha bicubic drags the dark colour of nearly
    # transparent edge pixels into moving cloth tips as smudges.
    im = Image.fromarray((img * 255).astype("uint8"), "RGBA").convert("RGBa")
    coeffs = (1 / s, 0, ax - (ax + dx) / s, 0, 1 / s, ay - (ay + dy) / s)
    return np.asarray(im.transform(im.size, Image.AFFINE, coeffs, Image.BICUBIC).convert("RGBA"), dtype=np.float32) / 255


def score(t, master, mask):
    pm = lambda a: a[..., :3] * a[..., 3:]
    return np.abs(pm(t) - pm(master))[mask].mean() + np.abs(t[..., 3] - master[..., 3])[mask].mean()


def register(frame, master, anchor):
    mask = ndimage.binary_dilation(master[..., 3] > .5, iterations=3)
    rows = lambda a: np.where(a.max(axis=1) > .5)[0]
    fr, mr = rows(frame[..., 3]), rows(master[..., 3])
    s0 = (mr.max() - mr.min()) / max(1, fr.max() - fr.min())
    mc = ndimage.center_of_mass(master[..., 3] > .5)
    best = None
    for s in (s0 * k for k in (0.86, 0.89, 0.92, 0.95, 0.98, 1.0, 1.02, 1.05, 1.08, 1.11, 1.14)):
        fc = ndimage.center_of_mass(warp(frame, 0, 0, s, anchor)[..., 3] > .5)
        gx, gy = round(mc[1] - fc[1]), round(mc[0] - fc[0])
        for dy in range(gy - 8, gy + 9, 2):
            for dx in range(gx - 8, gx + 9, 2):
                err = score(warp(frame, dx, dy, s, anchor), master, mask)
                if best is None or err < best[0]:
                    best = (err, dx, dy, s)
    _, dx0, dy0, s1 = best
    for s in (s1 * k for k in (0.99, 1.0, 1.01)):
        for dy in range(dy0 - 1, dy0 + 2):
            for dx in range(dx0 - 1, dx0 + 2):
                err = score(warp(frame, dx, dy, s, anchor), master, mask)
                if err < best[0]:
                    best = (err, dx, dy, s)
    return best


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("master")
    ap.add_argument("out_dir")
    ap.add_argument("frames", nargs="+")
    ap.add_argument("--core", type=float, default=10, help="pixels inside the master silhouette kept rigid")
    ap.add_argument("--cell", type=int, default=256)
    ap.add_argument("--cols", type=int, default=2)
    ap.add_argument("--same-transform", action="store_true", help="register frame 1 only and place every frame like it (frames drawn at one scale, e.g. an action whose big moving parts would pull a per-frame registration)")
    ap.add_argument("--grow", type=int, default=0, help="widen the taken motion by N px so no sliver of the master's old pose remains")
    args = ap.parse_args()
    out = Path(args.out_dir)
    out.mkdir(parents=True, exist_ok=True)
    master = fit_master(args.master, args.cell)
    ys, xs = np.where(master[..., 3] > .5)
    anchor = (float(np.median(xs)), float(ys.max()))
    core = ndimage.distance_transform_edt(master[..., 3] > .5) > args.core
    pm = lambda a: np.concatenate([a[..., :3] * a[..., 3:], a[..., 3:]], -1)
    frames, report, fixed = [], [], None
    for index, path in enumerate(args.frames):
        frame = rgba(Image.open(path).resize((args.cell, args.cell), Image.Resampling.LANCZOS))
        if args.same_transform and fixed:
            # Same scale as frame 1; the position is refined on the legs alone (they never move in
            # an idle action), so a frame Codex drew a little higher or lower still lands its feet.
            s = fixed[3]; legs = ndimage.binary_dilation(master[..., 3] > .5, iterations=3); legs[:int(anchor[1] - (anchor[1] - ys.min()) * .35)] = False
            # First guess: put this frame's soles on the master's soles, feet centred on the master's feet.
            probe = warp(frame, fixed[1], fixed[2], s, anchor)[..., 3] > .5; py, px = np.where(probe)
            gy = int(round(ys.max() - py.max())); low = px[py > py.max() - (ys.max() - ys.min()) * .12]
            gx = int(round(np.median(xs[ys > ys.max() - (ys.max() - ys.min()) * .12]) - np.median(low)))
            err, dx, dy = min((score(warp(frame, x, y, s, anchor), master, legs), x, y) for y in range(fixed[2] + gy - 8, fixed[2] + gy + 9, 2) for x in range(fixed[1] + gx - 8, fixed[1] + gx + 9, 2))
            err, dx, dy = min((score(warp(frame, x, y, s, anchor), master, legs), x, y) for y in range(dy - 1, dy + 2) for x in range(dx - 1, dx + 2))
        else:
            err, dx, dy, s = register(frame, master, anchor)
            fixed = (err, dx, dy, s)
        moved = warp(frame, dx, dy, s, anchor)
        change = np.abs(pm(moved) - pm(master)).max(-1)
        take = (change > .2) & ~core                        # real motion only, never the body core
        take = ndimage.binary_opening(take, iterations=2)   # thin slivers on rigid outlines are jitter, not motion
        labels, count = ndimage.label(take)
        if count:
            sizes = ndimage.sum(take, labels, range(1, count + 1))
            take = np.isin(labels, [i + 1 for i, n in enumerate(sizes) if n >= 60])
        if args.grow:
            take = ndimage.binary_dilation(take, iterations=args.grow)
        weight = np.asarray(Image.fromarray((take * 255).astype("uint8")).filter(ImageFilter.GaussianBlur(2.2)), dtype=np.float32)[..., None] / 255
        mixed = pm(master) * (1 - weight) + pm(moved) * weight
        alpha = mixed[..., 3:]
        colour = np.where(alpha > 1e-4, mixed[..., :3] / np.maximum(alpha, 1e-4), 0)
        result = Image.fromarray((np.concatenate([colour, alpha], -1).clip(0, 1) * 255).astype("uint8"), "RGBA")
        result.save(out / f"idle-{index + 1}.png")
        frames.append(result)
        report.append({"frame": Path(path).name, "dx": dx, "dy": dy, "scale": round(s, 4), "error": round(float(err), 4), "moving_share": round(float(take.mean()), 4)})
    rows = -(-len(frames) // args.cols)
    sheet = Image.new("RGBA", (args.cell * args.cols, args.cell * rows), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        sheet.alpha_composite(f, ((i % args.cols) * args.cell, (i // args.cols) * args.cell))
    sheet.save(out / "idle.webp", lossless=True, method=6)
    jitter = []
    arr = [np.asarray(f, dtype=np.int16) for f in frames]
    for i in range(len(arr)):
        a, b = arr[i], arr[(i + 1) % len(arr)]
        m = (a[..., 3] > 128) | (b[..., 3] > 128)
        jitter.append(round(float(np.abs(a[..., :3] - b[..., :3])[m].mean()), 2))
    (out / "stabilize-meta.json").write_text(json.dumps({"master": args.master, "frames": report, "jitter": jitter}, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"jitter": jitter, "moving": [r["moving_share"] for r in report]}))


if __name__ == "__main__":
    main()
