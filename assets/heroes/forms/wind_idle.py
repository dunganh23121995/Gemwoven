"""Combat idles in the manner of skeletal (Spine) mobile RPG battle idles: the body holds its exact
shape and size while the loose parts (hair, cloth, tails, ears, charms) flow in a steady breeze.

Codex draws the flowing parts, including the details on the body (tabards, ribbons, sleeves, hair
over the shoulders), over the existing resting frame. The stabilizer places every frame at ONE
scale (only shifted), so the character never grows, shrinks or stretches; the face and the legs are
always the resting drawing (a rigid mask), so they never boil and legs never lengthen.

  python assets/heroes/forms/wind_idle.py gen <hero> <form> "<what moves>" [model effort]   (ladder: gpt-6.1-sol low first, up to gpt-6-astra high)
  python assets/heroes/forms/wind_idle.py proc <hero> <form> [--core=N]
      -> .build-cache/fidgets/<dir>/idle/stable/idle.webp + preview.png
  python assets/heroes/forms/wind_idle.py accept <hero> <form>
      -> keeps raw/prompt in form-N/combat-idle and packages the sheet (combat_idle.py package)
"""
import json
import re
import statistics
import sys
from pathlib import Path

import cv2
import numpy as np
from scipy import ndimage
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "assets/gemwoven/elites"))
sys.path.insert(0, str(Path(__file__).resolve().parent))
import fidget  # noqa: E402
import combat_idle  # noqa: E402

MODEL, EFFORT = "gpt-6.1-sol", "low"   # the first rung; climb only when a drawing fails review
FRAME_MS = 200          # 8 frames over 1.6 s: an unhurried breeze, the pace of the reference idles
STABILIZE = ROOT / "assets/gemwoven/elites/stabilize_idle.py"
PARTS_FIT = .82         # least overlap (IoU) between a part map's silhouette and the resting frame
CORE = 4                # px inside the outline kept from the resting frame (thin: body details may move)
GREEN = {"shadow"}      # violet characters are drawn on green so the key never eats their colours
LEGS = {"lightning": .36}   # share of the body height kept rigid above the soles (floating legs dangle longer)
# Noct's combat idles were drawn before this pipeline kept a prompt beside them.
WHAT = {
    ("shadow", "1"): "Noct, a compact chibi hooded shadow swordsman (he/him): a soft pointed black hood over a completely black hidden face with two small glowing cyan eyes, a dark scarf, dark gunmetal leather armour with belts and a small silver cross ornament, a ragged dark grey cloak with violet-lined tattered edges spreading behind him, dark boots, a short dagger held up behind his shoulder; facing right in 3/4 view",
    ("shadow", "2"): "Noct in his Moon Shadow form, a compact chibi hooded shadow swordsman (he/him): a soft pointed black hood over a completely black hidden face with two narrow glowing lavender-violet eyes, a dark scarf, a long layered black half-robe and a torn black cloak whose ragged edges are lined with deep violet, dark forearm and shin guards, dark boots, one long black crescent moon-blade held low in his right hand with the tip near the ground in front of him; facing right in 3/4 view",
    ("shadow", "3"): "Noct in his final form, a faceless chibi Grim Reaper (he/him): a deep black hood over a completely black hidden face with two narrow glowing violet eyes, a layered black tattered robe and long torn cloak with violet-tinged ragged edges, dark boots, holding a tall dark scythe upright with a long curved pale-violet steel blade arching over his head; facing right in 3/4 view",
}

ACTION = """{flow}
Move like a skeletal (Spine) mobile RPG battle idle: everything loose keeps moving smoothly and continuously as if in a steady breeze, as a travelling wave from the root to the tip (each tip lags a little behind its root), each frame a little further along the same wave, so the eight frames make one seamless cycle with no sudden jumps. The details ON the body move clearly too, as much as the loose parts outside it (a viewer must see them move): hanging cloth panels, tabard and skirt hems, sleeves, ribbons, tassels, belt ends, scarf knots, fur trims and hair strands lying over the shoulders and chest visibly sway, lift and ripple with the same breeze, each frame a clear small step. The face, eyes, head shape, hands, the held weapon, legs and boots stay exactly as in Image 1; the body keeps exactly the same shape, size and place in every frame (no stretching, no squashing, no breathing bob), feet planted."""


def cid(hero, form):
    return f"assets/heroes/forms/{hero}/form-{form}/combat-idle"


def work_dir(hero, form):
    return fidget.WORK / cid(hero, form).replace("/", "_") / "idle"


def what(hero, form):
    if (hero, form) in WHAT:
        return WHAT[hero, form]
    text = (ROOT / cid(hero, form) / "prompt-idle.txt").read_text(encoding="utf-8")
    found = re.search(r"reference \((.*?)\)\. Image 2", text, re.S)
    if found:
        return found.group(1)
    # Mika form 3 was drawn from a longer brief: keep its identity paragraph.
    return re.search(r"Image 1 is the exact character identity and art reference: (.*?)\nImage 2", text, re.S).group(1).rstrip(".")


def gen(hero, form, flow, model=MODEL, effort=EFFORT):
    fidget.gen(cid(hero, form), "idle", model, effort, what(hero, form), ACTION.format(flow=flow), loop=True, green=hero in GREEN)


def rigid_mask(hero, form, out):
    """White where every frame keeps the resting drawing: the face (from the measured eyes) and the
    legs and boots (the soles' columns, up to the knees)."""
    master = np.asarray(Image.open(ROOT / cid(hero, form) / "master.png").convert("RGBA"))[..., 3] > 127
    mask = Image.new("L", master.shape[::-1], 0); draw = ImageDraw.Draw(mask)
    head = json.loads((ROOT / "assets/heroes/head-scale.json").read_text(encoding="utf-8"))["forms"].get(f"{hero}-{form}", {}).get("combat")
    if head:
        (ex, ey), span = head["eyes"], head.get("eyeSpan") or head["headPx"]
        draw.ellipse((ex - span * 1.45, ey - span * .75, ex + span * 1.45, ey + span * 1.55), fill=255)
    ys = np.where(master.any(axis=1))[0]; top, sole = ys.min(), ys.max()
    band = master[sole - int((sole - top) * .07):sole + 1].any(axis=0); xs = np.where(band)[0]
    draw.rectangle((xs.min() - 3, sole - (sole - top) * LEGS.get(hero, .26), xs.max() + 3, sole + 4), fill=255)
    mask.save(out)


def cut_cells(raw, out, green=False, cell=256, single=False):
    """Key the sheet and cut one cell around each of the eight drawn figures. Codex does not keep to
    its grid (rows drift closer, a pose crosses into the next row), so the figures are found on
    the sheet and every frame gets a window of the same size, centred on its figure."""
    out.mkdir(parents=True, exist_ok=True)
    sheet = np.asarray(Image.open(raw).convert("RGB"), dtype=np.float32)
    r, g, b = sheet[..., 0], sheet[..., 1], sheet[..., 2]
    key = g - np.maximum(r, b) if green else np.minimum(r, b) - g
    alpha = np.clip(1 - (key - 60) / 90, 0, 1)
    spill = np.clip(key / 255, 0, 1)
    if green:
        sheet[..., 1] = np.where(key > 0, np.maximum(r, b) + (g - np.maximum(r, b)) * (1 - spill), g)
    else:
        sheet[..., 0] = np.where(key > 0, np.minimum(r, g + (r - g) * (1 - spill)), r)
        sheet[..., 2] = np.where(key > 0, np.minimum(b, g + (b - g) * (1 - spill)), b)
    rgba = np.concatenate([sheet, alpha[..., None] * 255], -1).clip(0, 255).astype("uint8")
    labels, count = ndimage.label(ndimage.binary_dilation(alpha > .5, iterations=8))
    sizes = ndimage.sum(np.ones_like(labels), labels, range(1, count + 1))
    figures = [ndimage.find_objects(labels)[i] for i in np.argsort(sizes)[::-1][:1 if single else 8]]
    rows = sorted(figures, key=lambda s: (s[0].start + s[0].stop) / 2)
    order = figures if single else [f for pair in (sorted(rows[i:i + 2], key=lambda s: s[1].start) for i in range(0, 8, 2)) for f in pair]
    w, h = (sheet.shape[1], sheet.shape[0]) if single else (sheet.shape[1] // 2, sheet.shape[0] // 4)
    padded = np.zeros((sheet.shape[0] + 2 * h, sheet.shape[1] + 2 * w, 4), dtype="uint8")
    padded[h:h + sheet.shape[0], w:w + sheet.shape[1]] = rgba
    for i, f in enumerate(order):
        cy, cx = (f[0].start + f[0].stop) // 2 + h, (f[1].start + f[1].stop) // 2 + w
        crop = Image.fromarray(padded[cy - h // 2:cy - h // 2 + h, cx - w // 2:cx - w // 2 + w], "RGBA")
        crop.resize((cell, round(cell * h / w)), Image.Resampling.LANCZOS).crop((0, 0, cell, cell)).save(out / f"idle-{i + 1}.png")


def feather(sheet, cell=256, px=5):
    """A cloak tip that reaches a cell edge fades out instead of ending on a hard straight cut."""
    a = np.asarray(sheet, dtype=np.float32).copy()
    ramp = np.minimum(1, (np.arange(cell) + .5) / px); ramp = np.minimum(ramp, ramp[::-1])
    edge = np.minimum(ramp[:, None], ramp[None, :])
    a[..., 3] *= np.tile(edge, (a.shape[0] // cell, a.shape[1] // cell))
    return Image.fromarray(a.astype("uint8"), "RGBA")


def cells_of(path):
    sheet = np.asarray(Image.open(path).convert("RGBA"), dtype=np.float32) / 255
    c = sheet.shape[1] // 2
    return [sheet[(i // 2) * c:(i // 2 + 1) * c, (i % 2) * c:(i % 2 + 1) * c] for i in range(8)]


def parts_mask(work, master):
    """The red 'sways in the breeze' parts of Codex's part map, fitted onto the resting frame."""
    raw = np.asarray(Image.open(work / "parts-raw.png").convert("RGB"), dtype=np.float32)
    shape = raw.max(-1) > 60
    red = (raw[..., 0] > 150) & (raw[..., 1] < 110) & (raw[..., 2] < 110)
    ys, xs = np.where(shape); my, mx = np.where(master[..., 3] > .5)
    s = (my.max() - my.min()) / max(1, ys.max() - ys.min())
    # Map the part map's silhouette box onto the resting frame's box (Codex may redraw it a little
    # larger or offset), then keep red only on the character.
    yy, xx = np.mgrid[:master.shape[0], :master.shape[1]]
    sy = np.clip(((yy - my.min()) / s + ys.min()).round().astype(int), 0, raw.shape[0] - 1)
    sx = np.clip(((xx - (mx.min() + mx.max()) / 2) / s + (xs.min() + xs.max()) / 2).round().astype(int), 0, raw.shape[1] - 1)
    body = master[..., 3] > .5
    fit = (shape[sy, sx] & body).sum() / max(1, (shape[sy, sx] | body).sum())
    mask = red[sy, sx] & ndimage.binary_dilation(body, iterations=2)
    return ndimage.binary_opening(mask, iterations=1), fit


def sway(frames, mask, rigid, facing=1):
    """Skeletal-style sway of the loose details on the body: each red part bends from where it
    hangs (its top stays put) to its tip, a wave travelling down it in the breeze that blows the
    cape back (towards -x for a hero facing right). The same drawing is bent, never redrawn."""
    labels, count = ndimage.label(ndimage.binary_dilation(mask, iterations=2))
    h, w = mask.shape
    yy, xx = np.mgrid[:h, :w].astype(np.float32)
    out = []
    for i, frame in enumerate(frames):
        dx = np.zeros((h, w), np.float32); dy = np.zeros((h, w), np.float32)
        for k, part in enumerate(ndimage.find_objects(labels)):
            y0, y1 = part[0].start, part[0].stop
            size = y1 - y0
            if size < 6:
                continue
            here = (labels == k + 1).astype(np.float32)
            reach = np.clip((yy - y0) / size, 0, 1) ** 1.3                    # pinned at the top, free at the tip
            amp = min(4.0, max(1.5, .2 * size * 256 / w)) * w / 256
            wave = (1 - np.cos(2 * np.pi * i / len(frames) - 2.2 * reach - k * .9)) / 2
            dx += here * -facing * amp * reach * wave
            dy += here * -.3 * amp * reach * wave
        keep = cv2.GaussianBlur((~rigid).astype(np.float32), (0, 0), 2)
        dx = cv2.GaussianBlur(dx, (0, 0), 1.5) * keep; dy = cv2.GaussianBlur(dy, (0, 0), 1.5) * keep
        pm = np.concatenate([frame[..., :3] * frame[..., 3:], frame[..., 3:]], -1)
        bent = cv2.remap(pm, xx - dx, yy - dy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
        a = bent[..., 3:]
        out.append(np.concatenate([np.where(a > 1e-4, bent[..., :3] / np.maximum(a, 1e-4), 0), a], -1))
    return out


def master_path(hero, form):
    """The resting frame the loop is built on: its 512 px repaint when there is one."""
    hi = ROOT / cid(hero, form) / "master-512.png"
    return hi if hi.exists() else ROOT / cid(hero, form) / "master.png"


def proc(hero, form, core):
    work = work_dir(hero, form)
    cell = Image.open(master_path(hero, form)).width
    cut_cells(work / "raw.png", work / "cells", green=(work / "green").exists(), cell=cell)
    rigid_mask(hero, form, work / "rigid.png")
    stabilize = lambda out, *extra: fidget.run(STABILIZE, master_path(hero, form), work / out, "--cell", cell,
                                               *[work / f"cells/idle-{i}.png" for i in range(1, 9)],
                                               "--core", core, "--as-is", "--grow", 3, "--open", 1, "--min-area", 20, "--rigid", work / "rigid.png", *extra)
    # Codex draws all eight frames at one scale but not always in the same spot of its cell (a row
    # a little lower, a tail fan hiding the boots). First each frame is fitted on its own to find
    # that scale; then every frame gets the same scale and only its own shift.
    stabilize("stable")
    scales = [f["scale"] for f in json.loads((work / "stable/stabilize-meta.json").read_text())["frames"]]
    scale = str(round(statistics.median(scales), 4))
    print(stabilize("stable", "--scale", scale).strip())
    master = np.asarray(Image.open(master_path(hero, form)).convert("RGBA"), dtype=np.float32) / 255
    rigid = np.asarray(Image.open(work / "rigid.png").convert("L").resize((cell, cell)), dtype=np.float32) > 127
    frames = cells_of(work / "stable/idle.webp")
    if (work / "parts-raw.png").exists():
        mask, fit = parts_mask(work, master)
        print(f"part map fit {fit:.2f}")
        # A part map Codex redrew in another pose would bend the wrong pieces: use it only when its
        # silhouette lies on the resting frame's.
        if fit >= PARTS_FIT:
            Image.fromarray((mask * 255).astype("uint8")).save(work / "parts.png")
            frames = sway(frames, mask, rigid)
    c = master.shape[0]
    sheet = Image.new("RGBA", (c * 2, c * 4))
    for i, f in enumerate(frames):
        sheet.paste(Image.fromarray((f.clip(0, 1) * 255 + .5).astype("uint8"), "RGBA"), ((i % 2) * c, (i // 2) * c))
    sheet = feather(sheet, cell, px=5 * cell // 256)
    sheet.save(work / "idle.webp", lossless=True, method=6)
    c = sheet.width // 2
    strip = Image.new("RGB", (c * 8, c), (58, 84, 62))
    for i in range(8):
        cell = sheet.crop(((i % 2) * c, (i // 2) * c, (i % 2 + 1) * c, (i // 2 + 1) * c))
        strip.paste(cell, (i * c, 0), cell)
    strip.save(work / "preview.png")


def accept(hero, form):
    work, dst = work_dir(hero, form), ROOT / cid(hero, form)
    for name, target in [("raw.png", "raw-idle.png"), ("prompt.txt", "prompt-idle.txt"), ("idle.webp", "idle.webp")]:
        (dst / target).write_bytes((work / name).read_bytes())
    combat_idle.FRAME_MS = FRAME_MS
    combat_idle.package(hero, form)


PARTS = """Image 1 is a chibi game character ({what}). Redraw EXACTLY the same picture as a flat colour-coded PART MAP: the same canvas size, the same pose, the same size and the same position as Image 1, every outline exactly where it is in Image 1.
Paint in solid pure RED #FF0000 every loose piece ON or hanging from the body that would sway in a breeze, and only those: hanging cloth panels, tabard, skirt and tunic hems, coat-tail edges, loose sleeve cuffs, ribbons, tassels, belt and strap ends, scarf knot ends, charms hanging from the belt, fur trim tips, and hair strands lying over the shoulders and chest.
Paint in solid pure WHITE #FFFFFF everything else of the character: the head, face and the main mass of hair, ears, the armour and torso, arms, hands, the held weapon or staff, legs and boots, and the big outer pieces that already stream behind (long cape, tail, long scarf end, long braid).
Background solid pure BLACK #000000. Flat colours only: no shading, no outlines, no gradients, no text."""


def parts_gen(hero, form, model=MODEL, effort=EFFORT):
    work = work_dir(hero, form); work.mkdir(parents=True, exist_ok=True)
    master = Image.open(ROOT / cid(hero, form) / "master.png").convert("RGBA")
    canvas = Image.new("RGBA", master.size, (0, 0, 0, 255)); canvas.alpha_composite(master)
    canvas.convert("RGB").resize((1024, 1024), Image.Resampling.LANCZOS).save(work / "parts-ref.png")
    (work / "parts-prompt.txt").write_text(PARTS.format(what=what(hero, form)) + "\n", encoding="utf-8")
    fidget.run(fidget.GEN, "--prompt-file", work / "parts-prompt.txt", "--out", work / "parts-raw.png", "--ref", work / "parts-ref.png",
               "--model", model, "--effort", effort, "--timeout", "900")


HIRES = """Image 1 is a small, slightly soft game sprite of a chibi character ({what}). Repaint it as a crisp HIGH-RESOLUTION version of EXACTLY the same picture: the identical pose, proportions, silhouette, colours and every detail in the same place, with the same framing on the canvas (the character sits on the canvas exactly where and as large as in Image 1). Only sharpen it: clean crisp painted lines, clear eyes and fine ornaments. Do not change the design, do not add or remove anything.
Background 100% solid flat #FF00FF magenta, no shadow, no ground, no text, no borders."""


def hires_gen(hero, form, model=MODEL, effort=EFFORT):
    """Codex repaints the 256 px resting frame at 1024 px (a deep image job, so it goes to Codex)."""
    work = work_dir(hero, form); work.mkdir(parents=True, exist_ok=True)
    master = Image.open(ROOT / cid(hero, form) / "master.png").convert("RGBA")
    canvas = Image.new("RGBA", master.size, (255, 0, 255, 255)); canvas.alpha_composite(master)
    canvas.convert("RGB").resize((1024, 1024), Image.Resampling.LANCZOS).save(work / "hires-ref.png")
    (work / "hires-prompt.txt").write_text(HIRES.format(what=what(hero, form)) + "\n", encoding="utf-8")
    fidget.run(fidget.GEN, "--prompt-file", work / "hires-prompt.txt", "--out", work / "hires-raw.png", "--ref", work / "hires-ref.png",
               "--model", model, "--effort", effort, "--timeout", "900")


def hires_fit(hero, form):
    """Key the repaint and lay it exactly over the 256 px resting frame at twice its size, so the
    512 px loop keeps the same pose, size and feet. Reports how closely it matches."""
    work = work_dir(hero, form)
    cut_cells(work / "hires-raw.png", work / "hires-cell", cell=1024, single=True)
    hi = np.asarray(Image.open(work / "hires-cell/idle-1.png").convert("RGBA"), dtype=np.float32) / 255
    lo = np.asarray(Image.open(ROOT / cid(hero, form) / "master.png").convert("RGBA").resize((512, 512), Image.Resampling.LANCZOS), dtype=np.float32) / 255
    box = lambda a: (lambda ys, xs: (ys.min(), ys.max(), xs.min(), xs.max()))(*np.where(a[..., 3] > .5))
    t0, b0, l0, r0 = box(lo); t1, b1, l1, r1 = box(hi)
    best = None
    for k in np.linspace(.97, 1.03, 13):
        s = (b0 - t0) / (b1 - t1) * k
        im = Image.fromarray((hi * 255).astype("uint8"), "RGBA")
        im = im.resize((round(im.width * s), round(im.height * s)), Image.Resampling.LANCZOS)
        a = np.asarray(im, dtype=np.float32) / 255
        t2, b2, l2, r2 = box(a)
        for dy in range(-4, 5):
            for dx in range(-4, 5):
                oy, ox = b0 - b2 + dy, round((l0 + r0) / 2 - (l2 + r2) / 2) + dx
                canvas = np.zeros_like(lo)
                ys, xs = max(0, oy), max(0, ox)
                src = a[ys - oy:ys - oy + 512 - ys, xs - ox:xs - ox + 512 - xs]
                canvas[ys:ys + src.shape[0], xs:xs + src.shape[1]] = src
                err = np.abs(canvas[..., 3] - lo[..., 3]).mean() + np.abs(canvas[..., :3] * canvas[..., 3:] - lo[..., :3] * lo[..., 3:]).mean()
                if best is None or err < best[0]:
                    best = (err, canvas)
    out = Image.fromarray((best[1].clip(0, 1) * 255 + .5).astype("uint8"), "RGBA")
    out.save(ROOT / cid(hero, form) / "master-512.png")
    iou = ((best[1][..., 3] > .5) & (lo[..., 3] > .5)).sum() / ((best[1][..., 3] > .5) | (lo[..., 3] > .5)).sum()
    print(f"master-512: silhouette match {iou:.3f}, error {best[0]:.4f}")


if __name__ == "__main__":
    cmd, hero, form, *rest = sys.argv[1:]
    if cmd == "gen":
        gen(hero, form, *rest[:3])
    elif cmd == "hires":
        hires_gen(hero, form, *rest[:2])
    elif cmd == "hires-fit":
        hires_fit(hero, form)
    elif cmd == "parts":
        parts_gen(hero, form, *rest[:2])
    elif cmd == "proc":
        proc(hero, form, next((int(r.split("=")[1]) for r in rest if r.startswith("--core=")), CORE))
    else:
        accept(hero, form)
