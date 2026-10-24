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


def fit_master(path, cell, fill=.80):
    """Master on a cell x cell canvas with its feet on the shared sole line (94% of the cell)."""
    im = Image.open(path).convert("RGBA")
    box = im.getbbox()
    im = im.crop(box)
    target_h = cell * fill
    scale = min(target_h / im.height, cell * 0.92 / im.width)
    im = im.resize((max(1, round(im.width * scale)), max(1, round(im.height * scale))), Image.Resampling.LANCZOS)
    out = Image.new("RGBA", (cell, cell), (0, 0, 0, 0))
    foot = .94 if fill >= .8 else .86   # a roomy cell also leaves room below the feet (a rift, a cloud)
    out.alpha_composite(im, ((cell - im.width) // 2, round(cell * foot) - im.height))
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


def register(frame, master, anchor, legs=False):
    mask = ndimage.binary_dilation(master[..., 3] > .5, iterations=3)
    if legs:
        # Fit on the lower body only (legs, boots, cloak hem): arms and weapons above may move freely.
        ys = np.where(master[..., 3] > .5)[0]
        mask[:int(ys.max() - (ys.max() - ys.min()) * .32)] = False
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
    ap.add_argument("--as-is", action="store_true", help="the master is already a cell of the sheet being replaced: keep its size and place (combat sheets must not change scale)")
    ap.add_argument("--fill", type=float, default=.80, help="master height as a share of the cell (lower = more room for wide actions)")
    ap.add_argument("--cols", type=int, default=2)
    ap.add_argument("--same-transform", action="store_true", help="register frame 1 only and place every frame like it (frames drawn at one scale, e.g. an action whose big moving parts would pull a per-frame registration)")
    ap.add_argument("--whole", action="store_true", help="place every frame but keep its drawing whole (frames 1 and 8 stay the master)")
    ap.add_argument("--whole-loop", action="store_true", help="like --whole for every frame, 1 and 8 included (a resting loop drawn entirely by Codex)")
    ap.add_argument("--min-area", type=int, default=60, help="smallest moving patch kept (px); lower it for small glows")
    ap.add_argument("--open", type=int, default=2, help="opening iterations that drop thin slivers")
    ap.add_argument("--no-refine", action="store_true", help="with --same-transform: place every frame exactly like the last one (cells drawn on one template)")
    ap.add_argument("--lock-legs", action="store_true", help="fit every frame (shift and scale) on the master's lower body, so the hero stands still while arms and weapons move")
    ap.add_argument("--free", default="", help="x0,y0,x1,y1 (cell fractions): a part that moves away (a fist leaving the chest) is taken from the drawing there even inside the rigid core")
    ap.add_argument("--grow", type=int, default=0, help="widen the taken motion by N px so no sliver of the master's old pose remains")
    args = ap.parse_args()
    out = Path(args.out_dir)
    out.mkdir(parents=True, exist_ok=True)
    master = rgba(Image.open(args.master).convert("RGBA").resize((args.cell, args.cell), Image.Resampling.LANCZOS)) if args.as_is else fit_master(args.master, args.cell, args.fill)
    ys, xs = np.where(master[..., 3] > .5)
    anchor = (float(np.median(xs)), float(ys.max()))
    core = ndimage.distance_transform_edt(master[..., 3] > .5) > args.core
    if args.free:
        x0, y0, x1, y1 = (float(v) for v in args.free.split(","))
        core[int(y0 * args.cell):int(y1 * args.cell), int(x0 * args.cell):int(x1 * args.cell)] = False
    pm = lambda a: np.concatenate([a[..., :3] * a[..., 3:], a[..., 3:]], -1)
    frames, report, fixed = [], [], None
    if args.same_transform:
        # The placement comes from the LAST frame, which every action ends on in the resting pose
        # (an entrance's first frame may hold only a slash in the air, with no body to fit).
        last = rgba(Image.open(args.frames[-1]).resize((args.cell, args.cell), Image.Resampling.LANCZOS))
        fixed = register(last, master, anchor)
    for index, path in enumerate(args.frames):
        frame = rgba(Image.open(path).resize((args.cell, args.cell), Image.Resampling.LANCZOS))
        if args.lock_legs:
            err, dx, dy, s = register(frame, master, anchor, legs=True)
        elif args.same_transform and fixed and args.no_refine:
            dx, dy, s = fixed[1:]; err = score(warp(frame, dx, dy, s, anchor), master, ndimage.binary_dilation(master[..., 3] > .5, iterations=3))
        elif args.same_transform and fixed:
            # Same scale as frame 1; the position is refined on the legs alone (they never move in
            # an idle action), so a frame Codex drew a little higher or lower still lands its feet.
            s = fixed[3]; legs = ndimage.binary_dilation(master[..., 3] > .5, iterations=3); legs[:int(anchor[1] - (anchor[1] - ys.min()) * .35)] = False
            # First guess: put this frame's soles on the master's soles, feet centred on the master's feet.
            probe = warp(frame, fixed[1], fixed[2], s, anchor)[..., 3] > .5; py, px = np.where(probe)
            gy = int(round(ys.max() - py.max())); low = px[py > py.max() - (ys.max() - ys.min()) * .12]
            # Midpoint of the foot band, not its median: with two feet of similar size the median
            # jumps from one foot to the other between the master and a frame.
            band = xs[ys > ys.max() - (ys.max() - ys.min()) * .12]
            gx = int(round((band.min() + band.max()) / 2 - (low.min() + low.max()) / 2))
            err, dx, dy = min((score(warp(frame, x, y, s, anchor), master, legs), x, y) for y in range(fixed[2] + gy - 8, fixed[2] + gy + 9, 2) for x in range(fixed[1] + gx - 8, fixed[1] + gx + 9, 2))
            err, dx, dy = min((score(warp(frame, x, y, s, anchor), master, legs), x, y) for y in range(dy - 1, dy + 2) for x in range(dx - 1, dx + 2))
        else:
            err, dx, dy, s = register(frame, master, anchor)
            fixed = (err, dx, dy, s)
        moved = warp(frame, dx, dy, s, anchor)
        change = np.abs(pm(moved) - pm(master)).max(-1)
        free = np.zeros_like(core)
        if args.free:
            free[int(y0 * args.cell):int(y1 * args.cell), int(x0 * args.cell):int(x1 * args.cell)] = True
        take = ((change > .2) & ~core) | (free & (change > .06))                        # real motion only, never the body core
        take = ndimage.binary_opening(take, iterations=args.open) if args.open else take  # thin slivers on rigid outlines are jitter, not motion
        labels, count = ndimage.label(take)
        if count:
            sizes = ndimage.sum(take, labels, range(1, count + 1))
            take = np.isin(labels, [i + 1 for i, n in enumerate(sizes) if n >= args.min_area])
        if args.grow:
            take = ndimage.binary_dilation(take, iterations=args.grow)
        # Where the drawing left an area empty (an ear, a braid or a tail that swung away), the
        # master's faint anti-aliased outline must not stay behind as a ghost line; a 1-2 px rim
        # offset is not a vacated part.
        vacated = ndimage.binary_opening((master[..., 3] > .02) & (moved[..., 3] < .1) & ~core, iterations=1)
        vl, vn = ndimage.label(vacated)
        if vn:
            vs = ndimage.sum(vacated, vl, range(1, vn + 1)); vacated = np.isin(vl, [i + 1 for i, n in enumerate(vs) if n >= 25])
        vacated = ndimage.binary_dilation(vacated, iterations=2)
        take = take | vacated
        weight = np.asarray(Image.fromarray((take * 255).astype("uint8")).filter(ImageFilter.GaussianBlur(2.2)), dtype=np.float32)[..., None] / 255
        weight = np.maximum(weight, vacated[..., None].astype(np.float32))
        if args.whole_loop or (args.whole and 0 < index < len(args.frames) - 1):
            weight = np.ones_like(weight)
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
