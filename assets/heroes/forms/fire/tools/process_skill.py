"""Process Mika's form-2/3 body sheets that need room around the body (the ultimate's skill
swing, the form-3 dash) into runtime sheets.

The raw sheet is drawn from a character anchor sheet at a smaller body scale than the idle, so a
raised or extended weapon stays inside its cell. Every cell gets the SAME transform (one uniform
scale, one offset): the poses keep the positions they were drawn at, nothing is re-centred or
re-scaled per frame. The scale is chosen so the reference frame's silhouette height matches the
form's idle body; the sheet then carries `scale` (sprite-runtime.js grows the drawing box about
the feet) so the body shows at the idle's size in combat.

usage: python process_skill.py <form> <action> [--ref-frame N] [--cell 448] [--feet-from-ref]
writes form-N/<action>.webp, form-N/<action>/frame-XX.png, form-N/<action>/process-meta.json
"""
import argparse
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path.home() / ".codex/skills/generate2dsprite/scripts"))
from generate2dsprite import remove_bg_magenta  # noqa: E402

IDLE_CELL = 256


def silhouette(img, min_area=300):
    """Alpha mask of the subject: every component of a useful size (a sword may touch the body
    only through a thin antialiased grip)."""
    alpha = np.asarray(img.getchannel("A")) > 24
    labels, count = ndimage.label(alpha)
    if not count:
        return alpha
    areas = ndimage.sum(alpha, labels, range(1, count + 1))
    keep = [i + 1 for i, a in enumerate(areas) if a >= min_area]
    return np.isin(labels, keep)


def bbox(mask):
    ys, xs = np.nonzero(mask)
    return xs.min(), ys.min(), xs.max(), ys.max()


def feet(mask, band, span=None):
    """Boots: the two largest blobs in the bottom band of the silhouette -> (centre x, sole y).
    span limits the search to the columns where the boots stand (a sword tip may reach the floor)."""
    if span:
        mask = mask.copy()
        mask[:, :span[0]] = False
        mask[:, span[1]:] = False
    rows = np.nonzero(mask.sum(axis=1) >= 3)[0]
    sole = rows.max()
    strip = np.zeros_like(mask)
    top = max(0, int(sole - band))
    strip[top:sole + 1] = mask[top:sole + 1]
    labels, count = ndimage.label(strip)
    areas = ndimage.sum(strip, labels, range(1, count + 1))
    biggest = np.argsort(areas)[::-1][:2] + 1
    xs = [ndimage.center_of_mass(strip, labels, i)[1] for i in biggest]
    return float(np.mean(xs)), float(sole)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("form", type=int)
    p.add_argument("action")
    p.add_argument("--ref-frame", type=int, default=5, help="frame whose pose matches the idle guard")
    p.add_argument("--cell", type=int, default=512)
    p.add_argument("--rows", type=int, default=2)
    p.add_argument("--cols", type=int, default=3)
    p.add_argument("--duration", type=int, default=100)
    p.add_argument("--ref-h", type=float, default=0, help="reference silhouette height in raw pixels (default: measured on --ref-frame)")
    p.add_argument("--align", choices=["feet", "row", "none"], default="feet", help="per-frame: put each frame's boots on the idle's boots")
    p.add_argument("--shift-x", type=float, default=0, help="extra horizontal offset in output pixels (centre a run's body, not its boots)")
    p.add_argument("--k256", type=float, default=0, help="raw px -> px of a 256px actor cell (sets the body size directly)")
    p.add_argument("--scale", type=float, default=0, help="with --k256: the sheet's runtime scale (drawing box growth)")
    p.add_argument("--body-frac", type=float, default=0.40, help="share of the cell height the reference silhouette fills")
    a = p.parse_args()

    base = ROOT / f"form-{a.form}"
    work = base / a.action
    raw = Image.open(work / "raw-original.png").convert("RGBA")
    clean = remove_bg_magenta(raw, 100, 150)
    cw, ch = clean.width / a.cols, clean.height / a.rows
    # A pose may reach past its raw cell (a long glaive): every useful component goes to the cell
    # holding its centre and is cut out whole, with room around the cell.
    whole = silhouette(clean)
    labels, count = ndimage.label(whole)
    centres = ndimage.center_of_mass(whole, labels, range(1, count + 1))
    pad = round(max(cw, ch) * .35)
    padded = Image.new("RGBA", (clean.width + 2 * pad, clean.height + 2 * pad), (0, 0, 0, 0))
    padded.paste(clean, (pad, pad))
    lab = np.pad(labels, pad)
    cells, masks = [], []
    for i in range(a.rows * a.cols):
        c, r = i % a.cols, i // a.cols
        own = [j + 1 for j, (y, x) in enumerate(centres) if int(x // cw) == c and int(y // ch) == r]
        box = (round(c * cw), round(r * ch), round((c + 1) * cw) + 2 * pad, round((r + 1) * ch) + 2 * pad)
        cell = padded.crop(box)
        mask = np.isin(lab[box[1]:box[3], box[0]:box[2]], own)
        arr = np.asarray(cell).copy()
        arr[..., 3] = np.where(mask, arr[..., 3], 0)
        cells.append(Image.fromarray(arr, "RGBA"))
        masks.append(mask)

    # The form's idle: its silhouette height and feet line in the 256px runtime cell.
    idle = Image.open(base / "idle.webp").convert("RGBA").crop((0, 0, IDLE_CELL, IDLE_CELL))
    ix0, iy0, ix1, iy1 = bbox(np.asarray(idle.getchannel("A")) > 24)
    idle_h = iy1 - iy0
    idle_feet = feet(np.asarray(idle.getchannel("A")) > 24, idle_h * .07)
    forms = json.loads((ROOT / "forms.json").read_text(encoding="utf-8"))
    foot_y = forms["forms"][str(a.form)]["actions"]["idle"]["footY"]

    rx0, ry0, rx1, ry1 = bbox(masks[a.ref_frame])
    ref_h = a.ref_h or (ry1 - ry0)
    # Shown in combat, a cell spans the actor box grown by `scale`: the reference silhouette
    # (body_frac of the cell) must show as tall as the idle's (idle_h of a 256px cell).
    runtime_scale = idle_h / (IDLE_CELL * a.body_frac)
    body_out = a.body_frac * a.cell
    if a.k256:
        runtime_scale = a.scale or 1.0
        body_out = a.k256 * a.cell / (IDLE_CELL * runtime_scale) * ref_h
    k = body_out / ref_h
    # Each frame's boots land where the idle's stand (centre x, sole on footY): the model may
    # draw rows a little higher or lower in their cells, the stance must not jump.
    fx = a.cell * idle_feet[0] / IDLE_CELL
    fy = a.cell * foot_y
    span = (round(pad + cw * .12), round(pad + cw * .72))
    ref_feet = feet(masks[a.ref_frame], ref_h * .07, span)
    frames, meta = [], []
    for i, cell in enumerate(cells):
        if a.align == "row":  # a run: each row keyed on its first (contact) frame
            own = feet(masks[i - i % a.cols], ref_h * .07, span)
        else:
            own = feet(masks[i], ref_h * .07, span) if a.align == "feet" else ref_feet
        ox = fx - k * own[0] + a.shift_x
        oy = fy - k * own[1]
        scaled = cell.resize((round(cell.width * k), round(cell.height * k)), Image.Resampling.LANCZOS)
        out = Image.new("RGBA", (a.cell, a.cell), (0, 0, 0, 0))
        out.paste(scaled, (round(ox), round(oy)), scaled)
        m = np.asarray(out.getchannel("A")) > 24
        x0, y0, x1, y1 = bbox(m)
        edge = x0 <= 0 or y0 <= 0 or x1 >= a.cell - 1 or y1 >= a.cell - 1
        frames.append(out)
        meta.append({"bbox": [int(x0), int(y0), int(x1), int(y1)], "edge_touch": bool(edge)})
        out.save(work / f"frame-{i:02}.png")
    sheet = Image.new("RGBA", (a.cols * a.cell, a.rows * a.cell), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        sheet.alpha_composite(f, ((i % a.cols) * a.cell, (i // a.cols) * a.cell))
    sheet.save(base / f"{a.action}.webp", lossless=True, method=6)
    info = {"cell": a.cell, "scale": round(runtime_scale, 4), "footY": foot_y, "k": k, "ref_frame": a.ref_frame,
            "idle_h": int(idle_h), "ref_h": int(ref_h), "frames": meta}
    (work / "process-meta.json").write_text(json.dumps(info, indent=2), encoding="utf-8")
    print(json.dumps(info, indent=1))


if __name__ == "__main__":
    main()
