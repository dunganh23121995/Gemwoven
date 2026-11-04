"""Foes looked soft in combat beside the heroes: every foe rests on a 256px cell (rig_foes.py), and combat shows that cell
at 386px (common foe), 489px (elite) and 611px (boss) on a 1920 x 911 desktop, ~340-590 device px on a phone, while a
hero's 512px cell is shown at 423px. This measures each foe as it is shown, and redraws the soft ones with Codex at the
size it is shown, the same picture in the same place, then the mesh rig is fitted and baked again on the new drawing.

  python assets/gemwoven/sharpen_foes.py audit                    raw/foe-sharpness/: sharpness.csv, contact sheets
  python assets/gemwoven/sharpen_foes.py draw [workers] [id ...]  Codex redraws the resting frame into <foe>/rig/sharp/
  python assets/gemwoven/sharpen_foes.py apply [id ...]           the accepted redraw becomes rig/foe/rest.png
  python assets/gemwoven/sharpen_foes.py rig [workers] [id ...]   apply + rig_foes.py make (the kept part map, rebaked)
  python assets/gemwoven/sharpen_foes.py fidgets [id ...]         its fidget sheets rebuilt at the new size (hd_frame)
  python assets/gemwoven/sharpen_foes.py drawfidgets [workers] [id ...]  Codex redraws the middle frames of whole-body fidgets
  python assets/gemwoven/sharpen_foes.py actions [workers] [boss|elite|<chapter>|id ...]  Codex redraws the action sheets
  python assets/gemwoven/sharpen_foes.py applyactions [ids]       writes the redrawn action sheets over the live ones
  python assets/gemwoven/sharpen_foes.py sheets [id ...]          before / after strips for review

Sharpness (sharpness()) is the ratio of the finest luminance detail to the next coarser band inside the body (alpha,
eroded off its outline), with the drawing scaled to the device pixels it covers in combat. Heroes are measured the same
way (all 18 resting frames, 512px cells at 423px): a foe below the softest hero reads soft beside them.
"""
import csv
import json
import re
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage, signal

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "assets/gemwoven/raw/foe-sharpness"
GEN = Path.home() / ".claude/skills/generate2dsprite/scripts/codex_image_gen.py"
FAMILIES = (("creature", "assets/gemwoven/creatures"), ("elite", "assets/gemwoven/elites"), ("boss", "assets/gemwoven/boss-anim"))
# The actor's cell on screen, in device px: the larger of a 1920 x 911 desktop (combat-hud.css landscape) and a
# 390 x 844 phone at 3x (progression-combat.css), measured in the game.
SHOWN = {"hero": 423, "creature": 386, "elite": 489, "boss": 611}
# The cell a redrawn resting frame is kept at: at least what is shown (a boss's 640 x 6 stays inside a 4096 texture)
CELL = {"creature": 512, "elite": 512, "boss": 640}
LADDER = (("gpt-6.1-sol", "low"), ("gpt-6.1-sol", "medium"), ("gpt-6.1-sol", "high"))
MIN_IOU = .86          # of the redrawn silhouette with the old one (same pose and place)
MAX_FOOT = .012        # the soles' shift, as a share of the cell
HIRO = ROOT / "assets/heroes/forms/novice/form-1/rig/combat/rest.png"


def foes():
    for kind, folder in FAMILIES:
        for rest in sorted((ROOT / folder).glob("*/rig/foe/rest.png")):
            yield rest.parents[2].name, kind, rest.parents[2]


def premul(im):
    a = np.asarray(im.convert("RGBA"), dtype=np.float32) / 255
    return np.concatenate([a[..., :3] * a[..., 3:], a[..., 3:]], -1)


def shown(im, size):
    """A cell as the browser draws it at `size` device px: bilinear when enlarged, area-averaged when reduced."""
    a = premul(im)
    return cv2.resize(a, (size, size), interpolation=cv2.INTER_LINEAR if size > im.width else cv2.INTER_AREA).clip(0, 1)


def luma(a):
    k = a[..., 3]
    y = (a[..., 0] * .299 + a[..., 1] * .587 + a[..., 2] * .114) / np.maximum(k, 1e-3) * 255
    return np.where(k > .02, y, 0).astype(np.float32), ndimage.binary_erosion(k > .95, iterations=max(2, round(a.shape[0] / 160)))


def sharpness(a):
    """How crisp the body is where it is shown (premultiplied cell, already at its shown size): the finest detail
    (luminance minus a 1px blur) over the detail one step coarser (1px blur minus a 3px blur), RMS inside the body.
    A drawing enlarged past its pixels loses the first and keeps the second, whatever it shows; a dark or plain
    subject keeps its ratio (raw detail energy, `energy`, would call Noct soft and a noisy fur sharp)."""
    y, inside = luma(a)
    if inside.sum() < 400:
        return float("nan")
    b1 = cv2.GaussianBlur(y, (0, 0), 1.0); b3 = cv2.GaussianBlur(y, (0, 0), 3.0)
    return float(np.sqrt(((y - b1)[inside] ** 2).mean()) / max(1e-3, np.sqrt(((b1 - b3)[inside] ** 2).mean())))


def energy(a):
    """RMS of the luminance's fine detail inside the body (reported beside the ratio)."""
    y, inside = luma(a)
    if inside.sum() < 400:
        return float("nan")
    return float(np.sqrt(((y - cv2.GaussianBlur(y, (0, 0), 1.2))[inside] ** 2).mean()))


def frames(path, cols, rows, count=None):
    im = Image.open(path).convert("RGBA"); w, h = im.width // cols, im.height // rows
    return [im.crop(((i % cols) * w, (i // cols) * h, (i % cols + 1) * w, (i // cols + 1) * h)) for i in range(count or cols * rows)]


def body_height(cell):
    ys = np.where((np.asarray(cell)[..., 3] >= 128).any(1))[0]
    return (ys.max() - ys.min() + 1) / cell.height if len(ys) else 0


def built_art():
    """The foe entries combat actually uses (Game.html's ART): each sheet, its grid and its scale."""
    html = (ROOT / "Game.html").read_text(encoding="utf-8")
    art, _ = json.JSONDecoder().raw_decode(html[html.index("const ART=") + len("const ART="):])
    out = {}
    for fam in ("campaignCreatures", "bosses", "worldBosses"):
        out.update(art.get(fam, {}))
    return out


def other_sheets(key, entry, rest_src):
    """Every sheet a foe shows besides its resting loop: (name, path, cols, rows, count, scale)."""
    seen = set()
    for name, sheet in entry.items():
        if not isinstance(sheet, dict) or "src" not in sheet or name in ("idle", "buff"):
            continue
        for sub, s in [(name, sheet)] + [(f"fidget-{Path(f['src']).stem}", f) for f in sheet.get("fidgets", [])]:
            src = s["src"]
            if src.startswith("data:") or (src, sub.startswith("fidget")) in seen:
                continue
            seen.add((src, sub.startswith("fidget")))
            yield sub, ROOT / src, s["cols"], s["rows"], s.get("count", s["cols"] * s["rows"]), s.get("scale", 1)
    for f in entry.get("idle", {}).get("fidgets", []):
        if (f["src"], True) not in seen:
            seen.add((f["src"], True))
            yield f"fidget-{Path(f['src']).stem}", ROOT / f["src"], f["cols"], f["rows"], f.get("count", 8), 1


def audit():
    OUT.mkdir(parents=True, exist_ok=True)
    heroes = []
    for rest in sorted((ROOT / "assets/heroes/forms").glob("*/form-*/rig/combat/rest.png")):
        im = Image.open(rest).convert("RGBA")
        a = shown(im, SHOWN["hero"])
        heroes.append((f"{rest.parents[3].name}-{rest.parents[2].name}", sharpness(a), energy(a)))
    hv = np.array([v for _, v, _ in heroes])
    floor = float(hv.min()) * .9      # flag below 90% of the softest hero
    print("heroes:", ", ".join(f"{k} {v:.3f}" for k, v, _ in heroes))
    print(f"hero median {np.median(hv):.3f}, min {hv.min():.3f}; flag below {floor:.3f}")
    art = built_art()
    rows, others = [], []
    for key, kind, folder in foes():
        rest = Image.open(folder / "rig/foe/rest.png").convert("RGBA")
        size = SHOWN[kind]
        a = shown(rest, size)
        v = sharpness(a)
        bh = body_height(rest)
        rows.append(dict(id=key, kind=kind, cell=rest.width, shown=size, upscale=round(size / rest.width, 2), body_px=round(bh * size),
                         sharpness=round(v, 3), energy=round(energy(a), 1), vs_hero=round(v / float(np.median(hv)), 3), flag=int(v < floor)))
        entry = art.get(key)
        if not entry:
            continue
        for name, path, cols, rows_, count, scale in other_sheets(key, entry, None):
            if not path.exists():
                continue
            cells = frames(path, cols, rows_, count)
            px = round(size * scale)
            vals = [sharpness(shown(c, px)) for c in cells]
            vals = [x for x in vals if x == x]
            if not vals:
                continue
            others.append(dict(id=key, kind=kind, sheet=name, file=path.relative_to(ROOT).as_posix(), cell=cells[0].width, shown=px,
                               upscale=round(px / cells[0].width, 2), sharpness=round(float(np.median(vals)), 3),
                               worst_frame=int(np.argmin(vals)), worst=round(float(min(vals)), 3), flag=int(np.median(vals) < floor)))
    rows.sort(key=lambda r: r["sharpness"])
    with open(OUT / "sharpness.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0])); w.writeheader(); w.writerows(rows)
        f.write("\n")
        for k, v, e in sorted(heroes, key=lambda x: x[1]):
            w.writerow(dict(id=k, kind="hero", cell=512, shown=SHOWN["hero"], upscale=round(SHOWN["hero"] / 512, 2), body_px="", sharpness=round(v, 3), energy=round(e, 1), vs_hero=round(v / float(np.median(hv)), 3), flag=""))
    others.sort(key=lambda r: r["sharpness"])
    with open(OUT / "sharpness-other-sheets.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(others[0])); w.writeheader(); w.writerows(others)
    flagged = [r for r in rows if r["flag"]]
    print(f"{len(rows)} foes, {len(flagged)} below 90% of the softest hero ({floor:.3f});",
          f"{sum(o['flag'] for o in others)} of {len(others)} other sheets")
    for kind in ("creature", "elite", "boss"):
        k = [r["sharpness"] for r in rows if r["kind"] == kind]
        print(f"  {kind}: {len(k)}, median {np.median(k):.3f}, min {min(k):.3f}, max {max(k):.3f}, flagged {sum(r['flag'] for r in rows if r['kind'] == kind)}")
    contact(rows[:30], OUT / "worst-30.png", "30 softest foes (as shown in combat) beside Hiro, same body height")
    contact(rows[-12:], OUT / "best-12.png", "12 sharpest foes beside Hiro, same body height")
    mid = rows[len(rows) // 2 - 6:len(rows) // 2 + 6]
    contact(mid, OUT / "middle-12.png", "12 middle foes beside Hiro, same body height")
    return rows


def tile(cell, shown_px, height, label, value):
    """The cell drawn at its combat size (keeping how soft it looks), its body cut out and brought to `height`."""
    a = shown(cell, shown_px)
    k = a[..., 3] > .1
    ys, xs = np.where(k)
    a = a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    s = height / a.shape[0]
    a = cv2.resize(a, (max(1, round(a.shape[1] * s)), height), interpolation=cv2.INTER_AREA if s < 1 else cv2.INTER_LINEAR)
    k = a[..., 3:]
    bg = np.float32([62, 78, 58]) / 255
    rgb = (a[..., :3] + bg * (1 - k)) * 255
    w = max(rgb.shape[1], 220) + 16
    out = Image.new("RGB", (w, height + 44), (62, 78, 58))
    out.paste(Image.fromarray(rgb.clip(0, 255).astype("uint8")), ((w - rgb.shape[1]) // 2, 4))
    d = ImageDraw.Draw(out)
    font = ImageFont.truetype("arial.ttf", 17)
    d.text((8, height + 12), f"{label}  {value:.2f}", fill=(255, 255, 255), font=font)
    return out


def contact(rows, path, title, height=340, per_row=6):
    hiro = Image.open(HIRO).convert("RGBA")
    tiles = [tile(hiro, SHOWN["hero"], height, "Hiro (hero)", sharpness(shown(hiro, SHOWN["hero"])))]
    for r in rows:
        rest = Image.open(ROOT / dict(FAMILIES)[r["kind"]] / r["id"] / "rig/foe/rest.png").convert("RGBA")
        tiles.append(tile(rest, r["shown"], height, r["id"], r["sharpness"]))
    lines = [tiles[i:i + per_row] for i in range(0, len(tiles), per_row)]
    W = max(sum(t.width for t in line) for line in lines)
    sheet = Image.new("RGB", (W, 40 + sum(max(t.height for t in line) for line in lines)), (30, 34, 30))
    ImageDraw.Draw(sheet).text((10, 10), title, fill=(255, 230, 160), font=ImageFont.truetype("arial.ttf", 20))
    y = 40
    for line in lines:
        x = 0
        for t in line:
            sheet.paste(t, (x, y)); x += t.width
        y += max(t.height for t in line)
    sheet.save(path)


WHAT = {"creature": "monster", "elite": "humanoid elite enemy", "boss": "chapter boss monster"}
MAGENTA = ((255, 0, 255), "magenta #FF00FF")
GREEN = ((0, 255, 0), "green #00FF00")


def work(folder):
    return folder / "rig/sharp"


def old_rest(folder):
    """The 256px resting frame the rig was baked from (kept beside the redraw before it is applied)."""
    kept = work(folder) / "old.png"
    return Image.open(kept if kept.exists() else folder / "rig/foe/rest.png").convert("RGBA")


def describe(folder, kind):
    path = folder / "prompt-idle.txt"
    found = re.search(r"reference \((.*?)\)\. Image 2", path.read_text(encoding="utf-8"), re.S) if path.exists() else None
    return found.group(1).strip() if found else f"a fantasy RPG {WHAT[kind]}"


def backdrop(rest):
    """Magenta, unless the foe holds more pink and violet than green (Codex tints such a backdrop into the art)."""
    hsv = cv2.cvtColor(np.asarray(rest.convert("RGB")), cv2.COLOR_RGB2HSV_FULL).astype(np.float32)
    body = np.asarray(rest)[..., 3] > 200
    h, sat, v = hsv[..., 0] * 360 / 256, hsv[..., 1] / 255, hsv[..., 2] / 255
    lit = body & (sat > .35) & (v > .3)
    pink = (lit & (h > 265) & (h < 345)).sum() / max(1, body.sum())
    green = (lit & (h > 75) & (h < 160)).sum() / max(1, body.sum())
    return GREEN if pink > .03 and pink > green else MAGENTA


def key(raw, colour):
    """The backdrop out (premultiplied result): backdrop joined to the canvas edge goes, and pure pockets; the rim
    loses the backdrop's tint; loose specks of a few pixels go."""
    c = np.float32(colour)
    a = np.asarray(raw.convert("RGB"), dtype=np.float32)
    d = np.sqrt(((a - c) ** 2).sum(-1))
    lab, _ = ndimage.label(d < 120)
    edge = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    bg = np.isin(lab, edge[edge > 0]) | (d < 40)
    alpha = np.where(bg, np.clip((d - 60) / 80, 0, 1), 1.)
    k = alpha[..., None]
    rgb = np.where(k > .02, (a - (1 - k) * c) / np.maximum(k, .02), 0).clip(0, 255)
    rim = ndimage.binary_dilation(bg, iterations=max(3, a.shape[0] // 256))
    if c[1] > 0:
        over = np.maximum(rgb[..., 1] - np.maximum(rgb[..., 0], rgb[..., 2]), 0) * rim
        rgb[..., 1] -= over
    else:
        over = np.maximum(np.minimum(rgb[..., 0], rgb[..., 2]) - rgb[..., 1], 0) * rim
        rgb[..., 0] -= over; rgb[..., 2] -= over
    solid = alpha > .5
    lab, n = ndimage.label(solid, structure=np.ones((3, 3)))
    if n > 1:
        sizes = ndimage.sum(solid, lab, range(1, n + 1))
        tiny = np.isin(lab, 1 + np.where(sizes < solid.size * 6e-5)[0])
        alpha = np.where(ndimage.binary_dilation(tiny, iterations=2) & ~ndimage.binary_dilation(solid & ~tiny, iterations=1), 0, alpha)
    return np.dstack([rgb / 255 * alpha[..., None], alpha]).astype(np.float32)


def place(src, s, tx, ty, n):
    """Premultiplied src scaled by s (one resample, area-averaged when reduced) with its corner at (tx, ty), n x n."""
    h, w = src.shape[:2]
    W, H = max(1, round(w * s)), max(1, round(h * s))
    small = cv2.resize(src, (W, H), interpolation=cv2.INTER_AREA if s < 1 else cv2.INTER_CUBIC).clip(0, 1)
    M = np.float32([[1, 0, tx], [0, 1, ty]])
    return cv2.warpAffine(small, M, (n, n), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT).clip(0, 1)


def align(src, old, scale=None):
    """Scale and corner that lay src's silhouette on the old resting frame's: (iou, s, tx, ty) in old's pixels.
    scale: a fixed scale (frames of one sheet share one)."""
    om = np.asarray(old)[..., 3] > 127
    n = om.shape[0]
    sm = src[..., 3] > .5
    ys = np.where(sm.any(1))[0]; oy = np.where(om.any(1))[0]
    s0 = (oy.max() - oy.min() + 1) / (ys.max() - ys.min() + 1)
    best = None
    for s in ([scale] if scale else s0 * np.linspace(.9, 1.1, 41)):
        m = cv2.resize(sm.astype(np.float32), (max(1, round(sm.shape[1] * s)), max(1, round(sm.shape[0] * s))), interpolation=cv2.INTER_AREA) > .5
        if m.shape[0] > n * 1.5 or m.shape[1] > n * 1.5:
            continue
        score = signal.fftconvolve(om.astype(np.float32), m[::-1, ::-1].astype(np.float32))
        y, x = np.unravel_index(score.argmax(), score.shape)
        top, left = int(y) - m.shape[0] + 1, int(x) - m.shape[1] + 1
        canvas = np.zeros((n, n), bool)
        y0, x0, y1, x1 = max(0, top), max(0, left), min(n, top + m.shape[0]), min(n, left + m.shape[1])
        if y1 > y0 and x1 > x0:
            canvas[y0:y1, x0:x1] = m[y0 - top:y1 - top, x0 - left:x1 - left]
        iou = (canvas & om).sum() / max(1, (canvas | om).sum())
        if best is None or iou > best[0]:
            best = (float(iou), float(m.shape[0] / sm.shape[0]), float(left), float(top))
    return best


def sole(alpha):
    return int(np.where((alpha > .5).any(1))[0].max())


def fitted(src, old, n, scale=None):
    """src laid on the old frame's silhouette at n px, its soles exactly on the old soles' row."""
    iou, s, tx, ty = align(src, old, scale)
    k = n / old.width
    out = place(src, s * k, tx * k, ty * k, n)
    want = (sole(np.asarray(old)[..., 3] / 255) + 1) * k - 1
    dy = want - sole(out[..., 3])
    if abs(dy) >= .5:
        out = place(src, s * k, tx * k, ty * k + dy, n)
    return out, iou, dy / n


def to_image(a):
    k = a[..., 3:]
    rgba = np.dstack([np.where(k > 1e-3, a[..., :3] / np.maximum(k, 1e-3), 0), k]).clip(0, 1)
    return Image.fromarray((rgba * 255 + .5).astype("uint8"), "RGBA")


def reference(folder, old):
    """The best picture of the resting pose to show Codex, in the resting frame's place at 1024px: the drawing it came
    from (an elite's master, the raw idle sheet's first cell) when one lies on it closely, else the frame enlarged."""
    best = (0., None, "rest")
    for name in ("master.png", "raw-idle.png"):
        path = folder / name
        if not path.exists():
            continue
        im = Image.open(path)
        if name.startswith("raw-"):
            c = im.width // 2
            src = key(im.convert("RGB").crop((0, 0, c, c)), MAGENTA[0])
        else:
            src = premul(im)
        if (src[..., 3] > .5).sum() < 500:
            continue
        out, iou, _ = fitted(src, old, 1024)
        if iou > best[0]:
            best = (iou, out, name)
    if best[0] < .93:
        return to_image(shown(old, 1024)), "rest", best[0]
    return to_image(best[1]), best[2], best[0]


def prompt(folder, kind, colour):
    return f"""Image 1 is a fantasy game {WHAT[kind]} sprite ({describe(folder, kind)}) that was enlarged from a small image and looks soft and blurry. Redraw EXACTLY the same picture at full resolution on the same square canvas: the same pose, the same angles of every limb, weapon, wing, tail and loose piece, the same size and the same position on the canvas, every outline where it is in Image 1, the feet on the same spot.
Keep everything about the character exactly: identity, face, eyes, expression, every part of the armour, costume, fur, scales or shell and every ornament, the weapon, the colours and palette, the proportions and the chibi game style. Do not redesign, add or remove anything, and keep any glow or drawn effect that is already part of it.
Improve only the rendering quality: redraw it as a crisp, high-resolution finished mobile RPG illustration with clean sharp dark outlines, fine readable detail in hair, fur, feathers, leaves, cloth folds, metal and gems, exactly the colours, brightness and saturation of Image 1 (never brighter, more saturated or tinted), clear highlights. No blur, no soft focus, no painterly smear, no pixelation, no noise.
Background 100% solid flat {colour[1]}, the same colour everywhere around and between the parts. No gradients in the background, no text, no labels, no frame, no shadow on the ground, no loose sparkles around it. The whole character stays inside the canvas with the same margin as Image 1."""


def colour_shift(new, old):
    """Mean RGB distance between the redraw and the old frame where both are body, at 64px (palette drift)."""
    a = cv2.resize(new, (64, 64), interpolation=cv2.INTER_AREA); b = cv2.resize(premul(old), (64, 64), interpolation=cv2.INTER_AREA)
    m = (a[..., 3] > .9) & (b[..., 3] > .9)
    ca = a[..., :3] / np.maximum(a[..., 3:], 1e-3); cb = b[..., :3] / np.maximum(b[..., 3:], 1e-3)
    return float(np.sqrt(((ca - cb) ** 2).sum(-1))[m].mean() * 255) if m.any() else 0.


def strays(new, old, faint=.3):
    """Sparkles, bubbles and snowflakes Codex adds round a sprite, apart from it: a separate piece that lies (almost)
    wholly outside the old frame's silhouette goes. A loose piece of the old drawing (a pendant, a spark) lies on its
    own old place and stays."""
    n = new.shape[0]
    was = cv2.resize((premul(old)[..., 3] > faint).astype(np.uint8), (n, n), interpolation=cv2.INTER_NEAREST).astype(bool)
    was = ndimage.binary_dilation(was, iterations=max(2, n // 64))
    lab, cnt = ndimage.label(new[..., 3] > .08, structure=np.ones((3, 3)))
    if cnt < 2:
        return new
    inside = ndimage.sum(was, lab, range(1, cnt + 1)); size = ndimage.sum(np.ones_like(was), lab, range(1, cnt + 1))
    drop = np.isin(lab, 1 + np.where(inside < size * .2)[0])
    if not drop.any():
        return new
    out = new.copy()
    out[ndimage.binary_dilation(drop, iterations=1)] = 0
    return out


def pockets(new, old, colour):
    """Backdrop Codex left between thin parts (harp strings, chains, a bow and its string) where the old frame is see-
    through: those pixels go, by how much they look like the backdrop. Where the old frame is solid nothing changes,
    so a pink gem or a violet glow keeps its colour."""
    n = new.shape[0]
    k = new[..., 3:]
    rgb = new[..., :3] / np.maximum(k, 1e-3)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    look = (g - np.maximum(r, b)) if colour[1] > 0 else (np.minimum(r, b) - g)
    clear = cv2.resize(premul(old)[..., 3], (n, n), interpolation=cv2.INTER_LINEAR) < .85
    cut = clear & (look > .3)
    # a foe with (almost) none of the backdrop's colour in its old frame: none of it is drawn, wherever it lies
    o = premul(old); oc = o[..., :3] / np.maximum(o[..., 3:], 1e-3)
    olook = (oc[..., 1] - np.maximum(oc[..., 0], oc[..., 2])) if colour[1] > 0 else (np.minimum(oc[..., 0], oc[..., 2]) - oc[..., 1])
    if ((olook > .45) & (o[..., 3] > .5)).sum() < .002 * max(1, (o[..., 3] > .5).sum()):
        cut |= look > .45
    if not cut.any():
        return new
    keep = np.clip(1 - (look - .3) / .25, 0, 1)
    alpha = np.where(cut, k[..., 0] * keep, k[..., 0])
    out = new.copy()
    out[..., 3] = alpha
    out[..., :3] = rgb * alpha[..., None]
    return out


def match_colour(new, old):
    """Codex brightens and saturates a little as it sharpens: the redraw's broad colour (Lab, means and spreads of a
    blurred copy, inside the body) is brought back to the old frame's, the fine detail kept."""
    n = new.shape[0]
    o = cv2.resize(premul(old), (n, n), interpolation=cv2.INTER_CUBIC).clip(0, 1)

    def lab(a):
        return cv2.cvtColor((a[..., :3] / np.maximum(a[..., 3:], 1e-3)).clip(0, 1).astype(np.float32), cv2.COLOR_RGB2Lab)
    ln, lo = lab(new), lab(o)
    m = (new[..., 3] > .9) & (o[..., 3] > .9)
    if m.sum() < 500:
        return new
    bn, bo = cv2.GaussianBlur(ln, (0, 0), n / 96), cv2.GaussianBlur(lo, (0, 0), n / 96)
    out = ln.copy()
    for c in range(3):
        gain = np.clip(bo[..., c][m].std() / max(bn[..., c][m].std(), 1e-3), .8, 1.25)
        out[..., c] = (ln[..., c] - bn[..., c][m].mean()) * gain + bo[..., c][m].mean()
    rgb = cv2.cvtColor(out, cv2.COLOR_Lab2RGB).clip(0, 1)
    return np.dstack([rgb * new[..., 3:], new[..., 3:]]).astype(np.float32)


def by_id():
    return {key: (kind, folder) for key, kind, folder in foes()}


def draw_one(fid, kind, folder, ladder=LADDER):
    w = work(folder); w.mkdir(parents=True, exist_ok=True)
    old = old_rest(folder)
    if not (w / "old.png").exists():
        old.save(w / "old.png")
    colour = GREEN if (w / "green").exists() else MAGENTA if (w / "magenta").exists() else backdrop(old)
    if not (w / "ref.png").exists():
        ref, source, ref_iou = reference(folder, old)
        flat = Image.new("RGBA", ref.size, colour[0] + (255,)); flat.alpha_composite(ref)
        flat.convert("RGB").save(w / "ref.png")
        (w / "ref.json").write_text(json.dumps(dict(source=source, iou=round(ref_iou, 3))) + "\n", encoding="utf-8")
    if not list(w.glob("raw-*.png")) or not (w / "prompt.txt").exists():    # the prompt the kept raws were drawn from stays
        (w / "prompt.txt").write_text(prompt(folder, kind, colour) + "\n", encoding="utf-8")
    n = CELL[kind]
    best = None
    for model, effort in ladder:
        raw = w / f"raw-{effort}.png"
        if not raw.exists():
            r = subprocess.run([sys.executable, str(GEN), "--prompt-file", str(w / "prompt.txt"), "--out", str(raw), "--ref", str(w / "ref.png"),
                                "--model", model, "--effort", effort, "--timeout", "900"], capture_output=True, text=True, encoding="utf-8",
                               errors="replace", creationflags=0x08000000)
            if r.returncode or not raw.exists():
                print(fid, effort, "gen failed", r.stderr[-300:].replace("\n", " "), flush=True)
                continue
        new, iou, foot = fitted(key(Image.open(raw), colour[0]), old, n)
        new = pockets(new, old, colour[0])
        new = strays(new, old)
        drift = colour_shift(new, old)
        new = match_colour(new, old)
        score = dict(iou=round(iou, 3), foot=round(foot, 4), effort=effort, drawn_colour=round(drift, 1), colour=round(colour_shift(new, old), 1),
                     sharpness=round(sharpness(shown(to_image(new), SHOWN[kind])), 3))
        print(fid, score, flush=True)
        if best is None or iou > best[0]["iou"]:
            best = (score, new)
        if iou >= MIN_IOU and abs(foot) <= MAX_FOOT:
            break
    if best is None:
        return fid, None
    to_image(best[1]).save(w / "rest.png")
    meta = dict(id=fid, kind=kind, cell=n, backdrop=colour[1], reference={k: v for k, v in json.loads((w / "ref.json").read_text(encoding="utf-8")).items()}, **best[0])
    (w / "meta.json").write_text(json.dumps(meta, indent=1) + "\n", encoding="utf-8")
    return fid, meta


def draw(args):
    workers = int(args[0]) if args and args[0].isdigit() else 4
    ids = [a for a in args if not a.isdigit()]
    table = by_id()
    todo = [k for k in (ids or table) if not (work(table[k][1]) / "meta.json").exists()]
    with ThreadPoolExecutor(workers) as pool:
        for key, meta in pool.map(lambda k: draw_one(k, *table[k]), todo):
            print("DONE" if meta else "FAIL", key, flush=True)


def apply(ids):
    """The redraw becomes the resting frame the rig is fitted and baked on (rig_foes.py make)."""
    table = by_id()
    for k in ids or table:
        kind, folder = table[k]
        w = work(folder)
        if (w / "rest.png").exists():
            Image.open(w / "rest.png").save(folder / "rig/foe/rest.png")
            print("applied", k)


def rig(args):
    """apply, then rig_foes.py make (fit the kept part map on the new frame, bake idle and buff): the silhouette is the
    old one (IoU >= MIN_IOU), so the part map Codex drew for it still fits."""
    workers = int(args[0]) if args and args[0].isdigit() else 4
    table = by_id()
    ids = [a for a in args if not a.isdigit()] or [k for k, (_, f) in table.items() if (work(f) / "meta.json").exists()]

    def one(k):
        kind, folder = table[k]
        meta = json.loads((work(folder) / "meta.json").read_text(encoding="utf-8"))
        if meta["iou"] < MIN_IOU:
            return f"{k}: silhouette moved (IoU {meta['iou']}), part map needs redrawing"
        apply([k])
        r = subprocess.run([sys.executable, str(ROOT / "assets/gemwoven/rig_foes.py"), "make", k], capture_output=True, text=True, cwd=ROOT)
        return f"{k}: " + (r.stdout.strip().splitlines()[0] if not r.returncode else "FAILED " + r.stderr[-300:])

    with ThreadPoolExecutor(workers) as pool:
        for line in pool.map(one, ids):
            print(line, flush=True)


def shift_to(old_frame, old):
    """The small shift (old pixels) that lays the old resting frame on what of it stays still in a fidget frame."""
    a, b = premul(old_frame), premul(old)
    best = (-1, 0., 0.)
    for dy in np.arange(-2, 2.01, .5):
        for dx in np.arange(-2, 2.01, .5):
            m = cv2.warpAffine(b, np.float32([[1, 0, dx], [0, 1, dy]]), b.shape[1::-1], flags=cv2.INTER_LINEAR)
            same = ((np.abs(a - m).max(-1) < .09) & (a[..., 3] > .5)).sum()
            if same > best[0]:
                best = (same, dx, dy)
    return best[1], best[2]


def hd_frame(cell, old, new, raw_cell=None, ends=False):
    """One frame of an approved 256px sheet at the new rest's size, the same picture: what stays still is the redrawn
    rest (laid where the old rest lies in this frame), what moves comes from the frame's raw drawing (443px, laid on
    the frame) where it agrees with the frame, else the frame enlarged. Returns (premultiplied frame, still share)."""
    n = new.shape[0]; k = n / 256
    a = premul(cell)
    up = shown(cell, n)
    out = up
    if raw_cell is not None and (raw_cell[..., 3] > .5).sum() > 500:
        rn, iou, _ = fitted(raw_cell, cell, n)
        if iou >= .9:
            agree = np.abs(cv2.resize(rn, (256, 256), interpolation=cv2.INTER_AREA) - a).max(-1) < .12
            agree = ndimage.binary_erosion(ndimage.binary_opening(agree, iterations=1), iterations=1)
            m = cv2.GaussianBlur(cv2.resize(agree.astype(np.float32), (n, n)), (0, 0), k * 1.2).clip(0, 1)[..., None]
            out = rn * m + up * (1 - m)
    dx, dy = shift_to(cell, old)
    b = cv2.warpAffine(premul(old), np.float32([[1, 0, dx], [0, 1, dy]]), (256, 256), flags=cv2.INTER_LINEAR)
    same = (np.abs(a - b).max(-1) < .09) & (a[..., 3] > .5)
    same = ndimage.binary_opening(same, iterations=1)
    lab, cnt = ndimage.label(same)
    if cnt:
        sizes = ndimage.sum(same, lab, range(1, cnt + 1)); same = np.isin(lab, 1 + np.where(sizes >= 30)[0])
    share = same.sum() / max(1, (a[..., 3] > .5).sum())
    if ends and share > .85:      # a fidget's first and last frames are the resting pose itself
        same = a[..., 3] > .02
    else:
        same = ndimage.binary_erosion(same, iterations=2)
    m = cv2.GaussianBlur(cv2.resize(same.astype(np.float32), (n, n)), (0, 0), k * 1.5).clip(0, 1)[..., None]
    moved = cv2.warpAffine(new, np.float32([[1, 0, dx * k], [0, 1, dy * k]]), (n, n), flags=cv2.INTER_LINEAR)
    return moved * m + out * (1 - m), float(share)


def fidgets(ids):
    """Every fidget sheet (2 x 4, 256px) of a redrawn foe rebuilt at its new rest's size (hd_frame); the old sheet is
    kept in rig/sharp/old-<file>."""
    table = by_id()
    for k in ids or [k for k, (_, f) in table.items() if (work(f) / "meta.json").exists()]:
        kind, folder = table[k]
        w = work(folder)
        book = folder / "fidgets.json"
        sheets = json.loads(book.read_text(encoding="utf-8"))["fidgets"] if book.exists() else []
        if kind == "boss" and (folder / "hurt.webp").exists():       # a boss's recoil loop (2 x 4), drawn like a fidget
            sheets.append(dict(name="hurt", file="hurt.webp"))
        if not (w / "meta.json").exists() or not sheets:      # redrawn and applied (rig/foe/rest.png)
            continue
        new = premul(Image.open(folder / "rig/foe/rest.png")); old = old_rest(folder); n = new.shape[0]
        for f in sheets:
            path = folder / f["file"]; kept = w / f"old-{f['file']}"
            if not kept.exists():
                kept.write_bytes(path.read_bytes())
            cells = frames(kept, 2, 4)
            raw = folder / f"raw-{f['name']}.png"
            raws = [None] * 8
            if raw.exists():
                im = Image.open(raw).convert("RGB"); c = im.width // 2
                if im.height // c == 4:
                    colour = GREEN[0] if (np.asarray(im.crop((0, 0, 8, 8)))[..., 1].mean() > 200) else MAGENTA[0]
                    raws = [key(im.crop(((i % 2) * c, (i // 2) * c, (i % 2 + 1) * c, (i // 2 + 1) * c)), colour) for i in range(8)]
            drawn = w / f"fidget-{f['name']}"
            book2 = json.loads((drawn / "frames.json").read_text(encoding="utf-8")) if (drawn / "frames.json").exists() else {}
            sheet = np.zeros((4 * n, 2 * n, 4), np.float32); shares = []
            for i, (cell, r) in enumerate(zip(cells, raws)):
                fr, share = hd_frame(cell, old, new, r, ends=i in (0, 7) and f["name"] != "hurt")
                if str(i) in book2.get("accepted", {}):     # Codex redrew this frame (draw_fidget)
                    fr = premul(Image.open(drawn / f"frame-{i}.png"))
                sheet[(i // 2) * n:(i // 2 + 1) * n, (i % 2) * n:(i % 2 + 1) * n] = fr; shares.append(round(share, 2))
            to_image(sheet).save(path, quality=86, alpha_quality=90, method=6)
            summary = json.loads((w / "fidgets.json").read_text(encoding="utf-8")) if (w / "fidgets.json").exists() else {}
            summary[f["name"]] = dict(still=shares, redrawn=sorted(int(x) for x in book2.get("accepted", {})))
            (w / "fidgets.json").write_text(json.dumps(summary, indent=1) + "\n", encoding="utf-8")
            print(k, f["file"], "still share", shares, "redrawn", summary[f["name"]]["redrawn"], flush=True)


FIDGET_PROMPT = """Image 1 shows six animation frames of a fantasy game {what} ({desc}) in a 3 by 2 grid (six equal square cells, read left to right, top to bottom), enlarged from small frames and soft. Redraw EXACTLY the same six frames at full resolution on a 1536x1024 landscape canvas in the same 3 by 2 grid of six equal square cells: in every cell the same pose, the same angles of every limb, weapon, wing, tail and loose piece, the same size and the same position inside the cell as Image 1, any drawn effect where it is. The body keeps one size in all six cells. No borders or lines between cells. Nothing crosses a cell edge.
Image 2 is the same character drawn crisply in its resting pose: render the six frames the way Image 2 is rendered (its clean sharp dark outlines, its exact colours, its crisp detail and design). Take only the rendering and the design details from Image 2, never its pose.
Keep everything about the character exactly: identity, face, every part of the costume and every ornament, the weapon, the colours, brightness and saturation, proportions and chibi game style. Do not add or remove anything.
Background 100% solid flat {colour}, the same colour everywhere around and between the parts. No gradients, no text, no labels, no frame, no shadow on the ground, no loose sparkles."""


def cells_of(keyed, cols, rows):
    """A keyed sheet cut into its cells: each drawn piece goes to the cell its centre lies in (premultiplied crops)."""
    H, W = keyed.shape[:2]
    cw, ch = W / cols, H / rows
    lab, count = ndimage.label(keyed[..., 3] > .3, structure=np.ones((3, 3)))
    centres = ndimage.center_of_mass(np.ones((H, W)), lab, range(1, count + 1)) if count else []
    owner = np.array([0] + [min(int(y // ch), rows - 1) * cols + min(int(x // cw), cols - 1) + 1 for y, x in centres])
    near = ndimage.distance_transform_edt(lab == 0, return_distances=False, return_indices=True)
    pieces = owner[lab[tuple(near)]]
    out = []
    for i in range(cols * rows):
        cut = keyed * (pieces == i + 1)[..., None]
        ys, xs = np.where(cut[..., 3] > .02)
        out.append(cut[ys.min():ys.max() + 1, xs.min():xs.max() + 1] if len(ys) else None)
    return out


def draw_fidget(fid, kind, folder, name, ladder=LADDER[:2]):
    """Codex redraws a fidget's frames 2-7 (3 x 2 on one canvas, 512px cells) from the old frames, rendered like the
    redrawn rest; each frame is laid on its old frame with one scale for the sheet. Accepted frames: fidget-<name>/."""
    w = work(folder); d = w / f"fidget-{name}"; d.mkdir(parents=True, exist_ok=True)
    meta = json.loads((w / "meta.json").read_text(encoding="utf-8"))
    colour = GREEN if "green" in meta["backdrop"] else MAGENTA
    kept = w / f"old-{name}.webp"
    olds = frames(kept if kept.exists() else folder / f"{name}.webp", 2, 4)
    if not (d / "ref.png").exists():
        ref = Image.new("RGB", (1536, 1024), colour[0])
        for j, i in enumerate(range(1, 7)):
            c = to_image(shown(olds[i], 512))
            ref.paste(c, ((j % 3) * 512, (j // 3) * 512), c)
        ref.save(d / "ref.png")
        rest = Image.open(folder / "rig/foe/rest.png").convert("RGBA")
        flat = Image.new("RGBA", rest.size, colour[0] + (255,)); flat.alpha_composite(rest)
        flat.convert("RGB").resize((1024, 1024), Image.Resampling.LANCZOS).save(d / "style.png")
    if not list(d.glob("raw-*.png")):
        (d / "prompt.txt").write_text(FIDGET_PROMPT.format(what=WHAT[kind], desc=describe(folder, kind), colour=colour[1]) + "\n", encoding="utf-8")
    n = CELL[kind]
    best = None
    for model, effort in ladder:
        raw = d / f"raw-{effort}.png"
        if not raw.exists():
            r = subprocess.run([sys.executable, str(GEN), "--prompt-file", str(d / "prompt.txt"), "--out", str(raw), "--ref", str(d / "ref.png"),
                                "--ref", str(d / "style.png"), "--model", model, "--effort", effort, "--timeout", "900"], capture_output=True,
                               text=True, encoding="utf-8", errors="replace", creationflags=0x08000000)
            if r.returncode or not raw.exists():
                print(fid, name, effort, "gen failed", r.stderr[-300:].replace("\n", " "), flush=True)
                continue
        cuts = cells_of(key(Image.open(raw), colour[0]), 3, 2)
        fits = [align(c, olds[j + 1]) if c is not None and (c[..., 3] > .5).sum() > 500 else None for j, c in enumerate(cuts)]
        scales = [x[1] for x in fits if x]
        if not scales:
            continue
        s = float(np.median(scales))
        accepted, ious = {}, []
        for j, c in enumerate(cuts):
            i = j + 1
            if c is None or (c[..., 3] > .5).sum() <= 500:
                ious.append(0); continue
            fr, iou, foot = fitted(c, olds[i], n, scale=s)
            fr = match_colour(strays(pockets(fr, olds[i], colour[0]), olds[i]), olds[i])
            ious.append(round(iou, 3))
            if iou >= .82 and abs(foot) <= .02:
                to_image(fr).save(d / f"frame-{i}.png"); accepted[str(i)] = round(iou, 3)
        print(fid, name, effort, "iou", ious, flush=True)
        if best is None or len(accepted) > len(best[1]):
            best = (effort, accepted, ious)
        if len(accepted) == 6:
            break
    if best is None:
        return fid, name, None
    for f in d.glob("frame-*.png"):       # frames of a lower rung that the kept rung did not accept
        if f.stem.split("-")[1] not in best[1]:
            f.unlink()
    (d / "frames.json").write_text(json.dumps(dict(effort=best[0], accepted=best[1], iou=best[2]), indent=1) + "\n", encoding="utf-8")
    return fid, name, best[1]


def drawfidgets(args, below=.6):
    """Codex for the fidgets whose middle frames are mostly the old drawing (a whole-body action: hd_frame keeps
    little of the crisp rest there), from the shares the last `fidgets` run recorded."""
    workers = int(args[0]) if args and args[0].isdigit() else 4
    ids = [a for a in args if not a.isdigit()]
    table = by_id(); todo = []
    for k in ids or table:
        kind, folder = table[k]
        summary = work(folder) / "fidgets.json"
        if not summary.exists():
            continue
        for name, rec in json.loads(summary.read_text(encoding="utf-8")).items():
            if name != "hurt" and np.median(rec["still"][1:7]) < below and not (work(folder) / f"fidget-{name}" / "frames.json").exists():
                todo.append((k, kind, folder, name))
    print(len(todo), "fidget sheets to redraw", flush=True)
    with ThreadPoolExecutor(workers) as pool:
        for fid, name, acc in pool.map(lambda t: draw_fidget(*t), todo):
            print("DONE" if acc is not None else "FAIL", fid, name, len(acc or {}), flush=True)


def strips(ids, name="before-after", per=6, height=340):
    """The old frame as combat shows it beside the redraw as combat will show it, same body height."""
    table = by_id()
    pairs = []
    for k in ids:
        kind, folder = table[k]
        w = work(folder)
        if not (w / "rest.png").exists():
            continue
        old, new = old_rest(folder), Image.open(w / "rest.png").convert("RGBA")
        a, b = tile(old, SHOWN[kind], height, k + " old", sharpness(shown(old, SHOWN[kind]))), tile(new, SHOWN[kind], height, "new", sharpness(shown(new, SHOWN[kind])))
        pair = Image.new("RGB", (a.width + b.width + 12, max(a.height, b.height)), (30, 34, 30))
        pair.paste(a, (0, 0)); pair.paste(b, (a.width + 4, 0))
        pairs.append(pair)
    out = []
    for j in range(0, len(pairs), per):
        part = pairs[j:j + per]
        lines = [part[i:i + 2] for i in range(0, len(part), 2)]
        sheet = Image.new("RGB", (max(sum(p.width for p in l) for l in lines), sum(max(p.height for p in l) for l in lines)), (30, 34, 30))
        y = 0
        for l in lines:
            x = 0
            for p in l:
                sheet.paste(p, (x, y)); x += p.width
            y += max(p.height for p in l)
        path = OUT / f"{name}-{j // per + 1}.png"; sheet.save(path); out.append(path)
    return out


# --- Action sheets (a boss's skill poses, an elite's attack / skill / cast / hurt / defeat) ------------------------------
# Drawn small (bosses 256px cells, elites 480px) and enlarged up to ~3x in combat. Codex redraws each sheet a few frames
# per canvas, cropped to the box the frames use (the cells' empty margin is not sent), at about the size combat shows,
# with the redrawn resting frame shown for its rendering. Each frame is laid on its old silhouette (one scale per canvas,
# soles on the old soles), cleaned like the resting frames, and the sheet keeps its grid, so the frame timing, poses and
# placement stay. The old sheet stays in <foe>/rig/sharp/sheet-<name>/old.webp; SHEETS_BOOK maps each redrawn sheet to
# it, and build.py measures feet, reach and front points on the old drawing (placement stays exactly the approved one).
SHEETS_BOOK = ROOT / "assets/gemwoven/sharp-sheets.json"
CANVASES = ((1774, 887), (1254, 1254), (887, 1774))     # the shapes Codex's image tool draws


def action_jobs(kinds=("boss", "elite")):
    """[(job name, dict)] for every drawn action sheet of a foe (not its rig loops), from Game.html's ART."""
    html = (ROOT / "Game.html").read_text(encoding="utf-8")
    art, _ = json.JSONDecoder().raw_decode(html[html.index("const ART=") + len("const ART="):])
    table = by_id(); out = {}
    for fam in ("bosses", "worldBosses", "campaignCreatures"):
        for fid, entry in art.get(fam, {}).items():
            if fid not in table or table[fid][0] not in kinds or not isinstance(entry, dict):
                continue
            kind, folder = table[fid]
            for name, s in entry.items():
                if not isinstance(s, dict) or "src" not in s or s["src"].startswith("data:") or "/rig/" in s["src"]:
                    continue
                path = ROOT / s["src"]
                if not path.exists():
                    continue
                cols, rows = s["cols"], s["rows"]
                rel = path.relative_to(ROOT).as_posix()
                sheet_name = path.stem if path.parent == folder else f"{rel.split('/')[-3]}-{path.stem}"
                kept = work(folder) / f"sheet-{sheet_name}" / "old.webp"     # a sheet redrawn already: its old cell
                with Image.open(kept if kept.exists() else path) as im:
                    cell = im.width // cols
                shown_px = SHOWN[kind] * (s.get("scale") or 1)
                n = int(min(4096 // cols, 4096 // rows, max(cell, -(-shown_px // 16) * 16)))
                job = out.setdefault(rel, dict(fid=fid, kind=kind, folder=folder, path=path, rel=rel, cols=cols, rows=rows,
                                              count=s.get("count") or cols * rows, cell=cell, n=n, uses=[], name=sheet_name))
                job["uses"].append(name)
                job["n"] = max(job["n"], n)
    return {k: j for k, j in out.items() if j["n"] > j["cell"] * 1.15}     # drawn at about its shown size already


def sheet_work(job):
    return work(job["folder"]) / f"sheet-{job['name']}"


def content_box(cells):
    """The box (old cell px) every frame's drawing lies in, padded a little and kept inside the cell."""
    box = None
    for c in cells:
        a = np.asarray(c)[..., 3] > 24
        ys, xs = np.where(a)
        if not len(ys):
            continue
        b = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
        box = b if box is None else (min(box[0], b[0]), min(box[1], b[1]), max(box[2], b[2]), max(box[3], b[3]))
    w = cells[0].width
    if box is None:
        return (0, 0, w, w)
    pad = round(w * .03)
    return (max(0, box[0] - pad), max(0, box[1] - pad), min(w, box[2] + pad), min(w, box[3] + pad))


def layout(job, box):
    """(canvas, rows, cols): the fewest Codex calls that still draw each frame at ~the size combat shows it."""
    bw, bh = box[2] - box[0], box[3] - box[1]
    need = job["n"] / job["cell"] * .9            # drawn px per old px
    best = None
    for k in (6, 4, 3, 2, 1):
        if job["count"] % k:
            continue
        for (W, H) in CANVASES:
            for r in range(1, k + 1):
                if k % r:
                    continue
                c = k // r
                res = min(W / c / bw, H / r / bh)
                calls = job["count"] // k
                key_ = (res >= need, -calls if res >= need else res, res)
                if best is None or key_ > best[0]:
                    best = (key_, (W, H), r, c, res)
    return best[1], best[2], best[3], best[4]


ACTION_PROMPT = """Image 1 shows {k} animation frame{s} of a fantasy game {what} ({desc}) in a {r} by {c} grid of equal cells (read left to right, top to bottom), enlarged from small frames and soft. Redraw EXACTLY the same frame{s} at full resolution on the same canvas in the same grid: in every cell the same pose, the same angles of every limb, weapon, wing, tail and loose piece, the same size and the same position inside the cell as Image 1, and any drawn effect (a glow, a slash, sparks, a spell in the hand) where it is, the same size, shape and colour. The body keeps one size in every cell. No borders or lines between cells. Nothing crosses a cell edge.
Image 2 is the same character drawn crisply in its resting pose: render the frames the way Image 2 is rendered (its clean sharp dark outlines, its exact colours, its crisp detail and design). Take only the rendering and the design details from Image 2, never its pose.
Keep everything about the character exactly: identity, face, every part of the body, armour or costume and every ornament, the weapon, the colours, brightness and saturation, proportions and chibi game style. Do not add or remove anything, and add no new effects.
Background 100% solid flat {colour}, the same colour everywhere around and between the parts. No gradients, no text, no labels, no frame, no shadow on the ground, no loose sparkles."""


def draw_sheet(job, ladder=LADDER[:2]):
    """Codex for one action sheet; writes sheet-<name>/frame-<i>.png for the frames it accepts and frames.json."""
    d = sheet_work(job); d.mkdir(parents=True, exist_ok=True)
    meta = json.loads((work(job["folder"]) / "meta.json").read_text(encoding="utf-8"))
    colour = GREEN if "green" in meta["backdrop"] else MAGENTA
    if not (d / "old.webp").exists():
        (d / "old.webp").write_bytes(job["path"].read_bytes())
    olds = frames(d / "old.webp", job["cols"], job["rows"], job["count"])
    box = content_box(olds)
    (W, H), r, c, res = layout(job, box)
    k = r * c
    bw, bh = box[2] - box[0], box[3] - box[1]
    groups = [list(range(g, g + k)) for g in range(0, job["count"], k)]
    rest = Image.open(job["folder"] / "rig/foe/rest.png").convert("RGBA")
    if not (d / "style.png").exists():
        flat = Image.new("RGBA", rest.size, colour[0] + (255,)); flat.alpha_composite(rest)
        flat.convert("RGB").resize((1024, 1024), Image.Resampling.LANCZOS).save(d / "style.png")
    sw, sh = round(bw * res), round(bh * res)
    for g, idx in enumerate(groups):
        ref = d / f"ref-{g}.png"
        if not ref.exists():
            canvas = Image.new("RGB", (W, H), colour[0])
            for j, i in enumerate(idx):
                a = premul(olds[i].crop(box))
                big = cv2.resize(a, (sw, sh), interpolation=cv2.INTER_CUBIC).clip(0, 1)
                im = to_image(big)
                x0 = (j % c) * (W // c) + (W // c - sw) // 2; y0 = (j // c) * (H // r) + (H // r - sh) // 2
                canvas.paste(im, (x0, y0), im)
            canvas.save(ref)
    prompt_file = d / "prompt.txt"
    if not prompt_file.exists():
        prompt_file.write_text(ACTION_PROMPT.format(k=k, s="s" if k > 1 else "", r=r, c=c, what=WHAT[job["kind"]],
                                                    desc=describe(job["folder"], job["kind"]), colour=colour[1]) + "\n", encoding="utf-8")
    book = json.loads((d / "frames.json").read_text(encoding="utf-8")) if (d / "frames.json").exists() else {}
    accepted = book.get("accepted", {})
    n = job["n"]
    for g, idx in enumerate(groups):
        for model, effort in ladder:
            if all(str(i) in accepted for i in idx if (np.asarray(olds[i])[..., 3] > 128).sum() > 200):
                break
            raw = d / f"raw-{g}-{effort}.png"
            if not raw.exists():
                rr = subprocess.run([sys.executable, str(GEN), "--prompt-file", str(prompt_file), "--out", str(raw), "--ref", str(d / f"ref-{g}.png"),
                                     "--ref", str(d / "style.png"), "--model", model, "--effort", effort, "--timeout", "900"], capture_output=True,
                                    text=True, encoding="utf-8", errors="replace", creationflags=0x08000000)
                if rr.returncode or not raw.exists():
                    print(job["rel"], g, effort, "gen failed", rr.stderr[-200:].replace("\n", " "), flush=True)
                    continue
            cuts = cells_of(key(Image.open(raw), colour[0]), c, r)
            fits = [align(cu, olds[i]) if cu is not None and (cu[..., 3] > .5).sum() > 300 else None for i, cu in zip(idx, cuts)]
            scales = [f[1] for f in fits if f and f[0] > .6]
            if not scales:
                continue
            s = float(np.median(scales))
            for i, cu in zip(idx, cuts):
                if cu is None or (cu[..., 3] > .5).sum() <= 300 or (np.asarray(olds[i])[..., 3] > 128).sum() <= 200:
                    continue
                fr, iou, foot = fitted(cu, olds[i], n, scale=s)
                # a slash or a cast glow is faint in the old frame: it counts as drawing there
                fr = match_colour(strays(pockets(fr, olds[i], colour[0]), olds[i], faint=.04), olds[i])
                prev = accepted.get(str(i))
                if iou >= .8 and abs(foot) <= .02 and (prev is None or iou > prev["iou"]):
                    to_image(fr).save(d / f"frame-{i}.png"); accepted[str(i)] = dict(iou=round(iou, 3), effort=effort)
            print(job["rel"], g, effort, {i: accepted.get(str(i), {}).get("iou") for i in idx}, flush=True)
    book = dict(cols=job["cols"], rows=job["rows"], count=job["count"], cell=job["cell"], n=n, box=list(map(int, box)),
                canvas=[W, H], grid=[r, c], accepted=accepted, uses=job["uses"])
    (d / "frames.json").write_text(json.dumps(book, indent=1) + "\n", encoding="utf-8")
    return job["rel"], len(accepted), job["count"]


def assemble_sheet(job):
    """The sheet at its new cell: each accepted redraw, the rest of the frames enlarged from the old ones."""
    d = sheet_work(job)
    book = json.loads((d / "frames.json").read_text(encoding="utf-8"))
    olds = frames(d / "old.webp", job["cols"], job["rows"], job["count"])
    n = book["n"]
    sheet = np.zeros((job["rows"] * n, job["cols"] * n, 4), np.float32)
    def twin(i):
        """An accepted frame whose old drawing is (almost) this one's: a return to the ready pose repeats frame 1."""
        a = premul(olds[i])
        for k in sorted(book["accepted"], key=int):
            b = premul(olds[int(k)])
            ma, mb = a[..., 3] > .5, b[..., 3] > .5
            if (ma & mb).sum() / max(1, (ma | mb).sum()) > .95 and np.abs(a - b).max(-1)[ma | mb].mean() < .06:
                return premul(Image.open(d / f"frame-{k}.png"))
        return None
    for i, old in enumerate(olds):
        fr = premul(Image.open(d / f"frame-{i}.png")) if str(i) in book["accepted"] else twin(i)
        fr = shown(old, n) if fr is None else fr
        sheet[(i // job["cols"]) * n:(i // job["cols"] + 1) * n, (i % job["cols"]) * n:(i % job["cols"] + 1) * n] = fr
    to_image(sheet).save(job["path"], quality=86, alpha_quality=90, method=6)
    reg = json.loads(SHEETS_BOOK.read_text(encoding="utf-8")) if SHEETS_BOOK.exists() else {}
    reg[job["rel"]] = (d / "old.webp").relative_to(ROOT).as_posix()
    SHEETS_BOOK.write_text(json.dumps(dict(sorted(reg.items())), indent=1) + "\n", encoding="utf-8")
    return len(book["accepted"]), job["count"]


def pick(jobs, args):
    """Jobs named by foe id, chapter prefix (e.g. forest), kind (boss / elite) or sheet path."""
    if not args:
        return list(jobs.values())
    out = []
    for j in jobs.values():
        if any(a in (j["fid"], j["kind"], j["rel"]) or j["fid"].startswith(a + "-") for a in args):
            out.append(j)
    return out


def drawactions(args):
    workers = int(args[0]) if args and args[0].isdigit() else 4
    todo = [j for j in pick(action_jobs(), [a for a in args if not a.isdigit()]) if not (sheet_work(j) / "frames.json").exists()]
    print(len(todo), "action sheets to draw", flush=True)
    with ThreadPoolExecutor(workers) as pool:
        for rel, got, count in pool.map(draw_sheet, todo):
            print("DONE", rel, f"{got}/{count}", flush=True)


def applyactions(args):
    for j in pick(action_jobs(), args):
        if (sheet_work(j) / "frames.json").exists():
            got, count = assemble_sheet(j)
            print("applied", j["rel"], f"{got}/{count}", j["n"], flush=True)


def actionview(out, jobs, S=230):
    """Old frames (top row) over the new ones (bottom row), each sheet two rows, for review."""
    rows = []
    for j in jobs:
        d = sheet_work(j)
        olds = frames(d / "old.webp", j["cols"], j["rows"], j["count"])
        news = frames(j["path"], j["cols"], j["rows"], j["count"])
        strip = Image.new("RGB", (S * len(olds), S * 2 + 18), (50, 62, 50))
        for i, (o, nw) in enumerate(zip(olds, news)):
            o = o.resize((S, S), Image.Resampling.BILINEAR); nw = nw.resize((S, S), Image.Resampling.LANCZOS)
            strip.paste(o, (i * S, 18), o); strip.paste(nw, (i * S, 18 + S), nw)
        ImageDraw.Draw(strip).text((4, 2), f"{j['fid']} {j['name']}", fill=(255, 255, 255))
        rows.append(strip)
    W = max(r.width for r in rows); sheet = Image.new("RGB", (W, sum(r.height for r in rows)), (30, 34, 30))
    y = 0
    for r in rows:
        sheet.paste(r, (0, y)); y += r.height
    sheet.save(out)



if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "audit":
        audit()
    elif cmd == "draw":
        draw(sys.argv[2:])
    elif cmd == "apply":
        apply(sys.argv[2:])
    elif cmd == "rig":
        rig(sys.argv[2:])
    elif cmd == "fidgets":
        fidgets(sys.argv[2:])
    elif cmd == "drawfidgets":
        drawfidgets(sys.argv[2:])
    elif cmd == "actions":
        drawactions(sys.argv[2:])
    elif cmd == "applyactions":
        applyactions(sys.argv[2:])
    elif cmd == "sheets":
        print("\n".join(map(str, strips(sys.argv[2:] or sorted(by_id())))))
