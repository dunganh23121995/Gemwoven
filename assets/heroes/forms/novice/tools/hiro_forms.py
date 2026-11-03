"""Hiro (key 'novice') forms 2 and 3: key, cut and place the Codex drawings (nothing is drawn here).

Every picture comes from Codex (codex_image_gen.py, raw + prompt kept beside the output). This script
only keys the #FF00FF background, finds the drawn figures, applies ONE uniform scale per sheet (never
per frame, never stretched) and stands each frame on the shared feet line of a 512 px cell.

Keying: only the backdrop connected to the canvas edge (and enclosed pure-magenta gaps between limbs)
is removed, with a soft key and despill on a thin rim. Form 3 wears violet amethysts and red rubies,
which a global magenta key would punch holes into; inside the silhouette nothing is keyed.

  python tools/hiro_forms.py master <N>                 form-N/source/raw-master.png -> form-N/master.png (512),
                                                         combat-idle/master.png (256) + master-512.png
  python tools/hiro_forms.py anchor <N> <cols> <rows> <out.png>     scale/root template of the master
  python tools/hiro_forms.py sheet <N> <action> <cols> <rows> [k]   form-N/<action>/raw-original.png ->
                                                         form-N/<action>.webp + frames + process-meta.json
                                                         (k: extra uniform scale, default 1)
  python tools/hiro_forms.py portrait <N>               bust crop of the keyed master drawing -> form-N/portrait.png
  python tools/hiro_forms.py despill <sheet> <cols> <rows> [--no-deep] [--no-clear]  clean the key fringe of a finished sheet in place
  python tools/hiro_forms.py rose <sheet> <cols> <rows>    repaint rose key-tint patches Codex left INSIDE a silhouette (cloak lining)
  python tools/hiro_forms.py refit-entrance <N>         one uniform scale for a showcase entrance drawn larger than its loop
  python tools/hiro_forms.py showcase-master <N>        approved concept pose -> form-N/showcase/master.png (make_showcase.py then
                                                         skips its own master pose and draws the loop, fidgets and entrance on it)
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

HERE = Path(__file__).resolve().parent
NOVICE = HERE.parent
ROOT = HERE.parents[4]
ANCHOR = "C:/Users/dungc/.codex/skills/generate2dsprite/scripts/make_anchor_layout.py"
CELL = 512
SOLE = 481            # feet line: 94% of the cell, as every form sheet in forms.json (footY .94)
BODY = 353            # crown to soles of the resting master in a 512 cell (form 1's resting frame: 353)
BOOT_X = 238          # boots midpoint of the resting master (form 1's resting frame stands there)
KEY = np.array([255, 0, 255], np.float32)
POCKET = 12           # raw px: an enclosed magenta patch this close to the backdrop is backdrop too
SPILL_ZONE = 26       # raw px from the backdrop where dull violet shading is Codex's key spill
RIM_ZONE = 6          # raw px: the outermost rim, despilled whatever its saturation
MARGIN = 16           # px kept clear at the cell sides when a run sheet is slid sideways


def key(path):
    """RGBA float array of a magenta-backed drawing."""
    rgb = np.asarray(Image.open(path).convert("RGB"), np.float32)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    dist = np.sqrt(((rgb - KEY) ** 2).sum(-1))
    near = dist < 110
    lab, n = ndimage.label(near)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(border))
    # gaps between limbs and pockets between hair spikes: enclosed backdrop patches that are nearly
    # pure magenta, or that lie close to the outside (a gem sits deep inside armour, a pocket does not)
    outside = ndimage.distance_transform_edt(~bg)
    for i, sl in enumerate(ndimage.find_objects(lab)):
        if i + 1 in border or sl is None:
            continue
        part = lab[sl] == i + 1
        if (part.sum() >= 25 and np.median(dist[sl][part]) < 45) or outside[sl][part].min() <= POCKET:
            bg[sl] |= part
    rim = ndimage.binary_dilation(bg, iterations=4) & ~bg
    k = np.minimum(r, b) - g
    soft = np.clip(1 - (k - 60) / 90, 0, 1)
    alpha = np.where(bg, 0, np.where(rim, soft, 1)).astype(np.float32)
    # despill the rim: pull the magenta tint back toward neutral
    spill = np.clip(k / 255, 0, 1) * rim
    out = rgb.copy()
    out[..., 0] = np.where(spill > 0, np.minimum(r, g + (r - g) * (1 - spill)), r)
    out[..., 2] = np.where(spill > 0, np.minimum(b, g + (b - g) * (1 - spill)), b)
    # Codex tints the dark shading of hair spikes and collars near the backdrop violet. Near the
    # outline, a dull magenta-tinted pixel takes the hue of the nearest untinted body pixel at its own
    # brightness. Saturated violet or red gems (amethyst, ruby) are left alone except on the
    # outermost rim (RIM_ZONE), where no gem sits and Codex paints bright pink key highlights.
    r2, g2, b2 = out[..., 0], out[..., 1], out[..., 2]
    tint = (np.minimum(r2, b2) - g2 > 12) & (alpha > 0)
    edge = ndimage.distance_transform_edt(~bg)
    gem = (out.max(-1) - out.min(-1) >= 110) & ((b2 > r2 + 10) | (b2 - g2 < .2 * (r2 - g2)))   # violet or red, not pink
    zone = tint & ((edge <= RIM_ZONE) | ((edge <= SPILL_ZONE) & ~gem))
    if zone.any():
        donor = (alpha > .9) & ~tint
        _, (iy, ix) = ndimage.distance_transform_edt(~donor, return_indices=True)
        src = out[iy, ix]
        lum = lambda c: c @ np.array([.299, .587, .114], np.float32)
        k2 = np.clip(lum(out) / np.maximum(lum(src), 1), .5, 1.3)[..., None]
        out = np.where(zone[..., None], np.clip(src * k2, 0, 255), out)
    a = np.concatenate([out / 255, alpha[..., None]], -1)
    # specks: drop tiny islands far from the figures
    solid = a[..., 3] > .5
    lab, n = ndimage.label(ndimage.binary_dilation(solid, iterations=2))
    if n:
        sizes = ndimage.sum(solid, lab, range(1, n + 1))
        keep = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s >= 60])
        a[..., 3] *= keep
    return a


def to_img(a):
    return Image.fromarray((a.clip(0, 1) * 255 + .5).astype("uint8"), "RGBA")


def figures(a, count):
    """The `count` largest drawn figures (sword and body joined by a small dilation), row-major."""
    solid = a[..., 3] > .5
    lab, n = ndimage.label(ndimage.binary_dilation(solid, iterations=6))
    sizes = ndimage.sum(solid, lab, range(1, n + 1))
    order = np.argsort(sizes)[::-1][:count]
    objs = ndimage.find_objects(lab)
    figs = []
    for i in order:
        sl = objs[i]
        crop = a[sl].copy()
        crop[..., 3] *= (lab[sl] == i + 1)
        figs.append(((sl[0].start + sl[0].stop) / 2, (sl[1].start + sl[1].stop) / 2, sl, crop))
    return figs


def row_major(figs, cols):
    figs = sorted(figs, key=lambda f: f[0])
    rows = [sorted(figs[i:i + cols], key=lambda f: f[1]) for i in range(0, len(figs), cols)]
    return [f for row in rows for f in row]


def tight(a):
    ys, xs = np.where(a[..., 3] > .04)
    return a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]


def boots(a):
    """x of the midpoint of the two boots (solid runs >= 8px in the lowest 7% of the body), or None."""
    s = a[..., 3] >= .5
    ys = np.where(s.any(1))[0]
    h = ys.max() - ys.min()
    low = s[ys.max() - int(h * .07):ys.max() + 1]
    cols = low.sum(0)
    hit = np.where(cols >= max(3, cols.max() * .45))[0]
    runs = [r for r in np.split(hit, np.where(np.diff(hit) > 2)[0] + 1) if len(r) >= 8]
    return (runs[0].min() + runs[-1].max()) / 2 if len(runs) >= 2 else None


def head_x(a):
    """x centre of the top 22% of the body (the head), to stand frames without both boots down."""
    s = a[..., 3] >= .5
    ys = np.where(s.any(1))[0]
    band = s[ys.min():ys.min() + int((ys.max() - ys.min()) * .22)]
    xs = np.where(band.any(0))[0]
    return (xs.min() + xs.max()) / 2


def scaled(a, k):
    im = to_img(a)
    if abs(k - 1) > 1e-4:
        im = im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.Resampling.LANCZOS)
    return np.asarray(im, np.float32) / 255


def stand(a, x_at, ref_x):
    """Put a tight figure in a cell: its soles on SOLE, its reference point x_at on ref_x."""
    cell = Image.new("RGBA", (CELL, CELL))
    ox, oy = round(ref_x - x_at), SOLE + 1 - a.shape[0]
    im = to_img(a)
    cell.paste(im, (ox, oy))   # straight copy onto the empty cell: no darkened rim
    edge = not (0 <= ox and ox + a.shape[1] <= CELL and 0 <= oy)
    return cell, (ox, oy), edge


def master(n):
    d = NOVICE / f"form-{n}"
    a = tight(row_major(figures(key(d / "source/raw-master.png"), 1), 1)[0][3])
    k = BODY / a.shape[0]
    a = scaled(a, k)
    bx = boots(a)
    cell, off, edge = stand(a, bx if bx is not None else a.shape[1] / 2, BOOT_X)
    assert not edge, "master leaves the cell"
    cell.save(d / "master.png")
    ci = d / "combat-idle"; ci.mkdir(exist_ok=True)
    cell.save(ci / "master-512.png")
    cell.resize((256, 256), Image.Resampling.LANCZOS).save(ci / "master.png")
    meta = {"source": "source/raw-master.png", "prompt": "source/prompt-master.txt", "scale": round(k, 4), "bbox": cell.getbbox(), "bootsX": bx and round(bx + off[0], 1)}
    (d / "source/master-meta.json").write_text(json.dumps(meta, indent=1) + "\n", encoding="utf-8")
    print(json.dumps(meta))


def anchor(n, cols, rows, out):
    d = NOVICE / f"form-{n}"
    m = Image.open(d / "master.png").convert("RGBA")
    bg = Image.new("RGBA", m.size, (255, 0, 255, 255)); bg.alpha_composite(m)
    ident = Path(out).with_name("identity.png")
    bg.convert("RGB").resize((1024, 1024), Image.Resampling.LANCZOS).save(ident)
    tmp = Path(out).with_name("master-magenta-512.png"); bg.convert("RGB").save(tmp)
    subprocess.run([sys.executable, ANCHOR, "--input", str(tmp), "--rows", str(rows), "--cols", str(cols), "--cell-width", "512", "--cell-height", "512",
                    "--subject-height-ratio", str(round(BODY / CELL, 3)), "--feet-ratio", str(round((SOLE + 1) / CELL, 3)), "--output", str(out)], check=True)
    tmp.unlink()


def sheet(n, action, cols, rows, extra=1.0):
    d = NOVICE / f"form-{n}"
    work = d / action
    raw = work / "raw-original.png"
    a = key(raw)
    count = cols * rows
    figs = row_major(figures(a, count), cols)
    # one uniform scale: Codex drew on a template of cols x 512 px cells at the master's size
    k = cols * CELL / a.shape[1] * extra
    master_a = np.asarray(Image.open(d / "master.png").convert("RGBA"), np.float32) / 255
    mx = boots(tight(master_a))
    mb = Image.open(d / "master.png").getbbox()
    ref_x = BOOT_X
    out = Image.new("RGBA", (cols * CELL, rows * CELL))
    frames = []
    placed = []
    for i, (_, _, sl, crop) in enumerate(figs):
        f = scaled(tight(crop), k)
        bx = boots(f) if action != "run" else None
        if bx is None:
            # no two boots on the ground (a running stride): stand the head where the master's head is
            x_at, ref = head_x(f), mb[0] + head_x(tight(master_a))
        else:
            x_at, ref = bx, ref_x
        placed.append((f, x_at, ref, bx, sl))
    # A run trails its sword far behind: the whole sheet (all frames alike) slides right to keep a margin.
    shift = 0
    if action == "run":
        left = min(ref - x_at for _, x_at, ref, _, _ in placed)
        right = max(ref - x_at + f.shape[1] for f, x_at, ref, _, _ in placed)
        shift = max(0, min(MARGIN - left, CELL - MARGIN - right))
    for i, (f, x_at, ref, bx, sl) in enumerate(placed):
        cell, off, edge = stand(f, x_at, ref + shift)
        cell.save(work / f"frame-{i:02}.png")
        out.paste(cell, ((i % cols) * CELL, (i // cols) * CELL))
        frames.append({"frame": i + 1, "raw_bbox": [sl[1].start, sl[0].start, sl[1].stop, sl[0].stop], "height": int(f.shape[0]), "width": int(f.shape[1]),
                       "bbox": cell.getbbox(), "anchor": "boots" if bx is not None else "head", "edge": edge})
    out.save(d / f"{action}.webp", lossless=True, method=6)
    hs = [f["height"] for f in frames]
    meta = {"source": f"{action}/raw-original.png", "prompt": f"{action}/prompt-used.txt", "cols": cols, "rows": rows, "cell": CELL, "sole": SOLE,
            "uniformScale": round(k, 4), "masterHeight": BODY, "frames": frames, "edgeFrames": [f["frame"] for f in frames if f["edge"]],
            "heightRange": [min(hs), max(hs)],
            "processing": "hiro_forms.py sheet: magenta keyed outside the silhouette only (rim soft key + despill), largest figures found on the sheet, one uniform scale for the whole sheet, soles on y=481, boots midpoint (or head when a stride lifts a boot) at the master's place"}
    (work / "process-meta.json").write_text(json.dumps(meta, indent=1) + "\n", encoding="utf-8")
    print(json.dumps({k2: meta[k2] for k2 in ("uniformScale", "edgeFrames", "heightRange")}), [f["bbox"] for f in frames])


def portrait(n):
    """Bust crop (head to chest) of the full-resolution combat master drawing (source/raw-master.png)."""
    d = NOVICE / f"form-{n}"
    a = key(d / "source/raw-master.png")
    fig = row_major(figures(a, 1), 1)[0][3]
    im = to_img(tight(fig))
    box = im.getbbox()
    s = np.asarray(im)[..., 3] > 128
    top = np.where(s.any(1))[0].min()
    h = im.height
    side = round(h * .58)
    cx = head_x(np.asarray(im, np.float32) / 255)
    crop = im.crop((round(cx - side * .5), top - round(side * .04), round(cx + side * .5), top - round(side * .04) + side))
    crop.resize((256, 256), Image.Resampling.LANCZOS).save(d / "portrait.png")
    print("portrait", d / "portrait.png", box)


def showcase_master(n):
    """The approved concept pose (concepts/form-N/raw-master.png) as the showcase master: keyed, fitted like
    make_showcase.py fits a drawn master (longest side 86% of a 512 cell, soles at y 477, centred)."""
    d = NOVICE / f"form-{n}/showcase"; d.mkdir(parents=True, exist_ok=True)
    src = NOVICE / f"concepts/form-{n}"
    (d / "raw-master.png").write_bytes((src / "raw-master.png").read_bytes())
    (d / "prompt-master.txt").write_text((src / "prompt-used.txt").read_text(encoding="utf-8"), encoding="utf-8")
    a = tight(row_major(figures(key(d / "raw-master.png"), 1), 1)[0][3])
    k = CELL * .86 / max(a.shape[:2])
    im = to_img(scaled(a, k))
    cell = Image.new("RGBA", (CELL, CELL))
    cell.paste(im, ((CELL - im.width) // 2, 478 - im.height))
    cell.save(d / "master.png")
    print("showcase master", cell.getbbox())


def despill(path, cols, rows, deep=True, clear=True):
    """Clean the magenta fringe that Codex-drawn moving parts bring into a finished sheet (wind idle,
    showcase loops), cell by cell, in place: rim pixels tinted toward the key, rose rims and enclosed
    pink pockets take the colour of the nearest clean solid pixel at their own brightness; translucent
    leftovers far from any solid pixel are cleared. Violet and red gems are kept off the outermost rim.
    --no-deep keeps enclosed violet (dull amethysts, lilac crystal); --no-clear keeps translucent
    interiors (a crystal pillar is see-through by design)."""
    sheet = Image.open(path).convert("RGBA")
    c = sheet.width // cols
    out = Image.new("RGBA", sheet.size)
    fixed = 0
    for i in range(cols * rows):
        box = ((i % cols) * c, (i // cols) * c, (i % cols + 1) * c, (i // cols + 1) * c)
        a = np.asarray(sheet.crop(box), np.float32)
        rgb, al = a[..., :3], a[..., 3]
        solid = al >= 200
        if clear and solid.any():
            al[(al < 200) & (ndimage.distance_transform_edt(~solid) > 2.5)] = 0
        vis = al > 0
        if vis.any():
            r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
            dist = ndimage.distance_transform_edt(vis)
            tint = np.minimum(r, b) - g > 12
            rose = ((b - g > 8) & (r - g > 8) & (r > 140)) | ((b - g > -25) & (r - g > 40))   # rose, salmon or crimson, never brown/orange (blue far below green)
            gem = (rgb.max(-1) - rgb.min(-1) >= 110) & ((b > r + 10) | (b - g < .2 * (r - g)))
            spill = vis & (((dist <= 4) & tint & ~(gem & (dist > 2))) | ((dist <= 3) & rose) | (deep & (dist > 4) & (np.minimum(r, b) - g > 45) & ~gem))
            donor = solid & ~tint & ~rose
            if spill.any() and donor.any():
                _, (iy, ix) = ndimage.distance_transform_edt(~donor, return_indices=True)
                src = rgb[iy, ix]
                lum = lambda x: x @ np.array([.299, .587, .114], np.float32)
                k = np.clip(lum(rgb) / np.maximum(lum(src), 1), .5, 1.3)[..., None]
                rgb = np.where(spill[..., None], np.clip(src * k, 0, 255), rgb)
                fixed += int(spill.sum())
        cell = np.concatenate([rgb, al[..., None]], -1)
        out.paste(Image.fromarray(cell.clip(0, 255).astype("uint8"), "RGBA"), box[:2])
    out.save(path, lossless=True, method=6) if str(path).endswith(".webp") else out.save(path)
    print("despilled", path, fixed, "px")


def rose(path, cols, rows):
    """Rose patches inside a drawing (a pink-lit cloak lining, the key bleeding into a fold): saturated
    rose pixels (red far above green, blue at or above green) take the colour of the nearest clean solid
    pixel at their own brightness. Brown leather and brass keep blue far below green, skin keeps red
    near green, so neither is touched. Not for a sheet with red or violet gems."""
    sheet = Image.open(path).convert("RGBA")
    a = np.asarray(sheet, np.float32)
    rgb, al = a[..., :3], a[..., 3]
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    bad = (al > 0) & (r - g > 55) & (b - g > -8) & (r > 120)
    donor = (al >= 200) & ~((r - g > 40) & (b - g > -20))
    _, (iy, ix) = ndimage.distance_transform_edt(~donor, return_indices=True)
    src = rgb[iy, ix]
    lum = lambda x: x @ np.array([.299, .587, .114], np.float32)
    k = np.clip(lum(rgb) / np.maximum(lum(src), 1), .5, 1.3)[..., None]
    rgb = np.where(bad[..., None], np.clip(src * k, 0, 255), rgb)
    out = Image.fromarray(np.concatenate([rgb, al[..., None]], -1).clip(0, 255).astype("uint8"), "RGBA")
    out.save(path, lossless=True, method=6) if str(path).endswith(".webp") else out.save(path)
    print("rose", path, int(bad.sum()), "px")


def refit_entrance(n):
    """Codex drew the hero in the last entrance frames a little larger than the resting loop, so the
    loop would shrink him when it takes over. One uniform scale and shift (found by laying the last
    frame's silhouette on the loop's first frame) is applied to every entrance frame alike, crystals
    included, and the last frame becomes the loop's first frame itself. Nothing is redrawn."""
    d = NOVICE / f"form-{n}/showcase"
    sheet = Image.open(d / "entrance.webp").convert("RGBA"); idle = Image.open(d / "idle.webp").convert("RGBA")
    c = sheet.width // 2
    cell = lambda im, i: im.crop(((i % 2) * c, (i // 2) * c, (i % 2 + 1) * c, (i // 2 + 1) * c))
    rest, last = cell(idle, 0), cell(sheet, 7)
    ra = np.asarray(rest, np.float32)[..., 3] / 255
    rb, lb = rest.getbbox(), last.getbbox()
    k0 = (rb[3] - rb[1]) / (lb[3] - lb[1])          # crown to soles: the same resting pose in both
    best = None
    for k in np.arange(k0 - .04, k0 + .0801, .005):
        im = last.resize((round(c * k),) * 2, Image.Resampling.LANCZOS)
        ib = im.getbbox()
        bx, by = (rb[0] + rb[2]) / 2 - (ib[0] + ib[2]) / 2, rb[3] - ib[3]
        for dy in range(-3, 4):
            for dx in range(-4, 5):
                ox, oy = round(bx) + dx, round(by) + dy
                can = Image.new("RGBA", (c, c)); can.paste(im, (ox, oy))
                err = np.abs(np.asarray(can, np.float32)[..., 3] / 255 - ra).mean()
                if best is None or err < best[0]:
                    best = (err, k, ox, oy)
    err, k, dx, dy = best
    out = Image.new("RGBA", sheet.size)
    for i in range(8):
        im = cell(sheet, i).resize((round(c * k),) * 2, Image.Resampling.LANCZOS)
        can = Image.new("RGBA", (c, c)); can.paste(im, (dx, dy))
        out.paste(rest if i == 7 else can, ((i % 2) * c, (i // 2) * c))
    out.save(d / "entrance.webp", lossless=True, method=6)
    print(f"entrance refit: scale {k:.3f} shift {dx},{dy} (silhouette error {err:.4f}); frame 8 = loop frame 1")


if __name__ == "__main__":
    cmd, n, *rest = sys.argv[1:]
    if cmd == "master":
        master(n)
    elif cmd == "anchor":
        anchor(n, int(rest[0]), int(rest[1]), rest[2])
    elif cmd == "sheet":
        sheet(n, rest[0], int(rest[1]), int(rest[2]), float(rest[3]) if len(rest) > 3 else 1.0)
    elif cmd == "portrait":
        portrait(n)
    elif cmd == "despill":
        despill(n, int(rest[0]), int(rest[1]), deep="--no-deep" not in rest, clear="--no-clear" not in rest)
    elif cmd == "rose":
        rose(n, int(rest[0]), int(rest[1]))
    elif cmd == "refit-entrance":
        refit_entrance(n)
    elif cmd == "showcase-master":
        showcase_master(n)
